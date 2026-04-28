"use client";

import type { LinkedProductOption } from "@/lib/types/subscription";

const ROW_CLASS =
  "h-[30px] px-3 rounded-md bg-surface-base border border-border-field-admin shadow-field flex items-center justify-between";
const TEXT_CLASS = "font-normal text-[13px] text-text-primary whitespace-nowrap";

interface CurrencyRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function CurrencyRow({ label, value, onChange }: CurrencyRowProps) {
  const display = formatNumber(value);
  return (
    <div className={ROW_CLASS}>
      <span className={TEXT_CLASS}>{label}</span>
      <div className={`${TEXT_CLASS} flex items-center justify-end gap-0.5`}>
        <span>$</span>
        <input
          type="text"
          inputMode="decimal"
          size={Math.max(1, display.length)}
          value={display}
          onChange={(e) => onChange(parseDecimal(e.target.value))}
          className="bg-transparent border-0 p-0 focus:outline-none text-right field-sizing-content"
        />
      </div>
    </div>
  );
}

interface SelectRowProps {
  label: string;
  value: number | null;
  options: LinkedProductOption[];
  onChange: (id: number | null) => void;
}

export function SelectRow({ label, value, options, onChange }: SelectRowProps) {
  return (
    <div className={ROW_CLASS}>
      <span className={TEXT_CLASS}>{label}</span>
      <div className="flex items-center justify-end gap-2 min-w-0">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={`${TEXT_CLASS} bg-transparent focus:outline-none appearance-none cursor-pointer truncate`}
        >
          {options.map((opt) => (
            <option key={opt.id ?? "none"} value={opt.id ?? ""}>
              {opt.name}
            </option>
          ))}
        </select>
        <img
          src="/assets/icons/figma/chevron-tiny-down.svg"
          alt=""
          className="w-[5px] h-[9px] rotate-90 shrink-0"
        />
      </div>
    </div>
  );
}

interface QuantityRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function QuantityRow({ label, value, onChange }: QuantityRowProps) {
  const decrement = () => onChange(Math.max(1, value - 1));
  const increment = () => onChange(value + 1);

  return (
    <div className={ROW_CLASS}>
      <span className={TEXT_CLASS}>{label}</span>
      <div className="flex items-center">
        <StepButton icon="qty-minus" onClick={decrement} label="Decrease" />
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(parseQuantity(e.target.value))}
          className={`${TEXT_CLASS} bg-transparent focus:outline-none w-7 text-center`}
        />
        <StepButton icon="qty-plus" onClick={increment} label="Increase" />
      </div>
    </div>
  );
}

function StepButton({
  icon,
  onClick,
  label,
}: {
  icon: "qty-plus" | "qty-minus";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-5 h-5 cursor-pointer shrink-0"
    >
      <img src={`/assets/icons/figma/${icon}.svg`} alt="" className="w-full h-full" />
    </button>
  );
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? String(round2(value)) : "0";
}

function parseDecimal(input: string): number {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (cleaned === "" || cleaned === ".") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseQuantity(input: string): number {
  const cleaned = input.replace(/[^\d]/g, "");
  if (cleaned === "") return 1;
  const parsed = Number(cleaned);
  return Math.max(1, Number.isFinite(parsed) ? parsed : 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
