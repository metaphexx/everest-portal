// The conferencing link.
//
// Nobody types a meeting link. The office presses a button, a room is created,
// and the link is the RESULT - so this is a button until there is a link and a
// link once there is one, rather than an empty box that quietly makes creating
// a class depend on remembering to go and make a room somewhere else first.

import React from "react";
import { Icon } from "@/components/ui/Icon";

const IC = {
  video: "M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4Z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
};

const LETTERS = "abcdefghijkmnopqrstuvwxyz";

/** meet.google.com codes are three groups of letters, e.g. jqo-qfbi-rfa. */
export function newMeetLink(): string {
  const group = (n: number) =>
    Array.from({ length: n }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join("");
  return "https://meet.google.com/" + group(3) + "-" + group(4) + "-" + group(3);
}

export function MeetLinkField({ value, onChange, required = true }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>
        Conferencing link
        {required && <span style={{ color: "var(--danger-500)" }}> *</span>}
      </div>

      {!value ? (
        <>
          <button
            type="button"
            onClick={() => onChange(newMeetLink())}
            className="btn-soft press ev-tap-h"
            style={{ height: 44, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 9 }}
          >
            <Icon path={IC.video} size={15} />
            Create a Google Meet link
          </button>
          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 5, lineHeight: 1.45 }}>
            The same link is used every week.
          </div>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(14,156,142,.35)", background: "rgba(14,156,142,.07)", borderRadius: 12, padding: "9px 11px", minWidth: 0 }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(14,156,142,.14)", color: "var(--accent-teal)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon path={IC.video} size={15} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg2)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove the meeting link"
            title="Remove the meeting link"
            className="btn-ghost press"
            style={{ width: 32, height: 32, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}
          >
            <Icon path={IC.close} size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
