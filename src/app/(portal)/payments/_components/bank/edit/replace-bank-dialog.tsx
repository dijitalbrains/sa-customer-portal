"use client";

import DialogHeader from "@/components/ui/dialog-header";
import Modal from "@/components/ui/modal";
import type { BankPaymentMethod } from "@/lib/types/bank";
import type { CardPaymentMethod } from "@/lib/types/card";
import ReplaceBank from "./replace-bank";

interface ReplaceBankDialogProps {
  open: boolean;
  bank: BankPaymentMethod | null;
  allBanks: BankPaymentMethod[];
  allCards: CardPaymentMethod[];
  onClose: () => void;
  onAfterReplace?: () => void | Promise<void>;
}

export default function ReplaceBankDialog({
  open,
  bank,
  allBanks,
  allCards,
  onClose,
  onAfterReplace,
}: ReplaceBankDialogProps) {
  if (!bank) return null;

  const subtitle = `${(bank.bankName ?? "Bank").toUpperCase()} ****${bank.last4 ?? "****"} · Select replacement below`;

  const handleReplaced = async () => {
    if (onAfterReplace) {
      await Promise.resolve(onAfterReplace()).catch(() => {});
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-[480px]" showClose={false}>
      <DialogHeader
        iconSrc="/assets/icons/card/chip.svg"
        title="Replace Bank Account"
        subtitle={subtitle}
        onClose={onClose}
      />

      <div className="px-6 py-6">
        <ReplaceBank
          oldBank={bank}
          allBanks={allBanks}
          allCards={allCards}
          onBack={onClose}
          onReplaced={handleReplaced}
        />
      </div>
    </Modal>
  );
}
