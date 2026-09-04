// The slot handover: what happens at 5:00pm in a three-subject block.
//
// A block is one continuous call, so nothing about the room changes at a
// boundary - only who is supposed to be in it. That is invisible to a tutor
// who is mid-sentence, which is why this is a prompt rather than a passive
// flag: at each boundary it says who leaves, who arrives, and who is still
// here but is not on the next roster.
//
// It never ejects anyone. The reason a student lingers is usually innocent -
// a sibling waiting for a lift, someone who forgot their subject had finished
// - and a Year 8 booted mid-sentence with no warning becomes a phone call to
// the office.

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Handover, handoverAt, hourOf, lingerers, slotAt, slotsFor } from "@/lib/block";
import { useTutor } from "@/lib/tutor-store";

const IC = {
  out: "M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5ZM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5Z",
  in: "M11 7l1.4 1.4L9.8 11H20v2H9.8l2.6 2.6L11 17l-5-5 5-5Zm9-2h-8V3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8v-2h8V5Z",
  warn: "M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-6h-2v4h2v-4Z",
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
};

function Names({ people, tone }: { people: { name: string; init: string }[]; tone: string }) {
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
      {people.map((p) => (
        <span key={p.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px 0 4px", borderRadius: 980, background: "rgba(255,255,255,.75)", border: "1px solid rgba(0,32,63,.08)", fontSize: 11.5, fontWeight: 600 }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: tone, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.init}</span>
          {p.name}
        </span>
      ))}
    </span>
  );
}

export function HandoverPanel({
  courseId,
  /** Decimal hour, e.g. 17 for 5:00pm. In the product this is the wall clock. */
  hour,
  /** Who the conferencing room currently reports as present. */
  inRoom,
}: {
  courseId: string;
  hour: number;
  inRoom: string[];
}) {
  const { showToast } = useTutor();
  const slots = slotsFor(courseId);
  if (slots.length === 0) return null;

  const current = slotAt(courseId, hour);
  const stray = lingerers(courseId, hour, inRoom);

  // A handover is "due" from the boundary until five minutes past it, which is
  // the window a tutor actually acts in.
  const boundary = slots.map((s) => hourOf(s.start)).concat(hourOf(slots[slots.length - 1].end))
    .find((b) => hour >= b && hour < b + 5 / 60);
  const ho: Handover | null = boundary != null ? handoverAt(courseId, boundary) : null;

  if (!ho && stray.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 11 }}>
        <Icon path={IC.tick} size={16} style={{ color: "var(--success-500)", flex: "none" }} />
        <span style={{ fontSize: 12.5, color: "var(--fg2)" }}>
          {current ? current.subject + " is running. Everyone in the room is on this roster." : "No slot running right now."}
        </span>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "16px 20px", border: stray.length ? "1px solid rgba(245,166,35,.45)" : undefined, background: stray.length ? "rgba(245,166,35,.06)" : undefined }}>
      {ho && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginBottom: 4 }}>
            <h3 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>
              {ho.to ? "Handover to " + ho.to.subject : "Block finished"}
            </h3>
            {ho.to && <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{ho.to.start} to {ho.to.end} · {ho.to.tutor}</span>}
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.55 }}>
            The call stays open - nobody rejoins. Only who is expected in the room changes.
          </p>

          {ho.leaving.length > 0 && (
            <div style={{ paddingTop: 10, borderTop: "1px solid rgba(0,32,63,.07)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>
                <Icon path={IC.out} size={13} />
                LEAVING NOW ({ho.leaving.length})
              </span>
              <Names people={ho.leaving} tone="var(--fg4)" />
            </div>
          )}

          {ho.arriving.length > 0 && (
            <div style={{ paddingTop: 10, marginTop: 10, borderTop: "1px solid rgba(0,32,63,.07)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>
                <Icon path={IC.in} size={13} />
                JOINING NOW ({ho.arriving.length})
              </span>
              <Names people={ho.arriving} tone="var(--success-500)" />
            </div>
          )}

          {ho.staying.length > 0 && (
            <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 10 }}>
              {ho.staying.length} student{ho.staying.length === 1 ? "" : "s"} stay on for both.
            </div>
          )}
        </>
      )}

      {stray.length > 0 && (
        <div style={{ marginTop: ho ? 14 : 0, paddingTop: ho ? 12 : 0, borderTop: ho ? "1px solid rgba(0,32,63,.07)" : undefined }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: "var(--warn-700)" }}>
            <Icon path={IC.warn} size={13} />
            STILL IN THE ROOM, NOT ON THIS ROSTER ({stray.length})
          </span>
          <Names people={stray.map((n) => ({ name: n, init: n.split(" ").map((w) => w[0]).join("").slice(0, 2) }))} tone="var(--warn-500)" />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => showToast("Asked " + stray.length + " student" + (stray.length === 1 ? "" : "s") + " to leave the call")}
              className="btn-primary press ev-tap-h"
              style={{ height: 36, padding: "0 15px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}
            >
              Ask them to leave
            </button>
            <button
              onClick={() => showToast("Noted - they can stay for this slot")}
              className="btn-ghost press ev-tap-h"
              style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}
            >
              They can stay
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 9, lineHeight: 1.5 }}>
            They are not marked absent from anything - they are simply not enrolled in {current ? current.subject : "this subject"}.
          </div>
        </div>
      )}
    </div>
  );
}
