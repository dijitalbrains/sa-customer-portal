"use client";

import type { CountryOption, StateOption } from "@/lib/actions/zone.actions";

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
  return (
    <div className="grid grid-cols-2 gap-3">
      <select
        value={countryId ?? ""}
        onChange={(e) => onCountry(Number(e.target.value))}
        className="w-full h-10 px-3 pr-8 rounded-lg bg-white border border-border-subtle text-[13px] text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-brand-primary"
      >
        <option value="" disabled>
          Country
        </option>
        {countries.map((country) => (
          <option key={country.id} value={country.id}>
            {country.name}
          </option>
        ))}
      </select>

      <select
        value={stateId ?? ""}
        onChange={(e) => onState(Number(e.target.value))}
        disabled={loadingStates || states.length === 0}
        className="w-full h-10 px-3 pr-8 rounded-lg bg-white border border-border-subtle text-[13px] text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-brand-primary disabled:opacity-60"
      >
        <option value="" disabled>
          {loadingStates ? "Loading…" : "State / Province"}
        </option>
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={city}
        onChange={(e) => onCity(e.target.value)}
        placeholder="City"
        className="w-full h-10 px-3 rounded-lg bg-white border border-border-subtle text-[13px] text-text-primary focus:outline-none focus:border-brand-primary"
      />

      <input
        type="text"
        value={zip}
        onChange={(e) => onZip(e.target.value)}
        placeholder="Enter Zip / Postal code"
        className="w-full h-10 px-3 rounded-lg bg-white border border-border-subtle text-[13px] text-text-primary focus:outline-none focus:border-brand-primary"
      />
    </div>
  );
}
