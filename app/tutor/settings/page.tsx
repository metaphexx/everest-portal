// Tutor Settings - profile photo, contact details, password and notification
// preferences. Mirrors the student settings page so both portals read the same,
// with the fields a tutor actually owns.
//
// Name and role are set by the office, so they are shown read-only with an
// explanation rather than as editable fields that would not really save.

import React, { useRef, useState } from "react";
import { useTutor } from "@/lib/tutor-store";
import { TUTOR } from "@/lib/tutor-data";
import { Icon } from "@/components/ui/Icon";

const CAMERA = "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM9 3 7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z";

export default function TutorSettingsPage() {
  const { showToast, notWired } = useTutor();
  const [email, setEmail] = useState(TUTOR.email);
  const [phone, setPhone] = useState(TUTOR.phone);
  // Object URL of a freshly chosen photo. No backend, so it lives for the
  // session only - enough to show the flow and the crop.
  const [photo, setPhoto] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [toggles, setToggles] = useState({ nt1: true, nt2: true, nt3: false, nt4: true });

  const rows: { key: keyof typeof toggles; label: string; note: string }[] = [
    { key: "nt1", label: "New student messages", note: "Someone writes to you" },
    { key: "nt2", label: "Work submitted for marking", note: "A student uploads a worksheet" },
    { key: "nt3", label: "Booklet request updates", note: "Approved, rejected or printed" },
    { key: "nt4", label: "Safeguarding alerts", note: "Always on for flagged messages" },
  ];

  const pickPhoto = (file?: File) => {
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    showToast("Profile photo updated");
  };

  return (
    <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* Profile */}
      <div className="glass-card" style={{ padding: "22px 24px" }}>
        <h2 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Profile</h2>

        <div className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <span style={{ position: "relative", width: 64, height: 64, flex: "none" }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Your profile photo" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            ) : (
              <span style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-violet)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 700 }}>
                {TUTOR.initials}
              </span>
            )}
          </span>
          <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{TUTOR.name}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 2 }}>{TUTOR.role}</span>
            <span style={{ display: "inline-flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => photoRef.current?.click()}
                className="btn-soft press ev-tap-h"
                style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon path={CAMERA} size={14} />
                {photo ? "Change photo" : "Add a photo"}
              </button>
              {photo && (
                <button
                  onClick={() => { setPhoto(null); showToast("Profile photo removed"); }}
                  className="btn-ghost press ev-tap-h"
                  style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: "rgba(255,255,255,.8)", color: "var(--fg2)" }}
                >
                  Remove
                </button>
              )}
            </span>
          </span>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }}
          />
        </div>

        {/* Set by the office. Greyed with no explanation just reads as broken. */}
        <Field label="Full name">
          <input value={TUTOR.name} readOnly className="field" style={{ background: "rgba(0,32,63,.04)", color: "var(--fg4)", borderColor: "rgba(0,32,63,.08)" }} />
          <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 5 }}>Set by the Everest office. Contact them if this is wrong.</div>
        </Field>
        <div style={{ height: 12 }} />
        <Field label="Email address">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="field" />
        </Field>
        <div style={{ height: 12 }} />
        <Field label="Mobile number">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" className="field" />
          <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 5 }}>Used by the office for roster changes and class cancellations.</div>
        </Field>
        <div style={{ height: 16 }} />
        <button onClick={() => showToast("Profile saved")} className="btn-primary press" style={{ height: 40, padding: "0 20px", borderRadius: 11, fontSize: 13 }}>Save changes</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Login */}
        <div className="glass-card" style={{ padding: "22px 24px" }}>
          <h2 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Login</h2>
          <Field label="Current password"><input type="password" placeholder="••••••••" className="field" /></Field>
          <div style={{ height: 12 }} />
          <Field label="New password"><input type="password" placeholder="At least 8 characters" className="field" /></Field>
          <div style={{ height: 12 }} />
          <Field label="Confirm new password"><input type="password" placeholder="Repeat the new password" className="field" /></Field>
          <div style={{ height: 16 }} />
          <button onClick={() => showToast("Password updated")} className="btn-primary press" style={{ height: 40, padding: "0 20px", borderRadius: 11, fontSize: 13 }}>Update password</button>
        </div>

        {/* Notifications */}
        <div className="glass-card" style={{ padding: "22px 24px" }}>
          <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Notifications</h2>
          {rows.map((r, i) => {
            const on = toggles[r.key];
            const locked = r.key === "nt4"; // safeguarding cannot be switched off
            return (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", padding: "10px 0", borderBottom: i < rows.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{r.label}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{r.note}</span>
                </span>
                <span
                  role="switch"
                  aria-checked={on}
                  aria-label={r.label}
                  tabIndex={locked ? -1 : 0}
                  onClick={() => { if (locked) { notWired("Safeguarding alerts stay on"); return; } setToggles((t) => ({ ...t, [r.key]: !t[r.key] })); }}
                  onKeyDown={(e) => { if (!locked && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setToggles((t) => ({ ...t, [r.key]: !t[r.key] })); } }}
                  style={{ width: 40, height: 22, borderRadius: 980, background: on ? "var(--brand-500)" : "rgba(0,32,63,.15)", position: "relative", cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.65 : 1, transition: "background .2s ease", display: "inline-block", flex: "none" }}
                >
                  <span style={{ position: "absolute", top: 2, left: 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,32,63,.25)", transition: "transform .2s cubic-bezier(.16,1,.3,1)", transform: on ? "translateX(18px)" : "translateX(0)" }} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}
