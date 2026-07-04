import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "@/lib/router";
import { usePortal } from "@/lib/store";
import { STUDENT_ME, useMessaging } from "@/lib/messaging";
import { aiSearch } from "@/lib/search";
import { useDebouncedValue } from "@/lib/use-debounce";
import { useDismissable } from "@/lib/use-dismissable";
import { COURSE_DEFS, CourseId, STUDENT } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";

interface NotifItem {
  id: string;
  dot: string;
  title: string;
  meta: string;
  href: string;
  read: boolean;
}

// Seed notifications for the prototype. Each one deep-links to the page that
// holds the actual update, and can be marked read without leaving the menu.
const SEED_NOTIFS: NotifItem[] = [
  { id: "classroom", dot: "var(--accent-violet)", title: "Priya Rao replied to your post in the Chemistry classroom", meta: "Classroom · 1 hour ago", href: "/classroom/chem11", read: false },
  { id: "grade", dot: "var(--success-500)", title: "Stoichiometry Set 5 was graded: A", meta: "My Grades · yesterday", href: "/grades", read: false },
  { id: "worksheet", dot: "var(--danger-500)", title: "Whole Numbers Topic Test is due Saturday", meta: "Worksheets · 2 days away", href: "/courses", read: false },
  { id: "library", dot: "var(--brand-500)", title: "New notes added to Chemistry", meta: "Library · yesterday", href: "/library", read: false },
];

function pageMeta(pathname: string, greeting: string, dueCount: number): { t: string; s: string } {
  if (pathname === "/") return { t: greeting + ", Maya", s: "You have one class today and " + dueCount + " worksheets to submit." };
  if (pathname === "/courses") return { t: "My Courses", s: "Everything you are enrolled in this term." };
  if (pathname.startsWith("/courses/")) {
    const id = pathname.split("/")[2] as CourseId;
    const cd = COURSE_DEFS[id];
    if (cd) return { t: cd.name, s: cd.tagline };
    return { t: "Course", s: "" };
  }
  if (pathname === "/grades") return { t: "My Grades", s: "Your submissions, grades and tutor feedback." };
  if (pathname === "/timetable") return { t: "Timetable", s: "Your classes for the term, month by month." };
  if (pathname === "/library") return { t: "Library", s: "Materials from your past sessions, organised by date." };
  if (pathname === "/outline") return { t: "Assessment Tracker", s: "Upload your school outline and Elliot maps out your assessments." };
  if (pathname.startsWith("/classroom/")) return { t: "Classroom", s: "Class announcements, discussion and shared files, all in one place." };
  if (pathname === "/search") return { t: "Search", s: "Results from across your portal." };
  if (pathname === "/messages") return { t: "Message a Tutor", s: "Ask your tutor a question. Every message is monitored for safety." };
  if (pathname === "/chat") return { t: "Chat with Elliot", s: "Homework help between sessions." };
  if (pathname === "/drive") return { t: "My Drive", s: "Your uploads and documents." };
  if (pathname === "/support") return { t: "Support", s: "We usually reply within 24 hours." };
  if (pathname === "/settings") return { t: "Settings", s: "Profile, login and notifications." };
  return { t: "Everest", s: "" };
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { now, dueCount, completionPct, completionDeg, notWired, outlines } = usePortal();
  const { unreadTotal } = useMessaging();
  const unreadMsgs = unreadTotal(STUDENT_ME);
  const [q, setQ] = useState("");
  const [notif, setNotif] = useState(false);
  const [items, setItems] = useState<NotifItem[]>(SEED_NOTIFS);

  useEffect(() => {
    setNotif(false);
    setQ("");
  }, [pathname]);

  const markRead = (id: string) => setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems((list) => list.map((n) => ({ ...n, read: true })));
  const openItem = (n: NotifItem) => {
    markRead(n.id);
    setNotif(false);
    router.push(n.href);
  };
  const hasUnread = unreadMsgs > 0 || items.some((n) => !n.read);

  const nowD = new Date(now);
  const hr = nowD.getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = nowD.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const meta = pageMeta(pathname, greeting, dueCount);

  // Debounced so search only runs once the user pauses - in production this is
  // where a paid model / vector query would fire, so we never hit it per key.
  const ql = useDebouncedValue(q.trim().toLowerCase(), 200);
  const { answer, hits: results } = useMemo(() => aiSearch(ql, outlines, dueCount), [ql, outlines, dueCount]);
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
        {/* Search */}
        <div ref={searchRef} className="ev-header-search" style={{ position: "relative" }}>
          <div
            className="glass-control"
            style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 14px", height: 44 }}
          >
            <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={15} style={{ color: "var(--fg4)" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && q.trim()) {
                  router.push("/search?q=" + encodeURIComponent(q.trim()));
                }
                if (e.key === "Escape") setQ("");
              }}
              placeholder="Ask or search the portal"
              aria-label="Ask or search the portal"
              className="ev-search-input"
              style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", width: 170, minWidth: 0 }}
            />
            <span title="AI search: understands questions and everyday words" aria-hidden="true" style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, color: "var(--accent-violet)", background: "rgba(122,90,248,.12)", padding: "2px 6px", borderRadius: 980, flex: "none" }}>AI</span>
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
              {answer && (
                <button
                  onClick={() => {
                    setQ("");
                    router.push(answer.page);
                  }}
                  className="list-hover"
                  style={{ display: "flex", width: "100%", textAlign: "left", gap: 9, padding: "10px 10px", borderRadius: 10, cursor: "pointer", background: "rgba(122,90,248,.07)", border: "1px solid rgba(122,90,248,.18)", marginBottom: 4, alignItems: "flex-start", fontFamily: "inherit" }}
                >
                  <span aria-hidden="true" style={{ fontSize: 12, marginTop: 1 }}>✦</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, lineHeight: 1.45, color: "#2E1E66" }}>{answer.text}</span>
                    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "var(--accent-violet)", marginTop: 3 }}>{answer.label} →</span>
                  </span>
                </button>
              )}
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
              {results.length === 0 && !answer && (
                <div style={{ padding: "12px 10px", fontSize: 12.5, color: "var(--fg4)", textAlign: "center" }}>No matches. Try a question like &quot;what&apos;s due?&quot;</div>
              )}
              {(results.length > 0 || answer) && (
                <button
                  onClick={() => router.push("/search?q=" + encodeURIComponent(q.trim()))}
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
                background: `conic-gradient(var(--brand-500) ${completionDeg}deg,rgba(0,32,63,.12) 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent-blue-light),var(--accent-violet-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 11 }}>
                {STUDENT.initials}
              </span>
              {hasUnread && <span style={{ position: "absolute", top: -1, right: -1, width: 9, height: 9, borderRadius: "50%", background: "var(--danger-500)", border: "1.5px solid #fff", animation: "evbreathe 2.4s ease-in-out infinite" }} />}
            </span>
            <span className="ev-hide-narrow">
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{STUDENT.name}</span>
              <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>
                {STUDENT.year} · {completionPct}% complete
              </span>
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
                width: 300,
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
                  meta="Message a Tutor · just now"
                  onOpen={() => {
                    setNotif(false);
                    router.push("/messages");
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
          className="icon-btn hit-area-8"
          style={{ width: 22, height: 22, borderRadius: 7, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", marginTop: 9, marginRight: 10 }}
        >
          <Icon path="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" size={12} style={{ color: "var(--fg3)" }} />
        </button>
      )}
    </div>
  );
}
