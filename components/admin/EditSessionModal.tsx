// Edit one dated online class.
//
// Same form shape and the same words as scheduling a class, because they are
// the same event - one asks for it, the other corrects it. The live system's
// version is a single wall of eighteen controls (course, subject, sub-type,
// tutor, students, booklets, lesson, study notes, reference notes, worksheets,
// two upload wells, a link, a note) with no grouping, so the four fields an
// office actually changes are lost in it. Here it is four groups in the order
// you would say them out loud: what it is, when it runs, who takes it, and what
// goes out with it.
//
// This edits ONE session. In-person classes are not edited here at all: what
// changes about them is the room and the tutor allocation, which lives in
// Master Records, so the Schedule sends you there instead.

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { AdminSession, SessionPatch, centreStyle } from "@/lib/admin-schedule";
import { STAFF } from "@/lib/admin-data";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  link: "M3.9 12a5 5 0 0 1 5-5h3v1.9h-3a3.1 3.1 0 0 0 0 6.2h3V17h-3a5 5 0 0 1-5-5Zm5.1 1h6v-2H9v2Zm6.1-6h-3v1.9h3a3.1 3.1 0 0 1 0 6.2h-3V17h3a5 5 0 0 0 0-10Z",
};

const MATERIALS = ["Booklet", "Worksheet", "Lesson slides", "Study notes", "Reference notes"];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: "var(--danger-500)" }}> *</span>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children, cols = "repeat(auto-fit,minmax(160px,1fr))" }: { children: React.ReactNode; cols?: string }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12 }}>{children}</div>;
}

/** "7:00pm" -> "19:00" for the time inputs. */
function to24(display: string): string {
  const m = display.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return "16:00";
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return String(h).padStart(2, "0") + ":" + m[2];
}

function toDisplay(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ":" + String(m).padStart(2, "0") + ap;
}

export function EditSessionModal({
  session,
  patch,
  onClose,
  onSave,
}: {
  session: AdminSession;
  /** What the office has already changed about this session. */
  patch?: SessionPatch;
  onClose: () => void;
  onSave: (id: string, patch: SessionPatch) => void;
}) {
  const s = session;
  const [title, setTitle] = useState(s.className);
  const [day, setDay] = useState(s.k);
  const [start, setStart] = useState(to24(s.time));
  const [end, setEnd] = useState(() => {
    const [h, m] = to24(s.time).split(":").map(Number);
    const total = h * 60 + m + (s.durationMins ?? 60);
    return String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
  });
  const [tutor, setTutor] = useState(s.tutor);
  const [students, setStudents] = useState(s.students);
  const [link, setLink] = useState(patch?.link ?? "");
  const [materials, setMaterials] = useState<string[]>(patch?.materials ?? []);
  const [notes, setNotes] = useState(patch?.notes ?? "");

  const cs = centreStyle("Online");
  const eligible = STAFF.filter((t) => t.duties === "both" || t.duties === "online");

  const mins = (() => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  })();

  const valid = title.trim().length > 0 && mins > 0;

  const save = () => {
    if (!valid) return;
    onSave(s.id, {
      className: title.trim(),
      k: day,
      time: toDisplay(start),
      tutor,
      students,
      durationMins: mins,
      link: link.trim() || undefined,
      materials,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const toggle = (m: string) => setMaterials((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]));

  return (
    <Modal onClose={onClose} labelledBy="editses-title" panelStyle={{ width: "min(640px, calc(100vw - 32px))", maxHeight: "min(90vh, 880px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ flex: "none", width: 5, alignSelf: "stretch", borderRadius: 3, background: cs.colour }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="editses-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              Edit this class
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>
              Changes apply to this session only, not to every week.
            </span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        <Group title="WHAT IT IS">
          <Row cols="1fr">
            <span>
              <Label required>Class title</Label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
            </span>
          </Row>
        </Group>

        <Group title="WHEN IT RUNS">
          <Row>
            <span>
              <Label required>Date</Label>
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
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
        </Group>

        <Group title="WHO TAKES IT">
          <Row>
            <span>
              <Label required>Tutor</Label>
              <select value={tutor} onChange={(e) => setTutor(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Tutor">
                {[...new Set([tutor, ...eligible.map((t) => t.name)])].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 4 }}>Only tutors granted online duties are listed.</span>
            </span>
            <span>
              <Label>Students enrolled</Label>
              <input type="number" min={1} max={40} value={students} onChange={(e) => setStudents(Number(e.target.value))} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            </span>
          </Row>
        </Group>

        <Group title="WHAT GOES OUT WITH IT">
          <Row cols="1fr">
            <span>
              <Label>Conferencing link</Label>
              <span className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 13px", height: 44 }}>
                <Icon path={IC.link} size={14} style={{ color: "var(--fg4)", flex: "none" }} />
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste the meeting link" aria-label="Conferencing link" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, height: "100%" }} />
              </span>
            </span>
          </Row>

          <div style={{ marginTop: 12 }}>
            <Label>Material to hand out</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {MATERIALS.map((m) => {
                const on = materials.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => toggle(m)}
                    aria-pressed={on}
                    className="press ev-tap-h"
                    style={{ height: 34, padding: "0 13px", borderRadius: 980, border: on ? "1.5px solid var(--accent-teal)" : "1.5px solid rgba(0,32,63,.1)", background: on ? "rgba(14,156,142,.1)" : "rgba(255,255,255,.75)", color: on ? "var(--accent-teal)" : "var(--fg3)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 7, lineHeight: 1.5 }}>
              Students see it in their library when the class starts.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <Label>Notes for the tutor</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" aria-label="Notes for the tutor" className="field" style={{ width: "100%", minHeight: 66, boxSizing: "border-box", padding: "10px 12px", resize: "vertical" }} />
          </div>
        </Group>

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={save} disabled={!valid} className="btn-primary press ev-tap-h" style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
            Save changes
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
            Cancel
          </button>
          {!valid && <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{title.trim() ? "Check the start and end times." : "Give the class a title."}</span>}
        </div>
      </div>
    </Modal>
  );
}
