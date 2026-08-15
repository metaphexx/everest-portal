// Schedule a class.
//
// One form for both kinds of class, because they are the same event with
// different consequences, and a portal with two nearly identical "add class"
// forms is a portal where half the fields get filled in the wrong one.
//
// Delivery is therefore the FIRST choice, and it changes what the form asks:
//   ONLINE    - needs a conferencing link, students, and any material to hand
//               out. Nothing is printed.
//   IN PERSON - needs a centre and a room, and a tutor mapped to it so that
//               tutor can raise booklet requests against the class. No link.
//
// The live system's modal asks for everything at once and marks the
// conferencing link required even for a class in a room in Harrisdale.

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { AdminSession, centreStyle } from "@/lib/admin-schedule";
import { CENTRES_M, COURSES } from "@/lib/admin-masters";
import { STAFF } from "@/lib/admin-data";
import { DeliveryMode } from "@/lib/tutor-data";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  link: "M3.9 12a5 5 0 0 1 5-5h3v1.9h-3a3.1 3.1 0 0 0 0 6.2h3V17h-3a5 5 0 0 1-5-5Zm5.1 1h6v-2H9v2Zm6.1-6h-3v1.9h3a3.1 3.1 0 0 1 0 6.2h-3V17h3a5 5 0 0 0 0-10Z",
  upload: "M9 16h6v-6h4l-7-7-7 7h4v6Zm-4 2h14v2H5v-2Z",
};

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

