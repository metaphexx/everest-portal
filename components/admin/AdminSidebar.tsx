// The office nav.
//
// Flat, and ordered by the job. The live portal buries fourteen master screens
// in three collapsing groups, so a tutor record is three clicks and a guess
// away; here every destination is one click and the master screens share a
// single page with a tab strip.
//
// The Admin (print) role gets a strict subset: the request queue, the history,
// and the classes that need booklets. Nothing about tutors, students, files or
// safeguarding is rendered or routed for them.

import React from "react";
import Link from "@/components/ui/Link";
import { usePathname } from "@/lib/router";
import { Icon, ICON } from "@/components/portal/nav-icons";
import { useAdmin } from "@/lib/admin-store";
import { DEMO_ROLE_SWITCH, ROLE_META, useBase, useRole } from "@/lib/admin-role";
import { SAFEGUARDING } from "@/lib/admin-data";
import { DrawerAccount } from "@/components/portal/DrawerAccount";

const SWAP = "M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3ZM9 3 5 6.99h3V14h2V6.99h3L9 3Z";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

function isActive(pathname: string, href: string, base: string): boolean {
  if (href === base) return pathname === base;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, active, accent }: { item: NavItem; active: boolean; accent: string }) {
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
        color: active ? accent : "var(--fg3)",
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
  return <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.1, color: "var(--fg4)", padding: "16px 12px 6px" }}>{children}</div>;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const role = useRole();
  const base = useBase();
  const meta = ROLE_META[role];
  const { pendingCount, toPrintCount } = useAdmin();
  const openFlags = SAFEGUARDING.filter((f) => f.status === "open").length;
  const isPrint = role === "print";

  const MAIN: NavItem[] = [{ href: base, label: "Dashboard", icon: ICON.grid }];
  // The Admin role both approves and prints, so its badge counts both jobs.
  const QUEUES: NavItem[] = [
    { href: base + "/approvals", label: "Booklet Requests", icon: ICON.clipboard, badge: isPrint ? pendingCount + toPrintCount : pendingCount },
    { href: base + "/history", label: "Print History", icon: ICON.play },
  ];
  const RECORDS: NavItem[] = isPrint
    ? [{ href: base + "/classes", label: "Classes", icon: ICON.courses }]
    : [
        { href: base + "/schedule", label: "Schedule", icon: ICON.calendar },
        { href: base + "/classes", label: "Classes", icon: ICON.courses },
        { href: base + "/masters", label: "Master Records", icon: ICON.text },
        { href: base + "/catalogue", label: "Catalogue", icon: ICON.library },
      ];
  const OVERSIGHT: NavItem[] = isPrint
    ? [{ href: base + "/settings", label: "Settings", icon: ICON.settings }]
    : [
        { href: base + "/messages", label: "Messages", icon: ICON.chat },
        { href: base + "/files", label: "Shared Files", icon: ICON.drive },
        { href: base + "/safeguarding", label: "Safeguarding", icon: ICON.mail, badge: openFlags },
        { href: base + "/settings", label: "Settings", icon: ICON.settings },
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
      {/* No admin lockup asset exists, so the wordmark carries a typeset label
          rather than a faked script logo. */}
      <div style={{ padding: "6px 10px 20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/everest-logo.png" alt="Everest Tutoring" width={400} height={126} decoding="async" style={{ width: 158, height: "auto", display: "block" }} />
        <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 800, letterSpacing: 2.4, color: meta.accent, marginTop: 6 }}>{meta.portal}</div>
      </div>

      <DrawerAccount searchPath={base + "/search"} />

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }} className="thin-scroll">
        {MAIN.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href, base)} accent={meta.accent} />
        ))}
        <GroupLabel>{isPrint ? "PRINTING" : "WAITING ON YOU"}</GroupLabel>
        {QUEUES.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href, base)} accent={meta.accent} />
        ))}
        <GroupLabel>{isPrint ? "REFERENCE" : "RECORDS"}</GroupLabel>
        {RECORDS.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href, base)} accent={meta.accent} />
        ))}
        <GroupLabel>{isPrint ? "ACCOUNT" : "OVERSIGHT"}</GroupLabel>
        {OVERSIGHT.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href, base)} accent={meta.accent} />
        ))}
        {/* Demo affordance: a real login lands on one view or the other, so
            this is dropped from a shipping build (VITE_DEMO_ROLE_SWITCH=false). */}
        {DEMO_ROLE_SWITCH && <NavLink item={{ href: meta.switchTo, label: meta.switchLabel, icon: SWAP }} active={false} accent={meta.accent} />}
      </nav>
    </aside>
  );
}
