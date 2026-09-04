// Marking - the tutor's grading queue. Open a submission, assign a grade,
// write feedback, return it to the student (flows to the student's My Grades).

import React, { useState } from "react";
import { useTutor } from "@/lib/tutor-store";
import { GRADE_OPTIONS, TUTOR_COURSES, TUTOR_COURSE_ORDER } from "@/lib/tutor-data";
import { ICON } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";
import { downloadFile } from "@/lib/download";

export default function GradePage() {
  const { submissions, markSubmission, toMarkCount, notWired, hasOnline } = useTutor();
  const [openId, setOpenId] = useState<string | null>(null);
  const [grade, setGrade] = useState("A");
  const [feedback, setFeedback] = useState("");
  const [filter, setFilter] = useState<"all" | string>("all");
  const [q, setQ] = useState("");
  // The marked-up copy staged for the currently open submission, before it is
  // returned. Cleared whenever a different submission is opened.
  const [returned, setReturned] = useState<{ fileName: string; via: "annotated" | "uploaded" } | null>(null);
  const [annotating, setAnnotating] = useState<{ id: string; file: string } | null>(null);
  const uploadRef = React.useRef<HTMLInputElement>(null);

  const rows = submissions.filter((s) => {
    if (filter !== "all" && s.course !== filter) return false;
    if (q.trim() && !(s.student + " " + s.wsName + " " + s.file).toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });
  const queue = rows.filter((s) => !s.marked);
  const done = rows.filter((s) => s.marked);

  const startMarking = (id: string) => {
    setOpenId(openId === id ? null : id);
    setGrade("A");
    setFeedback("");
    setReturned(null);
  };

  /** Name for the marked-up version, kept distinct from the student's original. */
  const markedName = (file: string) => {
    const dot = file.lastIndexOf(".");
    return dot === -1 ? file + " (marked)" : file.slice(0, dot) + " (marked)" + file.slice(dot);
  };

  const submit = (id: string) => {
    if (!feedback.trim()) return;
    markSubmission(id, grade, feedback.trim(), returned ?? undefined);
    setOpenId(null);
    setFeedback("");
    setReturned(null);
  };

  if (!hasOnline) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>Marking is part of online teaching</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Your account is set up for in-person booklet requests only. Ask the office if your role is changing.</div>
      </div>
    );
  }

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* CONTROLS */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .06s backwards", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--danger-500)", background: "rgba(224,65,65,.1)", padding: "5px 12px", borderRadius: 980, flex: "none" }}>
          {toMarkCount} waiting
        </span>
        <div className="thin-scroll ev-filter-scroll" style={{ display: "inline-flex", borderRadius: 11, border: "1px solid rgba(0,32,63,.1)", flex: "none", maxWidth: "calc(100% - 6px)", overflowX: "auto" }}>
          {[{ id: "all", label: "All classes" }, ...TUTOR_COURSE_ORDER.map((id) => ({ id, label: TUTOR_COURSES[id].year }))].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                height: 36,
                padding: "0 15px",
                border: "none",
                cursor: "pointer",
                /* Keeps "Year 11" on one line - the strip already scrolls
                   sideways, so wrapping just made the tabs two lines tall. */
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 600,
                background: filter === f.id ? "var(--brand-500)" : "rgba(255,255,255,.7)",
                color: filter === f.id ? "#fff" : "var(--fg3)",
                transition: "background .18s ease,color .18s ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by student or worksheet" className="field" style={{ flex: 1, minWidth: 200, height: 36 }} />
      </div>

      {/* QUEUE */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .12s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, marginBottom: 6 }}>Waiting on you</h2>
        {queue.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--fg4)" }}>
            <Icon path={ICON.grade} size={32} style={{ color: "var(--fg5-decorative)" }} />
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8, color: "var(--fg3)" }}>Nothing to mark here</div>
            <div style={{ fontSize: 12, marginTop: 2 }}>New submissions land in this queue the moment students upload.</div>
          </div>
        )}
        {queue.map((s, i) => {
          const cd = TUTOR_COURSES[s.course];
          const open = openId === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="ev-row-stack" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: !open && i < queue.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                <span style={{ width: 36, height: 36, borderRadius: "50%", background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flex: "none" }}>{s.init}</span>
                <span className="ev-row-main" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.student} · {s.wsName}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>{cd.name} · submitted {s.when}</span>
                </span>
                <button
                  onClick={() => {
                    const ok = downloadFile(s.file, "Submitted by " + s.student + " for " + s.wsName);
                    if (!ok) notWired('Downloading "' + s.file + '"');
                  }}
                  title={"Download " + s.file}
                  className="btn-ghost ev-title-2"
                  style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", flex: "none", maxWidth: "100%" }}
                >
                  {s.file}
                </button>
                <button onClick={() => startMarking(s.id)} className={(open ? "btn-ghost press" : "btn-primary press") + " ev-row-end"} style={{ height: 30, padding: "0 14px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>
                  {open ? "Close" : "Mark"}
                </button>
              </div>
              {open && (
                <div style={{ background: "rgba(255,255,255,.55)", border: "1px solid rgba(0,32,63,.07)", borderRadius: 14, padding: "16px 18px", margin: "2px 0 12px", animation: "evfadein .22s ease" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {GRADE_OPTIONS.map((g) => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className="press"
                        style={{
                          height: 32,
                          padding: "0 15px",
                          borderRadius: 980,
                          border: grade === g ? "none" : "1px solid rgba(0,32,63,.12)",
                          background: grade === g ? "var(--brand-500)" : "rgba(255,255,255,.8)",
                          color: grade === g ? "#fff" : "var(--fg2)",
                          fontFamily: "inherit",
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "background .18s ease,color .18s ease",
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {/* Mark up the work itself. Two routes, because tutors split
                      between annotating on screen and marking a printed or
                      tablet copy and handing that back. */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <button
                      onClick={() => setAnnotating({ id: s.id, file: s.file })}
                      className="btn-soft press"
                      style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600 }}
                    >
                      Annotate the file
                    </button>
                    <button
                      onClick={() => {
                        const ok = downloadFile(s.file, "Submitted by " + s.student + " for " + s.wsName);
                        if (!ok) notWired('Downloading "' + s.file + '"');
                      }}
                      className="btn-ghost press"
                      style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: "rgba(255,255,255,.8)", color: "var(--fg2)" }}
                    >
                      Download the work
                    </button>
                    <button
                      onClick={() => uploadRef.current?.click()}
                      className="btn-ghost press"
                      style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: "rgba(255,255,255,.8)", color: "var(--fg2)" }}
                    >
                      Upload a marked copy
                    </button>
                    {returned && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "5px 11px", borderRadius: 980 }}>
                        {returned.via === "annotated" ? "Annotated" : "Uploaded"} · {returned.fileName}
                        <button
                          onClick={() => setReturned(null)}
                          aria-label="Remove the marked copy"
                          className="press"
                          style={{ border: "none", background: "transparent", color: "var(--success-700)", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </div>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Feedback for the student"
                    rows={3}
                    maxLength={400}
                    style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid rgba(0,32,63,.12)", background: "rgba(255,255,255,.85)", padding: "11px 13px", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", resize: "vertical" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>
                      {returned
                        ? "The grade, feedback and marked copy go straight to " + s.student.split(" ")[0] + "'s My Grades."
                        : "The grade and feedback appear straight away in " + s.student.split(" ")[0] + "'s My Grades."}
                    </span>
                    <button
                      onClick={() => submit(s.id)}
                      className="btn-primary press"
                      style={{ height: 36, padding: "0 20px", borderRadius: 11, fontSize: 12.5, opacity: feedback.trim() ? 1 : 0.5 }}
                    >
                      Return to student
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <input
        ref={uploadRef}
        type="file"
        accept=".pdf,image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const name = e.target.files?.[0]?.name;
          if (name) setReturned({ fileName: name, via: "uploaded" });
          e.target.value = "";
        }}
      />
      {annotating && (
        <PdfPreviewModal
          open
          onClose={() => setAnnotating(null)}
          fileName={annotating.file}
          meta="Marking - your annotations are saved onto a copy"
          onSaveAnnotations={() => {
            setReturned({ fileName: markedName(annotating.file), via: "annotated" });
            setAnnotating(null);
          }}
        />
      )}

      {/* MARKED */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .18s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, marginBottom: 6 }}>Recently marked</h2>
        {done.map((s, i) => {
          const cd = TUTOR_COURSES[s.course];
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < done.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, flex: "none" }}>{s.init}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="ev-title-2" style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.student} · {s.wsName}</span>
                <span className="ev-title-2" style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>&ldquo;{s.feedback}&rdquo;</span>
                {s.returnedFile && (
                  <span style={{ display: "block", fontSize: 10.5, color: "var(--brand-600)", fontWeight: 600, marginTop: 2 }}>
                    Marked copy returned · {s.returnedFile}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "5px 12px", borderRadius: 980, flex: "none" }}>{s.grade}</span>
            </div>
          );
        })}
        {done.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "8px 0" }}>Marked work will appear here.</div>}
      </div>
    </div>
  );
}
