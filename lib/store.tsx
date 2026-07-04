import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ASSIGNED_TOTAL,
  BASE_SUBMITTED,
  CourseId,
  STUDENT,
  chatSeeds,
  elliotReply,
  gradeBase,
  wsBase,
} from "./data";
import { Assessment, Outline, scanOutline, seedOutlines, subjectToCourse } from "./features";
import { MaterialAssignment, TutorCourseId } from "./tutor-data";
import { readTutorState } from "./live-sync";

// Maya Kapoor's stable id, shared with the tutor side (lib/tutor-data.ts
// AssignTarget / JoinEvent). The roster fixtures key students by name only,
// so this id exists purely for the online-materials + join-event sync.
export const STUDENT_ID = "maya-kapoor";

export interface ModalData {
  title: string;
  tutor: string;
  time: string;
  color: string;
  bg: string;
  cid?: CourseId;
  k?: string;
  dateLabel: string;
}

export interface ChatAction {
  label: string;
  kind: "nav" | "submit" | "support";
  href?: string;
}

export interface ChatMsg {
  who: "u" | "e";
  text: string;
  actions?: ChatAction[];
}
interface ChatThread {
  title: string;
  when: string;
  msgs: ChatMsg[];
}

// ---------- Elliot cost cap ----------
// Elliot runs on paid API calls in production. The owner's budget is
// AUD $1.00/day of API spend, and one answer costs roughly 4.5 cents on
// Haiku-class pricing, so the portal quietly enforces a daily allowance.
// The cap is invisible to students: no counts, no dollar figures shown -
// once the budget is spent Elliot simply asks them to try again later.
export const ELLIOT_DAILY_BUDGET_AUD = 1.0;
export const ELLIOT_COST_PER_REPLY_AUD = 0.045;
export const ELLIOT_DAILY_REPLIES = Math.floor(ELLIOT_DAILY_BUDGET_AUD / ELLIOT_COST_PER_REPLY_AUD); // 22

export interface ElliotUsage {
  dateKey: string;
  replies: number;
}

// ---------- support request tracking ----------
export type SupportStatus = "open" | "replied" | "resolved";

export interface SupportUpdate {
  who: "you" | "team";
  text: string;
  at: number;
}

export interface SupportRequest {
  id: string;
  ref: string;
  type: string;
  message: string;
  createdAt: number;
  status: SupportStatus;
  updates: SupportUpdate[];
}

interface PortalState {
  now: number;
  done: Record<string, boolean>;
  toast: string;
  modal: ModalData | null;
  modalCat: string;
  drivePick: boolean;
  chatMsgs: Record<string, ChatThread>;
  chatActive: string;
  chatTyping: boolean;
  fabOpen: boolean;
  // calendar (shared across dashboard, timetable, library)
  vm: number;
  vy: number;
  sel: string;
  // feature 1: uploaded school outlines + their scan results
  outlines: Outline[];
  // Elliot daily budget usage
  elliotUsage: ElliotUsage;
  // support request tracker
  supportRequests: SupportRequest[];
  // "Join class" clicks -> attendance source for the tutor side
  joinEvents: JoinEvent[];
  // worksheet-assignment submissions (booklets the tutor assigned back for completion)
  worksheetSubmissions: { assignmentId: string; at: string }[];
}

export interface JoinEvent {
  studentId: string;
  studentName: string;
  courseId: string;
  sessionISO: string;
  joinedAt: string;
  minsLate: number;
}

