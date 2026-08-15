// State for the office portal.
//
// The office does not own a separate copy of the booklet pipeline. It reads the
// tutor's blob, makes its decision, and writes the decision straight back, so
// approving here turns "Pending" into "Approved" in the tutor's My Requests
// with no reload. That round trip is the whole point of the screen - an
// approvals queue that only updates its own copy proves nothing.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { patchTutorState, readPortalState, readTutorState } from "./live-sync";
import {
  ApprovalStatus,
  BookletRequest,
  MaterialAssignment,
  PrintingStatus,
  Submission,
  TUTOR,
  TUTOR_COURSES,
  seedRequests,
} from "./tutor-data";
import { SHARED_FILES, SharedFileRow } from "./admin-data";

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
  /** Every file shared on the platform: the seeded ledger plus live assignments. */
  sharedFiles: SharedFileRow[];
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
        requests: t && Array.isArray(t.requests) ? t.requests : seedRequests(),
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

  /** Writes the decision to both this portal and the tutor's, in that order. */
  const writeRequests = useCallback((next: BookletRequest[]) => {
    setState((s) => ({ ...s, requests: next }));
    patchTutorState({ requests: next });
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
    sharedFiles,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Students who have joined a class in the student portal, for the live view. */
export function readStudentJoins(): { courseId: string; at: string }[] {
  const p = readPortalState();
  return p && Array.isArray(p.joinEvents) ? p.joinEvents : [];
}
