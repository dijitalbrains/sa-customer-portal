"use client";

import IntlTelInput from "intl-tel-input/react";
import type { Iso2 } from "intl-tel-input";
import "intl-tel-input/styles";

interface PhoneFieldProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onValidityChange?: (isValid: boolean) => void;
  error?: string;
  placeholder?: string;
  defaultCountry?: Iso2;
  countryOrder?: Iso2[];
}

export default function PhoneField({
  label,
  value,
  onChange,
  onBlur,
  onValidityChange,
  error,
  placeholder,
  defaultCountry = "us",
  countryOrder = ["us", "ca", "gb"],
}: PhoneFieldProps) {
  return (
    <div className="flex flex-col">
      <div className="bg-surface-base border border-[#D1D6E0] rounded-[10px] px-3 pt-[7px] pb-[5px] phone-field">
        <label className="block text-[9px] font-semibold uppercase tracking-[0.5px] text-text-muted">
          {label}
        </label>
        <IntlTelInput
          value={value ?? ""}
          onChangeNumber={(num) => onChange?.(num)}
          onChangeValidity={(valid) => onValidityChange?.(valid)}
          initialCountry={defaultCountry}
          countryOrder={countryOrder}
          separateDialCode
          nationalMode={false}
          loadUtils={() => import("intl-tel-input/utils")}
          inputProps={{
            placeholder,
            onBlur,
            className:
              "block w-full bg-transparent text-[13px] font-normal text-text-primary focus:outline-none placeholder:text-text-muted/60",
          }}
        />
      </div>
      {error && <span className="text-[11px] text-status-error-text mt-1">{error}</span>}
    </div>
  );
}
