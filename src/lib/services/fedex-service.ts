import "server-only";
import * as cache from "@/lib/cache/file-cache";
import { hashObject } from "@/lib/utils/hash";
import type { ShipmentPackage } from "@/lib/services/product-service";

const CACHE_TTL_MS = 30 * 60 * 1000;

export interface FedexAddress {
  street: string;
  zip: string;
  countries: {
    code: string;
    hts_code: string | null;
    currencies: { code: string };
  } | null;
}

export interface FedexShippingResult {
  shippingPrice: number;
  estimatedTax: number;
}

export async function getRates(
  amount: number,
  address: FedexAddress,
  packages: ShipmentPackage[],
): Promise<FedexShippingResult> {
  if (!address.countries) {
    throw new Error("Country is required to calculate FedEx shipping");
  }

  console.info("[fedex] buildPackages", {
    amount,address,packages
  });
  const country = address.countries;

  const postData = {
    amount,
    currency: country.currencies.code,
    preferred_currency: getPreferredCurrency(country.code, country.currencies.code),
    hts_code: country.hts_code,
    packaging_type: "YOUR_PACKAGING",
    recipient_address: {
      country_code: country.code,
      street: [address.street],
      zip: address.zip,
    },
    product_packages: packages,
  };

  // const cacheKey = `fedex_rates_${hashObject(postData)}`;
  // const cached = await cache.get<FedexShippingResult>(cacheKey);
  // if (cached) return cached;

  const baseUrl = process.env.REST_API_URL ?? "";
  const apiKey = process.env.REST_API_KEY ?? "";

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/get-shipping-price`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(postData),
      cache: "no-store",
    },
  );

  const data = (await response.json()) as {
    shipping_price?: number;
    estimated_duties_and_tax?: number;
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Something went wrong. Please contact support.");
  }

  if (data.error) {
    throw new Error(data.message ?? "Shipping price not found. Please contact support.");
  }

  const result: FedexShippingResult = {
    shippingPrice: Number(data.shipping_price ?? 0),
    estimatedTax: Number(data.estimated_duties_and_tax ?? 0),
  };
  // await cache.set(cacheKey, result, CACHE_TTL_MS);
  return result;
}

function getPreferredCurrency(countryCode: string, defaultCode: string): string {
  switch (countryCode) {
    case "AU":
      return "AUD";
    case "CA":
      return "CAD";
    case "PH":
      return "PHP";
    case "CN":
      return "CNY";
    case "CH":
      return "CHF";
    case "GB":
      return "GBR";
    case "PL":
      return "POL";
    case "ES":
    case "BE":
    case "PT":
    case "IT":
    case "DE":
    case "FR":
      return "EUR";
    default:
      return defaultCode;
  }
}
