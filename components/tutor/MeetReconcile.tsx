// Reconciling the Google Meet attendance report against what the tutor marked.
//
// Business Plus reports join and leave times per participant, but only AFTER
// the conference ends - there is no live push - so Meet can never drive marking
// during the lesson. It arrives afterwards and is compared, never applied
// silently: a tutor who marked someone present had a reason, and a student on a
// dropping connection reads as absent to Meet while being in the room the whole
// time.

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { BlockSession, MeetRow, PARTIAL_BELOW, reconcile } from "@/lib/block";
import { useTutor } from "@/lib/tutor-store";

const IC = {
  check: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v6h-2V7Zm0 8h2v2h-2v-2Z",
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
};

const WORD: Record<string, string> = {
  present: "present for the whole slot",
  late: "joined late",
  absent: "never joined",
  partial: "left before the end",
};

export function MeetReconcile({
  slot,
  rows,
  marks,
}: {
  slot: BlockSession;
  rows: MeetRow[];
  marks: Record<string, string>;
}) {
  const { markAttendance, showToast } = useTutor();
  const diffs = reconcile(rows, slot, marks);

  if (Object.keys(marks).length === 0) return null;

  if (diffs.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12, fontSize: 11.5, color: "var(--fg3)" }}>
        <Icon path={IC.tick} size={13} style={{ color: "var(--success-500)", flex: "none" }} />
        The Meet report agrees with your marks for {slot.subject}.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, border: "1px solid rgba(245,166,35,.4)", background: "rgba(245,166,35,.06)", borderRadius: 14, padding: "13px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon path={IC.check} size={14} style={{ color: "var(--warn-700)", flex: "none" }} />
        <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: "var(--font-display)" }}>
          The Meet report disagrees on {diffs.length}
        </span>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.55 }}>
        Nothing has been changed. A dropping connection reads as absent to Meet, so your mark may well be the right one.
      </p>

      {diffs.map((d) => (
        <div key={d.student} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid rgba(0,32,63,.07)", flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 200px", minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{d.student}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
              You marked <strong style={{ fontWeight: 700 }}>{d.marked}</strong> · Meet saw {d.minutesPresent} min of {slot.subject}, so {WORD[d.derived]}
            </span>
          </span>
          <button
            onClick={() => {
              markAttendance(slot.id + ":meet", d.student, d.derived === "partial" ? "late" : (d.derived as "present" | "late" | "absent"));
              showToast("Updated " + d.student + " to match the Meet report");
            }}
            className="btn-soft press ev-tap-h"
            style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 700, flex: "none" }}
          >
            Use Meet&apos;s
          </button>
        </div>
      ))}

      <div style={{ fontSize: 10.5, color: "var(--fg4)", marginTop: 10, lineHeight: 1.5 }}>
        Anything under {Math.round(PARTIAL_BELOW * 100)}% of the slot counts as leaving early.
      </div>
    </div>
  );
}
