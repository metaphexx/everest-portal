// One panel for an online class, whether you are creating it or changing it.
//
// Scheduling a class and editing one ask the same questions, so they are the
// same form - only the title and the button change. Two forms meant the edit
// panel drifted into a different, smaller set of fields (a tutor, a free-text
// "Thursdays 7:00pm" box and a seat count), so the office could create a class
// properly but not correct it.
//
// ONLINE ONLY, on purpose. An in-person class is a room, a centre and a tutor
// allocation - master data - so it is set up in Master Records, not here.
//
// Two scopes, because the office edits two different things:
//   SESSION - one dated lesson. Moving next Thursday does not move every
//             Thursday, so it asks for a date.
//   CLASS   - the recurring class. It runs on a weekday, so it asks for one.
//
// There is no seat counter and no material picker. Choosing the students gives
// the count, and a number nobody can check is not a roster; handing out work is
// the tutor's job, done from their portal against the class this creates.

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { COURSES } from "@/lib/admin-masters";
import { STAFF, allStudents } from "@/lib/admin-data";
import { MeetLinkField } from "@/components/admin/MeetLinkField";
import { PeoplePicker, PickerOption } from "@/components/admin/PeoplePicker";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z",
};

export const WEEKDAYS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];

/** What the form collects. The caller decides what to do with it. */
export interface ClassFormValues {
  title: string;
  course: string;
  subject: string;
  /** Scope "session": a yyyy-mm-dd date. Scope "class": a weekday, e.g. "Thursdays". */
  day: string;
  start: string;
  end: string;
  durationMins: number;
  repeat: "once" | "weekly";
  weeks: number;
  tutors: string[];
  students: string[];
  link: string;
  notes: string;
}

export interface ClassFormInitial extends Partial<Omit<ClassFormValues, "tutors" | "students">> {
  tutors?: string[];
  students?: string[];
}

function Row({ children, cols = "repeat(auto-fit,minmax(170px,1fr))" }: { children: React.ReactNode; cols?: string }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, marginTop: 12 }}>{children}</div>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: "var(--danger-500)" }}> *</span>}
    </div>
  );
}

/** "7:00pm" -> "19:00" for a time input. */
export function to24(display: string): string {
  const m = display.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return "16:00";
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return String(h).padStart(2, "0") + ":" + m[2];
}

export function toDisplay(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ":" + String(m).padStart(2, "0") + ap;
}

