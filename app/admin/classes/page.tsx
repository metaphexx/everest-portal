// Classes: the office's view of the whole timetable.
//
// A class record answers three questions the office is phoned about: who
// teaches it, when it runs, and is there a seat. Capacity is shown as a bar
// because "9/12" and "12/12" need to look different across a room, not just
// read differently.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { CENTRES, allClasses } from "@/lib/admin-data";
import { DELIVERY_META } from "@/lib/tutor-data";

export default function AdminClasses() {
  const { notWired } = useAdmin();
  const classes = useMemo(() => allClasses(), []);
  const [centre, setCentre] = useState("All");
  const [delivery, setDelivery] = useState<"all" | "online" | "in_person">("all");
  const [q, setQ] = useState("");

  const shown = classes.filter((c) => {
    if (centre !== "All" && c.centre !== centre) return false;
    if (delivery !== "all" && c.delivery !== delivery) return false;
    const ql = q.trim().toLowerCase();
    if (ql && !(c.name + " " + c.tutorName + " " + c.year).toLowerCase().includes(ql)) return false;
    return true;
  });

  const centres = ["All", "Online", ...CENTRES];
  const seatsLeft = shown.reduce((n, c) => n + Math.max(0, c.capacity - c.students), 0);

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by class, tutor or year" aria-label="Search classes" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box", marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <span>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>CENTRE</label>
            <select value={centre} onChange={(e) => setCentre(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
              {centres.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All centres" : c}
                </option>
              ))}
            </select>
          </span>
          <span>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>DELIVERY</label>
            <select value={delivery} onChange={(e) => setDelivery(e.target.value as typeof delivery)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
              <option value="all">Online and in person</option>
              <option value="online">Online only</option>
              <option value="in_person">In person only</option>
            </select>
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 10 }}>
          {shown.length} class{shown.length === 1 ? "" : "es"} · {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} still available
        </div>
      </div>

      {shown.map((c, i) => {
        const pct = Math.min(100, Math.round((c.students / c.capacity) * 100));
        const tone = pct >= 100 ? "var(--danger-500)" : pct > 80 ? "var(--warn-500)" : "var(--success-500)";
        return (
          <div key={c.id} className="glass-card" style={{ gridColumn: "span 4", padding: "18px 20px", boxSizing: "border-box", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.06 + i * 0.03}s backwards` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.colour, flex: "none", marginTop: 5 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{c.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>{c.sched}</span>
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: DELIVERY_META[c.delivery].color, background: DELIVERY_META[c.delivery].bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>
                {DELIVERY_META[c.delivery].short}
              </span>
            </div>

            <div style={{ fontSize: 12, color: "var(--fg3)", lineHeight: 1.6 }}>
              {c.tutorName}
              <br />
              {c.centre}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: tone }}>
                  {c.students}/{c.capacity}
                </span>
                <span style={{ fontSize: 11, color: "var(--fg4)" }}>enrolled</span>
                <span className="ev-spacer-flex" style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "var(--fg4)" }}>{c.capacity - c.students > 0 ? c.capacity - c.students + " seats left" : "Full"}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(0,32,63,.08)", overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", borderRadius: 3, background: tone, transition: "width .3s ease" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button onClick={() => notWired("Class roll")} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                View roll
              </button>
              <button onClick={() => notWired("Edit class")} className="btn-ghost press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                Edit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
