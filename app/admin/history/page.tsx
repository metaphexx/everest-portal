// Print history: everything that has actually been printed.
//
// The live version renders an empty table under a "Clear" filter bar with a
// line reading "Showing print history for: All Centres - All Days - All
// Classes" and then "Loading data..." forever. Two things are fixed here: the
// filter summary only appears once a filter is on (it is noise otherwise), and
// an empty result says which of the three states it is.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Column, MasterTable } from "@/components/admin/MasterTable";
import { CENTRES_M } from "@/lib/admin-masters";
import { centreOfPrinter } from "@/lib/tutor-data";

export default function AdminHistory() {
  const { requests, notWired } = useAdmin();
  const [centre, setCentre] = useState("All");

  const rows = useMemo(() => {
    const printed = requests.filter((r) => (r.delivery ?? "print") === "print" && r.printing === "completed");
    return printed
      .map((r) => ({
        id: r.id,
        ref: r.ref,
        date: r.date,
        centre: centreOfPrinter(r.printer),
        classText: r.classText,
        booklets: r.items.map((i) => i.name).join(", "),
        copies: r.items.reduce((n, i) => n + i.qty, 0),
        printer: r.printer,
      }))
      .filter((r) => centre === "All" || r.centre === centre);
  }, [requests, centre]);

  const cols: Column<(typeof rows)[number]>[] = [
    { key: "c", label: "Class", render: (r) => <strong style={{ fontWeight: 700 }}>{r.classText}</strong>, text: (r) => r.classText, width: 220 },
    { key: "b", label: "Booklets", render: (r) => r.booklets, text: (r) => r.booklets, width: 280 },
    { key: "n", label: "Copies", render: (r) => r.copies, text: (r) => String(r.copies) },
    { key: "p", label: "Printed at", render: (r) => (<><span>{r.centre}</span><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.printer}</span></>), text: (r) => r.centre + " " + r.printer },
    { key: "d", label: "Date", render: (r) => r.date, text: (r) => r.date, minor: true },
    { key: "r", label: "Reference", render: (r) => <span style={{ color: "var(--fg4)" }}>{r.ref}</span>, text: (r) => r.ref, minor: true },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "14px 18px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>CENTRE</label>
          <select value={centre} onChange={(e) => setCentre(e.target.value)} className="field" style={{ width: "100%", maxWidth: 320, height: 44, boxSizing: "border-box" }}>
            {["All", ...CENTRES_M.map((c) => c.name)].map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All centres" : c}
              </option>
            ))}
          </select>
        </span>
        {/* The filter summary appears only when a filter is actually on. */}
        {centre !== "All" && (
          <span className="ev-wrap-cta" style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
            <span style={{ fontSize: 12, color: "var(--fg3)" }}>Showing {centre} only</span>
            <button onClick={() => setCentre("All")} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 14px", borderRadius: 11, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}>
              Clear
            </button>
          </span>
        )}
      </div>

      <MasterTable
        rows={rows}
        columns={cols}
        idOf={(r) => r.id}
        searchHint="Search history by class, booklet or centre"
        onExport={() => notWired("Export")}
        emptyTitle={centre === "All" ? "Nothing has been printed yet" : "Nothing printed at " + centre}
        emptyBody={
          centre === "All"
            ? "A job appears here once it is marked printed in the print queue. Approving alone does not print it."
            : "Try another centre, or clear the filter to see every centre."
        }
      />
    </div>
  );
}
