// The student's view of a multi-subject block.
//
// The whole point: a student sees ONLY the subjects they are enrolled in, and
// is told plainly when to join and when to leave. Everything else about the
// block - the other rosters, who else is in the room, the subjects they did not
// take - is none of their business and is not shown.
//
// One link, one call. The student does not rejoin between subjects.

import React from "react";
import { STUDENT } from "@/lib/data";
import { Icon, ICON } from "@/components/portal/nav-icons";
import { usePortal } from "@/lib/store";
import { blockForStudent, blockMeta, chaptersForStudent, hhmm, planFor, slotsFor, slotsForStudent } from "@/lib/block";

const FALLBACK_START = "4:00pm";

const IC = {
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10.6V7h-2v6.4l4.7 2.8 1-1.7-3.7-2.2Z",
  play: "M8 5v14l11-7L8 5Z",
  link: "M3.9 12a5 5 0 0 1 5-5h3v1.9h-3a3.1 3.1 0 0 0 0 6.2h3V17h-3a5 5 0 0 1-5-5Zm5.1 1h6v-2H9v2Zm6.1-6h-3v1.9h3a3.1 3.1 0 0 1 0 6.2h-3V17h3a5 5 0 0 0 0-10Z",
};

export default function StudentBlockPage() {
  const { notWired } = usePortal();
  // Whichever block this student is actually in, rather than one named in
  // code: a block the office builds has to reach the students in it.
  const COURSE = blockForStudent(STUDENT.name) ?? "block11";
  const all = slotsFor(COURSE);
  const mine = slotsForStudent(COURSE, STUDENT.name);
  const plan = planFor(COURSE, STUDENT.name);
  const chapters = chaptersForStudent(COURSE, blockMeta(COURSE)?.start ?? FALLBACK_START, STUDENT.name);
  const mineIds = new Set(mine.map((s) => s.id));

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* WHAT YOU DO TODAY - the one thing a student needs before 4pm */}
      <div className="glass-card" style={{ gridColumn: "span 7", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>
          Your {(blockMeta(COURSE)?.day ?? "Wednesdays").replace(/s$/, "")}
        </h2>
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--fg3)", lineHeight: 1.6 }}>
          {plan
            ? "You are in " + mine.length + " of the " + all.length + " subjects. Join once at " + plan.joinAt + " and stay until " + plan.leaveAt + " - it is one call, so you do not rejoin between subjects."
            : "You are not enrolled in any subject in this block."}
        </p>

        {all.map((s) => {
          const isMine = mineIds.has(s.id);
          return (
            <div
              key={s.id}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 13px", marginBottom: 8,
                borderRadius: 14,
                border: "1px solid " + (isMine ? "rgba(0,32,63,.08)" : "transparent"),
                background: isMine ? "rgba(255,255,255,.66)" : "transparent",
                opacity: isMine ? 1 : 0.55,
              }}
            >
              <span style={{ flex: "none", width: 4, alignSelf: "stretch", borderRadius: 2, background: isMine ? s.color : "var(--fg5-decorative)" }} />
              <span style={{ flex: "none", width: 64, fontSize: 12, fontWeight: 700, color: isMine ? "var(--fg2)" : "var(--fg4)" }}>{s.start}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: isMine ? 700 : 500, color: isMine ? "var(--fg1)" : "var(--fg4)" }}>{s.subject}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                  {isMine ? s.start + " to " + s.end + " · " + s.tutor : "Not one of your subjects"}
                </span>
              </span>
              {isMine ? (
                <span className="pill" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: s.color, background: s.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>
                  YOURS
                </span>
              ) : (
                <span style={{ fontSize: 10.5, color: "var(--fg4)", flex: "none" }}>you leave</span>
              )}
            </div>
          );
        })}

        {plan && !plan.contiguous && (
          <div style={{ marginTop: 4, borderRadius: 12, background: "rgba(245,166,35,.1)", padding: "11px 13px", fontSize: 11.5, color: "var(--warn-700)", lineHeight: 1.55 }}>
            Your subjects are not back to back. Leave the call after {plan.slots[0].end} and rejoin at {plan.slots[plan.slots.length - 1].start}.
          </div>
        )}

        {plan && (
          <div style={{ display: "flex", gap: 9, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => notWired("Join the class")} className="btn-primary press ev-tap-h" style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon path={IC.link} size={15} />
              Join at {plan.joinAt}
            </button>
            <span style={{ fontSize: 11.5, color: "var(--fg3)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon path={IC.clock} size={13} style={{ color: "var(--fg4)" }} />
              You leave at {plan.leaveAt}
            </span>
          </div>
        )}
      </div>

      {/* RECORDINGS - only the student's own subjects */}
      <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Last week&apos;s recording</h2>
        <p style={{ margin: "0 0 12px", fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.55 }}>
          The block is recorded as one video. You get the parts for your own subjects.
        </p>

        {chapters.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)" }}>Nothing recorded for your subjects yet.</div>}

        {chapters.map((c) => (
          <button
            key={c.slotId}
            onClick={() => notWired("Play recording")}
            className="list-hover"
            style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 11, padding: "11px 10px", borderRadius: 12, border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", borderTop: "1px solid rgba(0,32,63,.06)" }}
          >
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(0,157,255,.12)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon path={IC.play} size={14} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{c.subject}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                Starts at {hhmm(c.startSec)} · {Math.round((c.endSec - c.startSec) / 60)} min
              </span>
            </span>
          </button>
        ))}

      </div>
    </div>
  );
}
