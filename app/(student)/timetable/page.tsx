import React, { useMemo, useState } from "react";
import { usePortal } from "@/lib/store";
import { ACCENT, EVENTS, STUDENT, TITLE_TO_CID } from "@/lib/data";
import { DOWS_MON, monthGrid, monthLabel, todayKey } from "@/lib/calendar";
import { planFor } from "@/lib/block";
import { useRouter } from "@/lib/router";

interface UpItem {
  dateLabel: string;
  time: string;
  title: string;
  tutor: string;
  color: string;
  bg: string;
  k: string;
}

// Only Chemistry (student "chem") is modelled as an online tutor-side course
// (chem11), so it is the only title that ever carries an assigned booklet or
// a Join action here. Verbal/GATE keep their existing "Details" only.
const ONLINE_TITLE = "Chemistry";
const ONLINE_T24 = "19:00";

// The Wednesday block was on the student's Courses page but never on their
// timetable, so the /block page was unreachable from the place a student
// actually looks for "what is on this week". Its rows navigate there rather
// than opening the class modal - join/leave times are that page's whole job.
const BLOCK_TITLE = "Year 11 Wednesday Block";
const BLOCK_KEYS = ["2026-06-03", "2026-06-10", "2026-06-17", "2026-06-24", "2026-07-01", "2026-07-08", "2026-07-15", "2026-07-22", "2026-07-29"];

