// Standing notice: the Everest office can see every file a tutor uploads or
// shares on the platform. Shown wherever a tutor is about to put a file in
// front of a student - My Drive, the booklet picker, the classroom composer -
// so it is never a surprise after the fact.

import React from "react";
import { Icon } from "@/components/ui/Icon";

const EYE = "M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z";

export function OfficeVisibilityNotice({ compact = false, style }: { compact?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "rgba(0,157,255,.07)",
        border: "1px solid rgba(0,157,255,.25)",
        borderRadius: 12,
        padding: compact ? "9px 12px" : "11px 14px",
        ...style,
      }}
    >
      <Icon path={EYE} size={16} style={{ color: "var(--brand-600)", flex: "none", marginTop: 1 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: compact ? 11.5 : 12, color: "var(--fg2)", lineHeight: 1.5 }}>
        <b>The Everest office can see this.</b> Every file you upload, assign or share on the platform is visible to the office, along with who sent it and when. Share only what you would be happy for the office to read.
      </span>
    </div>
  );
}
