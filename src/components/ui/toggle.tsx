"use client";

import { Switch } from "@headlessui/react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? "bg-brand-gradient" : "bg-border-subtle"
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
