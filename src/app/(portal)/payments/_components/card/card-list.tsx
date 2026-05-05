"use client";

import { useTransition } from "react";
import { toast } from "react-toastify";
import { useConfirmation } from "@/components/providers/confirmation-provider";
import {
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "@/lib/actions/payment.actions";
import type { CardPaymentMethod } from "@/lib/types/card";
import CardItem from "./card-item";

interface CardListProps {
  cards: CardPaymentMethod[];
}

export default function CardList({ cards }: CardListProps) {
  const { confirm } = useConfirmation();
  const [, startTransition] = useTransition();

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          onEdit={() => toast.info("Card editing coming soon")}
          onRemove={() => handleRemove(card)}
          onSetDefault={() => handleSetDefault(card)}
        />
      ))}
    </div>
  );
}
