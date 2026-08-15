// The office dashboard.
//
// Built around one question: what is holding up a class today? Approvals and
// the print queue come first because a booklet that is not printed by Tuesday
// is a class without materials. Everything else on this page is a number the
// office is asked for on the phone.

import React, { useMemo } from "react";
import Link from "@/components/ui/Link";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { SAFEGUARDING, STAFF, allClasses, allStudents } from "@/lib/admin-data";
import { APPROVAL_META, DELIVERY_META, PRINTING_META } from "@/lib/tutor-data";

const IC = {
  arrow: "M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.6 12l-6.4-6.4Z",
  alert: "M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-6h-2v4h2v-4Z",
};

export default function AdminDashboard() {
  const { requests, pendingCount, toPrintCount, setApproval, sharedFiles } = useAdmin();

  const classes = useMemo(() => allClasses(), []);
  const students = useMemo(() => allStudents(), []);
  const openFlags = SAFEGUARDING.filter((f) => f.status === "open");

  const printJobs = requests.filter((r) => (r.delivery ?? "print") === "print");
  const pending = printJobs.filter((r) => r.approval === "pending");
  const failed = printJobs.filter((r) => r.printing === "failed");
  const copies = (r: (typeof printJobs)[number]) => r.items.reduce((n, i) => n + i.qty, 0);

  const stats = [
    { label: "TO APPROVE", value: pendingCount, sub: "print requests from tutors", color: pendingCount ? "var(--warn-700)" : "var(--fg2)" },
    { label: "TO PRINT", value: toPrintCount, sub: "approved and waiting", color: toPrintCount ? "var(--brand-600)" : "var(--fg2)" },
    { label: "CLASSES RUNNING", value: classes.length, sub: "across all centres and online", color: "var(--fg1)" },
    { label: "STUDENTS ENROLLED", value: students.length, sub: "active this term", color: "var(--fg1)" },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* Safeguarding sits above everything. It is the one thing on this page
          that cannot wait until after lunch. */}
      {openFlags.length > 0 && (
        <div
          className="glass-card ev-wrap-row"
          style={{
            gridColumn: "span 12",
            padding: "16px 20px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 14,
            border: "1px solid rgba(224,65,65,.3)",
            background: "rgba(224,65,65,.06)",
            animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards",
          }}
        >
          <span style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(224,65,65,.12)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon path={IC.alert} size={18} style={{ color: "var(--danger-500)" }} />
          </span>
          <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>
              {openFlags.length === 1 ? "1 flagged message needs a person" : openFlags.length + " flagged messages need a person"}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 2 }}>
              {openFlags.map((f) => f.student).join(", ")} · delivered to the tutor and escalated to you.
            </span>
          </span>
          <Link href="/admin/safeguarding" className="btn-primary press ev-tap-h ev-wrap-cta" style={{ height: 38, padding: "0 16px", borderRadius: 11, fontSize: 12.5, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", background: "var(--danger-500)" }}>
            Open safeguarding
          </Link>
        </div>
      )}

      {stats.map((s, i) => (
        <div key={s.label} className="glass-stat" style={{ gridColumn: "span 3", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.1 + i * 0.04}s backwards` }}>
          <div className="glass-stat-label">{s.label}</div>
          <div className="glass-stat-value" style={{ color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>{s.sub}</div>
        </div>
      ))}

      {/* APPROVE FROM HERE. The office should not have to open another page to
          clear a straightforward request. */}
      <div className="glass-card" style={{ gridColumn: "span 8", alignSelf: "start", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .26s backwards" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>Waiting on your approval</h2>
          <span className="ev-spacer-flex" style={{ flex: 1 }} />
          <Link href="/admin/approvals" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-teal)", textDecoration: "none" }} className="ev-tap-link">
            Open approvals
          </Link>
        </div>

        {pending.length === 0 && (
          <div style={{ padding: "22px 4px", textAlign: "center", fontSize: 12.5, color: "var(--fg4)" }}>
            Nothing waiting. Every request tutors have sent has a decision on it.
          </div>
        )}

        {pending.map((r) => (
          <div key={r.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.07)" }}>
            <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{r.classText}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--fg3)", marginTop: 3, lineHeight: 1.5 }}>
                {r.items.map((i) => i.name + " x" + i.qty).join(", ")}
              </span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>
                {r.ref} · {r.date} · {r.printer} · {copies(r)} copies
              </span>
            </span>
            <span className="ev-wrap-cta" style={{ display: "flex", gap: 8, flex: "none" }}>
              <button onClick={() => setApproval(r.id, "approved")} className="btn-primary press ev-tap-h" style={{ height: 36, padding: "0 15px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                Approve
              </button>
              <Link href="/admin/approvals" className="btn-ghost press ev-tap-h" style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", color: "var(--fg2)" }}>
                Review
              </Link>
            </span>
          </div>
        ))}
      </div>

      {/* PIPELINE HEALTH */}
      <div className="glass-card" style={{ gridColumn: "span 4", alignSelf: "start", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .3s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Print pipeline</h2>
        <p style={{ margin: "0 0 12px", fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.5 }}>Every print job this term, by where it has got to.</p>
        {(
          [
            { label: "Pending approval", n: printJobs.filter((r) => r.approval === "pending").length, meta: APPROVAL_META.pending },
            { label: "Approved, not printed", n: toPrintCount, meta: { color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" } },
            { label: "Printed", n: printJobs.filter((r) => r.printing === "completed").length, meta: PRINTING_META.completed },
            { label: "Rejected", n: printJobs.filter((r) => r.approval === "rejected").length, meta: APPROVAL_META.rejected },
            { label: "Failed at the printer", n: failed.length, meta: PRINTING_META.failed },
          ] as { label: string; n: number; meta: { color: string; bg: string } }[]
        ).map((row) => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid rgba(0,32,63,.07)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.meta.color, flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--fg2)" }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: row.meta.color, flex: "none" }}>{row.n}</span>
          </div>
        ))}
      </div>

      {/* CLASSES TODAY */}
      <div className="glass-card" style={{ gridColumn: "span 7", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .34s backwards" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>Classes and capacity</h2>
          <span className="ev-spacer-flex" style={{ flex: 1 }} />
          <Link href="/admin/classes" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-teal)", textDecoration: "none" }} className="ev-tap-link">
            All classes
          </Link>
        </div>
        {classes.slice(0, 5).map((c) => {
          const full = c.students / c.capacity;
          return (
            <div key={c.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.07)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.colour, flex: "none" }} />
              <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{c.name}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                  {c.tutorName} · {c.sched} · {c.centre}
                </span>
              </span>
              <span className="ev-row-end" style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: DELIVERY_META[c.delivery].color, background: DELIVERY_META[c.delivery].bg, padding: "3px 9px", borderRadius: 980 }}>
                  {DELIVERY_META[c.delivery].short}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: full >= 1 ? "var(--danger-500)" : full > 0.8 ? "var(--warn-700)" : "var(--fg3)" }}>
                  {c.students}/{c.capacity}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* FILE OVERSIGHT */}
      <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .38s backwards" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>Files shared recently</h2>
          <span className="ev-spacer-flex" style={{ flex: 1 }} />
          <Link href="/admin/files" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-teal)", textDecoration: "none" }} className="ev-tap-link">
            All files
          </Link>
        </div>
        {sharedFiles.slice(0, 4).map((f) => (
          <div key={f.id} style={{ padding: "10px 0", borderTop: "1px solid rgba(0,32,63,.07)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{f.file}</div>
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>
              {f.from} to {f.to} · {f.when}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 12, lineHeight: 1.5 }}>
          Tutors are told the office can see every file they share, so this list holds no surprises for them.
        </div>
      </div>

      {/* STAFF */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .42s backwards" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>Tutors on the roster</h2>
          <span className="ev-spacer-flex" style={{ flex: 1 }} />
          <Link href="/admin/tutors" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-teal)", textDecoration: "none" }} className="ev-tap-link">
            Manage tutors
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
          {STAFF.map((s) => (
            <div key={s.id} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.6)", padding: "12px 13px", display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: s.colour, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                {s.initials}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{s.name}</span>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)", marginTop: 2 }}>
                  {s.status === "on_leave" ? "On leave" : s.duties === "both" ? "In person and online" : s.duties === "online" ? "Online only" : "In person only"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
