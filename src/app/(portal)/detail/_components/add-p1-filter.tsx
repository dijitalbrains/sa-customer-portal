"use client";

import { useTransition } from "react";
import { addP1Filter } from "../actions";

interface AddP1FilterProps {
  subscriptionId: number;
}

export default function AddP1Filter({ subscriptionId }: AddP1FilterProps) {
  const [pending, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      await addP1Filter(subscriptionId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={pending}
      className="inline-flex items-center justify-center h-[38px] px-4 py-3 rounded-pill border-[0.5px] border-brand-primary text-sm font-semibold text-brand-primary hover:bg-brand-surface transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
    >
      {pending ? "Adding…" : "+ Add P1 Filter"}
    </button>
  );
}
