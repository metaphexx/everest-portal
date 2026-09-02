// The office calendar.
//
// It is the first thing on the dashboard because the office's real question is
// never "how many requests are there", it is "what runs this week and is it
// covered". A day carries a dot per centre, and any day with an in-person class
// that still has no booklet request is ringed in amber - that is the whole job,
// visible without clicking.
//
// Clicking a day fills the panel beside it. The panel is not a popover: on a
// phone a popover over a calendar is unreadable, and the list is the point.

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { AdminSession, centreStyle, monthKey, needsRequest } from "@/lib/admin-schedule";
import { BOOKLET_META } from "@/lib/tutor-data";

const IC = {
  prev: "M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6 4.6-4.6Z",
  next: "M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6Z",
};

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export function MonthCalendar({
  sessions,
  selected,
  onSelect,
  year: y0 = 2026,
  month: m0 = 6,
  today = "2026-07-02",
}: {
  sessions: AdminSession[];
  selected: string | null;
  onSelect: (k: string | null) => void;
  year?: number;
  month?: number;
  today?: string;
}) {
  const [cursor, setCursor] = useState({ y: y0, m: m0 });

  const byDay = useMemo(() => {
    const m = new Map<string, AdminSession[]>();
    for (const s of sessions) {
      if (!m.has(s.k)) m.set(s.k, []);
      m.get(s.k)!.push(s);
    }
    return m;
  }, [sessions]);

  const first = new Date(cursor.y, cursor.m, 1);
  // Monday-first grid, matching every other calendar in the product.
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const label = first.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  const step = (n: number) => {
    const d = new Date(cursor.y, cursor.m + n, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0, flex: 1, minWidth: 0 }}>
          {label}
        </h2>
        <button onClick={() => step(-1)} aria-label="Previous month" className="mini-nav btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg2)" }}>
          <Icon path={IC.prev} size={15} />
        </button>
        <button onClick={() => step(1)} aria-label="Next month" className="mini-nav btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg2)" }}>
          <Icon path={IC.next} size={15} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "var(--fg4)", padding: "2px 0 6px" }}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={"e" + i} />;
          const k = monthKey(cursor.y, cursor.m, d);
          const list = byDay.get(k) ?? [];
          const isToday = k === today;
          const isSel = k === selected;
          const gap = list.some(needsRequest);
          // One dot per centre, not per class, or a busy Saturday is a smudge.
          const centres = [...new Set(list.map((s) => s.centre))];
          return (
            <button
              key={k}
              // Clicking a day always selects it. This used to toggle, which
              // read as broken on pages that preselect today: clicking the
              // highlighted day blanked the panel beside it. Deselection is an
              // explicit control (the Clear button) where a page needs one.
              onClick={() => onSelect(k)}
              aria-label={d + " " + label + (list.length ? ", " + list.length + " classes" : ", no classes")}
              aria-pressed={isSel}
              className="press"
              style={{
                minHeight: 46,
                borderRadius: 10,
                border: gap && !isSel ? "1.5px solid rgba(245,166,35,.7)" : "1.5px solid transparent",
                background: isSel ? "var(--accent-teal)" : isToday ? "rgba(0,157,255,.12)" : list.length ? "rgba(255,255,255,.7)" : "transparent",
                color: isSel ? "#fff" : isToday ? "var(--brand-600)" : list.length ? "var(--fg1)" : "var(--fg4)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: isToday || isSel ? 800 : 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                padding: "5px 2px",
              }}
            >
              {d}
              <span style={{ display: "flex", gap: 2, height: 5 }}>
                {centres.slice(0, 4).map((c) => (
                  <span key={c} style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? "rgba(255,255,255,.9)" : centreStyle(c).colour }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, alignItems: "center" }}>
        {[...new Set(sessions.map((s) => s.centre))].map((c) => (
          <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--fg3)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: centreStyle(c).colour }} />
            {c}
          </span>
        ))}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--fg3)" }}>
          <span style={{ width: 11, height: 11, borderRadius: 4, border: "1.5px solid rgba(245,166,35,.8)" }} />
          Booklets not requested yet
        </span>
      </div>
    </div>
  );
}

/**
 * The list beside the calendar. Every row says whether its booklets have been
 * requested, because that is the reason the office opened the day.
 */
export function DayList({
  dayKey,
  sessions,
  onOpenRequest,
  emptyHint = "Pick a day on the calendar to see what runs and whether its booklets are covered.",
}: {
  dayKey: string | null;
  sessions: AdminSession[];
  onOpenRequest?: (s: AdminSession) => void;
  emptyHint?: string;
}) {
  const list = dayKey ? sessions.filter((s) => s.k === dayKey) : [];
  const heading = dayKey
    ? new Date(dayKey + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })
    : "No day selected";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, margin: 0 }}>{heading}</h2>
        {dayKey && (
          <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>
            {list.length === 0 ? "nothing scheduled" : list.length + (list.length === 1 ? " class" : " classes")}
          </span>
        )}
      </div>

      {!dayKey && <div style={{ fontSize: 12.5, color: "var(--fg4)", lineHeight: 1.6, paddingTop: 6 }}>{emptyHint}</div>}

      {dayKey && list.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", paddingTop: 8 }}>No classes run on this day.</div>}

      {list.map((s) => {
        const cs = centreStyle(s.centre);
        const gap = needsRequest(s);
        return (
          <div key={s.id} style={{ display: "flex", gap: 11, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.07)" }}>
            {/* The centre is the spine of the row, in its own colour. */}
            <span style={{ flex: "none", width: 4, borderRadius: 2, background: cs.colour }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 }}>{s.className}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                {s.time} · {s.tutor} · {s.centre} · {s.students} students
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 6, flexWrap: "wrap" }}>
                {/* The status pill uses the booklet colours from
                    DESIGN-FIDELITY section 3, so a class reads the same here as
                    its request does in the queue. It used to paint every state
                    green, which made "requested" - nobody has approved it yet -
                    look finished. */}
                {s.booklet === null ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.12)", padding: "3px 9px", borderRadius: 980 }}>Online, nothing to print</span>
                ) : gap ? (
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--warn-700)", background: "rgba(245,166,35,.18)", padding: "3px 9px", borderRadius: 980 }}>NO REQUEST YET</span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700, color: BOOKLET_META[s.booklet].color, background: BOOKLET_META[s.booklet].bg, padding: "3px 9px", borderRadius: 980 }}>
                    {s.booklet === "print_failed" ? "Print failed" : "Booklets " + BOOKLET_META[s.booklet].label.toLowerCase()}
                  </span>
                )}
                {onOpenRequest && !gap && s.booklet !== null && (
                  <button onClick={() => onOpenRequest(s)} className="btn-ghost press ev-tap-h" style={{ height: 28, padding: "0 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "var(--fg2)" }}>
                    Open request
                  </button>
                )}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
