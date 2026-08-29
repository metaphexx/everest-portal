// Edit a class.
//
// Deliberately smaller than the schedule form: the things an office actually
// changes on a running class are its tutor, its time, its room or link, and
// its capacity. Changing WHAT the class is (year, subject, delivery) is a new
// class, not an edit - a Tuesday Year 8 Maths that becomes Thursday Year 11
// Chemistry is a different class wearing the same id, and every roll, request
// and attendance record attached to it would silently change meaning.

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { AdminClass, STAFF } from "@/lib/admin-data";
import { centreStyle } from "@/lib/admin-schedule";
import { CENTRES_M } from "@/lib/admin-masters";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
};

export interface ClassPatch {
  tutorName?: string;
  centre?: string;
  sched?: string;
  capacity?: number;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>{children}</span>;
}

export function EditClassModal({ cls, onClose, onSave }: { cls: AdminClass; onClose: () => void; onSave: (id: string, patch: ClassPatch) => void }) {
  const [tutorName, setTutorName] = useState(cls.tutorName);
  const [centre, setCentre] = useState(cls.centre);
  const [sched, setSched] = useState(cls.sched);
  const [capacity, setCapacity] = useState(cls.capacity);
  const online = cls.delivery === "online";
  const cs = centreStyle(online ? "Online" : centre);

  // Fewer seats than students is not saveable: the roll does not shrink to fit
  // the number, and silently accepting it would make every "seats left" figure
  // on the Classes page a lie.
  const overfull = capacity < cls.students;

  const save = () => {
    if (overfull) return;
    const patch: ClassPatch = {};
    if (tutorName !== cls.tutorName) patch.tutorName = tutorName;
    if (centre !== cls.centre) patch.centre = centre;
    if (sched !== cls.sched) patch.sched = sched;
    if (capacity !== cls.capacity) patch.capacity = capacity;
    onSave(cls.id, patch);
    onClose();
  };

  return (
    <Modal onClose={onClose} labelledBy="editcls-title" panelStyle={{ width: "min(480px, calc(100vw - 32px))", maxHeight: "min(88vh, 720px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ flex: "none", width: 5, alignSelf: "stretch", borderRadius: 3, background: cs.colour }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="editcls-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              Edit {cls.name}
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>
              {cls.year} · {online ? "Online" : "In person"} · {cls.students} on the roll
            </span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 16 }}>
          <span>
            <Label>Tutor</Label>
            <select value={tutorName} onChange={(e) => setTutorName(e.target.value)} aria-label="Tutor" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
              {STAFF.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </span>
          {!online && (
            <span>
              <Label>Centre</Label>
              <select value={centre} onChange={(e) => setCentre(e.target.value)} aria-label="Centre" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
                {CENTRES_M.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 12 }}>
          <span>
            <Label>Schedule</Label>
            <input value={sched} onChange={(e) => setSched(e.target.value)} aria-label="Schedule" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} placeholder="e.g. Thursdays 7:00pm" />
          </span>
          <span>
            <Label>Seats</Label>
            <input type="number" min={1} max={40} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} aria-label="Seats" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            {overfull && (
              <span style={{ display: "block", fontSize: 11, color: "var(--danger-500)", marginTop: 5, lineHeight: 1.45 }}>
                {cls.students} students are already on the roll - move them before shrinking the class below that.
              </span>
            )}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          <button onClick={save} disabled={overfull} className="btn-primary press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, opacity: overfull ? 0.5 : 1 }}>
            Save changes
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
