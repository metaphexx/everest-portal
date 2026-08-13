// The Everest loading mark. The peak draws itself in outline, fills, fades,
// and repeats. Use this instead of a rotating ring anywhere the app is waiting
// on work - it is the only loading indicator in the portal.
//
// `size` is the WIDTH in px. The mark is 1000x629, so it renders at 0.63x that
// tall; budget for the height, not the width, when placing it in a card.
// All the styling lives in `.ev-loader` in app/globals.css, including the
// reduced-motion fallback (a static filled peak).

import React from "react";

const PEAK =
  "M305.1 0 L481.1 192 L530.3 160 L673.1 342.9 L734.9 337.1 L1000 628.6 L720 396.6 " +
  "L667.4 412.6 L526.9 234.3 L468.6 374.9 L310.9 501.7 L347.4 362.3 L289.1 337.1 " +
  "L438.9 211.4 L304 77.7 L267.4 195.4 L173.7 299.4 L169.1 304 L82.3 304 L76.6 371.4 " +
  "L48 370.3 L22.9 382.9 L3.4 385.1 L0 272 L18.3 254.9 L19.4 227.4 L26.3 220.6 " +
  "L92.6 220.6 L112 201.1 L112 124.6 L116.6 118.9 L182.9 130.3 Z";

export function Loader({
  size = 64,
  speed,
  label = "Loading",
  className,
  style,
}: {
  /** Width in px. Height comes out at 0.63x this. */
  size?: number;
  /** Loop speed multiplier. 1 is the slow original; the default is 1.7. */
  speed?: number;
  /** Announced to screen readers. Say what is loading where you can. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={"ev-loader" + (className ? " " + className : "")}
      role="status"
      aria-label={label}
      style={{
        ["--ev-size" as string]: size + "px",
        ...(speed ? { ["--ev-speed" as string]: String(speed) } : null),
        ...style,
      }}
    >
      <svg viewBox="0 0 1000 629" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d={PEAK}
          pathLength={100}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={22}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
