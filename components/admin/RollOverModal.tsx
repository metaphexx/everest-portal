// Starting a class up again for the next term.
//
// A class repeats weekly and then stops at the end of its term, which means
// every term the office has to restart the ones that are continuing. The thing
// that actually changes between terms is WHO IS COMING BACK - not the day, not
// the tutor, not the subjects. So that is the only question this asks.
//
// Everyone is ticked to start with, because most of a class continues. Untick
// the ones who are not returning. For a block the ticks are per subject, since
// a student dropping English but staying for Maths and Science is the normal
// shape of a new term rather than an edge case.

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { BlockSession } from "@/lib/tutor-data";
import { AdminClass } from "@/lib/admin-data";
import { Term } from "@/lib/admin-masters";
import { dayOfSched, termDates } from "@/lib/admin-schedule";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
};

export interface RollOverResult {
  termId: string;
  day: string;
  dates: string[];
  /** One roster per slot, in slot order. Empty for a class that is not a block. */
  slotRosters: string[][];
  /** Everyone continuing, across all slots. */
  students: string[];
}

export function RollOverModal({
  cls,
  slots,
  roster,
  terms,
  currentTermId,
  onClose,
  onRoll,
}: {
  cls: AdminClass;
  /** The block's slots, or empty for an ordinary class. */
  slots: BlockSession[];
  /** Who is in it now, for an ordinary class. */
  roster: string[];
  /** Terms it can be started in. */
  terms: Term[];
  /** The term it is running in now, so the picker can open on the next one. */
  currentTermId?: string;
  onClose: () => void;
  onRoll: (r: RollOverResult) => void;
}) {
  const isBlock = slots.length > 0;
  const day = dayOfSched(cls.sched);

  // Everyone currently in the class, and which slots each of them is on.
  const people = useMemo(() => {
    if (!isBlock) return roster;
    const seen: string[] = [];
    for (const s of slots) for (const st of s.students) if (!seen.includes(st.name)) seen.push(st.name);
    return seen;
  }, [isBlock, slots, roster]);

  // Open on the term it is NOT already running in - restarting a class means
  // the next one, not the one just finishing.
  const [termId, setTermId] = useState(
    (terms.find((t) => t.id !== currentTermId && t.state === "upcoming") ?? terms.find((t) => t.id !== currentTermId) ?? terms[0])?.id ?? ""
  );
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [dropped, setDropped] = useState<Record<string, Set<number>>>({});

  const term = terms.find((t) => t.id === termId) ?? terms[0];
  const dates = useMemo(() => (term ? termDates(day, term) : []), [day, term]);

  const staying = people.filter((p) => !leaving.has(p));
  const takes = (person: string, i: number) =>
    !leaving.has(person) && !dropped[person]?.has(i) && slots[i].students.some((s) => s.name === person);

  const togglePerson = (person: string) =>
    setLeaving((l) => {
      const next = new Set(l);
      if (next.has(person)) next.delete(person);
      else next.add(person);
      return next;
    });

  const toggleSlot = (person: string, i: number) =>
    setDropped((d) => {
      const next = new Set(d[person] ?? []);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return { ...d, [person]: next };
    });

  const slotRosters = slots.map((_, i) => people.filter((p) => takes(p, i)));
  const valid = !!term && dates.length > 0 && staying.length > 0;

  const roll = () => {
    if (!valid) return;
    onRoll({ termId: term.id, day, dates, slotRosters, students: staying });
  };

  return (
    <Modal onClose={onClose} labelledBy="rollover-title" panelStyle={{ width: "min(680px, calc(100vw - 32px))", maxHeight: "min(92vh, 900px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="rollover-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              Start {cls.name} again
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>
              {day} {cls.sched.replace(day, "").trim()} · {cls.tutorName}
            </span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 16 }}>
          <span>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>TERM</div>
            <select value={termId} onChange={(e) => setTermId(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Term">
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </span>
          <span>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>RUNS</div>
            <div className="glass-control" style={{ display: "flex", alignItems: "center", height: 44, borderRadius: 12, padding: "0 13px", fontSize: 12.5, color: "var(--fg2)" }}>
              {term ? dates.length + " " + day + ", to " + term.end : "No dates"}
            </div>
          </span>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", margin: "16px 0 6px" }}>
          WHO IS COMING BACK
        </div>

        {people.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", lineHeight: 1.55 }}>Nobody is on this class yet, so there is no roster to carry over.</div>
        ) : isBlock ? (
          <div className="ev-scroll-x">
            <table style={{ width: "100%", minWidth: 420, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>STUDENT</th>
                  {slots.map((s) => (
                    <th key={s.id} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 800, color: s.color, whiteSpace: "nowrap" }}>{s.subject}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p} className="list-hover">
                    <td style={{ padding: "7px 10px", borderTop: "1px solid rgba(0,32,63,.05)", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => togglePerson(p)}
                        aria-pressed={!leaving.has(p)}
                        className="press"
                        style={{ border: "none", background: "none", padding: 0, font: "inherit", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: leaving.has(p) ? "var(--fg4)" : "var(--fg1)", textDecoration: leaving.has(p) ? "line-through" : "none" }}
                      >
                        {p}
                      </button>
                    </td>
                    {slots.map((s, i) => (
                      <td key={s.id} style={{ padding: "7px 10px", textAlign: "center", borderTop: "1px solid rgba(0,32,63,.05)" }}>
                        <button
                          onClick={() => toggleSlot(p, i)}
                          disabled={leaving.has(p) || !s.students.some((x) => x.name === p)}
                          aria-pressed={takes(p, i)}
                          aria-label={(takes(p, i) ? "Remove " : "Keep ") + p + " in " + s.subject}
                          className="press"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            cursor: leaving.has(p) ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: s.students.some((x) => x.name === p) ? 1 : 0.25,
                            border: takes(p, i) ? "none" : "1.5px solid rgba(0,32,63,.16)",
                            background: takes(p, i) ? s.color : "transparent",
                            color: "#fff",
                          }}
                        >
                          {takes(p, i) && <Icon path={IC.tick} size={13} />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {people.map((p) => {
              const on = !leaving.has(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePerson(p)}
                  aria-pressed={on}
                  className="press"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    height: 34,
                    padding: "0 13px",
                    borderRadius: 980,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 700,
                    border: on ? "none" : "1.5px solid rgba(0,32,63,.14)",
                    background: on ? "var(--accent-teal)" : "transparent",
                    color: on ? "#fff" : "var(--fg4)",
                  }}
                >
                  {on && <Icon path={IC.tick} size={12} />}
                  {p}
                </button>
              );
            })}
          </div>
        )}

        {leaving.size > 0 && (
          <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 10 }}>
            {leaving.size} not continuing. They keep their past work and stay on last term's records.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={roll}
            disabled={!valid}
            className="btn-primary press ev-tap-h"
            style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}
          >
            {term ? "Start " + term.name + " · " + staying.length + " students" : "Start next term"}
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
            Cancel
          </button>
          {!valid && <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{staying.length === 0 ? "Nobody is coming back." : "Pick a term."}</span>}
        </div>
      </div>
    </Modal>
  );
}
