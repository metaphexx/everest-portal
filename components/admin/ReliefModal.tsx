// Putting someone else in front of a class for a week or three.
//
// A tutor being away is routine, and the app had no way to say so: the only
// option was to edit the class and overwrite the tutor's name, which loses the
// fact that they are still the tutor and someone is covering. Relief is its
// own record - who is covering, between which dates - so the class keeps its
// real tutor and the cover shows up only on the sessions it applies to.

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { AdminClass, STAFF } from "@/lib/admin-data";
import { Relief, TODAY_ISO, displayDate } from "@/lib/class-changes";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  bin: "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z",
};

/** How many of a weekly class's sessions fall inside a date window. */
function sessionsBetween(from: string, to: string): number {
  const a = new Date(from + "T12:00:00");
  const b = new Date(to + "T12:00:00");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.floor((b.getTime() - a.getTime()) / (7 * 86400000)) + 1;
}

export function ReliefModal({
  cls,
  existing,
  onClose,
  onAdd,
  onCancel,
}: {
  cls: AdminClass;
  existing: Relief[];
  onClose: () => void;
  onAdd: (r: { tutor: string; from: string; to: string }) => void;
  onCancel: (id: string) => void;
}) {
  // The class's own tutors cannot cover for themselves.
  const options = STAFF.filter((s) => s.status === "active" && !cls.tutorName.includes(s.name));
  const [tutor, setTutor] = useState(options[0]?.name ?? "");
  const [span, setSpan] = useState<"one" | "range">("one");
  const [from, setFrom] = useState(TODAY_ISO);
  const [to, setTo] = useState(TODAY_ISO);

  const end = span === "one" ? from : to;
  const count = span === "one" ? 1 : sessionsBetween(from, end);
  const valid = !!tutor && !!from && (span === "one" || (end >= from && count > 0));

  return (
    <Modal onClose={onClose} labelledBy="relief-title" panelStyle={{ width: "min(600px, calc(100vw - 32px))", maxHeight: "min(90vh, 760px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="relief-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              Relief for {cls.name}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>
              {cls.tutorName} stays the class tutor.
            </span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>COVERING</div>
          <select value={tutor} onChange={(e) => setTutor(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Covering tutor">
            {options.length === 0 && <option value="">No other tutor is available</option>}
            {options.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 6 }}>WHEN</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {(["one", "range"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpan(s)}
                aria-pressed={span === s}
                className="press ev-tap-h"
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 980,
                  border: span === s ? "none" : "1.5px solid rgba(0,32,63,.14)",
                  background: span === s ? "var(--accent-teal)" : "transparent",
                  color: span === s ? "#fff" : "var(--fg3)",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {s === "one" ? "One session" : "A run of weeks"}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: span === "range" ? "1fr 1fr" : "1fr", gap: 10 }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            {span === "range" && (
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} aria-label="To" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            )}
          </div>
          {valid && (
            <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 7 }}>
              {tutor} covers {count} {count === 1 ? "session" : "sessions"}
              {span === "range" ? ", " + displayDate(from) + " to " + displayDate(end) : " on " + displayDate(from)}.
            </div>
          )}
        </div>

        {existing.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(0,32,63,.07)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 6 }}>ALREADY ARRANGED</div>
            {existing.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(0,32,63,.05)" }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                  <strong style={{ fontWeight: 700 }}>{r.tutor}</strong>
                  <span style={{ color: "var(--fg4)" }}>
                    {" · "}
                    {r.from === r.to ? displayDate(r.from) : displayDate(r.from) + " to " + displayDate(r.to)}
                  </span>
                </span>
                <button
                  onClick={() => onCancel(r.id)}
                  aria-label={"Cancel relief by " + r.tutor}
                  className="btn-ghost press"
                  style={{ width: 32, height: 32, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--danger-500)", flex: "none" }}
                >
                  <Icon path={IC.bin} size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => valid && onAdd({ tutor, from, to: end })}
            disabled={!valid}
            className="btn-primary press ev-tap-h"
            style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}
          >
            Arrange relief
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
            Cancel
          </button>
          {!valid && <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{options.length === 0 ? "Every active tutor already takes this class." : "Check the dates."}</span>}
        </div>
      </div>
    </Modal>
  );
}
