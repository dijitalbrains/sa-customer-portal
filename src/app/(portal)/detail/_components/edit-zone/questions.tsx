"use client";

const HOUSEHOLD_OPTIONS = [
  { value: 0, label: "Must select an option from drop down", disabled: true },
  { value: 2, label: "2 people drinking the water" },
  { value: 3, label: "3+ people drinking the water" },
];

interface QuestionsProps {
  householdSize: number;
  isWellWater: boolean | null;
  hasFiltrationSystem: boolean | null;
  hasMicronSystem: boolean | null;
  onHouseholdSize: (n: number) => void;
  onIsWellWater: (v: boolean) => void;
  onHasFiltrationSystem: (v: boolean) => void;
  onHasMicronSystem: (v: boolean) => void;
}

export default function Questions({
  householdSize,
  isWellWater,
  hasFiltrationSystem,
  hasMicronSystem,
  onHouseholdSize,
  onIsWellWater,
  onHasFiltrationSystem,
  onHasMicronSystem,
}: QuestionsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-text-heading">
          How many people will be drinking the water?
        </span>
        <select
          value={householdSize}
          onChange={(e) => onHouseholdSize(Number(e.target.value))}
          className="w-full h-10 px-3 pr-8 appearance-none rounded-lg bg-white border border-border-subtle text-[13px] text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer"
        >
          {HOUSEHOLD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <YesNoQuestion
        label="Are you currently on well water?"
        value={isWellWater}
        onChange={onIsWellWater}
      />

      {isWellWater && (
        <YesNoQuestion
          label="Do you have a water softener or whole house filtration system installed now?"
          value={hasFiltrationSystem}
          onChange={onHasFiltrationSystem}
        />
      )}

      <YesNoQuestion
        label="Do you have a whole house 5 micron system?"
        value={hasMicronSystem}
        onChange={onHasMicronSystem}
      />
    </div>
  );
}

interface YesNoQuestionProps {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}

function YesNoQuestion({ label, value, onChange }: YesNoQuestionProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-text-heading">{label}</span>
      <div className="flex gap-2">
        <TabButton active={value === true} onClick={() => onChange(true)}>
          Yes
        </TabButton>
        <TabButton active={value === false} onClick={() => onChange(false)}>
          No
        </TabButton>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
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
