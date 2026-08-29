import React from "react";
import Link from "@/components/ui/Link";
import { usePathname } from "@/lib/router";
import { Icon, ICON } from "@/components/portal/nav-icons";
import { useTutor } from "@/lib/tutor-store";
import { TUTOR_ME, useMessaging } from "@/lib/messaging";
import { DrawerAccount } from "@/components/portal/DrawerAccount";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/tutor") return pathname === "/tutor";
  if (href === "/tutor/courses") return pathname === "/tutor/courses" || pathname.startsWith("/tutor/courses/");
  return pathname === href;
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        textDecoration: "none",
        background: active ? "rgba(0,157,255,.13)" : "transparent",
        color: active ? "var(--brand-600)" : "var(--fg3)",
        fontWeight: active ? 600 : 500,
        fontSize: 13.5,
        transition: "background .18s ease,color .18s ease",
      }}
      className="ev-navlink"
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
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.1, color: "var(--fg4)", padding: "16px 12px 6px" }}>
      {children}
    </div>
  );
}

export function TutorSidebar() {
  const pathname = usePathname();
  const { cart, toMarkCount, hasInPerson, hasOnline, notWired } = useTutor();
  const { unreadTotal } = useMessaging();

  // The nav reshapes around the tutor's assigned duties: in-person tutors get
  // the print pipeline, online tutors get the teaching workflow, both get both.
  const MAIN: NavItem[] = [{ href: "/tutor", label: "Dashboard", icon: ICON.grid }];
  const TEACH: NavItem[] = [
    { href: "/tutor/courses", label: "My Courses", icon: ICON.courses },
    { href: "/tutor/schedule", label: "Schedule", icon: ICON.calendar },
    ...(hasOnline
      ? [
          { href: "/tutor/grade", label: "Marking", icon: ICON.grade, badge: toMarkCount },
          { href: "/tutor/outlines", label: "Student Outlines", icon: ICON.clipboard },
        ]
      : []),
  ];
  // Print-pipeline pages are an in-person-only concept, so they hide for a
  // pure-online tutor; a both-duty tutor keeps them regardless of the current
  // view toggle. My Booklets/My Drive are the online-teaching equivalent and
  // only appear once the tutor has online duties at all.
  const BOOKLETS: NavItem[] = hasInPerson
    ? [
        { href: "/tutor/materials", label: "Study Materials", icon: ICON.library },
        { href: "/tutor/cart", label: "Cart", icon: ICON.doc, badge: cart.length },
        { href: "/tutor/requests", label: "My Requests", icon: ICON.text },
        { href: "/tutor/history", label: "History", icon: ICON.play },
      ]
    : [];
  const RESOURCES: NavItem[] = hasOnline
    ? [
        { href: "/tutor/booklets", label: "My Booklets", icon: ICON.drive },
        { href: "/tutor/drive", label: "My Drive", icon: ICON.library },
      ]
    : [];
  const HELP: NavItem[] = [
    ...(hasOnline ? [{ href: "/tutor/elliot", label: "Ask Elliot", icon: ICON.chat }] : []),
    ...(hasOnline ? [{ href: "/tutor/messages", label: "Messages", icon: ICON.mail, badge: unreadTotal(TUTOR_ME) }] : []),
    { href: "/tutor/settings", label: "Settings", icon: ICON.settings },
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
      <div style={{ padding: "6px 10px 20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tutor-portal-logo.png" alt="Everest Tutoring - Tutor Portal" width={400} height={200} decoding="async" style={{ width: 168, height: "auto", display: "block" }} />
      </div>
      {/* Phone only: portal search, first thing under the logo. */}
      <DrawerAccount searchPath="/tutor/search" />

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }} className="thin-scroll">
        {MAIN.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
        <GroupLabel>TEACHING</GroupLabel>
        {TEACH.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
        {BOOKLETS.length > 0 && (
          <>
            <GroupLabel>REQUEST BOOKLETS</GroupLabel>
            {BOOKLETS.map((n) => (
              <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
            ))}
          </>
        )}
        {RESOURCES.length > 0 && (
          <>
            <GroupLabel>RESOURCES</GroupLabel>
            {RESOURCES.map((n) => (
              <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
            ))}
          </>
        )}
        {HELP.length > 0 && (
          <>
            <GroupLabel>HELP</GroupLabel>
            {HELP.map((n) => (
              <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
            ))}
          </>
        )}
      </nav>

    </aside>
  );
}
