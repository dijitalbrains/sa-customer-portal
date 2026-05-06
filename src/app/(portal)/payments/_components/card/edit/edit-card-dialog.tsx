"use client";

import { useEffect, useState } from "react";
import DialogHeader from "@/components/ui/dialog-header";
import Modal from "@/components/ui/modal";
import type { CardPaymentMethod } from "@/lib/types/card";
import EditExpiry from "./edit-expiry";
import ReplaceCard from "./replace-card";

interface EditCardDialogProps {
  open: boolean;
  card: CardPaymentMethod | null;
  allCards: CardPaymentMethod[];
  onClose: () => void;
  onAfterReplace?: () => void | Promise<void>;
}

type Step = "expiry" | "replace";

export default function EditCardDialog({
  open,
  card,
  allCards,
  onClose,
  onAfterReplace,
}: EditCardDialogProps) {
  const [step, setStep] = useState<Step>("expiry");

  useEffect(() => {
    if (open) setStep("expiry");
  }, [open]);

  if (!card) return null;

  const title = step === "expiry" ? "Edit Payment Method" : "Replace Payment Card";

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
        title={title}
        onClose={onClose}
      />

      <div className="px-6 py-6">
        {step === "expiry" && (
          <EditExpiry
            card={card}
            onReplaceClick={() => setStep("replace")}
            onSaved={onClose}
          />
        )}
        {step === "replace" && (
          <ReplaceCard
            oldCard={card}
            allCards={allCards}
            onBack={() => setStep("expiry")}
            onReplaced={handleReplaced}
          />
        )}
      </div>
    </Modal>
  );
}
