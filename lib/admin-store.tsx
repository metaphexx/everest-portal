// State for the office portal.
//
// The office does not own a separate copy of the booklet pipeline. It reads the
// tutor's blob, makes its decision, and writes the decision straight back, so
// approving here turns "Pending" into "Approved" in the tutor's My Requests
// with no reload. That round trip is the whole point of the screen - an
// approvals queue that only updates its own copy proves nothing.
//
// On top of the tutor's own requests the office holds the ledger for every
// OTHER tutor and centre (lib/office-requests.ts), which the tutor portal has no
// view of. Those rows persist under evr-admin-requests rather than in the tutor
// blob, so a decision on one survives a reload without ever appearing in Priya's
// My Requests.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { patchTutorState, readClassroomState, readMessagingState, readPortalState, readTutorState, writeSharedStore } from "./live-sync";
import {
  ApprovalStatus,
  AttendanceStatus,
  BookletRequest,
  MaterialAssignment,
  PrintFormat,
  PrintingStatus,
  Submission,
  TUTOR,
  TUTOR_COURSES,
  SEED_ASSIGNMENTS,
  seedAttendance,
  seedRequests,
  seedSubmissions,
} from "./tutor-data";
import { AdminClass, SHARED_FILES, SharedFileRow } from "./admin-data";
import { AdminSession, SessionPatch } from "./admin-schedule";
import { isOfficeRequest, officeRequests } from "./office-requests";

const OFFICE_KEY = "evr-admin-requests";

/**
 * An office edit to a class. Beyond the class's own fields it carries the roll
 * by name and the meeting link, neither of which the seeded class record has a
 * place for - the roll was inferred from whichever student records named the
 * class, which is not something the office can edit.
 */
export type ClassPatch = Partial<AdminClass> & { studentNames?: string[]; link?: string };

/**
 * Edits to a master record - a centre, a printer, a printer mapping. Keyed by
 * the record's own id, which is unique across the master tables, so one store
 * serves every tab rather than one per record type.
 */
export type MasterPatch = Record<string, unknown>;

/** The office ledger as last edited, or freshly generated on a clean demo. */
function readOfficeRequests(): BookletRequest[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(OFFICE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed as BookletRequest[];
    }
  } catch {
    /* fall through to a fresh ledger */
  }
  return officeRequests();
}

function writeOfficeRequests(rows: BookletRequest[]) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(OFFICE_KEY, JSON.stringify(rows));
  } catch {
    /* a full quota should not break the queue */
  }
}

interface AdminState {
  toast: string;
  requests: BookletRequest[];
  assignments: MaterialAssignment[];
  submissions: Submission[];
  /** "<sessionId>:<yyyy-mm-dd>" -> student name -> status, as the tutor marked it. */
  attendance: Record<string, Record<string, AttendanceStatus>>;
  /** Rejection reasons and print notes the office has typed this session. */
  hydrated: boolean;
}

interface AdminApi extends AdminState {
  showToast: (msg: string) => void;
  notWired: (label: string) => void;
  /** Queue counts, so the sidebar and the dashboard cannot disagree. */
  pendingCount: number;
  toPrintCount: number;
  setApproval: (id: string, approval: ApprovalStatus, note?: string) => void;
  setPrinting: (id: string, printing: PrintingStatus) => void;
  /** Corrects the printer or the print format a tutor chose, before approving. */
  updateRequest: (id: string, patch: { printer?: string; format?: PrintFormat }) => void;
  /** Classes scheduled from the office this session, folded into the calendar. */
  scheduled: AdminSession[];
  addScheduledClass: (s: Omit<AdminSession, "id">) => void;
  /** Every file shared on the platform: the seeded ledger plus live assignments. */
  sharedFiles: SharedFileRow[];
  /** Office edits to a class (tutor, time, seats), applied over the seed data. */
  classPatches: Record<string, ClassPatch>;
  patchClass: (id: string, patch: ClassPatch) => void;
  sessionPatches: Record<string, SessionPatch>;
  patchSession: (id: string, patch: SessionPatch) => void;
  masterPatches: Record<string, MasterPatch>;
  patchMaster: (id: string, patch: MasterPatch, label?: string) => void;
  /** Master records the office has created, by table. */
  masterAdds: Record<string, MasterPatch[]>;
  addMaster: (table: string, row: MasterPatch, label?: string) => void;
  /** Ids the office has deleted, by table. Seeded rows cannot be removed at source. */
  masterDeletes: Record<string, string[]>;
  deleteMaster: (table: string, id: string, label?: string) => void;
  /** Reminders the office has sent, by what they were about. */
  nudges: Record<string, { on: string; count: number }>;
  nudge: (key: string, who: string) => void;
  /**
   * Recalled or blocked shared files, by the file's id in sharedFiles. The row
   * itself is kept alongside the decision: pulling a live file deletes the post
   * it came from, and an oversight ledger that forgets what it withdrew is no
   * longer a record of what was shared.
   */
  fileActions: Record<string, { action: "recalled" | "blocked"; on: string; row?: SharedFileRow }>;
  recallFile: (id: string, action: "recalled" | "blocked", row?: SharedFileRow) => void;
}

