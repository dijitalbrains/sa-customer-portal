"use client";

import { useState } from "react";
import NeedThisNowModal from "./need-this-now-modal";
import type { RenewalItem } from "@/lib/types/subscription";

interface NeedThisNowButtonProps {
  item: RenewalItem;
}

export default function NeedThisNowButton({ item }: NeedThisNowButtonProps) {
  const [open, setOpen] = useState(false);

  if (!item.subscription.isLoyaltyEnabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-semibold text-xs text-brand-primary hover:underline cursor-pointer whitespace-nowrap"
      >
        Need this item right now?
      </button>
      {open && (
        <NeedThisNowModal open={open} onClose={() => setOpen(false)} item={item} />
      )}
    </>
  );
}
