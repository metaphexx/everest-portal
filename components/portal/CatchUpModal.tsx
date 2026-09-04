// Asking to sit in on another class after missing a lesson.
//
// The student picks the session they missed and the app offers the other
// sessions that week teaching the same thing. Nothing is booked here - the
// office approves it - because a class has a seat cap and a student cannot be
// the one deciding a room is full.

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/portal/nav-icons";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
};

export interface CatchUpOption {
  hostClass: string;
  hostClassId: string;
  date: string;
  /** "Wednesday 9 July" */
  dateLabel: string;
  time: string;
  tutor: string;
  seatsLeft: number;
}

export function CatchUpModal({
  homeClass,
  missedLabel,
  options,
  onClose,
  onRequest,
}: {
  homeClass: string;
  missedLabel: string;
  options: CatchUpOption[];
  onClose: () => void;
  onRequest: (o: CatchUpOption) => void;
}) {
  const [picked, setPicked] = useState<string | null>(options[0] ? options[0].hostClassId + options[0].date : null);
  const chosen = options.find((o) => o.hostClassId + o.date === picked) ?? null;

  return (
    <Modal onClose={onClose} labelledBy="catchup-title" panelStyle={{ width: "min(560px, calc(100vw - 32px))", maxHeight: "min(88vh, 720px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="catchup-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>
              Catch up on {homeClass}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>You missed {missedLabel}.</span>
          </span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
            <Icon path={IC.close} size={14} />
          </button>
        </div>

        {options.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg3)", lineHeight: 1.6, marginTop: 16 }}>
            There is no other session covering this in the next fortnight. Message your tutor and they will sort something out.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", margin: "16px 0 6px" }}>SESSIONS YOU COULD JOIN</div>
            {options.map((o) => {
              const key = o.hostClassId + o.date;
              const on = picked === key;
              const full = o.seatsLeft <= 0;
              return (
                <button
                  key={key}
                  onClick={() => !full && setPicked(key)}
                  disabled={full}
                  aria-pressed={on}
                  className="press"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 13px",
                    marginBottom: 8,
                    borderRadius: 12,
                    cursor: full ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: full ? 0.5 : 1,
                    border: on ? "1.5px solid var(--brand-500)" : "1.5px solid rgba(0,32,63,.1)",
                    background: on ? "rgba(0,157,255,.07)" : "transparent",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{o.dateLabel}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--fg3)", marginTop: 2 }}>
                      {o.time} · {o.hostClass} · {o.tutor}
                    </span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: full ? "var(--danger-500)" : "var(--fg4)", flex: "none" }}>
                    {full ? "Full" : o.seatsLeft + " free"}
                  </span>
                </button>
              );
            })}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => chosen && onRequest(chosen)}
            disabled={!chosen}
            className="btn-primary press ev-tap-h"
            style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, opacity: chosen ? 1 : 0.5, cursor: chosen ? "pointer" : "not-allowed" }}
          >
            Ask to join
          </button>
          <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
            Cancel
          </button>
          {chosen && <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>The office confirms your spot.</span>}
        </div>
      </div>
    </Modal>
  );
}
