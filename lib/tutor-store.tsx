// Tutor-side client state, mirroring lib/store.tsx (student). Holds the booklet
// cart -> request lifecycle and the marking queue. Message threads live in the
// shared lib/messaging store. All deterministic - no backend in this prototype.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  AssignTarget,
  AttendanceStatus,
  BookletRequest,
  BookletStatus,
  CatalogueItem,
  DRIVE_FILES,
  JoinEvent,
  MaterialAssignment,
  MATERIAL_KIND_META,
  MaterialKind,
  ON_TIME_GRACE_MIN,
  PrintFormat,
  RequestItem,
  SEED_ASSIGNMENTS,
  Submission,
  TutorClass,
  TutorCourseId,
  WorkingMode,
  bookletStatusFromRequest,
  buildTutorClasses,
  classLabel,
  rosterFor,
  seedAttendance,
  seedRequests,
  seedSubmissions,
  TUTOR,
  TUTOR_COURSES,
} from "./tutor-data";
import { readPortalState, readTutorState } from "./live-sync";

// Same deterministic first-paint clock as the student store (demo today = Thu 2 Jul 2026).
const SEED_NOW = Date.parse("2026-07-02T18:00:00");

interface TutorState {
  now: number;
  toast: string;
  elliotAsks: { dateKey: string; replies: number };
  // booklet flow
  cart: RequestItem[];
  requestClassId: string | null; // class the request is for, null = custom request
  requests: BookletRequest[];
  bookletOverride: Record<string, BookletStatus>; // classId -> status set by actions
  // marking
  submissions: Submission[];
  // working mode: which duties this tutor actually has
  mode: WorkingMode;
  // attendance: "<sessionId>:<dateKey>" -> student name -> status
  attendance: Record<string, Record<string, AttendanceStatus>>;
  // online class materials: drive-linked booklet/worksheet assignments
  assignments: MaterialAssignment[];
  // join events read live from the student portal's "evr-portal" blob
  joinEvents: JoinEvent[];
  // shared calendar selection
  vm: number;
  vy: number;
  sel: string;
}

interface TutorContextValue extends TutorState {
  classes: TutorClass[];
  toMarkCount: number;
  pendingRequests: number;
  showToast: (msg: string) => void;
  notWired: (label: string) => void;
  // cart / requests
  setRequestClass: (classId: string | null) => void;
  addToCart: (item: CatalogueItem, qty: number) => void;
  setQty: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  sendRequest: (opts: { printer: string; format: PrintFormat; remark: string }) => boolean;
  editRequest: (id: string) => void; // pending only: pull back into the cart
  // marking
  markSubmission: (id: string, grade: string, feedback: string, returned?: { fileName: string; via: "annotated" | "uploaded" }) => void;
  // ---- Elliot (tutor) ----
  // Suggestions are derived locally and cost nothing, so they are unlimited.
  // A free-text question is a model call, so it is rationed the same way the
  // student's Elliot is. Unlike students, a tutor is shown the remaining
  // allowance: they are staff, and a silent ceiling would just look broken.
  elliotAsks: { dateKey: string; replies: number };
  elliotRemaining: number;
  elliotCapped: boolean;
  countElliotAsk: () => void;
  // working mode
  hasInPerson: boolean;
  hasOnline: boolean;
  setMode: (m: WorkingMode) => void;
  // digital booklet packs (online classes): instant, logged, no approval
  shareDigital: (classId: string | null, remark: string) => boolean;
  // attendance
  markAttendance: (key: string, student: string, status: AttendanceStatus) => void;
  markAllPresent: (key: string, sessionId: string) => void;
  // online class materials
  assignMaterial: (input: {
    fileIds: string[];
    courseId: TutorCourseId;
    target: AssignTarget;
    kind: MaterialKind;
    sessionISO?: string;
    due?: string;
  }) => void;
  setAssignmentStatus: (id: string, status: MaterialAssignment["status"]) => void;
  removeAssignment: (id: string) => void;
  // assignments with status auto-upgraded to "submitted" from student submission events
  effectiveAssignments: MaterialAssignment[];
  // derived attendance from student "Join class" events + manual overrides
  autoAttendance: (courseId: TutorCourseId, sessionISO: string) => Record<string, { status: AttendanceStatus; source: "auto" | "manual" }>;
  // calendar
  prevMonth: () => void;
  nextMonth: () => void;
  selectDay: (k: string) => void;
}

