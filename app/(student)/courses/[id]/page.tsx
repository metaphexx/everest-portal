import React, { useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { notFound, useParams, useRouter } from "@/lib/router";
import { usePortal } from "@/lib/store";
import {
  ACCENT,
  COURSE_DEFS,
  CourseId,
  EVENTS,
  ICON,
  iconForResource,
  gradeBase,
  libAll,
  wsBase,
} from "@/lib/data";
import { monthGrid, monthLabel, todayKey } from "@/lib/calendar";
import { Icon } from "@/components/ui/Icon";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { AssessmentTable, AverageChip } from "@/components/portal/AssessmentTable";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";
import { MATERIAL_KIND_META, MaterialAssignment, TUTOR_COURSE_FOR } from "@/lib/tutor-data";

const SUBJECT_FOR_COURSE: Record<CourseId, string> = {
  chem: "Chemistry ATAR",
  verbal: "English ATAR",
  gate: "Mathematics Methods ATAR",
};

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const cid = params.id as CourseId;
  const cd = COURSE_DEFS[cid];
  const { now, done, submitWorksheet, openModal, showToast, outlines, uploadOutline, deleteOutline, updateAssessment, assignedToMe, submitAssignedWorksheet } = usePortal();
  const router = useRouter();
  const [sessTab, setSessTab] = useState<"upcoming" | "past">("upcoming");
  const [calM, setCalM] = useState<{ vm: number; vy: number } | null>(null);
  const [preview, setPreview] = useState<{ name: string; meta: string } | null>(null);
  const outlineFileRef = useRef<HTMLInputElement>(null);
  if (!cd) return notFound();
  const tKey = todayKey(now);

  const mats = libAll().filter((r) => r.course === cid);
  const results = gradeBase().filter((r) => r.cls.indexOf(cd.gradePrefix) === 0);

  // Course outline linked to this course (2-way sync with the Assessment Tracker).
  const outline = outlines.find((o) => o.courseId === cid) ?? null;

  // All sessions for this course, split around today.
  const allSessions: { dateLabel: string; time: string; k: string; title: string; tutor: string }[] = [];
  Object.keys(EVENTS)
    .sort()
    .forEach((k) => {
      (EVENTS[k] || []).forEach((e) => {
        if (e.title === cd.evTitle) {
          const d = new Date(k + "T12:00:00");
          allSessions.push({ dateLabel: d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }), time: e.time, k, title: e.title, tutor: e.tutor });
        }
      });
    });
  const upcomingSessions = allSessions.filter((s) => s.k >= tKey);
  const pastSessions = allSessions.filter((s) => s.k < tKey).reverse();
  const sessions = (sessTab === "upcoming" ? upcomingSessions : pastSessions).slice(0, 4);
  const sessionDays = new Set(allSessions.map((s) => s.k));

  const nowD = new Date(now);
  const vm = calM?.vm ?? nowD.getMonth();
  const vy = calM?.vy ?? nowD.getFullYear();
  const grid = monthGrid(vm, vy);

  const cWs = wsBase().filter((w) => w.course === cid);

  // Materials the tutor assigned via the online classroom (booklets to read,
  // worksheets to complete and send back). Only courses with a live tutor
  // classroom mapping (see TUTOR_COURSE_FOR) show anything here.
  const tutorCourseId = TUTOR_COURSE_FOR[cid];
  const tutorAssignments: MaterialAssignment[] = tutorCourseId ? assignedToMe().filter((a) => a.courseId === tutorCourseId) : [];
  // Everything except worksheets is a "read this" material (booklet, study
  // notes, video, recording, reference notes) - worksheets are the only kind
  // with a submit-back action, so they get their own section below.
  const assignedMaterials = tutorAssignments.filter((a) => a.kind !== "worksheet");
  const assignedWorksheets = tutorAssignments.filter((a) => a.kind === "worksheet");

  const doUploadOutline = (fileName: string) => {
    if (!fileName) return;
    uploadOutline(SUBJECT_FOR_COURSE[cid] ?? cd.name, "Term 3", fileName, cid);
    showToast("Outline uploaded. Elliot is scanning it for assessments");
  };

  const openSession = (s: { title: string; tutor: string; time: string; k: string }) => {
    const d = new Date(s.k + "T12:00:00");
    openModal({ title: s.title, tutor: s.tutor, time: s.time, color: ACCENT[cid].color, bg: ACCENT[cid].bg, cid, k: s.k, dateLabel: d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      <Link href="/courses" className="ev-tap-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--fg3)", textDecoration: "none", width: "fit-content" }}>
        <Icon path="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12l4.6-4.6Z" size={13} />
        Back to courses
      </Link>

      {/* HERO */}
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 210, boxShadow: "0 18px 40px -20px rgba(0,32,63,.45)" }}>
        <ImageSlot
          slotId={cd.slotId}
          fallbackSrc={cd.photo}
          placeholder="Drop a class photo for this course"
          className="ev-kenburns"
          style={{ position: "absolute", inset: 0, animation: ["evkenburns1 26s", "evkenburns2 31s", "evkenburns3 35s"][cid.charCodeAt(0) % 3] + " ease-in-out infinite" }}
        />
        <div style={{ position: "absolute", inset: 0, background: cd.grad, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 2, padding: "20px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", color: "#fff" }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon path={cd.icon} size={19} style={{ color: "#fff" }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>{cd.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                <Pill>{cd.tutor}</Pill>
                <Pill>{cd.sched}</Pill>
                <Pill>{cd.lessons}</Pill>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, opacity: 0.8 }}>NEXT SESSION</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{cd.next}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {tutorCourseId && (
                  <Link
                    href={"/classroom/" + tutorCourseId}
                    className="lift-2"
                    style={{ height: 40, padding: "0 18px", borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.18)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.55)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, textDecoration: "none", cursor: "pointer" }}
                  >
                    <Icon path={ICON.chat} size={15} style={{ color: "#fff" }} />
                    Open classroom
                  </Link>
                )}
                <button onClick={() => showToast("The classroom link opens at class time")} className="lift-2" style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "none", background: "rgba(255,255,255,.95)", color: "var(--navy-500)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px -10px rgba(0,32,63,.5)" }}>
                  Join next session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16, alignItems: "start" }}>
        <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Course materials */}
          <div className="glass-card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Course materials</h2>
              <Link href="/library" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>View all in library</Link>
            </div>
            {mats.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < mats.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: ACCENT[r.course].bg, color: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon path={iconForResource(r.icon)} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{r.date} · {r.meta}</div>
                </div>
                <button onClick={() => setPreview({ name: r.name, meta: r.meta })} className="btn-soft" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>Preview</button>
              </div>
            ))}
          </div>

          {/* Assigned by your tutor: booklets to read + worksheets to submit back */}
          {tutorCourseId && (
            <div className="glass-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Assigned by your tutor</h2>
                <Link href={"/classroom/" + tutorCourseId} style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>Open classroom</Link>
              </div>
              {tutorAssignments.length === 0 && (
                <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--fg4)" }}>Nothing assigned yet for this course.</p>
              )}

              {assignedMaterials.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {assignedMaterials.map((a, i) => {
                    const km = MATERIAL_KIND_META[a.kind];
                    return (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < assignedMaterials.length - 1 || assignedWorksheets.length > 0 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: ACCENT[cid].bg, color: ACCENT[cid].color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon path={ICON.doc} size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: km.color, background: km.bg, padding: "1px 8px", borderRadius: 980, flex: "none" }}>{km.label}</span>
                            <span style={{ fontSize: 11, color: "var(--fg4)" }}>Assigned {new Date(a.assignedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                          </div>
                        </div>
                        <button onClick={() => setPreview({ name: a.fileName, meta: km.label })} className="btn-soft" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>Preview</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {assignedWorksheets.length > 0 && (
                <div style={{ marginTop: assignedMaterials.length > 0 ? 4 : 0 }}>
                  {assignedWorksheets.map((a, i) => {
                    const due = a.due ? new Date(a.due + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : null;
                    return (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < assignedWorksheets.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: "rgba(122,90,248,.13)", color: "var(--accent-purple)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon path={ICON.doc} size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName}</div>
                          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>
                            {due ? "Due " + due : "No due date set"}
                          </div>
                        </div>
                        {a.status === "graded" ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "6px 13px", borderRadius: 980, flex: "none" }}>Graded</span>
                        ) : a.status === "submitted" ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "6px 13px", borderRadius: 980, flex: "none" }}>Submitted, waiting on marking</span>
                        ) : (
                          <button onClick={() => submitAssignedWorksheet(a.id)} className="btn-primary press" style={{ height: 30, padding: "0 14px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>
                            Submit completed worksheet
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Course outline + assessments (synced with the Assessment Tracker) */}
          <div className="glass-card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Course outline and assessments</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {outline && outline.status === "done" && <AverageChip assessments={outline.assessments} />}
                <Link href="/outline" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>Open Assessment Tracker</Link>
              </div>
            </div>

            {!outline && (
              <>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--fg3)", lineHeight: 1.5 }}>
                  Upload the outline from your school for this course. Elliot scans it, builds your assessment schedule below, and shares a read-only summary with {cd.tutor}.
                </p>
                <div
                  onClick={() => outlineFileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); outlineFileRef.current?.click(); } }}
                  className="dropzone"
                  style={{ border: "1.5px dashed rgba(0,157,255,.4)", borderRadius: 16, background: "rgba(0,157,255,.05)", padding: 18, textAlign: "center", cursor: "pointer", transition: "background .2s ease,border-color .2s ease" }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(0,157,255,.14)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <Icon path="M12 4 6 10h4v6h4v-6h4l-6-6ZM5 18h14v2H5v-2Z" size={18} />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>Upload your school outline for {cd.name} (PDF or image)</div>
                  <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>It also appears in your Assessment Tracker</div>
                  <input ref={outlineFileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={(e) => doUploadOutline(e.target.files?.[0]?.name || "")} />
                </div>
              </>
            )}

            {outline && outline.status === "pending" && (
              <div style={{ textAlign: "center", padding: "22px 10px" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid rgba(0,157,255,.2)", borderTopColor: "var(--brand-500)", margin: "0 auto 10px", animation: "evspin2 .9s linear infinite" }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>Scanning {outline.fileName}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>Pulling out your assessments and weekly topics</div>
              </div>
            )}

            {outline && outline.status === "done" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "var(--fg3)" }}>From <strong style={{ color: "var(--fg1)" }}>{outline.fileName}</strong> · {outline.term} · shared with {cd.tutor}</span>
                  <span style={{ flex: 1 }} />
                  <button
                    onClick={() => outlineFileRef.current?.click()}
                    className="btn-ghost"
                    style={{ height: 28, padding: "0 12px", borderRadius: 9, fontSize: 11, background: "rgba(255,255,255,.8)" }}
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => deleteOutline(outline.id)}
                    className="btn-ghost"
                    style={{ height: 28, padding: "0 12px", borderRadius: 9, fontSize: 11, color: "var(--danger-500)", background: "rgba(224,65,65,.07)" }}
                  >
                    Delete
                  </button>
                  <input ref={outlineFileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]?.name || ""; if (f) { deleteOutline(outline.id); doUploadOutline(f); } }} />
                </div>
                <AssessmentTable outline={outline} onUpdate={(aid, patch) => updateAssessment(outline.id, aid, patch)} />
              </>
            )}
          </div>

          {/* Results and feedback */}
          <div className="glass-card" style={{ padding: "20px 22px" }}>
            <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Results and feedback</h2>
            {results.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < results.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, padding: "4px 11px", borderRadius: 980, background: g.graded ? "rgba(34,160,91,.12)" : "rgba(245,166,35,.16)", color: g.graded ? "var(--success-700)" : "var(--warn-700)", flex: "none", minWidth: 34, textAlign: "center" }}>{g.grade}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{g.wsName} <span style={{ color: "var(--fg4)", fontWeight: 500 }}>· {g.at}</span></div>
                  <div style={{ fontSize: 12, color: "var(--fg2)", lineHeight: 1.5, marginTop: 2 }}>{g.fb}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Tutor */}
          <div className="glass-card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent-blue-light),var(--accent-violet-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flex: "none" }}>{cd.tutorInit}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{cd.tutor}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg4)" }}>{cd.tutorRole}</div>
              </div>
            </div>
            <button onClick={() => router.push("/messages?tutor=" + encodeURIComponent(cd.evTitle))} className="btn-ghost" style={{ width: "100%", height: 38, borderRadius: 11, fontSize: 12.5, background: "rgba(255,255,255,.8)" }}>Message your tutor</button>
          </div>

          {/* Sessions: mini calendar + upcoming/past */}
          <div className="glass-card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Sessions</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <button onClick={() => setCalM({ vm: vm === 0 ? 11 : vm - 1, vy: vm === 0 ? vy - 1 : vy })} aria-label="Previous month" className="list-hover" style={{ width: 24, height: 24, borderRadius: 8, border: "none", background: "transparent", color: "var(--fg3)", cursor: "pointer" }}>‹</button>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", minWidth: 86, textAlign: "center" }}>{monthLabel(vm, vy)}</span>
                <button onClick={() => setCalM({ vm: vm === 11 ? 0 : vm + 1, vy: vm === 11 ? vy + 1 : vy })} aria-label="Next month" className="list-hover" style={{ width: 24, height: 24, borderRadius: 8, border: "none", background: "transparent", color: "var(--fg3)", cursor: "pointer" }}>›</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 10 }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, color: "var(--fg6-faint)", padding: "2px 0" }}>{d}</div>
              ))}
              {grid.map((c) => {
                const has = sessionDays.has(c.k);
                const isToday = c.k === tKey;
                const isPast = c.k < tKey;
                const sess = has ? allSessions.find((s) => s.k === c.k) : null;
                return (
                  <div
                    key={c.k}
                    onClick={() => sess && openSession(sess)}
                    title={sess ? cd.name + " · " + sess.time : undefined}
                    style={{
                      textAlign: "center",
                      fontSize: 10.5,
                      fontWeight: isToday || has ? 700 : 500,
                      color: !c.inMonth ? "#D6DCE3" : isToday ? "#fff" : has ? ACCENT[cid].color : "var(--fg3)",
                      background: isToday ? "var(--brand-500)" : has && c.inMonth ? ACCENT[cid].bg : "transparent",
                      opacity: has && isPast && c.inMonth ? 0.55 : 1,
                      borderRadius: 8,
                      padding: "4px 0",
                      cursor: sess ? "pointer" : "default",
                      position: "relative",
                    }}
                  >
                    {c.d.getDate()}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 4 }} role="tablist" aria-label="Session list">
              {(["upcoming", "past"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={sessTab === t}
                  onClick={() => setSessTab(t)}
                  style={{ border: "none", cursor: "pointer", borderRadius: 980, padding: "4px 11px", fontSize: 10.5, fontWeight: 700, fontFamily: "inherit", background: sessTab === t ? "rgba(0,157,255,.14)" : "rgba(0,32,63,.05)", color: sessTab === t ? "var(--brand-600)" : "var(--fg3)" }}
                >
                  {t === "upcoming" ? "Upcoming (" + upcomingSessions.length + ")" : "Past (" + pastSessions.length + ")"}
                </button>
              ))}
            </div>
            {sessions.length === 0 && <div style={{ fontSize: 12, color: "var(--fg4)", padding: "8px 0" }}>{sessTab === "upcoming" ? "No more sessions scheduled this term." : "No past sessions yet."}</div>}
            {sessions.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < sessions.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none", opacity: sessTab === "past" ? 0.75 : 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--navy-500)", background: "rgba(0,32,63,.06)", padding: "5px 10px", borderRadius: 9, flex: "none" }}>{s.dateLabel}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: "var(--fg3)" }}>{s.time}</span>
                <a href="#" onClick={(e) => { e.preventDefault(); openSession(s); }} style={{ fontSize: 12, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600, flex: "none" }}>{sessTab === "past" ? "Recap" : "Details"}</a>
              </div>
            ))}
          </div>

          {/* Worksheets */}
          <div className="glass-card" style={{ padding: "20px 22px" }}>
            <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Worksheets</h2>
            {cWs.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "6px 0" }}>Nothing to submit for this course. Nice work.</div>}
            {cWs.map((w, i) => {
              const d = !!done[w.id];
              return (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < cWs.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: d ? "var(--fg4)" : "var(--fg1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)", marginTop: 1 }}>{d ? "Submitted, awaiting grade" : w.due}</span>
                  </span>
                  <button
                    onClick={() => submitWorksheet(w.id, w.name)}
                    className="press"
                    style={{ height: 28, padding: "0 12px", borderRadius: 8, border: d ? "1px solid rgba(34,160,91,.3)" : "none", background: d ? "rgba(34,160,91,.1)" : "var(--brand-500)", color: d ? "var(--success-500)" : "#fff", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", flex: "none", transition: "background .2s ease,color .2s ease,transform .15s ease" }}
                  >
                    {d ? "Submitted" : "Submit"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {preview && (
        <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} />
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "rgba(255,255,255,.92)", color: "var(--navy-500)", fontSize: 10.5, fontWeight: 700, padding: "4px 11px", borderRadius: 980 }}>{children}</span>;
}
