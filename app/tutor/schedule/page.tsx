// Schedule - the tutor's month view with per-class booklet status, plus an
// upcoming list. Mirrors the student Timetable layout.

import React, { useState } from "react";
import { useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { BOOKLET_META, TUTOR_COURSES, TutorClass } from "@/lib/tutor-data";
import { DOWS_MON, monthGrid, monthLabel, todayKey } from "@/lib/calendar";
import { ClassDetailModal } from "@/components/tutor/ClassDetailModal";

export default function TutorSchedulePage() {
  const router = useRouter();
  const { now, vm, vy, prevMonth, nextMonth, classes, setRequestClass } = useTutor();
  // A 7-column month grid gives each day ~44px on a phone, which is not enough
  // for a class chip. Phones open on the list instead; the toggle still works.
  const [view, setView] = useState<"month" | "list">(() =>
    typeof window !== "undefined" && window.innerWidth <= 720 ? "list" : "month"
  );
  const tKey = todayKey(now);
  const [detail, setDetail] = useState<{ courseId: TutorClass["course"]; sessionISO: string } | null>(null);

  const byDay: Record<string, TutorClass[]> = {};
  classes.forEach((c) => {
    (byDay[c.k] = byDay[c.k] || []).push(c);
  });
  const upcoming = classes.filter((c) => c.k >= tKey).slice(0, 7);
  const cells = monthGrid(vm, vy);

  const requestFor = (c: TutorClass) => {
    setRequestClass(c.id);
    router.push("/tutor/materials");
  };

  // Click a class: in-person -> request booklets for it (autofilled on the
  // materials page, unchanged); online -> open the class detail modal for
  // that exact session (library + participations), computed from the
  // class's date key and the course's scheduled time.
  const openClass = (c: TutorClass) => {
    if (TUTOR_COURSES[c.course].delivery === "in_person") {
      requestFor(c);
    } else {
      const sessionISO = c.k + "T" + TUTOR_COURSES[c.course].t24 + ":00";
      setDetail({ courseId: c.course, sessionISO });
    }
  };

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 16, alignItems: "start", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* UPCOMING LIST */}
      <div className="glass-card" style={{ padding: "20px 22px" }}>
        <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Upcoming classes</h2>
        {upcoming.map((c, i) => {
          const cd = TUTOR_COURSES[c.course];
          const bm = BOOKLET_META[c.booklet];
          const inPerson = cd.delivery === "in_person";
          const d = new Date(c.k + "T12:00:00");
          return (
            <button
              key={c.id}
              onClick={() => openClass(c)}
              className="list-hover ev-wrap-row"
              title={inPerson ? "Request booklets for this class" : "View class"}
              style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 11, padding: "11px 8px", margin: "0 -8px", borderRadius: 10, cursor: "pointer", borderBottom: i < upcoming.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none", border: "none", background: "none", fontFamily: "inherit" }}
            >
              <span style={{ fontSize: 10.5, fontWeight: 700, color: cd.color, background: cd.bg, padding: "5px 8px", borderRadius: 8, flex: "none", width: 74, textAlign: "center", whiteSpace: "nowrap" }}>
                {d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <span className="ev-wrap-main ev-wrap-lead-lg" style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600 }}>
                  {inPerson && <span title={"Booklets: " + bm.label} style={{ width: 9, height: 9, borderRadius: "50%", background: bm.color, flex: "none" }} />}
                  <span className="ev-title-2" style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cd.name}</span>
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{cd.time} · {cd.centre}</span>
              </span>
              <span className="ev-row-end" style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-600)", flex: "none" }}>{inPerson ? "Request →" : "View class →"}</span>
            </button>
          );
        })}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,32,63,.08)", display: "flex", flexWrap: "wrap", gap: 9 }}>
          {(["print_completed", "approved", "requested", "not_requested", "rejected"] as const).map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--fg3)", fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: BOOKLET_META[s].color, display: "inline-block" }} />
              {BOOKLET_META[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* CALENDAR */}
      <div className="glass-card" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, flex: 1, whiteSpace: "nowrap" }}>{monthLabel(vm, vy)}</h2>
          <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,32,63,.1)" }}>
            {(["month", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{ height: 32, padding: "0 14px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: view === v ? "var(--brand-500)" : "rgba(255,255,255,.7)", color: view === v ? "#fff" : "var(--fg3)", transition: "background .18s ease" }}
              >
                {v === "month" ? "Month" : "List"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={prevMonth} className="mini-nav" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15 }}>‹</button>
            <button onClick={nextMonth} className="mini-nav" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15 }}>›</button>
          </div>
        </div>

        {view === "month" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4, textAlign: "center", fontSize: 10.5, color: "var(--fg4)", fontWeight: 700, marginBottom: 6 }}>
              {DOWS_MON.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4 }}>
              {cells.map((c, i) => {
                const evs = byDay[c.k] || [];
                const isToday = c.k === tKey;
                return (
                  <div
                    key={i}
                    style={{
                      minHeight: 74,
                      borderRadius: 12,
                      padding: 6,
                      boxSizing: "border-box",
                      background: isToday ? "rgba(0,157,255,.09)" : "rgba(255,255,255,.45)",
                      border: "1px solid " + (isToday ? "rgba(0,157,255,.3)" : "rgba(0,32,63,.05)"),
                      opacity: c.inMonth ? 1 : 0.45,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "var(--brand-600)" : "var(--fg3)", marginBottom: 4 }}>{c.d.getDate()}</div>
                    {evs.map((e) => {
                      const cd = TUTOR_COURSES[e.course];
                      const bm = BOOKLET_META[e.booklet];
                      const inPerson = cd.delivery === "in_person";
                      return (
                        <button
                          key={e.id}
                          onClick={() => openClass(e)}
                          className="press"
                          title={inPerson ? cd.name + " · request booklets (" + bm.label.toLowerCase() + ")" : cd.name + " · view class"}
                          style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 4, background: cd.bg, color: cd.color, borderRadius: 7, padding: "3px 6px", fontSize: 9.5, fontWeight: 700, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", cursor: "pointer", border: "none", fontFamily: "inherit" }}
                        >
                          {inPerson && <span style={{ width: 5, height: 5, borderRadius: "50%", background: bm.color, flex: "none" }} />}
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{cd.year.replace("Year ", "Y")}<span className="ev-only-desktop"> {cd.time}</span></span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div>
            {classes
              .filter((c) => {
                const d = new Date(c.k + "T12:00:00");
                return d.getMonth() === vm && d.getFullYear() === vy;
              })
              .map((c, i, arr) => {
                const cd = TUTOR_COURSES[c.course];
                const bm = BOOKLET_META[c.booklet];
                const inPerson = cd.delivery === "in_person";
                const d = new Date(c.k + "T12:00:00");
                const past = c.k < tKey;
                return (
                  <div
                    key={c.id}
                    onClick={() => openClass(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openClass(c); } }}
                    className="list-hover ev-wrap-row"
                    title={inPerson ? "Request booklets for this class" : "View class"}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", margin: "0 -8px", borderRadius: 10, cursor: "pointer", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}
                  >
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: cd.color, background: cd.bg, padding: "5px 9px", borderRadius: 8, flex: "none", width: 78, textAlign: "center", whiteSpace: "nowrap" }}>
                      {d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className="ev-wrap-main ev-wrap-lead-lg" style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{cd.name} · Session {c.session}</span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{cd.time} · {cd.centre}</span>
                    </span>
                    {inPerson && <span style={{ fontSize: 10.5, fontWeight: 700, color: bm.color, background: bm.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{bm.label}</span>}
                    {inPerson ? (
                      <button onClick={(e) => { e.stopPropagation(); requestFor(c); }} className="btn-soft press ev-row-end" style={{ height: 26, padding: "0 12px", borderRadius: 8, fontSize: 11, flex: "none" }}>
                        {past ? "Reorder" : "Request booklets"}
                      </button>
                    ) : (
                      <span className="ev-row-end" style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-600)", flex: "none" }}>View class →</span>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {detail && (
        <ClassDetailModal courseId={detail.courseId} sessionISO={detail.sessionISO} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
