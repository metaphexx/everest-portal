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
import { patchTutorState, readPortalState, readTutorState } from "./live-sync";
import {
  ApprovalStatus,
  BookletRequest,
  MaterialAssignment,
  PrintFormat,
  PrintingStatus,
  Submission,
  TUTOR,
  TUTOR_COURSES,
  seedRequests,
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
    hydrated: false,
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // Read the tutor blob on mount and whenever either portal writes. The office
  // is a viewer of the tutor's work, so its data is theirs, not a second seed.
  useEffect(() => {
    const load = () => {
      const t = readTutorState();
      setState((s) => ({
        ...s,
        hydrated: true,
        requests: [...(t && Array.isArray(t.requests) ? t.requests : seedRequests()), ...readOfficeRequests()],
        assignments: t && Array.isArray(t.assignments) ? t.assignments : [],
        submissions: t && Array.isArray(t.submissions) ? t.submissions : [],
      }));
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

  // Classes scheduled from the office. Session-scoped on purpose: the demo
  // resets cleanly, and nothing here belongs in the tutor's own blob.
  const [scheduled, setScheduled] = useState<AdminSession[]>([]);

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
      setScheduled((list) => [...list, { ...s, id: "new-" + list.length + ":" + s.k }]);
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
    }));
    return [...live, ...SHARED_FILES];
  }, [state.assignments]);

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
    sharedFiles,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Students who have joined a class in the student portal, for the live view. */
export function readStudentJoins(): { courseId: string; at: string }[] {
  const p = readPortalState();
  return p && Array.isArray(p.joinEvents) ? p.joinEvents : [];
}
