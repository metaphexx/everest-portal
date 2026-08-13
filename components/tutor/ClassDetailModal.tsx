// ClassDetailModal - opened from the Schedule when the tutor clicks an ONLINE
// class occurrence. Register copied from components/portal/ClassModal.tsx
// (blurred scrim + centred glass panel, evdrop/evfadein). Two tabs: Library
// (materials assigned to this class, with a same-modal "Assign booklet"
// shortcut pinned to this exact session) and Participations (roster with
// auto attendance + worksheet status + an override control for excused/etc).

import React, { useMemo, useState } from "react";
import { useTutor } from "@/lib/tutor-store";
import {
  ATTENDANCE_META,
  AttendanceStatus,
  MATERIAL_KIND_META,
  MATERIAL_KIND_ORDER,
  MaterialAssignment,
  MaterialKind,
  TUTOR_COURSES,
  TutorCourseId,
} from "@/lib/tutor-data";
import { Icon } from "@/components/ui/Icon";
import { BookletPicker } from "@/components/tutor/BookletPicker";
import { Modal } from "@/components/ui/Modal";

/** "185 minutes" -> "3h 5m" / "60 minutes" -> "1h 0m". */
function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

const DOC_ICON = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z";
const CLOCK_ICON = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z";
const USERS_ICON =
  "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z";

