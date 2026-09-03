// Marking, from the office's side.
//
// The tutor portal has a marking queue because a tutor needs to DO the marking.
// The office needs something different: whether it is being done, by whom, and
// what is going to cause a phone call. So this is not a copy of that queue - it
// leads with what has waited longest and who is sitting on it, because "we
// submitted it a week ago and heard nothing" is the complaint this page exists
// to prevent.
//
// ONLINE ONLY. Work handed in on paper at a centre is marked and returned in
// the room; the portal never sees it, so counting it here would invent a
// backlog that does not exist.

import React, { useMemo } from "react";
import Link from "@/components/ui/Link";
import { useAdmin } from "@/lib/admin-store";
import { useBase } from "@/lib/admin-role";
import { Icon } from "@/components/ui/Icon";
import { MATERIAL_KIND_META, TUTOR_COURSES, TutorCourseId } from "@/lib/tutor-data";
import { STAFF } from "@/lib/admin-data";

const IC = {
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z",
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z",
};

/** The office clock, so "Tue" means the Tuesday just gone. */
const TODAY = new Date("2026-07-02T12:00:00");
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * How long a submission has sat there, from the display string the tutor portal
 * stores ("Today, 8:04am", "Tue, 7:55pm", "24 Jun"). Approximate by design: the
 * office needs "this one has waited five days", not a timestamp.
 */
function daysWaiting(when: string): number {
  const w = when.toLowerCase();
  if (w.startsWith("today")) return 0;
  if (w.startsWith("yesterday")) return 1;
  const wd = WEEKDAYS.findIndex((d) => w.startsWith(d));
  if (wd >= 0) {
    const diff = (TODAY.getDay() - wd + 7) % 7;
    return diff === 0 ? 7 : diff;
  }
  const m = w.match(/(\d{1,2})\s+([a-z]{3})/);
  if (m) {
    const month = MONTHS.indexOf(m[2]);
    if (month >= 0) {
      const d = new Date(2026, month, Number(m[1]), 12);
      return Math.max(0, Math.round((TODAY.getTime() - d.getTime()) / 86400000));
    }
  }
  return 0;
}

