"use client";

// ============================================================
// Unified messaging store, shared by the student and tutor
// portals. One localStorage-backed source of truth so a message
// sent in one portal is genuinely delivered, read and receipted
// in the other. Moderation rules stay exactly as specced:
// safeguarding always delivers + escalates, poaching/abuse is
// held with a gentle "may be reviewed" state.
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { classifyMessage, Classification, FlagCategory } from "./features";

// ---------- personas ----------
// The demo signs the student portal in as Maya and the tutor
// portal in as Priya Rao. Everyone else is simulated.

export const STUDENT_ME = "maya";
export const TUTOR_ME = "rao";
export const ADMIN_ID = "admin";

export type ChatRole = "student" | "tutor" | "admin" | "system";
export type DeliveryStatus = "sent" | "delivered";
export type SupportTopic = "scheduling" | "billing" | "technical" | "feedback" | "urgent";

export interface ChatAttachment {
  id: string;
  name: string;
  size: number; // bytes
  mime: string;
  kind: "image" | "file";
  dataUrl?: string; // demo store: small files inlined
}

export interface ChatMessage {
  id: string;
  senderId: string; // persona id ("maya", "rao", "lin", ..., "admin") or "system"
  role: ChatRole;
  text: string;
  sentAt: number; // epoch ms
  status: DeliveryStatus; // held messages never progress past "sent"
  held?: boolean;
  flag?: FlagCategory;
  topic?: SupportTopic; // support threads: what the message is about
  attachments?: ChatAttachment[];
}

export interface ChatParty {
  id: string;
  name: string;
  init: string;
}

export interface ChatThread {
  id: string;
  kind: "tutor" | "admin";
  student: ChatParty; // for admin threads: the thread owner if a student, else the tutor party below
  tutor?: ChatParty;
  owner: string; // persona id whose portal shows this thread
  course?: string;
  color: string;
  bg: string;
  status: "open" | "resolved";
  safeguarding?: boolean;
  pinned?: boolean;
  lastRead: Record<string, number>; // reader persona id -> epoch ms
}

interface MessagingDb {
  v: number;
  threads: ChatThread[];
  messages: Record<string, ChatMessage[]>;
}

const LS_KEY = "evr-messaging";
const DB_VERSION = 3;

// Demo clock anchor (matches the portal stores): Thu 2 Jul 2026, 6pm.
const SEED_NOW = Date.parse("2026-07-02T18:00:00");
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let idCounter = 0;
function mid(): string {
  idCounter += 1;
  return "m" + Date.now().toString(36) + "-" + idCounter;
}

// ---------- seed data ----------

