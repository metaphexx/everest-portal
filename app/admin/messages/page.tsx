// Office messages.
//
// The office is already a party in the messaging model - tutors and students
// both have an "Everest Admin" thread - so this is the other end of threads
// that already exist, not a new inbox. Threads are grouped by who is on the
// other side, because how the office answers a student differs from how it
// answers a tutor.

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { ADMIN } from "@/lib/admin-data";

const IC = {
  send: "M2 21 23 12 2 3v7l15 2-15 2v7Z",
  search: "m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z",
};

interface Msg {
  who: "them" | "us";
  text: string;
  when: string;
}

interface Thread {
  id: string;
  name: string;
  initials: string;
  role: "Tutor" | "Student" | "Parent";
  context: string;
  colour: string;
  unread: boolean;
  msgs: Msg[];
}

const THREADS: Thread[] = [
  {
    id: "t1",
    name: "Priya Rao",
    initials: "PR",
    role: "Tutor",
    context: "Harrisdale SHS · Year 9 Science",
    colour: "#7A5AF8",
    unread: true,
    msgs: [
      { who: "them", text: "The Tuesday Year 9 booklets have not come back from the print room yet. The class is at 5pm - can someone check?", when: "Today, 8:12am" },
      { who: "us", text: "Checking with Harrisdale now. If it has not run I will move it to the back office printer.", when: "Today, 8:20am" },
      { who: "them", text: "Thank you. I can collect them on the way in if that helps.", when: "Today, 8:24am" },
    ],
  },
  {
    id: "t2",
    name: "Tobi Okafor",
    initials: "TO",
    role: "Tutor",
    context: "Harrisdale SHS · Year 10 Mathematics",
    colour: "#0E9C8E",
    unread: true,
    msgs: [{ who: "them", text: "Can I be given online duties as well? I have two students asking about catch-up sessions over the holidays.", when: "Yesterday, 6:40pm" }],
  },
  {
    id: "t3",
    name: "Anita Kapoor",
    initials: "AK",
    role: "Parent",
    context: "Maya Kapoor · Year 11 Chemistry",
    colour: "#D68910",
    unread: false,
    msgs: [
      { who: "them", text: "Is there a make-up session for the class Maya missed on 25 June?", when: "1 Jul, 4:02pm" },
      { who: "us", text: "Yes - the recording is already in her library, and Priya has offered the Thursday 6:30pm slot for questions.", when: "1 Jul, 4:35pm" },
      { who: "them", text: "Perfect, thank you.", when: "1 Jul, 4:41pm" },
    ],
  },
  {
    id: "t4",
    name: "Maya Kapoor",
    initials: "MK",
    role: "Student",
    context: "Year 11 · Chemistry, Verbal Reasoning, GATE",
    colour: "#009DFF",
    unread: false,
    msgs: [
      { who: "them", text: "Hi, my portal is not showing the GATE workshop on Saturday. Am I still enrolled?", when: "29 Jun, 7:15pm" },
      { who: "us", text: "You are enrolled. The Saturday session was moved to 10am and your timetable now shows it.", when: "29 Jun, 7:50pm" },
    ],
  },
];

const ROLE_FILTERS = ["All", "Tutor", "Student", "Parent"] as const;

export default function AdminMessages() {
  const { showToast } = useAdmin();
  const [role, setRole] = useState<(typeof ROLE_FILTERS)[number]>("All");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState(THREADS[0].id);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<Record<string, Msg[]>>({});

  const shown = useMemo(
    () =>
      THREADS.filter((t) => {
        if (role !== "All" && t.role !== role) return false;
        const ql = q.trim().toLowerCase();
        return !ql || (t.name + " " + t.context + " " + t.msgs.map((m) => m.text).join(" ")).toLowerCase().includes(ql);
      }),
    [role, q]
  );

  const active = THREADS.find((t) => t.id === activeId) ?? shown[0] ?? THREADS[0];
  const msgs = [...active.msgs, ...(sent[active.id] ?? [])];

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setSent((s) => ({ ...s, [active.id]: [...(s[active.id] ?? []), { who: "us", text, when: "Just now" }] }));
    setDraft("");
    showToast("Reply sent to " + active.name);
  };

  return (
    <div className="ev-split" style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 16, height: "calc(100dvh - 230px)", minHeight: 480, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* ---- thread list ---- */}
      <div className="glass-card thin-scroll" style={{ padding: "16px 16px 10px", boxSizing: "border-box", overflowY: "auto", minHeight: 0 }}>
        <span className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 12px", height: 42, marginBottom: 10 }}>
          <Icon path={IC.search} size={14} style={{ color: "var(--fg4)", flex: "none" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12.5, height: "100%" }} />
        </span>

        <div className="ev-scroll-x" style={{ display: "flex", gap: 7, marginBottom: 6 }}>
          {ROLE_FILTERS.map((r) => {
            const on = role === r;
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                aria-pressed={on}
                className="press ev-tap-h"
                style={{ height: 32, padding: "0 12px", borderRadius: 980, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", background: on ? "var(--accent-teal)" : "rgba(255,255,255,.8)", color: on ? "#fff" : "var(--fg3)" }}
              >
                {r === "All" ? "Everyone" : r + "s"}
              </button>
            );
          })}
        </div>

        {shown.map((t) => {
          const on = t.id === active.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className="list-hover"
              style={{ display: "flex", width: "100%", textAlign: "left", gap: 10, padding: "11px 10px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", background: on ? "rgba(14,156,142,.1)" : "transparent", marginTop: 2 }}
            >
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: t.colour, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{t.initials}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? "var(--accent-teal)" : "var(--fg1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--fg4)", background: "rgba(0,32,63,.06)", padding: "2px 7px", borderRadius: 980, flex: "none" }}>{t.role}</span>
                  {t.unread && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--danger-500)", flex: "none", marginLeft: "auto" }} />}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.context}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--fg3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.msgs[t.msgs.length - 1].text}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- conversation ---- */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", minHeight: 0, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 18px", borderBottom: "1px solid rgba(0,32,63,.07)", flex: "none" }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: active.colour, color: "#fff", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{active.initials}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 800 }}>{active.name}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{active.context}</span>
          </span>
        </div>

        <div className="thin-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.who === "us" ? "flex-end" : "flex-start", gap: 3 }}>
              <div
                style={{
                  maxWidth: "min(76%, 520px)",
                  borderRadius: m.who === "us" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "11px 14px",
                  fontSize: 13,
                  lineHeight: 1.55,
                  background: m.who === "us" ? "var(--accent-teal)" : "rgba(255,255,255,.92)",
                  color: m.who === "us" ? "#fff" : "var(--fg1)",
                  boxShadow: m.who === "us" ? "none" : "0 8px 20px -14px rgba(0,32,63,.3)",
                }}
              >
                {m.text}
              </div>
              <span style={{ fontSize: 10.5, color: "var(--fg4)" }}>{m.when}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 16px 14px", borderTop: "1px solid rgba(0,32,63,.07)", flex: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={"Reply to " + active.name.split(" ")[0]}
              aria-label={"Reply to " + active.name}
              className="field"
              style={{ flex: 1, minWidth: 0, height: 44 }}
            />
            <button onClick={send} disabled={!draft.trim()} aria-label="Send" className="btn-primary press" style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", opacity: draft.trim() ? 1 : 0.5 }}>
              <Icon path={IC.send} size={15} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 8, lineHeight: 1.5 }}>
            Sent from {ADMIN.email}. Everything here is on the record: tutors and students are told the office can see and keep these threads.
          </div>
        </div>
      </div>
    </div>
  );
}
