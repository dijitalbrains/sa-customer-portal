import Badge from "@/components/ui/badge";
import ProgressBar from "@/components/ui/progress-bar";

/* eslint-disable @next/next/no-img-element */

export interface RenewalCardProps {
  iconSrc: string;
  title: string;
  location: string;
  price: string;
  status: "active" | "expired";
  frequency: string;
  remaining?: string;
  nextDate: string;
  shipTo: string;
  loyalty: React.ReactNode;
  progress: number;
}

export default function RenewalCard({
  iconSrc,
  title,
  location,
  price,
  status,
  frequency,
  remaining,
  nextDate,
  shipTo,
  loyalty,
  progress,
}: RenewalCardProps) {
  const isExpired = status === "expired";
  const textColor = isExpired ? "text-status-error-text" : "text-text-primary";
  const mutedColor = isExpired ? "text-status-error-text" : "text-text-muted";

  return (
    <div
      className={`bg-surface-overlay rounded-2xl border p-5 md:p-6 flex flex-col gap-4 flex-1 min-w-0 ${
        isExpired ? "border-status-error-text/40" : "border-border-subtle/10"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <img src={iconSrc} alt="" className="w-4 h-4 shrink-0" />
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-[13px] font-bold ${isExpired ? "text-status-error-text" : "text-text-primary"}`}>
              {title}
            </span>
            <span className={`text-[12px] font-normal ${mutedColor}`}>({location})</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-7 sm:ml-0">
          <p className={`text-[12px] ${textColor}`}>
            <span className="font-bold">{price} </span>
            <span className="font-normal">(plus shipping + tax)</span>
          </p>
          <Badge status={status} label={isExpired ? "Expired" : "Active"} />
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
        <ProgressBar percent={progress} variant={isExpired ? "error" : "default"} />
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
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${textColor}`}>
            Loyalty Program
          </span>
          <div className={`text-[12px] font-normal ${textColor}`}>{loyalty}</div>
        </div>
      </div>
    </div>
  );
}
