import React, { useEffect, useRef, useState } from "react";
import { usePortal } from "@/lib/store";
import { chatSeeds } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { ElliotMark } from "@/components/ui/ElliotMark";

export default function ChatPage() {
  const { chatMsgs, chatActive, setChatActive, chatTyping, sendChat, notWired, elliotCapped } = usePortal();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const seeds = chatSeeds();

  const dynamicKeys = Object.keys(chatMsgs).filter((k) => !seeds[k] && k !== "fab");
  const list = [
    { id: "new", title: "New chat", when: "" },
    ...dynamicKeys.map((k) => ({ id: k, title: chatMsgs[k].title, when: chatMsgs[k].when })),
    ...Object.keys(seeds).map((k) => ({ id: k, title: (chatMsgs[k] || seeds[k]).title, when: seeds[k].when })),
  ];

  const msgs = chatActive === "new" ? [] : chatMsgs[chatActive]?.msgs ?? seeds[chatActive]?.msgs ?? [];
  const empty = msgs.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs.length, chatTyping, chatActive]);

  const send = () => {
    sendChat(draft);
    setDraft("");
  };

  return (
    <div className="ev-split" style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 16, height: "calc(100dvh - 210px)", minHeight: 440, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* thread list */}
      <div className="glass-card thin-scroll" style={{ padding: 14, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        {list.map((c) => {
          const on = chatActive === c.id;
          return (
            <button key={c.id} onClick={() => setChatActive(c.id)} aria-pressed={on} className="list-hover" style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 9, padding: "10px 11px", borderRadius: 12, cursor: "pointer", background: on ? "rgba(0,157,255,.12)" : "transparent", border: "none", fontFamily: "inherit" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: on ? "var(--brand-600)" : "var(--fg1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
                {c.when && <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>{c.when}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* conversation */}
      <div className="glass-card" style={{ boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Gentle notice only when Elliot has hit the (invisible) daily allowance */}
        {elliotCapped && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 18px", borderBottom: "1px solid rgba(0,32,63,.06)", background: "rgba(245,166,35,.08)" }}>
            <Icon path="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z" size={14} style={{ color: "var(--warn-700)", flex: "none" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#8A5B08" }}>Elliot has helped with a lot today and is taking a short break. Please try again later, or message a tutor if it is urgent.</span>
          </div>
        )}
        <div ref={scrollRef} className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {empty && (
            <div style={{ margin: "auto", textAlign: "center", maxWidth: 380 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><ElliotMark size={92} title="Elliot" /></div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>Hi Maya, I&apos;m Elliot</div>
              <div style={{ fontSize: 13, color: "var(--fg3)", margin: "6px 0 16px", lineHeight: 1.5 }}>Ask me anything about your courses, worksheets or upcoming classes. I know where you&apos;re at.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                <Starter onClick={() => sendChat("Give me some practice recommendations")}>Practice recommendations</Starter>
                <Starter onClick={() => sendChat("Show my progress")}>Show my progress</Starter>
                <Starter onClick={() => sendChat("Explain a concept from my next class")}>Explain a concept</Starter>
              </div>
            </div>
          )}
          {msgs.map((m, i) => {
            const mine = m.who === "u";
            return (
              <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "72%", padding: "11px 15px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: mine ? "var(--brand-500)" : "rgba(255,255,255,.85)", color: mine ? "#fff" : "var(--fg1)", fontSize: 13, lineHeight: 1.55, boxShadow: mine ? "0 8px 20px -10px rgba(0,157,255,.5)" : "0 8px 20px -12px rgba(0,32,63,.2)", animation: "evdrop .25s ease-out" }}>{m.text}</div>
              </div>
            );
          })}
          {chatTyping && !empty && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "13px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,.85)", boxShadow: "0 8px 20px -12px rgba(0,32,63,.2)", display: "flex", gap: 5, alignItems: "center" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s infinite" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s .2s infinite" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s .4s infinite" }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(0,32,63,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.85)", border: "1px solid rgba(0,32,63,.1)", borderRadius: 14, padding: "6px 8px 6px 14px" }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={elliotCapped ? "Elliot is taking a short break - try again later" : "Ask Elliot a question"} disabled={elliotCapped} aria-label="Ask Elliot" style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", minWidth: 0, opacity: elliotCapped ? 0.6 : 1 }} />
            <button onClick={() => notWired("File attachments")} title="Attach a file" className="list-hover" style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: "transparent", color: "var(--fg3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path="M16.5 6.5v9a4.5 4.5 0 0 1-9 0V5a3 3 0 0 1 6 0v9.5a1.5 1.5 0 0 1-3 0V6.5H9v8a3 3 0 0 0 6 0V5a4.5 4.5 0 0 0-9 0v10.5a6 6 0 0 0 12 0v-9h-1.5Z" size={16} />
            </button>
            <button onClick={() => notWired("Voice input")} title="Voice input" className="list-hover" style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: "transparent", color: "var(--fg3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" size={16} />
            </button>
            <button onClick={send} className="btn-primary" style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path="M2 21 23 12 2 3v7l15 2-15 2v7Z" size={15} />
            </button>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--fg4)", textAlign: "center", marginTop: 8 }}>Elliot can make mistakes. Check important answers with your tutor.</div>
        </div>
      </div>
    </div>
  );
}

function Starter({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="list-hover ev-tap-h" style={{ height: 34, padding: "0 15px", borderRadius: 980, border: "1px solid rgba(0,157,255,.3)", background: "rgba(0,157,255,.08)", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
      {children}
    </button>
  );
}
