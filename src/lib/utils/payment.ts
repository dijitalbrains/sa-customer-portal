export type CardStatus = "GOOD" | "EXPIRED" | "EXPIRING_SOON" | "FAILED";

export function getCardStatus(card: {
  has_failed: boolean;
  exp_month: string;
  exp_year: string;
}): CardStatus {
  if (card.has_failed) return "FAILED";

  const expMonth = Number(card.exp_month);
  const expYear = Number(card.exp_year);
  if (!expMonth || !expYear) return "GOOD";

  const expDate = new Date(expYear, expMonth, 0);
  const now = new Date();

  if (expDate < now) return "EXPIRED";

  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  if (expDate < twoMonthsFromNow) return "EXPIRING_SOON";

  return "GOOD";
}

export function getCardStatusText(status: CardStatus): string {
  switch (status) {
    case "GOOD":
      return "in good standing";
    case "EXPIRED":
      return "expired";
    case "FAILED":
      return "failed";
    case "EXPIRING_SOON":
      return "expiring soon";
  }
}

export function getCardBrandImage(brand: string): string {
  const slug = brand.toLowerCase().replace(/\s+/g, "-");
  return `/assets/images/cc-brand/${slug}.png`;
}
