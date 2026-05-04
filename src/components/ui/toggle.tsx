"use client";

import { Switch } from "@headlessui/react";

export type ToggleVariant = "primary" | "purple" | "green";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  variant?: ToggleVariant;
  disabled?: boolean;
}

const VARIANT_BG: Record<ToggleVariant, string> = {
  primary: "bg-brand-gradient",
  purple: "bg-gradient-to-r from-[#7B61FF] to-[#9B7DFF]",
  green: "bg-gradient-to-r from-[#22C55E] to-[#4ADE80]",
};

export default function Toggle({
  checked,
  onChange,
  label,
  variant = "primary",
  disabled,
}: ToggleProps) {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        checked ? VARIANT_BG[variant] : "bg-border-subtle"
      }`}
    >
      {label && <span className="sr-only">{label}</span>}
      <span
        aria-hidden="true"
        className={`inline-block w-[18px] h-[18px] rounded-full bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.2)] transition-transform ${
          checked ? "translate-x-[23px]" : "translate-x-[3px]"
        }`}
      />
    </Switch>
  );
}
