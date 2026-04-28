const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "CA$",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
};

export function formatPrice(amount: number | null | undefined, currency: string = "USD"): string {
  const value = Number.isFinite(amount as number) ? (amount as number) : 0;
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const [whole, decimal = "00"] = abs.toFixed(2).split(".");
  const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${symbol}${wholeWithCommas}.${decimal.padEnd(2, "0").slice(0, 2)}`;
}
