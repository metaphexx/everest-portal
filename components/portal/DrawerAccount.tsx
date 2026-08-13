// The account block that lives inside the mobile nav drawer.
//
// On a phone the portal header's control cluster (search, avatar, sign out) has
// nowhere sensible to go: it either wraps onto its own row and floats right with
// a dead gap beside it, or it squeezes the page title. Folding it into the
// drawer gives it a proper home and leaves the top bar as just the logo and the
// menu button.
//
// Rendered by both sidebars; hidden on desktop, where the header owns these
// controls. It is deliberately dumb about routes - the caller passes the search
// destination and the profile so the same component serves both portals.

import React, { useState } from "react";
import { useRouter } from "@/lib/router";
import { Icon } from "@/components/ui/Icon";

const IC = {
  search: "m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z",
  out: "M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5ZM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5Z",
};

export function DrawerAccount({
  searchPath,
  settingsPath,
  name,
  initials,
  role,
  accent,
  onSignOut,
  onNavigate,
}: {
  /** Where a submitted query goes, e.g. "/search" or "/tutor/search". */
  searchPath: string;
  settingsPath: string;
  name: string;
  initials: string;
  role: string;
  accent: string;
  onSignOut: () => void;
  /** Lets the shell close the drawer after any navigation. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const go = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const submit = () => {
    if (!q.trim()) return;
    go(searchPath + "?q=" + encodeURIComponent(q.trim()));
    setQ("");
  };

  return (
    <div className="ev-drawer-account">
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.75)", border: "1px solid rgba(0,32,63,.1)", borderRadius: 12, padding: "0 12px", height: 44 }}>
        <Icon path={IC.search} size={15} style={{ color: "var(--fg4)", flex: "none" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder="Search the portal"
          aria-label="Search the portal"
          style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", height: "100%" }}
        />
      </div>

      <button
        onClick={() => go(settingsPath)}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", marginTop: 10, padding: "8px 6px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
      >
        <span style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
          {initials}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--fg1)" }}>{name}</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{role}</span>
        </span>
      </button>

      <button
        onClick={() => { onSignOut(); onNavigate?.(); }}
        className="press"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 6, height: 40, borderRadius: 11, border: "1px solid rgba(0,32,63,.12)", background: "rgba(255,255,255,.7)", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}
      >
        <Icon path={IC.out} size={15} style={{ flex: "none" }} />
        Sign out
      </button>
    </div>
  );
}
