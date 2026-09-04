// Classes: the office's view of the whole timetable, with the roll behind each.
//
// Capacity is a bar because "9/12" and "12/12" need to look different across a
// room. The roll opens in place rather than on its own route: the office checks
// who is in a class while on the phone to a parent, and a page change loses the
// list they were reading.

import React, { useMemo, useState } from "react";
import { useRouter } from "@/lib/router";
import { useAdmin } from "@/lib/admin-store";
import { useRole } from "@/lib/admin-role";
import { Modal } from "@/components/ui/Modal";
import { ClassFormModal, WEEKDAYS, to24, toDisplay } from "@/components/admin/ClassFormModal";
import { Icon } from "@/components/ui/Icon";
import { AdminClass, AdminStudent, CENTRES, allClasses, allStudents, defaultCapacity } from "@/lib/admin-data";
import { DELIVERY_META } from "@/lib/tutor-data";
import { TERMS } from "@/lib/admin-masters";
import { allSessions, centreStyle } from "@/lib/admin-schedule";
import { DayList, MonthCalendar } from "@/components/admin/MonthCalendar";
import { ExpectedSession, attendanceHistory, summarise } from "@/lib/attendance-history";
import { StudentDetailModal } from "@/components/admin/StudentDetailModal";
import { BlockEnrolment } from "@/components/admin/BlockEnrolment";
import { addBlock, blockMeta, isBlock, rollBlock, slotsFor } from "@/lib/block";
import { NewBlockModal } from "@/components/admin/NewBlockModal";
import { CatchUpModal } from "@/components/portal/CatchUpModal";
import { CATALOGUE } from "@/lib/tutor-data";
import { RollOverModal } from "@/components/admin/RollOverModal";
import { addRelief, cancelRelief, displayDate, leaversFor, pendingCatchUps, recordLeavers, reliefFor, requestCatchUp, restoreLeaver, setCatchUpStatus } from "@/lib/class-changes";
import { ReliefModal } from "@/components/admin/ReliefModal";

/** Terms a class can be started in: anything not already finished. */
function openTerms() {
  return TERMS.filter((t) => t.state !== "finished");
}

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
};

/** The seeded roll for a class, by name. */
export function rollNames(cls: AdminClass): string[] {
  return allStudents().filter((s) => s.classNames.includes(cls.name)).map((s) => s.name);
}

