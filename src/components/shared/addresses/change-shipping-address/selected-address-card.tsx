"use client";

import Avatar from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/initials";
import type { UserAddressView } from "@/lib/types/address";

interface SelectedAddressCardProps {
  address: UserAddressView;
  selected: boolean;
  onSelect: () => void;
}

export default function SelectedAddressCard({
  address,
  selected,
  onSelect,
}: SelectedAddressCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left h-full rounded-2xl verflow-hidden flex flex-col shadow-[0px_4px_20px_0px_#00305214] cursor-pointer border transition-colors ${
        selected ? "border-brand-primary" : "border-transparent hover:border-border-subtle"
      }`}
    >
      <div className={`rounded-t-2xl relative px-4 pt-4 pb-3 ${selected ? "bg-brand-gradient" : "bg-surface-overlay"}`}>
        <div className="flex items-center gap-3">
          <Avatar
            initials={getInitials(address.name)}
            size={36}
            bgClass={selected ? "bg-white/20" : "bg-[#eef6fc]"}
            textClass={selected ? "text-white" : "text-brand-primary"}
          />
          <div className="flex flex-col min-w-0 flex-1 leading-tight gap-0.5">
            <span
              className={`font-bold text-[13px] truncate ${
                selected ? "text-white" : "text-text-heading"
              }`}
            >
              {address.name ?? "Unnamed"}
            </span>
            <span
              className={`text-[11px] ${selected ? "text-white/85" : "text-text-muted"}`}
            >
              {address.phone ?? ""}
            </span>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col gap-2 px-4 pt-3 pb-4 rounded-b-2xl ${selected ? "bg-white" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0">
            <img
              src="/assets/icons/pin.svg"
              alt=""
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
            />
            <span className="font-bold text-[12px] text-text-heading truncate">
              {address.street}
            </span>
          </div>
          {address.activeSubscriptions > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#eef6fc] text-[10px] font-semibold text-brand-primary">
              {address.activeSubscriptions} active subscription
              {address.activeSubscriptions === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-muted leading-snug pl-5">
          {address.apartment && <div>{address.apartment}</div>}
          <div>
            {address.city}, {address.stateAbbr} {address.zip}
          </div>
          {address.countryName && <div>{address.countryName}</div>}
        </div>

        <div className="flex justify-end pt-1 mt-auto">
          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
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
