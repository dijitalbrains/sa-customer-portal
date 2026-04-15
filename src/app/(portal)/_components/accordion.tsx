"use client";

import { useState } from "react";
import Renewal from "./renewal";
import Badge from "@/components/ui/badge";
import type { RenewalOrder } from "@/lib/types/subscription";

interface AccordionProps extends RenewalOrder {
  defaultOpen?: boolean;
}

export default function Accordion({
  placedDate,
  hasExpiredItem,
  hasFailedCard,
  subscriptions,
  defaultOpen = false,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface-overlay rounded-lg p-4 flex flex-col gap-2">
      <button
        onClick={() => setOpen(!open)}
        className="bg-surface-base rounded-lg shadow-card flex items-center cursor-pointer justify-between px-5 md:px-6 py-4 w-full"
      >
        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.1px]">
            Placed Date
          </span>
          <span className="text-[15px] font-medium text-text-heading">
            {placedDate}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {hasExpiredItem && <Badge status="expired" label="Expired" />}
          {hasFailedCard && <Badge status="expired" label="Card Failed" />}
          <img
            src="/assets/icons/chevron-down.svg"
            alt=""
            className={`w-5 h-5 transition-transform duration-200 shrink-0 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open &&
        subscriptions.map((subscription, i) => (
          <Renewal key={i} {...subscription} />
        ))}
    </div>
  );
}
