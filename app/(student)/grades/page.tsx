import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { gradeBase, wsBase, GradeRow } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";
import { downloadFile } from "@/lib/download";

type Filter = "all" | "graded" | "pending";

export default function GradesPage() {
  const { done, submittedCount, gradedCount, completionPct, notWired, markedForMe } = usePortal();
  const [preview, setPreview] = useState<{ name: string; meta: string } | null>(null);
  const [gq, setGq] = useState("");
  const [gf, setGf] = useState<Filter>("all");

  const dyn: GradeRow[] = wsBase()
    .filter((w) => done[w.id])
    .map((w) => ({ cls: "Upcoming class", wsName: w.name, file: "Maya_" + w.name.split(" ")[0] + ".pdf", at: "Just now", grade: "Pending", graded: false, fb: "Awaiting feedback from your tutor." }));
  // Anything the tutor has marked and returned in this session outranks the
  // seeded row for the same worksheet, so a just-marked piece shows its grade,
  // feedback and marked copy straight away.
  const returned = markedForMe();
  const merged: GradeRow[] = [...dyn, ...gradeBase()].map((r) => {
    const hit = returned.find((m) => m.wsName === r.wsName);
    return hit
      ? { ...r, grade: hit.grade, graded: true, fb: hit.feedback, returnedFile: hit.returnedFile ?? r.returnedFile }
      : r;
  });
  // Work the tutor marked that Maya has no seeded row for still has to appear,
  // otherwise returning a piece from the tutor portal silently goes nowhere.
  const extra: GradeRow[] = returned
    .filter((m) => !merged.some((r) => r.wsName === m.wsName))
    .map((m) => ({
      cls: "Returned by your tutor",
      wsName: m.wsName,
      file: m.file,
      at: "Just now",
      grade: m.grade,
      graded: true,
      fb: m.feedback,
      returnedFile: m.returnedFile,
    }));
  const allRows: GradeRow[] = [...extra, ...merged];
  const ql = gq.trim().toLowerCase();
  const rows = allRows
    .filter((r) => (gf === "all" ? true : gf === "graded" ? r.graded : !r.graded))
    .filter((r) => !ql || (r.wsName + " " + r.cls).toLowerCase().includes(ql));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      <div className="ev-grid-3 ev-stats-2up" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 }}>
        <Stat label="TOTAL SUBMISSIONS" value={String(allRows.length)} note="This term" />
        <Stat label="COMPLETION RATE" value={<>{completionPct}<span style={{ fontSize: 15, color: "var(--fg4)" }}>%</span></>} note="Submitted vs assigned" noteColor="var(--success-500)" />
        <Stat label="TUTOR REMARKS" value={String(gradedCount)} note="Feedback received" />
      </div>

      <div className="glass-card" style={{ padding: "20px 22px" }}>
        <div className="ev-toolbar" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div className="ev-toolbar-search" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.7)", border: "1px solid rgba(0,32,63,.1)", borderRadius: 11, padding: "0 12px", height: 36 }}>
            <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={14} style={{ color: "var(--fg4)" }} />
            <input value={gq} onChange={(e) => setGq(e.target.value)} placeholder="Search submissions" style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12.5, color: "var(--fg1)", width: 160 }} />
          </div>
          <div style={{ display: "inline-flex", background: "rgba(0,32,63,.06)", borderRadius: 10, padding: 3, gap: 2 }}>
            {(["all", "graded", "pending"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setGf(f)} style={{ height: 30, padding: "0 14px", borderRadius: 8, border: "none", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", background: gf === f ? "#FFFFFF" : "transparent", color: gf === f ? "var(--fg1)" : "var(--fg3)", boxShadow: gf === f ? "0 2px 6px rgba(0,32,63,.12)" : "none" }}>{f}</button>
            ))}
          </div>
          <div className="ev-push-end" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: "var(--fg4)", marginRight: 4 }}>Export</span>
            {["CSV", "XLSX", "PDF"].map((x) => (
              <button key={x} onClick={() => notWired(x + " export")} className="btn-ghost" style={{ height: 30, padding: "0 12px", borderRadius: 9, fontSize: 11.5, color: "var(--fg2)", background: "rgba(255,255,255,.7)" }}>{x}</button>
            ))}
          </div>
        </div>

        {/* Phones get real cards, not a sideways-scrolling table. A student's
            grade is the whole point of this page, and in a 640px-wide table it
            sits off the right edge of a 375px screen. */}
        <div className="ev-only-mobile" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((g, i) => (
            <div key={i} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.6)", padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); if (!downloadFile(g.wsName + ".pdf", "Worksheet for " + g.cls)) notWired("Downloading the worksheet"); }} className="ev-tap-link" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--brand-600)", textDecoration: "none" }}>{g.wsName}</a>
                  <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>{g.cls} · {g.at}</div>
                </div>
                <span style={{ flex: "none", fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 980, background: g.graded ? "rgba(34,160,91,.12)" : "rgba(245,166,35,.16)", color: g.graded ? "var(--success-700)" : "var(--warn-700)" }}>{g.grade}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.45, marginTop: 8 }}>{g.fb}</div>
              {g.returnedFile && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setPreview({ name: g.returnedFile!, meta: "Marked by your tutor" })}
                    className="btn-soft press ev-tap-h"
                    style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600 }}
                  >
                    View marked copy
                  </button>
                  <button
                    onClick={() => { if (!downloadFile(g.returnedFile!, "Marked by your tutor for " + g.wsName)) notWired("Downloading the marked copy"); }}
                    className="btn-ghost press ev-tap-h"
                    style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: "rgba(255,255,255,.8)", color: "var(--fg2)" }}
                  >
                    Download
                  </button>
                </div>
              )}
              <a href="#" onClick={(e) => { e.preventDefault(); if (!downloadFile(g.file, "Your submission for " + g.wsName)) notWired("Downloading your file"); }} className="ev-tap-link" style={{ fontSize: 11.5, color: "var(--fg3)", textDecoration: "none", marginTop: 2 }}>{g.file}</a>
            </div>
          ))}
        </div>

        <div className="thin-scroll ev-only-desktop" style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr .9fr .75fr 1.6fr", gap: 12, padding: "8px 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)", borderBottom: "1px solid rgba(0,32,63,.1)" }}>
              <div>CLASS</div><div>WORKSHEET / MY FILE</div><div>SUBMITTED</div><div>GRADE</div><div>TUTOR FEEDBACK</div>
            </div>
            {rows.map((g, i) => (
              <div key={i} className="row-hover" style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr .9fr .75fr 1.6fr", gap: 12, padding: "12px 10px", borderBottom: "1px solid rgba(0,32,63,.06)", alignItems: "center" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{g.cls}</div>
                <div style={{ minWidth: 0 }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); if (!downloadFile(g.wsName + ".pdf", "Worksheet for " + g.cls)) notWired("Downloading the worksheet"); }} style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--brand-600)", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.wsName}</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); if (!downloadFile(g.file, "Your submission for " + g.wsName)) notWired("Downloading your file"); }} style={{ display: "block", fontSize: 11, color: "var(--fg4)", textDecoration: "none", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.file}</a>
                </div>
                <div style={{ fontSize: 12, color: "var(--fg3)" }}>{g.at}</div>
                <div><span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 980, background: g.graded ? "rgba(34,160,91,.12)" : "rgba(245,166,35,.16)", color: g.graded ? "var(--success-700)" : "var(--warn-700)" }}>{g.grade}</span></div>
                <div style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.45 }}>
                  {g.fb}
                  {g.returnedFile && (
                    <span style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button
                        onClick={() => setPreview({ name: g.returnedFile!, meta: "Marked by your tutor" })}
                        style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, color: "var(--brand-600)" }}
                      >
                        View marked copy
                      </button>
                      <button
                        onClick={() => { if (!downloadFile(g.returnedFile!, "Marked by your tutor for " + g.wsName)) notWired("Downloading the marked copy"); }}
                        style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, color: "var(--fg3)" }}
                      >
                        Download
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12 }}>
          <span style={{ fontSize: 12, color: "var(--fg4)" }}>Showing {rows.length} of {allRows.length} submissions</span>
          <div className="ev-only-desktop" style={{ display: "flex", gap: 4 }}>
            <button className="mini-nav" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 13, color: "var(--fg5-decorative)" }}>‹</button>
            <button className="mini-nav" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 13, color: "var(--fg5-decorative)" }}>›</button>
          </div>
        </div>
      </div>
      {preview && (
        <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} annotate={false} />
      )}
    </div>
  );
}

function Stat({ label, value, note, noteColor }: { label: string; value: React.ReactNode; note: string; noteColor?: string }) {
  return (
    <div className="glass-stat">
      <div className="glass-stat-label">{label}</div>
      <div className="glass-stat-value">{value}</div>
      <div style={{ fontSize: 11.5, color: noteColor || "var(--fg4)", fontWeight: noteColor ? 600 : 400, marginTop: 2 }}>{note}</div>
    </div>
  );
}
