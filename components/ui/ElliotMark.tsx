// Elliot's mark: the Everest peak with two sparkles, in the blue-to-pink
// gradient.
//
// Drawn as SVG rather than shipped as a PNG so it stays crisp at every size
// (14px in a message avatar, 56px in an empty state, 22px in the FAB) and needs
// no asset pipeline. The peak is the SAME path as the loading mark in
// components/ui/Loader.tsx, so the brand shape is defined once and the two can
// never drift apart.
//
// `tone`:
//   "gradient" (default) - blue to pink, for light surfaces
//   "solid"              - flat currentColor, for a coloured button or chip

import React from "react";

/** Shared with Loader.tsx - the Everest summit outline. */
const PEAK =
  "M305.1 0 L481.1 192 L530.3 160 L673.1 342.9 L734.9 337.1 L1000 628.6 L720 396.6 " +
  "L667.4 412.6 L526.9 234.3 L468.6 374.9 L310.9 501.7 L347.4 362.3 L289.1 337.1 " +
  "L438.9 211.4 L304 77.7 L267.4 195.4 L173.7 299.4 L169.1 304 L82.3 304 L76.6 371.4 " +
  "L48 370.3 L22.9 382.9 L3.4 385.1 L0 272 L18.3 254.9 L19.4 227.4 L26.3 220.6 " +
  "L92.6 220.6 L112 201.1 L112 124.6 L116.6 118.9 L182.9 130.3 Z";

/** Four-point sparkle, centred on (cx, cy) with the given radius. */
function sparkle(cx: number, cy: number, r: number): string {
  const w = r * 0.34; // waist - how pinched the points are
  return `M${cx} ${cy - r} C${cx + w} ${cy - w} ${cx + w} ${cy - w} ${cx + r} ${cy} C${cx + w} ${cy + w} ${cx + w} ${cy + w} ${cx} ${cy + r} C${cx - w} ${cy + w} ${cx - w} ${cy + w} ${cx - r} ${cy} C${cx - w} ${cy - w} ${cx - w} ${cy - w} ${cx} ${cy - r} Z`;
}

let uid = 0;

export function ElliotMark({
  size = 24,
  tone = "gradient",
  className,
  style,
  title,
}: {
  size?: number;
  tone?: "gradient" | "solid";
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  // Gradient ids must be unique per instance or several marks on one page all
  // reference the first one's stops.
  const id = React.useMemo(() => "elliot-" + ++uid, []);
  const solid = tone === "solid";

  return (
    <svg
      viewBox="0 0 1180 700"
      width={size}
      height={(size * 700) / 1180}
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {!solid && (
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#2FA8F5" />
            <stop offset="52%" stopColor="#7B8BF0" />
            <stop offset="100%" stopColor="#E7A3CE" />
          </linearGradient>
        </defs>
      )}
      {/* Peak, nudged down-left so the sparkles have room top-right. */}
      <g transform="translate(0,60)">
        <path d={PEAK} fill={solid ? "currentColor" : `url(#${id})`} />
      </g>
      {/* Larger coral sparkle, then the small amber one above and right. */}
      <path d={sparkle(940, 300, 128)} fill={solid ? "currentColor" : "#F2A0A6"} opacity={solid ? 0.75 : 1} />
      <path d={sparkle(1090, 150, 78)} fill={solid ? "currentColor" : "#FBC985"} opacity={solid ? 0.55 : 1} />
    </svg>
  );
}
