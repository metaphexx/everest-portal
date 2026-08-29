// Enrolling students into a multi-subject block.
//
// Enrolment is PER SLOT, never per block: a student taking Maths and Science
// but not English is on two of the three rosters, and that is the whole
// mechanism. A grid is the right shape because the office reads it two ways -
// across a row to see what one student takes, and down a column to see who is
// in one subject (which is the number the booklet request has to match).

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "@/lib/admin-store";
import { blockRoster, slotsFor } from "@/lib/block";

const IC = {
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
};

export function BlockEnrolment({ courseId }: { courseId: string }) {
  const { showToast } = useAdmin();
  const slots = slotsFor(courseId);
  const roster = useMemo(() => blockRoster(courseId), [courseId]);

  // Seeded from the slot rosters, then edited here.
  const [grid, setGrid] = useState<Record<string, Set<string>>>(() => {
    const g: Record<string, Set<string>> = {};
    for (const st of roster) g[st.name] = new Set(slots.filter((s) => s.students.some((x) => x.name === st.name)).map((s) => s.id));
    return g;
  });

  if (slots.length === 0) return null;

  const toggle = (student: string, slotId: string) =>
    setGrid((g) => {
      const next = { ...g, [student]: new Set(g[student]) };
      if (next[student].has(slotId)) next[student].delete(slotId);
      else next[student].add(slotId);
      return next;
    });

  const countIn = (slotId: string) => roster.filter((st) => grid[st.name]?.has(slotId)).length;
  const noSubjects = roster.filter((st) => (grid[st.name]?.size ?? 0) === 0);

  return (
    <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box" }}>
      <div className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h2 className="portal-section-title ev-wrap-main" style={{ fontSize: 15, margin: 0, flex: "1 0 auto" }}>Who takes what</h2>
        <button onClick={() => showToast("Enrolment saved")} className="btn-primary press ev-tap-h ev-wrap-cta" style={{ height: 38, padding: "0 16px", borderRadius: 11, fontSize: 12, fontWeight: 700, flex: "none" }}>
          Save enrolment
        </button>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.55 }}>
        Tick a subject to enrol. A student can take one, two or all three - the block is just the room they share.
        The column totals are the numbers a booklet request has to match.
      </p>

      <div className="ev-scroll-x">
        <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, zIndex: 1, background: "rgba(255,255,255,.94)", backdropFilter: "blur(6px)", textAlign: "left", padding: "8px 12px", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)", borderBottom: "1px solid rgba(0,32,63,.08)" }}>STUDENT</th>
              {slots.map((s) => (
                <th key={s.id} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(0,32,63,.08)", textAlign: "center", whiteSpace: "nowrap" }}>
                  <span style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: s.color }}>{s.subject}</span>
                  <span style={{ display: "block", fontSize: 10, color: "var(--fg4)", fontWeight: 500, marginTop: 2 }}>{s.start} to {s.end}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.map((st) => {
              const n = grid[st.name]?.size ?? 0;
              return (
                <tr key={st.name} className="list-hover">
                  <td style={{ position: "sticky", left: 0, zIndex: 1, background: "rgba(255,255,255,.94)", backdropFilter: "blur(6px)", padding: "9px 12px", borderBottom: "1px solid rgba(0,32,63,.05)", whiteSpace: "nowrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(14,156,142,.14)", color: "var(--accent-teal)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{st.init}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{st.name}</span>
                      {n === 0 && <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--warn-700)", background: "rgba(245,166,35,.18)", padding: "2px 7px", borderRadius: 980 }}>NO SUBJECTS</span>}
                    </span>
                  </td>
                  {slots.map((s) => {
                    const on = grid[st.name]?.has(s.id) ?? false;
                    return (
                      <td key={s.id} style={{ padding: "9px 12px", borderBottom: "1px solid rgba(0,32,63,.05)", textAlign: "center" }}>
                        <button
                          onClick={() => toggle(st.name, s.id)}
                          aria-label={(on ? "Remove " : "Enrol ") + st.name + " " + (on ? "from " : "in ") + s.subject}
                          aria-pressed={on}
                          className="press"
                          style={{
                            width: 30, height: 30, borderRadius: 9, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            border: on ? "none" : "1.5px solid rgba(0,32,63,.16)",
                            background: on ? s.color : "transparent",
                            color: "#fff",
                          }}
                        >
                          {on && <Icon path={IC.tick} size={14} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ position: "sticky", left: 0, zIndex: 1, background: "rgba(255,255,255,.94)", backdropFilter: "blur(6px)", padding: "11px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", borderTop: "1px solid rgba(0,32,63,.08)" }}>ON THE ROSTER</td>
              {slots.map((s) => (
                <td key={s.id} style={{ padding: "11px 12px", textAlign: "center", borderTop: "1px solid rgba(0,32,63,.08)" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{countIn(s.id)}</span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {noSubjects.length > 0 && (
        <div style={{ marginTop: 12, borderRadius: 12, background: "rgba(245,166,35,.09)", padding: "11px 13px", fontSize: 11.5, color: "var(--warn-700)", lineHeight: 1.55 }}>
          {noSubjects.map((s) => s.name).join(", ")} {noSubjects.length === 1 ? "is" : "are"} in the block with no subject ticked, so {noSubjects.length === 1 ? "they will" : "they will"} appear on no roster and be marked absent from nothing. Either enrol them or remove them from the class.
        </div>
      )}
    </div>
  );
}
