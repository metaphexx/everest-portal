// Students: one row per person, with the parent contact beside the attendance.
//
// A table rather than cards, because the office reads this list down a column -
// "who is under 80% this term" - rather than one student at a time. It scrolls
// horizontally on a phone rather than collapsing, since a squeezed table hides
// the very column you came for.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { allStudents } from "@/lib/admin-data";
import { DELIVERY_META } from "@/lib/tutor-data";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Enrolled", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
  trial: { label: "Trial", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  withdrawn: { label: "Withdrawn", color: "var(--fg4)", bg: "rgba(0,32,63,.07)" },
};

export default function AdminStudents() {
  const { notWired } = useAdmin();
  const students = useMemo(() => allStudents(), []);
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "trial" | "low">("all");

  const shown = students.filter((s) => {
    if (only === "trial" && s.status !== "trial") return false;
    if (only === "low" && s.attendance >= 80) return false;
    const ql = q.trim().toLowerCase();
    return !ql || (s.name + " " + s.parent + " " + s.classNames.join(" ")).toLowerCase().includes(ql);
  });

  const FILTERS: { id: typeof only; label: string }[] = [
    { id: "all", label: "Everyone" },
    { id: "trial", label: "On trial" },
    { id: "low", label: "Attendance under 80%" },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by student, parent or class" aria-label="Search students" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box", marginBottom: 12 }} />
        <div className="ev-scroll-x" style={{ display: "flex", gap: 8 }}>
          {FILTERS.map((f) => {
            const on = only === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setOnly(f.id)}
                aria-pressed={on}
                className="press ev-tap-h"
                style={{ height: 36, padding: "0 15px", borderRadius: 980, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", background: on ? "var(--accent-teal)" : "rgba(255,255,255,.8)", color: on ? "#fff" : "var(--fg3)" }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "6px 4px 8px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .1s backwards" }}>
        <div className="ev-scroll-x">
          <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Student", "Year", "Classes", "Parent contact", "Attendance", "Status", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)", padding: "12px 14px", borderBottom: "1px solid rgba(0,32,63,.08)", whiteSpace: "nowrap" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => {
                const st = STATUS_META[s.status];
                const low = s.attendance < 80;
                return (
                  <tr key={s.name} className="list-hover">
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,32,63,.05)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(14,156,142,.14)", color: "var(--accent-teal)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                          {s.initials}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{s.name}</span>
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", fontSize: 12, color: "var(--fg3)", whiteSpace: "nowrap" }}>{s.year}</td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", fontSize: 12, color: "var(--fg3)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {s.classNames.join(", ")}
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: DELIVERY_META[s.delivery].color, background: DELIVERY_META[s.delivery].bg, padding: "2px 7px", borderRadius: 980, whiteSpace: "nowrap" }}>
                          {DELIVERY_META[s.delivery].short}
                        </span>
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", fontSize: 12, color: "var(--fg3)", whiteSpace: "nowrap" }}>
                      {s.parent}
                      <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{s.parentPhone}</span>
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: low ? "var(--warn-700)" : "var(--fg2)" }}>{s.attendance}%</span>
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: st.color, background: st.bg, padding: "4px 10px", borderRadius: 980 }}>{st.label}</span>
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", whiteSpace: "nowrap" }}>
                      <button onClick={() => notWired("Student record")} className="btn-ghost press ev-tap-h" style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg4)", padding: "10px 14px 4px" }}>
          Showing {shown.length} of {students.length} students.
        </div>
      </div>
    </div>
  );
}
