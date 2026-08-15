import React, { useEffect, useState } from "react";
import { usePathname } from "@/lib/router";
import { Background } from "@/components/portal/Background";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useAdmin } from "@/lib/admin-store";
import { ADMIN } from "@/lib/admin-data";
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

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="ev-shell">
      <Background />

      <div className="ev-mobilebar">
        <AccountMenu
          name={ADMIN.name}
          initials={ADMIN.initials}
          role={ADMIN.role}
          accent="var(--accent-teal)"
          seed={ADMIN_NOTIFS}
          unreadMsgs={0}
          messagesHref="/admin/safeguarding"
          onSignOut={() => notWired("Sign out")}
        />
        <button className="ev-hamburger" aria-label="Open menu" onClick={() => setNavOpen(true)}>
          <Icon path="M3 6h18M3 12h18M3 18h18" size={20} stroke />
        </button>
        {/* No admin lockup exists, so the phone bar carries the wordmark with a
            typeset label rather than a faked script logo. */}
        <span className="ev-mobilebar-logo" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/everest-logo.png" alt="Everest Tutoring" style={{ width: 132, height: "auto", display: "block" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 800, letterSpacing: 2.2, color: "var(--accent-teal)" }}>OFFICE PORTAL</span>
        </span>
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
