"use client";

interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface DropdownFieldProps<T extends string | number> {
  label?: string;
  value: T | null;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  disabled?: boolean;
}

export default function DropdownField<T extends string | number>({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: DropdownFieldProps<T>) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const matched = options.find((option) => String(option.value) === event.target.value);
    if (matched) onChange(matched.value);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <span className="text-[12px] font-semibold text-text-heading">{label}</span>
      )}
      <select
        value={value === null ? "" : String(value)}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-9 px-3 pr-8 rounded-[8px] bg-white border border-border-subtle text-[13px] text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-brand-primary disabled:opacity-60"
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
