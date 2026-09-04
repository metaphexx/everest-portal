// Schedule: the calendar the office adds classes from.
//
// Same calendar as the dashboard, because it is the same information - but here
// the day panel is the working surface, and a class can be added straight onto
// the day you are looking at. The upcoming list below is the "big view" of what
// is coming, which is what the office reads on a Monday morning.

import React, { useMemo, useState } from "react";
import { useRouter } from "@/lib/router";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { DayList, MonthCalendar } from "@/components/admin/MonthCalendar";
import { ClassFormModal, ClassFormValues, WEEKDAYS, to24, toDisplay } from "@/components/admin/ClassFormModal";
import { ClassViewModal } from "@/components/admin/ClassViewModal";
import { AdminSession, allSessions, applySessionPatches, centreStyle, needsRequest, dateKey } from "@/lib/admin-schedule";
import { BOOKLET_META } from "@/lib/tutor-data";
import { addBlock, slotsFor } from "@/lib/block";
import { AdminStudent, allClasses, allStudents } from "@/lib/admin-data";
import { ExpectedSession, attendanceHistory, summarise } from "@/lib/attendance-history";
import { StudentDetailModal } from "@/components/admin/StudentDetailModal";
import { TERMS } from "@/lib/admin-masters";

const IC = {
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
};