const Ctx = createContext<AdminApi | null>(null);

export function useAdmin(): AdminApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin must be used inside <AdminProvider>");
  return v;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminState>({
    toast: "",
    requests: seedRequests(),
    assignments: [],
    submissions: [],
    attendance: {},
    hydrated: false,
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  /**
   * The classroom and messaging stores, read the same way the tutor blob is.
   * The office's promise is that it sees every file shared on the platform, and
   * a file posted in a classroom or sent in a message is most of that traffic -
   * reading only the assignment list made the ledger quietly incomplete.
   */
  const [shared, setShared] = useState<{ classroom: any | null; messaging: any | null }>({ classroom: null, messaging: null });

  // Read the tutor blob on mount and whenever either portal writes. The office
  // is a viewer of the tutor's work, so its data is theirs, not a second seed.
  useEffect(() => {
    const load = () => {
      const t = readTutorState();
      setState((s) => ({
        ...s,
        hydrated: true,
        requests: [...(t && Array.isArray(t.requests) ? t.requests : seedRequests()), ...readOfficeRequests()],
        assignments: t && Array.isArray(t.assignments) ? t.assignments : SEED_ASSIGNMENTS,
        submissions: t && Array.isArray(t.submissions) ? t.submissions : seedSubmissions(),
        // The marks the tutor actually took. The office never read these, so
        // the only attendance it could show was a percentage with nothing
        // behind it.
        attendance: t && t.attendance ? t.attendance : seedAttendance(),
      }));
      setShared({ classroom: readClassroomState(), messaging: readMessagingState() });
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener("evr-sync", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("evr-sync", load);
      clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setState((s) => ({ ...s, toast: msg }));
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: "" })), 2600);
  }, []);

  const notWired = useCallback((label: string) => showToast(label + " is not wired up in this prototype yet"), [showToast]);

  /**
   * Writes the decision to both this portal and the tutor's, in that order.
   * The office ledger is split back out first: those rows are other tutors'
   * work and must not land in Priya's My Requests.
   */
  const writeRequests = useCallback((next: BookletRequest[]) => {
    setState((s) => ({ ...s, requests: next }));
    writeOfficeRequests(next.filter(isOfficeRequest));
    patchTutorState({ requests: next.filter((r) => !isOfficeRequest(r)) });
  }, []);

  const setApproval = useCallback(
    (id: string, approval: ApprovalStatus, note?: string) => {
      const next = state.requests.map((r) => (r.id === id ? { ...r, approval, note: note ?? r.note } : r));
      writeRequests(next);
      const r = state.requests.find((x) => x.id === id);
      showToast(
        approval === "approved"
          ? (r ? r.ref : "Request") + " approved and sent to printing"
          : (r ? r.ref : "Request") + " rejected. The tutor sees your reason."
      );
    },
    [state.requests, writeRequests, showToast]
  );

  const setPrinting = useCallback(
    (id: string, printing: PrintingStatus) => {
      writeRequests(state.requests.map((r) => (r.id === id ? { ...r, printing } : r)));
      showToast(printing === "completed" ? "Marked as printed" : printing === "failed" ? "Marked as failed. The tutor is told." : "Moved back to the print queue");
    },
    [state.requests, writeRequests, showToast]
  );

  const updateRequest = useCallback(
    (id: string, patch: { printer?: string; format?: PrintFormat }) => {
      writeRequests(state.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    [state.requests, writeRequests]
  );

  /**
   * Classes scheduled from the office. Persisted like every other office edit:
   * being the one thing that vanished on reload made a scheduled class look
   * like it had failed to save. Clearing localStorage still resets the demo.
   */
  const [scheduled, setScheduled] = useState<AdminSession[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("evr-admin-scheduled") : null;
      return raw ? (JSON.parse(raw) as AdminSession[]) : [];
    } catch {
      return [];
    }
  });

  // Edits to classes. Persisted: an office that fixes a tutor's name expects
  // the fix to still be there tomorrow.
  const [classPatches, setClassPatches] = useState<Record<string, ClassPatch>>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("evr-admin-classes") : null;
      return raw ? (JSON.parse(raw) as Record<string, ClassPatch>) : {};
    } catch {
      return {};
    }
  });
  const patchClass = useCallback((id: string, patch: ClassPatch) => {
    setClassPatches((m) => {
      const next = { ...m, [id]: { ...m[id], ...patch } };
      try {
        window.localStorage.setItem("evr-admin-classes", JSON.stringify(next));
      } catch {
        /* storage full - the edit still applies for this session */
      }
      return next;
    });
    showToast("Class updated");
  }, [showToast]);

  // Edits to a single dated session, which is a different thing from editing
  // the class: moving next Thursday's lesson an hour later does not move every
  // Thursday. Persisted the same way, and overlaid wherever sessions are read.
  // Edits to the master records, persisted like the others: an office that
  // corrects a centre's email expects the correction to still be there tomorrow.
  const [masterPatches, setMasterPatches] = useState<Record<string, MasterPatch>>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("evr-admin-masters") : null;
      return raw ? (JSON.parse(raw) as Record<string, MasterPatch>) : {};
    } catch {
      return {};
    }
  });
  const patchMaster = useCallback((id: string, patch: MasterPatch, label = "Record") => {
    setMasterPatches((m) => {
      const next = { ...m, [id]: { ...m[id], ...patch } };
      try {
        window.localStorage.setItem("evr-admin-masters", JSON.stringify(next));
      } catch {
        /* storage full - the edit still applies for this session */
      }
      return next;
    });
    showToast(label + " updated");
  }, [showToast]);

  // New master records, kept apart from the edits so a patch cannot be mistaken
  // for a row and a row cannot be mistaken for a patch.
  const [masterAdds, setMasterAdds] = useState<Record<string, MasterPatch[]>>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("evr-admin-master-adds") : null;
      return raw ? (JSON.parse(raw) as Record<string, MasterPatch[]>) : {};
    } catch {
      return {};
    }
  });
  const addMaster = useCallback((table: string, row: MasterPatch, label = "Record") => {
    setMasterAdds((m) => {
      const next = { ...m, [table]: [...(m[table] ?? []), row] };
      try {
        window.localStorage.setItem("evr-admin-master-adds", JSON.stringify(next));
      } catch {
        /* storage full - the row still shows for this session */
      }
      return next;
    });
    showToast(label + " added");
  }, [showToast]);

  /**
   * Deleted master records, by table, as a list of ids. A seeded row cannot be
   * removed from the file it is declared in, so deletion is recorded here and
   * applied wherever the rows are read. A row the office added itself is
   * dropped outright instead, so it leaves nothing behind.
   */
  const [masterDeletes, setMasterDeletes] = useState<Record<string, string[]>>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("evr-admin-master-deletes") : null;
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  });
  const deleteMaster = useCallback(
    (table: string, id: string, label = "Record") => {
      const added = (masterAdds[table] ?? []).some((r) => r.id === id);
      if (added) {
        setMasterAdds((m) => {
          const next = { ...m, [table]: (m[table] ?? []).filter((r) => r.id !== id) };
          try {
            window.localStorage.setItem("evr-admin-master-adds", JSON.stringify(next));
          } catch {
            /* storage full - the row is still gone for this session */
          }
          return next;
        });
      } else {
        setMasterDeletes((m) => {
          const next = { ...m, [table]: [...(m[table] ?? []), id] };
          try {
            window.localStorage.setItem("evr-admin-master-deletes", JSON.stringify(next));
          } catch {
            /* storage full - the row is still gone for this session */
          }
          return next;
        });
      }
      showToast(label + " deleted");
    },
    [masterAdds, showToast]
  );

  /**
   * Chasing someone is a real event, so it is recorded rather than toasted and
   * forgotten: the office needs to see it has already asked, and how long ago,
   * or it nags the same tutor twice on a Monday and not at all on a Friday.
   */
  const [nudges, setNudges] = useState<Record<string, { on: string; count: number }>>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("evr-admin-nudges") : null;
      return raw ? (JSON.parse(raw) as Record<string, { on: string; count: number }>) : {};
    } catch {
      return {};
    }
  });
  const nudge = useCallback((key: string, who: string) => {
    setNudges((m) => {
      const next = { ...m, [key]: { on: new Date().toISOString(), count: (m[key]?.count ?? 0) + 1 } };
      try {
        window.localStorage.setItem("evr-admin-nudges", JSON.stringify(next));
      } catch {
        /* storage full - the reminder still shows for this session */
      }
      return next;
    });
    showToast("Reminder sent to " + who);
  }, [showToast]);

  /** Recalling or blocking a tutor's own material, on rows sourced from it. */
  type FileAction = { action: "recalled" | "blocked"; on: string; row?: SharedFileRow };
  const [fileActions, setFileActions] = useState<Record<string, FileAction>>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("evr-admin-file-actions") : null;
      return raw ? (JSON.parse(raw) as Record<string, FileAction>) : {};
    } catch {
      return {};
    }
  });
  const recallFile = useCallback(
    (id: string, action: "recalled" | "blocked", row?: SharedFileRow) => {
      setFileActions((m) => {
        const next = { ...m, [id]: { action, on: new Date().toISOString(), row } };
        try {
          window.localStorage.setItem("evr-admin-file-actions", JSON.stringify(next));
        } catch {
          /* storage full - the badge still shows for this session */
        }
        return next;
      });

      // Pull the file out of wherever it was actually shared, so it stops being
      // reachable by the student rather than only being marked here. A seeded
      // row has no live post or message behind it, so for those the badge is
      // the whole of the effect.
      const [kind, ...parts] = id.split(":");
      const drop = <T,>(list: T[] | undefined, i: number): T[] => (list ?? []).filter((_, j) => j !== i);

      if (kind === "post" || kind === "reply") {
        const db = readClassroomState();
        if (db?.posts) {
          const [classroomId, postId] = parts;
          const at = Number(parts[parts.length - 1]);
          db.posts[classroomId] = (db.posts[classroomId] ?? []).map((p: any) => {
            if (p.id !== postId) return p;
            if (kind === "post") return { ...p, attachments: drop(p.attachments, at) };
            const replyId = parts[2];
            return { ...p, replies: (p.replies ?? []).map((r: any) => (r.id === replyId ? { ...r, attachments: drop(r.attachments, at) } : r)) };
          });
          writeSharedStore("evr-classroom", db);
        }
      } else if (kind === "msg") {
        const db = readMessagingState();
        if (db?.messages) {
          const [threadId, messageId, attachmentId] = parts;
          db.messages[threadId] = (db.messages[threadId] ?? []).map((m: any) =>
            m.id === messageId ? { ...m, attachments: (m.attachments ?? []).filter((a: any) => a.id !== attachmentId) } : m
          );
          writeSharedStore("evr-messaging", db);
        }
      }

      showToast(action === "recalled" ? "File recalled" : "File blocked");
    },
    [showToast]
  );

  const [sessionPatches, setSessionPatches] = useState<Record<string, SessionPatch>>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("evr-admin-sessions") : null;
      return raw ? (JSON.parse(raw) as Record<string, SessionPatch>) : {};
    } catch {
      return {};
    }
  });
  const patchSession = useCallback((id: string, patch: SessionPatch) => {
    setSessionPatches((m) => {
      const next = { ...m, [id]: { ...m[id], ...patch } };
      try {
        window.localStorage.setItem("evr-admin-sessions", JSON.stringify(next));
      } catch {
        /* storage full - the edit still applies for this session */
      }
      return next;
    });
    showToast("Class updated");
  }, [showToast]);
  const addScheduledClass = useCallback(
    (s: Omit<AdminSession, "id">) => {
      setScheduled((list) => {
        const next = [...list, { ...s, id: "new-" + list.length + ":" + s.k }];
        try {
          window.localStorage.setItem("evr-admin-scheduled", JSON.stringify(next));
        } catch {
          /* storage full - the class still shows for this session */
        }
        return next;
      });
      showToast(s.className + " scheduled for " + new Date(s.k + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }));
    },
    [showToast]
  );

  // Print jobs only. A digital pack costs nothing to deliver, so it never
  // needed approval and must not sit in the office's queue.
  const printJobs = useMemo(() => state.requests.filter((r) => (r.delivery ?? "print") === "print"), [state.requests]);
  const pendingCount = useMemo(() => printJobs.filter((r) => r.approval === "pending").length, [printJobs]);
  const toPrintCount = useMemo(
    () => printJobs.filter((r) => r.approval === "approved" && r.printing === "not_started").length,
    [printJobs]
  );

  // Live assignments become file-ledger rows, so anything a tutor sends during
  // the demo appears in the office's oversight list within the second.
  const sharedFiles = useMemo(() => {
    const live: SharedFileRow[] = state.assignments.map((a) => ({
      id: "live-" + a.id,
      file: a.fileName,
      // Only Priya's portal writes assignments in this prototype, so the sender
      // is known rather than guessed.
      from: TUTOR.name,
      to: a.target.kind === "class" ? TUTOR_COURSES[a.courseId].name + " (whole class)" : a.target.studentName,
      context: "Assigned material",
      when: a.assignedAt,
      kind: "assigned" as const,
      source: "everest" as const,
    }));

    // Files a tutor posted into a classroom, including on a reply. These are
    // the tutor's own uploads rather than anything the office vetted, so they
    // are exactly what the Recall and Block actions exist for.
    const fromClassrooms: SharedFileRow[] = [];
    const posts: Record<string, any[]> = shared.classroom?.posts ?? {};
    for (const [classroomId, list] of Object.entries(posts)) {
      const room = (TUTOR_COURSES as Record<string, { name: string } | undefined>)[classroomId]?.name ?? classroomId;
      for (const post of list ?? []) {
        if (post.role === "tutor") {
          (post.attachments ?? []).forEach((att: any, i: number) => {
            if (att.kind === "link") return;
            fromClassrooms.push({
              id: "post:" + classroomId + ":" + post.id + ":" + i,
              file: att.name,
              from: post.author,
              to: room + " classroom",
              context: "Classroom post",
              when: post.when,
              kind: "classroom",
              source: "tutor",
            });
          });
        }
        for (const reply of post.replies ?? []) {
          if (reply.role !== "tutor") continue;
          (reply.attachments ?? []).forEach((att: any, i: number) => {
            if (att.kind === "link") return;
            fromClassrooms.push({
              id: "reply:" + classroomId + ":" + post.id + ":" + reply.id + ":" + i,
              file: att.name,
              from: reply.author,
              to: room + " classroom",
              context: "Classroom reply",
              when: reply.when,
              kind: "classroom",
              source: "tutor",
            });
          });
        }
      }
    }

    // Files a tutor attached to a message thread.
    const fromMessages: SharedFileRow[] = [];
    const threads: any[] = shared.messaging?.threads ?? [];
    const byThread: Record<string, any[]> = shared.messaging?.messages ?? {};
    for (const thread of threads) {
      for (const m of byThread[thread.id] ?? []) {
        if (m.role !== "tutor" || !m.attachments?.length) continue;
        const sender = thread.tutor?.name ?? TUTOR.name;
        for (const att of m.attachments) {
          fromMessages.push({
            id: "msg:" + thread.id + ":" + m.id + ":" + att.id,
            file: att.name,
            from: sender,
            to: thread.student?.name ?? "a student",
            context: "Direct message",
            when: new Date(m.sentAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
            kind: "message",
            source: "tutor",
          });
        }
      }
    }

    const rows = [...live, ...fromClassrooms, ...fromMessages, ...SHARED_FILES];

    // Anything recalled or blocked out of a live post or message no longer
    // exists to derive a row from, so its saved copy stands in for it. The
    // office keeps a record of what it withdrew and when.
    const present = new Set(rows.map((r) => r.id));
    const withdrawn = Object.entries(fileActions)
      .filter(([id, a]) => a.row && !present.has(id))
      .map(([, a]) => a.row as SharedFileRow);

    return [...rows, ...withdrawn];
  }, [state.assignments, shared, fileActions]);

  const api: AdminApi = {
    ...state,
    showToast,
    notWired,
    pendingCount,
    toPrintCount,
    setApproval,
    setPrinting,
    updateRequest,
    scheduled,
    addScheduledClass,
    classPatches,
    patchClass,
    sessionPatches,
    patchSession,
    masterPatches,
    patchMaster,
    masterAdds,
    addMaster,
    masterDeletes,
    deleteMaster,
    nudges,
    nudge,
    sharedFiles,
    fileActions,
    recallFile,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Students who have joined a class in the student portal, for the live view. */
export function readStudentJoins(): { courseId: string; at: string }[] {
  const p = readPortalState();
  return p && Array.isArray(p.joinEvents) ? p.joinEvents : [];
}
