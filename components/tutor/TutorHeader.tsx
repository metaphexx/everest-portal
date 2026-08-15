import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { TUTOR_ME, useMessaging } from "@/lib/messaging";
import { TUTOR, TUTOR_COURSES, TutorCourseId } from "@/lib/tutor-data";
import { tutorSearch } from "@/lib/tutor-search";
import { useDebouncedValue } from "@/lib/use-debounce";
import { useDismissable } from "@/lib/use-dismissable";
import { Icon } from "@/components/ui/Icon";

interface NotifItem {
  id: string;
  dot: string;
  title: string;
  meta: string;
  href: string;
  read: boolean;
}

// Seed notifications for the prototype - including messages students post in
// the classroom. Each deep-links to the update and can be marked read in place.
const SEED_NOTIFS: NotifItem[] = [
  { id: "safeguard", dot: "var(--danger-500)", title: "Safeguarding alert: a message from Ruby Chen needs care", meta: "Messages · this morning", href: "/tutor/messages", read: false },
  { id: "classroom", dot: "var(--accent-violet)", title: "Ravi Shah posted a question in the Chemistry classroom", meta: "Classroom · 20 min ago", href: "/tutor/classroom/chem11", read: false },
  { id: "request", dot: "var(--success-500)", title: "REQ1782365660 was approved for printing", meta: "My Requests · 25 Jun", href: "/tutor/requests", read: false },
  { id: "outline", dot: "var(--brand-500)", title: "Maya Kapoor shared a Chemistry ATAR outline", meta: "Student Outlines · 28 Jun", href: "/tutor/outlines", read: false },
];

function pageMeta(pathname: string, greeting: string, toMark: number, pending: number): { t: string; s: string } {
  if (pathname === "/tutor") return { t: greeting + ", Priya", s: "One class tonight, " + toMark + " worksheets to mark and " + pending + " booklet request" + (pending === 1 ? "" : "s") + " awaiting approval." };
  if (pathname === "/tutor/courses") return { t: "My Courses", s: "Every class you teach, with students, sessions and materials in one place." };
  if (pathname.startsWith("/tutor/courses/")) {
    const id = pathname.split("/")[3] as TutorCourseId;
    const cd = TUTOR_COURSES[id];
    if (cd) return { t: cd.name, s: cd.centre + " · " + cd.sched + (cd.delivery === "in_person" ? "" : " · " + cd.students.length + " students") };
    return { t: "Course", s: "" };
  }
  if (pathname === "/tutor/schedule") return { t: "Schedule", s: "Your classes for the term, month by month." };
  if (pathname === "/tutor/grade") return { t: "Marking", s: "Student submissions waiting on your feedback." };
  if (pathname === "/tutor/outlines") return { t: "Student Outlines", s: "School outlines your students uploaded, scanned so you know what they are studying." };
  if (pathname === "/tutor/materials") return { t: "Study Materials", s: "Browse the booklet catalogue and add what you need to your cart." };
  if (pathname === "/tutor/cart") return { t: "Cart", s: "Set the print job details and send your request for approval." };
  if (pathname === "/tutor/requests") return { t: "My Requests", s: "Approval and printing progress for every booklet request." };
  if (pathname === "/tutor/history") return { t: "History", s: "Every print request you have made, filterable by centre, day and class." };
  if (pathname === "/tutor/booklets") return { t: "My Booklets", s: "Booklets the office has shared with you, ready to assign to a class or student." };
  if (pathname === "/tutor/drive") return { t: "My Drive", s: "Your own space for personal teaching files." };
  if (pathname.startsWith("/tutor/classroom/")) {
    const id = pathname.split("/")[3] as TutorCourseId;
    const cd = TUTOR_COURSES[id];
    if (cd) return { t: cd.name + " classroom", s: "Post announcements, share files and reply to the class." };
    return { t: "Classroom", s: "" };
  }
  if (pathname === "/tutor/messages") return { t: "Messages", s: "Student conversations. Every message is monitored for safety." };
  if (pathname === "/tutor/elliot") return { t: "Ask Elliot", s: "Suggestions and answers from your students\u2019 outlines and scores." };
  if (pathname === "/tutor/settings") return { t: "Settings", s: "Your contact details, password and notifications." };
  if (pathname === "/tutor/search") return { t: "Search", s: "Results from across your portal." };
  return { t: "Everest", s: "" };
}

