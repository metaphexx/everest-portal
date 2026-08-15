// The office nav.
//
// Ordered by what the job actually is, not by what the database contains:
// the two queues that hold up a class come first, then the records the office
// maintains, then oversight. Badges show work waiting, never totals - a badge
// that never clears is wallpaper.

import React from "react";
import Link from "@/components/ui/Link";
import { usePathname } from "@/lib/router";
import { Icon, ICON } from "@/components/portal/nav-icons";
import { useAdmin } from "@/lib/admin-store";
import { SAFEGUARDING } from "@/lib/admin-data";
import { DrawerAccount } from "@/components/portal/DrawerAccount";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className="ev-navlink"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        textDecoration: "none",
        background: active ? "rgba(14,156,142,.14)" : "transparent",
        color: active ? "var(--accent-teal)" : "var(--fg3)",
        fontWeight: active ? 600 : 500,
        fontSize: 13.5,
        transition: "background .18s ease,color .18s ease",
      }}
    >
      <Icon path={item.icon} size={17} style={{ flex: "none" }} />
      <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
      {item.badge ? (
        <span style={{ flex: "none", minWidth: 18, height: 18, borderRadius: 9, background: "var(--danger-500)", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.1, color: "var(--fg4)", padding: "16px 12px 6px" }}>{children}</div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { pendingCount, toPrintCount } = useAdmin();
  const openFlags = SAFEGUARDING.filter((f) => f.status === "open").length;

  const MAIN: NavItem[] = [{ href: "/admin", label: "Dashboard", icon: ICON.grid }];
  const QUEUES: NavItem[] = [
    { href: "/admin/approvals", label: "Approvals", icon: ICON.clipboard, badge: pendingCount },
    { href: "/admin/printing", label: "Print Queue", icon: ICON.doc, badge: toPrintCount },
  ];
  const RECORDS: NavItem[] = [
    { href: "/admin/classes", label: "Classes", icon: ICON.courses },
    { href: "/admin/tutors", label: "Tutors", icon: ICON.text },
    { href: "/admin/students", label: "Students", icon: ICON.grade },
    { href: "/admin/catalogue", label: "Catalogue", icon: ICON.library },
  ];
  const OVERSIGHT: NavItem[] = [
    { href: "/admin/files", label: "Shared Files", icon: ICON.drive },
    { href: "/admin/safeguarding", label: "Safeguarding", icon: ICON.mail, badge: openFlags },
    { href: "/admin/settings", label: "Settings", icon: ICON.settings },
  ];

  return (
    <aside
      style={{
        width: 232,
        flex: "none",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "24px 14px",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 2,
        background: "linear-gradient(180deg,rgba(255,255,255,.62),rgba(255,255,255,.4))",
        backdropFilter: "blur(26px) saturate(1.5)",
        WebkitBackdropFilter: "blur(26px) saturate(1.5)",
        borderRight: "1px solid rgba(255,255,255,.75)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.9),inset -1px 0 0 rgba(255,255,255,.45),0 14px 44px -20px rgba(0,32,63,.3)",
      }}
    >
      {/* There is no admin lockup asset, so the wordmark carries a typeset
          label rather than a faked script logo. */}
      <div style={{ padding: "6px 10px 20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/everest-logo.png" alt="Everest Tutoring" style={{ width: 158, height: "auto", display: "block" }} />
        <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800, letterSpacing: 2.4, color: "var(--accent-teal)", marginTop: 6 }}>
          OFFICE PORTAL
        </div>
      </div>

      <DrawerAccount searchPath="/admin/search" />

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }} className="thin-scroll">
        {MAIN.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
        <GroupLabel>WAITING ON YOU</GroupLabel>
        {QUEUES.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
        <GroupLabel>RECORDS</GroupLabel>
        {RECORDS.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
        <GroupLabel>OVERSIGHT</GroupLabel>
        {OVERSIGHT.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
      </nav>
    </aside>
  );
}
