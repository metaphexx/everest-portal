// The print queue.
//
// Approvals is a decision; this is a job sheet. Whoever stands at the printer
// needs the spec, the copy count and the deadline in one glance, so the row
// leads with the class date - a job for Tuesday's class is not the same job as
// one for a fortnight away.
//
// A failed job is a first-class state, not an error toast. The office has to be
// able to say "this failed, we are reprinting" and have the tutor see it.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { DEFAULT_FORMAT, PRINTERS, PRINTING_META, centreOfPrinter } from "@/lib/tutor-data";

const IC = {
  printer: "M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-3 11H8v-5h8v5Zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1-9H6v4h12V3Z",
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
};

type Tab = "queue" | "printed" | "failed";

export default function AdminPrinting() {
  const { requests, setPrinting, notWired } = useAdmin();
  const [tab, setTab] = useState<Tab>("queue");
  const [printer, setPrinter] = useState("All printers");

  const jobs = useMemo(
    () => requests.filter((r) => (r.delivery ?? "print") === "print" && r.approval === "approved"),
    [requests]
  );

  const shown = useMemo(
    () =>
      jobs.filter((r) => {
        if (printer !== "All printers" && r.printer !== printer) return false;
        if (tab === "queue") return r.printing === "not_started";
        if (tab === "printed") return r.printing === "completed";
        return r.printing === "failed";
      }),
    [jobs, tab, printer]
  );

  const count = (t: Tab) =>
    jobs.filter((r) => (t === "queue" ? r.printing === "not_started" : t === "printed" ? r.printing === "completed" : r.printing === "failed")).length;

  const TABS: { id: Tab; label: string }[] = [
    { id: "queue", label: "To print" },
    { id: "printed", label: "Printed" },
    { id: "failed", label: "Failed" },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <div className="ev-scroll-x" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={on}
                className="press ev-tap-h"
                style={{ height: 36, padding: "0 15px", borderRadius: 980, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", background: on ? "var(--accent-teal)" : "rgba(255,255,255,.8)", color: on ? "#fff" : "var(--fg3)" }}
              >
                {t.label} ({count(t.id)})
              </button>
            );
          })}
        </div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>PRINTER</label>
        <select value={printer} onChange={(e) => setPrinter(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Filter by printer">
          {["All printers", ...PRINTERS].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 && (
        <div className="glass-card" style={{ gridColumn: "span 12", padding: "34px 22px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>
            {tab === "queue" ? "The print queue is clear" : tab === "printed" ? "Nothing printed yet" : "No failed jobs"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>
            {tab === "queue" ? "Approved jobs land here the moment you approve them." : "Change the filter above to see the rest of the queue."}
          </div>
        </div>
      )}

      {shown.map((r, i) => {
        const fmt = { ...DEFAULT_FORMAT, ...r.format };
        const copies = r.items.reduce((n, it) => n + it.qty, 0);
        const sheets = fmt.perSheet === "2 per page" ? Math.ceil(copies / 2) : copies;
        const meta = PRINTING_META[r.printing];
        return (
          <div key={r.id} className="glass-card" style={{ gridColumn: "span 12", padding: "16px 20px", boxSizing: "border-box", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.06 + i * 0.04}s backwards` }}>
            <div className="ev-wrap-row" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              {/* The deadline leads, because that is what sorts the pile. */}
              <span
                className="ev-wrap-lead-lg"
                style={{ flex: "none", width: 84, borderRadius: 12, background: "rgba(14,156,142,.1)", color: "var(--accent-teal)", padding: "9px 6px", textAlign: "center" }}
              >
                <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, opacity: 0.85 }}>FOR</span>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, lineHeight: 1.25, marginTop: 2 }}>{r.classText.split("·").pop()?.trim() || r.date}</span>
              </span>

              <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{r.classText}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3, lineHeight: 1.5 }}>
                  {r.items.map((it) => it.name + " x" + it.qty).join(", ")}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6, flexWrap: "wrap" }}>
                  <Icon path={IC.printer} size={13} style={{ color: "var(--fg4)", flex: "none" }} />
                  <span style={{ fontSize: 11, color: "var(--fg4)" }}>
                    {r.printer} · {centreOfPrinter(r.printer)} · {copies} copies over {sheets} sheet{sheets === 1 ? "" : "s"}
                  </span>
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 4 }}>
                  {[fmt.paper, fmt.sides, fmt.colour, fmt.orientation, fmt.scale, fmt.staple, fmt.perSheet].filter(Boolean).join(" · ")}
                </span>
                {r.remark && <span style={{ display: "block", fontSize: 11.5, color: "var(--fg3)", marginTop: 5, fontStyle: "italic" }}>&ldquo;{r.remark}&rdquo;</span>}
              </span>

              <span className="ev-wrap-cta" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flex: "none" }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: meta.color, background: meta.bg, padding: "4px 10px", borderRadius: 980 }}>{meta.label}</span>
                <span style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {r.printing !== "completed" && (
                    <button onClick={() => setPrinting(r.id, "completed")} className="btn-primary press ev-tap-h" style={{ height: 36, padding: "0 15px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                      Mark printed
                    </button>
                  )}
                  {r.printing === "not_started" && (
                    <button onClick={() => setPrinting(r.id, "failed")} className="btn-ghost press ev-tap-h" style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "var(--danger-500)" }}>
                      Mark failed
                    </button>
                  )}
                  {r.printing !== "not_started" && (
                    <button onClick={() => setPrinting(r.id, "not_started")} className="btn-ghost press ev-tap-h" style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "var(--fg3)" }}>
                      Back to queue
                    </button>
                  )}
                  <button onClick={() => notWired("Print job sheet")} className="btn-ghost press ev-tap-h" style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}>
                    Job sheet
                  </button>
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
