import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { STUDENT } from "@/lib/data";

export default function SettingsPage() {
  const { showToast } = usePortal();
  const [name, setName] = useState(STUDENT.name);
  const [email, setEmail] = useState(STUDENT.email);
  const [toggles, setToggles] = useState({ nt1: true, nt2: true, nt3: true, nt4: false });

  const rows: { key: keyof typeof toggles; label: string }[] = [
    { key: "nt1", label: "New grades" },
    { key: "nt2", label: "Tutor feedback" },
    { key: "nt3", label: "Upcoming classes" },
    { key: "nt4", label: "New materials" },
  ];

  return (
    <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* Profile */}
      <div className="glass-card" style={{ padding: "22px 24px" }}>
        <h2 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Profile</h2>
        <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} className="field" /></Field>
        <div style={{ height: 12 }} />
        <Field label="Email address"><input value={email} onChange={(e) => setEmail(e.target.value)} className="field" /></Field>
        <div style={{ height: 12 }} />
        <Field label="Year level"><input value="Year 11" readOnly className="field" style={{ background: "rgba(0,32,63,.04)", color: "var(--fg4)", borderColor: "rgba(0,32,63,.08)" }} /></Field>
        <div style={{ height: 16 }} />
        <button onClick={() => showToast("Profile saved")} className="btn-primary" style={{ height: 40, padding: "0 20px", borderRadius: 11, fontSize: 13 }}>Save changes</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Login */}
        <div className="glass-card" style={{ padding: "22px 24px" }}>
          <h2 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Login</h2>
          <Field label="Current password"><input type="password" placeholder="••••••••" className="field" /></Field>
          <div style={{ height: 12 }} />
          <Field label="New password"><input type="password" placeholder="At least 8 characters" className="field" /></Field>
          <div style={{ height: 16 }} />
          <button onClick={() => showToast("Password updated")} className="btn-ghost" style={{ height: 40, padding: "0 20px", borderRadius: 11, fontSize: 13, background: "rgba(255,255,255,.8)" }}>Update password</button>
        </div>

        {/* Notifications */}
        <div className="glass-card" style={{ padding: "22px 24px" }}>
          <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Notifications</h2>
          {rows.map((r, i) => {
            const on = toggles[r.key];
            return (
              <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < rows.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</span>
                <span onClick={() => setToggles((t) => ({ ...t, [r.key]: !t[r.key] }))} style={{ width: 40, height: 22, borderRadius: 980, background: on ? "var(--brand-500)" : "rgba(0,32,63,.15)", position: "relative", cursor: "pointer", transition: "background .2s ease", display: "inline-block", flex: "none" }}>
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