const ASSIGN_STATUS_META: Record<MaterialAssignment["status"], { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  submitted: { label: "Submitted", color: "var(--accent-purple)", bg: "rgba(122,90,248,.13)" },
  graded: { label: "Graded", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
};

const ATT_ORDER: AttendanceStatus[] = ["present", "late", "absent", "excused"];

function initialsOf(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

interface ClassDetailModalProps {
  courseId: TutorCourseId;
  sessionISO: string;
  onClose: () => void;
}

export function ClassDetailModal({ courseId, sessionISO, onClose }: ClassDetailModalProps) {
  const { effectiveAssignments, autoAttendance, markAttendance, notWired } = useTutor();
  const [tab, setTab] = useState<"library" | "participations">("library");
  const [cat, setCat] = useState<"All" | MaterialKind>("All");
  const [pickerOpen, setPickerOpen] = useState(false);

  const cd = TUTOR_COURSES[courseId];
  const dKey = sessionISO.slice(0, 10);
  const sessionD = new Date(sessionISO);
  const sessionStart = Date.parse(sessionISO);
  const sessionEnd = sessionStart + cd.durationMins * 60000;

  const dateLabel = sessionD.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
  const timeRange =
    sessionD.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", "") +
    " to " +
    new Date(sessionEnd).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", "");

  // Next upcoming session date for the "Students" card. Falls back to this
  // session's own date if we cannot otherwise resolve one from the schedule.
  const nextSessionLabel = dateLabel;

  const classAssignments = useMemo(() => {
    const list = effectiveAssignments.filter((a) => a.courseId === courseId);
    const catFiltered = list.filter((a) => cat === "All" || a.kind === cat);
    // Session-pinned first, then newest.
    return catFiltered.slice().sort((a, b) => {
      const aPinned = a.sessionISO === sessionISO ? 1 : 0;
      const bPinned = b.sessionISO === sessionISO ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return a.assignedAt < b.assignedAt ? 1 : -1;
    });
  }, [effectiveAssignments, courseId, cat, sessionISO]);

  const attendance = autoAttendance(courseId, sessionISO);
  const attKey = courseId + ":" + dKey;

  const worksheetFor = (studentName: string): MaterialAssignment | undefined => {
    const mine = effectiveAssignments.filter(
      (a) => a.courseId === courseId && a.kind === "worksheet" && (a.target.kind === "class" || (a.target.kind === "student" && a.target.studentName === studentName))
    );
    return mine.sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1))[0];
  };

  return (
    <>
      <Modal
        onClose={onClose}
        labelledBy="class-detail-modal-title"
        panelClassName="thin-scroll"
        panelStyle={{ width: 640, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto", background: "rgba(255,255,255,.96)", padding: 24 }}
      >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div id="class-detail-modal-title" style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{cd.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--fg4)", marginTop: 3 }}>{dateLabel}</div>
            </div>
            <button onClick={onClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14, lineHeight: 1, flex: "none", background: "#fff" }}>
              ✕
            </button>
          </div>

          {/* info cards */}
          <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0 18px" }}>
            <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 16, padding: "14px 16px", background: "rgba(255,255,255,.55)", minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: cd.color, marginBottom: 9 }}>SUBJECT &amp; COURSE</div>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon path={cd.icon} size={17} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cd.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3, flexWrap: "wrap" }}>
                    <Icon path={CLOCK_ICON} size={12} style={{ color: "var(--fg3)" }} />
                    <span style={{ fontSize: 12, color: "var(--fg2)", fontWeight: 600 }}>{timeRange}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.12)", padding: "2px 8px", borderRadius: 980 }}>{durationLabel(cd.durationMins)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 16, padding: "14px 16px", background: "rgba(255,255,255,.55)", minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "var(--success-700)", marginBottom: 9 }}>STUDENTS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: "rgba(34,160,91,.12)", color: "var(--success-700)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon path={USERS_ICON} size={17} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{cd.students.length} enrolled</div>
                  <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Next session {nextSessionLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* tab pill */}
          <div style={{ display: "inline-flex", background: "rgba(0,32,63,.06)", borderRadius: 10, padding: 3, gap: 2, marginBottom: 16 }}>
            {(["library", "participations"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  height: 32,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: tab === t ? "#FFFFFF" : "transparent",
                  color: tab === t ? "var(--fg1)" : "var(--fg3)",
                  boxShadow: tab === t ? "0 2px 6px rgba(0,32,63,.12)" : "none",
                }}
              >
                {t === "library" ? "Library" : "Participations"}
              </button>
            ))}
          </div>

          {tab === "library" ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(["All", ...MATERIAL_KIND_ORDER] as const).map((c) => {
                    const on = cat === c;
                    const label = c === "All" ? "All" : MATERIAL_KIND_META[c].plural;
                    return (
                      <button
                        key={c}
                        onClick={() => setCat(c)}
                        style={{
                          height: 30,
                          padding: "0 13px",
                          borderRadius: 980,
                          border: "1px solid rgba(0,32,63,.1)",
                          fontFamily: "inherit",
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          background: on ? "rgba(0,157,255,.16)" : "rgba(255,255,255,.7)",
                          color: on ? "var(--brand-600)" : "var(--fg2)",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setPickerOpen(true)} className="btn-primary press" style={{ height: 34, padding: "0 16px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, flex: "none" }}>
                  Assign material
                </button>
              </div>

              {classAssignments.map((a, i) => {
                const sm = ASSIGN_STATUS_META[a.status];
                const km = MATERIAL_KIND_META[a.kind];
                const pinned = a.sessionISO === sessionISO;
                return (
                  <div
                    key={a.id}
                    className="list-hover"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", margin: "0 -10px", borderRadius: 10, borderBottom: i < classAssignments.length - 1 ? "1px solid rgba(0,32,63,.05)" : "none" }}
                  >
                    <span style={{ width: 32, height: 32, borderRadius: 9, flex: "none", background: km.bg, color: km.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon path={DOC_ICON} size={15} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName}</span>
                        {pinned && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-purple)", background: "rgba(122,90,248,.13)", padding: "2px 7px", borderRadius: 980, flex: "none" }}>This session</span>
                        )}
                      </span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>
                        {a.target.kind === "class" ? "Whole class" : a.target.studentName} · {km.label}
                      </span>
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: sm.color, background: sm.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{sm.label}</span>
                  </div>
                );
              })}

              {classAssignments.length === 0 && (
                <div style={{ border: "1.5px dashed rgba(0,32,63,.14)", borderRadius: 14, padding: 24, textAlign: "center" }}>
                  <Icon path={DOC_ICON} size={26} style={{ color: "var(--fg5-decorative)" }} />
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg3)", marginTop: 6 }}>
                    {cat === "All" ? "No materials assigned to this class yet" : "No files found in this category"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>Assign a booklet and it lands straight in every student's Library.</div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11.5, color: "var(--fg3)", marginBottom: 10, lineHeight: 1.5 }}>
                Online attendance records itself when students join. You only need to mark excused students.
              </div>
              <div className="ev-scroll-x">
                <div style={{ minWidth: 520 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr)", gap: 8, padding: "0 10px 8px", fontSize: 10.5, fontWeight: 700, color: "var(--fg4)", letterSpacing: 0.4 }}>
                    <span>STUDENT</span>
                    <span>ATTENDANCE</span>
                    <span>WORKSHEET</span>
                    <span>OVERRIDE</span>
                  </div>
                  {cd.students.map((st, i) => {
                    const rec = attendance[st.name];
                    const ws = worksheetFor(st.name);
                    const wsMeta = ws ? ASSIGN_STATUS_META[ws.status] : null;
                    return (
                      <div
                        key={st.name}
                        style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr)", gap: 8, alignItems: "center", padding: "9px 10px", borderBottom: i < cd.students.length - 1 ? "1px solid rgba(0,32,63,.05)" : "none" }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                          <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,32,63,.06)", color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, flex: "none" }}>{initialsOf(st.name)}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</span>
                        </span>

                        {rec ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: ATTENDANCE_META[rec.status].color, background: ATTENDANCE_META[rec.status].bg, padding: "3px 9px", borderRadius: 980 }}>
                              {ATTENDANCE_META[rec.status].label}
                            </span>
                            {rec.source === "auto" && (
                              <span title="Recorded automatically when the student joined" style={{ fontSize: 9.5, fontWeight: 700, color: "var(--fg4)" }}>
                                auto
                              </span>
                            )}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--fg3)", background: "rgba(0,32,63,.06)", padding: "3px 9px", borderRadius: 980, display: "inline-block", width: "fit-content" }}>
                            Not joined yet
                          </span>
                        )}

                        {wsMeta ? (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: wsMeta.color, background: wsMeta.bg, padding: "3px 9px", borderRadius: 980, display: "inline-block", width: "fit-content" }}>{wsMeta.label}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--fg5-decorative)" }}>-</span>
                        )}

                        <span style={{ display: "inline-flex", gap: 3, flexWrap: "wrap" }} role="radiogroup" aria-label={"Override attendance for " + st.name}>
                          {ATT_ORDER.map((s, si) => {
                            const m = ATTENDANCE_META[s];
                            const on = rec?.status === s && rec.source === "manual";
                            const anyOn = rec?.source === "manual";
                            const move = (dir: 1 | -1) => {
                              const i = anyOn ? ATT_ORDER.indexOf(rec!.status) : 0;
                              markAttendance(attKey, st.name, ATT_ORDER[(i + dir + ATT_ORDER.length) % ATT_ORDER.length]);
                            };
                            return (
                              <button
                                key={s}
                                role="radio"
                                aria-checked={on}
                                tabIndex={on || (!anyOn && si === 0) ? 0 : -1}
                                title={s === "excused" ? "Mark excused" : "Override to " + m.label.toLowerCase()}
                                onClick={() => markAttendance(attKey, st.name, s)}
                                onKeyDown={(e) => {
                                  if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(1); }
                                  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(-1); }
                                }}
                                style={{
                                  border: on ? "1px solid " + m.color : "1px solid rgba(0,32,63,.12)",
                                  background: on ? m.bg : "rgba(255,255,255,.6)",
                                  color: on ? m.color : "var(--fg4)",
                                  fontFamily: "inherit",
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  width: 22,
                                  height: 22,
                                  borderRadius: 7,
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                {m.label[0]}
                              </button>
                            );
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div style={{ borderTop: "1px solid rgba(0,32,63,.08)", marginTop: 18, paddingTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={onClose} className="btn-ghost" style={{ height: 40, padding: "0 18px", borderRadius: 12, fontSize: 13, color: "var(--fg2)", background: "rgba(255,255,255,.8)" }}>
              Close
            </button>
            <button onClick={() => notWired("Opening the live classroom")} className="btn-primary" style={{ height: 40, padding: "0 22px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
              Join live class
            </button>
          </div>
      </Modal>

      <BookletPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        courseId={courseId}
        sessionISO={sessionISO}
        defaultKind={cat === "All" ? undefined : cat}
      />
    </>
  );
}