interface PortalContextValue extends PortalState {
  // derived
  dueCount: number;
  submittedCount: number;
  gradedCount: number;
  completionPct: number;
  completionDeg: number;
  // actions
  showToast: (msg: string) => void;
  notWired: (label: string) => void;
  submitWorksheet: (id: string, name: string) => void;
  matchWorksheet: (id: string, name: string) => void;
  openModal: (data: ModalData) => void;
  closeModal: () => void;
  setModalCat: (c: string) => void;
  setDrivePick: (v: boolean) => void;
  setChatActive: (id: string) => void;
  sendChat: (text: string) => void;
  fabSend: (text: string) => void;
  setFabOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  selectDay: (k: string) => void;
  setCalendar: (vm: number, vy: number) => void;
  uploadOutline: (subject: string, term: string, fileName: string, courseId?: string | null) => void;
  deleteOutline: (id: string) => void;
  updateAssessment: (outlineId: string, assessmentId: string, patch: Partial<Pick<Assessment, "weight" | "score" | "done">>) => void;
  // Elliot budget
  elliotRemaining: number;
  elliotCapped: boolean;
  elliotSpendToday: number;
  fabAgent: (text: string, reply: ChatMsg, opts?: { bypassCap?: boolean }) => void;
  // support tracking
  addSupportRequest: (type: string, message: string) => SupportRequest;
  followUpRequest: (id: string, text: string) => void;
  setRequestStatus: (id: string, status: SupportStatus) => void;
  // online class materials (drive-linked assignments from the tutor side)
  joinClass: (courseId: string, sessionISO: string, minsLate: number) => void;
  submitAssignedWorksheet: (assignmentId: string) => void;
  assignedToMe: () => MaterialAssignment[];
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}

