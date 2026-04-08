"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

interface AccordionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function Accordion({
  header,
  children,
  defaultOpen = false,
  className = "",
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex-1 min-w-0">{header}</div>
        <ChevronDownIcon
          className={`w-5 h-5 text-text-muted transition-transform duration-200 shrink-0 ml-4 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
