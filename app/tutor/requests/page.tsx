// My Requests - every booklet request with its TWO separate tracks:
// approval status (admin decision) and printing status (the physical job).
// Pending requests can be edited (pulled back into the cart); approved ones
// are view-only.

import React, { useMemo, useState } from "react";
import { useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { APPROVAL_META, PRINTING_META } from "@/lib/tutor-data";
import { Icon } from "@/components/ui/Icon";

function StatPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: "5px 11px", borderRadius: 980, whiteSpace: "nowrap" }}>{label}</span>;
}

export default function MyRequestsPage() {
  const router = useRouter();
  const { requests, editRequest, hasInPerson } = useTutor();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // Search across the request itself: reference, class, files, statuses.
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return requests;
    return requests.filter((r) => {
      const hay = [
        r.ref,
        r.classText,
        r.yearLevel,
        r.subject,
        r.date,
        r.printer,
        APPROVAL_META[r.approval].label,
        PRINTING_META[r.printing].label,
        ...r.items.map((it) => it.name),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [requests, q]);

  if (!hasInPerson) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>My Requests is part of in-person booklet requests</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Your account is set up for online teaching only. Track assignments from My Booklets instead.</div>
      </div>
    );
  }

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => r.approval === "pending").length,
    approved: requests.filter((r) => r.approval === "approved").length,
    rejected: requests.filter((r) => r.approval === "rejected").length,
  };

  const stats = [
    { label: "TOTAL REQUESTS", value: counts.total, color: "var(--brand-500)" },
    { label: "PENDING APPROVAL", value: counts.pending, color: "var(--warn-700)" },
    { label: "APPROVED", value: counts.approved, color: "var(--success-700)" },
    { label: "REJECTED", value: counts.rejected, color: "var(--danger-500)" },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {stats.map((s, i) => (
        <div key={s.label} className="glass-stat" style={{ gridColumn: "span 3", animation: `evrise .5s cubic-bezier(.16,1,.3,1) ${0.06 + i * 0.04}s backwards` }}>
          <div className="glass-stat-label">{s.label}</div>
          <div className="glass-stat-value" style={{ color: s.color }}>{s.value}</div>
        </div>
      ))}

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .22s backwards" }}>
        {/* Search the requests themselves */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 11, padding: "0 13px", height: 40, flex: 1, maxWidth: 420 }}>
            <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={14} style={{ color: "var(--fg4)", flex: "none" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search requests by reference, class, file or status"
              aria-label="Search requests"
              style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", flex: 1, minWidth: 0 }}
            />
          </div>
          {q && (
            <button onClick={() => setQ("")} className="btn-ghost" style={{ height: 40, padding: "0 16px", borderRadius: 11, fontSize: 12.5 }}>
              Clear
            </button>
          )}
          <span style={{ fontSize: 12, color: "var(--fg4)", flex: "none", marginLeft: "auto" }}>
            {visible.length} of {requests.length} request{requests.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="ev-scroll-x"><div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr .7fr auto auto auto", gap: "0 14px", alignItems: "center", minWidth: 680 }}>
          <HeadCell>REQUEST</HeadCell>
          <HeadCell>FOR</HeadCell>
          <HeadCell>DATE</HeadCell>
          <HeadCell>APPROVAL</HeadCell>
          <HeadCell>PRINTING</HeadCell>
          <HeadCell> </HeadCell>
          {visible.map((r) => {
            const am = APPROVAL_META[r.approval];
            const pm = PRINTING_META[r.printing];
            const open = openId === r.id;
            return (
              <React.Fragment key={r.id}>
                <div style={{ minWidth: 0, padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.ref}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>
                    {r.items.length} file{r.items.length === 1 ? "" : "s"} · {r.items.reduce((n, it) => n + it.qty, 0)} copies · {r.yearLevel} {r.subject}
                  </div>
                </div>
                <div style={{ minWidth: 0, fontSize: 12.5, color: "var(--fg2)", padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.06)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.classText}</div>
                <div style={{ fontSize: 12.5, color: "var(--fg3)", padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>{r.date}</div>
                <div style={{ padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                  <StatPill label={am.label} color={am.color} bg={am.bg} />
                </div>
                <div style={{ padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                  {r.approval === "approved" ? <StatPill label={pm.label} color={pm.color} bg={pm.bg} /> : <span style={{ fontSize: 11.5, color: "var(--fg5-decorative)" }}>-</span>}
                </div>
                <div style={{ padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.06)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  {r.approval === "pending" && (
                    <button
                      onClick={() => { editRequest(r.id); router.push("/tutor/cart"); }}
                      className="btn-primary press"
                      style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5 }}
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => setOpenId(open ? null : r.id)} className="btn-ghost press" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)" }}>
                    {open ? "Hide" : "View"}
                  </button>
                </div>
                {open && (
                  <div style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,.55)", border: "1px solid rgba(0,32,63,.07)", borderRadius: 14, padding: "14px 18px", margin: "0 0 12px", animation: "evfadein .22s ease" }}>
                    <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                      <div>
                        <DetailLabel>FILES REQUESTED</DetailLabel>
                        {r.items.map((it) => (
                          <div key={it.itemId} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, padding: "4px 0" }}>
                            <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>
                            <span style={{ fontWeight: 700, color: "var(--fg3)", flex: "none" }}>× {it.qty}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <DetailLabel>PRINT JOB</DetailLabel>
                        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--fg2)" }}>
                          {r.printer}
                          <br />
                          {r.format.paper} · {r.format.sides} · {r.format.colour} · {r.format.orientation} · {r.format.staple}
                        </div>
                        <DetailLabel style={{ marginTop: 10 }}>REMARK</DetailLabel>
                        <div style={{ fontSize: 12.5, color: "var(--fg2)" }}>{r.remark}</div>
                        {r.note && (
                          <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 600, color: "var(--danger-500)", background: "rgba(224,65,65,.08)", borderRadius: 10, padding: "8px 11px" }}>
                            {r.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div></div>
        {requests.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "18px 0", textAlign: "center" }}>No requests yet. Start from Study Materials.</div>}
        {requests.length > 0 && visible.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "18px 0", textAlign: "center" }}>No requests match that search.</div>}
      </div>
    </div>
  );
}

function HeadCell({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", paddingBottom: 8 }}>{children}</div>;
}

function DetailLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 5, ...style }}>{children}</div>;
}