export default function TimetablePage() {
  const { now, vm, vy, prevMonth, nextMonth, openModal, assignedToMe, joinClass, showToast } = usePortal();
  // A seven-column month grid cannot breathe on a phone: cells fall to ~48px,
  // chips crush and the final column clips. Below the 720px breakpoint we open
  // on the List view instead, which reads properly at that width. The toggle
  // stays, so anyone who wants the grid can still switch to it. Desktop is
  // unchanged (still opens on Month).
  const [view, setView] = useState<"month" | "list">(() =>
    typeof window !== "undefined" && window.innerWidth <= 720 ? "list" : "month"
  );
  const router = useRouter();
  const tKey = todayKey(now);

  // The student's block sessions, merged over the seeded events. EVENTS stays
  // untouched because the library and course pages read it too and neither has
  // a place for the block.
  const plan = planFor("block11", STUDENT.name);
  const events = useMemo(() => {
    if (!plan) return EVENTS;
    const item = { time: plan.joinAt, t24: plan.slots[0].t24, title: BLOCK_TITLE, tutor: plan.slots.map((s) => s.tutor).join(", "), color: "#009DFF", bg: "rgba(0,157,255,.12)" };
    const merged: typeof EVENTS = { ...EVENTS };
    for (const k of BLOCK_KEYS) merged[k] = [...(merged[k] ?? []), item];
    return merged;
  }, [plan]);

  const upcoming: UpItem[] = [];
  Object.keys(events)
    .sort()
    .forEach((k) => {
      if (k >= tKey && upcoming.length < 6)
        (events[k] || []).forEach((e) => {
          const d = new Date(k + "T12:00:00");
          upcoming.push({ dateLabel: d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }), time: e.time, title: e.title, tutor: e.tutor, color: e.color, bg: e.bg, k });
        });
    });

  const open = (u: { title: string; tutor: string; time: string; color: string; bg: string; k: string }) => {
    if (u.title === BLOCK_TITLE) {
      router.push("/block");
      return;
    }
    const d = new Date(u.k + "T12:00:00");
    openModal({ title: u.title, tutor: u.tutor, time: u.time, color: u.color, bg: u.bg, cid: TITLE_TO_CID[u.title], k: u.k, dateLabel: d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }) });
  };

  const myAssignments = assignedToMe();
  const bookletFor = (k: string): string | null => {
    const sessionISO = k + "T" + ONLINE_T24 + ":00";
    const hit = myAssignments.find((a) => a.courseId === "chem11" && a.sessionISO === sessionISO);
    return hit ? hit.fileName : null;
  };

  const onJoinToday = (k: string) => {
    const sessionISO = k + "T" + ONLINE_T24 + ":00";
    const start = new Date(sessionISO).getTime();
    const minsLate = now < start ? 0 : Math.round((now - start) / 60000);
    joinClass("chem11", sessionISO, minsLate);
    showToast(now < start ? "The classroom opens at 7:00pm tonight" : "Joining the online classroom");
  };

  const cells = monthGrid(vm, vy);

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 16, alignItems: "start", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* Upcoming list. Hidden on phones: the calendar below opens in List view
          there and already covers these rows, so showing both repeated the same
          six classes in two different layouts on one screen. */}
      <div className="glass-card ev-only-desktop" style={{ padding: "20px 22px" }}>
        <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Upcoming classes</h2>
        {upcoming.map((u, i) => {
          const booklet = u.title === ONLINE_TITLE ? bookletFor(u.k) : null;
          const isToday = u.k === tKey;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: i < upcoming.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: u.color, background: u.bg, padding: "5px 8px", borderRadius: 8, flex: "none", width: 62, textAlign: "center" }}>{u.dateLabel}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.title}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{u.time} · {u.tutor}</span>
                {booklet && (
                  <span style={{ display: "block", fontSize: 10.5, color: "var(--brand-600)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📎 {booklet}</span>
                )}
              </span>
              {isToday && u.title === ONLINE_TITLE && (
                <button onClick={() => onJoinToday(u.k)} className="btn-primary press" style={{ height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, flex: "none" }}>
                  Join
                </button>
              )}
              <a href="#" onClick={(e) => { e.preventDefault(); open(u); }} style={{ fontSize: 12, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600, flex: "none" }}>Details</a>
            </div>
          );
        })}
      </div>

      {/* Calendar */}
      <div className="glass-card" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, flex: "none" }}>{monthLabel(vm, vy)}</h2>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={prevMonth} aria-label="Previous month" className="mini-nav" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14 }}>‹</button>
            <button onClick={nextMonth} aria-label="Next month" className="mini-nav" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14 }}>›</button>
          </div>
          <div className="ev-cal-toggle" style={{ marginLeft: "auto", display: "inline-flex", background: "rgba(0,32,63,.06)", borderRadius: 10, padding: 3, gap: 2 }}>
            {(["month", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className="ev-tap-h" aria-pressed={view === v} style={{ height: 30, padding: "0 16px", borderRadius: 8, border: "none", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", background: view === v ? "#FFFFFF" : "transparent", color: view === v ? "var(--fg1)" : "var(--fg3)", boxShadow: view === v ? "0 2px 6px rgba(0,32,63,.12)" : "none" }}>{v}</button>
            ))}
          </div>
        </div>

        {view === "month" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", textAlign: "center", fontSize: 10.5, color: "var(--fg4)", fontWeight: 700, paddingBottom: 6 }}>
              {DOWS_MON.map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", borderTop: "1px solid rgba(0,32,63,.08)", borderLeft: "1px solid rgba(0,32,63,.08)" }}>
              {cells.map((c, i) => {
                const isToday = c.k === tKey;
                const hit = (events[c.k] || [])[0];
                const booklet = hit && hit.title === ONLINE_TITLE ? bookletFor(c.k) : null;
                return (
                  <div
                    key={i}
                    onClick={hit ? () => open({ title: hit.title, tutor: hit.tutor, time: hit.time, color: hit.color, bg: hit.bg, k: c.k }) : undefined}
                    role={hit ? "button" : undefined}
                    tabIndex={hit ? 0 : undefined}
                    onKeyDown={hit ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open({ title: hit.title, tutor: hit.tutor, time: hit.time, color: hit.color, bg: hit.bg, k: c.k }); } } : undefined}
                    style={{ minHeight: 76, borderRight: "1px solid rgba(0,32,63,.06)", borderBottom: "1px solid rgba(0,32,63,.06)", padding: 6, boxSizing: "border-box", background: isToday ? "rgba(0,157,255,.05)" : "transparent", cursor: hit ? "pointer" : "default" }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--brand-600)" : c.inMonth ? "var(--fg1)" : "var(--fg5-decorative)" }}>{c.d.getDate()}</div>
                    {/* A day cell is ~44px on a phone, so a full class name inside
                        it breaks to "Verba / Reaso". Below 720px the cell shows a
                        coloured dot instead and the name lives in the List view
                        and the day detail. Desktop keeps the labelled chip. */}
                    {hit && (
                      <>
                        <div className="ev-only-desktop" style={{ marginTop: 5, borderRadius: 7, background: hit.bg, color: hit.color, fontSize: 10, fontWeight: 700, padding: "3px 6px", lineHeight: 1.3, overflow: "hidden" }}>
                          {hit.title}
                          <span style={{ display: "block", fontWeight: 600, opacity: 0.8 }}>{hit.time}</span>
                        </div>
                        <div className="ev-only-mobile" style={{ justifyContent: "center", marginTop: 4 }} title={hit.title + " " + hit.time}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: hit.color, display: "block" }} />
                        </div>
                      </>
                    )}
                    {booklet && (
                      <div className="ev-only-desktop" style={{ marginTop: 3, fontSize: 9, color: "var(--brand-600)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📎 {booklet}</div>
                    )}
                    {isToday && hit && hit.title === ONLINE_TITLE && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onJoinToday(c.k); }}
                        className="btn-primary press ev-only-desktop"
                        style={{ marginTop: 3, height: 20, padding: "0 8px", borderRadius: 6, fontSize: 9.5, fontWeight: 700, width: "100%" }}
                      >
                        Join
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 10 }}>Click a class to see its details and materials.</div>
          </>
        )}

        {view === "list" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {upcoming.map((u, i) => {
              const booklet = u.title === ONLINE_TITLE ? bookletFor(u.k) : null;
              const isToday = u.k === tKey;
              return (
                <div
                  key={i}
                  onClick={() => open(u)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(u); } }}
                  className="row-hover ev-cal-row"
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 6px", borderBottom: "1px solid rgba(0,32,63,.06)", cursor: "pointer" }}
                >
                  <span className="ev-cal-date" style={{ fontSize: 11, fontWeight: 700, color: u.color, background: u.bg, padding: "5px 10px", borderRadius: 9, flex: "none", width: 74, textAlign: "center" }}>{u.dateLabel}</span>
                  <span className="ev-cal-main" style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>{u.title}</span>
                    {booklet && (
                      <span style={{ display: "block", fontSize: 10.5, color: "var(--brand-600)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>📎 {booklet}</span>
                    )}
                  </span>
                  <span className="ev-cal-time" style={{ fontSize: 12, color: "var(--fg3)", flex: "none" }}>{u.time}</span>
                  <span className="ev-cal-tutor" style={{ fontSize: 12, color: "var(--fg4)", flex: "none" }}>{u.tutor}</span>
                  {isToday && u.title === ONLINE_TITLE && (
                    <button onClick={(e) => { e.stopPropagation(); onJoinToday(u.k); }} className="btn-primary press ev-cal-join" style={{ height: 26, padding: "0 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, flex: "none" }}>
                      Join
                    </button>
                  )}
                  <span className="ev-cal-details ev-tap-link" style={{ fontSize: 12, color: "var(--brand-600)", fontWeight: 600, flex: "none" }}>Details</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
