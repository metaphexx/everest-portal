// Student Outlines - the tutor side of Feature 1. Grouped by CLASS so it stays
// readable with a full roster: each class is a card you expand to see its
// students, each student shows their outline status (submitted / scanning /
// not submitted), and a submitted student expands again to reveal the scanned
// assessment schedule + weekly topics. Year 7-10 students who haven't uploaded
// are auto-reminded, and the tutor can send a manual nudge to anyone.

import React, { useEffect, useMemo, useState } from "react";
import { useTutor } from "@/lib/tutor-store";
import {
  OutlineRosterEntry,
  SharedOutline,
  TUTOR_COURSES,
  TUTOR_COURSE_ORDER,
  TutorCourseId,
  courseYear,
  isReminderYear,
  outlineRoster,
  seedSharedOutlines,
} from "@/lib/tutor-data";
import { ICON } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { Outline, outlineAverage } from "@/lib/features";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";

const STATUS_CHIP: Record<OutlineRosterEntry["status"], { label: string; color: string; bg: string }> = {
  done: { label: "Submitted", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
  pending: { label: "Scanning", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  failed: { label: "Scan failed", color: "var(--danger-500)", bg: "rgba(224,65,65,.12)" },
  missing: { label: "Not submitted", color: "var(--danger-500)", bg: "rgba(224,65,65,.1)" },
};

export default function StudentOutlinesPage() {
  const { hasOnline, showToast } = useTutor();
  const outlines = useMemo(() => seedSharedOutlines(), []);

  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set([TUTOR_COURSE_ORDER[0]]));
  const [openOutline, setOpenOutline] = useState<string | null>(null);
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  // Raw outline file the tutor is previewing (read-only, no annotation).
  const [preview, setPreview] = useState<SharedOutline | null>(null);

  // Live self-entered progress from the student portal (same demo browser):
  // Maya's scores/averages sync straight through to the tutor.
  const [live, setLive] = useState<Outline[]>([]);
  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem("evr-portal");
        if (!raw) return;
        const p = JSON.parse(raw);
        if (p && Array.isArray(p.outlines)) setLive(p.outlines.filter((o: Outline) => o.status === "done"));
      } catch {
        /* ignore */
      }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const rosters = useMemo(
    () => TUTOR_COURSE_ORDER.map((cid) => ({ cid, roster: outlineRoster(cid, outlines) })),
    [outlines]
  );

  // ---- stats across every class ----
  const allEntries = rosters.flatMap((r) => r.roster);
  const stats = {
    total: allEntries.length,
    done: allEntries.filter((e) => e.status === "done").length,
    pending: allEntries.filter((e) => e.status === "pending").length,
    missing: allEntries.filter((e) => e.status === "missing").length,
  };
  // Year 7-10 students still missing an outline (the auto-reminder cohort).
  const outstanding = rosters
    .filter((r) => isReminderYear(r.cid))
    .flatMap((r) => r.roster.filter((e) => e.status === "missing").map((e) => ({ cid: r.cid, name: e.name })));

  const key = (cid: string, name: string) => cid + ":" + name;

  const nudge = (cid: string, name: string) => {
    setNudged((s) => new Set(s).add(key(cid, name)));
    showToast("Reminder sent to " + name + " to upload their school outline");
  };
  const nudgeAll = () => {
    if (outstanding.length === 0) return;
    setNudged((s) => {
      const next = new Set(s);
      outstanding.forEach((o) => next.add(key(o.cid, o.name)));
      return next;
    });
    showToast("Reminder sent to " + outstanding.length + " Year 7-10 student" + (outstanding.length === 1 ? "" : "s"));
  };

  const toggleCourse = (cid: string) =>
    setOpenCourses((s) => {
      const next = new Set(s);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });

  if (!hasOnline) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>Student Outlines is part of online teaching</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Your account is set up for in-person booklet requests only. Ask the office if your role is changing.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 16 }}>
      {/* OVERVIEW STATS */}
      <div className="glass-card" style={{ padding: "18px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <h2 className="portal-section-title" style={{ fontSize: 15 }}>Outline overview</h2>
          <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>Across all your classes</span>
        </div>
        <div className="ev-stats-2up" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
          {[
            { label: "STUDENTS", value: stats.total, color: "var(--fg1)" },
            { label: "SUBMITTED", value: stats.done, color: "var(--success-700)" },
            { label: "SCANNING", value: stats.pending, color: "var(--warn-700)" },
            { label: "NOT SUBMITTED", value: stats.missing, color: "var(--danger-500)" },
          ].map((s) => (
            <div key={s.label} style={{ border: "1px solid rgba(0,32,63,.07)", borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,.5)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginTop: 4, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        {outstanding.length > 0 && (
          <div className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, background: "rgba(245,166,35,.08)", border: "1px solid rgba(245,166,35,.28)", borderRadius: 12, padding: "10px 14px", flexWrap: "wrap" }}>
            <Icon path="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v6h-2V7Zm0 8h2v2h-2v-2Z" size={17} style={{ color: "var(--warn-700)", flex: "none" }} />
            <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--fg2)" }}>
              <b>{outstanding.length} Year 7-10 student{outstanding.length === 1 ? "" : "s"}</b> haven&apos;t uploaded a school outline. They are reminded automatically - you can also send a manual nudge.
            </span>
            <button onClick={nudgeAll} className="btn-primary press ev-wrap-cta" style={{ height: 32, padding: "0 15px", borderRadius: 9, fontSize: 12, fontWeight: 700, flex: "none" }}>
              Nudge all outstanding
            </button>
          </div>
        )}
        {live.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 10, fontSize: 12, color: "var(--fg3)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success-500)", animation: "evpulse 1.8s ease-in-out infinite", flex: "none" }} />
            Live: {live.map((o) => {
              const avg = outlineAverage(o.assessments);
              return o.subject + (avg !== null ? " " + avg + "%" : "");
            }).join(" · ")} updating in real time from the student portal.
          </div>
        )}
      </div>

      {/* PER-CLASS CARDS */}
      {rosters.map(({ cid, roster }, idx) => {
        const cd = TUTOR_COURSES[cid];
        const open = openCourses.has(cid);
        const done = roster.filter((e) => e.status === "done");
        const missing = roster.filter((e) => e.status === "missing").length;
        // class average across submitted students that have scored assessments
        const avgs = done.map((e) => outlineAverage(e.outline!.assessments)).filter((v): v is number => v !== null);
        const classAvg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
        return (
          <div key={cid} className="glass-card" style={{ padding: 0, overflow: "hidden", boxSizing: "border-box", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.06 + idx * 0.05}s backwards` }}>
            {/* Class header - photo + colour banner, click to expand roster */}
            <button
              onClick={() => toggleCourse(cid)}
              aria-expanded={open}
              style={{ position: "relative", display: "block", width: "100%", border: "none", padding: 0, background: "none", fontFamily: "inherit", textAlign: "left", cursor: "pointer" }}
            >
              <span aria-hidden className="ev-kenburns" style={{ position: "absolute", inset: 0, backgroundImage: `url(${cd.photo})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <span aria-hidden style={{ position: "absolute", inset: 0, background: cd.grad }} />
              <span className="ev-wrap-row" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", minHeight: 80, boxSizing: "border-box", color: "#fff" }}>
                <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", backdropFilter: "blur(4px)" }}>
                  <Icon path={cd.icon} size={19} />
                </span>
                <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, letterSpacing: -0.2 }}>{cd.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, opacity: 0.88, marginTop: 2 }}>
                    {cd.year} · {done.length} of {roster.length} outlines received{isReminderYear(cid) ? " · auto-reminders on" : ""}
                  </span>
                </span>
                {classAvg !== null && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: cd.color, background: "rgba(255,255,255,.92)", padding: "5px 11px", borderRadius: 980, flex: "none" }}>{classAvg}% class avg</span>
                )}
                {missing > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(224,65,65,.85)", padding: "5px 11px", borderRadius: 980, flex: "none" }}>{missing} missing</span>
                )}
                <Icon path="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z" size={16} style={{ color: "#fff", flex: "none", marginLeft: "auto", transition: "transform .2s ease", transform: open ? "rotate(180deg)" : "none" }} />
              </span>
            </button>

            {/* Roster */}
            {open && (
              <div style={{ padding: "8px 20px 16px", animation: "evfadein .22s ease" }}>
                {roster.map((e, i) => {
                  const sc = STATUS_CHIP[e.status];
                  const avg = e.outline ? outlineAverage(e.outline.assessments) : null;
                  const scored = e.outline ? e.outline.assessments.filter((a) => a.score) : [];
                  const isOpen = e.outline && openOutline === e.outline.id;
                  const wasNudged = nudged.has(key(cid, e.name));
                  return (
                    <div key={e.name} style={{ borderTop: i === 0 ? "1px solid rgba(0,32,63,.06)" : "none", borderBottom: "1px solid rgba(0,32,63,.06)" }}>
                      <div className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0" }}>
                        <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,32,63,.06)", color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, flex: "none" }}>{e.init}</span>
                        <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</span>
                          {e.outline && (
                            <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>
                              {e.status === "done" ? e.outline.subject + " · uploaded " + e.outline.uploadedAt : "Uploaded " + e.outline.uploadedAt}
                            </span>
                          )}
                        </span>
                        {e.status === "done" && avg !== null && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: cd.color, background: cd.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{avg}% avg</span>
                        )}
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: sc.color, background: sc.bg, padding: "4px 11px", borderRadius: 980, flex: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {e.status === "pending" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warn-500)", animation: "evpulse 1.4s ease-in-out infinite" }} />}
                          {e.status === "done" ? "Submitted · " + e.outline!.assessments.length + " assessments" : sc.label}
                        </span>
                        {e.status === "done" && (
                          <button onClick={() => setOpenOutline(isOpen ? null : e.outline!.id)} className={(isOpen ? "btn-ghost press" : "btn-primary press") + " ev-row-end"} style={{ height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11, flex: "none" }}>
                            {isOpen ? "Hide" : "View outline"}
                          </button>
                        )}
                        {e.status === "pending" && (
                          <button onClick={() => setPreview(e.outline!)} className="btn-soft press ev-row-end" style={{ height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11, flex: "none" }}>
                            Preview file
                          </button>
                        )}
                        {e.status === "missing" && (
                          wasNudged ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.1)", padding: "5px 11px", borderRadius: 980, flex: "none" }}>Reminded</span>
                          ) : (
                            <button onClick={() => nudge(cid, e.name)} className="btn-soft press ev-row-end" style={{ height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11, flex: "none" }}>
                              Send nudge
                            </button>
                          )
                        )}
                      </div>

                      {/* Outline detail */}
                      {isOpen && e.outline && (
                        <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,.9fr)", gap: 18, padding: "4px 0 16px 43px", animation: "evfadein .22s ease" }}>
                          {/* Source file - the raw outline the student uploaded, previewable read-only */}
                          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 11, border: "1px solid rgba(0,32,63,.07)", borderRadius: 12, padding: "9px 13px", background: "rgba(255,255,255,.5)" }}>
                            <span style={{ width: 32, height: 32, borderRadius: 10, background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                              <Icon path={ICON.doc} size={14} />
                            </span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.outline.fileName}</span>
                              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>Original school outline · uploaded {e.outline.uploadedAt}</span>
                            </span>
                            <button onClick={() => setPreview(e.outline!)} className="btn-soft press ev-row-end" style={{ height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11, flex: "none" }}>
                              Preview file
                            </button>
                          </div>
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 8 }}>SCHOOL ASSESSMENT SCHEDULE</div>
                            {e.outline.assessments.map((a, ai) => (
                              <div key={ai} style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 0", borderBottom: ai < e.outline!.assessments.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                                <span style={{ width: 32, height: 32, borderRadius: 10, background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                                  <Icon path={a.type === "Exam" ? ICON.grade : ICON.doc} size={14} />
                                </span>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 600 }}>{a.name}</span>
                                  <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{a.type} · week {a.week} · due {a.due}</span>
                                </span>
                                {a.score ? (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "4px 10px", borderRadius: 980, flex: "none" }}>{a.score}</span>
                                ) : (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: cd.color, background: cd.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{a.weight}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 8 }}>WEEK BY WEEK AT SCHOOL</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              {e.outline.topics.map((t) => (
                                <div key={t.week} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, padding: "2px 0" }}>
                                  <span style={{ width: 28, flex: "none", fontSize: 10.5, fontWeight: 700, color: "var(--fg3)" }}>W{t.week}</span>
                                  <span style={{ minWidth: 0 }}>{t.topic}</span>
                                </div>
                              ))}
                            </div>
                            {scored.length > 0 && (
                              <div style={{ marginTop: 12, fontSize: 12, color: "var(--fg2)", background: "rgba(122,90,248,.08)", borderRadius: 10, padding: "10px 13px", lineHeight: 1.55 }}>
                                <b style={{ color: "var(--accent-purple)" }}>Marks recorded:</b> {scored.map((a) => a.name.split(":")[0] + " " + a.score).join(", ")}. {e.name.split(" ")[0]} is tracking these in their own Assessment Tracker.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="glass-card" style={{ padding: "16px 22px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .55s cubic-bezier(.16,1,.3,1) .3s backwards" }}>
        <Icon path={ICON.clipboard} size={18} style={{ color: "var(--fg4)", flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: "var(--fg3)" }}>
          Year 7-10 students are reminded until they submit.
        </span>
      </div>

      {/* Read-only preview of the raw outline file a student uploaded */}
      <PdfPreviewModal
        open={preview !== null}
        onClose={() => setPreview(null)}
        fileName={preview?.fileName ?? ""}
        meta={preview ? preview.student + " · " + preview.subject + " · uploaded " + preview.uploadedAt : undefined}
        annotate={false}
      />
    </div>
  );
}
