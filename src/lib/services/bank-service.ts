import "server-only";
import { prisma } from "@/lib/prisma";
import {
  attachAchPaymentMethod,
  createBareCustomer,
  createFinancialConnectionsSession,
} from "./stripe/stripe-ach";
import type { BankInput, BankPaymentMethod, BankStatus } from "@/lib/types/bank";

export async function listUserBanks(userId: number): Promise<BankPaymentMethod[]> {
  const banks = await prisma.user_bank_accounts.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { id: "asc" },
    select: bankSelect,
  });

  return banks.map(toBankPaymentMethod);
}

export async function setDefaultUserBank(bankId: number, userId: number): Promise<void> {
  const owned = await prisma.user_bank_accounts.findFirst({
    where: { id: bankId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!owned) throw new Error("Bank account not found");

  await prisma.user_bank_accounts.updateMany({
    where: { user_id: userId, is_default: true },
    data: { is_default: false },
  });
  await prisma.user_bank_accounts.update({
    where: { id: bankId },
    data: { is_default: true },
  });
}

export async function createUserBank(
  userId: number,
  input: BankInput,
): Promise<BankPaymentMethod> {
  const customerId = await ensureStripeCustomer(userId);

  await attachAchPaymentMethod(input.paymentMethodId, customerId);

  const existingDefault = await prisma.user_bank_accounts.findFirst({
    where: { user_id: userId, is_default: true, deleted_at: null },
    select: { id: true },
  });
  const shouldBeDefault = input.isDefault || !existingDefault;

  if (shouldBeDefault && existingDefault) {
    await prisma.user_bank_accounts.updateMany({
      where: { user_id: userId, is_default: true },
      data: { is_default: false },
    });
  }

  const created = await prisma.user_bank_accounts.create({
    data: {
      user_id: userId,
      stripe_payment_method_id: input.paymentMethodId,
      bank_name: input.bankName,
      last4: input.last4,
      account_holder_type: input.accountHolderType,
      is_default: shouldBeDefault,
    },
    select: bankSelect,
  });

  return toBankPaymentMethod(created);
}

export async function replaceBankWithExistingBank(
  oldBankId: number,
  newBankId: number,
  userId: number,
): Promise<void> {
  if (oldBankId === newBankId) throw new Error("Cannot replace a bank with itself");

  const [oldBank, newBank] = await Promise.all([
    prisma.user_bank_accounts.findFirst({
      where: { id: oldBankId, user_id: userId, deleted_at: null },
      select: { id: true },
    }),
    prisma.user_bank_accounts.findFirst({
      where: { id: newBankId, user_id: userId, deleted_at: null },
      select: { id: true },
    }),
  ]);
  if (!oldBank) throw new Error("Original bank account not found");
  if (!newBank) throw new Error("Replacement bank account not found");

  await prisma.subscription_items.updateMany({
    where: { user_bank_account_id: oldBankId },
    data: { user_bank_account_id: newBankId, user_stripe_source_id: null },
  });
}

export async function replaceBankWithExistingCard(
  oldBankId: number,
  newCardId: number,
  userId: number,
): Promise<void> {
  const [oldBank, newCard] = await Promise.all([
    prisma.user_bank_accounts.findFirst({
      where: { id: oldBankId, user_id: userId, deleted_at: null },
      select: { id: true },
    }),
    prisma.user_stripe_sources.findFirst({
      where: { id: newCardId, user_id: userId, deleted_at: null },
      select: { id: true },
    }),
  ]);
  if (!oldBank) throw new Error("Original bank account not found");
  if (!newCard) throw new Error("Replacement card not found");

  await prisma.subscription_items.updateMany({
    where: { user_bank_account_id: oldBankId },
    data: { user_bank_account_id: null, user_stripe_source_id: newCardId },
  });
}

export async function replaceBankWithNewBank(
  oldBankId: number,
  userId: number,
  input: BankInput,
): Promise<BankPaymentMethod> {
  const oldBank = await prisma.user_bank_accounts.findFirst({
    where: { id: oldBankId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!oldBank) throw new Error("Original bank account not found");

  const newBank = await createUserBank(userId, input);

  await prisma.subscription_items.updateMany({
    where: { user_bank_account_id: oldBankId },
    data: { user_bank_account_id: newBank.id, user_stripe_source_id: null },
  });

  return newBank;
}

export async function removeBankFromLoyalty(bankId: number, userId: number): Promise<void> {
  const bank = await prisma.user_bank_accounts.findFirst({
    where: { id: bankId, user_id: userId, deleted_at: null },
    select: { id: true, is_default: true },
  });
  if (!bank) throw new Error("Bank account not found");
  if (bank.is_default) throw new Error("Cannot remove default bank account");

  const items = await prisma.subscription_items.findMany({
    where: { user_bank_account_id: bankId },
    select: { subscription_id: true },
  });
  const subscriptionIds = Array.from(
    new Set(
      items
        .map((i) => i.subscription_id)
        .filter((id): id is bigint => id !== null),
    ),
  );

  if (subscriptionIds.length > 0) {
    await prisma.subscriptions.updateMany({
      where: { id: { in: subscriptionIds } },
      data: { is_loyalty_enabled: false },
    });
  }

  await prisma.subscription_items.updateMany({
    where: { user_bank_account_id: bankId },
    data: { user_bank_account_id: null },
  });

  await prisma.user_bank_accounts.update({
    where: { id: bankId },
    data: { deleted_at: new Date() },
  });
}

export async function deleteUserBank(bankId: number, userId: number): Promise<void> {
  const owned = await prisma.user_bank_accounts.findFirst({
    where: { id: bankId, user_id: userId, deleted_at: null },
    select: { id: true, is_default: true },
  });
  if (!owned) throw new Error("Bank account not found");
  if (owned.is_default) throw new Error("Cannot remove default bank account");

  await prisma.user_bank_accounts.update({
    where: { id: bankId },
    data: { deleted_at: new Date() },
  });
}

export async function isUserAchEligible(userId: number): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      countries: { select: { code: true } },
    },
  });
  if (user?.countries?.code === "US") return true;

  const usAddress = await prisma.user_addresses.findFirst({
    where: {
      user_id: userId,
      deleted_at: null,
      countries: { code: "US" },
    },
    select: { id: true },
  });
  return usAddress !== null;
}

