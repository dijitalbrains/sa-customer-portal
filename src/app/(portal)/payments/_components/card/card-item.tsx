"use client";

import type { CardPaymentMethod, CardStatus } from "@/lib/types/card";

interface CardItemProps {
  card: CardPaymentMethod;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
}

interface StatusVisual {
  gradient: string;
  pillBg: string;
  pillText: string;
  pillLabel: string | null;
  expiryLabel: string;
}

export default function CardItem({
  card,
  onEdit,
  onRemove,
  onSetDefault,
}: CardItemProps) {
  const isDefault = card.isDefault;
  const visual = statusVisual(card.status);
  const expiryDisplay = `${card.expMonth.padStart(2, "0")}/${card.expYear.slice(-2)}`;
  const brandLabel = (card.brand ?? "").toUpperCase();
  const isDanger = card.status === "EXPIRED" || card.status === "FAILED";
  const subsChipClass = isDanger
    ? "bg-[#FCEBEB] text-[#791F1F]"
    : "bg-[#eef6fc] text-brand-primary";

  return (
    <div
      className={`h-full rounded-[16px] flex flex-col shadow-[0px_4px_20px_0px_#00305214] p-3 border ${
        isDanger ? "bg-[#FFF3F3]" : "bg-white"
      } ${
        isDefault
          ? isDanger
            ? "border-status-error-text"
            : "border-brand-primary"
          : "border-transparent"
      }`}
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
          <span className="text-[13px] font-[700] text-white shrink-0">
            {brandLabel}
          </span>
        </div>
      </div>
        <div className="border-t border-border-subtle/60 mt-4" />

      <div className="flex-1 flex flex-col gap-2 px-1 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${subsChipClass}`}
          >
            {card.activeSubscriptions > 0
              ? `${card.activeSubscriptions} active subscription${card.activeSubscriptions === 1 ? "" : "s"}`
              : "No active subscriptions"}
          </span>
          {isDefault && (
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#EAF3DE] text-[10px] font-bold text-[#27500A]">
              Default
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-8 px-4 rounded-[8px] border border-brand-primary/30 bg-[#f0f7fd] text-[11px] font-semibold text-brand-primary hover:opacity-90 cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="h-8 px-4 rounded-[8px] border border-[#791F1F40] bg-[#FCEBEB] text-[11px] font-semibold text-[#791F1F] hover:opacity-90 cursor-pointer"
          >
            Remove
          </button>
          {!isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              className="flex-1 h-8 px-4 rounded-[8px] bg-brand-gradient text-[11px] font-semibold text-white shadow-[0px_3px_8px_0px_#3792DE40] hover:opacity-95 cursor-pointer"
            >
              Set as Default
            </button>
          )}
        </div>
      </div>
    </div>
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
