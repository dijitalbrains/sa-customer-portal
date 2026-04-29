"use client";

import { createContext, useCallback, useContext, useState } from "react";
import ConfirmationModal, {
  type ConfirmationConfig,
} from "@/components/ui/confirmation-modal";

interface ConfirmationContextValue {
  confirm: (config: ConfirmationConfig) => void;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function useConfirmation(): ConfirmationContextValue {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) throw new Error("useConfirmation must be used inside <ConfirmationProvider>");
  return ctx;
}

export default function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig | null>(null);

  const confirm = useCallback((next: ConfirmationConfig) => {
    setConfig(next);
    setOpen(true);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationModal open={open} config={config} onClose={() => setOpen(false)} />
    </ConfirmationContext.Provider>
  );
}
