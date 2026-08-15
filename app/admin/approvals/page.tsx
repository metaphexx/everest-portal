// Approvals: the queue that decides whether a class gets its booklets.
//
// The screen is built for one decision made many times, so everything the
// office needs to make it is on the card itself - what was asked for, for which
// class and when that class runs, how many copies, which printer, the exact
// print spec, and the tutor's remark. No expanding, no second page.
//
// Rejecting asks for a reason, because the tutor sees it in My Requests and
// "Rejected" with no reason just produces a phone call.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { APPROVAL_META, BookletRequest, DEFAULT_FORMAT } from "@/lib/tutor-data";

const IC = {
  printer: "M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-3 11H8v-5h8v5Zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1-9H6v4h12V3Z",
  note: "M4 4h16v2H4V4Zm0 5h16v2H4V9Zm0 5h10v2H4v-2Z",
};

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "Waiting" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

/** Canned reasons, because the same four rejections happen every term. */
const REASONS = [
  "Sent too late for this class - please request by the Friday before.",
  "Copy count is higher than the class roll.",
  "This booklet has been replaced by a newer edition.",
  "Budget for this centre is spent for the month.",
];

export default function AdminApprovals() {
  const { requests, setApproval } = useAdmin();
  const [filter, setFilter] = useState<Filter>("pending");
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // Digital packs never needed approval - nothing is spent delivering them -
  // so they must not appear in a queue the office is asked to clear.
  const jobs = useMemo(() => requests.filter((r) => (r.delivery ?? "print") === "print"), [requests]);

  const shown = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return jobs.filter((r) => {
      if (filter !== "all" && r.approval !== filter) return false;
      if (!ql) return true;
      return (r.ref + " " + r.classText + " " + r.printer + " " + r.items.map((i) => i.name).join(" ")).toLowerCase().includes(ql);
    });
  }, [jobs, filter, q]);

  const count = (f: Filter) => (f === "all" ? jobs.length : jobs.filter((r) => r.approval === f).length);

  const openReject = (id: string) => {
    setRejecting(id);
    setReason("");
  };

  const confirmReject = (r: BookletRequest) => {
    setApproval(r.id, "rejected", reason.trim() || "No reason given.");
    setRejecting(null);
    setReason("");
  };

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <div className="ev-scroll-x" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={on}
                className="press ev-tap-h"
                style={{
                  height: 36,
                  padding: "0 15px",
                  borderRadius: 980,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  background: on ? "var(--accent-teal)" : "rgba(255,255,255,.8)",
                  color: on ? "#fff" : "var(--fg3)",
                }}
              >
                {f.label} ({count(f.id)})
              </button>
            );
          })}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by reference, class, booklet or printer"
          aria-label="Search requests"
          className="field"
          style={{ width: "100%", height: 44, boxSizing: "border-box" }}
        />
      </div>

      {shown.length === 0 && (
        <div className="glass-card" style={{ gridColumn: "span 12", padding: "34px 22px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>
            {filter === "pending" ? "Nothing waiting on you" : "No requests match"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>
            {filter === "pending" ? "Every request a tutor has sent has a decision on it." : "Try another filter or clear the search."}
          </div>
        </div>
      )}

      {shown.map((r, i) => {
        const meta = APPROVAL_META[r.approval];
        const fmt = { ...DEFAULT_FORMAT, ...r.format };
        const copies = r.items.reduce((n, it) => n + it.qty, 0);
        const isRejecting = rejecting === r.id;
        return (
          <div
            key={r.id}
            className="glass-card"
            style={{ gridColumn: "span 6", padding: "18px 20px", boxSizing: "border-box", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.08 + i * 0.04}s backwards`, display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{r.classText}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>
                  {r.ref} · sent {r.date}
                  {r.time ? " at " + r.time : ""}
                </span>
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: meta.color, background: meta.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{meta.label}</span>
            </div>

            {/* WHAT WAS ASKED FOR */}
            <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 12, background: "rgba(255,255,255,.6)", padding: "10px 12px" }}>
              {r.items.map((it) => (
                <div key={it.itemId} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "4px 0" }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{it.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--fg2)", flex: "none" }}>x{it.qty}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(0,32,63,.07)", marginTop: 6, paddingTop: 6, fontSize: 11.5, color: "var(--fg3)" }}>
                {copies} copies · {r.yearLevel} {r.subject}
              </div>
            </div>

            {/* HOW IT PRINTS */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 10 }}>
              <Icon path={IC.printer} size={15} style={{ color: "var(--fg4)", flex: "none", marginTop: 2 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--fg2)", fontWeight: 700 }}>{r.printer}</strong>
                <br />
                {[fmt.paper, fmt.sides, fmt.colour, fmt.orientation, fmt.scale, fmt.staple, fmt.perSheet].filter(Boolean).join(" · ")}
              </span>
            </div>

            {r.remark && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 9 }}>
                <Icon path={IC.note} size={15} style={{ color: "var(--fg4)", flex: "none", marginTop: 2 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.55, fontStyle: "italic" }}>&ldquo;{r.remark}&rdquo;</span>
              </div>
            )}

            {r.note && r.approval === "rejected" && (
              <div style={{ marginTop: 10, borderRadius: 10, background: "rgba(224,65,65,.08)", padding: "9px 11px", fontSize: 11.5, color: "var(--danger-500)", lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 700 }}>Your reason: </strong>
                {r.note}
              </div>
            )}

            {/* DECISION */}
            <div style={{ marginTop: "auto", paddingTop: 14 }}>
              {isRejecting ? (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--fg2)", marginBottom: 7 }}>Why is this rejected? The tutor sees this.</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {REASONS.map((x) => (
                      <button
                        key={x}
                        onClick={() => setReason(x)}
                        className="press ev-tap-h"
                        style={{ height: 30, padding: "0 11px", borderRadius: 980, border: "1px solid rgba(0,32,63,.12)", background: reason === x ? "rgba(224,65,65,.12)" : "rgba(255,255,255,.8)", color: reason === x ? "var(--danger-500)" : "var(--fg3)", fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                      >
                        {x.length > 34 ? x.slice(0, 33) + "..." : x}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Or write your own reason"
                    aria-label="Rejection reason"
                    className="field"
                    style={{ width: "100%", minHeight: 70, boxSizing: "border-box", padding: "10px 12px", resize: "vertical" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
                    <button onClick={() => confirmReject(r)} className="press ev-tap-h" style={{ height: 38, padding: "0 16px", borderRadius: 11, border: "none", background: "var(--danger-500)", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                      Send rejection
                    </button>
                    <button onClick={() => setRejecting(null)} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 15px", borderRadius: 11, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : r.approval === "pending" ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => setApproval(r.id, "approved")} className="btn-primary press ev-tap-h" style={{ height: 40, padding: "0 18px", borderRadius: 11, fontSize: 12.5, fontWeight: 700 }}>
                    Approve for printing
                  </button>
                  <button onClick={() => openReject(r.id)} className="btn-ghost press ev-tap-h" style={{ height: 40, padding: "0 16px", borderRadius: 11, fontSize: 12.5, fontWeight: 600, color: "var(--danger-500)" }}>
                    Reject
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>
                    {r.approval === "approved" ? "Approved and in the print queue." : "Rejected. The tutor has been told."}
                  </span>
                  <span className="ev-spacer-flex" style={{ flex: 1 }} />
                  <button onClick={() => setApproval(r.id, "pending", "")} className="btn-ghost press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: "var(--fg3)" }}>
                    Undo
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
