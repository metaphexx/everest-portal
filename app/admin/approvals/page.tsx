// Booklet requests: the queue that decides whether a class gets its materials.
//
// Three things drive the design:
//
// 1. THE CENTRE IS THE FIRST THING YOU NEED. Which print room a job belongs to
//    decides who does it and by when, so every card carries its centre as a
//    coloured spine and a chip, and the same colour is used on the calendar and
//    in the table. You can sort the pile by colour without reading a word.
// 2. CARDS BY DEFAULT, TABLE ON DEMAND. A card holds the whole request, so the
//    office can decide without opening anything. The table is for scanning
//    forty of them, so it is one button away and remembered.
// 3. THE CALENDAR IS PART OF THE QUEUE. "What is running on Tuesday and is it
//    covered" is the same question as "what should I approve first".

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { useRole } from "@/lib/admin-role";
import { Icon } from "@/components/ui/Icon";
import { APPROVAL_META, BookletRequest, DEFAULT_FORMAT, PRINTING_META, centreOfPrinter } from "@/lib/tutor-data";
import { allSessions, centreStyle, needsRequest } from "@/lib/admin-schedule";
import { DayList, MonthCalendar } from "@/components/admin/MonthCalendar";
import { RequestDetail } from "@/components/admin/RequestDetail";
import { Column, MasterTable } from "@/components/admin/MasterTable";

const IC = {
  cards: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  table: "M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z",
  printer: "M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-3 11H8v-5h8v5Zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1-9H6v4h12V3Z",
};

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { id: Filter; label: string; colour: string }[] = [
  { id: "pending", label: "Waiting", colour: "var(--warn-500)" },
  { id: "approved", label: "Approved", colour: "var(--success-500)" },
  { id: "rejected", label: "Rejected", colour: "var(--danger-500)" },
  { id: "all", label: "All", colour: "var(--fg4)" },
];

