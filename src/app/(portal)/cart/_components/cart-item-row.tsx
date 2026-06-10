"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import QuantityStepper from "@/components/ui/quantity-stepper";
import { formatPrice } from "@/lib/utils/currency";
import { removeFromCart, updateCartItemQuantity } from "@/lib/actions/cart.actions";
import type { CartItem } from "@/lib/types/cart";

interface CartItemRowProps {
  item: CartItem;
}

const MAX_QUANTITY_BY_KEY: Record<string, number> = {
  "me-renewal-filter": 20,
};
const DEFAULT_MAX_QUANTITY = 4;

export default function CartItemRow({ item }: CartItemRowProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [pending, startTransition] = useTransition();

  const maxQuantity = MAX_QUANTITY_BY_KEY[item.product.key] ?? DEFAULT_MAX_QUANTITY;
  const subscriptionLabel = item.subscriptionNickname
    ? `${item.subscriptionNickname} ${item.subscriptionTechnology}`
    : item.subscriptionTechnology;

  const handleQuantityChange = (next: number) => {
    const previous = quantity;
    setQuantity(next);
    startTransition(async () => {
      try {
        await updateCartItemQuantity(item.id, next);
      } catch (e) {
        setQuantity(previous);
        const message = e instanceof Error ? e.message : "Failed to update quantity";
        toast.error(message);
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await removeFromCart(item.id);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to remove item";
        toast.error(message);
      }
    });
  };

  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <img
        src={item.product.imageUrl}
        alt={item.product.name}
        className="w-10 h-10 object-contain shrink-0"
      />

      <div className="flex-1 min-w-0 leading-tight">
        <p className="font-bold text-[14px] text-text-heading truncate">{item.product.name}</p>
        <p className="text-[11px] text-text-muted truncate">{subscriptionLabel}</p>
        <p className="text-[11px] text-text-muted truncate mt-0.5">
          Ships to: {item.userAddress.formatted}
        </p>
      </div>

      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        className="px-3 h-8 rounded-pill bg-[#FCEBEB] text-[#791F1F] text-[12px] font-semibold hover:opacity-80 cursor-pointer disabled:opacity-50"
      >
        Remove
      </button>

      <QuantityStepper
        value={quantity}
        min={1}
        max={maxQuantity}
        disabled={pending}
        onChange={handleQuantityChange}
      />

      <span className="font-bold text-[14px] text-brand-primary min-w-[72px] text-right shrink-0">
        {formatPrice(item.total)}
      </span>
    </div>
  );
}
