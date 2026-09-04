import React, { useEffect, useState } from "react";
import { usePathname } from "@/lib/router";
import { Background } from "@/components/portal/Background";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useAdmin } from "@/lib/admin-store";

import { ROLE_META, useBase, useRole } from "@/lib/admin-role";
import { Icon } from "@/components/ui/Icon";
import { AccountMenu } from "@/components/portal/AccountMenu";
import { ADMIN_NOTIFS } from "@/lib/notifications";

function AdminToast() {
  const { toast } = useAdmin();
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 26,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,32,63,.93)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "#fff",
        borderRadius: 12,
        padding: "11px 18px",
        fontSize: 13,
        fontWeight: 500,
        zIndex: "var(--z-modal)" as unknown as number,
        boxShadow: "0 18px 40px -12px rgba(0,32,63,.55)",
        animation: "evfadeup .22s ease-out",
        maxWidth: "calc(100vw - 32px)",
        textAlign: "center",
      }}
    >
      {toast}
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const { notWired } = useAdmin();
  const role = useRole();
  const base = useBase();
  const who = ROLE_META[role];

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="ev-shell">
      <Background />

      <div className="ev-mobilebar">
        <AccountMenu
          name={who.person}
          initials={who.initials}
          role={who.label}
          accent={who.accent}
          seed={ADMIN_NOTIFS}
          unreadMsgs={0}
          messagesHref={base + "/approvals"}
          onSignOut={() => notWired("Sign out")}
        />
        <button className="ev-hamburger" aria-label="Open menu" onClick={() => setNavOpen(true)}>
          <Icon path="M3 6h18M3 12h18M3 18h18" size={20} stroke />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ev-mobilebar-logo" src="/admin-portal-logo.png" alt="Everest Tutoring - Admin Portal" width={400} height={200} {...({ fetchpriority: "high" } as object)} decoding="async" />
      </div>

      <div className="ev-sidewrap" data-open={navOpen}>
        <AdminSidebar />
      </div>
      <div className="ev-scrim" onClick={() => setNavOpen(false)} />

      <main className="ev-main thin-scroll">
        <div className="ev-main-inner">
          <AdminHeader />
          {children}
        </div>
      </main>
      <AdminToast />
    </div>
  );
}
