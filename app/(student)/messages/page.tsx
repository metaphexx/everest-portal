// Message a Tutor - the student side of the AI-monitored channel.
// Real shared threads (the tutor portal reads the same store), delivery and
// read receipts, media attachments, and a pinned Everest Support channel.

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "@/lib/router";
import { usePortal } from "@/lib/store";
import {
  ChatAttachment,
  ChatThread,
  STUDENT_ME,
  SUPPORT_TOPICS,
  SupportTopic,
  fmtWhen,
  useMessaging,
} from "@/lib/messaging";
import { Bubble, Composer, ComposerHandle, DaySeparator, DropZone, IC, Lightbox, TypingDots, UnreadBadge, isSep, withDaySeparators } from "@/components/messaging/parts";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

type Filter = "all" | "open" | "resolved";

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesInner />
    </Suspense>
  );
}

function Avatar({ t, size = 36 }: { t: ChatThread; size?: number }) {
  const admin = t.kind === "admin";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flex: "none",
        background: admin ? "linear-gradient(135deg,var(--navy-500),var(--accent-navy-blue))" : "linear-gradient(135deg,var(--accent-blue-light),var(--accent-violet-light))",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.34,
        position: "relative",
      }}
    >
      {admin ? "E" : t.tutor?.init}
      {t.safeguarding && <span style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "var(--success-500)", border: "2px solid #fff" }} />}
    </div>
  );
}

