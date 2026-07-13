import { prisma } from "@/lib/prisma";
import { formatAddress } from "@/lib/utils/address";
import { getCardBrandImage, getCardStatus, getCardStatusText } from "@/lib/utils/payment";
import type { AccountSummary, Payment, UserAccount } from "@/lib/types/user";

type RawUser = NonNullable<Awaited<ReturnType<typeof fetchUserWithRelations>>>;
type RawCard = RawUser["user_stripe_sources"][number];
type RawBank = RawUser["user_bank_accounts"][number];

export async function getAccountSummary(userId: number): Promise<AccountSummary | null> {
  const user = await fetchUserWithRelations(userId);
  if (!user) return null;

  const [address] = user.user_addresses;
  const [card] = user.user_stripe_sources;
  const [bank] = user.user_bank_accounts;

  return {
    user: toUserAccount(user),
    addressCount: user._count.user_addresses,
    address: address
      ? { formatted: formatAddress(address), isDefault: address.is_default }
      : null,
    cardCount: user._count.user_stripe_sources,
    card: toCardPayment(card),
    bankCount: user._count.user_bank_accounts,
    bank: toBankPayment(bank),
    subscriptionCount: user._count.subscriptions_subscriptions_user_idTousers,
  };
}

function fetchUserWithRelations(userId: number) {
  return prisma.users.findFirst({
    where: { id: userId },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      phone: true,
      _count: {
        select: {
          user_addresses: { where: { deleted_at: null } },
          user_stripe_sources: { where: { deleted_at: null } },
          user_bank_accounts: { where: { deleted_at: null } },
          subscriptions_subscriptions_user_idTousers: { where: { deleted_at: null } },
        },
      },
      user_addresses: {
        where: { deleted_at: null },
        orderBy: [{ is_default: "desc" }, { id: "asc" }],
        take: 1,
        select: {
          is_default: true,
          street: true,
          apartment: true,
          city: true,
          zip: true,
          states: { select: { abbr: true } },
        },
      },
      user_stripe_sources: {
        where: { deleted_at: null },
        orderBy: [{ is_default: "desc" }, { id: "asc" }],
        take: 1,
        select: {
          is_default: true,
          brand: true,
          last4: true,
          has_failed: true,
          exp_month: true,
          exp_year: true,
        },
      },
      user_bank_accounts: {
        where: { deleted_at: null },
        orderBy: [{ is_default: "desc" }, { id: "asc" }],
        take: 1,
        select: { is_default: true, bank_name: true, last4: true },
      },
    },
  });
}

function toUserAccount(u: RawUser): UserAccount {
  const firstname = u.firstname;
  const lastname = u.lastname ?? "";
  const fullName = `${firstname} ${lastname}`.trim();
  const initials = `${firstname[0] ?? ""}${lastname[0] ?? ""}`.toUpperCase();
  return {
    id: Number(u.id),
    firstname,
    lastname,
    email: u.email ?? "",
    phone: u.phone ?? "",
    initials,
    fullName,
  };
}

function toCardPayment(card: RawCard | undefined): Payment {
  if (!card) return { payment: null, isDefault: false };
  const status = getCardStatus(card);
  return {
    isDefault: card.is_default,
    payment: {
      type: "card",
      brand: card.brand,
      brandImage: getCardBrandImage(card.brand),
      last4: card.last4,
      statusText: getCardStatusText(status),
      isFailed: status === "FAILED" || status === "EXPIRED",
      isExpiringSoon: status === "EXPIRING_SOON",
    },
  };
}

function toBankPayment(bank: RawBank | undefined): Payment {
  if (!bank) return { payment: null, isDefault: false };
  return {
    isDefault: bank.is_default,
    payment: {
      type: "bank",
      bankName: bank.bank_name ?? "",
      last4: bank.last4 ?? "",
    },
  };
}
