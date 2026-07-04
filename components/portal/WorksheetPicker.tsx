"use client";

import React from "react";
import { usePortal } from "@/lib/store";
import { wsBase } from "@/lib/data";
import { Modal } from "@/components/ui/Modal";

export function WorksheetPicker() {
  const { drivePick, setDrivePick, done, matchWorksheet } = usePortal();
  if (!drivePick) return null;
  const pending = wsBase().filter((w) => !done[w.id]);
  const close = () => setDrivePick(false);

  return (
    <Modal onClose={close} labelledBy="worksheet-picker-title" panelStyle={{ width: 400, maxWidth: "88vw", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <div>
            <div id="worksheet-picker-title" style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Which worksheet is this?</div>
            <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 4, lineHeight: 1.45 }}>
              Match your upload to its assigned task so your tutor knows which one has come back.
            </div>
          </div>
          <button onClick={close} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14, lineHeight: 1, flex: "none", background: "#fff" }}>
            ✕
          </button>
        </div>
        {pending.map((w) => (
          <button
            key={w.id}
            onClick={() => matchWorksheet(w.id, w.name)}
            className="list-hover"
            style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 11, padding: "11px 10px", margin: "0 -10px", borderRadius: 12, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: w.dot, flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{w.due}</span>
            </span>
            <span style={{ fontSize: 12, color: "var(--brand-600)", fontWeight: 700, flex: "none" }}>Match</span>
          </button>
        ))}
    </Modal>
  );
}
