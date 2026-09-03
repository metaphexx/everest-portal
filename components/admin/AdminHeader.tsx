// Office header: the date, what this page is for, portal search, and the
// account chip. Same anatomy as the tutor header on purpose - three portals
// that share a shell are one product; three that each invent a header are not.

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "@/lib/router";
import { Icon } from "@/components/ui/Icon";
import { useAdmin } from "@/lib/admin-store";
import { ADMIN } from "@/lib/admin-data";
import { ROLE_META, useBase, useRole } from "@/lib/admin-role";
import { adminSearch } from "@/lib/admin-search";
import { useDebouncedValue } from "@/lib/use-debounce";
import { useDismissable } from "@/lib/use-dismissable";

const IC = {
  search: "m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z",
  out: "M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5ZM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5Z",
};

function pageMeta(pathname: string, pending: number, toPrint: number, isPrint: boolean): { t: string; s: string } {
  if (pathname === "/admin" || pathname === "/staff")
    return {
      t: "Dashboard",
      s:
        pending === 0 && toPrint === 0
          ? "Nothing is waiting on you right now."
          : [pending ? pending + " request" + (pending === 1 ? "" : "s") + " to approve" : "", toPrint ? toPrint + " job" + (toPrint === 1 ? "" : "s") + " to print" : ""]
              .filter(Boolean)
              .join(" and ") + ".",
    };
  if (pathname.includes("/approvals"))
    return { t: "Booklet Requests", s: isPrint ? "Approve what tutors have asked for, then mark each job printed or failed." : "Print requests from tutors, by centre, with the day they are for." };

  if (pathname.includes("/classes")) return { t: "Classes", s: "Every class Everest runs, across all centres and online." };
  if (pathname.includes("/masters")) return { t: "Master Records", s: "Centres, printers, people, terms, subjects, courses and Drive folders." };
  if (pathname.includes("/grade")) return { t: "Marking", s: "Whether online work is being marked, and who is behind." };
  if (pathname.includes("/history")) return { t: "Print History", s: "Everything that has actually been printed, by centre." };
  if (pathname.includes("/catalogue")) return { t: "Catalogue", s: "The booklets tutors can request and assign." };
  if (pathname.includes("/files")) return { t: "Shared Files", s: "Every file shared on the platform, and who sent it to whom." };
  if (pathname.includes("/safeguarding")) return { t: "Safeguarding", s: "Flagged messages. Each one needs a person, not a filter." };
  if (pathname.includes("/settings")) return { t: "Settings", s: "Your account and what you are told about." };
  if (pathname.includes("/schedule")) return { t: "Schedule", s: "Every class on the calendar, and where new ones are added." };
  if (pathname.includes("/messages")) return { t: "Messages", s: "Threads with tutors, students and parents." };
  if (pathname.includes("/search")) return { t: "Search", s: "Results from across the office portal." };
  return { t: "Dashboard", s: "" };
}

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { requests, pendingCount, toPrintCount, notWired } = useAdmin();
  const role = useRole();
  const base = useBase();
  const who = ROLE_META[role];
  const [q, setQ] = useState("");

  const meta = pageMeta(pathname, pendingCount, toPrintCount, role === "print");
  const dateLabel = new Date("2026-07-02T19:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const ql = useDebouncedValue(q.trim().toLowerCase(), 200);
  const results = useMemo(() => (ql ? adminSearch(ql, requests, 6, { role, base }) : []), [ql, requests, role, base]);
  const open = q.trim().length > 0 && ql.length > 0;
  const searchRef = useDismissable<HTMLDivElement>(open, () => setQ(""));

  return (
    <div className="ev-tutor-header">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: "var(--fg4)", fontWeight: 600, marginBottom: 5 }}>{dateLabel}</div>
        <h1 className="portal-title">{meta.t}</h1>
        <p className="portal-lede">{meta.s}</p>
      </div>

      <div className="ev-header-controls" style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        <div ref={searchRef} className="ev-header-search" style={{ position: "relative" }}>
          <div className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 14px", height: 44 }}>
            <Icon path={IC.search} size={15} style={{ color: "var(--fg4)", flex: "none" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q.trim()) router.push(base + "/search?q=" + encodeURIComponent(q.trim()));
                if (e.key === "Escape") setQ("");
              }}
              placeholder="Search the portal"
              aria-label="Search the portal"
              className="ev-search-input"
              style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", width: 170, minWidth: 0, alignSelf: "stretch", height: "100%" }}
            />
          </div>
          {open && (
            <div
              style={{
                position: "absolute",
                top: 50,
                left: 0,
                right: 0,
                background: "rgba(255,255,255,.94)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,.9)",
                borderRadius: 14,
                boxShadow: "0 24px 50px -18px rgba(0,32,63,.35)",
                padding: 6,
                zIndex: "var(--z-dropdown)" as unknown as number,
                animation: "evdrop .18s ease-out",
              }}
            >
              {results.length === 0 && <div style={{ padding: "12px 10px", fontSize: 12.5, color: "var(--fg4)" }}>Nothing matches &quot;{q.trim()}&quot;.</div>}
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQ("");
                    router.push(r.page);
                  }}
                  className="list-hover"
                  style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 10, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flex: "none" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--fg1)" }}>{r.name}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>{r.meta}</span>
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", flex: "none" }}>{(r.kind ?? "").toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => notWired("Account menu")}
          aria-label={"Account for " + who.person}
          className="glass-control"
          style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "5px 12px 5px 5px", height: 44, boxSizing: "border-box", cursor: "pointer", border: "none", fontFamily: "inherit", textAlign: "left" }}
        >
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg," + who.accent + ",var(--accent-navy-blue))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 11, flex: "none" }}>
            {who.initials}
          </span>
          <span className="ev-hide-narrow">
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{who.person}</span>
            <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>{who.label}</span>
          </span>
        </button>

        <button onClick={() => notWired("Sign out")} title="Sign out" className="icon-btn" style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon path={IC.out} size={16} style={{ color: "var(--fg2)" }} />
        </button>
      </div>
    </div>
  );
}
