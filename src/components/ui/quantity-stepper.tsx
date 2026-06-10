"use client";

interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export default function QuantityStepper({
  value,
  min,
  max,
  disabled = false,
  onChange,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  const buttonBase =
    "w-6 h-6 flex items-center justify-center text-[16px] leading-none font-semibold transition-opacity";
  const enabledStyle = "text-brand-primary cursor-pointer hover:opacity-80";
  const disabledStyle = "text-text-muted opacity-40 cursor-not-allowed";

  return (
    <div className="inline-flex items-center gap-2 h-8 px-2 rounded-full border border-border-subtle bg-white">
      <button
        type="button"
        onClick={() => !disabled && !atMin && onChange(value - 1)}
        disabled={disabled || atMin}
        aria-label="Decrease quantity"
        className={`${buttonBase} ${disabled || atMin ? disabledStyle : enabledStyle}`}
      >
        −
      </button>
      <span className="min-w-[20px] text-center text-[14px] font-semibold text-text-heading">
        {value}
      </span>
      <button
        type="button"
        onClick={() => !disabled && !atMax && onChange(value + 1)}
        disabled={disabled || atMax}
        aria-label="Increase quantity"
        className={`${buttonBase} ${disabled || atMax ? disabledStyle : enabledStyle}`}
      >
        +
      </button>
    </div>
  );
}
