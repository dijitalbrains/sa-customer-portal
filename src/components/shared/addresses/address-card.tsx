"use client";

import Avatar from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/initials";
import type { UserAddressView } from "@/lib/types/address";

interface AddressCardProps {
  address: UserAddressView;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: () => void;
}

export default function AddressCard({
  address,
  onEdit,
  onRemove,
  onSetDefault,
}: AddressCardProps) {
  const isDefault = address.isDefault;

  return (
    <div
      className={`h-full rounded-2xl overflow-hidden flex flex-col shadow-[0px_4px_20px_0px_#00305214] ${
        isDefault ? "border border-brand-primary" : ""
      }`}
    >
      <div
        className={`relative px-4 pt-4 pb-3 ${
          isDefault ? "bg-brand-gradient" : "bg-surface-overlay"
        }`}
      >
        <div className="flex items-center gap-3">
          <Avatar
            initials={getInitials(address.name)}
            size={36}
            bgClass={isDefault ? "bg-white/20" : "bg-[#eef6fc]"}
            textClass={isDefault ? "text-white" : "text-brand-primary"}
          />
          <div className="flex flex-col min-w-0 flex-1 leading-tight gap-0.5">
            <span
              className={`font-bold text-[13px] truncate ${
                isDefault ? "text-white" : "text-text-heading"
              }`}
            >
              {address.name ?? "Unnamed"}
            </span>
            <span
              className={`text-[11px] ${
                isDefault ? "text-white/85" : "text-text-muted"
              }`}
            >
              {address.phone ?? ""}
            </span>
          </div>
          {isDefault && (
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#EAF3DE] text-[10px] font-bold text-[#27500A]">
              Default
            </span>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col gap-2 px-4 pt-3 pb-4 ${isDefault ? "bg-white" : ""}`}>
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

        <div className="border-t border-border-subtle/60 mt-auto" />

        <div className="flex items-center gap-2 pt-3">
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
            className="h-8 px-4 rounded-[8px] border border-status-error-text/30 bg-[#fdecec] text-[11px] font-semibold text-status-error-text hover:opacity-90 cursor-pointer"
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