/** Amber after three days, red after five. A week is a complaint. */
function waitTone(days: number): { color: string; bg: string } {
  if (days >= 5) return { color: "var(--danger-500)", bg: "rgba(224,65,65,.1)" };
  if (days >= 3) return { color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" };
  return { color: "var(--fg3)", bg: "rgba(0,32,63,.05)" };
}

function waitLabel(days: number): string {
  return days === 0 ? "Today" : days === 1 ? "1 day" : days + " days";
}

const isOnline = (id: TutorCourseId) => TUTOR_COURSES[id]?.delivery === "online";
const tutorOf = (id: TutorCourseId) => STAFF.find((s) => s.courseIds?.includes(id))?.name ?? "Unassigned";

function Card({ span, delay, children }: { span: number; delay: number; children: React.ReactNode }) {
  return (
    <div
      className="glass-card"
      style={{ gridColumn: "span " + span, padding: "20px 22px", boxSizing: "border-box", alignSelf: "start", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${delay}s backwards` }}
    >
      {children}
    </div>
  );
}

/** "Reminded today" / "Reminded 2 days ago", so the office can see it already asked. */
function remindedLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return days <= 0 ? "Reminded today" : days === 1 ? "Reminded yesterday" : "Reminded " + days + " days ago";
}

/**
 * A day still waiting has already had one automatic reminder for every day it
 * has been waiting - the office does not have to ask for those. This button is
 * only for an extra one, on top of the automatic run.
 */
function RemindButton({ chased, onClick, label }: { chased?: { on: string; count: number }; onClick: () => void; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "none" }}>
      {chased && <span style={{ fontSize: 10.5, color: "var(--fg4)", whiteSpace: "nowrap" }}>{remindedLabel(chased.on)}</span>}
      <button onClick={onClick} className="btn-ghost press ev-tap-h" style={{ height: 30, padding: "0 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", whiteSpace: "nowrap" }}>
        {chased ? "Remind again" : label}
      </button>
    </span>
  );
}

export default function AdminGrade() {
  const { submissions, assignments, nudges, nudge } = useAdmin();
  const base = useBase();

  const online = useMemo(() => submissions.filter((s) => isOnline(s.course)), [submissions]);

  const waiting = useMemo(
    () =>
      online
        .filter((s) => !s.marked)
        .map((s) => ({ ...s, days: daysWaiting(s.when) }))
        .sort((a, b) => b.days - a.days),
    [online]
  );

  const marked = useMemo(() => online.filter((s) => s.marked), [online]);

  // Work a tutor has given out that has not come back. The office is asked
  // about this from the other end: "has she been given anything to do".
  const outstanding = useMemo(
    () => assignments.filter((a) => isOnline(a.courseId) && a.status === "assigned"),
    [assignments]
  );

  /** Who is sitting on work, worst first - the line a manager can act on. */
  const byTutor = useMemo(() => {
    const m = new Map<string, { tutor: string; count: number; oldest: number }>();
    for (const s of waiting) {
      const name = tutorOf(s.course);
      const cur = m.get(name) ?? { tutor: name, count: 0, oldest: 0 };
      m.set(name, { tutor: name, count: cur.count + 1, oldest: Math.max(cur.oldest, s.days) });
    }
    return [...m.values()].sort((a, b) => b.oldest - a.oldest || b.count - a.count);
  }, [waiting]);

  const overdue = waiting.filter((s) => s.days >= 3).length;

  const stats = [
    { label: "WAITING TO MARK", value: waiting.length, sub: "submitted, not yet returned", color: waiting.length ? "var(--fg1)" : "var(--fg1)" },
    { label: "WAITED 3 DAYS OR MORE", value: overdue, sub: overdue ? "these become phone calls" : "nothing has gone stale", color: overdue ? "var(--warn-700)" : "var(--fg1)" },
    { label: "OUT, NOT HANDED IN", value: outstanding.length, sub: "assigned and still open", color: "var(--fg1)" },
    { label: "MARKED", value: marked.length, sub: "returned this term", color: "var(--fg1)" },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "13px 18px", boxSizing: "border-box", fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.55, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        Online classes only. Work handed in on paper at a centre is marked and given back in the room, so the portal never sees it.
        Everyone still waiting gets an automatic reminder every morning, so the count under WAITED is also how many of those have gone out.
        Remind sends an extra one right now, and records when you sent it so nobody gets asked twice in a morning.
      </div>

      {stats.map((s, i) => (
        <div key={s.label} className="glass-stat" style={{ gridColumn: "span 3", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.04 + i * 0.04}s backwards` }}>
          <div className="glass-stat-label">{s.label}</div>
          <div className="glass-stat-value" style={{ color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>{s.sub}</div>
        </div>
      ))}

      {/* ---- the queue, oldest first ---- */}
      <Card span={7} delay={0.22}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Waiting on a tutor</h2>
        <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg3)" }}>Longest wait first, because that is the one a parent rings about.</p>

        {waiting.length === 0 && (
          <div style={{ textAlign: "center", padding: "26px 10px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800 }}>Nothing is waiting</div>
            <div style={{ fontSize: 12, color: "var(--fg4)", marginTop: 5 }}>Every submission has been marked and returned.</div>
          </div>
        )}

        {waiting.map((s) => {
          const cd = TUTOR_COURSES[s.course];
          const tone = waitTone(s.days);
          return (
            <div key={s.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: cd.bg, color: cd.color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                {s.init}
              </span>
              <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{s.student}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                  {s.wsName} · {cd.name} · {tutorOf(s.course)}
                </span>
              </span>
              <span className="ev-wrap-cta" style={{ display: "inline-flex", alignItems: "center", gap: 9, flex: "none" }}>
                <span
                  title={s.days === 0 ? "No automatic reminder yet - it has not been a full day" : s.days + " automatic reminder" + (s.days === 1 ? "" : "s") + " sent so far"}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: tone.color, background: tone.bg, padding: "4px 10px", borderRadius: 980 }}
                >
                  <Icon path={IC.clock} size={11} />
                  {waitLabel(s.days)}
                </span>
                <RemindButton chased={nudges["mark:" + s.id]} onClick={() => nudge("mark:" + s.id, tutorOf(s.course))} label="Remind" />
              </span>
            </div>
          );
        })}
      </Card>

      {/* ---- who is sitting on it ---- */}
      <Card span={5} delay={0.26}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>By tutor</h2>
        <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg3)" }}>Who to remind, and how far behind they are.</p>

        {byTutor.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "8px 0" }}>Nobody has anything outstanding.</div>}

        {byTutor.map((t) => {
          const tone = waitTone(t.oldest);
          return (
            <div key={t.tutor} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{t.tutor}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                  {t.count} to mark · longest {waitLabel(t.oldest)} · {t.oldest} automatic reminder{t.oldest === 1 ? "" : "s"} sent
                </span>
              </span>
              <span style={{ fontSize: 19, fontWeight: 800, color: tone.color, flex: "none" }}>{t.count}</span>
              <RemindButton chased={nudges["tutor:" + t.tutor]} onClick={() => nudge("tutor:" + t.tutor, t.tutor)} label="Remind" />
            </div>
          );
        })}

        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,32,63,.06)" }}>
          <Link href={base + "/messages"} className="btn-soft press ev-tap-h" style={{ height: 38, borderRadius: 11, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Message a tutor
          </Link>
        </div>
      </Card>

      {/* ---- given out, not come back ---- */}
      <Card span={7} delay={0.3}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Out with students</h2>
        <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg3)" }}>Assigned by a tutor and not handed in yet.</p>

        {outstanding.length === 0 && (
          <div style={{ textAlign: "center", padding: "26px 10px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800 }}>Nothing outstanding</div>
            <div style={{ fontSize: 12, color: "var(--fg4)", marginTop: 5 }}>Everything a tutor has given out has come back.</div>
          </div>
        )}

        {outstanding.map((a) => {
          const cd = TUTOR_COURSES[a.courseId];
          return (
            <div key={a.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: MATERIAL_KIND_META[a.kind].bg, color: MATERIAL_KIND_META[a.kind].color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon path={IC.doc} size={14} />
              </span>
              <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>
                  {a.target.kind === "student" ? a.target.studentName : "Everyone in " + cd.name}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                  {a.fileName} · {cd.name}
                  {a.due ? " · due " + new Date(a.due + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : ""}
                </span>
              </span>
              <span className="ev-wrap-cta" style={{ display: "inline-flex", alignItems: "center", gap: 9, flex: "none" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: MATERIAL_KIND_META[a.kind].color, background: MATERIAL_KIND_META[a.kind].bg, padding: "4px 10px", borderRadius: 980 }}>
                  {MATERIAL_KIND_META[a.kind].label}
                </span>
                <RemindButton
                  chased={nudges["work:" + a.id]}
                  onClick={() => nudge("work:" + a.id, a.target.kind === "student" ? a.target.studentName : cd.name)}
                  label="Remind"
                />
              </span>
            </div>
          );
        })}
      </Card>

      {/* ---- proof it is moving ---- */}
      <Card span={5} delay={0.34}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Recently marked</h2>
        <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg3)" }}>Returned with a grade and feedback.</p>

        {marked.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "8px 0" }}>Nothing has been marked yet this term.</div>}

        {marked.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(34,160,91,.12)", color: "var(--success-700)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon path={IC.tick} size={14} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{s.student}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.wsName}</span>
            </span>
            {s.grade && (
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "4px 11px", borderRadius: 980, flex: "none" }}>{s.grade}</span>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
