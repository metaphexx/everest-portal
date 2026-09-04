// Print history: everything that has actually been printed.
//
// A row is a receipt, so it carries the exact time, not just the date - "did
// this go before or after the 4pm class" is the question history gets asked.
// Opening a row shows the whole job and offers Print again, which is how a
// reprint actually starts: from the record of the last one.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Column, MasterTable } from "@/components/admin/MasterTable";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";
import { BookletRequest, DEFAULT_FORMAT, centreOfPrinter, driveIdFor } from "@/lib/tutor-data";
import { CENTRES_M } from "@/lib/admin-masters";
import { centreStyle } from "@/lib/admin-schedule";

const IC = {
  printer: "M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-3 11H8v-5h8v5Zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1-9H6v4h12V3Z",
  ext: "M14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7ZM5 5h5V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-2v5H5V5Z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10.6V7h-2v6.4l4.7 2.8 1-1.7-3.7-2.2Z",
  user: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5Z",
};

function Detail({ r, onClose, onPrintAgain }: { r: BookletRequest; onClose: () => void; onPrintAgain: () => void }) {
  const fmt = { ...DEFAULT_FORMAT, ...r.format };
  const copies = r.items.reduce((n, i) => n + i.qty, 0);
  const cs = centreStyle(centreOfPrinter(r.printer));
  return (
    <Modal onClose={onClose} labelledBy="hist-detail" panelStyle={{ width: "min(560px, calc(100vw - 32px))", maxHeight: "min(88vh, 820px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <span id="hist-detail" style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, lineHeight: 1.35 }}>
            {r.items[0]?.name ?? r.classText}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "4px 10px", borderRadius: 980, flex: "none" }}>PRINTED</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 4, fontFamily: "ui-monospace, monospace" }}>{driveIdFor(r.items[0]?.name ?? r.ref).slice(0, 28)}</div>

        <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="btn-soft press ev-tap-h" style={{ height: 38, padding: "0 14px", borderRadius: 11, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <Icon path={IC.ext} size={13} />
          Open in Google Drive
        </a>

        <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "13px 14px", marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 10 }}>THE JOB</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
            {[
              { icon: IC.printer, label: "Copies", value: String(copies) },
              { icon: IC.user, label: "Requested by", value: r.classText.split("·")[0].trim() },
              { icon: IC.clock, label: "Requested", value: r.date + (r.time ? ", " + r.time : "") },
            ].map((f) => (
              <span key={f.label} style={{ minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)" }}>
                  <Icon path={f.icon} size={12} />
                  {f.label.toUpperCase()}
                </span>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginTop: 3, wordBreak: "break-word" }}>{f.value}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "13px 14px", marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 10 }}>THE CLASS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
            {[
              { label: "Centre", value: centreOfPrinter(r.printer), colour: cs.colour },
              { label: "Class", value: r.classText },
              { label: "Year and subject", value: r.yearLevel + " " + r.subject },
              { label: "Printer", value: r.printer },
            ].map((f) => (
              <span key={f.label} style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)" }}>{f.label.toUpperCase()}</span>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, marginTop: 3, color: f.colour ?? "var(--fg1)", wordBreak: "break-word" }}>{f.value}</span>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(0,32,63,.07)" }}>
            {[fmt.paper, fmt.sides, fmt.colour, fmt.orientation, fmt.scale, fmt.staple, fmt.perSheet].filter(Boolean).join(" · ")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button onClick={onPrintAgain} className="btn-primary press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon path={IC.printer} size={14} />
            Print again
          </button>
          <span className="ev-spacer-flex" style={{ flex: 1 }} />
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminHistory() {
  const { requests, notWired, showToast } = useAdmin();
  const [centre, setCentre] = useState("All");
  const [open, setOpen] = useState<BookletRequest | null>(null);
  // Clicking the booklet name opens the booklet itself, which is how a reprint
  // actually starts: you look at what was printed, then send it again.
  const [preview, setPreview] = useState<BookletRequest | null>(null);

  const printAgain = (r: BookletRequest) => {
    showToast("Sent to " + r.printer + " again");
    setOpen(null);
    setPreview(null);
  };

  const rows = useMemo(
    () =>
      requests
        .filter((r) => (r.delivery ?? "print") === "print" && r.printing === "completed")
        .filter((r) => centre === "All" || centreOfPrinter(r.printer) === centre),
    [requests, centre]
  );

  const cols: Column<BookletRequest>[] = [
    {
      key: "b",
      label: "Booklet",
      // The button needs its own truncation: a nested box does not inherit the
      // cell's ellipsis, so a long booklet name would run under the next column.
      render: (r) => (
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: centreStyle(centreOfPrinter(r.printer)).colour, flex: "none" }} />
          <button
            onClick={() => setPreview(r)}
            className="press ev-tap-h"
            style={{ border: "none", background: "none", padding: 0, font: "inherit", fontWeight: 700, color: "var(--brand-600)", textAlign: "left", cursor: "pointer", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {r.items.map((i) => i.name).join(", ")}
          </button>
        </span>
      ),
      text: (r) => r.items.map((i) => i.name).join(" "),
      width: 260,
    },
    { key: "c", label: "Class", render: (r) => r.classText, text: (r) => r.classText, width: 200 },
    { key: "n", label: "Copies", render: (r) => r.items.reduce((n, i) => n + i.qty, 0), text: (r) => String(r.items.reduce((n, i) => n + i.qty, 0)) },
    {
      key: "t",
      // The exact time, because "before or after the class" is the question.
      label: "Printed",
      render: (r) => (
        <>
          <span>{r.date}</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.time ?? "time not recorded"}</span>
        </>
      ),
      text: (r) => r.date + " " + (r.time ?? ""),
    },
    { key: "p", label: "Printer", render: (r) => r.printer, text: (r) => r.printer, width: 200, minor: true },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "14px 18px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>CENTRE</label>
          <select value={centre} onChange={(e) => setCentre(e.target.value)} className="field" style={{ width: "100%", maxWidth: 320, height: 44, boxSizing: "border-box" }} aria-label="Centre">
            {["All", ...CENTRES_M.map((c) => c.name)].map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All centres" : c}
              </option>
            ))}
          </select>
        </span>
        {centre !== "All" && (
          <button onClick={() => setCentre("All")} className="btn-ghost press ev-tap-h ev-wrap-cta" style={{ height: 42, padding: "0 15px", borderRadius: 11, fontSize: 12, fontWeight: 600, color: "var(--fg2)", flex: "none" }}>
            Clear filter
          </button>
        )}
      </div>

      <MasterTable
        rows={rows}
        columns={cols}
        idOf={(r) => r.id}
        searchHint="Search history by booklet, class or printer"
        onEdit={(r) => setOpen(r)}
        exportName="print-history"
        emptyTitle={centre === "All" ? "Nothing has been printed yet" : "Nothing printed at " + centre}
        emptyBody={centre === "All" ? "A job appears here once it is marked printed. Approving alone does not print it." : "Try another centre, or clear the filter."}
        pageSize={12}
      />

      {open && <Detail r={open} onClose={() => setOpen(null)} onPrintAgain={() => printAgain(open)} />}

      <PdfPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        fileName={preview?.items[0]?.name ?? ""}
        meta={preview ? preview.classText + " · " + preview.items.reduce((n, i) => n + i.qty, 0) + " copies · printed " + preview.date : undefined}
        annotate={false}
        onAction={() => preview && printAgain(preview)}
        actionLabel="Print again"
      />
    </div>
  );
}
