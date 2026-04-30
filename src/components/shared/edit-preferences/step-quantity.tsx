import StepSection from "./step-section";
import StepSelect from "./step-select";

const ME_RENEWAL_FILTER_KEY = "me-renewal-filter";

const PACK_OPTIONS = [
  { value: 1, label: "1 (Single)" },
  { value: 2, label: "Pack of 2" },
  { value: 3, label: "Pack of 3" },
  { value: 4, label: "Pack of 4" },
];

const ME_FILTER_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

interface StepQuantityProps {
  productKey: string;
  value: number;
  onChange: (value: number) => void;
}

export default function StepQuantity({ productKey, value, onChange }: StepQuantityProps) {
  const isMeFilter = productKey === ME_RENEWAL_FILTER_KEY;

  return (
    <StepSection
      number={4}
      title="Shipment quantity"
      description="How many filters do you want shipped at a time?"
    >
      {isMeFilter ? (
        <StepSelect value={value} options={ME_FILTER_OPTIONS} onChange={onChange} />
      ) : (
        <PackGrid value={value} onChange={onChange} />
      )}
    </StepSection>
  );
}

interface PackGridProps {
  value: number;
  onChange: (value: number) => void;
}

function PackGrid({ value, onChange }: PackGridProps) {
  return (
    <div className="grid grid-cols-2 rounded-[10px] border border-border-subtle bg-white shadow-[0px_2px_6px_0px_rgba(0,48,82,0.05)] overflow-hidden">
      {PACK_OPTIONS.map((opt, i) => (
        <PackCell
          key={opt.value}
          label={opt.label}
          checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          showRightBorder={i % 2 === 0}
          showTopBorder={i >= 2}
        />
      ))}
    </div>
  );
}

interface PackCellProps {
  label: string;
  checked: boolean;
  showRightBorder: boolean;
  showTopBorder: boolean;
  onClick: () => void;
}

function PackCell({ label, checked, showRightBorder, showTopBorder, onClick }: PackCellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3 flex items-center gap-3 cursor-pointer ${
        checked ? "bg-surface-overlay" : "bg-white"
      } ${showRightBorder ? "border-r border-border-subtle/40" : ""} ${
        showTopBorder ? "border-t border-border-subtle/40" : ""
      }`}
    >
      <PackRadio checked={checked} />
      <span
        className={`text-xs ${
          checked ? "font-semibold text-text-primary" : "font-normal text-text-muted"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function PackRadio({ checked }: { checked: boolean }) {
  return (
    <span
      className={`w-4 h-4 rounded-lg flex items-center justify-center ${
        checked ? "border-2 border-brand-primary" : "border border-border-subtle"
      }`}
    >
      {checked && <span className="w-2 h-2 rounded-full bg-brand-gradient" />}
    </span>
  );
}