function seedDb(): MessagingDb {
  const threads: ChatThread[] = [
    {
      id: "th-chem",
      kind: "tutor",
      student: { id: STUDENT_ME, name: "Maya Kapoor", init: "MK" },
      tutor: { id: TUTOR_ME, name: "Priya Rao", init: "DR" },
      owner: "", // visible to both portals (maya's tutor + rao's student thread)
      course: "Chemistry",
      color: "#7A5AF8",
      bg: "rgba(122,90,248,.13)",
      status: "open",
      lastRead: { [STUDENT_ME]: SEED_NOW - 2 * DAY, [TUTOR_ME]: SEED_NOW - 2 * DAY },
    },
    {
      id: "th-verbal",
      kind: "tutor",
      student: { id: STUDENT_ME, name: "Maya Kapoor", init: "MK" },
      tutor: { id: "lin", name: "Grace Lin", init: "ML" },
      owner: STUDENT_ME,
      course: "Verbal Reasoning",
      color: "#0E9C8E",
      bg: "rgba(18,181,165,.14)",
      status: "resolved",
      lastRead: { [STUDENT_ME]: SEED_NOW - 4 * DAY, lin: SEED_NOW - 4 * DAY },
    },
    {
      id: "th-gate",
      kind: "tutor",
      student: { id: STUDENT_ME, name: "Maya Kapoor", init: "MK" },
      tutor: { id: "chen", name: "David Chen", init: "MC" },
      owner: STUDENT_ME,
      course: "GATE Workshop",
      color: "#D68910",
      bg: "rgba(245,166,35,.16)",
      status: "open",
      lastRead: { chen: SEED_NOW - DAY },
    },
    {
      id: "th-ruby",
      kind: "tutor",
      student: { id: "ruby", name: "Ruby Chen", init: "RC" },
      tutor: { id: TUTOR_ME, name: "Priya Rao", init: "DR" },
      owner: TUTOR_ME,
      course: "Year 9 Science",
      color: "#0E9C8E",
      bg: "rgba(18,181,165,.14)",
      status: "open",
      safeguarding: true,
      lastRead: { ruby: SEED_NOW - 10 * HOUR },
    },
    {
      id: "th-dev",
      kind: "tutor",
      student: { id: "dev", name: "Dev Sharma", init: "DS" },
      tutor: { id: TUTOR_ME, name: "Priya Rao", init: "DR" },
      owner: TUTOR_ME,
      course: "Year 10 Foundations",
      color: "#D68910",
      bg: "rgba(245,166,35,.16)",
      status: "resolved",
      lastRead: { dev: SEED_NOW - 5 * DAY, [TUTOR_ME]: SEED_NOW - 5 * DAY },
    },
    {
      id: "th-support-student",
      kind: "admin",
      student: { id: STUDENT_ME, name: "Maya Kapoor", init: "MK" },
      owner: STUDENT_ME,
      color: "#00203F",
      bg: "rgba(0,32,63,.1)",
      status: "open",
      pinned: true,
      lastRead: { [STUDENT_ME]: SEED_NOW - 6 * DAY, [ADMIN_ID]: SEED_NOW - 6 * DAY },
    },
    {
      id: "th-support-tutor",
      kind: "admin",
      student: { id: TUTOR_ME, name: "Priya Rao", init: "DR" },
      owner: TUTOR_ME,
      color: "#00203F",
      bg: "rgba(0,32,63,.1)",
      status: "open",
      pinned: true,
      lastRead: { [TUTOR_ME]: SEED_NOW - 3 * DAY, [ADMIN_ID]: SEED_NOW - 3 * DAY },
    },
  ];

  const messages: Record<string, ChatMessage[]> = {
    "th-chem": [
      { id: mid(), senderId: STUDENT_ME, role: "student", text: "Hi Priya Rao, I'm stuck on Q4 of the stoichiometry set. Could we go over it on Thursday?", sentAt: SEED_NOW - 3 * DAY + 9 * HOUR - 8 * HOUR, status: "delivered" },
      { id: mid(), senderId: TUTOR_ME, role: "tutor", text: "Of course, Maya. Bring your working and we'll walk through the unit conversions together at the start of class.", sentAt: SEED_NOW - 3 * DAY + 10 * HOUR - 8 * HOUR, status: "delivered" },
    ],
    "th-verbal": [
      { id: mid(), senderId: STUDENT_ME, role: "student", text: "Thanks for the feedback on my essay, that made sense.", sentAt: SEED_NOW - 5 * DAY - 90 * MIN, status: "delivered" },
      { id: mid(), senderId: "lin", role: "tutor", text: "You're very welcome. Your thesis is much sharper this week.", sentAt: SEED_NOW - 5 * DAY - 79 * MIN, status: "delivered" },
      { id: mid(), senderId: "system", role: "system", text: "A message from your tutor was withheld pending a safety review. Our team will follow up if anything is needed.", sentAt: SEED_NOW - 5 * DAY - 55 * MIN, status: "delivered", flag: "poaching", held: true },
    ],
    "th-gate": [
      {
        id: mid(),
        senderId: "chen",
        role: "tutor",
        text: "Maya, here is the extra timed paper we talked about. Try it under exam conditions before Saturday.",
        sentAt: SEED_NOW - DAY + 20 * MIN,
        status: "delivered",
        attachments: [{ id: "att-gate", name: "GATE_timed_paper_4.pdf", size: 1_240_000, mime: "application/pdf", kind: "file" }],
      },
    ],
    "th-ruby": [
      { id: mid(), senderId: "ruby", role: "student", text: "I can't cope with everything this term and I don't really feel safe talking to anyone at school about it.", sentAt: SEED_NOW - 10 * HOUR - 12 * MIN, status: "delivered", flag: "safeguarding" },
      { id: mid(), senderId: "system", role: "system", text: "Safeguarding alert: this message was delivered to you and escalated to the Everest team as a priority. A staff member will follow up today. Please respond with care.", sentAt: SEED_NOW - 10 * HOUR - 11 * MIN, status: "delivered", flag: "safeguarding" },
    ],
    "th-dev": [
      { id: mid(), senderId: "dev", role: "student", text: "Thanks for the extra stoichiometry pack, it helped a lot.", sentAt: SEED_NOW - 5 * DAY - 6 * HOUR, status: "delivered" },
      { id: mid(), senderId: TUTOR_ME, role: "tutor", text: "Great to hear, Dev. We'll build on it next Saturday.", sentAt: SEED_NOW - 5 * DAY - 5 * HOUR, status: "delivered" },
    ],
    "th-support-student": [
      { id: mid(), senderId: ADMIN_ID, role: "admin", text: "Hi Maya, welcome to Everest Support. Message us here about scheduling, billing, technical problems or anything else, and a member of the team will reply.", sentAt: SEED_NOW - 6 * DAY, status: "delivered" },
    ],
    "th-support-tutor": [
      { id: mid(), senderId: ADMIN_ID, role: "admin", text: "Hi Priya Rao, this is your channel to the Everest office. Print requests, timetabling, student concerns, anything at all.", sentAt: SEED_NOW - 3 * DAY, status: "delivered" },
    ],
  };

  return { v: DB_VERSION, threads, messages };
}

