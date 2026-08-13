import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Shared modal shell: backdrop + dialog semantics + Escape + a focus trap,
 * so every glass dialog in the portal (ClassModal, WorksheetPicker,
 * BookletPicker, ClassDetailModal, PdfPreviewModal, Print Details, the new
 * message picker) gets the same accessible behaviour from one place instead
 * of reimplementing it per component. Callers keep full control of the
 * panel's own look - this only supplies the backdrop, semantics and keyboard
 * handling around whatever panel content they pass as children.
 *
 * Rendered through a portal to <body>. Without it the backdrop is a child of
 * `.ev-main`, which sets `position: relative; z-index: 1` and so becomes a
 * stacking context - trapping the modal's --z-modal (95) INSIDE a layer that
 * itself sits at 1. The result was the mobile top bar (--z-dropdown, 60)
 * painting straight over the top of every dialog, hiding its title and close
 * button. A z-index only competes with siblings in the same stacking context,
 * so the fix is to leave the context, not to raise the number.
 */
export function Modal({
  onClose,
  label,
  labelledBy,
  children,
  panelStyle,
  panelClassName,
  backdropStyle,
}: {
  onClose: () => void;
  /** Accessible name for the dialog - provide this OR labelledBy, not both. */
  label?: string;
  labelledBy?: string;
  children: React.ReactNode;
  panelStyle?: React.CSSProperties;
  panelClassName?: string;
  backdropStyle?: React.CSSProperties;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus something inside the panel as soon as it mounts.
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,32,63,.28)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: "var(--z-modal)" as unknown as number,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "evfadein .2s ease-out",
        padding: 16,
        ...backdropStyle,
      }}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={panelClassName}
        style={{
          background: "rgba(255,255,255,.95)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,.9)",
          borderRadius: 20,
          boxShadow: "0 40px 90px -30px rgba(0,32,63,.55)",
          animation: "evdrop .22s ease-out",
          outline: "none",
          ...panelStyle,
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
