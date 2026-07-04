"use client";

import { useEffect, useState } from "react";

// Debounce a rapidly-changing value (e.g. a search box) so anything expensive
// downstream runs once the user pauses, not on every keystroke. In this
// prototype search is a deterministic local function (free), but the header
// search is exactly the kind of input that maps to a paid model / vector call
// in production - debouncing it keeps that from firing per character and is
// imperceptible to the user. See also the Elliot daily budget cap in
// lib/store.tsx (ELLIOT_DAILY_BUDGET_AUD) for the generation-side control.
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
