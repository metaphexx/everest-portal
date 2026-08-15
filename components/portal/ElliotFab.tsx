// Floating Elliot: agentic assistant. Answers from live portal state and
// returns action buttons (navigate, submit a worksheet, log a support
// request). Every reply counts against the daily AI budget cap.

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "@/lib/router";
import { ChatAction, ChatMsg, usePortal } from "@/lib/store";
import { STUDENT_ME, useMessaging } from "@/lib/messaging";
import { elliotAgent } from "@/lib/elliot-agent";
import { Icon } from "@/components/ui/Icon";
import { ElliotMark } from "@/components/ui/ElliotMark";

export function ElliotFab() {
  const portal = usePortal();
  const { fabOpen, setFabOpen, chatMsgs, chatTyping, fabAgent, addSupportRequest, setDrivePick, dueCount, completionPct, outlines, supportRequests } = portal;
  const { unreadTotal } = useMessaging();
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [nudge, setNudge] = useState(false);
  const [nudgeSeen, setNudgeSeen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgs = chatMsgs.fab?.msgs ?? [];
  const empty = msgs.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs.length, chatTyping]);

  // Proactive nudge: after a short idle moment, Elliot offers a hand once.
  // Dismissed for good the moment it is opened or waved away.
  useEffect(() => {
    if (fabOpen || nudgeSeen) return;
    const t = setTimeout(() => setNudge(true), 7000);
    return () => clearTimeout(t);
  }, [fabOpen, nudgeSeen]);

  useEffect(() => {
    if (fabOpen) setNudge(false);
  }, [fabOpen]);

  const ask = (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    const plan = elliotAgent(msg, {
      dueCount,
      completionPct,
      outlines,
      unreadMessages: unreadTotal(STUDENT_ME),
      openSupportCount: supportRequests.filter((r) => r.status !== "resolved").length,
    });
    // Support requests reach a human, so they are always accepted - even once
    // the daily AI allowance is spent - and they bypass the answer cap.
    const isSupport = !!plan.createSupport;
    if (plan.createSupport) {
      addSupportRequest(plan.createSupport.type, plan.createSupport.message);
    }
    fabAgent(msg, plan.reply, { bypassCap: isSupport });
  };

  const openNudge = () => {
    setNudge(false);
    setNudgeSeen(true);
    setFabOpen(true);
  };

  const send = () => {
    ask(draft);
    setDraft("");
  };

  const runAction = (a: ChatAction) => {
    if (a.kind === "submit") {
      setDrivePick(true);
      router.push("/drive");
      setFabOpen(false);
      return;
    }
    if (a.href) {
      router.push(a.href);
      setFabOpen(false);
    }
  };

  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: "var(--z-fab)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
      {fabOpen && (
        <div
          style={{
            width: 350,
            height: 490,
            background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(28px) saturate(1.3)",
            WebkitBackdropFilter: "blur(28px) saturate(1.3)",
            border: "1px solid rgba(255,255,255,.9)",
            borderRadius: 20,
            boxShadow: "0 34px 80px -24px rgba(0,32,63,.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "evdrop .22s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px 9px", borderBottom: "1px solid rgba(0,32,63,.07)" }}>
            {/* Same darker ground as the button that opened it, so the mark does
                not change character between closed and open. */}
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent-violet),var(--brand-500))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><ElliotMark size={20} tone="solid" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Elliot</div>
              <div style={{ fontSize: 10.5, color: "var(--fg4)" }}>Can answer, navigate and log issues for you</div>
            </div>
            <button onClick={() => setFabOpen(false)} aria-label="Close Elliot" className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 9, background: "transparent", border: "none", color: "var(--fg3)", fontSize: 13, lineHeight: 1 }}>
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "14px 15px", display: "flex", flexDirection: "column", gap: 8 }}>
            {empty && (
              <div style={{ margin: "auto", textAlign: "center", maxWidth: 270 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Hi Maya, need a hand?</div>
                <div style={{ fontSize: 12, color: "var(--fg3)", margin: "5px 0 12px", lineHeight: 1.5 }}>I can check what&apos;s due, open any page, track your assessments, or log a problem with the Everest team for you.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <StarterChip onClick={() => ask("What is due this week?")}>What&apos;s due this week?</StarterChip>
                  <StarterChip onClick={() => ask("When is my next assessment?")}>When&apos;s my next assessment?</StarterChip>
                  <StarterChip onClick={() => ask("I have a problem with billing")}>Report a problem</StarterChip>
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <Bubble key={i} who={m.who} text={m.text} actions={m.actions} onAction={runAction} />
            ))}
            {chatTyping && !empty && <Typing />}
          </div>

          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(0,32,63,.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.9)", border: "1px solid rgba(0,32,63,.1)", borderRadius: 12, padding: "4px 5px 4px 12px" }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask Elliot or report a problem"
                aria-label="Ask Elliot"
                style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12.5, color: "var(--fg1)", minWidth: 0 }}
              />
              <button onClick={send} aria-label="Send" className="btn-primary" style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path="M2 21 23 12 2 3v7l15 2-15 2v7Z" size={13} />
              </button>
            </div>
            <div style={{ fontSize: 9.5, color: "var(--fg4)", textAlign: "center", marginTop: 6 }}>Elliot can make mistakes. Check important answers with your tutor.</div>
          </div>
        </div>
      )}
      {nudge && !fabOpen && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            maxWidth: 250,
            background: "rgba(255,255,255,.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,.9)",
            borderRadius: "16px 16px 4px 16px",
            boxShadow: "0 20px 44px -18px rgba(0,32,63,.45)",
            padding: "12px 13px",
            animation: "evdrop .28s ease-out",
          }}
        >
          <button
            onClick={openNudge}
            style={{ flex: 1, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
          >
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--fg1)" }}>Hi Maya, need a hand?</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--fg3)", marginTop: 3, lineHeight: 1.45 }}>I can check what&apos;s due, open a page, or log a problem for you.</span>
          </button>
          <button
            onClick={() => {
              setNudge(false);
              setNudgeSeen(true);
            }}
            aria-label="Dismiss"
            className="ev-tap-area"
            style={{ width: 20, height: 20, borderRadius: 7, border: "none", background: "rgba(0,32,63,.06)", color: "var(--fg3)", fontSize: 11, lineHeight: 1, cursor: "pointer", flex: "none" }}
          >
            ✕
          </button>
        </div>
      )}
      <button
        onClick={() => setFabOpen((v) => !v)}
        title="Chat with Elliot"
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          border: "none",
          // Same darker gradient as the tutor's Elliot button, so the assistant
          // reads as one thing across both portals. The mark is the solid tone:
          // a gradient mark on a gradient ground muddies both.
          background: "linear-gradient(135deg,var(--accent-violet),var(--brand-500))",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 16px 34px -12px rgba(0,32,63,.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform .25s cubic-bezier(.16,1,.3,1)",
        }}
        className="fab-btn"
      >
        <ElliotMark size={29} tone="solid" />
      </button>
    </div>
  );
}