function MessagesInner() {
  const params = useSearchParams();
  const { showToast } = usePortal();
  const { hydrated, messages, typing, threadsFor, unreadCount, isRead, markRead, sendMessage, setThreadStatus } = useMessaging();

  const myThreads = threadsFor(STUDENT_ME);
  const [activeId, setActiveId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [preview, setPreview] = useState<ChatAttachment | null>(null);
  const [picker, setPicker] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<SupportTopic | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropHandle = useRef<ComposerHandle | null>(null);

  // Resolve the initial thread: deep link (?tutor=Chemistry) or first thread.
  useEffect(() => {
    if (activeId || myThreads.length === 0) return;
    const want = params.get("tutor");
    const hit = want ? myThreads.find((t) => t.course?.toLowerCase() === want.toLowerCase()) : null;
    setActiveId((hit ?? myThreads.find((t) => !t.pinned) ?? myThreads[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myThreads.length, activeId]);

  const active = myThreads.find((t) => t.id === activeId) ?? null;
  const activeMsgs = useMemo(() => (active ? messages[active.id] ?? [] : []), [messages, active]);

  // Opening a thread (or receiving into the open one) marks it read.
  useEffect(() => {
    if (active && hydrated) markRead(active.id, STUDENT_ME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, activeMsgs.length, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [activeMsgs.length, activeId, typing]);

  const visibleThreads = myThreads.filter((t) => {
    if (filter !== "all" && t.status !== filter && !t.pinned) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const inMeta = (t.kind === "admin" ? "everest support team" : (t.tutor?.name ?? "") + " " + (t.course ?? "")).toLowerCase().includes(q);
    const inBody = (messages[t.id] ?? []).some((m) => m.text.toLowerCase().includes(q));
    return inMeta || inBody;
  });

  const send = useCallback(
    (text: string, atts: ChatAttachment[]): boolean => {
      if (!active) return false;
      const cls = sendMessage(active.id, STUDENT_ME, "student", text, atts, active.kind === "admin" ? pendingTopic ?? "feedback" : undefined);
      if (cls?.held) showToast("Sent - this one may be quickly reviewed first");
      if (active.kind === "admin") setPendingTopic(null);
      return true;
    },
    [active, sendMessage, pendingTopic, showToast]
  );

  const title = active ? (active.kind === "admin" ? "Everest Support" : active.tutor?.name ?? "") : "";
  const subtitle = active ? (active.kind === "admin" ? "The Everest team · typically replies within a day" : (active.course ?? "")) : "";

  return (
    <div className="ev-split" style={{ display: "grid", gridTemplateColumns: "286px 1fr", gap: 16, height: "calc(100vh - 210px)", minHeight: 480, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* ---- conversation list ---- */}
      <div className="glass-card" style={{ padding: 12, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.8)", border: "1px solid rgba(0,32,63,.09)", borderRadius: 10, padding: "0 10px", height: 34 }}>
            <Icon path={IC.search} size={13} style={{ color: "var(--fg4)", flex: "none" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages"
              aria-label="Search messages"
              style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12, color: "var(--fg1)", minWidth: 0, outline: "none" }}
            />
          </div>
          <button
            onClick={() => setPicker(true)}
            title="New message"
            aria-label="New message"
            className="btn-primary ev-tap"
            style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}
          >
            <Icon path={IC.plus} size={16} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 5 }} role="tablist" aria-label="Filter conversations">
          {(["all", "open", "resolved"] as Filter[]).map((f) => (
            <button
              key={f}
              className="ev-tap-h"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 980,
                // "All" is a three-letter label, so height alone left a 35px
                // wide target. The padding is what gives it a thumb's width.
                padding: "4px 16px",
                fontSize: 10.5,
                fontWeight: 700,
                fontFamily: "inherit",
                background: filter === f ? "rgba(0,157,255,.14)" : "rgba(0,32,63,.05)",
                color: filter === f ? "var(--brand-600)" : "var(--fg3)",
              }}
            >
              {f === "all" ? "All" : f === "open" ? "Open" : "Resolved"}
            </button>
          ))}
        </div>
        <div className="thin-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {visibleThreads.map((t) => {
            const on = t.id === activeId;
            const last = (messages[t.id] ?? []).slice(-1)[0];
            const unread = unreadCount(t.id, STUDENT_ME);
            const name = t.kind === "admin" ? "Everest Support" : t.tutor?.name ?? "";
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className="list-hover"
                aria-pressed={on}
                style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 12, cursor: "pointer", background: on ? "rgba(0,157,255,.1)" : "transparent", border: "none", fontFamily: "inherit" }}
              >
                <Avatar t={t} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: unread ? 700 : 600, color: on ? "var(--brand-600)" : "var(--fg1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                    {t.pinned && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--accent-navy-blue)", background: "rgba(0,85,140,.1)", padding: "1px 6px", borderRadius: 980, flex: "none" }}>Team</span>}
                    {t.status === "resolved" && <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "1px 6px", borderRadius: 980, flex: "none" }}>Resolved</span>}
                  </div>
                  <div style={{ fontSize: 11, color: unread ? "var(--fg2)" : "var(--fg4)", fontWeight: unread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.kind === "admin" ? "" : (t.course ?? "") + " · "}
                    {last ? (last.role === "system" ? "Update" : (last.senderId === STUDENT_ME ? "You: " : "") + (last.text ? last.text.replace(/[.\s]+$/, "") : "Attachment")) : "No messages yet"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flex: "none" }}>
                  {last && <span style={{ fontSize: 9.5, color: "var(--fg4)" }}>{fmtWhen(last.sentAt, Date.now())}</span>}
                  <UnreadBadge n={unread} />
                </div>
              </button>
            );
          })}
          {visibleThreads.length === 0 && (
            <div style={{ padding: "26px 12px", textAlign: "center", fontSize: 12, color: "var(--fg4)", lineHeight: 1.6 }}>
              {query ? "Nothing matches that search." : filter === "resolved" ? "No resolved conversations yet." : "No conversations here yet. Start one with the + button."}
            </div>
          )}
        </div>
      </div>

      {/* ---- thread ---- */}
      {active ? (
        <div className="glass-card" style={{ boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderBottom: "1px solid rgba(0,32,63,.07)" }}>
            <Avatar t={active} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg4)" }}>{subtitle}</div>
            </div>
            {active.kind !== "admin" && (
              <button
                onClick={() => setThreadStatus(active.id, active.status === "open" ? "resolved" : "open")}
                className="btn-ghost"
                style={{ height: 32, padding: "0 13px", borderRadius: 10, fontSize: 11.5, background: "rgba(255,255,255,.8)" }}
              >
                {active.status === "open" ? "Mark resolved" : "Reopen"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "rgba(0,157,255,.05)", borderBottom: "1px solid rgba(0,32,63,.05)" }}>
            <Icon path={IC.shield} size={14} style={{ color: "var(--brand-600)", flex: "none" }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg2-alt)" }}>
              {active.kind === "admin"
                ? "You are talking to the Everest team. Anything you send here goes straight to a person."
                : "Messages are monitored to keep everyone safe. If you ever feel unsafe, say so here and our team will help."}
            </span>
          </div>

          <DropZone onFiles={(f) => dropHandle.current?.addFiles(f)} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div ref={scrollRef} className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {withDaySeparators(activeMsgs, Date.now()).map((item) =>
                isSep(item) ? (
                  <DaySeparator key={item.id} label={item.sep} />
                ) : (
                  <Bubble key={item.id} msg={item} mine={item.senderId === STUDENT_ME} read={isRead(active, item, STUDENT_ME)} onPreview={setPreview} />
                )
              )}
              {typing[active.id] && <TypingDots name={typing[active.id]} />}
            </div>

            {active.kind === "admin" && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 16px 4px" }} aria-label="Message topic">
                {SUPPORT_TOPICS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPendingTopic((cur) => (cur === t.id ? null : t.id))}
                    title={t.hint}
                    style={{
                      border: "1px solid " + (pendingTopic === t.id ? "var(--brand-500)" : "rgba(0,32,63,.12)"),
                      cursor: "pointer",
                      borderRadius: 980,
                      padding: "4px 11px",
                      fontSize: 10.5,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      background: pendingTopic === t.id ? "rgba(0,157,255,.12)" : "rgba(255,255,255,.7)",
                      color: pendingTopic === t.id ? "var(--brand-600)" : "var(--fg3)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <Composer
              placeholder={active.kind === "admin" ? "Message the Everest team" : "Message " + (active.tutor?.name ?? "")}
              onSend={send}
              onError={showToast}
              registerDropTarget={(h) => (dropHandle.current = h)}
            />
          </DropZone>
        </div>
      ) : (
        <div className="glass-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg4)", fontSize: 13 }}>Pick a conversation to get started.</div>
      )}

      <Lightbox att={preview} onClose={() => setPreview(null)} />

      {/* ---- new message picker ---- */}
      {picker && (
        <Modal
          onClose={() => setPicker(false)}
          label="New message"
          backdropStyle={{ background: "rgba(0,20,40,.4)", zIndex: "var(--z-toast)" as unknown as number }}
          panelStyle={{ width: 400, maxWidth: "92vw", background: "rgba(255,255,255,.97)", borderRadius: 18, padding: 20 }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>New message</div>
              <button onClick={() => setPicker(false)} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--fg4)" }}>
                <Icon path={IC.close} size={16} />
              </button>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, color: "var(--fg4)", margin: "4px 0 6px" }}>YOUR TUTORS</div>
            {myThreads.filter((t) => t.kind === "tutor").map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveId(t.id);
                  setPicker(false);
                }}
                className="list-hover"
                style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
              >
                <Avatar t={t} size={32} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.tutor?.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--fg4)" }}>{t.course}</div>
                </div>
              </button>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.7, color: "var(--fg4)", margin: "12px 0 6px" }}>THE EVEREST TEAM</div>
            {SUPPORT_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => {
                  const support = myThreads.find((t) => t.kind === "admin");
                  if (support) {
                    setActiveId(support.id);
                    setPendingTopic(topic.id);
                  }
                  setPicker(false);
                }}
                className="list-hover"
                style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(0,32,63,.07)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Icon path={IC.shield} size={14} style={{ color: "var(--accent-navy-blue)" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{topic.label}</div>
                  <div style={{ fontSize: 10.5, color: "var(--fg4)" }}>{topic.hint}</div>
                </div>
              </button>
            ))}
        </Modal>
      )}
    </div>
  );
}
