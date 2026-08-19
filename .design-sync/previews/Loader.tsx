import React from "react";
import { Loader } from "everest-portal";

export const Default = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
    <Loader size={72} label="Loading your classes" />
    <Loader size={44} label="Loading" />
  </div>
);

export const InContext = () => (
  <div style={{ width: 360, padding: "38px 22px", textAlign: "center", borderRadius: 20, background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.78)" }}>
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Loader size={72} label="Scanning your outline" />
    </div>
    <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 15, marginTop: 14 }}>Scanning your outline</div>
    <div style={{ fontSize: 12.5, color: "#66707F", marginTop: 5 }}>This usually takes about ten seconds.</div>
  </div>
);
