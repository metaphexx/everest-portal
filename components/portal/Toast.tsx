import React from "react";
import { usePortal } from "@/lib/store";

export function Toast() {
  const { toast } = usePortal();
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 26,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,32,63,.93)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "#fff",
        borderRadius: 12,
        padding: "11px 18px",
        fontSize: 13,
        fontWeight: 500,
        zIndex: "var(--z-toast)",
        boxShadow: "0 18px 40px -12px rgba(0,32,63,.55)",
        animation: "evfadeup .22s ease-out",
        whiteSpace: "nowrap",
      }}
    >
      {toast}
    </div>
  );
}
