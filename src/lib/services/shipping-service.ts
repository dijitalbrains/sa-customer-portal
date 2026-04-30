import "server-only";
import { prisma } from "@/lib/prisma";
import { processFallback } from "@/lib/services/territory-service";

export interface ShippingResult {
  shippingPrice: number;
  estimatedTax: number;
}

export interface ShippingInput {
  productId: number;
  linkedProductId: number | null;
  linkedProductQuantity: number;
  quantity: number;
  userAddressId: number;
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
  const product = await fetchProduct(input.productId);
  if (!product?.requires_shipping) return { shippingPrice: 0, estimatedTax: 0 };

  if (product.key === ME_RENEWAL_FILTER_KEY) {
    return { shippingPrice: ME_FILTER_RATES[input.quantity] ?? 0, estimatedTax: 0 };
  }

  const address = await fetchAddress(input.userAddressId);
  if (!address?.countries) return { shippingPrice: 0, estimatedTax: 0 };

  if (address.countries.shipping_price_source === "FEDEX") {
    return fetchFedexRates(input, product, address);
  }

  return {
    shippingPrice: await fetchTierShipping(input, address),
    estimatedTax: 0,
  };
}

async function fetchProduct(productId: number) {
  return prisma.products.findFirst({
    where: { id: productId, deleted_at: null },
    select: { id: true, key: true, requires_shipping: true, type: true, price: true },
  });
}

async function fetchAddress(userAddressId: number) {
  return prisma.user_addresses.findFirst({
    where: { id: userAddressId, deleted_at: null },
    select: {
      zip: true,
      city: true,
      street: true,
      state_id: true,
      country_id: true,
      countries: {
        select: { id: true, code: true, hts_code: true, shipping_price_source: true },
      },
    },
  });
}

async function fetchTierShipping(input: ShippingInput, address: AddressRow): Promise<number> {
  if (!address.countries) return 0;
  const rows = await processFallback(
    {
      countryId: address.countries.id,
      stateId: address.state_id ?? null,
      city: address.city,
      zip: address.zip,
    },
    "Tier",
    input.productId,
  );
  if (rows.length === 0) return 0;

  const exact = rows.find((r) => r.quantity === input.quantity);
  if (exact) return exact.shipping_price;

  const single = rows.find((r) => r.quantity === 1);
  return (single?.shipping_price ?? 0) * input.quantity;
}

interface ProductRow {
  id: number;
  key: string;
  type: string | null;
  price: number | null;
}

interface AddressRow {
  zip: string;
  city: string;
  street: string;
  state_id: number | null;
  country_id: number | null;
  countries: { id: number; code: string; hts_code: string | null; shipping_price_source: string | null } | null;
}

async function fetchFedexRates(
  input: ShippingInput,
  product: ProductRow,
  address: AddressRow,
): Promise<ShippingResult> {
  const baseUrl = process.env.REST_API_URL;
  const apiKey = process.env.REST_API_KEY;
  if (!baseUrl || !apiKey || !address.countries) return { shippingPrice: 0, estimatedTax: 0 };

  const packages = await buildPackages(product, input);
  const body = {
    amount: product.price ?? 0,
    currency: "USD",
    preferred_currency: "USD",
    hts_code: address.countries.hts_code ?? null,
    packaging_type: "YOUR_PACKAGING",
    recipient_address: {
      country_code: address.countries.code,
      street: [address.street],
      zip: address.zip,
    },
    product_packages: packages,
  };

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/get-shipping-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[shipping] ${res.status} ${res.statusText}`);
      return { shippingPrice: 0, estimatedTax: 0 };
    }
    const data = (await res.json()) as { shipping_price?: number; estimated_duties_and_tax?: number };
    return {
      shippingPrice: Number(data.shipping_price ?? 0),
      estimatedTax: Number(data.estimated_duties_and_tax ?? 0),
    };
  } catch (err) {
    console.error("[shipping] fedex fetch failed", err);
    return { shippingPrice: 0, estimatedTax: 0 };
  }
}

async function buildPackages(product: ProductRow, input: ShippingInput) {
  const packaging = await prisma.product_packaging.findFirst({
    where: { product_id: product.id, deleted_at: null },
    select: { length_in: true, width_in: true, height_in: true, weight_lbs: true },
  });
  if (!packaging) return [];

  const linked = input.linkedProductId
    ? await prisma.product_packaging.findFirst({
        where: { product_id: input.linkedProductId, deleted_at: null },
        select: { weight_lbs: true },
      })
    : null;
  const linkedQty = input.linkedProductQuantity || input.quantity;
  const baseWeight = packaging.weight_lbs + (linked ? linked.weight_lbs * linkedQty : 0);

  const dims = {
    length_in: packaging.length_in,
    width_in: packaging.width_in,
    height_in: packaging.height_in,
  };

  if (product.type === "RENEWAL_FILTER") {
    return Array.from({ length: input.quantity }, () => ({ ...dims, weight_lbs: baseWeight }));
  }
  if (product.key === "p1-filter" || product.key === "shower-filter") {
    return [{ ...dims, weight_lbs: Math.ceil(input.quantity * baseWeight) }];
  }
  return [{ ...dims, weight_lbs: baseWeight }];
}
