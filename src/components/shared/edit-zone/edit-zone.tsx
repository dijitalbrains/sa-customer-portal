"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { EditZone as fetchEditZoneData, updateZone } from "@/lib/actions/zone.actions";
import type { EditZoneData } from "@/lib/types/zone";
import { useEditZone } from "@/lib/hooks/use-edit-zone";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Modal from "@/components/ui/modal";
import AddressFields from "./address-fields";
import ZoneQuestions from "./zone-questions";
import ZoneSummary from "./zone-summary";

interface EditZoneProps {
  open: boolean;
  onClose: () => void;
  subscriptionId: number;
}

export default function EditZone({
  open,
  onClose,
  subscriptionId,
}: EditZoneProps) {
  const [zoneData, setZoneData] = useState<EditZoneData | null>(null);

  useEffect(() => {
    if (!open) return;
    setZoneData(null);
    fetchEditZoneData(subscriptionId)
      .then(setZoneData)
      .catch(() => {
        toast.error("Failed to load setup");
        onClose();
      });
  }, [open, subscriptionId, onClose]);

  return (
    <Modal open={open} onClose={onClose} width="max-w-[960px]" showClose={false}>
      <Header onClose={onClose} />
      {zoneData ? (
        <EditZoneContainer data={zoneData} onClose={onClose} />
      ) : (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      )}
    </Modal>
  );
}

interface EditZoneContainerProps {
  data: EditZoneData;
  onClose: () => void;
}

function EditZoneContainer({ data, onClose }: EditZoneContainerProps) {
  const zone = useEditZone(data.subscription);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSave =
    zone.view.isComplete &&
    !zone.view.invalidZip &&
    !zone.view.loadingPreview &&
    !saving;

  const submit = () => {
    setError(null);
    if (!zone.view.isComplete) return setError("Please fill in every field.");
    if (zone.view.invalidZip) return setError("Zip code is not supported.");

    startSaving(async () => {
      try {
        await updateZone({
          subscriptionId: data.subscription.id,
          zone: zone.view.preview.zone,
          ...zone.buildZoneInput(),
        });
        toast.success("Setup updated");
        onClose();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to update setup";
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

        <ZoneQuestions
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
          newLinkedFilter={zone.view.preview.linkedProduct}
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
          {saving ? "Saving…" : "Update and Save"}
        </button>
      </div>
    </div>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-b border-border-subtle/50">
      <div className="flex items-center justify-between gap-3 px-7 py-3">
        <div className="flex items-center gap-3">
          <img src="/assets/icons/setup-icon.svg" alt="" />
          <h3 className="font-bold text-[17px] text-text-heading leading-tight">
            Customize your setup
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-7 h-7 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/5 cursor-pointer"
        >
          <img src="/assets/icons/close.svg" alt="" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
