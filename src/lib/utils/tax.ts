export type TaxSource = "TAXJAR" | "CUSTOM" | "FEDEX";

export function calcTax(taxPercent: number, subtotal: number): number {
  return Math.round((taxPercent * subtotal) / 100 * 100) / 100;
}

export function isUSAddress(countryCode: string | null | undefined): boolean {
  return countryCode === "US";
}
