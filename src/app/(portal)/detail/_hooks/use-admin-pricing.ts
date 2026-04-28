"use client";

import { useMemo, useState } from "react";
import type {
  RenewalItem,
  LinkedProductOption,
  PriceLine,
} from "@/lib/types/subscription";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import { updateItemAdmin } from "../actions";

export interface AdminPricing {
  productPrice: number;
  linkedProductId: number | null;
  linkedPrice: number;
  linkedQty: number;
  shipping: number;
  selectedProduct: LinkedProductOption | null;
  hasLinked: boolean;
  subTotal: number;
  tax: number;
  total: number;
  pricingLines: PriceLine[];
  pending: boolean;
  setLinkedPrice: (price: number) => void;
  setShipping: (shipping: number) => void;
  changeSubTotal: (subTotal: number) => void;
  changeLinkedProduct: (id: number | null) => void;
  changeLinkedQty: (qty: number) => void;
}

export function useAdminPricing(
  item: RenewalItem,
  availableLinkedProducts: LinkedProductOption[],
): AdminPricing {
  const initialLinkedId = findInitialLinkedId(item, availableLinkedProducts);
  const initialLinkedPrice = resolveLinkedPrice(initialLinkedId, availableLinkedProducts, item);
  const initialLinkedQty = item.linkedProductQuantity ?? 1;

  const [productPrice, setProductPrice] = useState(() =>
    deriveProductPrice(item, initialLinkedPrice, initialLinkedQty),
  );
  const [linkedProductId, setLinkedProductId] = useState<number | null>(initialLinkedId);
  const [linkedPrice, setLinkedPrice] = useState(initialLinkedPrice);
  const [linkedQty, setLinkedQty] = useState(initialLinkedQty);
  const [shipping, setShipping] = useState(item.shipping);

  const selectedProduct = useMemo(
    () => availableLinkedProducts.find((p) => p.id === linkedProductId) ?? null,
    [availableLinkedProducts, linkedProductId],
  );
  const hasLinked = selectedProduct !== null && selectedProduct.id !== null;

  const subTotal = round2(
    productPrice * item.quantity + (hasLinked ? linkedPrice * linkedQty * item.quantity : 0),
  );
  const tax = round2((subTotal * item.taxPercent) / 100);
  const total = round2(subTotal + shipping + tax);

  const pricingLines = useMemo(
    () => buildLines(item, productPrice, hasLinked, selectedProduct, linkedPrice, linkedQty),
    [item, productPrice, hasLinked, selectedProduct, linkedPrice, linkedQty],
  );

  const pending = useAutoSave(
    { itemId: item.id, linkedProductId, linkedProductQuantity: linkedQty },
    updateItemAdmin,
  );

  const changeSubTotal = (newSubTotal: number) => {
    const linkedTotal = hasLinked ? linkedPrice * linkedQty * item.quantity : 0;
    const newPrice = (newSubTotal - linkedTotal) / Math.max(1, item.quantity);
    setProductPrice(Math.max(0, newPrice));
  };

  const changeLinkedProduct = (id: number | null) => {
    setLinkedProductId(id);
    setLinkedPrice(resolveLinkedPrice(id, availableLinkedProducts, item));
    if (id === null) setLinkedQty(1);
  };

  return {
    productPrice,
    linkedProductId,
    linkedPrice,
    linkedQty,
    shipping,
    selectedProduct,
    hasLinked,
    subTotal,
    tax,
    total,
    pricingLines,
    pending,
    setLinkedPrice,
    setShipping,
    changeSubTotal,
    changeLinkedProduct,
    changeLinkedQty: setLinkedQty,
  };
}

function findInitialLinkedId(
  item: RenewalItem,
  options: LinkedProductOption[],
): number | null {
  if (!item.linkedProductName) return null;
  return options.find((p) => p.name === item.linkedProductName)?.id ?? null;
}

function resolveLinkedPrice(
  id: number | null,
  options: LinkedProductOption[],
  item: RenewalItem,
): number {
  if (id === null) return 0;
  const option = options.find((p) => p.id === id);
  return option ? option.price : item.linkedProductPrice ?? 0;
}

function deriveProductPrice(
  item: RenewalItem,
  linkedPrice: number,
  linkedQty: number,
): number {
  const qty = Math.max(1, item.quantity);
  const linkedTotal = linkedPrice * linkedQty * qty;
  return Math.max(0, (item.subTotal - linkedTotal) / qty);
}

function buildLines(
  item: RenewalItem,
  productPrice: number,
  hasLinked: boolean,
  selectedProduct: LinkedProductOption | null,
  linkedPrice: number,
  linkedQty: number,
): PriceLine[] {
  const lines: PriceLine[] = [
    {
      label: item.productName,
      amount: round2(productPrice * item.quantity),
      originalAmount: item.pricingLines[0]?.originalAmount ?? null,
    },
  ];
  if (hasLinked && selectedProduct) {
    lines.push({
      label: `Zone ${item.subscription.zone} (${selectedProduct.name})`,
      amount: round2(linkedPrice * linkedQty * item.quantity),
      originalAmount: item.pricingLines[1]?.originalAmount ?? null,
    });
  }
  return lines;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
