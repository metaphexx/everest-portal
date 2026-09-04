// Everything the office holds on one student, opened from wherever their name
// appears on a roll.
//
// The office's attendance figure was a dead end: a percentage with nothing
// behind it, on the one screen where somebody is about to ring a parent about
// it. This is the other half - who the student is, who to call, and which
// sessions the number is actually made of.

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { ATTENDANCE_META, AttendanceStatus } from "@/lib/tutor-data";
import { AdminStudent } from "@/lib/admin-data";
import { AttendanceRow, summarise } from "@/lib/attendance-history";
import { Leaver, displayDate } from "@/lib/class-changes";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  mail: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z",
  phone: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.57 3.6a1 1 0 0 1-.25 1l-2.22 2.2Z",
};

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 10, padding: "7px 0", borderTop: "1px solid rgba(0,32,63,.05)" }}>
      <span style={{ flex: "none", width: 118, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: "var(--fg4)" }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--fg1)", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

const FILTERS: { id: "all" | AttendanceStatus; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "absent", label: "Absent" },
  { id: "late", label: "Late" },
  { id: "excused", label: "Excused" },
];

export function StudentDetailModal({
  student,
  rows,
  left,
  onClose,
}: {
  student: AdminStudent;
  rows: AttendanceRow[];
  /** Set when this student has left the class the modal was opened from. */
  left?: Leaver;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"all" | AttendanceStatus>("all");
  const summary = useMemo(() => summarise(rows), [rows]);
  // Newest first: the office opens this because of something recent.
  const shown = useMemo(
    () => [...rows].reverse().filter((r) => filter === "all" || r.status === filter),
    [rows, filter]
  );

  const statusPill = (s: AttendanceStatus) => {
    const m = ATTENDANCE_META[s];
    return (
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.3, color: m.color, background: m.bg, padding: "3px 9px", borderRadius: 980, flex: "none", whiteSpace: "nowrap" }}>
        {m.label}
      </span>
    );
  };

  return (
    <Modal onClose={onClose} labelledBy="student-title" panelStyle={{ width: "min(680px, calc(100vw - 32px))", maxHeight: "min(92vh, 900px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(14,156,142,.14)", color: "var(--accent-teal)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            {student.initials}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="student-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              {student.name}
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>
              {student.year} · {student.centre}
              {left ? " · left this class " + displayDate(left.on) : ""}
            </span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        {/* ---- who they are, and who to ring ---- */}
        <div style={{ marginTop: 16 }}>
          <Row label="YEAR" value={student.year} />
          <Row label="STUDENT EMAIL" value={student.email} />
          <Row label="PARENT" value={student.parent} />
          <Row label="PARENT PHONE" value={student.parentPhone} />
          <Row label="PARENT EMAIL" value={student.parentEmail} />
          <Row label="CLASSES" value={student.classNames.join(", ") || "None"} />
          <Row label="STATUS" value={student.status === "active" ? "Active" : student.status === "trial" ? "Trial" : "Withdrawn"} />
        </div>

        {(student.parentPhone || student.parentEmail) && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {student.parentPhone && (
              <a href={"tel:" + student.parentPhone.replace(/\s/g, "")} className="btn-soft press ev-tap-h" style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Icon path={IC.phone} size={13} />
                Call {student.parent.split(" ")[0]}
              </a>
            )}
            {student.parentEmail && (
              <a href={"mailto:" + student.parentEmail} className="btn-ghost press ev-tap-h" style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "var(--fg2)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Icon path={IC.mail} size={13} />
                Email
              </a>
            )}
          </div>
        )}

        {/* ---- the number, broken out ---- */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", flex: 1, minWidth: 0 }}>ATTENDANCE</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: summary.pct < 80 ? "var(--warn-700)" : "var(--fg1)" }}>{summary.pct}%</span>
          <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>of {summary.total} sessions</span>
        </div>

        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
          {FILTERS.map((f) => {
            const n = f.id === "all" ? rows.length : rows.filter((r) => r.status === f.id).length;
            if (f.id !== "all" && n === 0) return null;
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={on}
                className="press ev-tap-h"
                style={{
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 980,
                  border: on ? "none" : "1.5px solid rgba(0,32,63,.12)",
                  background: on ? "var(--accent-teal)" : "transparent",
                  color: on ? "#fff" : "var(--fg3)",
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {f.label} {n}
              </button>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "14px 0" }}>
            {rows.length === 0 ? "No sessions have run for this student yet." : "Nothing matches that filter."}
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {shown.map((r, i) => (
              <div key={r.date + r.className + (r.subject ?? "") + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid rgba(0,32,63,.05)" }}>
                <span style={{ flex: "none", width: 62, fontSize: 11.5, fontWeight: 700, color: "var(--fg2)" }}>{displayDate(r.date)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.subject ?? r.className}
                  </span>
                  {r.subject && <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>{r.className}</span>}
                </span>
                {/* A register the tutor took is worth more than one filled in
                    from the running total, so the two are never shown alike. */}
                {!r.marked && (
                  <span title="No register was taken for this session" style={{ fontSize: 10, color: "var(--fg4)", flex: "none" }}>
                    not marked
                  </span>
                )}
                {statusPill(r.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