export default function AdminApprovals() {
  const { requests, setApproval, setPrinting, updateRequest, scheduled, notWired } = useAdmin();
  const isPrint = useRole() === "print";
  // The Admin role approves AND prints, so its queue opens on everything
  // actionable rather than on the pending slice alone.
  const [filter, setFilter] = useState<Filter>(isPrint ? "all" : "pending");
  const [centre, setCentre] = useState("All");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [day, setDay] = useState<string | null>(null);
  const [open, setOpen] = useState<BookletRequest | null>(null);

  const sessions = useMemo(() => allSessions(scheduled), [scheduled]);
  const jobs = useMemo(() => requests.filter((r) => (r.delivery ?? "print") === "print"), [requests]);

  const centreOf = (r: BookletRequest) => centreOfPrinter(r.printer);
  const centres = useMemo(() => ["All", ...new Set(jobs.map(centreOf))], [jobs]);

  const shown = useMemo(
    () =>
      jobs.filter((r) => {
        if (filter !== "all" && r.approval !== filter) return false;
        if (centre !== "All" && centreOf(r) !== centre) return false;
        // A day on the calendar filters the queue to that day's classes.
        if (day) {
          const ids = new Set(sessions.filter((s) => s.k === day).map((s) => s.id));
          if (!r.classId || !ids.has(r.classId)) return false;
        }
        return true;
      }),
    [jobs, filter, centre, day, sessions]
  );

  const count = (f: Filter) => (f === "all" ? jobs.length : jobs.filter((r) => r.approval === f).length);
  const total = jobs.length || 1;

  const cols: Column<BookletRequest>[] = [
    {
      key: "c",
      label: "Class",
      render: (r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: centreStyle(centreOf(r)).colour, flex: "none" }} />
          <strong style={{ fontWeight: 700 }}>{r.classText}</strong>
        </span>
      ),
      text: (r) => r.classText,
      width: 240,
    },
    { key: "ce", label: "Centre", render: (r) => centreOf(r), text: (r) => centreOf(r) },
    { key: "b", label: "Booklets", render: (r) => r.items.map((i) => i.name).join(", "), text: (r) => r.items.map((i) => i.name).join(" "), width: 250 },
    { key: "n", label: "Copies", render: (r) => r.items.reduce((n, i) => n + i.qty, 0), text: (r) => String(r.items.reduce((n, i) => n + i.qty, 0)) },
    { key: "d", label: "Requested", render: (r) => (<><span>{r.date}</span>{r.time && <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.time}</span>}</>), text: (r) => r.date + " " + (r.time ?? ""), minor: true },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* ---- the numbers, as proportions rather than four bare figures ---- */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "18px 20px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", background: "rgba(0,32,63,.07)", marginBottom: 12 }}>
          {FILTERS.filter((f) => f.id !== "all").map((f) => {
            const n = count(f.id);
            return n > 0 ? <span key={f.id} title={f.label + ": " + n} style={{ width: (n / total) * 100 + "%", background: f.colour }} /> : null;
          })}
        </div>
        <div className="ev-scroll-x" style={{ display: "flex", gap: 8 }}>
          {FILTERS.map((f) => {
            const on = filter === f.id;
            const n = count(f.id);
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={on}
                className="press ev-tap-h"
                style={{
                  height: 56,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: on ? "1.5px solid " + f.colour : "1.5px solid rgba(0,32,63,.08)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: on ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.6)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  gap: 1,
                  whiteSpace: "nowrap",
                  minWidth: 104,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>{f.label.toUpperCase()}</span>
                <span style={{ fontSize: 19, fontWeight: 800, color: on ? f.colour : "var(--fg1)", lineHeight: 1.1 }}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- calendar, so a day can drive the queue ---- */}
      <div className="glass-card" style={{ gridColumn: "span 7", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <MonthCalendar
          sessions={sessions}
          selected={day}
          onSelect={(k) => {
            setDay(k);
            // Picking a day means "show me that day's requests" - and most days'
            // requests already have a decision on them, so a queue still locked
            // to Pending would sit empty under a day badged "Booklets approved".
            // Widen to every status; the chips still narrow it after.
            if (k) setFilter("all");
          }}
        />
      </div>
      <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .08s backwards" }}>
        <DayList
          dayKey={day}
          sessions={sessions}
          onOpenRequest={(s) => {
            const m = requests.find((r) => r.classId === s.id);
            if (m) setOpen(m);
          }}
          emptyHint="Pick a day to see the classes running then, whether their booklets have been requested, and to filter the queue below to that day."
        />
      </div>

      {/* ---- view + centre controls ---- */}
      <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "14px 18px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) .1s backwards" }}>
        <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <select value={centre} onChange={(e) => setCentre(e.target.value)} className="field" style={{ height: 42, width: "auto", minWidth: 180, boxSizing: "border-box" }} aria-label="Filter by centre">
            {centres.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All centres" : c}
              </option>
            ))}
          </select>
          {day && (
            <button onClick={() => setDay(null)} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 14px", borderRadius: 11, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}>
              Clear {new Date(day + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
            </button>
          )}
        </span>
        <span className="ev-wrap-cta glass-control" style={{ display: "flex", gap: 2, padding: 4, borderRadius: 12, height: 42, boxSizing: "border-box", flex: "none" }}>
          {([
            { id: "cards", label: "Cards", icon: IC.cards },
            { id: "table", label: "Table", icon: IC.table },
          ] as const).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              className="press"
              style={{ height: 34, padding: "0 13px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7, background: view === v.id ? "var(--accent-teal)" : "transparent", color: view === v.id ? "#fff" : "var(--fg3)" }}
            >
              <Icon path={v.icon} size={13} />
              {v.label}
            </button>
          ))}
        </span>
      </div>

      {shown.length === 0 && (
        <div className="glass-card" style={{ gridColumn: "span 12", padding: "34px 22px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>
            {filter === "pending" && centre === "All" && !day ? "Nothing waiting on you" : "No requests match"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>
            {filter === "pending" && centre === "All" && !day ? "Every request a tutor has sent has a decision on it." : day ? "No booklet requests were made for this day\u2019s classes." : "Try another centre or status."}
          </div>
        </div>
      )}

      {/* ---- TABLE VIEW ---- */}
      {view === "table" && shown.length > 0 && (
        <MasterTable
          rows={shown}
          columns={cols}
          idOf={(r) => r.id}
          statusOf={(r) => APPROVAL_META[r.approval]}
          searchHint="Search by class, booklet, centre or reference"
          onEdit={(r) => setOpen(r)}
          onExport={() => notWired("Export")}
          emptyTitle="No requests"
          emptyBody="Requests from tutors land here."
          pageSize={12}
        />
      )}

      {/* ---- CARD VIEW ---- */}
      {view === "cards" &&
        shown.map((r, i) => {
          const cs = centreStyle(centreOf(r));
          const fmt = { ...DEFAULT_FORMAT, ...r.format };
          const copies = r.items.reduce((n, it) => n + it.qty, 0);
          const meta = APPROVAL_META[r.approval];
          return (
            <div
              key={r.id}
              className="glass-card"
              style={{
                gridColumn: "span 6",
                padding: 0,
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.1 + i * 0.03}s backwards`,
              }}
            >
              {/* The centre spine: the fastest way to sort a pile of these. */}
              <span style={{ flex: "none", width: 6, background: cs.colour }} />
              <div style={{ flex: 1, minWidth: 0, padding: "16px 18px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 9, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: cs.colour, background: cs.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>
                    {centreOf(r).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: meta.color, background: meta.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{meta.label}</span>
                  {r.approval === "approved" && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: PRINTING_META[r.printing].color, background: PRINTING_META[r.printing].bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>
                      {PRINTING_META[r.printing].label}
                    </span>
                  )}
                </div>

                <div style={{ fontFamily: "var(--font-display)", fontSize: 15.5, fontWeight: 800, lineHeight: 1.3 }}>{r.classText}</div>
                <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>
                  {r.ref} · {r.date}
                  {r.time ? " at " + r.time : ""}
                </div>

                <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 12, background: "rgba(255,255,255,.6)", padding: "10px 12px", marginTop: 11 }}>
                  {r.items.map((it) => (
                    <div key={it.itemId} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "3px 0" }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{it.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--fg2)", flex: "none" }}>x{it.qty}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(0,32,63,.07)", marginTop: 6, paddingTop: 6, fontSize: 11.5, color: "var(--fg3)" }}>
                    {copies} copies · {r.yearLevel} {r.subject}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10 }}>
                  <Icon path={IC.printer} size={14} style={{ color: "var(--fg4)", flex: "none", marginTop: 2 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: "var(--fg3)", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--fg2)", fontWeight: 700 }}>{r.printer}</strong>
                    <br />
                    {[fmt.paper, fmt.sides, fmt.colour, fmt.scale, fmt.staple, fmt.perSheet].filter(Boolean).join(" · ")}
                  </span>
                </div>

                {r.remark && <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 9, fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{r.remark}&rdquo;</div>}

                {/* The next action for this job, whichever stage it is at: a
                    decision while pending, then the printing itself. */}
                <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 14, flexWrap: "wrap" }}>
                  {r.approval === "pending" ? (
                    <>
                      <button onClick={() => setApproval(r.id, "approved")} className="btn-primary press ev-tap-h" style={{ height: 38, padding: "0 16px", borderRadius: 11, fontSize: 12, fontWeight: 700 }}>
                        Approve
                      </button>
                      <button onClick={() => setOpen(r)} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 14px", borderRadius: 11, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}>
                        Open and edit
                      </button>
                    </>
                  ) : r.approval === "approved" && r.printing === "not_started" ? (
                    <>
                      <button onClick={() => setPrinting(r.id, "completed")} className="btn-primary press ev-tap-h" style={{ height: 38, padding: "0 16px", borderRadius: 11, fontSize: 12, fontWeight: 700 }}>
                        Mark as printed
                      </button>
                      <button onClick={() => setOpen(r)} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 14px", borderRadius: 11, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}>
                        Open
                      </button>
                    </>
                  ) : r.approval === "approved" && r.printing === "failed" ? (
                    <>
                      <button onClick={() => setPrinting(r.id, "not_started")} className="btn-soft press ev-tap-h" style={{ height: 38, padding: "0 16px", borderRadius: 11, fontSize: 12, fontWeight: 700 }}>
                        Back to the print queue
                      </button>
                      <button onClick={() => setOpen(r)} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 14px", borderRadius: 11, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}>
                        Open
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setOpen(r)} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 14px", borderRadius: 11, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}>
                      Open the request
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

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
        onPrint={(id, printing) => {
          setPrinting(id, printing);
          setOpen(null);
        }}
        onUpdate={updateRequest}
      />
    </div>
  );
}