export function TutorHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { now, toMarkCount, pendingRequests, notWired, mode, setMode, requests, submissions } = useTutor();
  const { unreadTotal } = useMessaging();
  const unreadMsgs = unreadTotal(TUTOR_ME);
  const [q, setQ] = useState("");
  const [notif, setNotif] = useState(false);
  const [items, setItems] = useState<NotifItem[]>(SEED_NOTIFS);

  const markRead = (id: string) => setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems((list) => list.map((n) => ({ ...n, read: true })));
  const openItem = (n: NotifItem) => {
    markRead(n.id);
    setNotif(false);
    router.push(n.href);
  };
  const hasUnread = unreadMsgs > 0 || items.some((n) => !n.read);

  // The in-person/online view switch only makes sense for a tutor assigned
  // BOTH duties; a single-duty tutor has nothing to toggle, so it is hidden.
  const canToggle = TUTOR.grants === "both";
  const MODES: { id: typeof mode; label: string }[] = [
    { id: "both", label: "Both" },
    { id: "in_person", label: "In person" },
    { id: "online", label: "Online" },
  ];

  useEffect(() => {
    setNotif(false);
    setQ("");
  }, [pathname]);

  const nowD = new Date(now);
  const hr = nowD.getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = nowD.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const meta = pageMeta(pathname, greeting, toMarkCount, pendingRequests);

  // Debounced so filtering (a paid model / vector query in production) runs
  // once the tutor pauses typing, not on every keystroke.
  const ql = useDebouncedValue(q.trim().toLowerCase(), 200);
  const results = useMemo(
    () => (ql ? tutorSearch(ql, { requests, submissions }, 6) : []),
    [ql, requests, submissions]
  );
  const searchOpen = q.trim().length > 0 && ql.length > 0;

  const searchRef = useDismissable<HTMLDivElement>(searchOpen, () => setQ(""));
  const notifRef = useDismissable<HTMLDivElement>(notif, () => setNotif(false));

  return (
    <div className="ev-tutor-header">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: "var(--fg4)", fontWeight: 600, marginBottom: 5 }}>{dateLabel}</div>
        <h1 className="portal-title">{meta.t}</h1>
        <p className="portal-lede">{meta.s}</p>
      </div>

      <div className="ev-header-controls" style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        {/* Working-mode switcher - only for tutors assigned both duties. Plain
            toggle buttons with aria-pressed rather than a half-finished
            role="radio" pattern - honestly accessible without roving tabindex. */}
        {/* Previously hidden below 420px, which left tutors on a small phone
            unable to switch working mode at all. It now wraps onto its own
            full-width row instead of disappearing. */}
        {canToggle && (
        <div className="glass-control ev-mode-switch" style={{ display: "flex", alignItems: "center", gap: 2, borderRadius: 12, padding: 4, height: 44, boxSizing: "border-box" }} title="You are assigned both duties. Switch the view between in-person booklet requests and online teaching.">
          {MODES.map((m) => (
            <button
              key={m.id}
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 9,
                padding: "0 11px",
                height: 34,
                fontFamily: "inherit",
                fontSize: 11.5,
                fontWeight: 700,
                whiteSpace: "nowrap",
                background: mode === m.id ? "var(--brand-500)" : "transparent",
                color: mode === m.id ? "#fff" : "var(--fg3)",
                transition: "background .18s ease,color .18s ease",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        )}
        {/* Search */}
        <div ref={searchRef} className="ev-header-search" style={{ position: "relative" }}>
          <div className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 14px", height: 44 }}>
            <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={15} style={{ color: "var(--fg4)", flex: "none" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q.trim()) {
                  router.push("/tutor/search?q=" + encodeURIComponent(q.trim()));
                }
                if (e.key === "Escape") setQ("");
              }}
              placeholder="Search the portal"
              aria-label="Search the portal"
              className="ev-search-input"
              /* Stretch to the control height so the whole 44px box is tappable. */
              style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", width: 170, minWidth: 0, alignSelf: "stretch", height: "100%" }}
            />
          </div>
          {searchOpen && (
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
                zIndex: "var(--z-dropdown)",
                animation: "evdrop .18s ease-out",
              }}
            >
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
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: r.color, flex: "none" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.meta}</span>
                  </span>
                </button>
              ))}
              {results.length === 0 && (
                <div style={{ padding: "12px 10px", fontSize: 12.5, color: "var(--fg4)", textAlign: "center" }}>No matches for that search.</div>
              )}
              {results.length > 0 && (
                <button
                  onClick={() => { setQ(""); router.push("/tutor/search?q=" + encodeURIComponent(q.trim())); }}
                  className="list-hover"
                  style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 10px", marginTop: 2, borderTop: "1px solid rgba(0,32,63,.06)", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--brand-600)", border: "none", background: "none", fontFamily: "inherit" }}
                >
                  See all results
                  <Icon path="M9 6l6 6-6 6" size={13} style={{ color: "var(--brand-600)" }} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile / notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotif((v) => !v)}
            aria-expanded={notif}
            aria-haspopup="menu"
            aria-label="Notifications"
            className="glass-control"
            style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "5px 12px 5px 5px", height: 44, boxSizing: "border-box", cursor: "pointer", border: "none", fontFamily: "inherit" }}
          >
            <span
              style={{
                position: "relative",
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg,var(--brand-500),var(--accent-violet))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 600,
                fontSize: 11,
                flex: "none",
              }}
            >
              {TUTOR.initials}
              {hasUnread && <span style={{ position: "absolute", top: -1, right: -1, width: 9, height: 9, borderRadius: "50%", background: "var(--danger-500)", border: "1.5px solid #fff", animation: "evbreathe 2.4s ease-in-out infinite" }} />}
            </span>
            <span className="ev-hide-narrow">
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{TUTOR.name}</span>
              <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>Everest Tutor</span>
            </span>
          </button>
          {notif && (
            <div
              role="menu"
              aria-label="Notifications"
              className="ev-notif-drop"
              style={{
                position: "absolute",
                top: 50,
                right: 0,
                width: 310,
                background: "rgba(255,255,255,.94)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,.9)",
                borderRadius: 14,
                boxShadow: "0 24px 50px -18px rgba(0,32,63,.35)",
                padding: 8,
                zIndex: "var(--z-dropdown)",
                animation: "evdrop .18s ease-out",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px 4px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, color: "var(--fg4)" }}>NOTIFICATIONS</span>
                {hasUnread && (
                  <button onClick={markAll} style={{ border: "none", background: "transparent", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>Mark all as read</button>
                )}
              </div>
              {unreadMsgs > 0 && (
                <Notif
                  dot="var(--brand-500)"
                  title={unreadMsgs === 1 ? "You have 1 unread message" : "You have " + unreadMsgs + " unread messages"}
                  meta="Messages · just now"
                  onOpen={() => {
                    setNotif(false);
                    router.push("/tutor/messages");
                  }}
                />
              )}
              {items.map((n) => (
                <Notif key={n.id} dot={n.dot} title={n.title} meta={n.meta} read={n.read} onOpen={() => openItem(n)} onMarkRead={() => markRead(n.id)} />
              ))}
              {!hasUnread && (
                <div style={{ padding: "12px 10px 14px", textAlign: "center", fontSize: 12, color: "var(--fg4)" }}>You are all caught up.</div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => notWired("Sign out")}
          title="Sign out"
          className="icon-btn"
          style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Icon path="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5ZM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5Z" size={16} style={{ color: "var(--fg2)" }} />
        </button>
      </div>
    </div>
  );
}

function Notif({ dot, title, meta, read, onOpen, onMarkRead }: { dot: string; title: string; meta: string; read?: boolean; onOpen?: () => void; onMarkRead?: () => void }) {
  return (
    <div
      className="list-hover"
      role={onOpen ? "menuitem" : undefined}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: onOpen ? "0" : "9px 10px", borderRadius: 10, opacity: read ? 0.55 : 1 }}
    >
      {onOpen ? (
        <button onClick={onOpen} style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "flex-start", gap: 10, padding: "9px 10px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: read ? "transparent" : dot, border: read ? "1.5px solid rgba(0,32,63,.18)" : "none", flex: "none", marginTop: 4, boxSizing: "border-box" }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: read ? 500 : 600, lineHeight: 1.35 }}>{title}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>{meta}</span>
          </span>
        </button>
      ) : (
        <>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: read ? "transparent" : dot, border: read ? "1.5px solid rgba(0,32,63,.18)" : "none", flex: "none", marginTop: 4, boxSizing: "border-box" }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: read ? 500 : 600, lineHeight: 1.35 }}>{title}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>{meta}</span>
          </span>
        </>
      )}
      {onMarkRead && !read && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead();
          }}
          title="Mark as read"
          aria-label="Mark as read"
          className="icon-btn hit-area-8 ev-tap"
          style={{ width: 22, height: 22, borderRadius: 7, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", marginTop: 9, marginRight: 10 }}
        >
          <Icon path="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" size={12} style={{ color: "var(--fg3)" }} />
        </button>
      )}
    </div>
  );
}
