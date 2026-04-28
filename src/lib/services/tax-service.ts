import { calcTax, isUSAddress, type TaxSource } from "@/lib/utils/tax";
import { getTaxJarPercent } from "@/lib/services/taxjar-service";

export interface TaxAddressCountry {
  code: string;
  tax_source: TaxSource | null;
  tax_percent: number | null;
}

export interface TaxAddress {
  zip: string;
  city: string;
  street: string;
  countries: TaxAddressCountry | null;
}

export interface TaxBreakdown {
  taxPercent: number;
  tax: number;
  estimatedTax: number;
  taxExempted: number | null;
  source: TaxSource | null;
}

export interface CalculateTaxInput {
  subtotal: number;
  address: TaxAddress | null;
  isUserTaxExempted: boolean;
}

const EMPTY: TaxBreakdown = {
  taxPercent: 0,
  tax: 0,
  estimatedTax: 0,
  taxExempted: null,
  source: null,
};

/**
 * High-level facade: fetches the tax percent for an address (TaxJar/CUSTOM/FEDEX)
 * and applies it against a subtotal, accounting for user tax exemption and
 * non-US "estimated tax" handling.
 */
export async function calculateTax({
  subtotal,
  address,
  isUserTaxExempted,
}: CalculateTaxInput): Promise<TaxBreakdown> {
  const { taxPercent, source } = await getTaxPercentForAddress(address);
  return computeTax({
    subtotal,
    taxPercent,
    source,
    countryCode: address?.countries?.code ?? null,
    isUserTaxExempted,
  });
}

/** Resolves the tax percent for an address based on its country's tax source. */
export async function getTaxPercentForAddress(address: TaxAddress | null): Promise<{
  taxPercent: number;
  source: TaxSource | null;
}> {
  const country = address?.countries;
  if (!country) return { taxPercent: 0, source: null };

  const source = country.tax_source ?? null;

  switch (source) {
    case "FEDEX":
      return { taxPercent: 0, source };
    case "CUSTOM":
      return { taxPercent: country.tax_percent ?? 0, source };
    case "TAXJAR":
      return {
        taxPercent: address ? await fetchTaxJarPercent(address, country.code) : 0,
        source,
      };
    default:
      return { taxPercent: 0, source };
  }
}

interface ComputeTaxInput {
  subtotal: number;
  taxPercent: number;
  source: TaxSource | null;
  countryCode: string | null;
  isUserTaxExempted: boolean;
}

/**
 * Pure tax math. Decides between charged tax, exempted tax (strikethrough),
 * and estimated tax (non-US display only) based on country and user state.
 */
export function computeTax({
  subtotal,
  taxPercent,
  source,
  countryCode,
  isUserTaxExempted,
}: ComputeTaxInput): TaxBreakdown {
  if (source === null) return EMPTY;
  if (source === "FEDEX") return { ...EMPTY, source };

  const calculated = calcTax(taxPercent, subtotal);

  if (isUserTaxExempted) {
    return { taxPercent, tax: 0, estimatedTax: 0, taxExempted: calculated, source };
  }
  if (isUSAddress(countryCode)) {
    return { taxPercent, tax: calculated, estimatedTax: 0, taxExempted: null, source };
  }
  return { taxPercent, tax: 0, estimatedTax: calculated, taxExempted: null, source };
}

function fetchTaxJarPercent(address: TaxAddress, countryCode: string): Promise<number> {
  return getTaxJarPercent({
    zip: address.zip,
    city: address.city,
    street: address.street,
    country: countryCode,
  });
}
