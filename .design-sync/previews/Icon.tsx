import React from "react";
import { Icon } from "everest-portal";

const P = {
  search: "m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z",
  mail: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z",
  calendar: "M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V8h14v11Z",
  printer: "M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-3 11H8v-5h8v5Zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1-9H6v4h12V3Z",
};

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 24, color: "#182030" }}>
    {[14, 17, 22, 30].map((s) => (
      <span key={s} style={{ textAlign: "center" }}>
        <Icon path={P.doc} size={s} />
        <span style={{ display: "block", fontSize: 11, color: "#6E7887", marginTop: 6 }}>{s}px</span>
      </span>
    ))}
  </div>
);

export const Set = () => (
  <div style={{ display: "flex", gap: 20, color: "#4A5563" }}>
    {Object.entries(P).map(([k, d]) => (
      <span key={k} style={{ textAlign: "center" }}>
        <Icon path={d} size={20} />
        <span style={{ display: "block", fontSize: 10.5, color: "#6E7887", marginTop: 6 }}>{k}</span>
      </span>
    ))}
  </div>
);

export const Stroked = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#182030" }}>
    <Icon path="M3 6h18M3 12h18M3 18h18" size={22} stroke />
    <span style={{ fontSize: 12.5, color: "#4A5563" }}>stroke - for line glyphs like the hamburger</span>
  </div>
);