function Roll({ cls, names, onClose, onEdit, onOpenStudent, pctFor, canEdit, onAssign, onCatchUp, onRelief }: { cls: AdminClass; names?: string[]; onClose: () => void; onEdit: () => void; onOpenStudent: (s: AdminStudent) => void; pctFor: (name: string) => number; canEdit: boolean; onAssign: (s: AdminStudent) => void; onCatchUp: (s: AdminStudent) => void; onRelief: () => void }) {
  // Once the office has picked the students, THAT is the roll - not whichever
  // records happen to name this class.
  const roll = useMemo(() => {
    const students = allStudents();
    if (names) return names.map((n) => students.find((s) => s.name === n)).filter(Boolean) as typeof students;
    return students.filter((s) => s.classNames.includes(cls.name));
  }, [cls.name, names]);
  const cs = centreStyle(cls.delivery === "online" ? "Online" : cls.centre);
  return (
    <Modal onClose={onClose} labelledBy="roll-title" panelStyle={{ width: "min(560px, calc(100vw - 32px))", maxHeight: "min(88vh, 820px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ flex: "none", width: 5, alignSelf: "stretch", borderRadius: 3, background: cs.colour }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="roll-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              {cls.name}
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>
              {cls.tutorName} · {cls.sched} · {cls.centre}
            </span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", margin: "16px 0 6px" }}>
          THE ROLL · {cls.students} OF {cls.capacity} SEATS
        </div>

        {roll.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "14px 0", lineHeight: 1.6 }}>
            No student records are attached to this class yet. {cls.students} seats are counted against it in the timetable.
          </div>
        )}

        {roll.map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(14,156,142,.14)", color: "var(--accent-teal)", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              {s.initials}
            </span>
            {/* The print role reads this to count copies and check a name. The
                parent's number is the Manager's to hold, so it is not shown,
                and the row does not open into a record full of it. */}
            <button
              onClick={() => canEdit && onOpenStudent(s)}
              disabled={!canEdit}
              className="press"
              style={{ flex: 1, minWidth: 0, textAlign: "left", border: "none", background: "none", padding: 0, font: "inherit", cursor: canEdit ? "pointer" : "default" }}
            >
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: canEdit ? "var(--brand-600)" : "var(--fg1)" }}>{s.name}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                {canEdit ? s.parent + " · " + s.parentPhone : s.year}
              </span>
            </button>
            {/* The same figure the detail view breaks down, not a second one:
                a roll saying 99% beside a list that adds up to 100% is a bug
                the office would have to reconcile by hand. */}
            <span style={{ fontSize: 12, fontWeight: 700, color: pctFor(s.name) < 80 ? "var(--warn-700)" : "var(--fg3)", flex: "none" }}>{pctFor(s.name)}%</span>
            {/* The office rings a parent, then wants to DO the thing they rang
                about. Both actions are for one named student, so they belong
                on that student's row rather than on the class. */}
            {canEdit && (
              <span style={{ display: "flex", gap: 6, flex: "none" }}>
                <button
                  onClick={() => onAssign(s)}
                  title={"Send a booklet to " + s.name}
                  className="btn-ghost press ev-tap-h"
                  style={{ height: 30, padding: "0 10px", borderRadius: 9, fontSize: 11, fontWeight: 700, color: "var(--fg2)" }}
                >
                  Send booklet
                </button>
                <button
                  onClick={() => onCatchUp(s)}
                  title={"Book " + s.name + " into another session"}
                  className="btn-ghost press ev-tap-h"
                  style={{ height: 30, padding: "0 10px", borderRadius: 9, fontSize: 11, fontWeight: 700, color: "var(--fg2)" }}
                >
                  Catch-up
                </button>
              </span>
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          {canEdit && (
            <>
              <button onClick={onEdit} className="btn-primary press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700 }}>
                Edit this class
              </button>
              <button onClick={onRelief} className="btn-soft press ev-tap-h" style={{ height: 42, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 700 }}>
                Arrange relief
              </button>
            </>
          )}
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminClasses() {
  const { notWired, showToast, classPatches, patchClass, addScheduledClass, scheduled, attendance, requests } = useAdmin();
  const router = useRouter();
  // The Admin (print) role reads this page for copy counts. The roll carries
  // parent phone numbers and Edit changes enrolments - neither is its job.
  const canEdit = useRole() === "office";
  // Office edits sit over the seed records, so a changed tutor or time shows
  // here, on the roll, and in the seats-left count without touching the seed.
  //
  // Classes the office scheduled itself are folded in beside the seeded ones.
  // They arrive as one row PER DATE, so they are collapsed back into the class
  // they are sessions of - a ten week course is one class here, not ten. Until
  // this, a class you had just scheduled appeared on the calendar and nowhere
  // on the page named Classes.
  const classes = useMemo(() => {
    const seeded = allClasses().map((c) => ({ ...c, ...classPatches[c.id] }));
    // A scheduled session belonging to a class that already exists is one of
    // that class's runs, not a second class - starting Year 11 Chemistry again
    // must not put a second Year 11 Chemistry card on the page.
    const known = new Set(seeded.map((c) => c.id));
    const byClass = new Map<string, AdminClass>();
    for (const s of scheduled) {
      if (byClass.has(s.courseId) || known.has(s.courseId)) continue;
      byClass.set(s.courseId, {
        id: s.courseId,
        name: s.className,
        year: "",
        centre: s.centre,
        delivery: s.delivery,
        sched: WEEKDAYS[(new Date(s.k + "T12:00:00").getDay() + 6) % 7] + " " + s.time,
        tutorId: "office",
        tutorName: s.tutor,
        colour: "var(--brand-600)",
        students: s.students,
        capacity: defaultCapacity(s.delivery),
      });
    }
    return [...seeded, ...[...byClass.values()].map((c) => ({ ...c, ...classPatches[c.id] }))];
  }, [classPatches, scheduled]);
  const [centre, setCentre] = useState("All");
  const [delivery, setDelivery] = useState<"all" | "online" | "in_person">("all");
  const [q, setQ] = useState("");
  const [roll, setRoll] = useState<AdminClass | null>(null);
  const [editing, setEditing] = useState<AdminClass | null>(null);
  // The block whose enrolment grid is open. It opens from the block's own
  // card (like the roll does) rather than rendering after every other card.
  const [enrolling, setEnrolling] = useState<string | null>(null);
  // The block being rolled over to next term - a class in every sense
  // (subjects, tutors, roster) prefilled into the create form for the office
  // to review before confirming, not silently repeated.
  const [rollingOver, setRollingOver] = useState<AdminClass | null>(null);
  const [buildingBlock, setBuildingBlock] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<AdminStudent | null>(null);
  const [day, setDay] = useState<string | null>("2026-07-02");
  const [assigning, setAssigning] = useState<{ cls: AdminClass; student: AdminStudent } | null>(null);
  const [bookingCatchUp, setBookingCatchUp] = useState<{ cls: AdminClass; student: AdminStudent } | null>(null);
  const [relieving, setRelieving] = useState<AdminClass | null>(null);
  // Bumped after a relief change so the cards re-read the shared store.
  const [reliefTick, setReliefTick] = useState(0);
  const [catchUpTick, setCatchUpTick] = useState(0);

  /**
   * Same split as the Schedule: an online class is edited here, an in-person
   * one is master data and goes to Master Records, Class selection.
   */
  const editClass = (c: AdminClass) => {
    setRoll(null);
    if (c.delivery === "online") {
      setEditing(c);
      return;
    }
    router.push("/admin/masters?tab=class-selection");
  };

  const shown = classes.filter((c) => {
    if (centre !== "All" && c.centre !== centre) return false;
    if (delivery !== "all" && c.delivery !== delivery) return false;
    const ql = q.trim().toLowerCase();
    return !ql || (c.name + " " + c.tutorName + " " + c.year).toLowerCase().includes(ql);
  });

  /**
   * The term a class's current run belongs to. A block carries its own; an
   * office-scheduled class carries it on its sessions. A seeded class has
   * never been given a run, so it has no end date until it is started.
   */
  const termOf = (cls: AdminClass) => {
    const id = blockMeta(cls.id)?.termId ?? scheduled.find((s) => s.courseId === cls.id && s.termId)?.termId;
    return TERMS.find((t) => t.id === id) ?? null;
  };

  /**
   * Every session a student was expected at, which is what their attendance is
   * measured against. A block splits its hour three ways and marks each slot
   * separately, so a block date becomes one row per subject the student takes.
   */
  const everySession = useMemo(() => allSessions(scheduled, requests), [scheduled, requests]);
  const sessionsForStudent = (name: string): ExpectedSession[] => {
    const inClass = classes.filter((c) => (classPatches[c.id]?.studentNames ?? rollNames(c)).includes(name));
    const ids = new Set(inClass.map((c) => c.id));
    const out: ExpectedSession[] = [];
    for (const sess of everySession) {
      if (!ids.has(sess.courseId) || sess.k > "2026-07-02") continue;
      const cls = inClass.find((c) => c.id === sess.courseId)!;
      const slots = slotsFor(sess.courseId).filter((sl) => sl.students.some((st) => st.name === name));
      if (slots.length > 0) {
        for (const sl of slots) out.push({ date: sess.k, className: cls.name, subject: sl.subject, key: sl.id + ":" + sess.k });
      } else {
        out.push({ date: sess.k, className: cls.name, key: sess.courseId + ":" + sess.k });
      }
    }
    return out;
  };

  const historyFor = (st: AdminStudent) => attendanceHistory(st.name, st.attendance, sessionsForStudent(st.name), attendance);
  const pctFor = (name: string) => {
    const st = allStudents().find((x) => x.name === name);
    return st ? summarise(historyFor(st)).pct : 100;
  };

  const centres = ["All", "Online", ...CENTRES];
  const seatsLeft = shown.reduce((n, c) => n + Math.max(0, c.capacity - c.students), 0);

  const pending = catchUpTick >= 0 ? pendingCatchUps() : [];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {canEdit && pending.length > 0 && (
        <div className="glass-card" style={{ gridColumn: "span 12", padding: "14px 18px", boxSizing: "border-box", border: "1px solid rgba(245,166,35,.4)", background: "rgba(245,166,35,.07)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>
            {pending.length === 1 ? "1 student wants to catch up" : pending.length + " students want to catch up"}
          </div>
          {pending.map((c) => (
            <div key={c.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderTop: "1px solid rgba(245,166,35,.25)" }}>
              <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{c.student}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg3)", marginTop: 2 }}>
                  {c.hostClass} · {displayDate(c.date)} at {c.time} · misses {c.homeClass}
                </span>
              </span>
              <span className="ev-wrap-cta" style={{ display: "flex", gap: 8, flex: "none" }}>
                <button
                  onClick={() => { setCatchUpStatus(c.id, "declined"); setCatchUpTick((n) => n + 1); }}
                  className="btn-ghost press ev-tap-h"
                  style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}
                >
                  Decline
                </button>
                <button
                  onClick={() => { setCatchUpStatus(c.id, "approved"); setCatchUpTick((n) => n + 1); showToast(c.student + " is in for " + displayDate(c.date)); }}
                  className="btn-primary press ev-tap-h"
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}
                >
                  Approve
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* The print role has no Schedule page, so without this it has no way to
          ask what runs on a given day - only a flat list of every class. */}
      <div className="glass-card" style={{ gridColumn: "span 7", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <MonthCalendar sessions={everySession} selected={day} onSelect={setDay} />
      </div>
      <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .04s backwards" }}>
        <DayList dayKey={day} sessions={everySession} />
      </div>

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .08s backwards" }}>
        <div className="ev-wrap-row" style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {/* The search must be allowed to SHRINK, or it holds its full width
              and pushes the button out through the side of the card. */}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by class, tutor or year" aria-label="Search classes" className="field ev-wrap-main" style={{ flex: "1 1 auto", minWidth: 0, height: 44, boxSizing: "border-box" }} />
          {canEdit && (
            <button onClick={() => setBuildingBlock(true)} className="btn-primary press ev-tap-h ev-wrap-cta" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, flex: "none" }}>
              New core block
            </button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <span>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>CENTRE</label>
            <select value={centre} onChange={(e) => setCentre(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Centre">
              {centres.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All centres" : c}
                </option>
              ))}
            </select>
          </span>
          <span>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>DELIVERY</label>
            <select value={delivery} onChange={(e) => setDelivery(e.target.value as typeof delivery)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Delivery">
              <option value="all">Online and in person</option>
              <option value="online">Online only</option>
              <option value="in_person">In person only</option>
            </select>
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 10 }}>
          {shown.length} class{shown.length === 1 ? "" : "es"} · {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} still available
        </div>
      </div>

      {shown.map((c, i) => {
        const pct = Math.min(100, Math.round((c.students / c.capacity) * 100));
        const tone = pct >= 100 ? "var(--danger-500)" : pct > 80 ? "var(--warn-500)" : "var(--success-500)";
        const cs = centreStyle(c.delivery === "online" ? "Online" : c.centre);
        return (
          <div key={c.id} className="glass-card" style={{ gridColumn: "span 4", padding: 0, boxSizing: "border-box", overflow: "hidden", display: "flex", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.06 + i * 0.03}s backwards` }}>
            <span style={{ flex: "none", width: 5, background: cs.colour }} />
            <div style={{ flex: 1, minWidth: 0, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{c.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>{c.sched}</span>
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: DELIVERY_META[c.delivery].color, background: DELIVERY_META[c.delivery].bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>
                  {DELIVERY_META[c.delivery].short}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "var(--fg3)", lineHeight: 1.6 }}>
                {c.tutorName}
                <br />
                {c.centre}
              </div>

              {/* A block is one class with consecutive slots, each with its own
                  subject, tutor and roster. */}
              {isBlock(c.id) && (
                <div style={{ marginTop: 10, borderRadius: 12, background: "rgba(0,157,255,.07)", padding: "9px 11px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: "var(--brand-600)", marginBottom: 5 }}>
                    RUNS AS A BLOCK - {slotsFor(c.id).length} SUBJECTS, ONE ROOM
                  </div>
                  {slotsFor(c.id).map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--fg3)", padding: "2px 0" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flex: "none" }} />
                      <span style={{ flex: 1, minWidth: 0 }}>{s.subject}</span>
                      <span style={{ color: "var(--fg4)" }}>{s.start} · {s.students.length} on roll</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: tone }}>
                    {c.students}/{c.capacity}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--fg4)" }}>enrolled</span>
                  <span className="ev-spacer-flex" style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: "var(--fg4)" }}>{c.capacity - c.students > 0 ? c.capacity - c.students + (c.capacity - c.students === 1 ? " seat left" : " seats left") : "Full"}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(0,32,63,.08)", overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", borderRadius: 3, background: tone, transition: "width .3s ease" }} />
                </div>
              </div>

              {/* A class repeats weekly and then stops, at the end of the term
                  it belongs to. Saying which date that is here is what turns
                  "it just runs" into something the office can plan around. */}
              {(() => {
                const t = termOf(c);
                const cover = reliefTick >= 0 ? reliefFor(c.id) : [];
                if (!t && cover.length === 0) return null;
                return (
                  <div style={{ fontSize: 10.5, color: "var(--fg4)", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(0,32,63,.07)" }}>
                    {t && <div>Runs weekly to {t.end} ({t.name})</div>}
                    {cover.map((r) => (
                      <div key={r.id} style={{ color: "var(--warn-700)", fontWeight: 700, marginTop: t ? 3 : 0 }}>
                        {r.tutor} covering {r.from === r.to ? displayDate(r.from) : displayDate(r.from) + " to " + displayDate(r.to)}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                <button onClick={() => setRoll(c)} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                  View the roll
                </button>
                {canEdit && (
                  <>
                  <button onClick={() => setRollingOver(c)} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                    Start next term
                  </button>
                  <button onClick={() => setRelieving(c)} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                    Relief
                  </button>
                  {isBlock(c.id) && (
                    <button onClick={() => setEnrolling(c.id)} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                      Who takes what
                    </button>
                  )}
                  <button onClick={() => editClass(c)} className="btn-ghost press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                    Edit
                  </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {enrolling && (
        <Modal onClose={() => setEnrolling(null)} labelledBy={"block-enrol-" + enrolling} panelStyle={{ width: "min(720px, calc(100vw - 32px))", maxHeight: "min(88vh, 820px)", overflowY: "auto" }}>
          <BlockEnrolment courseId={enrolling} onClose={() => setEnrolling(null)} />
        </Modal>
      )}

      {editing && (
        <ClassFormModal
          mode="edit"
          scope="class"
          subtitle={editing.year + " · online · changes apply every week"}
          excludeClassId={editing.id}
          initial={{
            title: editing.name,
            // "Thursdays 7:00pm" is one field holding two facts; the form asks
            // for the day and the time separately so both can be changed.
            day: WEEKDAYS.find((d) => editing.sched.startsWith(d)) ?? WEEKDAYS[3],
            start: to24(editing.sched),
            end: (() => {
              const [h, m] = to24(editing.sched).split(":").map(Number);
              const total = h * 60 + m + 60;
              return String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
            })(),
            tutors: editing.tutorName.split(",").map((t) => t.trim()).filter(Boolean),
            students: classPatches[editing.id]?.studentNames ?? rollNames(editing),
            link: classPatches[editing.id]?.link ?? "",
            capacity: editing.capacity,
          }}
          onClose={() => setEditing(null)}
          onSubmit={(v) => {
            // Anyone taken off the roll here has LEFT, and is recorded as such
            // rather than quietly disappearing along with their history.
            const was = classPatches[editing.id]?.studentNames ?? rollNames(editing);
            recordLeavers(editing.id, was.filter((n) => !v.students.includes(n)));
            v.students.forEach((n) => restoreLeaver(editing.id, n));
            patchClass(editing.id, {
              name: v.title,
              sched: v.day + " " + toDisplay(v.start),
              tutorName: v.tutors.join(", "),
              studentNames: v.students,
              students: v.students.length,
              capacity: v.capacity,
              link: v.link || undefined,
            });
          }}
        />
      )}

      {buildingBlock && (
        <NewBlockModal
          onClose={() => setBuildingBlock(false)}
          onCreate={(b) => {
            addBlock(b.courseId, { name: b.name, day: b.day, start: toDisplay(b.start), termId: b.termId }, b.slots.map((s) => ({ ...s, start: toDisplay(s.start), end: toDisplay(s.end) })));
            for (let i = 0; i < b.dates.length; i++) {
              addScheduledClass({
                k: b.dates[i],
                className: b.name,
                courseId: b.courseId,
                tutor: b.slots.map((s) => s.tutor).filter((t, j, a) => a.indexOf(t) === j).join(", "),
                centre: "Online",
                delivery: "online",
                time: toDisplay(b.start),
                students: b.students.length,
                durationMins: b.slots.length * 60,
                booklet: null,
                session: i + 1,
                termId: b.termId,
              });
            }
            setBuildingBlock(false);
          }}
        />
      )}

      {/* Sending one student a booklet, from the roll. The catalogue is the
          office's own list, so this is the same material a tutor would assign
          rather than a second library. */}
      {assigning && (
        <Modal onClose={() => setAssigning(null)} labelledBy="assign-title" panelStyle={{ width: "min(560px, calc(100vw - 32px))", maxHeight: "min(88vh, 760px)", overflowY: "auto" }}>
          <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span id="assign-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
                  Send a booklet to {assigning.student.name}
                </span>
                <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>{assigning.cls.name}</span>
              </span>
              <button onClick={() => setAssigning(null)} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
                <Icon path={IC.close} size={14} />
              </button>
            </div>
            <div style={{ marginTop: 14 }}>
              {CATALOGUE.filter((b) => !assigning.cls.year || b.year === assigning.cls.year).slice(0, 8).map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    showToast(b.name + " sent to " + assigning.student.name);
                    setAssigning(null);
                  }}
                  className="list-hover press"
                  style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 11, padding: "11px 10px", borderRadius: 12, border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", borderTop: "1px solid rgba(0,32,63,.06)" }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{b.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>{b.year} {b.subject} · {b.pages} pages</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Booking a catch-up FOR a student, rather than waiting for them to ask. */}
      {bookingCatchUp && (
        <CatchUpModal
          homeClass={bookingCatchUp.cls.name}
          missedLabel={"a session of " + bookingCatchUp.cls.name}
          options={classes
            .filter((c) => c.delivery === "online" && c.id !== bookingCatchUp.cls.id)
            .flatMap((c) => {
              const wd = WEEKDAYS.findIndex((d) => c.sched.startsWith(d));
              if (wd < 0) return [];
              const d = new Date("2026-07-02T12:00:00");
              while (d.getDay() !== (wd + 1) % 7) d.setDate(d.getDate() + 1);
              return [{
                hostClass: c.name,
                hostClassId: c.id,
                date: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"),
                dateLabel: d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }),
                time: c.sched.replace(WEEKDAYS[wd], "").trim(),
                tutor: c.tutorName,
                seatsLeft: Math.max(0, c.capacity - c.students),
              }];
            })
            .slice(0, 5)}
          onClose={() => setBookingCatchUp(null)}
          onRequest={(o) => {
            requestCatchUp({
              student: bookingCatchUp.student.name,
              homeClass: bookingCatchUp.cls.name,
              hostClass: o.hostClass,
              hostClassId: o.hostClassId,
              date: o.date,
              time: o.time,
            });
            // Arranged BY the office, so it does not queue for the office.
            const latest = pendingCatchUps().slice(-1)[0];
            if (latest) setCatchUpStatus(latest.id, "approved");
            setCatchUpTick((n) => n + 1);
            setBookingCatchUp(null);
            showToast(bookingCatchUp.student.name + " is in for " + o.hostClass);
          }}
        />
      )}

      {viewingStudent && (
        <StudentDetailModal
          student={viewingStudent}
          rows={historyFor(viewingStudent)}
          left={roll ? leaversFor(roll.id).find((l) => l.name === viewingStudent.name) : undefined}
          onClose={() => setViewingStudent(null)}
        />
      )}

      {relieving && (
        <ReliefModal
          cls={relieving}
          existing={reliefFor(relieving.id)}
          onClose={() => setRelieving(null)}
          onAdd={(r) => {
            addRelief({ classId: relieving.id, ...r });
            setReliefTick((n) => n + 1);
            setRelieving(null);
          }}
          onCancel={(id) => {
            cancelRelief(id);
            setReliefTick((n) => n + 1);
          }}
        />
      )}

      {rollingOver && (
        <RollOverModal
          cls={rollingOver}
          slots={slotsFor(rollingOver.id)}
          roster={classPatches[rollingOver.id]?.studentNames ?? rollNames(rollingOver)}
          terms={openTerms()}
          currentTermId={termOf(rollingOver)?.id}
          onClose={() => setRollingOver(null)}
          onRoll={(r) => {
            const slots = slotsFor(rollingOver.id);
            if (slots.length > 0) rollBlock(rollingOver.id, r.termId, r.slotRosters);
            else patchClass(rollingOver.id, { studentNames: r.students, students: r.students.length });
            const before = slots.length > 0 ? slots.flatMap((sl) => sl.students.map((x) => x.name)) : classPatches[rollingOver.id]?.studentNames ?? rollNames(rollingOver);
            recordLeavers(rollingOver.id, [...new Set(before)].filter((n) => !r.students.includes(n)));
            for (let i = 0; i < r.dates.length; i++) {
              addScheduledClass({
                k: r.dates[i],
                className: rollingOver.name,
                courseId: rollingOver.id,
                tutor: rollingOver.tutorName,
                centre: rollingOver.centre,
                delivery: rollingOver.delivery,
                time: rollingOver.sched.replace(r.day, "").trim(),
                students: r.students.length,
                durationMins: slots.length > 0 ? slots.length * 60 : undefined,
                booklet: rollingOver.delivery === "online" ? null : "not_requested",
                session: i + 1,
                termId: r.termId,
              });
            }
            setRollingOver(null);
          }}
        />
      )}

      {roll && (
        <Roll
          cls={roll}
          names={classPatches[roll.id]?.studentNames}
          onClose={() => setRoll(null)}
          onEdit={() => editClass(roll)}
          onOpenStudent={setViewingStudent}
          pctFor={pctFor}
          canEdit={canEdit}
          onAssign={(st) => setAssigning({ cls: roll, student: st })}
          onCatchUp={(st) => setBookingCatchUp({ cls: roll, student: st })}
          onRelief={() => { setRelieving(roll); setRoll(null); }}
        />
      )}
    </div>
  );
}
