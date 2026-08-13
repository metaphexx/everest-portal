// Portal search inside the mobile nav drawer, sitting at the top so it is the
// first thing under the logo when the drawer opens.
//
// Profile and sign out are NOT here - they live in the avatar menu in the top
// bar (components/portal/AccountMenu.tsx), where an unread badge can be seen
// without opening anything. Hidden on desktop, where the page header owns
// search.

import React, { useState } from "react";
import { useRouter } from "@/lib/router";
import { Icon } from "@/components/ui/Icon";

const IC = {
  search: "m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z",
};

export function DrawerAccount({
  searchPath,
  onNavigate,
}: {
  /** Where a submitted query goes, e.g. "/search" or "/tutor/search". */
  searchPath: string;
  /** Lets the shell close the drawer after any navigation. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = () => {
    if (!q.trim()) return;
    router.push(searchPath + "?q=" + encodeURIComponent(q.trim()));
    onNavigate?.();
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
    </div>
  );
}