export async function ensureStripeCustomer(userId: number): Promise<string> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      firstname: true,
      lastname: true,
      email: true,
      stripe_customer_id: true,
    },
  });
  if (!user) throw new Error("User not found");
  if (user.stripe_customer_id) return user.stripe_customer_id;
  if (!user.email) throw new Error("User email is required to create a Stripe customer");

  const customer = await createBareCustomer({
    name: `${user.firstname} ${user.lastname ?? ""}`.trim(),
    email: user.email,
  });
  await prisma.users.update({
    where: { id: userId },
    data: { stripe_customer_id: customer.id },
  });
  return customer.id;
}

export async function getAchSessionContextForUser(
  userId: number,
): Promise<{ clientSecret: string; name: string; email: string }> {
  const customerId = await ensureStripeCustomer(userId);
  const session = await createFinancialConnectionsSession(customerId);
  if (!session.client_secret) {
    throw new Error("Stripe did not return a client secret for the Financial Connections session");
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { firstname: true, lastname: true, email: true },
  });
  if (!user) throw new Error("User not found");

  return {
    clientSecret: session.client_secret,
    name: `${user.firstname} ${user.lastname ?? ""}`.trim(),
    email: user.email ?? "",
  };
}

function toBankPaymentMethod(bank: BankRow): BankPaymentMethod {
  return {
    id: Number(bank.id),
    bankName: bank.bank_name,
    last4: bank.last4,
    accountHolderType: bank.account_holder_type,
    hasFailed: bank.has_failed,
    isDefault: bank.is_default,
    status: getBankStatus(bank.has_failed),
    activeSubscriptions: bank._count.subscription_items,
  };
}

function getBankStatus(hasFailed: boolean): BankStatus {
  return hasFailed ? "FAILED" : "GOOD";
}

const bankSelect = {
  id: true,
  bank_name: true,
  last4: true,
  account_holder_type: true,
  has_failed: true,
  is_default: true,
  _count: {
    select: {
      subscription_items: { where: { deleted_at: null } },
    },
  },
} as const;

type BankRow = NonNullable<
  Awaited<ReturnType<typeof prisma.user_bank_accounts.findFirst<{ select: typeof bankSelect }>>>
>;