export function ClassFormModal({
  mode,
  scope,
  initial,
  subtitle,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  scope: "session" | "class";
  initial?: ClassFormInitial;
  /** A line under the title, e.g. which class or which date is being changed. */
  subtitle?: string;
  onClose: () => void;
  onSubmit: (v: ClassFormValues) => void;
}) {
  const firstCourse = COURSES.find((c) => c.active) ?? COURSES[0];
  const [title, setTitle] = useState(initial?.title ?? "");
  const [course, setCourse] = useState(initial?.course ?? firstCourse.name);
  const [subject, setSubject] = useState(initial?.subject ?? firstCourse.subjects[0]);
  const [tutors, setTutors] = useState<string[]>(initial?.tutors ?? []);
  const [students, setStudents] = useState<string[]>(initial?.students ?? []);
  const [day, setDay] = useState(initial?.day ?? (scope === "class" ? WEEKDAYS[3] : "2026-07-09"));
  const [start, setStart] = useState(initial?.start ?? "16:00");
  const [end, setEnd] = useState(initial?.end ?? "17:00");
  const [repeat, setRepeat] = useState<"once" | "weekly">(initial?.repeat ?? "once");
  const [weeks, setWeeks] = useState(initial?.weeks ?? 8);
  const [link, setLink] = useState(initial?.link ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  // A course with more than one subject can run as a block: one room, one link,
  // consecutive slots each with its own subject, tutor and roster.
  const [asBlock, setAsBlock] = useState(false);
  const [slotRows, setSlotRows] = useState<{ subject: string; start: string; end: string; tutor: string }[]>([]);

  const courseDef = useMemo(() => COURSES.find((c) => c.name === course), [course]);

  const tutorOptions: PickerOption[] = useMemo(() => {
    const eligible = STAFF.filter((s) => s.duties === "both" || s.duties === "online").map((s) => ({
      id: s.name,
      label: s.name,
      meta: s.status === "on_leave" ? "On leave" : s.role,
      initials: s.initials,
      colour: s.colour,
    }));
    // Whoever is already on the class stays selectable even if their duties
    // have since changed - the alternative is silently dropping them on save.
    const known = new Set(eligible.map((e) => e.id));
    const extra = (initial?.tutors ?? [])
      .filter((t) => t && !known.has(t))
      .map((t) => ({ id: t, label: t, meta: "Already on this class", initials: t.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() }));
    return [...eligible, ...extra];
  }, [initial?.tutors]);

  const studentOptions: PickerOption[] = useMemo(
    () => allStudents().map((s) => ({ id: s.name, label: s.name, meta: s.year + " · " + s.classNames.join(", "), initials: s.initials })),
    []
  );

  const mins = (() => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  })();

  // A new class must have somewhere to meet. An existing one already runs, and
  // the seeded classes predate the link field, so requiring it on edit would
  // block changing a time until someone made a room they may not want.
  const needsLink = mode === "create";
  const valid = title.trim().length > 0 && tutors.length > 0 && mins > 0 && (!needsLink || link.trim().length > 0);

  const why = !title.trim()
    ? "Give the class a title."
    : tutors.length === 0
      ? "Choose at least one tutor."
      : mins <= 0
        ? "Check the start and end times."
        : needsLink && !link.trim()
          ? "Create a Meet link for the class."
          : "";

  const submit = () => {
    if (!valid) return;
    onSubmit({ title: title.trim(), course, subject, day, start, end, durationMins: mins, repeat, weeks, tutors, students, link: link.trim(), notes: notes.trim() });
    onClose();
  };

  const cta = mode === "create" ? (repeat === "weekly" ? "Schedule " + weeks + " classes" : "Schedule the class") : "Save changes";

  return (
    <Modal onClose={onClose} labelledBy="classform-title" panelStyle={{ width: "min(680px, calc(100vw - 32px))", maxHeight: "min(90vh, 900px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="classform-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              {mode === "create" ? "Schedule an online class" : "Edit this online class"}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>
              {subtitle ?? "Who is in it, when it runs, and where they meet."}
            </span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        {/* Where the other kind of class comes from, so its absence here reads
            as a decision rather than a missing feature. */}
        {mode === "create" && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 12, background: "rgba(0,157,255,.07)", padding: "10px 12px", marginTop: 12 }}>
            <Icon path={IC.info} size={15} style={{ color: "var(--brand-600)", flex: "none", marginTop: 1 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.5 }}>
              In-person classes are set up in Master Records, where the room and the tutor allocation for each centre live.
            </span>
          </div>
        )}

        <Row cols="1fr">
          <span>
            <Label required>Class title</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Year 9 Science - Forces revision" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
        </Row>

        <Row>
          <span>
            <Label required>Course</Label>
            <select
              value={course}
              onChange={(e) => {
                setCourse(e.target.value);
                const next = COURSES.find((c) => c.name === e.target.value);
                setSubject(next?.subjects[0] ?? "");
                setAsBlock(false);
              }}
              className="field"
              style={{ width: "100%", height: 44, boxSizing: "border-box" }}
              aria-label="Course"
            >
              {COURSES.filter((c) => c.active || c.name === course).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </span>
          <span>
            <Label required>Subject</Label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Subject" disabled={asBlock}>
              {(courseDef?.subjects ?? [subject]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 4 }}>
              {asBlock ? "A block carries a subject per slot, set below." : "The subjects this course covers."}
            </span>
          </span>
        </Row>

        <Row>
          <span>
            <Label required>{scope === "class" ? "Runs on" : "Date"}</Label>
            {scope === "class" ? (
              <select value={day} onChange={(e) => setDay(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Day of the week">
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            ) : (
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            )}
          </span>
          <span>
            <Label required>Starts</Label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
          <span>
            <Label required>Ends</Label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            <span style={{ display: "block", fontSize: 11, color: mins > 0 ? "var(--fg4)" : "var(--danger-500)", marginTop: 4 }}>
              {mins > 0 ? Math.floor(mins / 60) + "h " + (mins % 60) + "m" : "End time is before the start"}
            </span>
          </span>
        </Row>

        {/* Repeating only makes sense when creating dated sessions - a class is
            already the recurring thing. */}
        {mode === "create" && scope === "session" && (
          <Row>
            <span>
              <Label>Repeats</Label>
              <select value={repeat} onChange={(e) => setRepeat(e.target.value as typeof repeat)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Repeat">
                <option value="once">Just this once</option>
                <option value="weekly">Every week</option>
              </select>
            </span>
            {repeat === "weekly" && (
              <span>
                <Label>For how many weeks</Label>
                <input type="number" min={2} max={20} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
              </span>
            )}
          </Row>
        )}

        <Row cols="1fr">
          <PeoplePicker
            label="Tutors"
            required
            options={tutorOptions}
            value={tutors}
            onChange={setTutors}
            placeholder="Choose who takes this class"
            emptyHint="Only tutors granted online duties are listed. More than one can take a class."
          />
        </Row>

        <Row cols="1fr">
          <PeoplePicker
            label="Students"
            options={studentOptions}
            value={students}
            onChange={setStudents}
            placeholder="Add the students in this class"
            emptyHint="Add them here and the roll, the class size and the seats left all follow from it."
          />
        </Row>

        <div style={{ marginTop: 12 }}>
          <MeetLinkField value={link} onChange={setLink} required={needsLink} />
        </div>

        {/* ---- block ---- */}
        {mode === "create" && (courseDef?.subjects.length ?? 0) > 1 && (
          <div style={{ marginTop: 16, border: "1px solid rgba(0,32,63,.1)", borderRadius: 14, padding: "13px 14px", background: "rgba(255,255,255,.6)" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={asBlock}
                onChange={(e) => {
                  const on = e.target.checked;
                  setAsBlock(on);
                  if (on && courseDef) {
                    // Seed one slot per subject, back to back from the start time.
                    const [h, m] = start.split(":").map(Number);
                    setSlotRows(
                      courseDef.subjects.map((sub, i) => ({
                        subject: sub,
                        start: String(h + i).padStart(2, "0") + ":" + String(m).padStart(2, "0"),
                        end: String(h + i + 1).padStart(2, "0") + ":" + String(m).padStart(2, "0"),
                        tutor: tutors[0] ?? tutorOptions[0]?.id ?? "",
                      }))
                    );
                  }
                }}
                style={{ marginTop: 2, flex: "none" }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>This runs as a block</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--fg3)", marginTop: 3, lineHeight: 1.5 }}>
                  {courseDef?.subjects.join(", ")} back to back in one room. One link, one recording - students join once and
                  stay for their own subjects. Each slot keeps its own roster, so a student can take one, two or all of them.
                </span>
              </span>
            </label>

            {asBlock && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,32,63,.07)" }}>
                {slotRows.map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr 1.2fr", gap: 8, marginBottom: 8 }}>
                    <input value={r.subject} onChange={(e) => setSlotRows((rs) => rs.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))} className="field" style={{ height: 38 }} aria-label={"Slot " + (i + 1) + " subject"} />
                    <input type="time" value={r.start} onChange={(e) => setSlotRows((rs) => rs.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className="field" style={{ height: 38 }} aria-label={"Slot " + (i + 1) + " start"} />
                    <input type="time" value={r.end} onChange={(e) => setSlotRows((rs) => rs.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className="field" style={{ height: 38 }} aria-label={"Slot " + (i + 1) + " end"} />
                    <select value={r.tutor} onChange={(e) => setSlotRows((rs) => rs.map((x, j) => (j === i ? { ...x, tutor: e.target.value } : x)))} className="field" style={{ height: 38 }} aria-label={"Slot " + (i + 1) + " tutor"}>
                      {tutorOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "var(--fg4)", lineHeight: 1.55, marginTop: 6 }}>
                  The tutor can differ per slot - the link belongs to the class, not to a person, so a handover does not
                  end the call. Enrol students into individual subjects from Classes once the block is saved.
                </div>
              </div>
            )}
          </div>
        )}

        <Row cols="1fr">
          <span>
            <Label>Notes for the tutor</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="field" style={{ width: "100%", minHeight: 66, boxSizing: "border-box", padding: "10px 12px", resize: "vertical" }} />
          </span>
        </Row>

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={submit} disabled={!valid} className="btn-primary press ev-tap-h" style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
            {cta}
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
            Cancel
          </button>
          {!valid && <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{why}</span>}
        </div>
      </div>
    </Modal>
  );
}
