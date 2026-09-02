// Schedule: the calendar the office adds classes from.
//
// Same calendar as the dashboard, because it is the same information - but here
// the day panel is the working surface, and a class can be added straight onto
// the day you are looking at. The upcoming list below is the "big view" of what
// is coming, which is what the office reads on a Monday morning.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { DayList, MonthCalendar } from "@/components/admin/MonthCalendar";
import { ScheduleClassModal } from "@/components/admin/ScheduleClassModal";
import { allSessions, centreStyle, needsRequest } from "@/lib/admin-schedule";
import { BOOKLET_META } from "@/lib/tutor-data";

const IC = {
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
};

export default function AdminSchedule() {
  const { scheduled, addScheduledClass, notWired, requests } = useAdmin();
  const [day, setDay] = useState<string | null>("2026-07-02");
  const [adding, setAdding] = useState(false);

  const sessions = useMemo(() => allSessions(scheduled, requests), [scheduled, requests]);
  const upcoming = useMemo(() => sessions.filter((s) => s.k >= "2026-07-02").slice(0, 24), [sessions]);

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "14px 18px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <span className="ev-wrap-main" style={{ flex: "1 1 260px", minWidth: 0, fontSize: 12, color: "var(--fg3)", lineHeight: 1.55 }}>
          Add an online class with a conferencing link, or an in-person class at a centre. An in-person class is mapped to a tutor, which
          is what lets that tutor raise booklet requests against it.
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
                  <button onClick={() => notWired("Edit class")} className="btn-ghost press ev-tap-h" style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                    Edit
                  </button>
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {adding && <ScheduleClassModal onClose={() => setAdding(false)} onCreate={addScheduledClass} defaultDay={day} />}
    </div>
  );
}
