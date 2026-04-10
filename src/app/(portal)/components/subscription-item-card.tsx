import Link from "next/link";
import Badge from "@/components/ui/badge";
import ProgressBar from "@/components/ui/progress-bar";
import PaymentMethod from "@/components/shared/payment-method";
import type { SubscriptionItem } from "@/lib/types/subscription";

export default function SubscriptionItemCard({
  detailUrl,
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
}: SubscriptionItem) {
  const hasFailedCard = isLoyaltyEnabled && payment?.type === "card" && payment.isFailed;
  const isError = status === "expired" || hasFailedCard;
  const textColor = isError ? "text-status-error-text" : "text-text-primary";
  const mutedColor = isError ? "text-status-error-text" : "text-text-muted";

  return (
    <Link
      href={detailUrl}
      className={`bg-surface-overlay rounded-2xl border p-5 md:p-6 flex flex-col gap-4 flex-1 min-w-0 hover:border-brand-primary transition-colors ${
        isError ? "border-status-error-text/40" : "border-border-subtle/10"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`text-[13px] font-bold ${isError ? "text-status-error-text" : "text-text-primary"}`}>
            {productName}
          </span>
          {nickname && (
            <span className={`text-[12px] font-normal ${mutedColor}`}>({nickname})</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isLoyaltyEnabled && <PaymentMethod payment={payment} />}
          {isLoyaltyEnabled && (
            <p className={`text-[12px] ${textColor}`}>
              <span className="font-bold">{price} </span>
              <span className="font-normal">(plus shipping + tax)</span>
            </p>
          )}
          <Badge status={status} label={status} />
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[12px] font-medium ${mutedColor}`}>{frequency}</span>
          {remaining && (
            <span className={`text-[12px] font-medium ${mutedColor}`}>{remaining}</span>
          )}
        </div>
        <ProgressBar percent={progress} variant={isError ? "error" : "default"} />
      </div>

      {/* Details */}
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
