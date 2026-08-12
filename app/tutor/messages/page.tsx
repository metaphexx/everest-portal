// Messages - the tutor side of the AI-monitored channel, on the same shared
// store as the student portal. Safeguarding messages arrive DELIVERED with an
// urgent banner (never hidden); a tutor's poaching/abuse attempt is withheld
// and flagged. Includes read receipts, attachments and the Everest admin line.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTutor } from "@/lib/tutor-store";
import {
  ChatAttachment,
  ChatThread,
  TUTOR_ME,
  SUPPORT_TOPICS,
  SupportTopic,
  fmtWhen,
  useMessaging,
} from "@/lib/messaging";
import { Bubble, Composer, ComposerHandle, DaySeparator, DropZone, IC, Lightbox, TypingDots, UnreadBadge, isSep, withDaySeparators } from "@/components/messaging/parts";
import { Icon } from "@/components/ui/Icon";

type Filter = "all" | "open" | "resolved";

function Avatar({ t, size = 36 }: { t: ChatThread; size?: number }) {
  const admin = t.kind === "admin";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flex: "none",
        background: admin ? "linear-gradient(135deg,var(--navy-500),var(--accent-navy-blue))" : "linear-gradient(135deg,var(--brand-500),var(--accent-violet))",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.32,
        position: "relative",
      }}
    >
      {admin ? "E" : t.student.init}
      {t.safeguarding && <span style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "var(--danger-500)", border: "2px solid #fff", animation: "evpulse 1.6s ease-in-out infinite" }} />}
    </div>
  );
}

