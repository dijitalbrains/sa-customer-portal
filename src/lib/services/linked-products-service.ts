import { prisma } from "@/lib/prisma";
import type { LinkedProductOption } from "@/lib/types/subscription";

const LINKED_PRODUCT_KEYS = [
  "p1-filter",
  "p2-p3-filters",
  "p2-p3-p3-p4-filters",
  "p3-filter",
  "p3-p4-filters",
  "p4-filter",
];

const NO_FILTER_OPTION: LinkedProductOption = {
  id: null,
  key: null,
  name: "No Zone Filter",
  price: 0,
};

export async function getAvailableLinkedProducts(): Promise<LinkedProductOption[]> {
  const rows = await prisma.products.findMany({
    where: { key: { in: LINKED_PRODUCT_KEYS }, deleted_at: null },
    select: { id: true, key: true, name: true, price: true },
    orderBy: { name: "asc" },
  });

  return [NO_FILTER_OPTION, ...rows.map((r) => ({ id: r.id, key: r.key, name: r.name, price: r.price ?? 0 }))];
}
