"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, ICON } from "./nav-icons";
import { STUDENT_ME, useMessaging } from "@/lib/messaging";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

const MAIN: NavItem[] = [{ href: "/", label: "Dashboard", icon: ICON.grid }];
const LEARN: NavItem[] = [
  { href: "/courses", label: "Courses", icon: ICON.courses },
  { href: "/timetable", label: "Timetable", icon: ICON.calendar },
  { href: "/outline", label: "Assessment Tracker", icon: ICON.clipboard },
];
const RESOURCES: NavItem[] = [
  { href: "/library", label: "Library", icon: ICON.library },
  { href: "/drive", label: "My Drive", icon: ICON.drive },
  { href: "/grades", label: "My Grades", icon: ICON.grade },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/courses") return pathname === "/courses" || pathname.startsWith("/courses/");
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
        <span
          aria-label={item.badge + " unread"}
          style={{ flex: "none", minWidth: 18, height: 18, borderRadius: 9, background: "var(--brand-500)", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}
        >
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.1, color: "var(--fg4)", padding: "16px 12px 6px" }}>
      {children}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { unreadTotal } = useMessaging();
  const HELP: NavItem[] = [
    { href: "/messages", label: "Message a Tutor", icon: ICON.mail, badge: unreadTotal(STUDENT_ME) },
    { href: "/chat", label: "Chat with Elliot", icon: ICON.chat },
    { href: "/support", label: "Support", icon: ICON.support },
    { href: "/settings", label: "Settings", icon: ICON.settings },
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
        <img src="/student-portal-logo.png" alt="Everest Tutoring - Student Portal" style={{ width: 176, height: "auto", display: "block" }} />
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }} className="thin-scroll">
        {MAIN.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
        <GroupLabel>LEARN</GroupLabel>
        {LEARN.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
        <GroupLabel>RESOURCES</GroupLabel>
        {RESOURCES.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
        <GroupLabel>HELP</GroupLabel>
        {HELP.map((n) => (
          <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
        ))}
      </nav>
    </aside>
  );
}
