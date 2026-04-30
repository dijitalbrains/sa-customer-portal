"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { useConfirmation } from "@/components/providers/confirmation-provider";
import Breadcrumb from "@/components/ui/breadcrumb";
import EmptyState from "@/components/ui/empty-state";
import { deleteAddress, setDefaultAddress } from "@/lib/actions/address.actions";
import type { UserAddressView } from "@/lib/types/address";
import type { CountryOption } from "@/lib/types/reference";
import AddressCard from "./address-card";
import AddressFormDialog, { type AddressDialogMode } from "./address-form-dialog";
import RemoveDefaultDialog from "./remove-default-dialog";

interface AddressListProps {
  addresses: UserAddressView[];
  countries: CountryOption[];
}

export default function AddressList({ addresses, countries }: AddressListProps) {
  const { confirm } = useConfirmation();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<AddressDialogMode>("edit");
  const [editing, setEditing] = useState<UserAddressView | null>(null);
  const [defaultBlockOpen, setDefaultBlockOpen] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openEdit = (address: UserAddressView) => {
    setEditing(address);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openRemoveWithMigration = (address: UserAddressView) => {
    setEditing(address);
    setFormMode("remove");
    setFormOpen(true);
  };

  const handleSetDefault = (address: UserAddressView) => {
    startTransition(async () => {
      try {
        await setDefaultAddress(address.id);
        toast.success("Default address updated");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to set default";
        toast.error(message);
      }
    });
  };

  const handleRemove = (address: UserAddressView) => {
    if (address.isDefault) {
      setDefaultBlockOpen(true);
      return;
    }
    if (address.activeSubscriptions > 0) {
      openRemoveWithMigration(address);
      return;
    }
    confirm({
      title: "Remove address?",
      description: "Are you sure you want to remove this address?",
      confirmText: "Remove",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAddress(address.id);
          toast.success("Address removed");
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to remove address";
          toast.error(message);
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb page="shipping-addresses" current="Shipping Addresses" />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text-heading">Shipping Addresses</h1>
          <div className="flex items-center gap-2">
            <p className="text-[13px] text-text-muted">
              Manage your delivery addresses for filter renewals
            </p>
            {addresses.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#eef6fc] text-[10px] font-semibold text-brand-primary">
                {addresses.length} saved
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="h-10 px-5 rounded-pill bg-brand-gradient text-white text-sm font-semibold shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] hover:opacity-95 cursor-pointer flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span>
          Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          title="No addresses saved yet"
          message="Add a shipping address to receive your filter renewals."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => openEdit(address)}
              onRemove={() => handleRemove(address)}
              onSetDefault={() => handleSetDefault(address)}
            />
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-[#eef6fc] px-5 py-3 text-[12px] text-text-muted">
        The Default address is used for all new filter renewals. Change it any time via &quot;Set
        as Default&quot;.
      </div>

      {formOpen && (
        <AddressFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          countries={countries}
          address={editing}
          allAddresses={addresses}
          mode={formMode}
        />
      )}

      <RemoveDefaultDialog
        open={defaultBlockOpen}
        onClose={() => setDefaultBlockOpen(false)}
      />
    </div>
  );
}

