import { useEffect, useRef } from "react";

/**
 * Closes an open popover/dropdown on an outside click OR Escape - the two
 * dismiss paths every menu in the portal should support, but which were
 * previously reimplemented (or missing) per-component. Attach `ref` to the
 * popover's outermost element; `onClose` fires once per outside interaction.
 */
export function useDismissable<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return ref;
}
