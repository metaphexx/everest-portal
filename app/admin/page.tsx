// The office dashboard.
//
// The calendar leads, because the office's question is never "how many requests
// are there", it is "what runs this week and is it covered". Picking a day fills
// the panel beside it with that day's classes, each saying whether its booklets
// have been requested. That is the job.
//
// No donuts. A three-slice ring makes the legend do all the reading; sorted bars
// carry the same numbers and can be read across a room.

import React, { useMemo, useState } from "react";
import Link from "@/components/ui/Link";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { SAFEGUARDING, STAFF, allClasses, allStudents } from "@/lib/admin-data";
import { AdminSession, allSessions, centreStyle, needsRequest } from "@/lib/admin-schedule";
import { DayList, MonthCalendar } from "@/components/admin/MonthCalendar";
import { RequestDetail } from "@/components/admin/RequestDetail";
import { BookletRequest } from "@/lib/tutor-data";

const IC = {
  alert: "M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-6h-2v4h2v-4Z",
};

/** A labelled horizontal bar. Used for both breakdowns on this page. */
function Bar({ label, n, max, colour, note }: { label: string; n: number; max: number; colour: string; note?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
      <span style={{ flex: "0 1 190px", minWidth: 0, fontSize: 12, color: "var(--fg2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>
        {label}
      </span>
      <span style={{ flex: 1, minWidth: 50, height: 9, borderRadius: 5, background: "rgba(0,32,63,.07)", overflow: "hidden" }}>
        <span style={{ display: "block", width: (max > 0 ? Math.max(3, Math.round((n / max) * 100)) : 0) + "%", height: "100%", borderRadius: 5, background: colour, transition: "width .3s ease" }} />
      </span>
      <span style={{ flex: "none", fontSize: 12.5, fontWeight: 800, color: "var(--fg1)", minWidth: 30, textAlign: "right" }}>{n}</span>
      {note && <span style={{ flex: "none", fontSize: 11, color: "var(--fg4)", minWidth: 44 }}>{note}</span>}
    </div>
  );
}

export default function AdminDashboard() {
  const { requests, pendingCount, toPrintCount, setApproval, updateRequest, scheduled } = useAdmin();
  const [day, setDay] = useState<string | null>("2026-07-02");
  const [open, setOpen] = useState<BookletRequest | null>(null);

  const classes = useMemo(() => allClasses(), []);
  const students = useMemo(() => allStudents(), []);
  const sessions = useMemo(() => allSessions(scheduled), [scheduled]);
  const openFlags = SAFEGUARDING.filter((f) => f.status === "open");

  const printJobs = requests.filter((r) => (r.delivery ?? "print") === "print");
  const pending = printJobs.filter((r) => r.approval === "pending");

  // Sessions in the next fortnight whose booklets nobody has requested.
  const gaps = sessions.filter((s) => needsRequest(s) && s.k >= "2026-07-02" && s.k <= "2026-07-16");

  const stats = [
    { label: "TUTORS", value: STAFF.length, sub: STAFF.filter((s) => s.status === "active").length + " active this term", color: "var(--fg1)" },
    { label: "CLASSES ASSIGNED", value: classes.length, sub: "across all centres and online", color: "var(--fg1)" },
    { label: "STUDENTS", value: students.length, sub: "enrolled this term", color: "var(--fg1)" },
    { label: "BOOKLET REQUESTS", value: printJobs.length, sub: pendingCount + " waiting on you", color: pendingCount ? "var(--warn-700)" : "var(--fg1)" },
  ];

  // Copies requested per subject, biggest first. Derived from the live requests,
  // so the bars can never disagree with the queue.
  const subjects = useMemo(() => {
    const tally = new Map<string, number>();
    for (const r of printJobs) tally.set(r.yearLevel + " " + r.subject, (tally.get(r.yearLevel + " " + r.subject) ?? 0) + r.items.reduce((n, i) => n + i.qty, 0));
    return [...tally.entries()].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n).slice(0, 6);
  }, [printJobs]);

  // The pipeline as a single stacked bar plus a legend, so the proportions and
  // the counts are both readable.
  const pipeline = [
    { label: "Waiting on approval", n: printJobs.filter((r) => r.approval === "pending").length, colour: "var(--warn-500)" },
    { label: "Approved, not printed", n: toPrintCount, colour: "var(--brand-500)" },
    { label: "Printed", n: printJobs.filter((r) => r.printing === "completed").length, colour: "var(--success-500)" },
    { label: "Failed at the printer", n: printJobs.filter((r) => r.printing === "failed").length, colour: "var(--danger-500)" },
    { label: "Rejected", n: printJobs.filter((r) => r.approval === "rejected").length, colour: "var(--fg5-decorative)" },
  ];
  const total = pipeline.reduce((n, p) => n + p.n, 0);

  const openRequestFor = (s: AdminSession) => {
    const match = requests.find((r) => r.classId === s.id) ?? null;
    if (match) setOpen(match);
  };

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {openFlags.length > 0 && (
        <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "14px 20px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14, border: "1px solid rgba(224,65,65,.3)", background: "rgba(224,65,65,.06)", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(224,65,65,.12)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon path={IC.alert} size={16} style={{ color: "var(--danger-500)" }} />
          </span>
          <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0, fontSize: 12.5, fontWeight: 700 }}>
            {openFlags.length === 1 ? "1 flagged message needs a person" : openFlags.length + " flagged messages need a person"}
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--fg3)", marginTop: 2 }}>{openFlags.map((f) => f.student).join(", ")}</span>
          </span>
          <Link href="/admin/safeguarding" className="press ev-tap-h ev-wrap-cta" style={{ height: 36, padding: "0 15px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", background: "var(--danger-500)", color: "#fff" }}>
            Open safeguarding
          </Link>
        </div>
      )}

      {/* ---- CALENDAR FIRST ---- */}
      <div className="glass-card" style={{ gridColumn: "span 7", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .04s backwards" }}>
        <MonthCalendar sessions={sessions} selected={day} onSelect={setDay} />
      </div>

      <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .08s backwards", display: "flex", flexDirection: "column" }}>
        <DayList dayKey={day} sessions={sessions} onOpenRequest={openRequestFor} />
        <div style={{ marginTop: "auto", paddingTop: 14 }}>
          <Link href="/admin/schedule" className="btn-soft press ev-tap-h" style={{ height: 40, borderRadius: 11, fontSize: 12.5, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Open the full schedule
          </Link>
        </div>
      </div>

      {/* Classes running soon with nothing requested. This is the line that
          stops a Tuesday class turning up to no booklets. */}
      {gaps.length > 0 && (
        <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "14px 20px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14, border: "1px solid rgba(245,166,35,.4)", background: "rgba(245,166,35,.07)", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .1s backwards" }}>
          <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0, fontSize: 12.5, fontWeight: 700 }}>
            {gaps.length} in-person class{gaps.length === 1 ? " has" : "es have"} no booklet request in the next fortnight
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "var(--fg3)", marginTop: 2 }}>
              {gaps.slice(0, 3).map((g) => g.className + " on " + new Date(g.k + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })).join(", ")}
              {gaps.length > 3 ? " and " + (gaps.length - 3) + " more" : ""}
            </span>
          </span>
          <Link href="/admin/approvals" className="btn-ghost press ev-tap-h ev-wrap-cta" style={{ height: 36, padding: "0 15px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", color: "var(--fg2)" }}>
            Chase the tutors
          </Link>
        </div>
      )}

      {stats.map((s, i) => (
        <div key={s.label} className="glass-stat" style={{ gridColumn: "span 3", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.12 + i * 0.04}s backwards` }}>
          <div className="glass-stat-label">{s.label}</div>
          <div className="glass-stat-value" style={{ color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>{s.sub}</div>
        </div>
      ))}

      {/* ---- WAITING ON APPROVAL ---- */}
      <div className="glass-card" style={{ gridColumn: "span 7", alignSelf: "start", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .28s backwards" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>Waiting on your approval</h2>
          <span className="ev-spacer-flex" style={{ flex: 1 }} />
          <Link href="/admin/approvals" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-teal)", textDecoration: "none" }} className="ev-tap-link">
            Open booklet requests
          </Link>
        </div>
        {pending.length === 0 && <div style={{ padding: "20px 4px", textAlign: "center", fontSize: 12.5, color: "var(--fg4)" }}>Nothing waiting. Every request has a decision on it.</div>}
        {pending.map((r) => {
          const cs = centreStyle(r.printer.startsWith("Harrisdale") ? "Harrisdale SHS" : r.printer.startsWith("Piara") ? "Piara Waters" : "Head office");
          return (
            <div key={r.id} className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.07)" }}>
              <span style={{ flex: "none", width: 4, alignSelf: "stretch", borderRadius: 2, background: cs.colour }} />
              <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{r.classText}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>
                  {r.items.reduce((n, i) => n + i.qty, 0)} copies · {r.printer} · {r.date}
                </span>
              </span>
              <span className="ev-wrap-cta" style={{ display: "flex", gap: 8, flex: "none" }}>
                <button onClick={() => setOpen(r)} className="btn-ghost press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
                  Open
                </button>
                <button onClick={() => setApproval(r.id, "approved")} className="btn-primary press ev-tap-h" style={{ height: 34, padding: "0 14px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
                  Approve
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {/* ---- PRINT PIPELINE, as one stacked bar ---- */}
      <div className="glass-card" style={{ gridColumn: "span 5", alignSelf: "start", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .32s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Print pipeline</h2>
        <p style={{ margin: "0 0 12px", fontSize: 11.5, color: "var(--fg3)" }}>Every print job this term, by where it has got to.</p>
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", background: "rgba(0,32,63,.07)" }}>
          {pipeline.map((p) => (p.n > 0 ? <span key={p.label} title={p.label + ": " + p.n} style={{ width: (p.n / total) * 100 + "%", background: p.colour }} /> : null))}
        </div>
        <div style={{ marginTop: 12 }}>
          {pipeline.map((p) => (
            <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: p.colour, flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--fg2)" }}>{p.label}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--fg1)", flex: "none" }}>{p.n}</span>
              <span style={{ fontSize: 11, color: "var(--fg4)", flex: "none", minWidth: 34, textAlign: "right" }}>{total ? Math.round((p.n / total) * 100) + "%" : "0%"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- MOST REQUESTED SUBJECTS ---- */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .38s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 4px" }}>Most requested subjects</h2>
        <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--fg3)" }}>Copies requested this term, so you can see what to keep in stock.</p>
        {subjects.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "10px 0" }}>Nothing requested yet this term.</div>}
        {subjects.map((s) => (
          <Bar key={s.label} label={s.label} n={s.n} max={subjects[0].n} colour="var(--accent-teal)" note="copies" />
        ))}
      </div>

      <RequestDetail
        request={open}
        onClose={() => setOpen(null)}
        onApprove={(id, note) => {
          setApproval(id, "approved", note || undefined);
          setOpen(null);
        }}
        onReject={(id, reason) => {
          setApproval(id, "rejected", reason);
          setOpen(null);
        }}
        onUpdate={updateRequest}
      />
    </div>
  );
}
