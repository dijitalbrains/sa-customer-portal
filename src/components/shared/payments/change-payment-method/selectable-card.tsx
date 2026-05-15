"use client";

import type { CardPaymentMethod, CardStatus } from "@/lib/types/card";

interface SelectableCardProps {
  card: CardPaymentMethod;
  selected: boolean;
  onSelect: () => void;
}

interface StatusVisual {
  gradient: string;
  pillBg: string;
  pillText: string;
  pillLabel: string | null;
  expiryLabel: string;
}

export default function SelectableCard({ card, selected, onSelect }: SelectableCardProps) {
  const visual = statusVisual(card.status);
  const expiryDisplay = `${card.expMonth.padStart(2, "0")}/${card.expYear.slice(-2)}`;
  const brandLabel = (card.brand ?? "").toUpperCase();
  const isDanger = card.status === "EXPIRED" || card.status === "FAILED";
  const subsChipClass = isDanger
    ? "bg-[#FCEBEB] text-[#791F1F]"
    : "bg-[#eef6fc] text-brand-primary";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left h-full rounded-[16px] flex flex-col shadow-[0px_4px_20px_0px_#00305214] p-3 border cursor-pointer transition-colors ${
        isDanger ? "bg-[#FFF3F3]" : "bg-white"
      } ${selected ? "border-brand-primary" : "border-transparent hover:border-border-subtle"}`}
    >
      <div
        className={`relative overflow-hidden rounded-[12px] px-4 pt-4 pb-4 text-white ${visual.gradient}`}
      >
        <div className="pointer-events-none absolute -top-18 -right-16 w-44 h-44 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-2">
          <img src="/assets/icons/card/chip.svg" alt="" className="w-8 h-6" />
          {visual.pillLabel && (
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${visual.pillBg} ${visual.pillText}`}
            >
              {visual.pillLabel}
            </span>
          )}
        </div>

        <div className="mt-5 text-[15px] tracking-[0.18em] text-white">
          •••• •••• •••• {card.last4}
        </div>

        {card.nameOnCard && (
          <span className="text-[11px] text-white truncate mt-1 font-[500] uppercase">
            {card.nameOnCard}
          </span>
        )}

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider text-white/70">
              {visual.expiryLabel}
            </span>
            <span className="text-[12px] font-semibold text-white truncate">
              {expiryDisplay}
            </span>
          </div>
          <span className="text-[13px] font-[700] text-white shrink-0">{brandLabel}</span>
        </div>
      </div>

      <div className="border-t border-border-subtle/60 mt-4" />

      <div className="flex-1 flex flex-col gap-2 px-1 pt-3 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${subsChipClass}`}>
            {card.activeSubscriptions > 0
              ? `${card.activeSubscriptions} active subscription${card.activeSubscriptions === 1 ? "" : "s"}`
              : "No active subscriptions"}
          </span>
          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selected ? "border-brand-primary" : "border-border-subtle"
            }`}
          >
            {selected && <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
          </span>
        </div>
      </div>
    </button>
  );
}

function statusVisual(status: CardStatus): StatusVisual {
  switch (status) {
    case "FAILED":
      return {
        gradient: "bg-gradient-to-br from-[#E84B4B] to-[#A81E1E]",
        pillBg: "bg-[#FCEBEB] border border-[#F09595]",
        pillText: "text-[#791F1F]",
        pillLabel: "Charge Failed",
        expiryLabel: "EXPIRES",
      };
    case "EXPIRED":
      return {
        gradient: "bg-gradient-to-br from-[#E84B4B] to-[#A81E1E]",
        pillBg: "bg-[#FCEBEB] border border-[#F09595]",
        pillText: "text-[#791F1F]",
        pillLabel: "Expired",
        expiryLabel: "EXPIRED",
      };
    case "EXPIRING_SOON":
      return {
        gradient: "bg-gradient-to-br from-[#F5A623] to-[#C47A0A]",
        pillBg: "bg-[#FCEBEB] border border-[#F09595]",
        pillText: "text-[#7A4A00]",
        pillLabel: "Expiring Soon",
        expiryLabel: "EXPIRES",
      };
    case "GOOD":
    default:
      return {
        gradient: "bg-brand-gradient",
        pillBg: "",
        pillText: "",
        pillLabel: null,
        expiryLabel: "EXPIRES",
      };
  }
}