export function ScheduleClassModal({
  onClose,
  onCreate,
  defaultDay,
}: {
  onClose: () => void;
  onCreate: (s: Omit<AdminSession, "id">) => void;
  defaultDay: string | null;
}) {
  const [delivery, setDelivery] = useState<DeliveryMode>("online");
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState(COURSES[0].name);
  const [tutor, setTutor] = useState(STAFF[0].name);
  const [centre, setCentre] = useState(CENTRES_M[0].name);
  const [room, setRoom] = useState("Room 1");
  const [day, setDay] = useState(defaultDay ?? "2026-07-09");
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("17:00");
  const [repeat, setRepeat] = useState<"once" | "weekly">("once");
  const [weeks, setWeeks] = useState(8);
  const [students, setStudents] = useState(10);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);

  const courseDef = useMemo(() => COURSES.find((c) => c.name === course), [course]);
  const eligibleTutors = STAFF.filter((s) => s.duties === "both" || s.duties === (delivery === "online" ? "online" : "in_person"));

  const mins = (() => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(0, eh * 60 + em - (sh * 60 + sm));
  })();

  const timeLabel = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "pm" : "am";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ":" + String(m).padStart(2, "0") + ap;
  };

  const valid = title.trim().length > 0 && (delivery === "in_person" || link.trim().length > 0);

  const submit = () => {
    if (!valid) return;
    const base = {
      k: day,
      className: title.trim(),
      courseId: courseDef?.id ?? "new",
      tutor,
      centre: delivery === "online" ? "Online" : centre,
      delivery,
      time: timeLabel(start),
      students,
      // An in-person class starts life with nothing requested - that is exactly
      // the state the calendar rings in amber until a tutor raises a request.
      booklet: delivery === "online" ? null : ("not_requested" as const),
    };
    if (repeat === "weekly") {
      for (let i = 0; i < weeks; i++) {
        const d = new Date(day + "T12:00:00");
        d.setDate(d.getDate() + i * 7);
        onCreate({ ...base, k: d.toISOString().slice(0, 10), session: i + 1 });
      }
    } else {
      onCreate(base);
    }
    onClose();
  };

  const toggleMaterial = (m: string) => setMaterials((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]));

  return (
    <Modal onClose={onClose} labelledBy="sched-title" panelStyle={{ width: "min(680px, calc(100vw - 32px))", maxHeight: "min(90vh, 900px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="sched-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              Schedule a class
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>The kind of class decides the rest of the form.</span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        {/* ---- delivery first ---- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          {([
            { id: "online", title: "Online class", body: "Runs on a conferencing link. Nothing is printed." },
            { id: "in_person", title: "In-person class", body: "Runs at a centre. The tutor can request printed booklets for it." },
          ] as const).map((o) => {
            const on = delivery === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setDelivery(o.id)}
                aria-pressed={on}
                className="press"
                style={{ textAlign: "left", padding: "13px 14px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", border: on ? "1.5px solid var(--accent-teal)" : "1.5px solid rgba(0,32,63,.1)", background: on ? "rgba(14,156,142,.08)" : "rgba(255,255,255,.7)" }}
              >
                <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: on ? "var(--accent-teal)" : "var(--fg1)" }}>{o.title}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--fg3)", marginTop: 3, lineHeight: 1.45 }}>{o.body}</span>
              </button>
            );
          })}
        </div>

        <Row cols="1fr">
          <span>
            <Label required>Class title</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Year 9 Science - Forces revision" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
        </Row>

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

        <Row>
          <span>
            <Label>Repeats</Label>
            <select value={repeat} onChange={(e) => setRepeat(e.target.value as typeof repeat)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
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

        <Row>
          <span>
            <Label required>Course</Label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
              {COURSES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {courseDef && <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 4 }}>{courseDef.subjects.join(", ")}</span>}
          </span>
          <span>
            <Label required>{delivery === "in_person" ? "Tutor (this is who can request booklets)" : "Tutor"}</Label>
            <select value={tutor} onChange={(e) => setTutor(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
              {eligibleTutors.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 4 }}>Only tutors granted {delivery === "online" ? "online" : "in-person"} duties are listed.</span>
          </span>
        </Row>

        {/* ---- the fork ---- */}
        {delivery === "in_person" ? (
          <Row>
            <span>
              <Label required>Centre</Label>
              <select value={centre} onChange={(e) => setCentre(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
                {CENTRES_M.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--fg4)", marginTop: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: centreStyle(centre).colour }} />
                This colour marks the class on every calendar.
              </span>
            </span>
            <span>
              <Label>Room</Label>
              <input value={room} onChange={(e) => setRoom(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            </span>
            <span>
              <Label>Expected students</Label>
              <input type="number" min={1} max={40} value={students} onChange={(e) => setStudents(Number(e.target.value))} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            </span>
          </Row>
        ) : (
          <Row cols="2fr 1fr">
            <span>
              <Label required>Conferencing link</Label>
              <span className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 13px", height: 44 }}>
                <Icon path={IC.link} size={14} style={{ color: "var(--fg4)", flex: "none" }} />
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste the meeting link" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, height: "100%" }} />
              </span>
            </span>
            <span>
              <Label>Students enrolled</Label>
              <input type="number" min={1} max={40} value={students} onChange={(e) => setStudents(Number(e.target.value))} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            </span>
          </Row>
        )}

        {/* ---- material ---- */}
        <div style={{ marginTop: 16 }}>
          <Label>{delivery === "online" ? "Material to hand out" : "Material to have printed"}</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {["Booklet", "Worksheet", "Lesson slides", "Study notes", "Reference notes"].map((m) => {
              const on = materials.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleMaterial(m)}
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
            {delivery === "online"
              ? "Attached from the Drive folders mapped to this course. Students see it in their library when the class starts."
              : "The tutor raises the print request against this class. It appears in Booklet Requests for approval."}
          </div>
        </div>

        <Row cols="1fr">
          <span>
            <Label>Notes for the tutor</Label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="field" style={{ width: "100%", minHeight: 66, boxSizing: "border-box", padding: "10px 12px", resize: "vertical" }} />
          </span>
        </Row>

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={submit} disabled={!valid} className="btn-primary press ev-tap-h" style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
            {repeat === "weekly" ? "Schedule " + weeks + " classes" : "Schedule the class"}
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
            Cancel
          </button>
          {!valid && (
            <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>
              {title.trim() ? "An online class needs a conferencing link." : "Give the class a title."}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}
