"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import DialogHeader from "@/components/ui/dialog-header";
import InputField from "@/components/ui/input-field";
import Modal from "@/components/ui/modal";
import { updateCredits } from "@/lib/actions/user-credits.actions";

interface UpdateCreditsModalProps {
  open: boolean;
  onClose: () => void;
  currentCredits: number;
}

export default function UpdateCreditsModal({
  open,
  onClose,
  currentCredits,
}: UpdateCreditsModalProps) {
  const [amount, setAmount] = useState(String(currentCredits));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const handleSave = () => {
    setError(null);
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid credit amount.");
      return;
    }
    startSaving(async () => {
      try {
        await updateCredits({ newCredits: parsed, notes: notes.trim() || null });
        toast.success("Credits updated");
        onClose();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update credits";
        toast.error(message);
        setError(message);
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-[440px]" showClose={false}>
      <DialogHeader
        iconSrc="/assets/icons/edit-pencil.svg"
        title="Update Credits"
        subtitle={`Current balance: $${currentCredits}`}
        onClose={onClose}
      />

      <div className="px-7 py-6 flex flex-col gap-4">
        <InputField
          label="New credit amount"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
        />

        <div className="flex flex-col gap-1.5 w-full">
          <span className="text-[12px] font-semibold text-text-heading">
            Note <span className="font-normal text-text-muted">(optional)</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Reason for this adjustment…"
            className="w-full px-3 py-2 rounded-[8px] bg-white border border-border-subtle text-[13px] text-text-primary focus:outline-none focus:border-brand-primary resize-none"
          />
        </div>

        {error && (
          <div className="rounded-[8px] bg-[#FCEBEB] border border-[#791F1F40] px-3 py-2 text-[12px] text-[#791F1F]">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={saving}
            loadingText="Saving…"
            onClick={handleSave}
            className="flex-1"
          >
            Update Credits
          </Button>
        </div>
      </div>
    </Modal>
  );
}
