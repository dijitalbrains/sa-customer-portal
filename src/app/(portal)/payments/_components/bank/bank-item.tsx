"use client";

import Avatar from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/initials";
import type { BankPaymentMethod } from "@/lib/types/bank";

interface BankItemProps {
  bank: BankPaymentMethod;
  onRemove: () => void;
  onSetDefault: () => void;
}

export default function BankItem({ bank, onRemove, onSetDefault }: BankItemProps) {
  const isDefault = bank.isDefault;
  const isFailed = bank.status === "FAILED";

  const containerClasses = [
    "h-full rounded-[16px] overflow-hidden flex flex-col shadow-[0px_4px_20px_0px_#00305214] border",
    isFailed ? "bg-[#FFF3F3]" : "bg-white",
    isDefault
      ? isFailed
        ? "border-status-error-text"
        : "border-brand-primary"
      : "border-transparent",
  ].join(" ");

  const headerClasses = [
    "px-4 py-3 flex items-center justify-between gap-2",
    isFailed ? "bg-gradient-to-br from-[#E84B4B] to-[#A81E1E]" : "bg-[#eef6fc]",
  ].join(" ");

  return (
    <div className={containerClasses}>
      <div className={headerClasses}>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            initials={getInitials(bank.bankName ?? "Bank")}
            size={36}
            bgClass={isFailed ? "bg-[#791F1F]" : "bg-brand-primary"}
            textClass="text-white"
          />
          <div className="flex flex-col leading-tight min-w-0">
            {isFailed && (
              <span className="text-[9px] font-bold text-white/85 uppercase tracking-wider">
                Failed Attempt
              </span>
            )}
            <span
              className={`text-[13px] font-bold truncate ${
                isFailed ? "text-white" : "text-text-heading"
              }`}
            >
              {(bank.bankName ?? "Bank").toUpperCase()} ****{bank.last4 ?? "****"}
            </span>
          </div>
        </div>
        {isDefault && (
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#EAF3DE] text-[10px] font-bold text-[#27500A]">
            Default
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-text-heading">
            Bank Transfer (ACH)
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isFailed
                ? "bg-[#FCEBEB] text-[#791F1F]"
                : "bg-[#eef6fc] text-brand-primary"
            }`}
          >
            {bank.activeSubscriptions} active subscription
            {bank.activeSubscriptions === 1 ? "" : "s"}
          </span>
        </div>

        {isFailed && (
          <p className="text-[11px] text-[#791F1F]">
            Payment failed. Update or replace this account to resume renewals.
          </p>
        )}

        <div className="flex items-center gap-2 pt-2 mt-auto">
          <button
            type="button"
            onClick={onRemove}
            className="flex-1 h-8 px-4 rounded-[8px] border border-[#791F1F40] bg-[#FCEBEB] text-[11px] font-semibold text-[#791F1F] hover:opacity-90 cursor-pointer"
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