/** Daily allowance for tutor questions, on the same AUD 1.00/day posture. */
export const TUTOR_ELLIOT_DAILY_BUDGET_AUD = 1.0;
export const TUTOR_ELLIOT_COST_PER_REPLY_AUD = 0.045;
export const TUTOR_ELLIOT_DAILY_ASKS = Math.floor(TUTOR_ELLIOT_DAILY_BUDGET_AUD / TUTOR_ELLIOT_COST_PER_REPLY_AUD);

const TutorContext = createContext<TutorContextValue | null>(null);

export function useTutor(): TutorContextValue {
  const ctx = useContext(TutorContext);
  if (!ctx) throw new Error("useTutor must be used within TutorProvider");
  return ctx;
}

function todayKeyOf(now: number): string {
  const d = new Date(now);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const BASE_CLASSES = buildTutorClasses();

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TutorState>(() => {
    const d = new Date(SEED_NOW);
    return {
      now: SEED_NOW,
      toast: "",
      elliotAsks: { dateKey: new Date(SEED_NOW).toISOString().slice(0, 10), replies: 0 },
      cart: [],
      requestClassId: "chem11:2026-07-09",
      requests: seedRequests(),
      bookletOverride: {},
      submissions: seedSubmissions(),
      mode: TUTOR.grants,
      attendance: seedAttendance(),
      assignments: SEED_ASSIGNMENTS,
      joinEvents: [],
      vm: d.getMonth(),
      vy: d.getFullYear(),
      sel: todayKeyOf(SEED_NOW),
    };
  });

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Load the persisted tutor slice after mount (SSR-safe), then tick the clock.
    let persisted: Partial<TutorState> = {};
    try {
      const raw = window.localStorage.getItem("evr-tutor");
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.v === 1) {
          // Older blobs may predate newer fields (e.g. assignments); only copy
          // what is actually present so missing fields keep their seeds.
          persisted = { mode: TUTOR.grants === "both" ? p.mode : TUTOR.grants };
          if (p.attendance) persisted.attendance = p.attendance;
          if (Array.isArray(p.requests)) persisted.requests = p.requests;
          if (p.bookletOverride) persisted.bookletOverride = p.bookletOverride;
          if (Array.isArray(p.assignments)) persisted.assignments = p.assignments;
          if (Array.isArray(p.submissions)) persisted.submissions = p.submissions;
          if (p.elliotAsks) persisted.elliotAsks = p.elliotAsks;
        }
      }
    } catch {
      /* corrupted store: keep seeds */
    }
    // Anchored demo clock - see the matching note in lib/store.tsx. The clock
    // ticks so countdowns stay alive, but it runs from the seeded demo date so
    // the tutor portal never drifts out of its own term.
    const bootedAt = Date.now();
    const demoNow = () => SEED_NOW + (Date.now() - bootedAt);
    setState((s) => ({ ...s, ...persisted, now: demoNow() }));
    setHydrated(true);
    const t = setInterval(() => setState((s) => ({ ...s, now: demoNow() })), 1000);
    return () => {
      clearInterval(t);
      clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        "evr-tutor",
        JSON.stringify({
          v: 1,
          mode: state.mode,
          attendance: state.attendance,
          requests: state.requests,
          bookletOverride: state.bookletOverride,
          assignments: state.assignments,
          submissions: state.submissions,
          elliotAsks: state.elliotAsks,
        })
      );
    } catch {
      /* quota: state still lives in memory */
    }
  }, [hydrated, state.mode, state.attendance, state.requests, state.bookletOverride, state.assignments, state.submissions, state.elliotAsks]);

  // ---- live sync from the student portal ("evr-portal") ----
  // Join events (attendance source) and worksheet submissions (round trip)
  // live in the student's blob. Read on mount and whenever another tab/window
  // writes to localStorage (the "storage" event never fires in the same tab
  // that wrote it, which is fine here since both portals poll on their own
  // state changes too).
  const [portalJoinEvents, setPortalJoinEvents] = useState<JoinEvent[]>([]);
  const [portalSubmissions, setPortalSubmissions] = useState<{ assignmentId: string; at: string }[]>([]);

  useEffect(() => {
    const load = () => {
      const p = readPortalState();
      setPortalJoinEvents(p && Array.isArray(p.joinEvents) ? p.joinEvents : []);
      setPortalSubmissions(p && Array.isArray(p.worksheetSubmissions) ? p.worksheetSubmissions : []);
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  // Mirror the live-read join events into state so consumers can read them
  // off the context the same way as everything else.
  useEffect(() => {
    setState((s) => (s.joinEvents === portalJoinEvents ? s : { ...s, joinEvents: portalJoinEvents }));
  }, [portalJoinEvents]);

  // ---- live sync from the admin portal ----
  // The office approves, rejects and prints requests by patching this same
  // blob, so re-read it when that happens and the tutor sees the decision
  // without a reload. Compared by value: setting a fresh array every tick
  // would write to localStorage again and loop.
  useEffect(() => {
    if (!hydrated) return;
    const load = () => {
      const t = readTutorState();
      if (!t || !Array.isArray(t.requests)) return;
      setState((s) => (JSON.stringify(s.requests) === JSON.stringify(t.requests) ? s : { ...s, requests: t.requests }));
    };
    window.addEventListener("storage", load);
    window.addEventListener("evr-sync", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("evr-sync", load);
    };
  }, [hydrated]);

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setState((s) => ({ ...s, toast: msg }));
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: "" })), 2600);
  }, []);

  const notWired = useCallback(
    (label: string) => showToast(label + " is not wired up in this prototype yet"),
    [showToast]
  );

  // ---- booklet flow ----

  const setRequestClass = useCallback((classId: string | null) => setState((s) => ({ ...s, requestClassId: classId })), []);

  const addToCart = useCallback(
    (item: CatalogueItem, qty: number) => {
      setState((s) => {
        const existing = s.cart.find((c) => c.itemId === item.id);
        const cart = existing
          ? s.cart.map((c) => (c.itemId === item.id ? { ...c, qty } : c))
          : [...s.cart, { itemId: item.id, name: item.name, qty }];
        return { ...s, cart };
      });
      showToast('"' + item.name.replace(".pdf", "") + '" added to your cart');
    },
    [showToast]
  );

  const setQty = useCallback((itemId: string, qty: number) => {
    setState((s) => ({ ...s, cart: s.cart.map((c) => (c.itemId === itemId ? { ...c, qty: Math.max(1, qty) } : c)) }));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setState((s) => ({ ...s, cart: s.cart.filter((c) => c.itemId !== itemId) }));
  }, []);

  const clearCart = useCallback(() => setState((s) => ({ ...s, cart: [] })), []);

  const sendRequest = useCallback(
    (opts: { printer: string; format: PrintFormat; remark: string }): boolean => {
      let ok = false;
      setState((s) => {
        if (s.cart.length === 0 || !opts.remark.trim() || !opts.printer) return s;
        ok = true;
        const cls = s.requestClassId ? BASE_CLASSES.find((c) => c.id === s.requestClassId) ?? null : null;
        const cd = cls ? TUTOR_COURSES[cls.course] : null;
        const req: BookletRequest = {
          id: "req" + Date.now(),
          ref: "REQ" + String(Date.now()).slice(-10),
          date: new Date(s.now).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
          time: new Date(s.now).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true }),
          classId: cls ? cls.id : null,
          classText: cls ? classLabel(cls) : "Custom request, not linked to a class",
          yearLevel: cd ? cd.year : "Mixed",
          subject: cd ? (cls!.course === "sci9" ? "Science" : "Chemistry") : "Mixed",
          items: s.cart,
          printer: opts.printer,
          format: opts.format,
          remark: opts.remark.trim(),
          approval: "pending",
          printing: "not_started",
        };
        const bookletOverride = cls ? { ...s.bookletOverride, [cls.id]: "requested" as BookletStatus } : s.bookletOverride;
        return { ...s, requests: [req, ...s.requests], cart: [], bookletOverride };
      });
      if (ok) showToast("Request sent for approval. Track it under My Requests.");
      return ok;
    },
    [showToast]
  );

  const editRequest = useCallback(
    (id: string) => {
      setState((s) => {
        const req = s.requests.find((r) => r.id === id);
        if (!req || req.approval !== "pending") return s;
        const bookletOverride = { ...s.bookletOverride };
        if (req.classId) bookletOverride[req.classId] = "not_requested";
        return {
          ...s,
          cart: req.items,
          requestClassId: req.classId,
          requests: s.requests.filter((r) => r.id !== id),
          bookletOverride,
        };
      });
      showToast("Request moved back to your cart for editing");
    },
    [showToast]
  );

  // ---- marking ----

  /** Count one paid question against today's allowance, rolling the day over. */
  const countElliotAsk = useCallback(() => {
    setState((s) => {
      const today = new Date(s.now).toISOString().slice(0, 10);
      const u = s.elliotAsks.dateKey === today ? s.elliotAsks : { dateKey: today, replies: 0 };
      return { ...s, elliotAsks: { ...u, replies: u.replies + 1 } };
    });
  }, []);

  const markSubmission = useCallback(
    (id: string, grade: string, feedback: string, returned?: { fileName: string; via: "annotated" | "uploaded" }) => {
      setState((s) => ({
        ...s,
        submissions: s.submissions.map((sub) =>
          sub.id === id
            ? { ...sub, marked: true, grade, feedback, returnedFile: returned?.fileName, returnedVia: returned?.via }
            : sub
        ),
      }));
      showToast(returned ? "Marked copy returned to the student" : "Marked and returned to the student");
    },
    [showToast]
  );

  // ---- working mode ----

  const setMode = useCallback((m: WorkingMode) => {
    // Only a both-duty tutor can switch views; single-duty stays locked.
    if (TUTOR.grants !== "both") return;
    setState((s) => ({ ...s, mode: m }));
  }, []);

  // ---- digital booklet packs (online classes) ----
  // No printer, no approval: sending a PDF costs nothing, so it delivers
  // instantly to every enrolled student's Library and is logged in History.

  const shareDigital = useCallback(
    (classId: string | null, remark: string): boolean => {
      let ok = false;
      setState((s) => {
        if (s.cart.length === 0) return s;
        ok = true;
        const cls = classId ? BASE_CLASSES.find((c) => c.id === classId) ?? null : null;
        const cd = cls ? TUTOR_COURSES[cls.course] : null;
        const req: BookletRequest = {
          id: "dig" + Date.now(),
          ref: "PACK" + String(Date.now()).slice(-8),
          date: new Date(s.now).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }),
          time: new Date(s.now).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true }),
          classId: cls ? cls.id : null,
          classText: cls ? classLabel(cls) : "Custom digital pack",
          yearLevel: cd ? cd.year : "Mixed",
          subject: cd ? cd.name : "Mixed",
          items: s.cart,
          printer: "",
          format: { paper: "Digital PDF", sides: "n/a", colour: "n/a", orientation: "n/a", staple: "n/a" },
          remark: remark.trim(),
          approval: "approved",
          printing: "not_started",
          delivery: "digital",
          recipients: cd ? cd.students.length : 0,
        };
        return { ...s, requests: [req, ...s.requests], cart: [] };
      });
      if (ok) showToast("Pack delivered to the class Library. Logged in History.");
      return ok;
    },
    [showToast]
  );

  // ---- attendance (hshs pattern) ----

  const markAttendance = useCallback((key: string, student: string, status: AttendanceStatus) => {
    setState((s) => ({
      ...s,
      attendance: { ...s.attendance, [key]: { ...(s.attendance[key] ?? {}), [student]: status } },
    }));
  }, []);

  // One-tap: everyone in the roster becomes present; flip exceptions after.
  const markAllPresent = useCallback((key: string, sessionId: string) => {
    setState((s) => {
      const cur = { ...(s.attendance[key] ?? {}) };
      rosterFor(sessionId).forEach((st) => (cur[st.name] = "present"));
      return { ...s, attendance: { ...s.attendance, [key]: cur } };
    });
    showToast("Everyone marked present. Flip any exceptions.");
  }, [showToast]);

  // Classroom stream/Q&A posting lives in the shared useClassroom() provider
  // (lib/classroom.tsx) now, since students need to read and post into it
  // too - it can no longer live only in this tutor-only store.

  // ---- online class materials (drive-linked assignments) ----

  const assignMaterial = useCallback(
    (input: { fileIds: string[]; courseId: TutorCourseId; target: AssignTarget; kind: MaterialKind; sessionISO?: string; due?: string }) => {
      setState((s) => {
        const stamp = new Date(s.now).toISOString();
        const created: MaterialAssignment[] = input.fileIds.map((fileId, i) => {
          const file = DRIVE_FILES.find((f) => f.id === fileId);
          return {
            id: "ma" + (s.now + i),
            fileId,
            fileName: file ? file.name : fileId,
            courseId: input.courseId,
            target: input.target,
            kind: input.kind,
            assignedAt: stamp,
            sessionISO: input.sessionISO,
            due: input.due,
            status: "assigned",
          };
        });
        return { ...s, assignments: [...created, ...s.assignments] };
      });
      const noun = MATERIAL_KIND_META[input.kind].label;
      const count = input.fileIds.length;
      showToast(
        count === 1
          ? noun + " assigned to " + (input.target.kind === "class" ? "the whole class" : input.target.studentName)
          : count + " " + noun.toLowerCase() + "s assigned to " + (input.target.kind === "class" ? "the whole class" : input.target.studentName)
      );
    },
    [showToast]
  );

  const setAssignmentStatus = useCallback((id: string, status: MaterialAssignment["status"]) => {
    setState((s) => ({ ...s, assignments: s.assignments.map((a) => (a.id === id ? { ...a, status } : a)) }));
  }, []);

  const removeAssignment = useCallback((id: string) => {
    setState((s) => ({ ...s, assignments: s.assignments.filter((a) => a.id !== id) }));
  }, []);

  // ---- calendar ----

  const prevMonth = useCallback(() => setState((s) => ({ ...s, vm: s.vm === 0 ? 11 : s.vm - 1, vy: s.vm === 0 ? s.vy - 1 : s.vy })), []);
  const nextMonth = useCallback(() => setState((s) => ({ ...s, vm: s.vm === 11 ? 0 : s.vm + 1, vy: s.vm === 11 ? s.vy + 1 : s.vy })), []);
  const selectDay = useCallback((k: string) => setState((s) => ({ ...s, sel: k })), []);

  // ---- derived ----

  // A class's booklet pill is driven by its live request record when one
  // exists (requested -> approved/rejected -> printed all flow from the
  // request's approval + printing fields), falling back to a manual override
  // (e.g. "not_requested" after a cancel) and then the seed status.
  const classes = BASE_CLASSES.map((c) => {
    const req = state.requests.find((r) => r.classId === c.id);
    if (req) return { ...c, booklet: bookletStatusFromRequest(req) };
    if (state.bookletOverride[c.id]) return { ...c, booklet: state.bookletOverride[c.id] };
    return c;
  });
  const toMarkCount = state.submissions.filter((s) => !s.marked).length;
  const pendingRequests = state.requests.filter((r) => r.approval === "pending").length;

  // Worksheet round trip: a student's submission (logged in the "evr-portal"
  // blob) upgrades an "assigned" worksheet to "submitted" here without the
  // tutor doing anything. Already-graded assignments are left alone.
  const effectiveAssignments: MaterialAssignment[] = state.assignments.map((a) => {
    if (a.status !== "assigned") return a;
    const submitted = portalSubmissions.some((sub) => sub.assignmentId === a.id);
    return submitted ? { ...a, status: "submitted" as const } : a;
  });

  // Derived attendance from student "Join class" events, falling back to a
  // manual mark when one exists (manual always wins). Session length comes
  // from the course's own durationMins (block8 is a 3-hour room booking,
  // not 60 minutes - a flat 60-minute assumption used to under-count how
  // long a no-show has to join before counting as absent). Representation
  // for "session not finished yet, no join event": the key is simply
  // omitted from the returned record, so callers treat "no entry" as
  // pending/unknown rather than a hard "absent" - only once the session's
  // end time has passed does a no-show become "absent".
  const autoAttendance = useCallback(
    (courseId: TutorCourseId, sessionISO: string): Record<string, { status: AttendanceStatus; source: "auto" | "manual" }> => {
      const roster = TUTOR_COURSES[courseId].students;
      const dKey = sessionISO.slice(0, 10);
      const manualKey = courseId + ":" + dKey;
      const manual = state.attendance[manualKey] ?? {};
      const sessionStart = Date.parse(sessionISO);
      const sessionEnd = sessionStart + TUTOR_COURSES[courseId].durationMins * 60000;
      const finished = state.now >= sessionEnd;

      const out: Record<string, { status: AttendanceStatus; source: "auto" | "manual" }> = {};
      roster.forEach((st) => {
        const manualMark = manual[st.name];
        if (manualMark) {
          out[st.name] = { status: manualMark, source: "manual" };
          return;
        }
        const join = portalJoinEvents.find(
          (j) => j.courseId === courseId && j.sessionISO === sessionISO && j.studentName === st.name
        );
        if (join) {
          out[st.name] = { status: join.minsLate <= ON_TIME_GRACE_MIN ? "present" : "late", source: "auto" };
          return;
        }
        if (finished) {
          out[st.name] = { status: "absent", source: "auto" };
        }
        // else: no join event and the session has not finished - omitted
        // from the record (pending), see comment above.
      });
      return out;
    },
    [state.attendance, state.now, portalJoinEvents]
  );

  const asksToday = state.elliotAsks.dateKey === new Date(state.now).toISOString().slice(0, 10) ? state.elliotAsks.replies : 0;
  const elliotRemaining = Math.max(0, TUTOR_ELLIOT_DAILY_ASKS - asksToday);
  const elliotCapped = elliotRemaining === 0;

  const value: TutorContextValue = {
    ...state,
    classes,
    toMarkCount,
    pendingRequests,
    showToast,
    notWired,
    setRequestClass,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    sendRequest,
    editRequest,
    markSubmission,
    elliotRemaining,
    elliotCapped,
    countElliotAsk,
    hasInPerson: state.mode !== "online",
    hasOnline: state.mode !== "in_person",
    setMode,
    shareDigital,
    markAttendance,
    markAllPresent,
    assignMaterial,
    setAssignmentStatus,
    removeAssignment,
    effectiveAssignments,
    autoAttendance,
    prevMonth,
    nextMonth,
    selectDay,
  };

  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>;
}
