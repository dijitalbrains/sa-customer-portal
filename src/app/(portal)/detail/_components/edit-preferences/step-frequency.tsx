import StepSection from "./step-section";
import StepSelect from "./step-select";
import type { ValidityType } from "@/lib/actions/preferences.actions";

const MONTH_OPTIONS = buildOptions(24, "month");
const WEEK_OPTIONS = buildOptions(80, "week");

interface StepFrequencyProps {
  productName: string;
  validityType: ValidityType;
  validityValue: number;
  onValidityType: (type: ValidityType) => void;
  onValidityValue: (value: number) => void;
}

export default function StepFrequency({
  productName,
  validityType,
  validityValue,
  onValidityType,
  onValidityValue,
}: StepFrequencyProps) {
  const options = validityType === "MONTHS" ? MONTH_OPTIONS : WEEK_OPTIONS;

  return (
    <StepSection
      number={2}
      title="Renewal frequency"
      description={`How often do you want to change your ${productName} filter?`}
    >
      <div className="flex gap-2 mb-2.5">
        <TypeButton active={validityType === "MONTHS"} onClick={() => onValidityType("MONTHS")}>
          Months
        </TypeButton>
        <TypeButton active={validityType === "WEEKS"} onClick={() => onValidityType("WEEKS")}>
          Weeks
        </TypeButton>
      </div>
      <StepSelect value={validityValue} options={options} onChange={onValidityValue} />
    </StepSection>
  );
}

function TypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const className = active
    ? "bg-brand-gradient text-white font-semibold"
    : "bg-white border border-border-subtle text-text-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 w-22 rounded-lg text-xs cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

function buildOptions(max: number, unit: "month" | "week") {
  return [
    { value: 0, label: "Select a value" },
    ...Array.from({ length: max }, (_, i) => ({
      value: i + 1,
      label: `${i + 1} ${unit}${i === 0 ? "" : "s"}`,
    })),
  ];
}