// ---------- formatting helpers ----------

const WDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  let h = d.getHours();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return h + ":" + String(d.getMinutes()).padStart(2, "0") + " " + ap;
}

function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayKey(ts: number): string {
  return String(dayStart(ts));
}

export function dayLabel(ts: number, now: number): string {
  const s = dayStart(ts);
  const today = dayStart(now);
  if (s === today) return "Today";
  if (s === today - DAY) return "Yesterday";
  const d = new Date(ts);
  const label = WDAY[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()];
  return now - ts > 300 * DAY ? label + " " + d.getFullYear() : label;
}

/** Compact sidebar timestamp: "9:14 am", "Yesterday", "Mon", "28 Jun". */
export function fmtWhen(ts: number, now: number): string {
  const s = dayStart(ts);
  const today = dayStart(now);
  if (s === today) return fmtTime(ts);
  if (s === today - DAY) return "Yesterday";
  if (today - s < 6 * DAY) return WDAY[new Date(ts).getDay()].slice(0, 3);
  const d = new Date(ts);
  return d.getDate() + " " + MON[d.getMonth()].slice(0, 3);
}

export function fmtSize(bytes: number): string {
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + " MB";
  if (bytes >= 1_000) return Math.round(bytes / 1_000) + " KB";
  return bytes + " B";
}

// ---------- attachment moderation ----------

const CONTACT_FILE_RE = /(phone|number|whatsapp|insta|snap|telegram|contact|venmo|paypal|payid|bank)/i;
const PHONE_IN_NAME_RE = /\d{8,}/;

/** Classify text + attachment names together; the more severe result wins. */
export function classifyOutgoing(text: string, attachments: ChatAttachment[]): Classification {
  const base = classifyMessage(text);
  if (base.safeguarding || base.held) return base;
  const suspect = attachments.find((a) => CONTACT_FILE_RE.test(a.name) || PHONE_IN_NAME_RE.test(a.name));
  if (suspect) {
    return { category: "poaching", severity: "high", reason: "An attachment looks like it may share off-platform contact or payment details", held: true, safeguarding: false };
  }
  return base;
}

