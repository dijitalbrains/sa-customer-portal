import "server-only";
import { getRates } from "@/lib/services/fedex-service";
import { determineProductPackages } from "@/lib/services/product-service";
import { processFallback } from "@/lib/services/territory-service";

export interface ShippingResult {
  shippingPrice: number;
  estimatedTax: number;
}

export interface ShippingProduct {
  id: number;
  key: string;
  type: string | null;
  price: number | null;
  requires_shipping: boolean;
}

export interface ShippingAddress {
  street: string;
  city: string;
  zip: string;
  state_id: number | null;
  countries: {
    id: number;
    code: string;
    hts_code: string | null;
    shipping_price_source: string | null;
    currencies: { code: string };
  } | null;
}

export interface ShippingInput {
  product: ShippingProduct;
  address: ShippingAddress | null;
  linkedProductId: number | null;
  linkedProductQuantity: number;
  quantity: number;
}

const ME_FILTER_RATES: Record<number, number> = {
  1: 12.95, 2: 12.95, 3: 12.95,
  4: 22.95, 5: 22.95, 6: 22.95, 7: 22.95,
  8: 31.95, 9: 31.95, 10: 31.95, 11: 31.95, 12: 31.95,
  13: 31.95, 14: 31.95, 15: 31.95, 16: 31.95,
  17: 31.95, 18: 31.95, 19: 31.95, 20: 31.95,
};

const ME_RENEWAL_FILTER_KEY = "me-renewal-filter";

export async function calculateShipping(input: ShippingInput): Promise<ShippingResult> {
  if (!input.product.requires_shipping) {
    return { shippingPrice: 0, estimatedTax: 0 };
  }

  if (input.product.key === ME_RENEWAL_FILTER_KEY) {
    return { shippingPrice: ME_FILTER_RATES[input.quantity] ?? 0, estimatedTax: 0 };
  }

  if (!input.address?.countries) {
    return { shippingPrice: 0, estimatedTax: 0 };
  }

  if (input.address.countries.shipping_price_source === "FEDEX") {
    const packages = await determineProductPackages({
      product: input.product,
      quantity: input.quantity,
      linkedProductId: input.linkedProductId,
      linkedProductQuantity: input.linkedProductQuantity,
    });
    return getRates(input.product.price ?? 0, input.address, packages);
  }

  return {
    shippingPrice: await fetchTierShipping(input),
    estimatedTax: 0,
  };
}

async function fetchTierShipping(input: ShippingInput): Promise<number> {
  if (!input.address?.countries) return 0;
  const rows = await processFallback(
    {
      countryId: input.address.countries.id,
      stateId: input.address.state_id ?? null,
      city: input.address.city,
      zip: input.address.zip,
    },
    "Tier",
    input.product.id,
  );
  if (rows.length === 0) return 0;

  const exact = rows.find((r) => r.quantity === input.quantity);
  if (exact) return exact.shipping_price;

  const single = rows.find((r) => r.quantity === 1);
  return (single?.shipping_price ?? 0) * input.quantity;
}
