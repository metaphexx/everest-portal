// Tutors: the staff record, and the one screen where duties are granted.
//
// Duties are the whole reason the tutor portal reshapes itself - an in-person
// tutor never sees marking, an online tutor never sees the print pipeline. That
// switch is an office decision, so it is shown here as what it is rather than
// buried in a settings tab.

import React, { useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { STAFF, allClasses } from "@/lib/admin-data";

const IC = {
  mail: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z",
  phone: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1l-2.23 2.2Z",
};

const DUTY_LABEL: Record<string, string> = {
  both: "In person and online",
  online: "Online only",
  in_person: "In person only",
};

export default function AdminTutors() {
  const { notWired } = useAdmin();
  const [q, setQ] = useState("");
  const classes = allClasses();

  const shown = STAFF.filter((s) => {
    const ql = q.trim().toLowerCase();
    return !ql || (s.name + " " + s.email + " " + s.centres.join(" ")).toLowerCase().includes(ql);
  });

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tutors by name, email or centre" aria-label="Search tutors" className="field ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0, height: 44, boxSizing: "border-box" }} />
        <button onClick={() => notWired("Add a tutor")} className="btn-primary press ev-tap-h ev-wrap-cta" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, flex: "none" }}>
          Add a tutor
        </button>
      </div>

      {shown.map((s, i) => {
        const theirs = classes.filter((c) => c.tutorId === s.id);
        const students = theirs.reduce((n, c) => n + c.students, 0);
        return (
          <div key={s.id} className="glass-card" style={{ gridColumn: "span 6", padding: "18px 20px", boxSizing: "border-box", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.06 + i * 0.04}s backwards` }}>
            <div className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: s.colour, color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                {s.initials}
              </span>
              <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>{s.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 2 }}>
                  {s.role} · {theirs.length} class{theirs.length === 1 ? "" : "es"} · {students} students
                </span>
              </span>
              {s.status === "on_leave" && (
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: "var(--warn-700)", background: "rgba(245,166,35,.16)", padding: "4px 10px", borderRadius: 980, flex: "none" }}>ON LEAVE</span>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--fg3)" }}>
                <Icon path={IC.mail} size={13} style={{ color: "var(--fg4)", flex: "none" }} />
                {s.email}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--fg3)" }}>
                <Icon path={IC.phone} size={13} style={{ color: "var(--fg4)", flex: "none" }} />
                {s.phone}
              </span>
            </div>

            {/* Duties. Read-only in the prototype, but shown as the real switch
                it is, so nobody has to be told where the toggle will live. */}
            <div style={{ marginTop: 14, border: "1px solid rgba(0,32,63,.08)", borderRadius: 12, background: "rgba(255,255,255,.6)", padding: "11px 13px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>DUTIES YOU HAVE GRANTED</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg1)", marginTop: 4 }}>{DUTY_LABEL[s.duties]}</div>
              <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 4, lineHeight: 1.5 }}>
                {s.duties === "online"
                  ? "Their portal hides the print pipeline entirely."
                  : s.duties === "in_person"
                  ? "Their portal hides marking, classrooms and digital assigning."
                  : "Their portal shows both, with a switch in the header."}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 12, lineHeight: 1.6 }}>
              {theirs.length === 0 ? "No classes assigned." : theirs.map((c) => c.name).join(" · ")}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button onClick={() => notWired("Change duties")} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                Change duties
              </button>
              <button onClick={() => notWired("Message tutor")} className="btn-ghost press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                Message
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
