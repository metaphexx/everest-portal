// Waitlist.
//
// The live version is a flat table with a Priority column and nothing that
// answers the only two questions the office actually has: who has been waiting
// longest, and which class is short of a seat. So this page leads with the
// pressure - subjects with people waiting, ranked - and marks anyone who has
// been waiting more than a fortnight, because that is the family that rings up
// annoyed.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Column, MasterTable, PILL } from "@/components/admin/MasterTable";
import { PRIORITY_META, WAITLIST, WaitlistEntry, daysWaiting } from "@/lib/admin-pricing";
import { allClasses } from "@/lib/admin-data";
import { isBlock, slotsFor } from "@/lib/block";

const STALE_DAYS = 14;

const STATUS_PILL: Record<WaitlistEntry["status"], { label: string; color: string; bg: string }> = {
  waiting: { label: "Waiting", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  offered: { label: "Offered", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
  enrolled: { label: "Enrolled", color: "var(--success-700)", bg: "rgba(34,160,91,.14)" },
  declined: { label: "Declined", color: "var(--fg4)", bg: "rgba(0,32,63,.06)" },
};

export default function AdminWaitlist() {
  const { notWired } = useAdmin();
  const [only, setOnly] = useState<"all" | "waiting">("waiting");

  const rows = useMemo(() => {
    const list = only === "waiting" ? WAITLIST.filter((w) => w.status === "waiting" || w.status === "offered") : WAITLIST;
    // Longest wait first: a queue that is not ordered by wait is not a queue.
    return [...list].sort((a, b) => (a.added < b.added ? -1 : 1));
  }, [only]);

  // Demand by subject, so the office can see which class to open next.
  const demand = useMemo(() => {
    const m = new Map<string, { subject: string; n: number; seats: number }>();
    for (const w of WAITLIST) {
      if (w.status !== "waiting") continue;
      const cur = m.get(w.subject) ?? { subject: w.subject, n: 0, seats: 0 };
      cur.n += 1;
      m.set(w.subject, cur);
    }
    for (const entry of m.values()) {
      const want = entry.subject.toLowerCase();
      // A block does not carry the subject in its class name - "Year 8 Core
      // Block" teaches Year 8 Science in its second slot - so a plain name
      // match reports "no seats" for a class that has one. Seats on a block are
      // counted per slot, because that is the roster being joined.
      entry.seats = allClasses().reduce((n, c) => {
        if (isBlock(c.id)) {
          const slot = slotsFor(c.id).find((sl) => (c.year + " " + sl.subject).toLowerCase() === want);
          return slot ? n + Math.max(0, c.capacity - slot.students.length) : n;
        }
        return c.name.toLowerCase().includes(want) ? n + Math.max(0, c.capacity - c.students) : n;
      }, 0);
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, []);

  const waiting = WAITLIST.filter((w) => w.status === "waiting").length;
  const stale = WAITLIST.filter((w) => w.status === "waiting" && daysWaiting(w.added) > STALE_DAYS).length;

  const cols: Column<WaitlistEntry>[] = [
    { key: "s", label: "Student", render: (r) => (<><strong style={{ fontWeight: 700 }}>{r.student}</strong><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.year} · {r.centre}</span></>), text: (r) => r.student + " " + r.year + " " + r.centre, width: 190 },
    { key: "sub", label: "Waiting for", render: (r) => (<><span>{r.subject}</span><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.term}</span></>), text: (r) => r.subject + " " + r.term, width: 190 },
    {
      key: "w",
      label: "Waiting",
      render: (r) => {
        const d = daysWaiting(r.added);
        const late = r.status === "waiting" && d > STALE_DAYS;
        return (
          <span style={{ fontWeight: 700, color: late ? "var(--danger-500)" : "var(--fg2)" }}>
            {d} day{d === 1 ? "" : "s"}
            {late && <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--danger-500)" }}>Chase this one</span>}
          </span>
        );
      },
      text: (r) => String(daysWaiting(r.added)),
    },
    {
      key: "p",
      label: "Priority",
      render: (r) => {
        const m = PRIORITY_META[r.priority];
        return <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color, background: m.bg, padding: "3px 9px", borderRadius: 980 }}>{m.label}</span>;
      },
      text: (r) => r.priority,
    },
    { key: "c", label: "Parent", render: (r) => (<><span>{r.parent}</span><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.phone}</span></>), text: (r) => r.parent + " " + r.phone + " " + r.email, width: 190, minor: true },
    { key: "n", label: "Note", render: (r) => (r.note ? r.note : <span style={{ color: "var(--fg4)" }}>None</span>), text: (r) => r.note, width: 240, minor: true },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "18px 20px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 3px" }}>Where the pressure is</h2>
        <p style={{ margin: "0 0 14px", fontSize: 11.5, color: "var(--fg4)" }}>
          {waiting} famil{waiting === 1 ? "y is" : "ies are"} waiting
          {stale > 0 && (
            <>
              {" "}· <strong style={{ color: "var(--danger-500)" }}>{stale} of them for more than a fortnight</strong>
            </>
          )}
        </p>

        {demand.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "8px 0" }}>Nobody is waiting for a seat.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
            {demand.map((d) => (
              <div key={d.subject} style={{ borderRadius: 13, padding: "12px 14px", background: "rgba(255,255,255,.72)", border: "1px solid rgba(0,32,63,.07)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{d.subject}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 5 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--warn-700)" }}>{d.n}</span>
                  <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>waiting</span>
                </div>
                {/* Seats free is the deciding number: people waiting on a class
                    that has room is an admin problem, not a capacity one. */}
                <div style={{ fontSize: 11.5, marginTop: 4, color: d.seats > 0 ? "var(--success-700)" : "var(--fg4)" }}>
                  {d.seats > 0 ? d.seats + " seat" + (d.seats === 1 ? "" : "s") + " free right now - place them" : "No seats free, a new class is needed"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {([
            { id: "waiting", label: "Still open" },
            { id: "all", label: "Everyone" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setOnly(t.id)}
              aria-pressed={only === t.id}
              className="press ev-tap-h"
              style={{ height: 36, padding: "0 15px", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, background: only === t.id ? "var(--brand-500)" : "rgba(0,32,63,.05)", color: only === t.id ? "#fff" : "var(--fg3)" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <MasterTable
          rows={rows}
          columns={cols}
          idOf={(r) => r.id}
          statusOf={(r) => {
            const m = STATUS_PILL[r.status];
            return { label: m.label, color: m.color, bg: m.bg };
          }}
          searchHint="Search by student, parent, subject or centre"
          addLabel="Add to the waitlist"
          onAdd={() => notWired("Add a waitlist entry")}
          onEdit={() => notWired("Edit this waitlist entry")}
          onDelete={() => notWired("Remove from the waitlist")}
          emptyTitle="Nobody is waiting"
          emptyBody="Families added here when a class is full show up on this list until they are placed."
        />
      </div>
    </div>
  );
}
