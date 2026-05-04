"use client";

import { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

interface HoverTooltipProps {
  content?: string | null;
  children: React.ReactNode;
}

export default function HoverTooltip({ content, children }: HoverTooltipProps) {
  const [open, setOpen] = useState(false);

  if (!content) return <>{children}</>;

  return (
    <Popover className="relative">
      <PopoverButton
        as="div"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="focus:outline-none"
      >
        {children}
      </PopoverButton>
      {open && (
        <PopoverPanel
          static
          anchor={{ to: "top", gap: 8 }}
          className="z-50 rounded-lg bg-text-heading text-white text-xs px-3 py-2 shadow-lg max-w-[220px] text-center"
        >
          {content}
        </PopoverPanel>
      )}
    </Popover>
  );
}