// ---------- canned replies ----------

function tutorReply(course: string): string {
  return "Thanks for your message. I'll take a look and reply properly before our next " + course + " session.";
}

function studentReply(): string {
  return "Thanks, that helps a lot!";
}

const ADMIN_REPLY: Record<SupportTopic, string> = {
  scheduling: "Thanks for getting in touch. We've opened a scheduling request and will confirm any changes with you within one business day.",
  billing: "Thanks, we've logged this with our billing team. You'll get a reply here once they've checked your account, usually within one business day.",
  technical: "Sorry about the trouble. Our technical team has been notified and will follow up here. A quick sign-out and back in fixes most issues in the meantime.",
  feedback: "Thank you for the feedback, it genuinely shapes what we build. We've passed it to the right team and will reply here if we need more detail.",
  urgent: "Thanks for flagging this as urgent. A staff member has been paged and will get back to you here as soon as possible today.",
};

const SUPPORT_TOPICS: { id: SupportTopic; label: string; hint: string }[] = [
  { id: "scheduling", label: "Scheduling", hint: "Change, cancel or ask about classes" },
  { id: "billing", label: "Billing", hint: "Invoices, payments and credits" },
  { id: "technical", label: "Technical problem", hint: "Something in the portal is not working" },
  { id: "feedback", label: "Feedback", hint: "Ideas or something we should hear" },
  { id: "urgent", label: "Something is wrong", hint: "A concern that needs a person quickly" },
];

export { SUPPORT_TOPICS };

// ---------- context ----------