function StarterChip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="list-hover"
      style={{ height: 32, borderRadius: 980, border: "1px solid rgba(0,157,255,.3)", background: "rgba(0,157,255,.08)", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

export function Bubble({ who, text, actions, onAction }: { who: "u" | "e"; text: string; actions?: ChatAction[]; onAction?: (a: ChatAction) => void }) {
  const mine = who === "u";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 6 }}>
      <div
        style={{
          maxWidth: "82%",
          padding: "9px 13px",
          borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: mine ? "var(--brand-500)" : "#FFFFFF",
          color: mine ? "#fff" : "var(--fg1)",
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.5,
          boxShadow: mine ? "0 8px 20px -10px rgba(0,157,255,.5)" : "0 8px 20px -12px rgba(0,32,63,.2)",
          animation: "evdrop .25s ease-out",
        }}
      >
        {text}
      </div>
      {!mine && actions && actions.length > 0 && onAction && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: "88%" }}>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => onAction(a)}
              className="list-hover"
              style={{ height: 28, padding: "0 12px", borderRadius: 980, border: "1px solid rgba(0,157,255,.35)", background: "rgba(0,157,255,.08)", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Typing() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{ padding: "11px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,.95)", boxShadow: "0 8px 20px -12px rgba(0,32,63,.2)", display: "flex", gap: 5, alignItems: "center" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s infinite" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s .2s infinite" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s .4s infinite" }} />
      </div>
    </div>
  );
}
