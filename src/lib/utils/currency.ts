export function formatPrice(amount: number | null | undefined, currency: string = "USD"): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}
