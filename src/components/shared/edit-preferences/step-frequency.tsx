import StepSection from "./step-section";
import StepSelect from "./step-select";
import TabButtonGroup from "@/components/ui/tab-button-group";
import type { ValidityType } from "@/lib/actions/preferences.actions";

const MONTH_OPTIONS = buildOptions(24, "month");
const WEEK_OPTIONS = buildOptions(80, "week");

const VALIDITY_TYPE_OPTIONS: { label: string; value: ValidityType }[] = [
  { label: "Months", value: "MONTHS" },
  { label: "Weeks", value: "WEEKS" },
];

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
      <div className="mb-2.5">
        <TabButtonGroup
          options={VALIDITY_TYPE_OPTIONS}
          value={validityType}
          onChange={onValidityType}
        />
      </div>
      <StepSelect value={validityValue} options={options} onChange={onValidityValue} />
    </StepSection>
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
