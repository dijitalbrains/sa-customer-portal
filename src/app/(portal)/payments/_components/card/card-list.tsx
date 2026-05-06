"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { useConfirmation } from "@/components/providers/confirmation-provider";
import DefaultMessageDialog from "@/components/shared/default-message-dialog";
import {
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "@/lib/actions/payment.actions";
import type { CardPaymentMethod } from "@/lib/types/card";
import CardItem from "./card-item";
import EditCardDialog from "./edit/edit-card-dialog";
import RemoveCardDialog from "./remove/remove-card-dialog";

interface CardListProps {
  cards: CardPaymentMethod[];
}

export default function CardList({ cards }: CardListProps) {
  const { confirm } = useConfirmation();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<CardPaymentMethod | null>(null);
  const [deleteAfterReplace, setDeleteAfterReplace] = useState(false);
  const [removing, setRemoving] = useState<CardPaymentMethod | null>(null);
  const [defaultBlocked, setDefaultBlocked] = useState(false);

  const handleEditClose = () => {
    setEditing(null);
    setDeleteAfterReplace(false);
  };

  const handleAfterReplace = async () => {
    if (!editing) return;
    try {
      await removePaymentMethod({ type: "card", id: editing.id });
      toast.success("Original card removed");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to remove original card";
      toast.error(message);
    }
  };

  const handleSetDefault = (card: CardPaymentMethod) => {
    startTransition(async () => {
      try {
        await setDefaultPaymentMethod({ type: "card", id: card.id });
        toast.success("Default card updated");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to set default";
        toast.error(message);
      }
    });
  };

  const handleRemove = (card: CardPaymentMethod) => {
    if (card.isDefault) {
      setDefaultBlocked(true);
      return;
    }
    if (card.activeSubscriptions > 0) {
      setRemoving(card);
      return;
    }
    confirm({
      title: "Remove card?",
      description: `Are you sure you want to remove the card ending in ${card.last4}?`,
      confirmText: "Remove",
      variant: "danger",
      onConfirm: async () => {
        try {
          await removePaymentMethod({ type: "card", id: card.id });
          toast.success("Card removed");
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to remove card";
          toast.error(message);
        }
      },
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            onEdit={() => setEditing(card)}
            onRemove={() => handleRemove(card)}
            onSetDefault={() => handleSetDefault(card)}
          />
        ))}
      </div>

      <EditCardDialog
        open={editing !== null}
        card={editing}
        allCards={cards}
        onClose={handleEditClose}
        onAfterReplace={deleteAfterReplace ? handleAfterReplace : undefined}
      />

      <RemoveCardDialog
        open={removing !== null}
        card={removing}
        onClose={() => setRemoving(null)}
        onReplaceClick={(card) => {
          setEditing(card);
          setDeleteAfterReplace(true);
        }}
        onRemoved={() => setRemoving(null)}
      />

      <DefaultMessageDialog
        open={defaultBlocked}
        onClose={() => setDefaultBlocked(false)}
        title="Cannot remove default card"
        message="Please set another card as your default before removing this one."
      />
    </>
  );
}
