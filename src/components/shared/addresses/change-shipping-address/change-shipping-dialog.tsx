"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import DialogHeader from "@/components/ui/dialog-header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Modal from "@/components/ui/modal";
import AddressFormDialog from "@/components/shared/addresses/address-form-dialog";
import {
  getAddresses,
  getCountries,
} from "@/lib/actions/address.actions";
import {
  updateSubscriptionItemShippingAddress,
  type ShippingChangeType,
} from "@/lib/actions/renewal-detail.actions";
import type { UserAddressView } from "@/lib/types/address";
import type { CountryOption } from "@/lib/types/reference";
import SelectedAddressCard from "./selected-address-card";

interface ChangeShippingDialogProps {
  open: boolean;
  onClose: () => void;
  subscriptionItemId: number;
  currentAddressId: number;
  type?: ShippingChangeType;
}

type View = "list" | "adding";

export default function ChangeShippingDialog({
  open,
  onClose,
  subscriptionItemId,
  currentAddressId,
  type = "subscription-detail",
}: ChangeShippingDialogProps) {
  const [view, setView] = useState<View>("list");
  const [addresses, setAddresses] = useState<UserAddressView[] | null>(null);
  const [countries, setCountries] = useState<CountryOption[] | null>(null);
  const [selectedId, setSelectedId] = useState<number>(currentAddressId);
  const [saving, startSaving] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setView("list");
    setSelectedId(currentAddressId);
    setLoadError(null);
    setAddresses(null);
    setCountries(null);

    let cancelled = false;
    Promise.all([getAddresses(), getCountries()])
      .then(([addrs, ctry]) => {
        if (cancelled) return;
        setAddresses(addrs);
        setCountries(ctry);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load addresses");
      });
    return () => {
      cancelled = true;
    };
  }, [open, currentAddressId]);

  const handleSave = () => {
    if (!selectedId) return;
    startSaving(async () => {
      try {
        await updateSubscriptionItemShippingAddress({
          subscriptionItemId,
          userAddressId: selectedId,
          type,
        });
        toast.success("Shipping address updated");
        onClose();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update shipping address";
        toast.error(message);
      }
    });
  };

  const handleNewAddressCreated = async (newAddressId: number) => {
    try {
      await updateSubscriptionItemShippingAddress({
        subscriptionItemId,
        userAddressId: newAddressId,
        type,
      });
      toast.success("Address added and shipping updated");
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update shipping address";
      toast.error(message);
    }
  };

  if (view === "adding") {
    return (
      <AddressFormDialog
        open={open}
        onClose={() => setView("list")}
        countries={countries ?? []}
        address={null}
        allAddresses={addresses ?? []}
        onCreated={handleNewAddressCreated}
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-[830px]" showClose={false}>
      <DialogHeader
        iconSrc="/assets/icons/pin.svg"
        title="Select Shipping Address"
        onClose={onClose}
      />

      <div className="px-7 py-6 flex flex-col gap-4">
        {loadError && (
          <div className="rounded-[12px] bg-[#FCEBEB] border border-[#791F1F40] px-3 py-2 text-[12px] text-[#791F1F]">
            {loadError}
          </div>
        )}

        {!loadError && (!addresses || !countries) && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {addresses && countries && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {addresses.map((address) => (
                <SelectedAddressCard
                  key={address.id}
                  address={address}
                  selected={selectedId === address.id}
                  onSelect={() => setSelectedId(address.id)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setView("adding")}
                disabled={saving}
                className="flex-1"
              >
                + Add New Address
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={saving}
                loadingText="Saving…"
                onClick={handleSave}
                disabled={selectedId === currentAddressId}
                className="flex-1"
              >
                Save Address
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
