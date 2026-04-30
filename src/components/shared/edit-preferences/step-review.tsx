import StepSection from "./step-section";
import { formatNumericDate } from "@/lib/utils/date";

interface StepReviewProps {
  unusedItems: number;
  upcomingReminder: Date | null;
  quantity: number;
  showQuantity: boolean;
  stepNumber: number;
}

export default function StepReview({
  unusedItems,
  upcomingReminder,
  quantity,
  showQuantity,
  stepNumber,
}: StepReviewProps) {
  return (
    <StepSection
      number={stepNumber}
      title="Review & save"
      description="Review your preferences before saving."
    >
      <div className="rounded-lg border border-border-subtle/50 bg-surface-overlay px-2.5 py-2 flex flex-col gap-1 text-[9px]">
        <ReviewRow label="Current Filter Inventory:" value={String(unusedItems)} />
        <ReviewRow
          label="Your next filter change reminder:"
          value={upcomingReminder ? formatNumericDate(upcomingReminder) : "Pending Install"}
        />
        {showQuantity && (
          <ReviewRow label="Quantity on your next shipment:" value={formatPack(quantity)} />
        )}
      </div>
    </StepSection>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold text-text-muted">{label}</span>
      <span className="font-bold text-text-primary">{value}</span>
    </div>
  );
}

function formatPack(quantity: number): string {
  return quantity > 1 ? `Pack of ${quantity}` : String(quantity);
}
