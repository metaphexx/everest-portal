// Office settings.
//
// Same shape as the tutor's settings page on purpose. The one difference is
// the last card: what the office is told about. Safeguarding alerts are locked
// on, exactly as they are for tutors - the office is the escalation point, so
// there is nobody left to tell if it is switched off.

import React, { useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { ADMIN } from "@/lib/admin-data";

const IC = {
  camera: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM9 2 7.2 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.2L15 2H9Zm3 16a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z",
  lock: "M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9V6Z",
};

interface Pref {
  id: string;
  label: string;
  sub: string;
  on: boolean;
  locked?: boolean;
}

export default function AdminSettings() {
  const { showToast, notWired } = useAdmin();
  const [email, setEmail] = useState(ADMIN.email);
  const [phone, setPhone] = useState(ADMIN.phone);
  const [prefs, setPrefs] = useState<Pref[]>([
    { id: "requests", label: "New print requests", sub: "A tutor sends a request for approval", on: true },
    { id: "failed", label: "Print failures", sub: "A job comes back failed from a printer", on: true },
    { id: "trials", label: "Trials ending", sub: "A trial student is due a decision this week", on: true },
    { id: "safeguard", label: "Safeguarding alerts", sub: "Always on. You are the escalation point.", on: true, locked: true },
  ]);

  const toggle = (id: string) => setPrefs((p) => p.map((x) => (x.id === id || !x.locked ? (x.id === id ? { ...x, on: !x.on } : x) : x)));

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 6", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 14px" }}>Profile</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <span style={{ width: 62, height: 62, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent-teal),var(--accent-navy-blue))", color: "#fff", fontSize: 19, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            {ADMIN.initials}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 800 }}>{ADMIN.name}</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg4)", marginTop: 2 }}>
              {ADMIN.role} · {ADMIN.centre}
            </span>
            <button onClick={() => notWired("Change photo")} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Icon path={IC.camera} size={13} />
              Add a photo
            </button>
          </span>
        </div>

        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", marginBottom: 5 }} htmlFor="of-email">Email address</label>
        <input id="of-email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box", marginBottom: 12 }} />

        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", marginBottom: 5 }} htmlFor="of-phone">Mobile number</label>
        <input id="of-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
        <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 6, lineHeight: 1.5 }}>Used by centres to reach the office about a class running now.</div>

        <button onClick={() => showToast("Contact details saved")} className="btn-primary press ev-tap-h" style={{ height: 42, padding: "0 20px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, marginTop: 16 }}>
          Save changes
        </button>
      </div>

      <div className="glass-card" style={{ gridColumn: "span 6", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 14px" }}>Login</h2>
        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", marginBottom: 5 }} htmlFor="of-pw-cur">Current password</label>
        <input id="of-pw-cur" type="password" defaultValue="password" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box", marginBottom: 12 }} />
        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", marginBottom: 5 }} htmlFor="of-pw-new">New password</label>
        <input id="of-pw-new" type="password" placeholder="At least 8 characters" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box", marginBottom: 12 }} />
        <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", marginBottom: 5 }} htmlFor="of-pw-rep">Confirm new password</label>
        <input id="of-pw-rep" type="password" placeholder="Repeat the new password" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
        <button onClick={() => showToast("Password updated")} className="btn-primary press ev-tap-h" style={{ height: 42, padding: "0 20px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, marginTop: 16 }}>
          Update password
        </button>
      </div>

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .1s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>What you are told about</h2>
        <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--fg3)" }}>These control the bell in the header and the daily email.</p>
        {prefs.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.07)" }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{p.label}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 2 }}>{p.sub}</span>
            </span>
            {p.locked ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--fg4)", flex: "none" }}>
                <Icon path={IC.lock} size={13} />
                Always on
              </span>
            ) : (
              <button
                onClick={() => toggle(p.id)}
                role="switch"
                aria-checked={p.on}
                aria-label={p.label}
                className="press"
                style={{ width: 46, height: 27, borderRadius: 980, border: "none", cursor: "pointer", flex: "none", padding: 3, background: p.on ? "var(--accent-teal)" : "rgba(0,32,63,.18)", transition: "background .2s ease" }}
              >
                <span style={{ display: "block", width: 21, height: 21, borderRadius: "50%", background: "#fff", transform: p.on ? "translateX(19px)" : "translateX(0)", transition: "transform .2s cubic-bezier(.16,1,.3,1)" }} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
