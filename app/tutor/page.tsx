// Tutor dashboard. Reshapes around the tutor's working mode:
// in-person tutors see the booklet print pipeline, online tutors see the
// teaching workflow (marking, outlines, recently assigned materials), both
// see both. Every class on the calendar is actionable: in-person -> booklet
// status + request; online -> details + start class.

import React from "react";
import Link from "@/components/ui/Link";
import { useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { BOOKLET_META, DELIVERY_META, MATERIAL_KIND_META, TUTOR_COURSES, TutorClass, classLabel } from "@/lib/tutor-data";
import { ICON } from "@/lib/data";
import { DOWS_MON, monthGrid, monthLabel, todayKey } from "@/lib/calendar";
import { Icon } from "@/components/ui/Icon";
import { BookletStatsPanel } from "@/components/tutor/BookletStatsPanel";

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}h ${m}m ${ss}s` : `${m}m ${ss}s`;
}

export default function TutorDashboard() {
  const router = useRouter();
  const {
    now, vm, vy, sel, selectDay, prevMonth, nextMonth,
    classes, requests, submissions, toMarkCount, pendingRequests,
    setRequestClass, showToast, hasInPerson, hasOnline, mode,
    effectiveAssignments,
  } = useTutor();
  const nowD = new Date(now);
  const tKey = todayKey(now);

  // Only the classes this tutor's mode can act on shape the dashboard.
  const myClasses = classes.filter((c) => {
    const d = TUTOR_COURSES[c.course].delivery;
    return (d === "in_person" && hasInPerson) || (d === "online" && hasOnline);
  });

  // ---- next class (delivery-aware hero) ----
  const upcomingAll = myClasses.filter((c) => c.k >= tKey);
  const nextClass = upcomingAll[0] ?? myClasses[myClasses.length - 1];
  const nextCd = nextClass ? TUTOR_COURSES[nextClass.course] : TUTOR_COURSES.chem11;
  const heroOnline = nextCd.delivery === "online";
  const heroBooklet = nextClass ? BOOKLET_META[nextClass.booklet] : BOOKLET_META.not_requested;

  const start = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate(), 19, 0, 0);
  const end = new Date(start.getTime() + 3600000);
  let countdown: string;
  let liveDot = "var(--brand-500)";
  let live = false;
  const isTonight = nextClass?.k === tKey;
  if (!isTonight) {
    countdown = nextClass ? "Next: " + new Date(nextClass.k + "T12:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) + ", " + nextCd.time : "No classes scheduled";
    liveDot = "var(--fg4)";
  } else if (nowD < start) countdown = "Starts in " + fmt(start.getTime() - nowD.getTime());
  else if (nowD < end) {
    countdown = "Live now";
    liveDot = "var(--success-500)";
    live = true;
  } else {
    countdown = "Class finished for tonight";
    liveDot = "var(--fg4)";
  }
  const glowOn = isTonight && now >= start.getTime() - 600000 && now < end.getTime();

  // ---- pipeline counts (print requests, in-person only) ----
  // ---- assigned materials (online only, from My Booklets) ----
  const recentAssignments = effectiveAssignments.slice(0, 3);
  const pipeline = [
    { label: "Requested", n: requests.length, color: "var(--accent-purple)", bg: "rgba(122,90,248,.13)", hint: "total this term" },
    { label: "Pending", n: requests.filter((r) => r.approval === "pending").length, color: "var(--warn-700)", bg: "rgba(245,166,35,.16)", hint: "awaiting approval" },
    { label: "Approved", n: requests.filter((r) => r.approval === "approved").length, color: "var(--brand-600)", bg: "rgba(0,157,255,.12)", hint: "cleared to print" },
    { label: "Printed", n: requests.filter((r) => r.printing === "completed").length, color: "var(--success-700)", bg: "rgba(34,160,91,.12)", hint: "ready at the centre" },
  ];
  const rejected = requests.filter((r) => r.approval === "rejected" || r.printing === "failed").length;
  // Most urgent: the earliest upcoming in-person class whose booklets aren't sorted.
  const atRisk = myClasses.find((c) => c.k >= tKey && TUTOR_COURSES[c.course].delivery === "in_person" && (c.booklet === "not_requested" || c.booklet === "rejected" || c.booklet === "print_failed"));

  // ---- upcoming classes ----
  const upcoming = upcomingAll.slice(0, 5);

  // ---- calendar events ----
  const evByDay: Record<string, TutorClass[]> = {};
  myClasses.forEach((c) => {
    (evByDay[c.k] = evByDay[c.k] || []).push(c);
  });
  const cells = monthGrid(vm, vy);
  const selD = new Date(sel + "T12:00:00");
  const selLabel = selD.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  const selClasses = evByDay[sel] || [];

  const toMark = submissions.filter((s) => !s.marked).slice(0, 3);

  const requestFor = (c: TutorClass) => {
    setRequestClass(c.id);
    router.push("/tutor/materials");
  };

  const statCards = [
    { label: "CLASSES THIS TERM", value: String(myClasses.length), sub: myClasses.filter((c) => c.k < tKey).length + " taught, " + upcomingAll.length + " to go", color: "var(--brand-500)", show: true },
    { label: "TO MARK", value: String(toMarkCount), sub: "worksheets waiting on feedback", color: "var(--danger-500)", show: hasOnline },
    { label: "REQUESTS PENDING", value: String(pendingRequests), sub: "print jobs awaiting approval", color: "var(--warn-700)", show: hasInPerson },
    { label: "MATERIALS ASSIGNED", value: String(effectiveAssignments.length), sub: "booklets and worksheets sent out", color: "var(--brand-600)", show: hasOnline },
    { label: "BOOKLETS PRINTED", value: String(pipeline[3].n), sub: rejected > 0 ? rejected + " need attention, see requests" : "all print jobs healthy", color: "var(--success-700)", show: hasInPerson && !hasOnline },
  ].filter((s) => s.show).slice(0, 4);
  const statSpan = Math.floor(12 / statCards.length);

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
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg,var(--brand-50) 0%,var(--bg-page) 46%,rgba(122,90,248,.10) 76%,rgba(0,157,255,.16) 100%)" }} />
          <div style={{ position: "absolute", right: -70, top: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,157,255,.22),transparent 70%)", animation: "evdrift3 13s ease-in-out infinite" }} />
          <div style={{ position: "relative", zIndex: 2, minHeight: 172, padding: "20px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14, boxSizing: "border-box" }}>
            {/* Meta row: the timing chip anchors the left, the class's status
                chips (delivery, booklets) sit apart on the right. */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px 12px", flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 980,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--fg1)",
                  background: "rgba(255,255,255,.85)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,.9)",
                  boxShadow: "0 8px 20px -10px rgba(0,32,63,.3)",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: liveDot, animation: "evpulse 1.6s ease-in-out infinite", flex: "none" }} />
                {countdown}
              </span>

              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    borderRadius: 980,
                    fontSize: 11,
                    fontWeight: 700,
                    color: DELIVERY_META[nextCd.delivery].color,
                    background: "rgba(255,255,255,.72)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,.85)",
                    boxShadow: "0 6px 16px -10px rgba(0,32,63,.25)",
                  }}
                >
                  <Icon path={nextCd.delivery === "in_person" ? "M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" : "M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-5.6l.6 2H16v2H8v-2h1.4l.6-2H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"} size={12} style={{ flex: "none" }} />
                  {DELIVERY_META[nextCd.delivery].label}{nextCd.delivery === "in_person" ? " · " + nextCd.centre : ""}
                </span>
                {nextCd.delivery === "in_person" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "7px 13px",
                      borderRadius: 980,
                      fontSize: 11,
                      fontWeight: 700,
                      color: heroBooklet.color,
                      background: "rgba(255,255,255,.72)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,.85)",
                      boxShadow: "0 6px 16px -10px rgba(0,32,63,.25)",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: heroBooklet.color, flex: "none" }} />
                    {heroBooklet.label} booklets
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg3)" }}>YOUR NEXT CLASS</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 800, letterSpacing: -0.4, marginTop: 3 }}>{nextCd.name}</div>
                <div style={{ fontSize: 13, color: "var(--fg2)", marginTop: 3 }}>
                  {nextCd.sched}
                  {nextCd.delivery === "in_person" ? " · " + nextCd.centre : " · " + nextCd.students.length + " students" + (nextCd.isBlock ? " across three rosters" : "")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
                {heroOnline ? (
                  <>
                    <Link href={"/tutor/courses/" + nextCd.id} className="btn-ghost" style={{ height: 42, padding: "0 20px", borderRadius: 12, fontSize: 13.5, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                      Class details
                    </Link>
                    <button
                      onClick={() => showToast(live ? "Opening your online classroom" : "The classroom opens at " + nextCd.time)}
                      className="btn-primary"
                      style={{ height: 42, padding: "0 22px", borderRadius: 12, fontSize: 13.5 }}
                    >
                      Start class
                    </button>
                  </>
                ) : (
                  <>
                    <Link href={"/tutor/courses/" + nextCd.id} className="btn-ghost" style={{ height: 42, padding: "0 20px", borderRadius: 12, fontSize: 13.5, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                      Class details
                    </Link>
                    {nextClass && (nextClass.booklet === "not_requested" || nextClass.booklet === "rejected") ? (
                      <button onClick={() => requestFor(nextClass)} className="btn-primary" style={{ height: 42, padding: "0 22px", borderRadius: 12, fontSize: 13.5 }}>
                        Request booklets
                      </button>
                    ) : (
                      <Link href="/tutor/requests" className="btn-primary" style={{ height: 42, padding: "0 22px", borderRadius: 12, fontSize: 13.5, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                        Track booklets
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STAT ROW (mode-aware) */}
      {statCards.map((s, i) => (
        <div key={s.label} className="glass-stat" style={{ gridColumn: `span ${statSpan}`, animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.12 + i * 0.04}s backwards` }}>
          <div className="glass-stat-label">{s.label}</div>
          <div className="glass-stat-value" style={{ color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>{s.sub}</div>
        </div>
      ))}

      {/* UPCOMING CLASSES (delivery-aware CTAs) */}
      <div className="glass-card" style={{ gridColumn: "span 8", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .26s backwards", padding: "20px 22px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 className="portal-section-title" style={{ fontSize: 15 }}>Upcoming classes</h2>
          <Link href="/tutor/schedule" className="ev-tap-link" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>Full schedule</Link>
        </div>
        <div className="ev-upcoming-grid" style={{ display: "grid", gridTemplateColumns: "70px 1fr auto auto", gap: "0 12px", alignItems: "center" }}>
          {upcoming.map((c, i) => {
            const cd = TUTOR_COURSES[c.course];
            const dm = DELIVERY_META[cd.delivery];
            const bm = BOOKLET_META[c.booklet];
            const d = new Date(c.k + "T12:00:00");
            const inPerson = cd.delivery === "in_person";
            const needsRequest = inPerson && (c.booklet === "not_requested" || c.booklet === "rejected");
            return (
              <React.Fragment key={c.id}>
                <div style={{ textAlign: "center", background: c.k === tKey ? "rgba(0,157,255,.12)" : "rgba(0,32,63,.05)", borderRadius: 11, padding: "6px 0", margin: "6px 0" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: c.k === tKey ? "var(--brand-600)" : "var(--fg3)", letterSpacing: 0.5 }}>
                    {d.toLocaleDateString("en-AU", { month: "short" }).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, lineHeight: 1.1 }}>{d.getDate()}</div>
                </div>
                <div style={{ minWidth: 0, padding: "10px 0", borderBottom: i < upcoming.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <span className="ev-title-2" style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cd.name}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: dm.color, background: dm.bg, padding: "2px 8px", borderRadius: 980, flex: "none" }}>{dm.label}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 1 }}>
                    {cd.time} · {cd.centre}{inPerson ? "" : " · " + cd.students.length + " students"}
                  </div>
                </div>
                {inPerson ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: bm.color, background: bm.bg, padding: "5px 11px", borderRadius: 980, whiteSpace: "nowrap", textAlign: "center" }}>{bm.label}</span>
                ) : (
                  <Link href={"/tutor/courses/" + cd.id} className="btn-ghost" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, color: "var(--fg2)", background: "rgba(255,255,255,.7)", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", whiteSpace: "nowrap" }}>
                    Details
                  </Link>
                )}
                {inPerson ? (
                  needsRequest ? (
                    <button onClick={() => requestFor(c)} className="btn-primary press" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, whiteSpace: "nowrap" }}>
                      Request booklets
                    </button>
                  ) : (
                    <Link href="/tutor/requests" className="btn-ghost" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", whiteSpace: "nowrap" }}>
                      View request
                    </Link>
                  )
                ) : (
                  <button
                    onClick={() => showToast(c.k === tKey ? "Opening your online classroom" : "This room opens on the day, 10 minutes before class")}
                    className={c.k === tKey ? "btn-primary press" : "btn-soft press"}
                    style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, whiteSpace: "nowrap" }}
                  >
                    Start class
                  </button>
                )}
              </React.Fragment>
            );
          })}
          {upcoming.length === 0 && <div style={{ gridColumn: "1 / -1", fontSize: 12.5, color: "var(--fg4)", padding: "8px 0" }}>No upcoming classes for your working mode.</div>}
        </div>
      </div>

      {/* BOOKLET PIPELINE (in-person) or DIGITAL PACKS (online-only) */}
      <div className="glass-card" style={{ gridColumn: "span 4", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .3s backwards", padding: "20px 22px", boxSizing: "border-box" }}>
        {hasInPerson ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 className="portal-section-title" style={{ fontSize: 15 }}>Booklet pipeline</h2>
              <Link href="/tutor/requests" className="ev-tap-link" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>My Requests</Link>
            </div>
            <div style={{ display: "flex", alignItems: "stretch", gap: 0, marginBottom: 12 }}>
              {pipeline.map((p, i) => (
                <React.Fragment key={p.label}>
                  <Link href="/tutor/requests" style={{ flex: 1, textAlign: "center", textDecoration: "none", color: "inherit", borderRadius: 12, padding: "8px 2px" }} className="list-hover">
                    <span style={{ display: "inline-flex", width: 34, height: 34, borderRadius: "50%", background: p.bg, color: p.color, alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>{p.n}</span>
                    <span style={{ display: "block", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, color: "var(--fg3)", marginTop: 5 }}>{p.label.toUpperCase()}</span>
                  </Link>
                  {i < pipeline.length - 1 && <span style={{ alignSelf: "center", color: "var(--fg5-decorative)", fontSize: 12, flex: "none" }} aria-hidden="true">›</span>}
                </React.Fragment>
              ))}
            </div>
            {rejected > 0 && (
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--danger-500)", background: "rgba(224,65,65,.08)", borderRadius: 10, padding: "7px 11px", marginBottom: 10 }}>
                {rejected} request{rejected === 1 ? "" : "s"} rejected or failed - fix before class
              </div>
            )}
            {atRisk ? (
              <div style={{ border: "1px solid rgba(245,166,35,.35)", background: "rgba(245,166,35,.07)", borderRadius: 12, padding: "10px 13px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--warn-700)", marginBottom: 3 }}>NEEDS BOOKLETS</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{classLabel(atRisk)}</div>
                <button onClick={() => requestFor(atRisk)} className="btn-primary press" style={{ height: 30, padding: "0 14px", borderRadius: 9, fontSize: 11.5, marginTop: 8 }}>
                  Request now
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--success-700)", background: "rgba(34,160,91,.08)", borderRadius: 10, padding: "8px 12px", fontWeight: 600 }}>
                Every upcoming in-person class has its booklets sorted.
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <h2 className="portal-section-title" style={{ fontSize: 15 }}>Recently assigned</h2>
              <Link href="/tutor/booklets" className="ev-tap-link" style={{ fontSize: 12.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }}>My Booklets</Link>
            </div>
            {recentAssignments.map((a, i, arr) => {
              const cd = TUTOR_COURSES[a.courseId];
              return (
                <div key={a.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(0,157,255,.1)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Icon path={ICON.doc} size={14} />
                  </span>
                  <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
                    <span className="ev-title-2" style={{ display: "block", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName.replace(".pdf", "").replace(".docx", "")}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>{cd.name} · {a.target.kind === "class" ? "Whole class" : a.target.studentName}</span>
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: MATERIAL_KIND_META[a.kind].color, background: MATERIAL_KIND_META[a.kind].bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>{MATERIAL_KIND_META[a.kind].label}</span>
                </div>
              );
            })}
            {recentAssignments.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--fg4)", lineHeight: 1.55 }}>
                Nothing assigned yet. Search or browse the linked drive in My Booklets and assign to a class or student.
              </div>
            )}
            <Link href="/tutor/booklets" className="btn-primary press" style={{ height: 34, padding: "0 16px", borderRadius: 10, fontSize: 12, marginTop: 12, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              Assign booklets
            </Link>
          </>
        )}
      </div>

      {/* BOOKLET TRACKER (in-person only) - practice-wide requested/approved/rejected/supplied over the term */}
      {hasInPerson && (
        <div className="glass-card" style={{ gridColumn: "span 12", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .32s backwards", padding: "20px 22px", boxSizing: "border-box" }}>
          <BookletStatsPanel requests={requests} title="Booklet tracker" subtitle="All in-person classes · copies over the term" height={220} />
        </div>
      )}

      {/* MARKING QUEUE (online only) */}
      {hasOnline && (
        <div className="glass-card" style={{ gridColumn: "span 8", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .34s backwards", padding: "20px 22px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 className="portal-section-title" style={{ fontSize: 15 }}>Waiting on your feedback</h2>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--danger-500)", background: "rgba(224,65,65,.1)", padding: "4px 10px", borderRadius: 980 }}>{toMarkCount} to mark</span>
          </div>
          {toMark.map((s, i) => {
            const cd = TUTOR_COURSES[s.course];
            return (
              <div key={s.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < toMark.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: cd.bg, color: cd.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flex: "none" }}>{s.init}</span>
                <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.student} · {s.wsName}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{cd.name} · submitted {s.when}</span>
                </span>
                <Link href="/tutor/grade" className="btn-ghost" style={{ height: 30, padding: "0 14px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", textDecoration: "none", display: "inline-flex", alignItems: "center", flex: "none" }}>
                  Mark now
                </Link>
              </div>
            );
          })}
          {toMark.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "8px 0" }}>Nothing to mark. Enjoy the quiet.</div>}
        </div>
      )}

      {/* MINI CALENDAR (actionable) */}
      <div className="glass-card" style={{ gridColumn: hasOnline ? "span 4" : "span 8", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .38s backwards", padding: "20px 22px", boxSizing: "border-box" }}>
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
            const hasEv = !!evByDay[c.k];
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
          {selClasses.map((c) => {
            const cd = TUTOR_COURSES[c.course];
            const dm = DELIVERY_META[cd.delivery];
            const bm = BOOKLET_META[c.booklet];
            const inPerson = cd.delivery === "in_person";
            const needsRequest = inPerson && (c.booklet === "not_requested" || c.booklet === "rejected");
            const isPast = c.k < tKey;
            return (
              <div key={c.id} style={{ padding: "7px 0", borderBottom: "1px solid rgba(0,32,63,.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cd.color, background: cd.bg, padding: "4px 9px", borderRadius: 8, flex: "none" }}>{cd.time}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cd.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: dm.color, background: dm.bg, padding: "2px 7px", borderRadius: 980, flex: "none" }}>{dm.short}</span>
                </div>
                <div className="ev-day-actions" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, paddingLeft: 2 }}>
                  {inPerson && <span style={{ fontSize: 9.5, fontWeight: 700, color: bm.color, background: bm.bg, padding: "2px 8px", borderRadius: 980, flex: "none" }}>{bm.label}</span>}
                  {!isPast && inPerson && needsRequest && (
                    <button onClick={() => requestFor(c)} className="btn-primary press" style={{ height: 24, padding: "0 10px", borderRadius: 7, fontSize: 10, fontWeight: 700 }}>
                      Request booklets
                    </button>
                  )}
                  {!isPast && !inPerson && (
                    <button onClick={() => showToast(c.k === tKey ? "Opening your online classroom" : "This room opens on the day")} className="btn-soft press" style={{ height: 24, padding: "0 10px", borderRadius: 7, fontSize: 10, fontWeight: 700 }}>
                      Start class
                    </button>
                  )}
                  {isPast && !inPerson && hasOnline && (
                    <Link href={"/tutor/courses/" + cd.id} style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-600)", textDecoration: "none" }}>Mark attendance →</Link>
                  )}
                  <Link href={"/tutor/courses/" + cd.id} style={{ fontSize: 10, fontWeight: 700, color: "var(--fg3)", textDecoration: "none", marginLeft: "auto" }}>Details →</Link>
                </div>
              </div>
            );
          })}
          {selClasses.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "4px 0" }}>No classes on this day.</div>}
        </div>
      </div>

      {/* STUDENT OUTLINES NUDGE (online only) */}
      {hasOnline && (
        <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .42s backwards", padding: "18px 22px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,157,255,.1)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon path={ICON.clipboard} size={18} />
          </span>
          <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>Maya Kapoor shared her Chemistry ATAR outline, and Ruby Chen&apos;s Science outline is still scanning.</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 2 }}>Elliot has mapped their school assessments so you can plan sessions around what is coming up.</span>
          </span>
          <Link href="/tutor/outlines" className="btn-soft ev-wrap-cta" style={{ height: 34, padding: "0 16px", borderRadius: 10, fontSize: 12.5, display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flex: "none", whiteSpace: "nowrap" }}>
            View student outlines
          </Link>
        </div>
      )}

      {/* Mode explainer for single-mode tutors */}
      {mode !== "both" && (
        <div style={{ gridColumn: "span 12", fontSize: 11.5, color: "var(--fg4)", textAlign: "center", padding: "2px 0 6px" }}>
          You are set up for {mode === "in_person" ? "in-person booklet requests only - online teaching tools are hidden" : "online teaching only - the print request pipeline is hidden"}. Ask the office if your duties change.
        </div>
      )}
    </div>
  );
}
