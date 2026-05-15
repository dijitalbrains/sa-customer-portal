"use client";

import Avatar from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/initials";
import type { BankPaymentMethod } from "@/lib/types/bank";

interface SelectableBankProps {
  bank: BankPaymentMethod;
  selected: boolean;
  onSelect: () => void;
}

export default function SelectableBank({ bank, selected, onSelect }: SelectableBankProps) {
  const isFailed = bank.status === "FAILED";
  const isDarkHeader = isFailed || selected;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left h-full rounded-[16px] overflow-hidden flex flex-col shadow-[0px_4px_20px_0px_#00305214] border cursor-pointer transition-colors ${
        isFailed ? "bg-[#FFF3F3]" : "bg-white"
      } ${selected ? "border-brand-primary" : "border-transparent hover:border-border-subtle"}`}
    >
      <div
        className={`px-4 py-3 flex items-center justify-between gap-2 ${
          isFailed
            ? "bg-gradient-to-br from-[#E84B4B] to-[#A81E1E]"
            : selected
              ? "bg-brand-primary"
              : "bg-[#eef6fc]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            initials={getInitials(bank.bankName ?? "Bank")}
            size={36}
            bgClass={
              isFailed ? "bg-[#791F1F]" : selected ? "bg-white/20" : "bg-brand-primary"
            }
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
                isDarkHeader ? "text-white" : "text-text-heading"
              }`}
            >
              {(bank.bankName ?? "Bank").toUpperCase()} ****{bank.last4 ?? "****"}
            </span>
          </div>
        </div>
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
