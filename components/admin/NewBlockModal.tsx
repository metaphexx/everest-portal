// Setting up a core block, in one pass.
//
// A block used to be built the long way: schedule a class, tick "runs as a
// block", fill three slot rows, save, then go to another page to open the
// enrolment grid and say who takes what. Two screens and roughly a dozen
// decisions for something the office does the same way every term.
//
// This asks for the four things that actually vary - which year, which day,
// who teaches it, who is in it - and derives the rest. The subjects come from
// the year group, the slots chain off the start time, the run length comes
// from the term, and the enrolment grid is on the same screen, already ticked,
// so the common case (everyone takes everything) is zero extra clicks.

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { PeoplePicker, PickerOption } from "@/components/admin/PeoplePicker";
import { toDisplay } from "@/components/admin/ClassFormModal";
import { SUBJECTS, TERMS, YEAR_GROUPS } from "@/lib/admin-masters";
import { STAFF, allStudents } from "@/lib/admin-data";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
};

const DAYS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
const SLOT_COLOURS = ["#7A5AF8", "#0E9C8E", "#D68910", "#0E7AC2"];

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

/** The first date on or after a term's start that falls on the chosen day. */
function firstDate(day: string, termStart: string): Date {
  const d = new Date(termStart);
  const target = (DAYS.indexOf(day) + 1) % 7; // DAYS is Monday-first, getDay() is Sunday-first
  if (!Number.isNaN(d.getTime())) while (d.getDay() !== target) d.setDate(d.getDate() + 1);
  return d;
}

function isoDate(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>{label}</div>
      {children}
    </span>
  );
}

const fieldStyle = { width: "100%", height: 44, boxSizing: "border-box" as const };

export interface NewBlockResult {
  courseId: string;
  name: string;
  day: string;
  start: string;
  weeks: number;
  dates: string[];
  slots: { subject: string; start: string; end: string; tutor: string; students: string[] }[];
  students: string[];
}

