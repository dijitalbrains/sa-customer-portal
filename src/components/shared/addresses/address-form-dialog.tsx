"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  getStatesForCountry,
  migrateSubscriptions,
  saveAddress,
  updateAddress,
} from "@/lib/actions/address.actions";
import LoadingSpinner from "@/components/ui/loading-spinner";
import InputField from "@/components/ui/input-field";
import DropdownField from "@/components/ui/dropdown-field";
import PhoneField from "@/components/ui/phone-field";
import type { AddressInput, UserAddressView } from "@/lib/types/address";
import type { CountryOption, StateOption } from "@/lib/types/reference";

export type AddressDialogMode = "edit" | "remove";

interface AddressFormDialogProps {
  open: boolean;
  onClose: () => void;
  countries: CountryOption[];
  address: UserAddressView | null;
  allAddresses: UserAddressView[];
  mode?: AddressDialogMode;
}

interface FormState {
  countryId: number | null;
  stateId: number | null;
  name: string;
  phone: string;
  street: string;
  apartment: string;
  city: string;
  zip: string;
  isDefault: boolean;
  deliveryInstructions: string;
}

const NEW_ADDRESS_VALUE = "new";

export default function AddressFormDialog({
  open,
  onClose,
  countries,
  address,
  allAddresses,
  mode = "edit",
}: AddressFormDialogProps) {
  const isEdit = address !== null;
  const requireMigration = address !== null && address.activeSubscriptions > 0;
  const isRemove = mode === "remove";

  const [picker, setPicker] = useState<string>(requireMigration ? NEW_ADDRESS_VALUE : "");
  const [form, setForm] = useState<FormState>(() => initialForm(address));
  const [states, setStates] = useState<StateOption[]>([]);
  const [loadingStates, startLoadStates] = useTransition();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initialForm(address));
      setPicker(requireMigration ? NEW_ADDRESS_VALUE : "");
      setError(null);
    }
  }, [open, address, requireMigration]);

  useEffect(() => {
    if (form.countryId === null) {
      setStates([]);
      return;
    }
    startLoadStates(async () => {
      const next = await getStatesForCountry(form.countryId as number);
      setStates(next);
    });
  }, [form.countryId]);

  const pickedExistingId =
    requireMigration && picker !== "" && picker !== NEW_ADDRESS_VALUE
      ? Number(picker)
      : null;

  const showFormFields = !requireMigration || picker === NEW_ADDRESS_VALUE;

  const otherAddresses = address ? allAddresses.filter((a) => a.id !== address.id) : [];

  const pickerOptions = useMemo(
    () => [
      { value: NEW_ADDRESS_VALUE, label: "Add new address" },
      ...otherAddresses.map((a) => ({ value: String(a.id), label: a.formatted })),
    ],
    [otherAddresses],
  );

  const countryOptions = useMemo(
    () => countries.map((c) => ({ value: c.id, label: c.name })),
    [countries],
  );

  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s.id, label: s.name })),
    [states],
  );

  const handlePickerChange = (value: string) => {
    setPicker(value);
    setError(null);
  };

  const submit = () => {
    setError(null);

    if (requireMigration && pickedExistingId !== null && address) {
      startSaving(async () => {
        try {
          await migrateSubscriptions(address.id, pickedExistingId, isRemove);
          toast.success(
            isRemove ? "Subscriptions moved and address removed" : "Subscriptions moved",
          );
          onClose();
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to move subscriptions";
          toast.error(message);
          setError(message);
        }
      });
      return;
    }

    if (!validateFields(form)) {
      setError("Please fill in every required field.");
      return;
    }

    const payload = toAddressInput(form);

    startSaving(async () => {
      try {
        if (requireMigration && address) {
          await saveAddress(payload, address.id, isRemove);
          toast.success(
            isRemove
              ? "Address added, subscriptions moved, original removed"
              : "Address added and subscriptions moved",
          );
        } else if (isEdit && address) {
          await updateAddress(address.id, payload);
          toast.success("Address updated");
        } else {
          await saveAddress(payload);
          toast.success("Address added");
        }
        onClose();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to save address";
        toast.error(message);
        setError(message);
      }
    });
  };

  const submitLabel = saving
    ? "Saving…"
    : pickedExistingId !== null
      ? isRemove
        ? "Move & Remove"
        : "Move Subscriptions"
      : requireMigration
        ? isRemove
          ? "Add, Move & Remove"
          : "Add Address & Move Subscriptions"
        : isEdit
          ? "Update Address"
          : "Save Address";

  const headerTitle = isRemove ? "Remove Address" : isEdit ? "Edit Address" : "Add New Address";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-text-heading/50 backdrop-blur-[2px]" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <DialogPanel className="relative bg-white rounded-3xl shadow-[0px_0px_0px_1px_rgba(55,146,222,0.08),0px_32px_80px_-8px_rgba(8,20,40,0.5)] w-full max-w-[560px]">
          <FormHeader title={headerTitle} onClose={onClose} />

          <div className="px-7 py-6 flex flex-col gap-3.5">
            {requireMigration && (
              <div className="flex flex-col gap-3">
                <div className="rounded-[8px] bg-[#eef6fc] px-3 py-2.5">
                  <p className="text-[12px] text-text-muted">
                    This address is linked to {address?.activeSubscriptions} active subscription
                    {address?.activeSubscriptions === 1 ? "" : "s"}.{" "}
                    {isRemove
                      ? "Choose where to move the subscriptions before the address is removed."
                      : "Select an existing address or enter a new address to update your country/region setting."}
                  </p>
                </div>

                <DropdownField
                  label="Select Address"
                  value={picker || NEW_ADDRESS_VALUE}
                  onChange={handlePickerChange}
                  options={pickerOptions}
                />

                {showFormFields && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border-subtle" />
                    <span className="text-[11px] font-semibold text-text-muted">OR</span>
                    <div className="flex-1 h-px bg-border-subtle" />
                  </div>
                )}
              </div>
            )}

            {showFormFields && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <DropdownField
                    label="Country"
                    value={form.countryId}
                    onChange={(value) =>
                      setForm((p) => ({ ...p, countryId: value, stateId: null }))
                    }
                    options={countryOptions}
                    placeholder="Country"
                  />
                  <DropdownField
                    label="State"
                    value={form.stateId}
                    onChange={(value) => setForm((p) => ({ ...p, stateId: value }))}
                    options={stateOptions}
                    placeholder={loadingStates ? "Loading…" : "State / Province"}
                    disabled={loadingStates || stateOptions.length === 0}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Enter name (first and last name)"
                    value={form.name}
                    onChange={(name) => setForm((p) => ({ ...p, name }))}
                    placeholder="Name"
                  />
                  <PhoneField
                    label="Phone number"
                    value={form.phone}
                    onChange={(phone) => setForm((p) => ({ ...p, phone }))}
                    inlineLabel={false}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Address"
                    value={form.street}
                    onChange={(street) => setForm((p) => ({ ...p, street }))}
                    placeholder="Street address or P.O Box"
                    disabled={form.countryId === null}
                  />
                  <InputField
                    label="Apartment"
                    value={form.apartment}
                    onChange={(apartment) => setForm((p) => ({ ...p, apartment }))}
                    placeholder="Apt, Suite, Unit, Building (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="City"
                    value={form.city}
                    onChange={(city) => setForm((p) => ({ ...p, city }))}
                    placeholder="City"
                  />
                  <InputField
                    label="Zip / Postal Code"
                    value={form.zip}
                    onChange={(zip) => setForm((p) => ({ ...p, zip }))}
                    placeholder="Enter Zip / Postal code"
                  />
                </div>

                {(!isEdit || requireMigration) && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, isDefault: e.target.checked }))
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[13px] text-text-primary">
                      Make this my default address
                    </span>
                  </label>
                )}

                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[12px] font-semibold text-text-heading">
                    Special delivery instructions{" "}
                    <span className="font-normal text-text-muted">(optional)</span>
                  </span>
                  <textarea
                    value={form.deliveryInstructions}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, deliveryInstructions: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 rounded-[8px] bg-white border border-border-subtle text-[13px] text-text-primary focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>
              </>
            )}

            {error && <p className="text-xs text-status-error-text">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="h-11 mt-2 rounded-pill bg-brand-gradient shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] text-white font-bold text-sm hover:opacity-95 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size={16} className="border-white/30 border-t-white" />}
              {submitLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="border-b border-border-subtle/50">
      <div className="flex items-center justify-between gap-3 px-7 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[#eef6fc] flex items-center justify-center">
            <img src="/assets/icons/figma/pin.svg" alt="" className="w-7 h-7 p-1" />
          </span>
          <h3 className="font-bold text-[17px] text-text-heading leading-tight">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-overlay cursor-pointer"
        >
          <img src="/assets/icons/figma/close.svg" alt="" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function initialForm(address: UserAddressView | null): FormState {
  if (!address) return emptyForm();
  if (address.activeSubscriptions > 0) return emptyForm();
  return {
    countryId: address.countryId,
    stateId: address.stateId,
    name: address.name ?? "",
    phone: address.phone ?? "",
    street: address.street,
    apartment: address.apartment ?? "",
    city: address.city,
    zip: address.zip,
    isDefault: address.isDefault,
    deliveryInstructions: address.deliveryInstructions ?? "",
  };
}

function emptyForm(): FormState {
  return {
    countryId: null,
    stateId: null,
    name: "",
    phone: "",
    street: "",
    apartment: "",
    city: "",
    zip: "",
    isDefault: false,
    deliveryInstructions: "",
  };
}

function validateFields(form: FormState): boolean {
  return (
    form.countryId !== null &&
    form.stateId !== null &&
    form.name.trim() !== "" &&
    form.street.trim() !== "" &&
    form.city.trim() !== "" &&
    form.zip.trim() !== ""
  );
}

function toAddressInput(form: FormState): AddressInput {
  return {
    countryId: form.countryId as number,
    stateId: form.stateId as number,
    name: form.name.trim(),
    phone: form.phone.trim() || null,
    street: form.street.trim(),
    apartment: form.apartment.trim() || null,
    city: form.city.trim(),
    zip: form.zip.trim(),
    isDefault: form.isDefault,
    deliveryInstructions: form.deliveryInstructions.trim() || null,
  };
}
