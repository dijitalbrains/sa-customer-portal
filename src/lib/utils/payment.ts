import type { PaymentMethod } from "@/lib/types/payment";
import type { CardStatus } from "@/lib/types/card";

interface PaymentSource {
  user_bank_accounts: { bank_name: string | null; last4: string | null } | null;
  user_stripe_sources: {
    brand: string;
    last4: string;
    has_failed: boolean;
    exp_month: string;
    exp_year: string;
  } | null;
}

export function getPaymentMethod(item: PaymentSource): PaymentMethod {
  if (item.user_bank_accounts) {
    return {
      type: "bank",
      bankName: item.user_bank_accounts.bank_name ?? "",
      last4: item.user_bank_accounts.last4 ?? "",
    };
  }

  if (!item.user_stripe_sources) return null;

  const card = item.user_stripe_sources;
  const status = getCardStatus(card);

  return {
    type: "card",
    brandImage: getCardBrandImage(card.brand),
    last4: card.last4,
    statusText: getCardStatusText(status),
    isFailed: status === "FAILED" || status === "EXPIRED",
    isExpiringSoon: status === "EXPIRING_SOON",
  };
}

export function getCardStatus(card: {
  has_failed: boolean;
  exp_month: string;
  exp_year: string;
}): CardStatus {
  if (card.has_failed) return "FAILED";

  const month = Number(card.exp_month);
  const year = Number(card.exp_year);
  if (!month || !year) return "GOOD";

  const expPlusOneMonth = new Date(year, month, 1);
  const now = new Date();
  const nowPlusOneMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  if (now > expPlusOneMonth) return "EXPIRED";
  if (expPlusOneMonth <= nowPlusOneMonth) return "EXPIRING_SOON";
  return "GOOD";
}

export function getCardStatusText(status: CardStatus): string {
  const map: Record<CardStatus, string> = {
    GOOD: "in good standing",
    EXPIRED: "expired",
    FAILED: "failed",
    EXPIRING_SOON: "expiring soon",
  };
  return map[status];
}

export function getCardBrandImage(brand: string): string {
  return `/assets/images/cc-brand/${brand.toLowerCase().replace(/\s+/g, "-")}.png`;
}

interface OrderPaymentJson {
  user_stripe_source: unknown;
  user_bank_account: unknown;
}

interface StripeJson { brand?: string; last4?: string }
interface BankJson { bank_name?: string; last4?: string }

export function getOrderPayment(order: OrderPaymentJson): PaymentMethod {
  const stripe = order.user_stripe_source as StripeJson | null;
  const bank = order.user_bank_account as BankJson | null;

  if (stripe?.brand) {
    return {
      type: "card",
      brandImage: getCardBrandImage(stripe.brand),
      last4: stripe.last4 ?? "",
      statusText: "in good standing",
      isFailed: false,
      isExpiringSoon: false,
    };
  }
  if (bank?.bank_name) {
    return {
      type: "bank",
      bankName: bank.bank_name,
      last4: bank.last4 ?? "",
    };
  }
  return null;
}
