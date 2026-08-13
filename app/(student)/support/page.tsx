// Support: send a request AND track every request you've made - status,
// team replies and follow-ups all live here (and Elliot can log requests
// for you from chat). Urgent things still go by phone.

import React, { useState } from "react";
import { useRouter } from "@/lib/router";
import { SupportRequest, usePortal } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";

const STATUS_META = {
  open: { label: "Open", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  replied: { label: "Replied", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
  resolved: { label: "Resolved", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
} as const;

function timeAgo(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + " hr" + (hrs === 1 ? "" : "s") + " ago";
  return Math.round(hrs / 24) + " days ago";
}

export default function SupportPage() {
  const { showToast, notWired, supportRequests, addSupportRequest, followUpRequest, setRequestStatus } = usePortal();
  const router = useRouter();
  const [type, setType] = useState("");
  const [msg, setMsg] = useState("");
  const [justSent, setJustSent] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [followDraft, setFollowDraft] = useState("");

  const submit = () => {
    if (!type || !msg.trim()) {
      showToast("Pick a category and describe the problem first");
      return;
    }
    const req = addSupportRequest(type, msg.trim());
    setJustSent(req.ref);
    setOpenId(req.id);
    setType("");
    setMsg("");
    setTimeout(() => setJustSent(null), 4000);
  };

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, alignItems: "start", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* New request */}
        <div className="glass-card" style={{ padding: "20px 22px" }}>
          <h2 style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Send a support request</h2>
          {/* Was "track it on the right" - there is no right-hand column on a
              phone, where the tracker sits below the form instead. */}
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--fg3)" }}>It lands with a person, and you can track it any time.</p>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 }}>Issue type</div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="field" style={{ padding: "0 10px", marginBottom: 12 }}>
            <option value="">Choose a category</option>
            <option value="Billing">Billing</option>
            <option value="Class access">Can&apos;t access a class</option>
            <option value="Technical problem">Technical problem</option>
            <option value="Scheduling">Scheduling</option>
            <option value="Something else">Something else</option>
          </select>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg2)", marginBottom: 5 }}>What happened?</div>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Describe the problem" rows={4} className="field" style={{ height: "auto", padding: "11px 13px", resize: "vertical", marginBottom: 14 }} />
          <button onClick={submit} className="btn-primary" style={{ height: 42, padding: "0 24px", borderRadius: 12, fontSize: 13.5, width: "100%" }}>
            {justSent ? "Sent · " + justSent : "Submit request"}
          </button>
        </div>

        {/* Contact cards */}
        <button onClick={() => notWired("Calling")} className="glass-card contact-card" style={{ padding: "16px 18px", cursor: "pointer", border: "none", fontFamily: "inherit", textAlign: "left", display: "block", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(34,160,91,.13)", color: "var(--success-700)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon path="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1L6.6 10.8Z" size={17} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg3)" }}>URGENT ISSUES</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 2 }}>+61 404 604 673</div>
              <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>Any school day, 9am to 6pm</div>
            </div>
          </div>
        </button>
        <button onClick={() => router.push("/messages")} className="glass-card contact-card" style={{ padding: "16px 18px", cursor: "pointer", border: "none", fontFamily: "inherit", textAlign: "left", display: "block", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,32,63,.09)", color: "var(--navy-500)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon path="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" size={17} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg3)" }}>PREFER TO CHAT?</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Message the Everest team</div>
              <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>Live thread in Message a Tutor</div>
            </div>
          </div>
        </button>
      </div>

      {/* Request tracker */}
      <div className="glass-card" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>Your requests</h2>
          <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>
            {supportRequests.filter((r) => r.status !== "resolved").length} open · {supportRequests.length} total
          </span>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--fg3)" }}>Every request you send, with the team&apos;s replies. We aim to reply within one business day.</p>

        {supportRequests.length === 0 && (
          <div style={{ textAlign: "center", padding: "36px 10px" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(0,157,255,.1)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Icon path="M5 12l5 5L20 7" size={20} stroke />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>No requests yet</div>
            <div style={{ fontSize: 12, color: "var(--fg4)", marginTop: 4, lineHeight: 1.5 }}>Send one using the form above, or just tell Elliot what&apos;s wrong and he&apos;ll log it for you.</div>
          </div>
        )}

        {supportRequests.map((r) => (
          <RequestRow
            key={r.id}
            r={r}
            open={openId === r.id}
            onToggle={() => setOpenId(openId === r.id ? null : r.id)}
            followDraft={openId === r.id ? followDraft : ""}
            setFollowDraft={setFollowDraft}
            onFollowUp={() => {
              if (!followDraft.trim()) return;
              followUpRequest(r.id, followDraft.trim());
              setFollowDraft("");
            }}
            onResolve={() => setRequestStatus(r.id, r.status === "resolved" ? "open" : "resolved")}
          />
        ))}
      </div>
    </div>
  );
}

function RequestRow({
  r,
  open,
  onToggle,
  followDraft,
  setFollowDraft,
  onFollowUp,
  onResolve,
}: {
  r: SupportRequest;
  open: boolean;
  onToggle: () => void;
  followDraft: string;
  setFollowDraft: (v: string) => void;
  onFollowUp: () => void;
  onResolve: () => void;
}) {
  const sm = STATUS_META[r.status];
  return (
    <div style={{ borderBottom: "1px solid rgba(0,32,63,.06)" }}>
      <button onClick={onToggle} className="list-hover" aria-expanded={open} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "12px 6px", borderRadius: 10, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit", textAlign: "left" }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--fg3)", background: "rgba(0,32,63,.06)", padding: "3px 8px", borderRadius: 8, flex: "none" }}>{r.ref}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.type}: {r.message}</span>
          <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)", marginTop: 1 }}>
            Sent {timeAgo(r.createdAt)}{r.updates.length > 0 ? " · " + r.updates.length + " update" + (r.updates.length === 1 ? "" : "s") : ""}
          </span>
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: sm.color, background: sm.bg, padding: "3px 10px", borderRadius: 980, flex: "none" }}>{sm.label}</span>
        <span aria-hidden="true" style={{ color: "var(--fg4)", fontSize: 11, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s ease" }}>›</span>
      </button>

      {open && (
        <div style={{ padding: "2px 6px 14px 6px", animation: "evfadein .2s ease-out" }}>
          <div style={{ background: "rgba(0,32,63,.04)", borderRadius: 12, padding: "10px 13px", fontSize: 12.5, fontWeight: 500, color: "var(--fg2-alt)", lineHeight: 1.5, marginBottom: 8 }}>
            {r.message}
          </div>
          {r.updates.map((u, i) => (
            <div key={i} style={{ display: "flex", gap: 9, padding: "7px 2px", alignItems: "flex-start" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", flex: "none", background: u.who === "team" ? "linear-gradient(135deg,var(--navy-500),var(--accent-navy-blue))" : "linear-gradient(135deg,var(--accent-blue-light),var(--accent-violet-light))", color: "#fff", fontSize: 9.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {u.who === "team" ? "E" : "MK"}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--fg1)", lineHeight: 1.5 }}>{u.text}</span>
                <span style={{ display: "block", fontSize: 10, color: "var(--fg4)", marginTop: 1 }}>{u.who === "team" ? "Everest team" : "You"} · {timeAgo(u.at)}</span>
              </span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              value={followDraft}
              onChange={(e) => setFollowDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onFollowUp()}
              placeholder="Add a follow-up or extra detail"
              aria-label={"Follow up on " + r.ref}
              className="field"
              style={{ flex: 1, height: 36, fontSize: 12 }}
            />
            <button onClick={onFollowUp} className="btn-soft" style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, flex: "none" }}>Follow up</button>
            <button onClick={onResolve} className="btn-ghost" style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, flex: "none", color: r.status === "resolved" ? "var(--fg3)" : "var(--success-700)", background: "rgba(255,255,255,.8)" }}>
              {r.status === "resolved" ? "Reopen" : "Mark resolved"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
