"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { useConfirmation } from "@/components/providers/confirmation-provider";
import DefaultMessageDialog from "@/components/shared/default-message-dialog";
import {
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "@/lib/actions/payment.actions";
import type { BankPaymentMethod } from "@/lib/types/bank";
import type { CardPaymentMethod } from "@/lib/types/card";
import BankItem from "./bank-item";
import RemoveBankDialog from "./remove/remove-bank-dialog";
import ReplaceBankDialog from "./edit/replace-bank-dialog";

interface BankListProps {
  banks: BankPaymentMethod[];
  cards: CardPaymentMethod[];
}

export default function BankList({ banks, cards }: BankListProps) {
  const { confirm } = useConfirmation();
  const [, startTransition] = useTransition();
  const [removing, setRemoving] = useState<BankPaymentMethod | null>(null);
  const [replacing, setReplacing] = useState<BankPaymentMethod | null>(null);
  const [deleteAfterReplace, setDeleteAfterReplace] = useState(false);
  const [defaultBlocked, setDefaultBlocked] = useState(false);

  const handleSetDefault = (bank: BankPaymentMethod) => {
    startTransition(async () => {
      try {
        await setDefaultPaymentMethod({ type: "bank", id: bank.id });
        toast.success("Default bank account updated");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to set default";
        toast.error(message);
      }
    });
  };

  const handleRemove = (bank: BankPaymentMethod) => {
    if (bank.isDefault) {
      setDefaultBlocked(true);
      return;
    }
    if (bank.activeSubscriptions > 0) {
      setRemoving(bank);
      return;
    }
    confirm({
      title: "Remove bank account?",
      description: `Are you sure you want to remove the bank account ending in ${bank.last4 ?? "****"}?`,
      confirmText: "Remove",
      variant: "danger",
      onConfirm: async () => {
        try {
          await removePaymentMethod({ type: "bank", id: bank.id });
          toast.success("Bank account removed");
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to remove bank account";
          toast.error(message);
        }
      },
    });
  };

  const handleReplaceClose = () => {
    setReplacing(null);
    setDeleteAfterReplace(false);
  };

  const handleAfterReplace = async () => {
    if (!replacing) return;
    try {
      await removePaymentMethod({ type: "bank", id: replacing.id });
      toast.success("Original bank account removed");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to remove original bank account";
      toast.error(message);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
        {banks.map((bank) => (
          <BankItem
            key={bank.id}
            bank={bank}
            onRemove={() => handleRemove(bank)}
            onSetDefault={() => handleSetDefault(bank)}
          />
        ))}
      </div>

      <RemoveBankDialog
        open={removing !== null}
        bank={removing}
        onClose={() => setRemoving(null)}
        onReplaceClick={(bank) => {
          setReplacing(bank);
          setDeleteAfterReplace(true);
        }}
        onRemoved={() => setRemoving(null)}
      />

      <ReplaceBankDialog
        open={replacing !== null}
        bank={replacing}
        allBanks={banks}
        allCards={cards}
        onClose={handleReplaceClose}
        onAfterReplace={deleteAfterReplace ? handleAfterReplace : undefined}
      />

      <DefaultMessageDialog
        open={defaultBlocked}
        onClose={() => setDefaultBlocked(false)}
        title="Cannot remove default bank account"
        message="Please set another bank account as your default before removing this one."
      />
    </>
  );
}
