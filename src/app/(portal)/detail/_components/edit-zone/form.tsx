"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import {
  updateZone,
  type EditZoneData,
} from "@/lib/actions/zone.actions";
import { useEditZone } from "../../_hooks/use-edit-zone";
import AddressFields from "./address-fields";
import Questions from "./questions";
import ZoneSummary from "./zone-summary";

interface EditZoneFormProps {
  data: EditZoneData;
  onClose: () => void;
}

export default function EditZoneForm({ data, onClose }: EditZoneFormProps) {
  const zone = useEditZone(data.subscription);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSave =
    zone.view.isComplete && !zone.view.invalidZip && !zone.view.loadingPreview && !pending;

  const submit = () => {
    setError(null);
    if (!zone.view.isComplete) return setError("Please fill in every field.");
    if (zone.view.invalidZip) return setError("Zip code is not supported.");

    startTransition(async () => {
      try {
        await updateZone({
          subscriptionId: data.subscription.id,
          zone: zone.view.preview.zone,
          ...zone.toServerInput(),
        });
        toast.success("Setup updated");
        onClose();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update setup";
        toast.error(message);
        setError(message);
      }
    });
  };

  return (
    <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-7">
      <div className="flex flex-col gap-5">
        <AddressFields
          countries={data.countries}
          states={zone.view.states}
          loadingStates={zone.view.loadingStates}
          countryId={zone.view.countryId}
          stateId={zone.view.stateId}
          city={zone.view.city}
          zip={zone.view.zip}
          onCountry={zone.setCountry}
          onState={zone.setState}
          onCity={zone.setCity}
          onZip={zone.setZip}
        />

        <Questions
          householdSize={zone.view.householdSize}
          isWellWater={zone.view.isWellWater}
          hasFiltrationSystem={zone.view.hasFiltrationSystem}
          hasMicronSystem={zone.view.hasMicronSystem}
          onHouseholdSize={zone.setHouseholdSize}
          onIsWellWater={zone.setIsWellWater}
          onHasFiltrationSystem={zone.setHasFiltrationSystem}
          onHasMicronSystem={zone.setHasMicronSystem}
        />
      </div>

      <div className="flex flex-col gap-4">
        <ZoneSummary
          subscription={data.subscription}
          p1Filter={data.p1Filter}
          newZone={zone.view.preview.zone}
          newLinkedProduct={zone.view.preview.linkedProduct}
          newP1ValidityMonths={zone.view.preview.p1ValidityMonths}
          loading={zone.view.loadingPreview}
          invalidZip={zone.view.invalidZip}
          zipValue={zone.view.zip}
        />

        {error && <p className="text-xs text-status-error-text">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={!canSave}
          className="h-11 rounded-pill bg-brand-gradient shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] text-white font-bold text-sm hover:opacity-95 disabled:opacity-60 cursor-pointer mt-auto"
        >
          {pending ? "Saving…" : "Update and Save"}
        </button>
      </div>
    </div>
  );
}
