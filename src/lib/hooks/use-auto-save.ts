"use client";

import { useEffect, useRef, useTransition } from "react";

const DEFAULT_DEBOUNCE_MS = 500;

export function useAutoSave<T>(
  values: T,
  save: (values: T) => Promise<void>,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): boolean {
  const isFirstRender = useRef(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        await save(values);
      });
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, debounceMs]);

  return pending;
}
