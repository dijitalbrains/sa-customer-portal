import { formatPrice } from "@/lib/utils/currency";
import type { PriceLine } from "@/lib/types/subscription";
import type { TaxSource } from "@/lib/utils/tax";

export interface PricingSummaryProps {
  lines: PriceLine[];
  taxSource: TaxSource | null;
  taxPercent: number;
  tax: number;
  estimatedTax: number;
  taxExempted: number | null;
  shipping: number;
  total: number;
  fillParent?: boolean;
}

export default function PricingSummary({
  lines,
  taxSource,
  taxPercent,
  tax,
  estimatedTax,
  taxExempted,
  shipping,
  total,
  fillParent = false,
}: PricingSummaryProps) {
  const isFedex = taxSource === "FEDEX";
  const sizeClass = fillParent ? "w-full h-full" : "w-[336px] min-h-[250px]";

  return (
    <div
      className={`bg-surface-overlay border border-border-card rounded-card p-5 flex flex-col ${sizeClass}`}
    >
      <h4 className="font-bold text-sm text-text-heading">Pricing Breakdown</h4>

      <div className="mt-3.5 flex flex-col gap-[17px]">
        {lines.map((line, i) => (
          <PriceRow key={i} label={line.label} amount={line.amount} originalAmount={line.originalAmount} />
        ))}

        {!isFedex && (
          <PriceRow
            label={`Tax (${taxPercent.toFixed(1)}%)`}
            amount={tax}
            originalAmount={taxExempted}
          />
        )}

        <PriceRow label="Shipping & Handling" amount={shipping} />
      </div>

      <div className="mt-auto pt-5">
        <div className="bg-border-subtle h-px w-full" />

        <div className="mt-4 flex items-center justify-between text-base font-bold">
          <span className="text-text-heading">Total</span>
          <span className="text-brand-primary">{formatPrice(total)}</span>
        </div>

        {isFedex && estimatedTax > 0 && (
          <div className="mt-2.5 flex items-center justify-between rounded px-2 py-1 text-xs text-status-active-text bg-status-success/40">
            <span>Estimated tax and duties</span>
            <span className="font-medium">{formatPrice(estimatedTax)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface PriceRowProps {
  label: string;
  amount: number;
  originalAmount?: number | null;
}

function PriceRow({ label, amount, originalAmount }: PriceRowProps) {
  const showOriginal = originalAmount != null && originalAmount > 0;
  return (
    <div className="flex items-center justify-between gap-3 text-[13px] text-text-primary">
      <span className="truncate">{label}</span>
      <span className="flex items-center gap-2 whitespace-nowrap">
        {showOriginal && (
          <s className="text-status-error-text">{formatPrice(originalAmount)}</s>
        )}
        {formatPrice(amount)}
      </span>
    </div>
  );
}