export default function AdminSchedule() {
  const { scheduled, addScheduledClass, requests, assignments, sessionPatches, patchSession, attendance } = useAdmin();
  const router = useRouter();
  const [day, setDay] = useState<string | null>("2026-07-02");
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<AdminSession | null>(null);
  const [editing, setEditing] = useState<AdminSession | null>(null);
  const [viewingStudent, setViewingStudent] = useState<AdminStudent | null>(null);

  const sessions = useMemo(
    () => applySessionPatches(allSessions(scheduled, requests), sessionPatches),
    [scheduled, requests, sessionPatches]
  );

  /**
   * Editing an ONLINE class is editing this lesson - its time, its tutor, its
   * link - so it happens here. An in-person class is a room and a centre
   * allocation, which is master data, so it goes to Master Records and its
   * Class selection tab; the session form would let the office change a thing
   * the timetable does not own.
   */
  const editSession = (s: AdminSession) => {
    setViewing(null);
    if (s.delivery === "online") {
      setEditing(s);
      return;
    }
    router.push("/admin/masters?tab=class-selection");
  };
  const upcoming = useMemo(() => sessions.filter((s) => s.k >= "2026-07-02").slice(0, 24), [sessions]);

  /**
   * A student's attendance, from the sessions they were expected at. Shown
   * beside their name here and broken down when the name is opened, so the
   * figure and the list behind it are the same calculation.
   */
  const historyFor = (st: AdminStudent) => {
    const inClass = allClasses().filter((c) => st.classNames.includes(c.name));
    const ids = new Set(inClass.map((c) => c.id));
    const expected: ExpectedSession[] = [];
    for (const sess of sessions) {
      if (!ids.has(sess.courseId) || sess.k > "2026-07-02") continue;
      const cls = inClass.find((c) => c.id === sess.courseId)!;
      const slots = slotsFor(sess.courseId).filter((sl) => sl.students.some((x) => x.name === st.name));
      if (slots.length > 0) for (const sl of slots) expected.push({ date: sess.k, className: cls.name, subject: sl.subject, key: sl.id + ":" + sess.k });
      else expected.push({ date: sess.k, className: cls.name, key: sess.courseId + ":" + sess.k });
    }
    return attendanceHistory(st.name, st.attendance, expected, attendance);
  };
  const pctFor = (name: string) => {
    const st = allStudents().find((x) => x.name === name);
    return st ? summarise(historyFor(st)).pct : 100;
  };

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "14px 18px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <span className="ev-wrap-main" style={{ flex: "1 1 260px", minWidth: 0, fontSize: 12, color: "var(--fg3)", lineHeight: 1.55 }}>
          In-person classes are set up in Master Records, where each centre's rooms and tutors live.
        </span>
        <button onClick={() => setAdding(true)} className="btn-primary press ev-tap-h ev-wrap-cta" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, flex: "none" }}>
          <Icon path={IC.plus} size={15} />
          Schedule a class
        </button>
      </div>

      <div className="glass-card" style={{ gridColumn: "span 7", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .05s backwards" }}>
        <MonthCalendar sessions={sessions} selected={day} onSelect={setDay} />
      </div>

      <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .08s backwards", display: "flex", flexDirection: "column" }}>
        <DayList dayKey={day} sessions={sessions} />
        <div style={{ marginTop: "auto", paddingTop: 14 }}>
          <button onClick={() => setAdding(true)} className="btn-soft press ev-tap-h" style={{ width: "100%", height: 40, borderRadius: 11, fontSize: 12.5, fontWeight: 700 }}>
            {day ? "Add a class on " + new Date(day + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "Add a class"}
          </button>
        </div>
      </div>

      {/* ---- the big upcoming view ---- */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .12s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Everything coming up</h2>
        <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg3)" }}>Every class from today, in order, with whether its booklets are covered.</p>

        {upcoming.map((s, i) => {
          const cs = centreStyle(s.centre);
          const gap = needsRequest(s);
          const prev = upcoming[i - 1];
          const newDay = !prev || prev.k !== s.k;
          return (
            <React.Fragment key={s.id}>
              {newDay && (
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: "var(--fg4)", padding: "14px 0 4px" }}>
                  {new Date(s.k + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
                </div>
              )}
              <div className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                <span style={{ flex: "none", width: 4, alignSelf: "stretch", borderRadius: 2, background: cs.colour }} />
                <span style={{ flex: "none", width: 62, fontSize: 12, fontWeight: 700, color: "var(--fg2)" }}>{s.time}</span>
                <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{s.className}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                    {s.tutor} · {s.centre} · {s.students} students
                  </span>
                </span>
                <span className="ev-row-end" style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                  {/* "Covered" used to cover everything that was not a gap, so
                      a class whose booklets nobody had approved yet looked as
                      settled as one already printed. Each state now says what
                      it is, in its own colour. */}
                  {s.booklet === null ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.12)", padding: "3px 9px", borderRadius: 980 }}>Online</span>
                  ) : gap ? (
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--warn-700)", background: "rgba(245,166,35,.18)", padding: "3px 9px", borderRadius: 980 }}>NO REQUEST YET</span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, color: BOOKLET_META[s.booklet].color, background: BOOKLET_META[s.booklet].bg, padding: "3px 9px", borderRadius: 980 }}>
                      {BOOKLET_META[s.booklet].label}
                    </span>
                  )}
                  {/* Viewing comes first: the office opens a class to check
                      what it is far more often than to change it, and editing
                      is one click on from here. */}
                  <button onClick={() => setViewing(s)} className="btn-ghost press ev-tap-h" style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                    View class
                  </button>
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {adding && (
        <ClassFormModal
          mode="create"
          scope="session"
          initial={{ day: day ?? "2026-07-09" }}
          onClose={() => setAdding(false)}
          onSubmit={(v) => {
            const base = {
              k: v.day,
              className: v.title,
              courseId: v.course,
              tutor: v.tutors.join(", "),
              centre: "Online",
              delivery: "online" as const,
              time: toDisplay(v.start),
              students: v.students.length,
              durationMins: v.durationMins,
              // Nothing is printed for an online class, so the booklet question
              // does not apply to it at all.
              booklet: null,
            };
            // A block's slots have to be registered before its sessions, or the
            // class turns up on the calendar with nothing behind it to enrol
            // into.
            if (v.slots?.length) {
              addBlock(
                v.course,
                { name: v.title, day: WEEKDAYS[(new Date(v.day + "T12:00:00").getDay() + 6) % 7], start: toDisplay(v.start), termId: TERMS.find((t) => t.state === "ongoing")?.id ?? "" },
                v.slots.map((s) => ({ ...s, start: toDisplay(s.start), end: toDisplay(s.end), students: v.students }))
              );
            }
            const n = v.repeat === "weekly" ? v.weeks : 1;
            for (let i = 0; i < n; i++) {
              const d = new Date(v.day + "T12:00:00");
              d.setDate(d.getDate() + i * 7);
              addScheduledClass({ ...base, k: dateKey(d), ...(n > 1 ? { session: i + 1 } : {}) });
            }
          }}
        />
      )}

      {viewingStudent && (
        <StudentDetailModal student={viewingStudent} rows={historyFor(viewingStudent)} onClose={() => setViewingStudent(null)} />
      )}

      {viewing && (
        <ClassViewModal
          session={viewing}
          request={requests.find((r) => r.classId === viewing.id)}
          // Everything assigned for this class, not only this date: the office
          // is asked "has she been given the work", and the answer is rarely
          // confined to the lesson they happen to have open.
          assignments={assignments.filter((a) => a.courseId === viewing.courseId)}
          onClose={() => setViewing(null)}
          onEdit={() => editSession(viewing)}
          onOpenStudent={setViewingStudent}
          pctFor={pctFor}
        />
      )}

      {editing && (
        <ClassFormModal
          mode="edit"
          scope="session"
          subtitle="Changes apply to this session only, not to every week."
          // A session id is "<classId>:<date>", and a student is not clashing
          // with the very class this session belongs to.
          excludeClassId={editing.id.split(":")[0]}
          initial={{
            title: editing.className,
            day: editing.k,
            start: to24(editing.time),
            end: (() => {
              const [h, m] = to24(editing.time).split(":").map(Number);
              const total = h * 60 + m + (editing.durationMins ?? 60);
              return String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
            })(),
            tutors: editing.tutor.split(",").map((t) => t.trim()).filter(Boolean),
            students: sessionPatches[editing.id]?.studentNames ?? [],
            link: sessionPatches[editing.id]?.link ?? "",
            notes: sessionPatches[editing.id]?.notes ?? "",
          }}
          onClose={() => setEditing(null)}
          onSubmit={(v: ClassFormValues) =>
            patchSession(editing.id, {
              className: v.title,
              k: v.day,
              time: toDisplay(v.start),
              tutor: v.tutors.join(", "),
              durationMins: v.durationMins,
              studentNames: v.students,
              link: v.link || undefined,
              notes: v.notes || undefined,
            })
          }
        />
      )}
    </div>
  );
}
