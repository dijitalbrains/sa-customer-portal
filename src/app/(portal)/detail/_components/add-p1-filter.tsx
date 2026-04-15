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
      className="w-full text-center py-3 rounded-lg border border-dashed border-brand-primary text-[13px] font-semibold text-brand-primary hover:bg-brand-surface transition-colors disabled:opacity-60 cursor-pointer"
    >
      {pending ? "Adding..." : "+ Add P1 Filter"}
    </button>
  );
}
