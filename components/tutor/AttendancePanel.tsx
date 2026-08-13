// Attendance marking, ported from the hshs app's ClassCard pattern:
// one record per student per session per date, present/late/absent/excused,
// a one-tap "All present" then flip the exceptions. For block classes each
// subject session has its own roster, so a student doing only Science is
// only markable in Science.
//
// Online attendance now records itself: when sessionId resolves to an online
// TutorCourseId, each student is pre-filled from autoAttendance (join-event
// derived), with manual taps always overriding (that precedence already
// lives in the store). Block sub-sessions (b8math/b8sci/b8eng) share a single
// join event at the "block8" course granularity, so auto-fill is applied
// using that course's session time - a reasonable approximation since a
// student who joined the room is in it for the whole 3 hours. In-person
// courses have no join events at all, so they fall back to manual-only,
// unchanged from before.

import React from "react";
import { useTutor } from "@/lib/tutor-store";
import { ATTENDANCE_META, AttendanceStatus, BLOCK8_SESSIONS, TUTOR_COURSES, TutorCourseId, rosterFor } from "@/lib/tutor-data";

const ORDER: AttendanceStatus[] = ["present", "late", "absent", "excused"];

/** Resolves a sessionId (course id or block sub-session id) to the course id
    and session ISO used for join-event lookups, or null when the delivery
    mode has no join events to auto-fill from (in-person). */
function resolveAuto(sessionId: string, dateKey: string): { courseId: TutorCourseId; sessionISO: string } | null {
  const block = BLOCK8_SESSIONS.find((s) => s.id === sessionId);
  if (block) return { courseId: "block8", sessionISO: dateKey + "T" + TUTOR_COURSES.block8.t24 + ":00" };
  const course = TUTOR_COURSES[sessionId as TutorCourseId];
  if (course && course.delivery === "online") return { courseId: course.id, sessionISO: dateKey + "T" + course.t24 + ":00" };
  return null;
}

export function AttendancePanel({ sessionId, dateKey, accent }: { sessionId: string; dateKey: string; accent?: string }) {
  const { attendance, markAttendance, markAllPresent, autoAttendance } = useTutor();
  const key = sessionId + ":" + dateKey;
  const marks = attendance[key] ?? {};
  const roster = rosterFor(sessionId);

  const auto = resolveAuto(sessionId, dateKey);
  const autoRecord = auto ? autoAttendance(auto.courseId, auto.sessionISO) : {};

  // Effective status per student: manual mark wins, then auto, then unmarked.
  const statusOf = (name: string): AttendanceStatus | undefined => marks[name] ?? autoRecord[name]?.status;
  const isAuto = (name: string): boolean => !marks[name] && !!autoRecord[name] && autoRecord[name].source === "auto";

  const inCount = roster.filter((s) => statusOf(s.name) === "present" || statusOf(s.name) === "late").length;
  const allMarked = roster.every((s) => !!statusOf(s.name));

  return (
    <div>
      {auto && (
        <div style={{ fontSize: 10.5, color: "var(--fg4)", marginBottom: 8, lineHeight: 1.4 }}>
          Online attendance records itself when students join. You only need to mark excused students.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", flex: 1 }}>
          {inCount}/{roster.length} in
        </span>
        {!allMarked && roster.length > 0 && (
          <button
            onClick={() => markAllPresent(key, sessionId)}
            className="btn-soft press"
            style={{ height: 26, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}
          >
            ✓ All present
          </button>
        )}
      </div>
      {roster.map((s, i) => {
        const cur = statusOf(s.name);
        const auton = isAuto(s.name);
        return (
          <div key={s.name} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: i < roster.length - 1 ? "1px solid rgba(0,32,63,.05)" : "none" }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,32,63,.06)", color: accent ?? "var(--accent-navy-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, flex: "none" }}>{s.init}</span>
            <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: cur === "absent" ? "var(--fg4)" : "var(--fg1)" }}>{s.name}</span>
              {auton && (
                <span title="Recorded automatically when the student joined" style={{ fontSize: 9, fontWeight: 700, color: "var(--fg4)", background: "rgba(0,32,63,.06)", padding: "1px 6px", borderRadius: 980, flex: "none" }}>
                  auto
                </span>
              )}
            </span>
            <span style={{ display: "inline-flex", gap: 3, flex: "none" }} role="radiogroup" aria-label={"Attendance for " + s.name}>
              {ORDER.map((st, si) => {
                const m = ATTENDANCE_META[st];
                const on = cur === st;
                const move = (dir: 1 | -1) => {
                  const i = cur ? ORDER.indexOf(cur) : 0;
                  markAttendance(key, s.name, ORDER[(i + dir + ORDER.length) % ORDER.length]);
                };
                return (
                  <button
                    key={st}
                    className="ev-att-btn"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on || (!cur && si === 0) ? 0 : -1}
                    title={st === "excused" ? "Mark excused" : m.label}
                    onClick={() => markAttendance(key, s.name, st)}
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
                      width: 24,
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
      {roster.length === 0 && <div style={{ fontSize: 12, color: "var(--fg4)" }}>No students on this roster.</div>}
    </div>
  );
}
