"use client";

interface TabButtonOption<T> {
  label: string;
  value: T;
}

interface TabButtonGroupProps<T> {
  options: TabButtonOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export default function TabButtonGroup<T>({ options, value, onChange }: TabButtonGroupProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-8 w-22 rounded-lg text-xs cursor-pointer ${
            value === option.value
              ? "bg-brand-gradient text-white font-semibold"
              : "bg-white border border-border-subtle text-text-muted"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
