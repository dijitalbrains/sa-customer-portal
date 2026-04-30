"use client";

interface InputFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "tel" | "email" | "password" | "number";
  disabled?: boolean;
}

export default function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <span className="text-[12px] font-semibold text-text-heading">{label}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-9 px-3 rounded-[8px] bg-white border border-border-subtle text-[13px] text-text-primary focus:outline-none focus:border-brand-primary disabled:opacity-60"
      />
    </div>
  );
}
