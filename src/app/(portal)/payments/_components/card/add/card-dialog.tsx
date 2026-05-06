"use client";

import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import DialogHeader from "@/components/ui/dialog-header";
import Modal from "@/components/ui/modal";
import { addCardPaymentMethod } from "@/lib/actions/payment.actions";
import AddCard, { type AddCardState } from "./add-card";
import type { CardPaymentMethod } from "@/lib/types/card";

interface CardDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded?: (card: CardPaymentMethod) => void;
}

const FORM_ID = "add-card-form";

export default function CardDialog({ open, onClose, onAdded }: CardDialogProps) {
  const [state, setState] = useState<AddCardState>({ ready: false, submitting: false });

  const handleSuccess = (card: CardPaymentMethod) => {
    toast.success("Card added");
    onAdded?.(card);
    onClose();
  };

  const handleStateChange = useCallback((next: AddCardState) => {
    setState(next);
  }, []);

  return (
    <Modal open={open} onClose={onClose} width="max-w-[460px]" showClose={false}>
      <DialogHeader
        iconSrc="/assets/icons/card/chip.svg"
        title="Add a New Card"
        onClose={onClose}
      />

      <div className="px-6 pt-6">
        {open && (
          <AddCard
            formId={FORM_ID}
            submit={addCardPaymentMethod}
            onSuccess={handleSuccess}
            onStateChange={handleStateChange}
          />
        )}
      </div>

      <div className="flex items-center gap-2 px-6 py-5">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={state.submitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form={FORM_ID}
          variant="primary"
          loading={state.submitting}
          loadingText="Saving…"
          disabled={!state.ready}
          className="flex-1"
        >
          Save Card
        </Button>
      </div>
    </Modal>
  );
}
