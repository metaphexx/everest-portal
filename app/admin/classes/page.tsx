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
import { AdminClass, CENTRES, allClasses, allStudents } from "@/lib/admin-data";
import { DELIVERY_META } from "@/lib/tutor-data";
import { centreStyle } from "@/lib/admin-schedule";
import { BlockEnrolment } from "@/components/admin/BlockEnrolment";
import { isBlock, slotsFor } from "@/lib/block";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
};

/** The seeded roll for a class, by name. */
export function rollNames(cls: AdminClass): string[] {
  return allStudents().filter((s) => s.classNames.includes(cls.name)).map((s) => s.name);
}

function Roll({ cls, names, onClose, onEdit }: { cls: AdminClass; names?: string[]; onClose: () => void; onEdit: () => void }) {
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
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{s.name}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                {s.parent} · {s.parentPhone}
              </span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.attendance < 80 ? "var(--warn-700)" : "var(--fg3)", flex: "none" }}>{s.attendance}%</span>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          <button onClick={onEdit} className="btn-primary press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700 }}>
            Edit this class
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminClasses() {
  const { notWired, classPatches, patchClass } = useAdmin();
  const router = useRouter();
  // The Admin (print) role reads this page for copy counts. The roll carries
  // parent phone numbers and Edit changes enrolments - neither is its job.
  const canEdit = useRole() === "office";
  // Office edits sit over the seed records, so a changed tutor or time shows
  // here, on the roll, and in the seats-left count without touching the seed.
  const classes = useMemo(() => allClasses().map((c) => ({ ...c, ...classPatches[c.id] })), [classPatches]);
  const [centre, setCentre] = useState("All");
  const [delivery, setDelivery] = useState<"all" | "online" | "in_person">("all");
  const [q, setQ] = useState("");
  const [roll, setRoll] = useState<AdminClass | null>(null);
  const [editing, setEditing] = useState<AdminClass | null>(null);
  // The block whose enrolment grid is open. It opens from the block's own
  // card (like the roll does) rather than rendering after every other card.
  const [enrolling, setEnrolling] = useState<string | null>(null);

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

  const centres = ["All", "Online", ...CENTRES];
  const seatsLeft = shown.reduce((n, c) => n + Math.max(0, c.capacity - c.students), 0);

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by class, tutor or year" aria-label="Search classes" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box", marginBottom: 12 }} />
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

              {canEdit && (
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <button onClick={() => setRoll(c)} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                    View the roll
                  </button>
                  {isBlock(c.id) && (
                    <button onClick={() => setEnrolling(c.id)} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                      Who takes what
                    </button>
                  )}
                  <button onClick={() => editClass(c)} className="btn-ghost press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                    Edit
                  </button>
                </div>
              )}
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
          }}
          onClose={() => setEditing(null)}
          onSubmit={(v) =>
            patchClass(editing.id, {
              name: v.title,
              sched: v.day + " " + toDisplay(v.start),
              tutorName: v.tutors.join(", "),
              studentNames: v.students,
              students: v.students.length,
              link: v.link || undefined,
            })
          }
        />
      )}

      {roll && (
        <Roll
          cls={roll}
          names={classPatches[roll.id]?.studentNames}
          onClose={() => setRoll(null)}
          onEdit={() => editClass(roll)}
        />
      )}
    </div>
  );
}
