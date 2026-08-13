import React, { useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { useRouter } from "@/lib/router";
import { usePortal } from "@/lib/store";
import {
  ACCENT,
  CHEM_SESSION_KEYS,
  COURSE_DEFS,
  CourseId,
  ENROLLED_COURSES,
  EnrolledCourse,
  EVENTS,
  ICON,
  iconForResource,
  libAll,
  wsBase,
} from "@/lib/data";
import { DOWS_MON, monthGrid, monthLabel, todayKey } from "@/lib/calendar";
import { Icon } from "@/components/ui/Icon";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";
import { MATERIAL_KIND_META } from "@/lib/tutor-data";

// Only Chemistry runs through the tutor's online-materials system on this
// data model (chem = chem11 on the tutor side, same Thursday 7pm schedule).
// Verbal and GATE are not modelled as tutor-side online courses, so they
// never carry an assignment to look up here.
const DOC_ICON = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z";

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}h ${m}m ${ss}s` : `${m}m ${ss}s`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { now, vm, vy, sel, selectDay, prevMonth, nextMonth, done, dueCount, submitWorksheet, openModal, showToast, joinClass, assignedToMe } = usePortal();
  const nowD = new Date(now);
  const tKey = todayKey(now);
  const [preview, setPreview] = useState<{ name: string; meta: string } | null>(null);
  const coursesRef = useRef<HTMLDivElement>(null);
  const enrolled = ENROLLED_COURSES;
  const isCarousel = enrolled.length > 3; // >3 -> arrows + horizontal scroll
  const scrollCourses = (dir: -1 | 1) => coursesRef.current?.scrollBy({ left: dir * 248, behavior: "smooth" });

  // ---- countdown ----
  const start = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate(), 19, 0, 0);
  const end = new Date(start.getTime() + 3600000);
  // The hero treats tonight as class night, but join events must land on a
  // session key the tutor portal actually has (Thursdays), or auto-attendance
  // never sees them. Snap to the nearest real Chemistry session date.
  const nearestChemKey = CHEM_SESSION_KEYS.find((k) => k >= tKey) ?? CHEM_SESSION_KEYS[CHEM_SESSION_KEYS.length - 1];
  const nextClassSessionISO = nearestChemKey + "T19:00:00";
  let countdown: string;
  let liveDot = "var(--brand-500)";
  let joinLabel = "Join class";
  let live = false;
  if (nowD < start) countdown = "Starts in " + fmt(start.getTime() - nowD.getTime());
  else if (nowD < end) {
    countdown = "Live now";
    liveDot = "var(--success-500)";
    live = true;
  } else {
    countdown = "Next: Sat 4 Jul, 10:00am";
    liveDot = "var(--fg4)";
    joinLabel = "View recap";
  }
  const glowOn = now >= start.getTime() - 600000 && now < end.getTime();

  // Joining should feel unchanged to the student: same toast/behaviour as
  // before, plus a joinClass() call that logs the join event (idempotent)
  // for the tutor's auto-attendance. minsLate is 0 before the session
  // starts, otherwise however many minutes late "now" is against start.
  const onJoin = () => {
    if (live || nowD < start) {
      const minsLate = nowD < start ? 0 : Math.round((nowD.getTime() - start.getTime()) / 60000);
      joinClass("chem11", nextClassSessionISO, minsLate);
    }
    showToast(live ? "Joining the online classroom" : nowD < start ? "The classroom opens at 7:00pm tonight" : "Recaps are not wired up in this prototype yet");
  };

  // ---- today's class material callout ----
  // A booklet/worksheet pinned to tonight's Chemistry session (or, failing
  // that, the most recently assigned one to Maya's class) - so she knows
  // what to have open before she joins.
  const myAssignments = assignedToMe();
  const todaysMaterial =
    myAssignments.find((a) => a.courseId === "chem11" && a.sessionISO && a.sessionISO.slice(0, 10) === tKey) ??
    (myAssignments.some((a) => a.courseId === "chem11") ? myAssignments.find((a) => a.courseId === "chem11") : undefined);

  // ---- mini calendar ----
  const cells = monthGrid(vm, vy);
  const selD = new Date(sel + "T12:00:00");
  const selLabel = selD.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  const selEvents = EVENTS[sel] || [];

  // ---- worksheets ----
  const ws = wsBase();

  // ---- library recent ----
  const recent = libAll().slice(0, 3);

  // ---- up next ----
  const upNext = [
    { cid: "verbal" as CourseId, mon: "JUL", day: "7", title: "Verbal Reasoning", meta: "7:00pm · Grace Lin", accent: true, k: "2026-07-07", time: "7:00pm", dateLabel: "Tuesday 7 July" },
    { cid: "chem" as CourseId, mon: "JUL", day: "9", title: "Chemistry", meta: "7:00pm · Priya Rao", accent: false, k: "2026-07-09", time: "7:00pm", dateLabel: "Thursday 9 July" },
    { cid: "gate" as CourseId, mon: "JUL", day: "11", title: "GATE Workshop", meta: "10:00am · David Chen", accent: false, k: "2026-07-11", time: "10:00am", dateLabel: "Saturday 11 July" },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* HERO */}
      <div
        style={{
          gridColumn: "span 12",
          animation: "evrise .55s cubic-bezier(.16,1,.3,1) .08s backwards",
          position: "relative",
          borderRadius: 22,
          padding: 2,
          overflow: "hidden",
          boxSizing: "border-box",
          background: "rgba(255,255,255,.75)",
          boxShadow: "0 18px 40px -20px rgba(0,32,63,.35)",
        }}
      >
        {glowOn && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "230%",
              aspectRatio: "1",
              transform: "translate(-50%,-50%)",
              background:
                "conic-gradient(from 0deg,rgba(0,157,255,0) 0deg,rgba(0,157,255,.55) 90deg,rgba(122,90,248,.5) 160deg,rgba(122,90,248,0) 250deg,rgba(0,157,255,0) 360deg)",
              animation: "evspin 8s linear infinite",
            }}
          />
        )}
        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 172, background: "var(--bg-page)" }}>
          {/* aurora treatment (default) */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg,var(--brand-50) 0%,var(--bg-page) 46%,rgba(122,90,248,.10) 76%,rgba(0,157,255,.16) 100%)" }} />
          <div style={{ position: "absolute", right: -70, top: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,157,255,.22),transparent 70%)", animation: "evdrift3 13s ease-in-out infinite" }} />
          <div style={{ position: "absolute", right: 180, bottom: -110, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(122,90,248,.16),transparent 70%)", animation: "evdrift2 17s ease-in-out -6s infinite" }} />
          <div style={{ position: "relative", zIndex: 2, minHeight: 172, padding: "20px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14, boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.8)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,.9)", padding: "6px 12px", borderRadius: 980, fontSize: 11.5, fontWeight: 600, color: "var(--fg1)", boxShadow: "0 6px 16px -8px rgba(0,32,63,.3)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: liveDot, animation: "evpulse 1.6s ease-in-out infinite", display: "inline-block" }} />
                {countdown}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg3)" }}>YOUR NEXT CLASS</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 800, letterSpacing: -0.4, marginTop: 3 }}>Organic Chemistry</div>
                <div style={{ fontSize: 13, color: "var(--fg2)", marginTop: 3 }}>Session 6 · 7:00pm to 8:00pm · Priya Rao</div>
              </div>
              <div className="ev-hero-actions" style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
                <button onClick={onJoin} className="btn-primary" style={{ height: 42, padding: "0 22px", borderRadius: 12, fontSize: 13.5 }}>
                  {joinLabel}
                </button>
                <Link href="/timetable" className="btn-ghost" style={{ height: 42, padding: "0 20px", borderRadius: 12, fontSize: 13.5, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  View Class Schedule
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S CLASS MATERIAL */}
      {todaysMaterial && (
        <div
          className="glass-card list-hover ev-wrap-row"
          style={{ gridColumn: "span 12", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .12s backwards", padding: "13px 20px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
        >
          <span style={{ width: 34, height: 34, borderRadius: 10, flex: "none", background: "rgba(0,157,255,.12)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon path={DOC_ICON} size={15} />
          </span>
          <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
            <span className="ev-title-2" style={{ display: "block", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Today&apos;s class uses: {todaysMaterial.fileName}
            </span>
            <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>
              {MATERIAL_KIND_META[todaysMaterial.kind].label} · Chemistry
            </span>
          </span>
          <button
            onClick={() => setPreview({ name: todaysMaterial.fileName, meta: MATERIAL_KIND_META[todaysMaterial.kind].label })}
            className="btn-ghost press"
            style={{ height: 32, padding: "0 15px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", flex: "none" }}
          >
            Preview
          </button>
        </div>
      )}

      {/* MY COURSES - responds to enrolment count: 0 -> sign-up empty state,
          1 to 3 -> grid, 4+ -> horizontal carousel with arrows */}
      <div style={{ gridColumn: "span 8", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .16s backwards", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <h2 className="portal-section-title" style={{ margin: 0 }}>My courses</h2>
          {isCarousel ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--fg4)" }}>{enrolled.length} enrolled</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => scrollCourses(-1)} aria-label="Scroll courses left" className="mini-nav" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15 }}>‹</button>
                <button onClick={() => scrollCourses(1)} aria-label="Scroll courses right" className="mini-nav" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15 }}>›</button>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "var(--fg4)" }}>A course card opens its page</span>
          )}
        </div>

        {enrolled.length === 0 ? (
          // Not enrolled in anything yet - sign-up empty state (CTA unwired)
          <div
            className="glass-card"
            style={{ flex: 1, minHeight: 300, border: "1.5px dashed rgba(0,32,63,.16)", background: "rgba(0,157,255,.03)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "28px 22px", gap: 4 }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(0,157,255,.12)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
              <Icon path={ICON.courses} size={22} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>No courses yet</div>
            <div style={{ fontSize: 12.5, color: "var(--fg3)", maxWidth: 300, lineHeight: 1.5 }}>You are not enrolled in any courses. Browse the Everest catalogue and enrol to see your classes here.</div>
            <button onClick={() => showToast("Enrolment is not wired up in this prototype yet")} className="btn-primary press" style={{ height: 40, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, marginTop: 10 }}>
              Sign up to more courses
            </button>
          </div>
        ) : isCarousel ? (
          // 4+ enrolled - horizontal carousel
          <div ref={coursesRef} className="thin-scroll" style={{ display: "flex", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 4, flex: 1 }}>
            {enrolled.map((c, i) => (
              <div key={c.id} className="ev-carousel-card" style={{ flex: "0 0 224px", scrollSnapAlign: "start", display: "flex" }}>
                <CourseCard course={c} index={i} onOpen={() => router.push(c.href)} />
              </div>
            ))}
          </div>
        ) : (
          // 1 to 3 enrolled - grid
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, flex: 1 }}>
            {enrolled.map((c, i) => (
              <CourseCard key={c.id} course={c} index={i} onOpen={() => router.push(c.href)} />
            ))}
          </div>
        )}
      </div>

      {/* MINI CALENDAR */}
      <div className="glass-card" style={{ gridColumn: "span 4", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .22s backwards", padding: "20px 22px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>{monthLabel(vm, vy)}</h2>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={prevMonth} className="mini-nav" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 14 }}>‹</button>
            <button onClick={nextMonth} className="mini-nav" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 14 }}>›</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 2, textAlign: "center", fontSize: 10.5, color: "var(--fg4)", fontWeight: 700, marginBottom: 4 }}>
          {DOWS_MON.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 2, textAlign: "center" }}>
          {cells.map((c, i) => {
            const isToday = c.k === tKey;
            const isSel = c.k === sel;
            const hasEv = !!EVENTS[c.k];
            return (
              <button
                key={i}
                onClick={() => selectDay(c.k)}
                aria-label={c.d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }) + (hasEv ? ", has an event" : "")}
                aria-pressed={isSel}
                className="list-hover ev-tap-cell"
                style={{ padding: "2px 0", cursor: "pointer", borderRadius: 10, display: "flex", justifyContent: "center", border: "none", background: "none", fontFamily: "inherit", width: "100%" }}
              >
                <span
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12.5,
                    fontWeight: isToday || isSel ? 700 : 500,
                    background: isToday ? "var(--brand-500)" : isSel ? "rgba(0,157,255,.14)" : "transparent",
                    color: isToday ? "#fff" : isSel ? "var(--brand-600)" : c.inMonth ? "var(--fg1)" : "var(--fg5-decorative)",
                    boxShadow: isToday ? "0 6px 14px -4px rgba(0,157,255,.55)" : "none",
                  }}
                >
                  {c.d.getDate()}
                  <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: hasEv ? (isToday ? "#fff" : "var(--brand-500)") : "transparent" }} />
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ borderTop: "1px solid rgba(0,32,63,.08)", marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)", marginBottom: 8 }}>{selLabel}</div>
          {selEvents.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: e.color, background: e.bg, padding: "4px 9px", borderRadius: 8, flex: "none" }}>{e.time}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
              <span style={{ fontSize: 11.5, color: "var(--fg4)", flex: "none" }}>{e.tutor}</span>
            </div>
          ))}
          {selEvents.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "4px 0" }}>No sessions on this day.</div>}
        </div>
      </div>

      {/* UP NEXT */}
      <div className="glass-card" style={{ gridColumn: "span 4", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .28s backwards", padding: "20px 22px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Up next</h2>
          <Link href="/timetable" className="ev-tap-link" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>Schedule</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {upNext.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "center", width: 42, flex: "none", background: u.accent ? "rgba(0,157,255,.12)" : "rgba(0,32,63,.05)", borderRadius: 11, padding: "6px 0" }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: u.accent ? "var(--brand-600)" : "var(--fg3)", letterSpacing: 0.5 }}>{u.mon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: u.accent ? "var(--navy-500)" : "var(--fg1)", lineHeight: 1.1 }}>{u.day}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{u.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg3)" }}>{u.meta}</div>
              </div>
              <button
                onClick={() => openModal({ title: u.title, tutor: u.title === "Chemistry" ? "Priya Rao" : u.title === "Verbal Reasoning" ? "Grace Lin" : "David Chen", time: u.time, color: ACCENT[u.cid].color, bg: ACCENT[u.cid].bg, cid: u.cid, k: u.k, dateLabel: u.dateLabel })}
                className="btn-ghost"
                style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", flex: "none" }}
              >
                Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RECENTLY ADDED LIBRARY */}
      <div className="glass-card" style={{ gridColumn: "span 8", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .32s backwards", padding: "20px 22px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Recently added</h2>
          <Link href="/library" className="ev-tap-link" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600, flex: "none", whiteSpace: "nowrap", marginLeft: 12 }}>Open library</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recent.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < recent.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flex: "none", background: ACCENT[r.course].bg, color: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path={iconForResource(r.icon)} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ev-title-2" style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>{COURSE_DEFS[r.course].name} · {r.meta}</div>
              </div>
              <button onClick={() => setPreview({ name: r.name, meta: r.meta })} className="btn-ghost" style={{ height: 30, padding: "0 14px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", flex: "none" }}>
                Preview
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* WORKSHEETS TO SUBMIT */}
      <div className="glass-card" style={{ gridColumn: "span 12", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .36s backwards", padding: "20px 22px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Worksheets to submit</h2>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--danger-500)", background: "rgba(224,65,65,.1)", padding: "4px 10px", borderRadius: 980 }}>{dueCount} to submit</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ws.map((w, i) => {
            const d = !!done[w.id];
            return (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i < ws.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: d ? "rgba(34,160,91,.12)" : "rgba(0,157,255,.1)", color: d ? "var(--success-500)" : "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", transition: "background .25s ease" }}>
                  <Icon path={ICON.doc} size={15} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: d ? "var(--fg4)" : "var(--fg1)", transition: "color .25s ease" }}>
                    {/* The dot belongs to the worksheet, not to the button - as a
                        sibling of the row it wrapped onto the action line. */}
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: d ? "var(--success-500)" : w.dot, transition: "background .25s ease", flex: "none" }} />
                    <span className="ev-title-2" style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</span>
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{d ? "Submitted, awaiting grade" : w.due}</span>
                </span>
                <button
                  onClick={() => submitWorksheet(w.id, w.name)}
                  className="press ev-tap-h"
                  style={{
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 9,
                    border: d ? "1px solid rgba(34,160,91,.3)" : "none",
                    background: d ? "rgba(34,160,91,.1)" : "var(--brand-500)",
                    color: d ? "var(--success-500)" : "#fff",
                    fontFamily: "inherit",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    flex: "none",
                    transition: "background .2s ease,color .2s ease,transform .15s ease",
                  }}
                >
                  {d ? "Submitted" : "Submit"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {preview && (
        <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} />
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "rgba(255,255,255,.92)", color: "var(--navy-500)", fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 980 }}>{children}</span>;
}

// One enrolment card. Core courses (with a slotId) keep the drop-a-photo
// ImageSlot; catalogue extras render their pooled photo directly. Both get the
// Ken Burns drift, varied by index so cards don't breathe in lockstep.
function CourseCard({ course, index, onOpen }: { course: EnrolledCourse; index: number; onOpen: () => void }) {
  const kb = ["evkenburns1 13s", "evkenburns2 16s", "evkenburns3 19s"][index % 3];
  return (
    <div className="card-lift" style={{ position: "relative", borderRadius: 18, overflow: "hidden", minHeight: 300, height: "100%", width: "100%", boxSizing: "border-box", boxShadow: "0 16px 36px -18px rgba(0,32,63,.4)" }}>
      {course.slotId ? (
        <ImageSlot slotId={course.slotId} fallbackSrc={course.photo} placeholder={`Drop a ${course.name} class photo`} className="ev-kenburns" style={{ position: "absolute", inset: 0, animation: kb + " ease-in-out infinite" }} />
      ) : (
        <div className="ev-kenburns" style={{ position: "absolute", inset: 0, backgroundImage: `url(${course.photo})`, backgroundSize: "cover", backgroundPosition: "center", animation: kb + " ease-in-out infinite" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: course.grad, pointerEvents: "none" }} />
      <button onClick={onOpen} style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 16px 14px", cursor: "pointer", color: "#fff", border: "none", background: "none", fontFamily: "inherit", textAlign: "left", display: "block", width: "100%" }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
          <Icon path={course.icon} size={18} style={{ color: "#fff" }} />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>{course.name}</div>
        <div style={{ fontSize: 11.5, lineHeight: 1.45, opacity: 0.88, margin: "5px 0 10px" }}>{course.tagline}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Pill>{course.tutor}</Pill>
          <Pill>{course.shortSched}</Pill>
        </div>
      </button>
    </div>
  );
}
