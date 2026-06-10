"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { formatPrice } from "@/lib/utils/currency";
import type { CartItem } from "@/lib/types/cart";

interface AddedToCartDialogProps {
  open: boolean;
  onClose: () => void;
  item: CartItem;
}

export default function AddedToCartDialog({ open, onClose, item }: AddedToCartDialogProps) {
  const router = useRouter();

  const handleCheckout = () => {
    onClose();
    router.push("/cart");
  };

  const subscriptionLabel = item.subscriptionNickname
    ? `${item.subscriptionTechnology} · ${item.subscriptionNickname} · Qty: ${item.quantity}`
    : `${item.subscriptionTechnology} · Qty: ${item.quantity}`;

  return (
    <Modal open={open} onClose={onClose} width="max-w-[420px]" showClose={false}>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center shrink-0">
              <img src="/assets/icons/check.svg" alt="" className="w-3 h-3" />
            </span>
            <h3 className="font-bold text-[15px] text-text-heading">Added To Cart</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:bg-black/5 cursor-pointer"
          >
            <img src="/assets/icons/close.svg" alt="" className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-surface-overlay rounded-xl px-3 py-2.5 flex items-center gap-3">
          <img
            src={item.product.imageUrl}
            alt={item.product.name}
            className="w-9 h-9 object-contain shrink-0"
          />
          <div className="flex-1 min-w-0 leading-tight">
            <p className="font-semibold text-[13px] text-text-heading truncate">
              {item.product.name}
            </p>
            <p className="text-[11px] text-text-muted truncate">{subscriptionLabel}</p>
          </div>
          <span className="font-bold text-[14px] text-brand-primary shrink-0">
            {formatPrice(item.total)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-pill"
          >
            Continue Browsing
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCheckout}
            className="flex-1 rounded-pill"
          >
            Checkout
          </Button>
        </div>
      </div>
    </Modal>
  );
}
