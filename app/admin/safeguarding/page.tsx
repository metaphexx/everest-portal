// Safeguarding.
//
// Deliberately the plainest page in the portal. No charts, no counts to clear,
// no green "all done" celebration - a flagged message is a child, and the
// screen should read like a note passed to a person rather than a queue to
// burn down.
//
// The classifier never blocks a message. It delivers it to the tutor AND
// escalates here, because a student reaching out and getting silence is worse
// than a false positive.

import React, { useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { SAFEGUARDING, SafeguardingFlag } from "@/lib/admin-data";

const IC = {
  shield: "M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z",
};

export default function AdminSafeguarding() {
  const { showToast } = useAdmin();
  const [flags, setFlags] = useState<SafeguardingFlag[]>(SAFEGUARDING);

  const action = (f: SafeguardingFlag) => {
    setFlags((list) => list.map((x) => (x.id === f.id ? { ...x, status: "actioned" } : x)));
    showToast("Marked as followed up. The record stays on this page.");
  };

  const open = flags.filter((f) => f.status === "open");
  const done = flags.filter((f) => f.status === "actioned");

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 20px", boxSizing: "border-box", display: "flex", alignItems: "flex-start", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <Icon path={IC.shield} size={18} style={{ color: "var(--accent-teal)", flex: "none", marginTop: 2 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--fg2)", lineHeight: 1.65 }}>
          Messages are scanned for wellbeing concerns, off-platform contact details and payment requests. A flagged message is still
          delivered to the tutor, and escalated here at the same time.
        </span>
      </div>

      {open.length === 0 && (
        <div className="glass-card" style={{ gridColumn: "span 12", padding: "34px 22px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Nothing open right now</div>
          <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Earlier flags stay below as a record.</div>
        </div>
      )}

      {open.map((f, i) => (
        <div
          key={f.id}
          className="glass-card"
          style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", border: "1px solid rgba(224,65,65,.3)", background: "rgba(224,65,65,.05)", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.06 + i * 0.05}s backwards` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: "var(--danger-500)", background: "rgba(224,65,65,.12)", padding: "4px 10px", borderRadius: 980 }}>{f.reason.toUpperCase()}</span>
            <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{f.when}</span>
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>{f.student}</div>
          <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>In a thread with {f.tutor}</div>

          <div style={{ marginTop: 12, borderLeft: "3px solid rgba(224,65,65,.5)", paddingLeft: 14, fontSize: 13.5, color: "var(--fg1)", lineHeight: 1.6 }}>
            &ldquo;{f.excerpt}&rdquo;
          </div>

          <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 12, lineHeight: 1.6 }}>
            Delivered to {f.tutor}, who was told to respond with care and not to promise confidentiality.
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={() => action(f)} className="press ev-tap-h" style={{ height: 40, padding: "0 18px", borderRadius: 11, border: "none", background: "var(--danger-500)", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              I have followed this up
            </button>
            <button onClick={() => showToast("Opening the full thread is not wired up in this prototype yet")} className="btn-ghost press ev-tap-h" style={{ height: 40, padding: "0 16px", borderRadius: 11, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
              Read the whole thread
            </button>
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <div className="glass-card" style={{ gridColumn: "span 12", padding: "18px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .2s backwards" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Already followed up</h2>
          <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--fg3)" }}>Kept as a record. Nothing here is deleted.</p>
          {done.map((f) => (
            <div key={f.id} style={{ padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{f.student}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fg4)", background: "rgba(0,32,63,.06)", padding: "3px 9px", borderRadius: 980 }}>{f.reason}</span>
                <span style={{ fontSize: 11, color: "var(--fg4)" }}>{f.when}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 4, lineHeight: 1.5 }}>{f.excerpt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
