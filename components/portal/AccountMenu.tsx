// The avatar button that sits at the LEFT of the phone top bar, beside the
// logo. Tapping it opens notifications and sign out.
//
// On desktop the page header carries these; on a phone the header cluster is
// hidden, so without this the only route to notifications was gone. It lives in
// the top bar rather than the drawer because an unread badge has to be visible
// without opening anything.

import React, { useState } from "react";
import { useRouter } from "@/lib/router";
import { Icon } from "@/components/ui/Icon";
import { useDismissable } from "@/lib/use-dismissable";
import { NotifItem } from "@/lib/notifications";

const IC = {
  out: "M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5ZM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5Z",
};

export function AccountMenu({
  name,
  initials,
  role,
  accent,
  seed,
  unreadMsgs,
  messagesHref,
  onSignOut,
}: {
  name: string;
  initials: string;
  role: string;
  accent: string;
  seed: NotifItem[];
  unreadMsgs: number;
  messagesHref: string;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>(seed);
  const wrapRef = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const hasUnread = unreadMsgs > 0 || items.some((n) => !n.read);
  const markAll = () => setItems((list) => list.map((n) => ({ ...n, read: true })));
  const openItem = (n: NotifItem) => {
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setOpen(false);
    router.push(n.href);
  };

  return (
    <div ref={wrapRef} className="ev-account-menu">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={initials + " - account and notifications for " + name}
        aria-expanded={open}
        style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", border: "none", background: accent, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {initials}
        {hasUnread && (
          <span aria-hidden style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "var(--danger-500)", border: "2px solid var(--bg-page)" }} />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="ev-account-drop"
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,.9)",
            borderRadius: 14,
            boxShadow: "0 24px 50px -18px rgba(0,32,63,.35)",
            padding: 8,
            zIndex: "var(--z-dropdown)" as unknown as number,
            animation: "evdrop .18s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 10px", borderBottom: "1px solid rgba(0,32,63,.07)" }}>
            <span style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{initials}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{name}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{role}</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 8px 4px" }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.7, color: "var(--fg4)" }}>NOTIFICATIONS</span>
            {hasUnread && (
              <button onClick={markAll} style={{ border: "none", background: "transparent", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ maxHeight: "42vh", overflowY: "auto", overscrollBehavior: "contain" }} className="thin-scroll">
            {unreadMsgs > 0 && (
              <Row
                dot="var(--brand-500)"
                title={unreadMsgs === 1 ? "You have 1 unread message" : "You have " + unreadMsgs + " unread messages"}
                meta="Messages · just now"
                onOpen={() => { setOpen(false); router.push(messagesHref); }}
              />
            )}
            {items.map((n) => (
              <Row key={n.id} dot={n.dot} title={n.title} meta={n.meta} read={n.read} onOpen={() => openItem(n)} />
            ))}
            {!hasUnread && (
              <div style={{ padding: "12px 8px 14px", textAlign: "center", fontSize: 12, color: "var(--fg4)" }}>You are all caught up.</div>
            )}
          </div>

          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            className="press"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 8, height: 40, borderRadius: 11, border: "1px solid rgba(0,32,63,.12)", background: "rgba(255,255,255,.8)", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}
          >
            <Icon path={IC.out} size={15} style={{ flex: "none" }} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ dot, title, meta, read, onOpen }: { dot: string; title: string; meta: string; read?: boolean; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="list-hover"
      style={{ display: "flex", width: "100%", gap: 9, alignItems: "flex-start", padding: "9px 8px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: read ? "var(--fg5-decorative)" : dot, flex: "none", marginTop: 5 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: read ? 500 : 600, color: read ? "var(--fg3)" : "var(--fg1)", lineHeight: 1.4 }}>{title}</span>
        <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)", marginTop: 2 }}>{meta}</span>
      </span>
    </button>
  );
}
