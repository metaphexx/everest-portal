// The course home page (the NEW page missing from the vendor app): one course's
// students, sessions with booklet status, materials, marking activity and
// shared outlines, with jump-offs to the related actions.

import React, { useState } from "react";
import Link from "@/components/ui/Link";
import { useParams, useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import {
  APPROVAL_META,
  BLOCK8_SESSIONS,
  BOOKLET_META,
  BookletRequest,
  DELIVERY_META,
  MATERIAL_KIND_META,
  MaterialAssignment,
  MaterialKind,
  PRINTING_META,
  TUTOR_COURSES,
  TutorCourseId,
  seedSharedOutlines,
} from "@/lib/tutor-data";
import { DOWS_MON, monthGrid, monthLabel, todayKey } from "@/lib/calendar";
import { ICON } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { outlineAverage } from "@/lib/features";
import { AttendancePanel } from "@/components/tutor/AttendancePanel";
import { HandoverPanel } from "@/components/tutor/HandoverPanel";
import { MeetReconcile } from "@/components/tutor/MeetReconcile";
import { blockRoster, seedMeetRows, slotsFor } from "@/lib/block";
import { BookletPicker } from "@/components/tutor/BookletPicker";
import { BookletStatsPanel } from "@/components/tutor/BookletStatsPanel";

const ASSIGN_STATUS_META: Record<MaterialAssignment["status"], { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  submitted: { label: "Submitted", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
  graded: { label: "Graded", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
};

function targetLabel(target: MaterialAssignment["target"]): string {
  return target.kind === "class" ? "Whole class" : target.studentName;
}

function assignedAtLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function dueLabel(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function TutorCoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { now, vm, vy, prevMonth, nextMonth, classes, submissions, requests, setRequestClass, showToast, effectiveAssignments, setAssignmentStatus, removeAssignment, attendance } = useTutor();
  const id = params.id as TutorCourseId;
  const cd = TUTOR_COURSES[id];
  const tKey = todayKey(now);
  const [attDate, setAttDate] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKind, setPickerKind] = useState<MaterialKind>("booklet");
  // In-person calendar: a clicked PAST session whose requested booklets we show
  // in a panel below the calendar (future days go straight to requesting).
  const [selSession, setSelSession] = useState<string | null>(null);

  if (!cd) {
    return (
      <div className="glass-card glass-card-pad" style={{ textAlign: "center", color: "var(--fg3)" }}>
        That course does not exist. <Link href="/tutor/courses" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Back to My Courses</Link>
      </div>
    );
  }

  const isOnline = cd.delivery === "online";
  const sessions = classes.filter((c) => c.course === id);
  const upcoming = sessions.filter((c) => c.k >= tKey);
  const past = sessions.filter((c) => c.k < tKey).reverse();
  const courseSubs = submissions.filter((s) => s.course === id);
  const toMark = courseSubs.filter((s) => !s.marked);
  const outlines = seedSharedOutlines().filter((o) => o.course === id);
  const courseAssignments = effectiveAssignments
    .filter((a) => a.courseId === id)
    .slice()
    .sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));

  // Prior booklet requests for a given session, newest first - for planning.
  const reqsForClass = (classId: string) => requests.filter((r) => r.classId === classId);
  const sessionDays = new Set(sessions.map((c) => c.k));
  const cells = monthGrid(vm, vy);

  const requestFor = (classId: string) => {
    setRequestClass(classId);
    router.push("/tutor/materials");
  };

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* COURSE HERO */}
      <div style={{ gridColumn: "span 12", position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 128, boxShadow: "0 18px 40px -20px rgba(0,32,63,.4)", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <div className="ev-kenburns" style={{ position: "absolute", inset: 0, backgroundImage: `url(${cd.photo})`, backgroundSize: "cover", backgroundPosition: "center", animation: ["evkenburns1 26s", "evkenburns2 31s", "evkenburns3 35s"][id.charCodeAt(0) % 3] + " ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, background: cd.grad }} />
        <div className="ev-wrap-row" style={{ position: "relative", zIndex: 1, padding: "22px 26px", color: "#fff", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, minHeight: 128, boxSizing: "border-box" }}>
          <div className="ev-wrap-full">
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, opacity: 0.8 }}>
              {DELIVERY_META[cd.delivery].label.toUpperCase()}{cd.centre.toLowerCase() !== "online" ? " · " + cd.centre.toUpperCase() : ""} · {cd.sched.toUpperCase()}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: -0.4, marginTop: 4 }}>{cd.name}</div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>
              {cd.delivery === "in_person" ? "" : cd.students.length + " students · "}{past.length} of {sessions.length} sessions taught
              {cd.isBlock ? " · one room, three rosters" : ""}
            </div>
          </div>
          <div className="ev-wrap-full ev-hero-actions" style={{ display: "flex", gap: 9, flex: "none", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {cd.delivery === "online" && (
              <Link href="/tutor/grade" className="btn-ghost" style={{ height: 36, padding: "0 16px", borderRadius: 11, fontSize: 12.5, display: "inline-flex", alignItems: "center", textDecoration: "none", background: "rgba(255,255,255,.9)" }}>
                Mark work{toMark.length > 0 ? " (" + toMark.length + ")" : ""}
              </Link>
            )}
            {cd.delivery === "online" ? (
              <>
                <Link
                  href={"/tutor/classroom/" + cd.id}
                  className="btn-ghost"
                  style={{ height: 36, padding: "0 16px", borderRadius: 11, fontSize: 12.5, background: "rgba(255,255,255,.9)", display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                >
                  Open classroom
                </Link>
                <button onClick={() => showToast("The class room opens 10 minutes before " + cd.time)} className="btn-primary press" style={{ height: 36, padding: "0 16px", borderRadius: 11, fontSize: 12.5 }}>
                  Start class
                </button>
              </>
            ) : (
              upcoming[0] && (
                <button onClick={() => requestFor(upcoming[0].id)} className="btn-primary press" style={{ height: 36, padding: "0 16px", borderRadius: 11, fontSize: 12.5 }}>
                  Request booklets
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* BLOCK TIMELINE + PER-SESSION ATTENDANCE */}
      {cd.isBlock && (() => {
        const blockDates = sessions.map((c) => c.k);
        const defaultDate = [...blockDates].reverse().find((k) => k <= tKey) ?? blockDates[0];
        const selDate = attDate || defaultDate;
        const dLabel = new Date(selDate + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
        return (
          <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .1s backwards" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
              <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>Block timeline and attendance</h2>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.1)", padding: "3px 10px", borderRadius: 980 }}>One room · one link · 4:00pm to 7:00pm</span>
              <span className="ev-spacer-flex" style={{ flex: 1 }} />
              <label style={{ fontSize: 11.5, color: "var(--fg3)", fontWeight: 600 }}>
                Session date{" "}
                <select value={selDate} onChange={(e) => setAttDate(e.target.value)} className="field" style={{ height: 30, width: "auto", padding: "0 8px", fontSize: 12, display: "inline-block" }}>
                  {blockDates.map((k) => (
                    <option key={k} value={k}>
                      {new Date(k + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}{k > tKey ? " (upcoming)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--fg3)" }}>
              Students join the room only during the sessions they are enrolled in. Marking attendance for {dLabel}.
            </p>
            {/* The handover. A block is one continuous call, so nothing about the
                room changes at a boundary - only who is supposed to be in it,
                which is invisible to a tutor who is mid-sentence. */}
            <div style={{ marginBottom: 14 }}>
              <HandoverPanel courseId="block8" hour={17} inRoom={blockRoster("block8").map((s) => s.name).slice(0, 7)} />
            </div>

            <div className="ev-grid-3-wide" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, alignItems: "start" }}>
              {BLOCK8_SESSIONS.map((seg) => (
                <div key={seg.id} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, padding: "14px 15px", background: "rgba(255,255,255,.55)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: seg.bg, color: seg.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <Icon path={seg.icon} size={14} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{seg.subject}</span>
                      <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>{seg.start} to {seg.end} · {seg.tutor}</span>
                    </span>
                    <Link href={"/tutor/classroom/" + seg.id} style={{ fontSize: 11, fontWeight: 700, color: seg.color, background: seg.bg, padding: "4px 10px", borderRadius: 980, textDecoration: "none", flex: "none" }}>
                      Classroom
                    </Link>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(0,32,63,.06)", paddingTop: 8, marginTop: 8 }}>
                    <AttendancePanel sessionId={seg.id} dateKey={selDate} accent={seg.color} />
                    <MeetReconcile slot={seg} rows={seedMeetRows()} marks={attendance[seg.id + ":" + selDate] ?? {}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* SINGLE-COURSE CLASSROOM + ATTENDANCE */}
      {!cd.isBlock && cd.delivery === "online" && (() => {
        const courseDates = sessions.map((c) => c.k);
        const defaultDate = [...courseDates].reverse().find((k) => k <= tKey) ?? courseDates[0];
        const selDate = attDate || defaultDate;
        return (
          <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .1s backwards" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>Attendance</h2>
              <Link href={"/tutor/classroom/" + cd.id} className="ev-tap-link" style={{ fontSize: 11, fontWeight: 700, color: cd.color, background: cd.bg, padding: "4px 10px", borderRadius: 980, textDecoration: "none" }}>
                Open classroom
              </Link>
              <span className="ev-spacer-flex" style={{ flex: 1 }} />
              <label style={{ fontSize: 11.5, color: "var(--fg3)", fontWeight: 600 }}>
                Session date{" "}
                <select value={selDate} onChange={(e) => setAttDate(e.target.value)} className="field" style={{ height: 30, width: "auto", padding: "0 8px", fontSize: 12, display: "inline-block" }}>
                  {courseDates.map((k) => (
                    <option key={k} value={k}>
                      {new Date(k + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}{k > tKey ? " (upcoming)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ev-cols-2" style={{ columns: 2, columnGap: 24 }}>
              <AttendancePanel sessionId={cd.id} dateKey={selDate} accent={cd.color} />
            </div>
          </div>
        );
      })()}

      {/* MATERIALS: assign booklets/worksheets from the linked Drive (online only) */}
      {isOnline && (
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .12s backwards" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>Materials</h2>
            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--fg4)" }}>Assign booklets to read or worksheets students must complete and send back.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => { setPickerKind("booklet"); setPickerOpen(true); }}
              className="btn-primary press"
              style={{ height: 34, padding: "0 15px", borderRadius: 10, fontSize: 12.5 }}
            >
              Assign booklets
            </button>
            <button
              onClick={() => { setPickerKind("worksheet"); setPickerOpen(true); }}
              className="btn-ghost press"
              style={{ height: 34, padding: "0 15px", borderRadius: 10, fontSize: 12.5, background: "rgba(255,255,255,.8)" }}
            >
              Assign worksheet
            </button>
          </div>
        </div>

        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 6 }}>PREVIOUSLY ASSIGNED</div>
        {courseAssignments.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "6px 0" }}>Nothing assigned to this class yet.</div>
        ) : (
          <div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {courseAssignments.map((a, i) => {
                const sm = ASSIGN_STATUS_META[a.status];
                const km = MATERIAL_KIND_META[a.kind];
                const due = dueLabel(a.due);
                return (
                  <div
                    key={a.id}
                    className="ev-wrap-row"
                    style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i < courseAssignments.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}
                  >
                    <span style={{ width: 32, height: 32, borderRadius: 9, background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <Icon path={ICON.doc} size={14} />
                    </span>
                    <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
                      <span className="ev-title-2" style={{ display: "block", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName}</span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>
                        {targetLabel(a.target)} · assigned {assignedAtLabel(a.assignedAt)}{due ? " · due " + due : ""}
                      </span>
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: km.color, background: km.bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>
                      {km.label}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: sm.color, background: sm.bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>{sm.label}</span>
                    {/* Teaching, not just handing out: opens the booklet in its
                        own tab with ink on top, ready to share to the class. */}
                    <button
                      onClick={() => window.open("/tutor/teach/" + a.id, "_blank", "noopener")}
                      title="Open to teach with"
                      className="press ev-tap-h ev-row-end"
                      style={{ height: 26, padding: "0 11px", borderRadius: 8, border: "none", background: "rgba(0,157,255,.1)", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", flex: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <Icon path={ICON.doc} size={11} /> Open
                    </button>
                    {a.kind === "worksheet" && a.status === "submitted" && (
                      <button
                        onClick={() => setAssignmentStatus(a.id, "graded")}
                        className="btn-ghost press"
                        style={{ height: 26, padding: "0 10px", borderRadius: 8, fontSize: 11, flex: "none", background: "rgba(255,255,255,.7)", color: "var(--success-700)" }}
                      >
                        Mark as graded
                      </button>
                    )}
                    <button
                      onClick={() => removeAssignment(a.id)}
                      aria-label="Remove assignment"
                      title="Remove"
                      className="press ev-tap ev-row-end"
                      style={{ width: 24, height: 24, borderRadius: 8, border: "none", background: "rgba(224,65,65,.08)", color: "var(--danger-500)", fontSize: 12, cursor: "pointer", flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* STUDENTS (online) or SESSION CALENDAR (in-person) */}
      {isOnline ? (
        <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .12s backwards" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15, marginBottom: 12 }}>Students</h2>
          {cd.students.map((s, i) => {
            const pending = toMark.filter((t) => t.student === s.name).length;
            const outline = outlines.find((o) => o.student === s.name);
            return (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderBottom: i < cd.students.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, flex: "none" }}>{s.init}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                {outline && (
                  <Link href="/tutor/outlines" title="Shared a school outline" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.1)", padding: "3px 9px", borderRadius: 980, textDecoration: "none", flex: "none" }}>
                    Outline
                  </Link>
                )}
                {pending > 0 && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--danger-500)", background: "rgba(224,65,65,.1)", padding: "3px 9px", borderRadius: 980, flex: "none" }}>{pending} to mark</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .12s backwards" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>{monthLabel(vm, vy)}</h2>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={prevMonth} className="mini-nav" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 14 }}>‹</button>
              <button onClick={nextMonth} className="mini-nav" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 14 }}>›</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, textAlign: "center", fontSize: 10, color: "var(--fg4)", fontWeight: 700, marginBottom: 4 }}>
            {DOWS_MON.map((d, i) => (<div key={i}>{d}</div>))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, textAlign: "center" }}>
            {cells.map((c, i) => {
              const has = sessionDays.has(c.k);
              const isToday = c.k === tKey;
              const sess = has ? sessions.find((s) => s.k === c.k) : null;
              const isPast = !!sess && sess.k < tKey;
              const selected = !!sess && selSession === sess.id;
              const monthShort = monthLabel(vm, vy).split(" ")[0];
              return (
                <button
                  key={i}
                  onClick={() => sess && (isPast ? setSelSession(sess.id) : requestFor(sess.id))}
                  disabled={!sess}
                  title={sess ? (isPast ? "See booklets requested for " + c.d.getDate() + " " + monthShort : "Request booklets for " + c.d.getDate() + " " + monthShort) : undefined}
                  className={sess ? "press" : undefined}
                  style={{ padding: "2px 0", cursor: sess ? "pointer" : "default", display: "flex", justifyContent: "center", border: "none", background: "none", fontFamily: "inherit", width: "100%" }}
                >
                  <span style={{ display: "inline-flex", width: 30, height: 30, borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: isToday || has ? 700 : 500, background: isToday ? "var(--brand-500)" : selected ? cd.color : has ? cd.bg : "transparent", color: isToday ? "#fff" : selected ? "#fff" : has ? cd.color : c.inMonth ? "var(--fg1)" : "var(--fg5-decorative)", boxShadow: selected ? "0 0 0 3px " + cd.bg : "none", transition: "background .15s ease" }}>
                    {c.d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Past-session detail: what was requested that day (booklet titles) */}
          {selSession && (() => {
            const sess = sessions.find((s) => s.id === selSession);
            if (!sess) return null;
            const reqs = reqsForClass(selSession);
            const d = new Date(sess.k + "T12:00:00");
            return (
              <div style={{ marginTop: 12, borderTop: "1px solid rgba(0,32,63,.08)", paddingTop: 12, animation: "evfadein .2s ease" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                    Session {sess.session}
                    <span style={{ color: "var(--fg4)", fontWeight: 500 }}> · {d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
                  </div>
                  <button onClick={() => setSelSession(null)} aria-label="Close" className="btn-ghost" style={{ width: 24, height: 24, borderRadius: 8, fontSize: 12, lineHeight: 1, background: "rgba(255,255,255,.7)" }}>✕</button>
                </div>
                {reqs.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--fg4)", background: "rgba(0,32,63,.03)", border: "1px dashed rgba(0,32,63,.12)", borderRadius: 10, padding: "12px 14px" }}>
                    No booklets were requested for this session.
                  </div>
                ) : (
                  reqs.map((r) => {
                    const dig = r.delivery === "digital";
                    const status = dig ? "Delivered" : r.approval === "approved" ? PRINTING_META[r.printing].label : APPROVAL_META[r.approval].label;
                    const meta = dig ? PRINTING_META.completed : r.approval === "approved" ? PRINTING_META[r.printing] : APPROVAL_META[r.approval];
                    return (
                      <div key={r.id} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 12, padding: "11px 13px", marginBottom: 8, background: "rgba(255,255,255,.5)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: meta.color, background: meta.bg, padding: "3px 9px", borderRadius: 980 }}>{status}</span>
                          <span style={{ fontSize: 10.5, color: "var(--fg4)" }}>{r.ref}</span>
                          <span className="ev-spacer-flex" style={{ flex: 1 }} />
                          <button onClick={() => requestFor(sess.id)} className="btn-ghost press" style={{ height: 26, padding: "0 11px", borderRadius: 8, fontSize: 11, background: "rgba(255,255,255,.7)", color: "var(--brand-600)" }}>Reorder</button>
                        </div>
                        {r.items.map((it) => (
                          <div key={it.itemId} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
                            <span style={{ width: 26, height: 26, borderRadius: 8, background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                              <Icon path={ICON.doc} size={12} />
                            </span>
                            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg3)", flex: "none" }}>× {it.qty}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}

          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 10, lineHeight: 1.5, borderTop: "1px solid rgba(0,32,63,.08)", paddingTop: 10 }}>
            Highlighted days are your {cd.name} sessions. Tap an upcoming one to request booklets, or a past one to see what was requested.
          </div>
        </div>
      )}

      {/* SESSIONS with per-session booklet request history */}
      <div className="glass-card" style={{ gridColumn: "span 7", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .16s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, marginBottom: 4 }}>Sessions</h2>
        {isOnline ? (
          <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg4)" }}>Upcoming and past sessions for this class.</p>
        ) : (
          <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg4)" }}>Each session shows any booklets you have already requested, so you can plan and reorder.</p>
        )}
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 4 }}>UPCOMING</div>
        {upcoming.slice(0, 5).map((c) => {
          const bm = BOOKLET_META[c.booklet];
          const d = new Date(c.k + "T12:00:00");
          const prior = reqsForClass(c.id);
          const needs = c.booklet === "not_requested" || c.booklet === "rejected";
          return (
            <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(0,32,63,.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: cd.color, background: cd.bg, padding: "5px 9px", borderRadius: 8, flex: "none", width: 64, textAlign: "center" }}>
                  {d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600 }}>Session {c.session} · {cd.time}</span>
                {!isOnline && <span style={{ fontSize: 10.5, fontWeight: 700, color: bm.color, background: bm.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{bm.label}</span>}
                {!isOnline && (
                  <button onClick={() => requestFor(c.id)} className={needs ? "btn-soft press" : "btn-ghost press"} style={{ height: 26, padding: "0 11px", borderRadius: 8, fontSize: 11, flex: "none", ...(needs ? {} : { background: "rgba(255,255,255,.7)", color: "var(--brand-600)" }) }}>
                    {needs ? "Request" : "Add more"}
                  </button>
                )}
              </div>
              <PriorRequests requests={prior} onReorder={() => requestFor(c.id)} />
            </div>
          );
        })}
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", margin: "12px 0 4px" }}>RECENT</div>
        {past.slice(0, 4).map((c, i, arr) => {
          const d = new Date(c.k + "T12:00:00");
          const prior = reqsForClass(c.id);
          return (
            <div key={c.id} style={{ padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg3)", background: "rgba(0,32,63,.05)", padding: "5px 9px", borderRadius: 8, flex: "none", width: 64, textAlign: "center" }}>
                  {d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600 }}>Session {c.session} · taught</span>
                {!isOnline && (
                  <button onClick={() => requestFor(c.id)} className="btn-ghost press" style={{ height: 26, padding: "0 11px", borderRadius: 8, fontSize: 11, flex: "none", background: "rgba(255,255,255,.7)", color: "var(--brand-600)" }}>
                    Reorder
                  </button>
                )}
              </div>
              <PriorRequests requests={prior} onReorder={() => requestFor(c.id)} />
            </div>
          );
        })}
      </div>

      {/* BOOKLET TRACKER (in-person only) - this class's booklets over the term */}
      {!isOnline && (
        <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .22s backwards" }}>
          <BookletStatsPanel requests={requests} courseId={id} title="Booklet tracker" subtitle={cd.name + " · copies over the term"} height={210} />
        </div>
      )}

      {/* WORKSHEET ACTIVITY (online only) */}
      {isOnline && (
      <div className="glass-card" style={{ gridColumn: "span 6", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .24s backwards" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 className="portal-section-title" style={{ fontSize: 15 }}>Worksheet activity</h2>
          <Link href="/tutor/grade" className="ev-tap-link" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>Open marking</Link>
        </div>
        {courseSubs.slice(0, 4).map((s, i, arr) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, flex: "none" }}>{s.init}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="ev-title-2" style={{ display: "block", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.student} · {s.wsName}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{s.when}</span>
            </span>
            {s.marked ? (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "4px 10px", borderRadius: 980, flex: "none" }}>Marked {s.grade}</span>
            ) : (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--warn-700)", background: "rgba(245,166,35,.16)", padding: "4px 10px", borderRadius: 980, flex: "none" }}>To mark</span>
            )}
          </div>
        ))}
        {courseSubs.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "6px 0" }}>No worksheet activity for this class yet.</div>}
      </div>
      )}

      {/* STUDENT MARKS & OUTLINES (online only) - self-entered assessment
          scores each student records in their own Assessment Tracker flow
          straight through to here, plus who is still to submit an outline. */}
      {isOnline && (
      <div className="glass-card" style={{ gridColumn: "span 6", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .26s backwards" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <h2 className="portal-section-title" style={{ fontSize: 15 }}>Student marks &amp; outlines</h2>
          <Link href="/tutor/outlines" className="ev-tap-link" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>All outlines</Link>
        </div>
        <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--fg4)" }}>Marks students record in their own Assessment Tracker show here automatically.</p>
        {outlines.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "6px 0" }}>No students have shared a school outline for this course yet.</div>
        ) : (
          outlines.map((o, i, arr) => {
            const avg = o.status === "done" ? outlineAverage(o.assessments) : null;
            const scored = o.status === "done" ? o.assessments.filter((a) => a.score) : [];
            const latest = scored[scored.length - 1];
            return (
              <Link key={o.id} href="/tutor/outlines" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", textDecoration: "none", color: "inherit", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }} className="row-hover">
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flex: "none" }}>{o.init}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.student}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>
                    {o.status === "done"
                      ? scored.length + " of " + o.assessments.length + " marked" + (latest ? " · latest " + latest.name.split(":")[0] + " " + latest.score : "")
                      : "Outline scanning"}
                  </span>
                </span>
                {avg !== null ? (
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: avg >= 75 ? "var(--success-700)" : avg >= 55 ? "var(--warn-700)" : "var(--danger-500)", background: avg >= 75 ? "rgba(34,160,91,.12)" : avg >= 55 ? "rgba(245,166,35,.16)" : "rgba(224,65,65,.12)", padding: "4px 11px", borderRadius: 980, flex: "none" }}>{avg}% avg</span>
                ) : o.status === "done" ? (
                  <span style={{ fontSize: 11, color: "var(--fg4)", flex: "none" }}>No marks yet</span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warn-700)", background: "rgba(245,166,35,.16)", padding: "4px 10px", borderRadius: 980, flex: "none" }}>Scanning</span>
                )}
              </Link>
            );
          })
        )}
      </div>
      )}

      {isOnline && (
        <BookletPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          courseId={id}
          defaultKind={pickerKind}
        />
      )}
    </div>
  );
}

// Compact per-session booklet request history, for planning and reordering.
// Shows the actual booklet TITLES (not the request reference, which tells the
// tutor nothing about what was in it) with each request's status.
function PriorRequests({ requests, onReorder }: { requests: BookletRequest[]; onReorder: () => void }) {
  if (requests.length === 0) return null;
  return (
    <div className="ev-chip-row" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, paddingLeft: 75 }}>
      {requests.flatMap((r) => {
        const dig = r.delivery === "digital";
        const status = dig ? "Delivered" : r.approval === "approved" ? PRINTING_META[r.printing].label : APPROVAL_META[r.approval].label;
        const meta = dig ? PRINTING_META.completed : r.approval === "approved" ? PRINTING_META[r.printing] : APPROVAL_META[r.approval];
        return r.items.map((it) => (
          <button
            key={r.id + ":" + it.itemId}
            onClick={onReorder}
            className="press"
            title={it.name + " · " + status + " (" + r.ref + ", ×" + it.qty + ")"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%", border: "1px solid rgba(0,32,63,.1)", background: "rgba(255,255,255,.6)", borderRadius: 980, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, flex: "none" }} />
            <span className="ev-title-2" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--fg2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>
            <span style={{ fontSize: 10, color: "var(--fg4)", flex: "none" }}>· {status}</span>
          </button>
        ));
      })}
    </div>
  );
}
