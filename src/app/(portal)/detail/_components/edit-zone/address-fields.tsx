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

const FIELD_CLASS =
  "w-full h-10 px-3 rounded-lg bg-white border border-border-subtle text-[13px] text-text-primary focus:outline-none focus:border-brand-primary";
const SELECT_CLASS = `${FIELD_CLASS} appearance-none cursor-pointer pr-8`;

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
        className={SELECT_CLASS}
      >
        <option value="" disabled>
          Country
        </option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={stateId ?? ""}
        onChange={(e) => onState(Number(e.target.value))}
        disabled={loadingStates || states.length === 0}
        className={`${SELECT_CLASS} disabled:opacity-60`}
      >
        <option value="" disabled>
          {loadingStates ? "Loading…" : "State / Province"}
        </option>
        {states.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={city}
        onChange={(e) => onCity(e.target.value)}
        placeholder="City"
        className={FIELD_CLASS}
      />

      <input
        type="text"
        value={zip}
        onChange={(e) => onZip(e.target.value)}
        placeholder="Enter Zip / Postal code"
        className={FIELD_CLASS}
      />
    </div>
  );
}
