import React from "react";
import { ElliotMark } from "everest-portal";

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 28 }}>
    {[22, 30, 48, 88].map((s) => (
      <div key={s} style={{ textAlign: "center" }}>
        <ElliotMark size={s} title="Elliot" />
        <div style={{ fontSize: 11, color: "#6E7887", marginTop: 8 }}>{s}px</div>
      </div>
    ))}
  </div>
);

export const OnColour = () => (
  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
    <span style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "linear-gradient(135deg,#7A5AF8,#009DFF)" }}>
      <ElliotMark size={30} tone="solid" />
    </span>
    <span style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "linear-gradient(135deg,#7A5AF8,#009DFF)" }}>
      <ElliotMark size={20} tone="solid" />
    </span>
    <span style={{ fontSize: 12.5, color: "#4A5563", maxWidth: 260, lineHeight: 1.5 }}>
      tone="solid" on a coloured ground - a gradient mark on a gradient muddies both.
    </span>
  </div>
);
