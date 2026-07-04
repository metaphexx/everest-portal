"use client";

import React, { useState } from "react";
import { BookletRequest, TutorCourseId } from "@/lib/tutor-data";
import { BOOKLET_SERIES_COLORS, BookletTrackerMode, bookletSeries } from "@/lib/booklet-stats";
import { LineChart } from "@/components/ui/LineChart";

const COUNTERS: { key: "requested" | "approved" | "rejected" | "supplied"; label: string; color: string }[] = [
  { key: "requested", label: "Requested", color: BOOKLET_SERIES_COLORS.requested },
  { key: "approved", label: "Approved", color: BOOKLET_SERIES_COLORS.approved },
  { key: "rejected", label: "Rejected", color: BOOKLET_SERIES_COLORS.rejected },
  { key: "supplied", label: "Printed", color: BOOKLET_SERIES_COLORS.supplied },
];

/** Booklet tracker: four counters + an 8-week line chart of requested /
    approved / rejected / printed booklets, counted in individual copies.
    `courseId` scopes it to one in-person course; omit for the whole-practice
    view. */
export function BookletStatsPanel({
  requests,
  courseId,
  title = "Booklet tracker",
  subtitle,
  height = 200,
}: {
  requests: BookletRequest[];
  courseId?: TutorCourseId;
  title?: string;
  subtitle?: string;
  height?: number;
}) {
  const [mode, setMode] = useState<BookletTrackerMode>("cumulative");
  const s = bookletSeries(requests, courseId, mode);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15 }}>{title}</h2>
          {subtitle && <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{subtitle}</span>}
        </div>
        {/* daily (per-week) vs cumulative toggle */}
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "rgba(0,32,63,.05)", gap: 2 }}>
          {([["weekly", "Per week"], ["cumulative", "Cumulative"]] as [BookletTrackerMode, string][]).map(([m, label]) => {
            const on = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={on}
                style={{
                  height: 26,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: on ? "#fff" : "transparent",
                  color: on ? "var(--brand-600)" : "var(--fg3)",
                  boxShadow: on ? "0 2px 6px -3px rgba(0,32,63,.35)" : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8, margin: "10px 0 14px" }}>
        {COUNTERS.map((c) => (
          <div key={c.key} style={{ border: "1px solid rgba(0,32,63,.07)", borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flex: "none" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>{c.label.toUpperCase()}</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginTop: 4, color: c.color }}>{s.totals[c.key]}</div>
          </div>
        ))}
      </div>

      <LineChart
        height={height}
        labels={s.labels}
        series={[
          { label: "Requested", color: BOOKLET_SERIES_COLORS.requested, points: s.requested },
          { label: "Approved", color: BOOKLET_SERIES_COLORS.approved, points: s.approved },
          { label: "Rejected", color: BOOKLET_SERIES_COLORS.rejected, points: s.rejected },
          { label: "Printed", color: BOOKLET_SERIES_COLORS.supplied, points: s.supplied },
        ]}
      />
    </div>
  );
}