function todayKeyOf(now: number): string {
  const d = new Date(now);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Deterministic seed used for the very first (server + first client) render so
// time-derived text (countdown, greeting, today highlight) hydrates without a
// mismatch. Immediately after mount we swap to the real clock. Pinned to the
// demo "today" so the fixtures line up on first paint.
const SEED_NOW = Date.parse("2026-07-02T18:00:00");

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const initialNow = useMemo(() => SEED_NOW, []);
  const [state, setState] = useState<PortalState>(() => {
    const d = new Date(initialNow);
    return {
      now: initialNow,
      done: {},
      toast: "",
      modal: null,
      modalCat: "Study Materials",
      drivePick: false,
      chatMsgs: {},
      chatActive: "new",
      chatTyping: false,
      fabOpen: false,
      vm: d.getMonth(),
      vy: d.getFullYear(),
      sel: todayKeyOf(initialNow),
      outlines: seedOutlines(),
      elliotUsage: { dateKey: todayKeyOf(initialNow), replies: 0 },
      supportRequests: [],
      joinEvents: [],
      worksheetSubmissions: [],
    };
  });

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const chatTimer = useRef<ReturnType<typeof setTimeout>>();
  const [hydrated, setHydrated] = useState(false);

  // 1s tick for the live countdown + today highlight. Runs only after mount, so
  // swapping the SSR seed for the real clock never causes a hydration mismatch.
  // The persisted slices (outlines, support requests, Elliot usage) load here too.
  useEffect(() => {
    let persisted: Partial<PortalState> = {};
    try {
      const raw = window.localStorage.getItem("evr-portal");
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.v === 2) {
          // Older blobs may predate newer fields; only copy what is present
          // so missing fields keep their seeds instead of becoming undefined.
          persisted = {};
          if (Array.isArray(p.outlines)) persisted.outlines = p.outlines;
          if (Array.isArray(p.supportRequests)) persisted.supportRequests = p.supportRequests;
          if (p.elliotUsage) persisted.elliotUsage = p.elliotUsage;
          if (p.done) persisted.done = p.done;
          if (Array.isArray(p.joinEvents)) persisted.joinEvents = p.joinEvents;
          if (Array.isArray(p.worksheetSubmissions)) persisted.worksheetSubmissions = p.worksheetSubmissions;
        }
      }
    } catch {
      /* corrupted store: keep seeds */
    }
    setState((s) => ({ ...s, ...persisted, now: Date.now() }));
    setHydrated(true);
    const t = setInterval(() => setState((s) => ({ ...s, now: Date.now() })), 1000);
    return () => {
      clearInterval(t);
      clearTimeout(toastTimer.current);
      clearTimeout(chatTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        "evr-portal",
        JSON.stringify({
          v: 2,
          outlines: state.outlines,
          supportRequests: state.supportRequests,
          elliotUsage: state.elliotUsage,
          done: state.done,
          joinEvents: state.joinEvents,
          worksheetSubmissions: state.worksheetSubmissions,
        })
      );
    } catch {
      /* quota: state still lives in memory */
    }
  }, [hydrated, state.outlines, state.supportRequests, state.elliotUsage, state.done, state.joinEvents, state.worksheetSubmissions]);

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setState((s) => ({ ...s, toast: msg }));
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: "" })), 2400);
  }, []);

  const notWired = useCallback(
    (label: string) => showToast(label + " is not wired up in this prototype yet"),
    [showToast]
  );

  const submitWorksheet = useCallback(
    (id: string, name: string) => {
      setState((s) => {
        const wasDone = !!s.done[id];
        if (!wasDone) {
          clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setState((x) => ({ ...x, toast: "" })), 2400);
        }
        return {
          ...s,
          done: { ...s.done, [id]: !s.done[id] },
          toast: !wasDone ? '"' + name + '" uploaded. Your tutor will mark it soon.' : s.toast,
        };
      });
    },
    []
  );

  const matchWorksheet = useCallback((id: string, name: string) => {
    clearTimeout(toastTimer.current);
    setState((s) => ({ ...s, done: { ...s.done, [id]: true }, drivePick: false, toast: 'Uploaded and matched to "' + name + '"' }));
    toastTimer.current = setTimeout(() => setState((x) => ({ ...x, toast: "" })), 2400);
  }, []);

  const openModal = useCallback((data: ModalData) => setState((s) => ({ ...s, modal: data, modalCat: "Study Materials" })), []);
  const closeModal = useCallback(() => setState((s) => ({ ...s, modal: null })), []);
  const setModalCat = useCallback((c: string) => setState((s) => ({ ...s, modalCat: c })), []);
  const setDrivePick = useCallback((v: boolean) => setState((s) => ({ ...s, drivePick: v })), []);
  const setChatActive = useCallback((id: string) => setState((s) => ({ ...s, chatActive: id })), []);
  const setFabOpen = useCallback(
    (v: boolean | ((p: boolean) => boolean)) => setState((s) => ({ ...s, fabOpen: typeof v === "function" ? v(s.fabOpen) : v })),
    []
  );

  const dueCountNow = useCallback((done: Record<string, boolean>) => wsBase().filter((w) => !done[w.id]).length, []);

  /** Count a paid Elliot reply against today's budget (rolls the day over as needed). */
  const usageAfterReply = useCallback((s: PortalState): ElliotUsage => {
    const today = todayKeyOf(s.now);
    const u = s.elliotUsage.dateKey === today ? s.elliotUsage : { dateKey: today, replies: 0 };
    return { ...u, replies: u.replies + 1 };
  }, []);

  const isCapped = useCallback((s: PortalState): boolean => {
    const today = todayKeyOf(s.now);
    return s.elliotUsage.dateKey === today && s.elliotUsage.replies >= ELLIOT_DAILY_REPLIES;
  }, []);

  const CAP_MESSAGE =
    "I've helped with a fair bit today and need to recharge for a little while. Please try me again later. If something is urgent I can still pass it to the Everest team for you, or you can Message a Tutor and a person will pick it up.";

  const runElliot = useCallback(
    (threadKey: string, msg: string) => {
      setState((s) => ({ ...s, chatTyping: true }));
      clearTimeout(chatTimer.current);
      chatTimer.current = setTimeout(() => {
        setState((s) => {
          const due = dueCountNow(s.done);
          const store = { ...s.chatMsgs };
          const thread = store[threadKey];
          if (!thread) return { ...s, chatTyping: false };
          if (isCapped(s)) {
            store[threadKey] = { ...thread, msgs: [...thread.msgs, { who: "e", text: CAP_MESSAGE, actions: [{ label: "Message a tutor", kind: "nav", href: "/messages" }] }] };
            return { ...s, chatMsgs: store, chatTyping: false };
          }
          store[threadKey] = { ...thread, msgs: [...thread.msgs, { who: "e", text: elliotReply(msg, due) }] };
          return { ...s, chatMsgs: store, chatTyping: false, elliotUsage: usageAfterReply(s) };
        });
      }, 1150);
    },
    [dueCountNow, isCapped, usageAfterReply]
  );

  /** Agentic FAB pipeline: the component computes the reply (it has router +
      messaging context); the store owns the thread, typing and the budget.
      Support requests are routed to humans, not the paid model, so they
      bypass the daily cap and never spend budget (opts.bypassCap). */
  const fabAgent = useCallback(
    (text: string, reply: ChatMsg, opts?: { bypassCap?: boolean }) => {
      const msg = text.trim();
      if (!msg) return;
      setState((s) => {
        const store = { ...s.chatMsgs };
        if (!store.fab) store.fab = { title: "Elliot", when: "", msgs: [] };
        store.fab = { ...store.fab, msgs: [...store.fab.msgs, { who: "u", text: msg }] };
        return { ...s, chatMsgs: store, chatTyping: true };
      });
      clearTimeout(chatTimer.current);
      chatTimer.current = setTimeout(() => {
        setState((s) => {
          const store = { ...s.chatMsgs };
          const bypass = !!opts?.bypassCap;
          const capped = isCapped(s) && !bypass;
          const finalReply: ChatMsg = capped ? { who: "e", text: CAP_MESSAGE, actions: [{ label: "Message a tutor", kind: "nav", href: "/messages" }] } : reply;
          store.fab = { ...store.fab, msgs: [...store.fab.msgs, finalReply] };
          // A bypassed (support) reply or a capped canned reply is free.
          const spend = capped || bypass ? s.elliotUsage : usageAfterReply(s);
          return { ...s, chatMsgs: store, chatTyping: false, elliotUsage: spend };
        });
      }, 1000);
    },
    [isCapped, usageAfterReply]
  );

  const sendChat = useCallback(
    (text: string) => {
      const msg = text.trim();
      if (!msg) return;
      const seeds = chatSeeds();
      setState((s) => {
        let id = s.chatActive;
        const store = { ...s.chatMsgs };
        if (id === "new") {
          id = "n" + s.now;
          store[id] = { title: msg.length > 34 ? msg.slice(0, 34) + "…" : msg, when: "Just now", msgs: [] };
        } else if (!store[id] && seeds[id]) {
          store[id] = { ...seeds[id], msgs: [...seeds[id].msgs] };
        } else if (!store[id]) {
          store[id] = { title: msg.slice(0, 34), when: "Just now", msgs: [] };
        }
        store[id] = { ...store[id], msgs: [...store[id].msgs, { who: "u", text: msg }] };
        runElliot(id, msg);
        return { ...s, chatMsgs: store, chatActive: id };
      });
    },
    [runElliot]
  );

  const fabSend = useCallback(
    (text: string) => {
      const msg = text.trim();
      if (!msg) return;
      setState((s) => {
        const store = { ...s.chatMsgs };
        if (!store.fab) store.fab = { title: "Elliot", when: "", msgs: [] };
        store.fab = { ...store.fab, msgs: [...store.fab.msgs, { who: "u", text: msg }] };
        runElliot("fab", msg);
        return { ...s, chatMsgs: store };
      });
    },
    [runElliot]
  );

  const prevMonth = useCallback(() => setState((s) => ({ ...s, vm: s.vm === 0 ? 11 : s.vm - 1, vy: s.vm === 0 ? s.vy - 1 : s.vy })), []);
  const nextMonth = useCallback(() => setState((s) => ({ ...s, vm: s.vm === 11 ? 0 : s.vm + 1, vy: s.vm === 11 ? s.vy + 1 : s.vy })), []);
  const selectDay = useCallback((k: string) => setState((s) => ({ ...s, sel: k })), []);
  const setCalendar = useCallback((vm: number, vy: number) => setState((s) => ({ ...s, vm, vy })), []);

  const uploadOutline = useCallback((subject: string, term: string, fileName: string, courseId?: string | null) => {
    const id = "ol" + Date.now();
    const cid = courseId !== undefined ? courseId : subjectToCourse(subject);
    setState((s) => ({
      ...s,
      outlines: [
        { id, subject, term, fileName, uploadedAt: "Just now", status: "pending", courseId: cid, assessments: [], topics: [] },
        ...s.outlines,
      ],
    }));
    // Deterministic scan resolves shortly after upload (pending -> done).
    setTimeout(() => {
      const scan = scanOutline(subject, term);
      setState((s) => ({
        ...s,
        outlines: s.outlines.map((o) => (o.id === id ? { ...o, status: "done", ...scan } : o)),
      }));
    }, 1600);
  }, []);

  const deleteOutline = useCallback((id: string) => {
    setState((s) => ({ ...s, outlines: s.outlines.filter((o) => o.id !== id), toast: "Outline removed. Your tutor no longer sees it." }));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setState((x) => ({ ...x, toast: "" })), 2400);
  }, []);

  const updateAssessment = useCallback((outlineId: string, assessmentId: string, patch: Partial<Pick<Assessment, "weight" | "score" | "done">>) => {
    setState((s) => ({
      ...s,
      outlines: s.outlines.map((o) =>
        o.id === outlineId ? { ...o, assessments: o.assessments.map((a) => (a.id === assessmentId ? { ...a, ...patch } : a)) } : o
      ),
    }));
  }, []);

  // ---- support request tracking ----

  const addSupportRequest = useCallback((type: string, message: string): SupportRequest => {
    const id = "sr" + Date.now();
    const req: SupportRequest = {
      id,
      ref: "SUP-" + String(Date.now()).slice(-6),
      type,
      message,
      createdAt: Date.now(),
      status: "open",
      updates: [],
    };
    setState((s) => ({ ...s, supportRequests: [req, ...s.supportRequests] }));
    // Simulated staff acknowledgement so the tracker has a live reply to show.
    setTimeout(() => {
      setState((s) => ({
        ...s,
        supportRequests: s.supportRequests.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "replied",
                updates: [...r.updates, { who: "team" as const, text: "Thanks Maya, we're looking into this now and will update you here. Most " + type.toLowerCase() + " requests are sorted within one business day.", at: Date.now() }],
              }
            : r
        ),
      }));
    }, 4000);
    return req;
  }, []);

  const followUpRequest = useCallback((id: string, text: string) => {
    setState((s) => ({
      ...s,
      supportRequests: s.supportRequests.map((r) =>
        r.id === id ? { ...r, status: "open", updates: [...r.updates, { who: "you" as const, text, at: Date.now() }] } : r
      ),
    }));
    setTimeout(() => {
      setState((s) => ({
        ...s,
        supportRequests: s.supportRequests.map((r) =>
          r.id === id ? { ...r, status: "replied", updates: [...r.updates, { who: "team" as const, text: "Got it, that extra detail helps. We've bumped your request with the team.", at: Date.now() }] } : r
        ),
      }));
    }, 3500);
  }, []);

  const setRequestStatus = useCallback((id: string, status: SupportStatus) => {
    setState((s) => ({ ...s, supportRequests: s.supportRequests.map((r) => (r.id === id ? { ...r, status } : r)) }));
  }, []);

  // ---- online class materials (drive-linked assignments from the tutor) ----

  /** "Join class" click: idempotent per (courseId, sessionISO) so re-clicking or a re-render never double-logs. */
  const joinClass = useCallback((courseId: string, sessionISO: string, minsLate: number) => {
    setState((s) => {
      const already = s.joinEvents.some((j) => j.courseId === courseId && j.sessionISO === sessionISO && j.studentId === STUDENT_ID);
      if (already) return s;
      const event: JoinEvent = {
        studentId: STUDENT_ID,
        studentName: STUDENT.name,
        courseId,
        sessionISO,
        joinedAt: new Date(s.now).toISOString(),
        minsLate,
      };
      return { ...s, joinEvents: [...s.joinEvents, event] };
    });
  }, []);

  /** Marks a tutor-assigned worksheet as submitted. Idempotent per assignmentId. */
  const submitAssignedWorksheet = useCallback((assignmentId: string) => {
    setState((s) => {
      const already = s.worksheetSubmissions.some((sub) => sub.assignmentId === assignmentId);
      if (already) return s;
      return { ...s, worksheetSubmissions: [...s.worksheetSubmissions, { assignmentId, at: new Date(s.now).toISOString() }] };
    });
    showToast("Worksheet submitted. Your tutor will mark it soon.");
  }, [showToast]);

  // Bump a counter on "storage" events so assignedToMe() (a plain read of the
  // tutor's live blob) is re-evaluated after the tutor portal writes new data.
  const [tutorSyncTick, setTutorSyncTick] = useState(0);
  useEffect(() => {
    const bump = () => setTutorSyncTick((n) => n + 1);
    window.addEventListener("storage", bump);
    return () => window.removeEventListener("storage", bump);
  }, []);

  /** Assignments (booklets/worksheets) targeting the whole class or Maya, newest first. Re-reads the tutor's live blob on every call. Maya's own submission events overlay the tutor-held status so a just-submitted worksheet reads "submitted" straight away, before the tutor portal has synced. */
  const assignedToMe = useCallback((): MaterialAssignment[] => {
    void tutorSyncTick; // re-evaluated on "storage" events; see effect above
    if (!hydrated) return []; // match the server render, then fill in after mount
    const t = readTutorState();
    const all: MaterialAssignment[] = t && Array.isArray(t.assignments) ? t.assignments : [];
    return all
      .filter((a) => a.target.kind === "class" || (a.target.kind === "student" && a.target.studentId === STUDENT_ID))
      .map((a) => (a.status === "assigned" && state.worksheetSubmissions.some((s) => s.assignmentId === a.id) ? { ...a, status: "submitted" as const } : a))
      .sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));
  }, [tutorSyncTick, state.worksheetSubmissions, hydrated]);

  const submittedNow = wsBase().filter((w) => state.done[w.id]).length;
  const submittedCount = gradeBase().length + submittedNow; // total submissions incl. base graded set + dynamic
  const submittedTotal = BASE_SUBMITTED + submittedNow;
  const completionPct = Math.round((submittedTotal / ASSIGNED_TOTAL) * 100);
  const completionDeg = Math.round(completionPct * 3.6);
  const gradedCount = gradeBase().filter((r) => r.graded).length;
  const dueCount = dueCountNow(state.done);

  const usedToday = state.elliotUsage.dateKey === todayKeyOf(state.now) ? state.elliotUsage.replies : 0;
  const elliotRemaining = Math.max(0, ELLIOT_DAILY_REPLIES - usedToday);
  const elliotCapped = elliotRemaining === 0;
  const elliotSpendToday = Math.round(usedToday * ELLIOT_COST_PER_REPLY_AUD * 100) / 100;

  const value: PortalContextValue = {
    ...state,
    dueCount,
    submittedCount,
    gradedCount,
    completionPct,
    completionDeg,
    showToast,
    notWired,
    submitWorksheet,
    matchWorksheet,
    openModal,
    closeModal,
    setModalCat,
    setDrivePick,
    setChatActive,
    sendChat,
    fabSend,
    setFabOpen,
    prevMonth,
    nextMonth,
    selectDay,
    setCalendar,
    uploadOutline,
    deleteOutline,
    updateAssessment,
    elliotRemaining,
    elliotCapped,
    elliotSpendToday,
    fabAgent,
    addSupportRequest,
    followUpRequest,
    setRequestStatus,
    joinClass,
    submitAssignedWorksheet,
    assignedToMe,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}
