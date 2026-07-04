// My Drive - the tutor's own personal file area, separate from the
// admin-linked My Booklets. Purpose is still being decided, so this is
// deliberately a small, tasteful placeholder rather than a built-out feature.

import React from "react";
import Link from "@/components/ui/Link";
import { useTutor } from "@/lib/tutor-store";
import { ICON } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";

export default function MyDrivePage() {
  const { notWired, hasOnline } = useTutor();

  if (!hasOnline) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>My Drive is part of online teaching</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Your account is set up for in-person booklet requests only. Ask the office if your role is changing.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        className="glass-card"
        style={{
          padding: "48px 24px",
          boxSizing: "border-box",
          textAlign: "center",
          animation: "evrise .5s cubic-bezier(.16,1,.3,1) .06s backwards",
        }}
      >
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(0,157,255,.1)",
            color: "var(--brand-600)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Icon path={ICON.drive} size={24} />
        </span>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>No files yet</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6, maxWidth: 380, marginLeft: "auto", marginRight: "auto", lineHeight: 1.55 }}>
          This is your own personal drive space for teaching files you keep for yourself, separate from the booklets the office shares with you.
        </div>
        <button
          onClick={() => notWired("Uploading to My Drive")}
          className="btn-primary press"
          style={{ height: 40, padding: "0 22px", borderRadius: 12, fontSize: 13, marginTop: 20 }}
        >
          Upload files
        </button>
      </div>

      <div
        className="glass-card"
        style={{ padding: "14px 22px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) .12s backwards" }}
      >
        <Icon path={ICON.library} size={17} style={{ color: "var(--fg4)", flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: "var(--fg3)" }}>
          Booklets the office has shared with you live in{" "}
          <Link href="/tutor/booklets" style={{ color: "var(--brand-600)", fontWeight: 600 }}>My Booklets</Link>, ready to assign to a class or student.
        </span>
      </div>
    </div>
  );
}
