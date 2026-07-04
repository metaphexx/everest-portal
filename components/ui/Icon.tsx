import React from "react";

export function Icon({
  path,
  size = 17,
  className,
  style,
  stroke,
}: {
  path: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  stroke?: boolean;
}) {
  if (stroke) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
      >
        <path d={path} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d={path} />
    </svg>
  );
}
