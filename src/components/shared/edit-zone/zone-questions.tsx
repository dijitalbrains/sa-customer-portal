"use client";

import TabButtonGroup from "@/components/ui/tab-button-group";

const HOUSEHOLD_OPTIONS = [
  { value: 0, label: "Must select an option from drop down", disabled: true },
  { value: 2, label: "2 people drinking the water" },
  { value: 3, label: "3+ people drinking the water" },
];

const YES_NO_OPTIONS = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

interface ZoneQuestionsProps {
  householdSize: number;
  isWellWater: boolean | null;
  hasFiltrationSystem: boolean | null;
  hasMicronSystem: boolean | null;
  onHouseholdSize: (n: number) => void;
  onIsWellWater: (v: boolean) => void;
  onHasFiltrationSystem: (v: boolean) => void;
  onHasMicronSystem: (v: boolean) => void;
}

export default function ZoneQuestions({
  householdSize,
  isWellWater,
  hasFiltrationSystem,
  hasMicronSystem,
  onHouseholdSize,
  onIsWellWater,
  onHasFiltrationSystem,
  onHasMicronSystem,
}: ZoneQuestionsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-text-heading">
          How many people will be drinking the water?
        </span>
        <select
          value={householdSize}
          onChange={(e) => onHouseholdSize(Number(e.target.value))}
          className="w-full h-10 px-3 pr-8 appearance-none rounded-[8px] bg-white border border-border-subtle text-[13px] text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer"
        >
          {HOUSEHOLD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-text-heading">
          Are you currently on well water?
        </span>
        <TabButtonGroup options={YES_NO_OPTIONS} value={isWellWater} onChange={onIsWellWater} />
      </div>

      {isWellWater && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-text-heading">
            Do you have a water softener or whole house filtration system installed now?
          </span>
          <TabButtonGroup
            options={YES_NO_OPTIONS}
            value={hasFiltrationSystem}
            onChange={onHasFiltrationSystem}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-text-heading">
          Do you have a whole house 5 micron system?
        </span>
        <TabButtonGroup
          options={YES_NO_OPTIONS}
          value={hasMicronSystem}
          onChange={onHasMicronSystem}
        />
      </div>
    </div>
  );
}
