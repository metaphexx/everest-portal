import React from "react";

/** Warm ivory splash with drifting brand-tinted colour pools. Durations kept
    short (11-16s) and opacity a touch higher so the drift reads clearly across
    the whole page, not just behind the hero. */
export function Background() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -120, left: -140, width: 560, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(122,90,248,.2),transparent 66%)", animation: "evdrift1 12s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: -160, left: -60, width: 460, height: 440, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,166,35,.17),transparent 66%)", animation: "evdrift2 15s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: -160, left: "34%", width: 680, height: 540, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,157,255,.22),transparent 66%)", animation: "evdrift3 11s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: -200, right: -100, width: 600, height: 540, borderRadius: "50%", background: "radial-gradient(circle,rgba(122,90,248,.17),transparent 66%)", animation: "evdrift2 14s ease-in-out -5s infinite" }} />
      <div style={{ position: "absolute", top: "34%", right: "24%", width: 420, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,166,35,.14),transparent 68%)", animation: "evdrift1 16s ease-in-out -7s infinite" }} />
      <div style={{ position: "absolute", top: "8%", left: "12%", width: 360, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,157,255,.13),transparent 68%)", animation: "evdrift3 13s ease-in-out -4s infinite" }} />
    </div>
  );
}
