import Link from "next/link";
import Badge from "@/components/ui/badge";
import ProgressBar from "@/components/ui/progress-bar";
import PaymentMethod from "@/components/shared/payment-method";
import type { RenewalListItem } from "@/lib/types/subscription";

export default function RenewalCard({
  subscriptionId,
  productName,
  nickname,
  price,
  status,
  frequency,
  remaining,
  nextDate,
  shipTo,
  isLoyaltyEnabled,
  productType,
  progress,
  payment,
}: RenewalListItem) {
  const hasFailedCard = isLoyaltyEnabled && payment?.type === "card" && payment.isFailed;
  const isError = status === "expired" || hasFailedCard;
  const textColor = isError ? "text-status-error-text" : "text-text-primary";
  const mutedColor = isError ? "text-status-error-text" : "text-text-muted";

  return (
    <Link
      href={`/detail/${subscriptionId}`}
      className={`bg-surface-overlay rounded-2xl border p-5 md:p-6 flex flex-col gap-4 flex-1 min-w-0 hover:border-brand-primary transition-colors ${
        isError ? "border-status-error-text/40" : "border-border-subtle/10"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
          <span
            className={`text-[13px] font-bold truncate ${
              isError ? "text-status-error-text" : "text-text-primary"
            }`}
          >
            {productName}
          </span>
          {nickname && (
            <span className={`text-[12px] font-normal ${mutedColor}`}>({nickname})</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 ml-auto">
          {isLoyaltyEnabled && <PaymentMethod payment={payment} showStatus />}
          {isLoyaltyEnabled && (
            <p className={`text-[12px] whitespace-nowrap ${textColor}`}>
              <span className="font-bold">{price} </span>
              <span className="font-normal">(plus shipping + tax)</span>
            </p>
          )}
          <Badge status={status} label={status} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[12px] font-medium ${mutedColor}`}>{frequency}</span>
          {remaining && (
            <span className={`text-[12px] font-medium ${mutedColor}`}>{remaining}</span>
          )}
        </div>
        <ProgressBar percent={progress} variant={isError ? "error" : "default"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${textColor}`}>
            Next subscription
          </span>
          <span className={`text-[12px] font-normal ${textColor}`}>{nextDate}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${textColor}`}>
            Ship To
          </span>
          <span className={`text-[12px] font-normal ${textColor}`}>{shipTo}</span>
        </div>
        <div className="flex flex-col gap-1 sm:items-end sm:text-right">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${textColor}`}>
            Loyalty Program
          </span>
          <div className={`text-[12px] font-normal ${textColor}`}>
            {isLoyaltyEnabled ? (
              <span>Yes</span>
            ) : productType !== "PRESET_FILTER" ? (
              <div>
                <p className="text-brand-primary cursor-pointer">Join the loyalty program.</p>
                <p>Cancel at anytime.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
