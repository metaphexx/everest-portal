// Shared files: the office's oversight ledger.
//
// The tutor portal promises that the office can see every file shared on the
// platform. This is the screen that makes that promise true, so it has to show
// the same thing the tutor was warned about: the file, who sent it, who
// received it, through which surface, and when.
//
// Anything a tutor assigns during the demo appears here within the second,
// because the list is built from the live assignment records rather than a
// second copy of them.

import React, { useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";

const IC = {
  eye: "M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z",
};

const KIND_META: Record<string, { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
  message: { label: "Message", color: "var(--accent-violet)", bg: "rgba(122,90,248,.13)" },
  classroom: { label: "Classroom", color: "var(--accent-teal)", bg: "rgba(14,156,142,.13)" },
  drive: { label: "Drive", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
};

export default function AdminFiles() {
  const { sharedFiles, notWired } = useAdmin();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string>("all");

  const shown = sharedFiles.filter((f) => {
    if (kind !== "all" && f.kind !== kind) return false;
    const ql = q.trim().toLowerCase();
    return !ql || (f.file + " " + f.from + " " + f.to + " " + f.context).toLowerCase().includes(ql);
  });

  const KINDS = [
    { id: "all", label: "Everything" },
    { id: "assigned", label: "Assigned" },
    { id: "message", label: "In messages" },
    { id: "classroom", label: "In classrooms" },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div
        className="glass-card"
        style={{ gridColumn: "span 12", padding: "14px 18px", boxSizing: "border-box", display: "flex", alignItems: "flex-start", gap: 11, border: "1px solid rgba(0,157,255,.25)", background: "rgba(0,157,255,.05)", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}
      >
        <Icon path={IC.eye} size={17} style={{ color: "var(--brand-600)", flex: "none", marginTop: 2 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--fg2)", lineHeight: 1.6 }}>
          <strong style={{ fontWeight: 700 }}>Tutors know you can see this.</strong> Every tutor is shown a notice on My Drive, in the classroom composer and
          in message threads saying the office can see every file they upload, assign or share, along with who sent it and when.
        </span>
      </div>

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by file, sender or recipient" aria-label="Search shared files" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box", marginBottom: 12 }} />
        <div className="ev-scroll-x" style={{ display: "flex", gap: 8 }}>
          {KINDS.map((k) => {
            const on = kind === k.id;
            return (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                aria-pressed={on}
                className="press ev-tap-h"
                style={{ height: 36, padding: "0 15px", borderRadius: 980, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", background: on ? "var(--accent-teal)" : "rgba(255,255,255,.8)", color: on ? "#fff" : "var(--fg3)" }}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "8px 20px 16px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .1s backwards" }}>
        {shown.length === 0 && <div style={{ padding: "26px 0", textAlign: "center", fontSize: 12.5, color: "var(--fg4)" }}>No files match that search.</div>}
        {shown.map((f) => {
          const meta = KIND_META[f.kind];
          return (
            <div key={f.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid rgba(0,32,63,.06)" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon path={IC.file} size={15} style={{ color: meta.color }} />
              </span>
              <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 }}>{f.file}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--fg3)", marginTop: 3 }}>
                  {f.from} to {f.to}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                  {f.context} · {f.when}
                </span>
              </span>
              <span className="ev-row-end" style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: meta.color, background: meta.bg, padding: "4px 10px", borderRadius: 980 }}>{meta.label}</span>
                <button onClick={() => notWired("File preview")} className="btn-ghost press ev-tap-h" style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                  Preview
                </button>
              </span>
            </div>
          );
        })}
        <div style={{ fontSize: 11.5, color: "var(--fg4)", paddingTop: 12 }}>
          {shown.length} of {sharedFiles.length} files shared on the platform.
        </div>
      </div>
    </div>
  );
}
