import StepSection from "./step-section";
import StepSelect from "./step-select";

const OPTIONS = Array.from({ length: 21 }, (_, i) => ({ value: i, label: String(i) }));

interface StepInventoryProps {
  productName: string;
  value: number;
  onChange: (value: number) => void;
}

export default function StepInventory({ productName, value, onChange }: StepInventoryProps) {
  return (
    <StepSection
      number={1}
      title="Current filter inventory"
      description={`How many unopened/unused ${productName} filters do you have?`}
    >
      <StepSelect value={value} options={OPTIONS} onChange={onChange} />
    </StepSection>
  );
}
