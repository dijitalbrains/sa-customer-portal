import { formatPrice } from "@/lib/utils/currency";
import type { PriceLine } from "@/lib/types/subscription";

interface PricingSummaryProps {
  lines: PriceLine[];
  taxPercent: number;
  tax: number;
  shipping: number;
  total: number;
}

export default function PricingSummary({
  lines,
  taxPercent,
  tax,
  shipping,
  total,
}: PricingSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[14px] font-bold text-text-heading">Pricing Breakdown</h3>

      <div className="flex flex-col gap-2">
        {lines.map((line, i) => (
          <PriceRow key={i} label={line.label} amount={line.amount} />
        ))}
        <PriceRow label={`Tax (${taxPercent.toFixed(1)}%)`} amount={tax} />
        <PriceRow label="Shipping & Handling" amount={shipping} />
      </div>

      <div className="border-t border-border-subtle/30 pt-3 flex items-center justify-between">
        <span className="text-[15px] font-bold text-text-heading">Total</span>
        <span className="text-[15px] font-bold text-brand-primary">{formatPrice(total)}</span>
      </div>
    </div>
  );
}

function PriceRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-text-primary">{label}</span>
      <span className="text-text-primary font-medium">{formatPrice(amount)}</span>
    </div>
  );
}
