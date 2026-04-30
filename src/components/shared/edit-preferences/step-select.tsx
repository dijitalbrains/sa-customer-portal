interface Option {
  value: number;
  label: string;
}

interface StepSelectProps {
  value: number;
  options: Option[];
  onChange: (value: number) => void;
}

export default function StepSelect({ value, options, onChange }: StepSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none w-full h-9 px-3 pr-8 rounded-[8px] bg-[#f9fafc] border border-border-subtle shadow-[0px_2px_6px_0px_rgba(0,48,82,0.05)] text-xs text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <img
        src="/assets/icons/figma/chevron-up-down.svg"
        alt=""
        className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
      />
    </div>
  );
}
