import React, { useEffect, useRef, useState } from "react";

export interface LineSeries {
  label: string;
  color: string;
  points: number[];
}

/**
 * Small dependency-free multi-line SVG chart. The viewBox is matched to the
 * measured pixel size of the container (1:1), so the coordinate system scales
 * uniformly - no horizontal stretching of gridlines, dots or axis text. Caller
 * supplies aligned series (same length as `labels`) and colours. Used for the
 * booklet-stats trackers on the dashboard and each in-person course page.
 */
export function LineChart({
  series,
  labels,
  height = 200,
  yLabel,
}: {
  series: LineSeries[];
  labels: string[];
  height?: number;
  yLabel?: string;
}) {
  // Measure the container so the viewBox uses real pixel dimensions - a uniform
  // (undistorted) coordinate system rather than a stretched 720-wide one.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(720);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw && cw > 0) setW(Math.round(cw));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = Math.max(320, w);
  const H = height;
  const padL = 34;
  const padR = 14;
  const padT = 14;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const n = labels.length;
  const maxVal = Math.max(4, ...series.flatMap((s) => s.points));
  // "Nice" top: round up to a clean step so gridlines read well.
  const step = maxVal <= 8 ? 2 : maxVal <= 20 ? 5 : maxVal <= 50 ? 10 : 20;
  const top = Math.ceil(maxVal / step) * step;
  const rows = Math.max(1, Math.round(top / step));

  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const y = (v: number) => padT + plotH - (plotH * v) / top;

  const linePath = (pts: number[]) => pts.map((v, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");

  return (
    <div ref={wrapRef}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={"Line chart" + (yLabel ? ": " + yLabel : "")} style={{ display: "block" }}>
        {/* gridlines + y labels */}
        {Array.from({ length: rows + 1 }).map((_, r) => {
          const val = top - (top / rows) * r;
          const gy = padT + (plotH / rows) * r;
          return (
            <g key={r}>
              <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="rgba(0,32,63,.08)" strokeWidth={1} />
              <text x={padL - 6} y={gy + 3} textAnchor="end" fontSize={9} fill="var(--fg4)" fontFamily="var(--font-body)">{val}</text>
            </g>
          );
        })}
        {/* x labels */}
        {labels.map((lb, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="var(--fg4)" fontFamily="var(--font-body)">{lb}</text>
        ))}
        {/* series */}
        {series.map((s) => (
          <g key={s.label}>
            <path d={linePath(s.points)} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {s.points.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={2.6} fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
      {/* legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
        {series.map((s) => (
          <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--fg2)" }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: s.color, display: "inline-block" }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
