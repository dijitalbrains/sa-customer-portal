"use client";

import { useTransition } from "react";
import { toast } from "react-toastify";
import { useConfirmation } from "@/components/providers/confirmation-provider";
import DialogHeader from "@/components/ui/dialog-header";
import Modal from "@/components/ui/modal";
import { removeCardFromLoyaltyAction } from "@/lib/actions/payment.actions";
import type { CardPaymentMethod } from "@/lib/types/card";

interface RemoveCardDialogProps {
  open: boolean;
  card: CardPaymentMethod | null;
  onClose: () => void;
  onReplaceClick: (card: CardPaymentMethod) => void;
  onRemoved: () => void;
}

export default function RemoveCardDialog({
  open,
  card,
  onClose,
  onReplaceClick,
  onRemoved,
}: RemoveCardDialogProps) {
  const { confirm } = useConfirmation();
  const [submitting, startSubmit] = useTransition();

  if (!card) return null;

  const handleReplace = () => {
    onClose();
    onReplaceClick(card);
  };

  const handleRemoveLoyalty = () => {
    confirm({
      title: "Remove loyalty subscription",
      description:
        "Are you sure you want to opt out of the loyalty program and lose your filter renewal discount?",
      confirmText: "Confirm",
      variant: "danger",
      onConfirm: async () => {
        await new Promise<void>((resolve) => {
          startSubmit(async () => {
            try {
              await removeCardFromLoyaltyAction({ cardId: card.id });
              toast.success("Card and loyalty removed");
              onRemoved();
              onClose();
            } catch (e) {
              const message = e instanceof Error ? e.message : "Failed to remove card";
              toast.error(message);
            } finally {
              resolve();
            }
          });
        });
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-[480px]" showClose={false}>
      <DialogHeader
        iconSrc="/assets/icons/card/chip.svg"
        title="Remove Payment Card"
        onClose={onClose}
      />

      <div className="px-6 py-6 flex flex-col gap-4">
        <div className="rounded-[10px] bg-[#FFF5E5] border border-[#F0B400]/40 px-3 py-2.5 text-[12px] text-[#7A4A00] font-semibold">
          ⚠ This payment method is connected to ({card.activeSubscriptions}) subscription
          {card.activeSubscriptions === 1 ? "" : "s"}.
        </div>

        <p className="text-[12px] text-text-muted">
          Please choose from the options below on how to proceed:
        </p>

        <button
          type="button"
          onClick={handleReplace}
          disabled={submitting}
          className="text-left flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] bg-brand-gradient text-white shadow-[0px_3px_8px_0px_#3792DE40] hover:opacity-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-[12px] font-bold">
              1
            </span>
            <span className="flex flex-col">
              <span className="text-[13px] font-bold">Update or Replace this Card</span>
              <span className="text-[11px] text-white/85">
                Update expiration date or swap to a different saved card
              </span>
            </span>
          </span>
          <span className="text-white/85"> <img alt="" className="w-[8px] h-[10px] -scale-y-100" src="/assets/icons/chevron-tiny.svg"/></span>
        </button>

        <button
          type="button"
          onClick={handleRemoveLoyalty}
          disabled={submitting}
          className="text-left flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] bg-[#FCEBEB] border border-[#791F1F40] hover:opacity-90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-3">
            <span className="w-9 h-6 rounded-full bg-[#791F1F] text-white flex items-center justify-center text-[12px] font-bold">
              2
            </span>
            <span className="flex flex-col">
              <span className="text-[13px] font-bold text-[#791F1F]">
                Remove this Card from Loyalty Program
              </span>
              <span className="text-[11px] text-[#791F1F]/80">
                We will not keep any payment methods. You will not receive loyalty member
                savings on all future filter renewals.
              </span>
            </span>
          </span>
          <span className="text-[#791F1F]">
            <img alt="" className="w-[10px] h-[10px] -scale-y-100" src="/assets/icons/chevron-tiny.svg"/></span>
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="mt-2 w-full h-11 rounded-pill border border-border-subtle bg-[#f7fbfe] text-[13px] font-semibold text-text-primary hover:bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel — Keep this Card
        </button>
      </div>
    </Modal>
  );
}