export default function TutorMessagesPage() {
  const { showToast } = useTutor();
  const { hydrated, messages, typing, threadsFor, unreadCount, isRead, markRead, sendMessage, setThreadStatus } = useMessaging();

  const myThreads = threadsFor(TUTOR_ME);
  const [activeId, setActiveId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [preview, setPreview] = useState<ChatAttachment | null>(null);
  const [pendingTopic, setPendingTopic] = useState<SupportTopic | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropHandle = useRef<ComposerHandle | null>(null);

  useEffect(() => {
    if (activeId || myThreads.length === 0) return;
    // Land on the most urgent thread: safeguarding first, else newest non-pinned.
    const urgent = myThreads.find((t) => t.safeguarding);
    setActiveId((urgent ?? myThreads.find((t) => !t.pinned) ?? myThreads[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myThreads.length, activeId]);

  const active = myThreads.find((t) => t.id === activeId) ?? null;
  const activeMsgs = useMemo(() => (active ? messages[active.id] ?? [] : []), [messages, active]);

  useEffect(() => {
    if (active && hydrated) markRead(active.id, TUTOR_ME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, activeMsgs.length, hydrated]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeMsgs.length, activeId, typing]);

  const visibleThreads = myThreads.filter((t) => {
    if (filter !== "all" && t.status !== filter && !t.pinned) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const meta = (t.kind === "admin" ? "everest admin office" : t.student.name + " " + (t.course ?? "")).toLowerCase();
    return meta.includes(q) || (messages[t.id] ?? []).some((m) => m.text.toLowerCase().includes(q));
  });

  const send = useCallback(
    (text: string, atts: ChatAttachment[]): boolean => {
      if (!active) return false;
      const cls = sendMessage(active.id, TUTOR_ME, "tutor", text, atts, active.kind === "admin" ? pendingTopic ?? "feedback" : undefined);
      if (cls?.held) showToast("Message withheld and flagged to the Everest team");
      if (active.kind === "admin") setPendingTopic(null);
      return true;
    },
    [active, sendMessage, pendingTopic, showToast]
  );

  const title = active ? (active.kind === "admin" ? "Everest Admin" : active.student.name) : "";
  const subtitle = active ? (active.kind === "admin" ? "The Everest office · print, timetabling, escalations" : active.course ?? "") : "";

  return (
    <div className="ev-split" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, height: "calc(100vh - 210px)", minHeight: 500, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* ---- thread list ---- */}
      <div className="glass-card" style={{ padding: 12, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.8)", border: "1px solid rgba(0,32,63,.09)", borderRadius: 10, padding: "0 10px", height: 34, flex: "none" }}>
          <Icon path={IC.search} size={13} style={{ color: "var(--fg4)", flex: "none" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students and messages"
            aria-label="Search students and messages"
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12, color: "var(--fg1)", minWidth: 0, outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 5, flex: "none" }} role="tablist" aria-label="Filter conversations">
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
                padding: "4px 11px",
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
            const unread = unreadCount(t.id, TUTOR_ME);
            const name = t.kind === "admin" ? "Everest Admin" : t.student.name;
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className="list-hover"
                aria-pressed={on}
                aria-label={"Open conversation with " + name + (unread ? ", " + unread + " unread" : "")}
                style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 12, cursor: "pointer", background: on ? "rgba(0,157,255,.1)" : "transparent", border: "none", fontFamily: "inherit" }}
              >
                <Avatar t={t} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: unread ? 700 : 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                    {t.pinned && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--accent-navy-blue)", background: "rgba(0,85,140,.1)", padding: "1px 6px", borderRadius: 980, flex: "none" }}>Office</span>}
                    {t.status === "resolved" && <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "2px 7px", borderRadius: 980, flex: "none" }}>Resolved</span>}
                  </div>
                  <div style={{ fontSize: 11, color: unread ? "var(--fg2)" : "var(--fg4)", fontWeight: unread ? 600 : 400, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.kind === "admin" ? "" : (t.course ?? "") + " · "}
                    {last ? (last.role === "system" ? "Update" : (last.senderId === TUTOR_ME ? "You: " : "") + (last.text || "Attachment")) : "No messages yet"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flex: "none" }}>
                  {last && <span style={{ fontSize: 9.5, color: "var(--fg6-faint)" }}>{fmtWhen(last.sentAt, Date.now())}</span>}
                  <UnreadBadge n={unread} />
                </div>
              </button>
            );
          })}
          {visibleThreads.length === 0 && (
            <div style={{ padding: "26px 12px", textAlign: "center", fontSize: 12, color: "var(--fg4)", lineHeight: 1.6 }}>
              {query ? "Nothing matches that search." : "No conversations in this view."}
            </div>
          )}
        </div>
        <div style={{ margin: "4px 4px 0", fontSize: 11, fontWeight: 600, color: "var(--fg3)", lineHeight: 1.55, borderTop: "1px solid rgba(0,32,63,.08)", paddingTop: 10, flex: "none" }}>
          Every message here is monitored by Elliot for safety. Serious concerns go straight to the Everest team.
        </div>
      </div>

      {/* ---- thread ---- */}
      {active ? (
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", boxSizing: "border-box", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 18px", borderBottom: "1px solid rgba(0,32,63,.07)", flex: "none" }}>
            <Avatar t={active} size={36} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>{title}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{subtitle}</span>
            </span>
            {active.kind !== "admin" && (
              <button
                onClick={() => setThreadStatus(active.id, active.status === "open" ? "resolved" : "open")}
                className="btn-ghost press"
                style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, color: active.status === "resolved" ? "var(--fg3)" : "var(--success-700)", flex: "none" }}
              >
                {active.status === "resolved" ? "Reopen" : "Mark resolved"}
              </button>
            )}
          </div>

          {active.safeguarding && (
            <div style={{ margin: "12px 18px 0", background: "rgba(224,65,65,.09)", border: "1px solid rgba(224,65,65,.25)", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", flex: "none", animation: "evfadein .3s ease" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--danger-500)", marginTop: 5, flex: "none", animation: "evpulse 1.6s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, color: "#8C2B2B", lineHeight: 1.55 }}>
                <b>Safeguarding alert.</b> A message in this thread raised a wellbeing concern. It was delivered to you and escalated to the Everest team as a priority. Respond with care and do not promise confidentiality.
              </span>
            </div>
          )}

          <DropZone onFiles={(f) => dropHandle.current?.addFiles(f)} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div ref={scrollRef} className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
              {withDaySeparators(activeMsgs, Date.now()).map((item) =>
                isSep(item) ? (
                  <DaySeparator key={item.id} label={item.sep} />
                ) : (
                  <Bubble key={item.id} msg={item} mine={item.senderId === TUTOR_ME} read={isRead(active, item, TUTOR_ME)} onPreview={setPreview} />
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
              placeholder={active.kind === "admin" ? "Message the Everest office" : "Reply to " + active.student.name.split(" ")[0] + ". Keep it on the platform."}
              onSend={send}
              onError={showToast}
              registerDropTarget={(h) => (dropHandle.current = h)}
            />
          </DropZone>
          <div style={{ fontSize: 10.5, color: "var(--fg4)", padding: "0 18px 12px", flex: "none" }}>
            Monitored for safety. Off-platform contact details or payment requests are withheld automatically and flagged to the Everest team.
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg4)", fontSize: 13 }}>Pick a conversation to get started.</div>
      )}

      <Lightbox att={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
