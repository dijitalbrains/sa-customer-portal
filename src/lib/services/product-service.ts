import "server-only";
import { prisma } from "@/lib/prisma";

const P1_FILTER_KEY = "p1-filter";
const SHOWER_FILTER_KEY = "shower-filter";

export interface DeterminePackagesInput {
  product: {
    id: number;
    key: string;
    type: string | null;
  };
  quantity: number;
  linkedProductId: number | null;
  linkedProductQuantity: number;
}

export interface ShipmentPackage {
  length_in: number | null;
  width_in: number | null;
  height_in: number | null;
  weight_lbs: number;
}

export async function determineProductPackages(
  input: DeterminePackagesInput,
): Promise<ShipmentPackage[]> {
  const packaging = await prisma.product_packaging.findFirst({
    where: { product_id: input.product.id, deleted_at: null },
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

  if (input.product.type === "RENEWAL_FILTER") {
    return Array.from({ length: input.quantity }, () => ({
      ...dims,
      weight_lbs: baseWeight,
    }));
  }
  if (input.product.key === P1_FILTER_KEY || input.product.key === SHOWER_FILTER_KEY) {
    return [{ ...dims, weight_lbs: Math.ceil(input.quantity * baseWeight) }];
  }
  return [{ ...dims, weight_lbs: baseWeight }];
}