interface MessagingContextValue {
  hydrated: boolean;
  threads: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  typing: Record<string, string>; // threadId -> display name currently "typing"
  threadsFor: (viewer: string) => ChatThread[];
  unreadCount: (threadId: string, viewer: string) => number;
  unreadTotal: (viewer: string) => number;
  isRead: (thread: ChatThread, msg: ChatMessage, viewer: string) => boolean;
  markRead: (threadId: string, viewer: string) => void;
  sendMessage: (threadId: string, viewer: string, role: ChatRole, text: string, attachments?: ChatAttachment[], topic?: SupportTopic) => Classification | null;
  setThreadStatus: (threadId: string, status: "open" | "resolved") => void;
  resetDemo: () => void;
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

export function useMessaging(): MessagingContextValue {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}

/** The counterpart whose read state drives the viewer's ticks. */
function counterpartOf(thread: ChatThread, viewer: string): string {
  if (thread.kind === "admin") return viewer === ADMIN_ID ? thread.owner : ADMIN_ID;
  return viewer === thread.student.id ? thread.tutor?.id ?? "" : thread.student.id;
}

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<MessagingDb>(seedDb);
  const [hydrated, setHydrated] = useState(false);
  const [typing, setTyping] = useState<Record<string, string>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Load persisted state after mount (deterministic seed keeps SSR happy),
  // then keep tabs in sync via the storage event.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MessagingDb;
        if (parsed && parsed.v === DB_VERSION && Array.isArray(parsed.threads)) setDb(parsed);
      }
    } catch {
      // corrupted store: fall back to the seed
    }
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as MessagingDb;
        if (parsed && parsed.v === DB_VERSION) setDb(parsed);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    const t = timers.current;
    return () => {
      window.removeEventListener("storage", onStorage);
      t.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(db));
    } catch {
      // quota exceeded (large attachments): drop attachment payloads and retry once
      try {
        const slim: MessagingDb = {
          ...db,
          messages: Object.fromEntries(
            Object.entries(db.messages).map(([k, list]) => [k, list.map((m) => (m.attachments ? { ...m, attachments: m.attachments.map((a) => ({ ...a, dataUrl: undefined })) } : m))])
          ),
        };
        window.localStorage.setItem(LS_KEY, JSON.stringify(slim));
      } catch {
        /* give up quietly; state still lives in memory */
      }
    }
  }, [db, hydrated]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const threadsFor = useCallback(
    (viewer: string) =>
      db.threads
        .filter((t) => t.owner === "" || t.owner === viewer || t.student.id === viewer || t.tutor?.id === viewer)
        .sort((a, b) => {
          if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
          const la = db.messages[a.id]?.slice(-1)[0]?.sentAt ?? 0;
          const lb = db.messages[b.id]?.slice(-1)[0]?.sentAt ?? 0;
          return lb - la;
        }),
    [db]
  );

  const unreadCount = useCallback(
    (threadId: string, viewer: string) => {
      const thread = db.threads.find((t) => t.id === threadId);
      if (!thread) return 0;
      const seen = thread.lastRead[viewer] ?? 0;
      return (db.messages[threadId] ?? []).filter((m) => m.sentAt > seen && m.senderId !== viewer && !(m.held && m.role !== "system")).length;
    },
    [db]
  );

  const unreadTotal = useCallback(
    (viewer: string) => threadsFor(viewer).reduce((n, t) => n + unreadCount(t.id, viewer), 0),
    [threadsFor, unreadCount]
  );

  const isRead = useCallback((thread: ChatThread, msg: ChatMessage, viewer: string) => {
    const counterpart = counterpartOf(thread, viewer);
    return (thread.lastRead[counterpart] ?? 0) >= msg.sentAt;
  }, []);

  const markRead = useCallback((threadId: string, viewer: string) => {
    setDb((d) => ({
      ...d,
      threads: d.threads.map((t) => (t.id === threadId ? { ...t, lastRead: { ...t.lastRead, [viewer]: Date.now() } } : t)),
    }));
  }, []);

  const appendMessage = useCallback((threadId: string, msg: ChatMessage, patch?: Partial<ChatThread>) => {
    setDb((d) => ({
      ...d,
      threads: d.threads.map((t) => (t.id === threadId ? { ...t, ...patch, status: patch?.status ?? "open" } : t)),
      messages: { ...d.messages, [threadId]: [...(d.messages[threadId] ?? []), msg] },
    }));
  }, []);

  const upgradeStatus = useCallback((threadId: string, msgId: string) => {
    setDb((d) => ({
      ...d,
      messages: {
        ...d.messages,
        [threadId]: (d.messages[threadId] ?? []).map((m) => (m.id === msgId && !m.held ? { ...m, status: "delivered" } : m)),
      },
    }));
  }, []);

  const setThreadStatus = useCallback((threadId: string, status: "open" | "resolved") => {
    setDb((d) => ({ ...d, threads: d.threads.map((t) => (t.id === threadId ? { ...t, status } : t)) }));
  }, []);

  const sendMessage = useCallback(
    (threadId: string, viewer: string, role: ChatRole, text: string, attachments: ChatAttachment[] = [], topic?: SupportTopic): Classification | null => {
      const thread = db.threads.find((t) => t.id === threadId);
      const body = text.trim();
      if (!thread || (!body && attachments.length === 0)) return null;

      const cls = classifyOutgoing(body, attachments);
      const now = Date.now();
      const isStudentSender = role === "student";

      if (cls.held && !isStudentSender) {
        // A tutor's poaching/abuse attempt is withheld outright, kept as
        // evidence, and the tutor is warned. Nothing reaches the student.
        appendMessage(threadId, {
          id: mid(),
          senderId: "system",
          role: "system",
          text:
            "This message was withheld and was not delivered to the student. It has been flagged to the Everest team (" +
            (cls.category === "poaching" ? "off-platform contact" : "conduct") +
            ") and your account is under review.",
          sentAt: now,
          status: "delivered",
          flag: cls.category,
          held: true,
        });
        return cls;
      }

      const msg: ChatMessage = {
        id: mid(),
        senderId: viewer,
        role,
        text: body,
        sentAt: now,
        status: "sent",
        held: cls.held || undefined,
        flag: cls.category !== "none" ? cls.category : undefined,
        topic,
        attachments: attachments.length ? attachments : undefined,
      };
      appendMessage(threadId, msg, { lastRead: { ...thread.lastRead, [viewer]: now } });

      if (cls.held) {
        // Student held message: gentle "may be reviewed" state; no delivery ticks, no reply.
        return cls;
      }

      later(() => upgradeStatus(threadId, msg.id), 900);

      if (cls.safeguarding && isStudentSender) {
        // Never hide a student asking for help: deliver + reassure + escalate,
        // and open a line from the support team so a person follows up.
        later(() => {
          appendMessage(threadId, {
            id: mid(),
            senderId: "system",
            role: "system",
            text: "Your message was sent to your tutor, and our student support team has been notified so they can check in with you. You are not in trouble.",
            sentAt: Date.now(),
            status: "delivered",
            flag: "safeguarding",
          }, { safeguarding: true });
        }, 600);
        const supportId = "th-support-" + (viewer === STUDENT_ME ? "student" : "tutor");
        later(() => {
          appendMessage(supportId, {
            id: mid(),
            senderId: ADMIN_ID,
            role: "admin",
            text: "Hi " + thread.student.name.split(" ")[0] + ", we saw your message to your tutor and wanted to check in. A member of our team is across it and will reach out today. You can reply here any time, about anything.",
            sentAt: Date.now(),
            status: "delivered",
            flag: "safeguarding",
          });
        }, 1600);
        return cls;
      }

      // Clean (or advisory-flagged) message: simulate the other side when it
      // is not one of the two live personas. The Maya <-> Priya Rao thread stays
      // silent so the cross-portal loop is real.
      const counterpart = counterpartOf(thread, viewer);
      const isLiveCounterpart = counterpart === STUDENT_ME || counterpart === TUTOR_ME;
      if (thread.kind === "admin") {
        const reply = ADMIN_REPLY[topic ?? "feedback"];
        later(() => setTyping((t) => ({ ...t, [threadId]: "Everest team" })), 1100);
        later(() => {
          setTyping((t) => {
            const n = { ...t };
            delete n[threadId];
            return n;
          });
          appendMessage(threadId, { id: mid(), senderId: ADMIN_ID, role: "admin", text: reply, sentAt: Date.now(), status: "delivered" });
          setDb((d) => ({
            ...d,
            threads: d.threads.map((t) => (t.id === threadId ? { ...t, lastRead: { ...t.lastRead, [ADMIN_ID]: Date.now() } } : t)),
          }));
        }, 3000);
      } else if (!isLiveCounterpart && !thread.safeguarding) {
        const fromTutor = counterpart === thread.tutor?.id;
        const name = fromTutor ? thread.tutor!.name : thread.student.name;
        later(() => setTyping((t) => ({ ...t, [threadId]: name })), 1200);
        later(() => {
          setTyping((t) => {
            const n = { ...t };
            delete n[threadId];
            return n;
          });
          appendMessage(threadId, {
            id: mid(),
            senderId: counterpart,
            role: fromTutor ? "tutor" : "student",
            text: fromTutor ? tutorReply(thread.course ?? "class") : studentReply(),
            sentAt: Date.now(),
            status: "delivered",
          });
          setDb((d) => ({
            ...d,
            threads: d.threads.map((t) => (t.id === threadId ? { ...t, lastRead: { ...t.lastRead, [counterpart]: Date.now() } } : t)),
          }));
        }, 3200);
      }
      return cls;
    },
    [db, appendMessage, upgradeStatus, later]
  );

  const resetDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    setDb(seedDb());
  }, []);

  const value: MessagingContextValue = {
    hydrated,
    threads: db.threads,
    messages: db.messages,
    typing,
    threadsFor,
    unreadCount,
    unreadTotal,
    isRead,
    markRead,
    sendMessage,
    setThreadStatus,
    resetDemo,
  };

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}
