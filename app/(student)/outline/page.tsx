import React, { useMemo, useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { usePortal } from "@/lib/store";
import { OUTLINE_SUBJECTS, outlineAverage } from "@/lib/features";
import { Icon } from "@/components/ui/Icon";
import { SkeletonRows } from "@/components/ui/PageSkeleton";
import { AssessmentTable, AverageChip } from "@/components/portal/AssessmentTable";

const TERMS = ["Term 1", "Term 2", "Term 3", "Term 4"];

export default function OutlinePage() {
  const { outlines, uploadOutline, deleteOutline, updateAssessment, showToast, notWired } = usePortal();
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState("Term 3");
  const [fileName, setFileName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Default to the most recent outline (top of the list) so a fresh upload shows
  // its own scanning -> done state; an explicit click pins that one instead.
  const selected = useMemo(() => {
    if (selectedId) return outlines.find((o) => o.id === selectedId) || outlines[0] || null;
    return outlines[0] || null;
  }, [outlines, selectedId]);

  const submit = () => {
    if (!subject) {
      showToast("Choose the subject this outline is for");
      return;
    }
    if (!fileName) {
      showToast("Attach your outline file first");
      return;
    }
    uploadOutline(subject, term, fileName);
    showToast("Outline uploaded. Scanning for your assessments and topics");
    setSelectedId(null); // fall back to the newest outline so its scan shows
    setSubject("");
    setFileName("");
  };

  const hasNoOutline = outlines.length === 0;

  return (
    <div style={{ display: "grid", gap: 16, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* Reminder to upload a school outline (fires until at least one is in). */}
      {hasNoOutline && (
        <div className="glass-card" style={{ padding: "16px 20px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, background: "rgba(245,166,35,.08)", border: "1px solid rgba(245,166,35,.3)", flexWrap: "wrap" }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,166,35,.16)", color: "var(--warn-700)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon path="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v6h-2V7Zm0 8h2v2h-2v-2Z" size={19} />
          </span>
          <span style={{ flex: 1, minWidth: 200 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>Add your school outline</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg2)", marginTop: 2, lineHeight: 1.5 }}>
              You haven&apos;t uploaded a school outline yet. Add it so Elliot can build your assessment tracker and your tutor knows what you are studying. This is a friendly reminder - your tutor will keep nudging until it&apos;s in.
            </span>
          </span>
          <button onClick={() => fileRef.current?.click()} className="btn-primary press" style={{ height: 36, padding: "0 18px", borderRadius: 11, fontSize: 12.5, fontWeight: 700, flex: "none" }}>
            Upload now
          </button>
        </div>
      )}

    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
      {/* LEFT: upload + your outlines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="glass-card" style={{ padding: "20px 22px" }}>
          <h2 style={{ margin: "0 0 3px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Upload your course outline</h2>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--fg3)", lineHeight: 1.5 }}>
            Add the outline from your own school. Elliot scans it to build your assessment tracker, and shares a summary with your tutor so they know what you are studying.
          </p>

          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 }}>Subject</div>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="field" style={{ padding: "0 10px", marginBottom: 12 }} aria-label="Subject">
            <option value="">Choose a subject</option>
            {OUTLINE_SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 }}>Term (optional)</div>
          <select value={term} onChange={(e) => setTerm(e.target.value)} className="field" style={{ padding: "0 10px", marginBottom: 12 }} aria-label="Term">
            {TERMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
            className="dropzone"
            style={{ border: "1.5px dashed rgba(0,157,255,.4)", borderRadius: 16, background: "rgba(0,157,255,.05)", padding: 18, textAlign: "center", cursor: "pointer", marginBottom: 12, transition: "background .2s ease,border-color .2s ease" }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(0,157,255,.14)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <Icon path="M12 4 6 10h4v6h4v-6h4l-6-6ZM5 18h14v2H5v-2Z" size={18} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{fileName || "Attach your outline (PDF or image)"}</div>
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>Your upload stays separate from tutor materials</div>
            <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
          </div>

          <button onClick={submit} className="btn-primary" style={{ height: 42, padding: "0 22px", borderRadius: 12, fontSize: 13.5, width: "100%" }}>Scan my outline</button>
        </div>

        <div className="glass-card" style={{ padding: "18px 20px" }}>
          <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 800 }}>Your outlines</h2>
          {outlines.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "6px 0" }}>No outlines uploaded yet.</div>}
          {outlines.map((o) => {
            const on = selected?.id === o.id;
            const confirming = confirmRemove === o.id;
            return (
              // Row is a div, not a button: it holds its own remove control, and a
              // button cannot legally contain another button.
              <div key={o.id} className="list-hover" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", margin: "0 -10px", borderRadius: 10, background: on ? "rgba(0,157,255,.08)" : "transparent" }}>
                <button
                  onClick={() => setSelectedId(o.id)}
                  aria-pressed={on}
                  style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "center", gap: 11, padding: 0, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit", textAlign: "left" }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, flex: "none", background: "rgba(122,90,248,.13)", color: "var(--accent-violet)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z" size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.subject}</div>
                    <div style={{ fontSize: 11, color: "var(--fg4)" }}>{o.term} · {o.uploadedAt}</div>
                  </div>
                </button>
                {confirming ? (
                  // Two-step rather than a modal: deleting an outline also deletes
                  // the assessments scanned out of it, so it needs a deliberate
                  // second tap, but it does not warrant a dialog.
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flex: "none" }}>
                    <button
                      onClick={() => { deleteOutline(o.id); setConfirmRemove(null); setSelectedId(null); showToast("Outline removed"); }}
                      className="press ev-tap-h"
                      style={{ height: 28, padding: "0 11px", borderRadius: 8, border: "none", background: "var(--danger-500)", color: "#fff", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => setConfirmRemove(null)}
                      className="press ev-tap-h"
                      style={{ height: 28, padding: "0 11px", borderRadius: 8, border: "1px solid rgba(0,32,63,.12)", background: "rgba(255,255,255,.8)", color: "var(--fg2)", fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "none" }}>
                    <StatusChip status={o.status} />
                    <button
                      onClick={() => setConfirmRemove(o.id)}
                      aria-label={"Remove " + o.subject + " outline"}
                      title="Remove this outline"
                      className="press ev-tap"
                      style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(224,65,65,.08)", color: "var(--danger-500)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}
                    >
                      <Icon path="M9 3h6l1 2h4v2H4V5h4l1-2ZM6 9h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9Z" size={13} />
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: tracker + topics + tutor view */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!selected && (
          <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--fg4)" }}>Upload an outline to build your assessment tracker.</div>
          </div>
        )}

        {selected && selected.status === "pending" && (
          <div className="glass-card" style={{ padding: "22px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Scanning your outline</div>
            <div style={{ fontSize: 12.5, color: "var(--fg3)", margin: "4px 0 6px" }}>Elliot is reading {selected.fileName} for assessments and weekly topics.</div>
            {/* The shape of what is coming, filling in - not a mark that spins. */}
            <SkeletonRows rows={4} label="Scanning your outline" />
          </div>
        )}

        {selected && selected.status === "failed" && (
          <div className="glass-card" style={{ padding: "30px 22px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: "var(--danger-500)" }}>We could not read that outline</div>
            <div style={{ fontSize: 12.5, color: "var(--fg3)", margin: "6px 0 14px" }}>The file may be blank or unreadable. Try uploading a clearer copy.</div>
            <button onClick={() => uploadOutline(selected.subject, selected.term, selected.fileName)} className="btn-ghost" style={{ height: 36, padding: "0 16px", borderRadius: 11, fontSize: 12.5, background: "rgba(255,255,255,.8)" }}>Retry scan</button>
          </div>
        )}

        {selected && selected.status === "done" && (
          <>
            <div className="glass-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>Assessment tracker</h2>
                {/* Four items on one line is a desktop shape. On a phone the
                    two text items were each squeezed into a ~60px column and
                    wrapped to three lines, so they stay on one line each. */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <AverageChip assessments={selected.assessments} />
                  <span style={{ fontSize: 11.5, color: "var(--fg4)", whiteSpace: "nowrap" }}>{selected.subject} · {selected.term}</span>
                  {selected.courseId && (
                    <Link href={"/courses/" + selected.courseId} className="btn-ghost ev-tap-h" style={{ height: 28, padding: "0 12px", borderRadius: 9, fontSize: 11, fontWeight: 600, color: "var(--brand-600)", background: "rgba(255,255,255,.8)", display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap" }}>Open course page</Link>
                  )}
                  <button
                    onClick={() => deleteOutline(selected.id)}
                    className="btn-ghost"
                    style={{ height: 28, padding: "0 12px", borderRadius: 9, fontSize: 11, color: "var(--danger-500)", background: "rgba(224,65,65,.07)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--fg3)" }}>Extracted from {selected.fileName}. Tick things off, record your scores and fix any weightings the outline left vague.</p>
              <AssessmentTable outline={selected} onUpdate={(aid, patch) => updateAssessment(selected.id, aid, patch)} />
            </div>

            <div className="glass-card" style={{ padding: "20px 22px" }}>
              <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Week by week topics</h2>
              <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                {selected.topics.map((t) => (
                  <div key={t.week} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, flex: "none", background: "rgba(0,32,63,.05)", color: "var(--fg3)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.week}</span>
                    <span style={{ fontSize: 12.5, color: "var(--fg2)" }}>{t.topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "18px 20px", background: "rgba(0,157,255,.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Icon path="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" size={16} style={{ color: "var(--brand-600)" }} />
                <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800, color: "var(--brand-600)" }}>Shared with your tutor</h2>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--fg2)", lineHeight: 1.5 }}>
                Your tutor sees a read-only summary so they can prepare for what you are studying at school: the outline document, {selected.assessments.length} extracted assessments and {selected.topics.length} weekly topics. They can also open your original file as a read-only preview.
              </p>
              <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 6 }}>
                Next up for your tutor: <strong style={{ color: "var(--fg1)" }}>{(selected.assessments.find((a) => !a.done) ?? selected.assessments[0])?.name}</strong> in week {(selected.assessments.find((a) => !a.done) ?? selected.assessments[0])?.week}.
                {" "}Progress shared: {selected.assessments.filter((a) => a.done).length} of {selected.assessments.length} done{outlineAverage(selected.assessments) !== null ? ", sitting at a " + outlineAverage(selected.assessments) + "% average" : ""}.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}

function StatusChip({ status }: { status: "pending" | "done" | "failed" }) {
  const map = {
    pending: { label: "Scanning", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
    done: { label: "Ready", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
    failed: { label: "Failed", color: "var(--danger-500)", bg: "rgba(224,65,65,.12)" },
  }[status];
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: map.color, background: map.bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>{map.label}</span>;
}
