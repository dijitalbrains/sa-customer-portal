"use client";

import { useState } from "react";
import SubscriptionItem from "./subscription-item";
import type { OrderView } from "@/lib/types/subscription";

interface OrderAccordionProps extends OrderView {
  defaultOpen?: boolean;
}

export default function OrderAccordion({
  orderNumber,
  placedDate,
  subscriptions,
  defaultOpen = false,
}: OrderAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface-overlay rounded-lg p-4 flex flex-col gap-2">
      <button
        onClick={() => setOpen(!open)}
        className="bg-surface-base rounded-lg shadow-card flex items-center justify-between px-5 md:px-6 py-4 w-full"
      >
        <div className="flex items-center gap-5 md:gap-6">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.1px]">
              Order Number
            </span>
            <span className="text-[15px] font-bold text-text-heading">
              {orderNumber}
            </span>
          </div>
          <div className="w-px h-10 bg-border-subtle/20 hidden sm:block" />
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.1px]">
              Placed Date
            </span>
            <span className="text-[15px] font-medium text-text-heading">
              {placedDate}
            </span>
          </div>
        </div>
        <img
          src="/assets/icons/chevron-down.svg"
          alt=""
          className={`w-5 h-5 transition-transform duration-200 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        subscriptions.map((subscription, i) => (
          <SubscriptionItem key={i} {...subscription} />
        ))}
    </div>
  );
}