export function NewBlockModal({ onClose, onCreate }: { onClose: () => void; onCreate: (r: NewBlockResult) => void }) {
  const groups = YEAR_GROUPS.filter((g) => g.active);
  const terms = TERMS.filter((t) => t.state !== "finished");

  const [year, setYear] = useState(groups[1]?.year ?? groups[0]?.year ?? "Year 8");
  const [day, setDay] = useState("Wednesdays");
  const [start, setStart] = useState("16:00");
  const [mins, setMins] = useState(60);
  const [termId, setTermId] = useState(terms[0]?.id ?? "");
  const [tutor, setTutor] = useState<string[]>([]);
  const [perSlot, setPerSlot] = useState<Record<number, string>>({});
  const [splitTutors, setSplitTutors] = useState(false);
  const [students, setStudents] = useState<string[]>([]);
  /** Who is OFF which slot. Empty means everyone takes everything, the common case. */
  const [off, setOff] = useState<Record<string, Set<number>>>({});

  const term = terms.find((t) => t.id === termId) ?? terms[0];
  const subjects = useMemo(() => SUBJECTS.filter((s) => s.year === year && s.active).map((s) => s.name), [year]);
  const roster = useMemo(() => allStudents(), []);

  const slots = subjects.map((subject, i) => ({
    subject,
    start: addMinutes(start, i * mins),
    end: addMinutes(start, (i + 1) * mins),
    tutor: (splitTutors ? perSlot[i] : undefined) ?? tutor[0] ?? "",
  }));

  const tutorOptions: PickerOption[] = STAFF.filter((t) => t.status === "active").map((t) => ({
    id: t.name,
    label: t.name,
    meta: t.centres.join(", "),
    initials: t.initials,
    colour: t.colour,
  }));
  // Students of the chosen year first: a Year 8 block is almost always built
  // out of Year 8 students, and scrolling past everyone else to find them is
  // the slowest part of filling this in.
  const studentOptions: PickerOption[] = [...roster]
    .sort((a, b) => Number(b.year === year) - Number(a.year === year) || a.name.localeCompare(b.name))
    .map((s) => ({ id: s.name, label: s.name, meta: s.year, initials: s.initials }));

  const takes = (student: string, i: number) => !off[student]?.has(i);
  const toggle = (student: string, i: number) =>
    setOff((o) => {
      const next = new Set(o[student] ?? []);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return { ...o, [student]: next };
    });

  const dates = useMemo(() => {
    if (!term) return [];
    const first = firstDate(day, term.start);
    return Array.from({ length: term.weeks }, (_, i) => {
      const d = new Date(first);
      d.setDate(d.getDate() + i * 7);
      return isoDate(d);
    });
  }, [day, term]);

  const name = year + " Core Block";
  const valid = subjects.length > 1 && tutor.length > 0 && students.length > 0 && !!term && (!splitTutors || slots.every((s) => s.tutor));

  const create = () => {
    if (!valid) return;
    onCreate({
      courseId: "blk" + Date.now().toString(36),
      name,
      day,
      start,
      weeks: term.weeks,
      dates,
      slots: slots.map((s, i) => ({ ...s, students: students.filter((st) => takes(st, i)) })),
      students,
    });
  };

  return (
    <Modal onClose={onClose} labelledBy="newblock-title" panelStyle={{ width: "min(760px, calc(100vw - 32px))", maxHeight: "min(92vh, 940px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="newblock-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              New core block
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>
              One room, one link, subjects back to back.
            </span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 16 }}>
          <Field label="YEAR GROUP">
            <select value={year} onChange={(e) => setYear(e.target.value)} className="field" style={fieldStyle} aria-label="Year group">
              {groups.map((g) => (
                <option key={g.id} value={g.year}>{g.year}</option>
              ))}
            </select>
          </Field>
          <Field label="DAY">
            <select value={day} onChange={(e) => setDay(e.target.value)} className="field" style={fieldStyle} aria-label="Day">
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="STARTS">
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="field" style={fieldStyle} aria-label="Start time" />
          </Field>
          <Field label="EACH SUBJECT">
            <select value={mins} onChange={(e) => setMins(Number(e.target.value))} className="field" style={fieldStyle} aria-label="Minutes per subject">
              {[45, 60, 75, 90].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </Field>
          <Field label="TERM">
            <select value={termId} onChange={(e) => setTermId(e.target.value)} className="field" style={fieldStyle} aria-label="Term">
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {subjects.length < 2 ? (
          <div style={{ marginTop: 14, borderRadius: 12, background: "rgba(245,166,35,.1)", padding: "11px 13px", fontSize: 12, color: "var(--warn-700)", lineHeight: 1.55 }}>
            {year} has {subjects.length === 1 ? "one subject" : "no subjects"} set up, so there is nothing to run back to back. Add its subjects in Master Records first.
          </div>
        ) : (
          <>
            <div style={{ marginTop: 16, border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, flex: 1, minWidth: 0 }}>
                  {name} · {day} {toDisplay(start)} to {toDisplay(slots[slots.length - 1].end)}
                </span>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--fg3)", cursor: "pointer", flex: "none" }}>
                  <input type="checkbox" checked={splitTutors} onChange={(e) => setSplitTutors(e.target.checked)} />
                  A different tutor per subject
                </label>
              </div>
              {slots.map((s, i) => (
                <div key={s.subject} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                  <span style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: SLOT_COLOURS[i % SLOT_COLOURS.length], flex: "none" }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700 }}>{s.subject}</span>
                  <span style={{ fontSize: 11.5, color: "var(--fg4)", flex: "none" }}>
                    {toDisplay(s.start)} to {toDisplay(s.end)}
                  </span>
                  {splitTutors && (
                    <select
                      value={perSlot[i] ?? tutor[0] ?? ""}
                      onChange={(e) => setPerSlot((p) => ({ ...p, [i]: e.target.value }))}
                      className="field"
                      style={{ height: 34, flex: "none", maxWidth: 160 }}
                      aria-label={s.subject + " tutor"}
                    >
                      <option value="">Pick a tutor</option>
                      {tutorOptions.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 14 }}>
              <PeoplePicker
                label="Tutor"
                required
                options={tutorOptions}
                value={tutor}
                onChange={(v) => setTutor(v.slice(-1))}
                placeholder="Who takes the block"
              />
              <PeoplePicker
                label="Students"
                required
                options={studentOptions}
                value={students}
                onChange={setStudents}
                placeholder="Who is in the block"
              />
            </div>

            {students.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 6 }}>WHO TAKES WHAT</div>
                <div className="ev-scroll-x">
                  <table style={{ width: "100%", minWidth: 420, borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>STUDENT</th>
                        {slots.map((s, i) => (
                          <th key={s.subject} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 800, color: SLOT_COLOURS[i % SLOT_COLOURS.length], whiteSpace: "nowrap" }}>
                            {s.subject}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st) => (
                        <tr key={st} className="list-hover">
                          <td style={{ padding: "7px 10px", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", borderTop: "1px solid rgba(0,32,63,.05)" }}>{st}</td>
                          {slots.map((s, i) => (
                            <td key={s.subject} style={{ padding: "7px 10px", textAlign: "center", borderTop: "1px solid rgba(0,32,63,.05)" }}>
                              <button
                                onClick={() => toggle(st, i)}
                                aria-pressed={takes(st, i)}
                                aria-label={(takes(st, i) ? "Remove " : "Enrol ") + st + " " + (takes(st, i) ? "from " : "in ") + s.subject}
                                className="press"
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: takes(st, i) ? "none" : "1.5px solid rgba(0,32,63,.16)",
                                  background: takes(st, i) ? SLOT_COLOURS[i % SLOT_COLOURS.length] : "transparent",
                                  color: "#fff",
                                }}
                              >
                                {takes(st, i) && <Icon path={IC.tick} size={13} />}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={create}
            disabled={!valid}
            className="btn-primary press ev-tap-h"
            style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}
          >
            {term ? "Create block · " + term.weeks + " " + day : "Create block"}
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
            Cancel
          </button>
          {!valid && subjects.length > 1 && (
            <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{tutor.length === 0 ? "Pick a tutor." : students.length === 0 ? "Pick the students." : "Every subject needs a tutor."}</span>
          )}
        </div>
      </div>
    </Modal>
  );
}
