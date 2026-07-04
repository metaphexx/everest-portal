"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { BASE_SUBMISSIONS, ICON, TUTOR_FILES, wsBase } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";

export default function DrivePage() {
  const { done, setDrivePick, showToast, notWired } = usePortal();
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<{ name: string; meta: string } | null>(null);

  const pending = wsBase().filter((w) => !done[w.id]);
  const subNow = wsBase()
    .filter((w) => done[w.id])
    .map((w) => ({ name: "Maya_" + w.name.split(" ")[0] + ".pdf", kind: "Matched to: " + w.name, size: "1.1 MB", when: "Just now", color: "var(--brand-500)", bg: "rgba(0,157,255,.12)" }));
  const ql = q.trim().toLowerCase();
  const matches = (hay: string) => !ql || hay.toLowerCase().includes(ql);
  const mySubs = [...subNow, ...BASE_SUBMISSIONS].filter((f) => matches(f.name + " " + f.kind));
  const tutorFiles = TUTOR_FILES.filter((f) => matches(f.name + " " + f.from));

  const doUpload = () => {
    if (pending.length === 0) {
      showToast("Everything assigned has already been submitted");
      return;
    }
    setDrivePick(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* Search across the drive */}
      <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 14px", height: 44 }}>
        <Icon path="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z" size={15} style={{ color: "var(--fg4)", flex: "none" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your drive: submissions, tutor files, worksheets"
          aria-label="Search your drive"
          style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", minWidth: 0, outline: "none" }}
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Clear search" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--fg4)", fontWeight: 700 }}>✕</button>
        )}
      </div>

      <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
      {/* Submit your worksheets */}
      <div className="glass-card" style={{ padding: "20px 22px" }}>
        <h2 style={{ margin: "0 0 3px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Submit your worksheets</h2>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--fg3)" }}>Upload completed worksheets that were assigned to you.</p>
        <button onClick={doUpload} className="dropzone" style={{ border: "1.5px dashed rgba(0,157,255,.4)", borderRadius: 16, background: "rgba(0,157,255,.05)", padding: 20, textAlign: "center", cursor: "pointer", marginBottom: 8, transition: "background .2s ease,border-color .2s ease", fontFamily: "inherit", width: "100%" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,157,255,.14)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <Icon path="M12 4 6 10h4v6h4v-6h4l-6-6ZM5 18h14v2H5v-2Z" size={18} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Upload a completed worksheet</div>
          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>You will match it to its assigned task so your tutor knows what has come back</div>
        </button>
        {ql && mySubs.length === 0 && <div style={{ fontSize: 12, color: "var(--fg4)", padding: "10px 0" }}>No submissions match &quot;{q}&quot;.</div>}
        {mySubs.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < mySubs.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: f.bg, color: f.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path={ICON.doc} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
              <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{f.kind} · {f.size} · {f.when}</div>
            </div>
            <button onClick={() => notWired('Downloading "' + f.name + '"')} className="btn-soft" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>Download</button>
          </div>
        ))}
      </div>

      {/* From your tutors - shared booklets are view + annotate only, no download */}
      <div className="glass-card" style={{ padding: "20px 22px" }}>
        <h2 style={{ margin: "0 0 3px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>From your tutors</h2>
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--fg3)" }}>Extra material your tutors have shared with you.</p>
        {ql && tutorFiles.length === 0 && <div style={{ fontSize: 12, color: "var(--fg4)", padding: "10px 0" }}>No shared files match &quot;{q}&quot;.</div>}
        {tutorFiles.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < tutorFiles.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: f.bg, color: f.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path={ICON.doc} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
              <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>From {f.from} · {f.when}</div>
            </div>
            <button onClick={() => setPreview({ name: f.name, meta: "From " + f.from })} className="btn-soft" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>Preview</button>
          </div>
        ))}
      </div>
      </div>

      {preview && (
        <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} />
      )}
    </div>
  );
}
