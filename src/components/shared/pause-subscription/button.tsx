"use client";

import { useState } from "react";
import PauseSubscriptionDialog, {
  type PauseItem,
} from "@/components/shared/pause-subscription/dialog";

interface PauseSubscriptionButtonProps {
  items: PauseItem[];
  className?: string;
  children?: React.ReactNode;
}

export default function PauseSubscriptionButton({
  items,
  className = "",
  children = "Pause Subscription",
}: PauseSubscriptionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <PauseSubscriptionDialog open={open} onClose={() => setOpen(false)} items={items} />
    </>
  );
}
