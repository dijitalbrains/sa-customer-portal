"use client";

import DropdownField from "@/components/ui/dropdown-field";
import InputField from "@/components/ui/input-field";
import type { CountryOption, StateOption } from "@/lib/types/reference";

interface AddressFieldsProps {
  countries: CountryOption[];
  states: StateOption[];
  loadingStates: boolean;
  countryId: number | null;
  stateId: number | null;
  city: string;
  zip: string;
  onCountry: (id: number) => void;
  onState: (id: number) => void;
  onCity: (city: string) => void;
  onZip: (zip: string) => void;
}

export default function AddressFields({
  countries,
  states,
  loadingStates,
  countryId,
  stateId,
  city,
  zip,
  onCountry,
  onState,
  onCity,
  onZip,
}: AddressFieldsProps) {
  const countryOptions = countries.map((country) => ({
    value: country.id,
    label: country.name,
  }));
  const stateOptions = states.map((state) => ({
    value: state.id,
    label: state.name,
  }));

  return (
    <div className="grid grid-cols-2 gap-3">
      <DropdownField
        value={countryId}
        onChange={onCountry}
        options={countryOptions}
        placeholder="Country"
      />

      <DropdownField
        value={stateId}
        onChange={onState}
        options={stateOptions}
        placeholder={loadingStates ? "Loading…" : "State / Province"}
        disabled={loadingStates || states.length === 0}
      />

      <InputField value={city} onChange={onCity} placeholder="City" />

      <InputField value={zip} onChange={onZip} placeholder="Enter Zip / Postal code" />
    </div>
  );
}
