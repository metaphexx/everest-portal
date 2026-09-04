// Tiny SSR-safe helpers shared by both portals so the tutor side can read
// the student's localStorage blob (and vice versa) in the same demo browser.
// No backend in this prototype - this is the entire "sync" layer. Both
// portals additionally listen for the browser "storage" event to refresh
// when the other tab/window writes a new value.

export const LIVE_EVENT = "storage";

function readBlob(key: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Reads the student portal's persisted blob ("evr-portal"), or null on the server / if absent or corrupted. */
export function readPortalState(): any | null {
  return readBlob("evr-portal");
}

/** Reads the tutor portal's persisted blob ("evr-tutor"), or null on the server / if absent or corrupted. */
export function readTutorState(): any | null {
  return readBlob("evr-tutor");
}

/**
 * Merges a patch into the tutor blob. The office writes here when it approves,
 * rejects or prints a request, so the decision lands in the tutor's My Requests
 * exactly as it would through a backend. Same-tab listeners get a manual event
 * because the browser only fires "storage" in OTHER tabs.
 */
export function patchTutorState(patch: Record<string, any>): void {
  if (typeof window === "undefined") return;
  try {
    const current = readBlob("evr-tutor") || { v: 1 };
    window.localStorage.setItem("evr-tutor", JSON.stringify({ ...current, ...patch, v: 1 }));
    window.dispatchEvent(new Event("evr-sync"));
  } catch {
    /* quota or private mode: the admin's own state still updated */
  }
}

/** Reads the classroom blob ("evr-classroom"): posts, replies and their attachments. */
export function readClassroomState(): any | null {
  return readBlob("evr-classroom");
}

/** Reads the messaging blob ("evr-messaging"): threads and their messages. */
export function readMessagingState(): any | null {
  return readBlob("evr-messaging");
}

/**
 * Writes a whole store back. Used when the office recalls or blocks a file: the
 * attachment has to leave the post or message it was shared in, not just gain a
 * badge on the office's own ledger. The version field is preserved, because
 * both stores drop a blob whose version they do not recognise.
 */
export function writeSharedStore(key: "evr-classroom" | "evr-messaging", db: Record<string, any>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(db));
    window.dispatchEvent(new Event("evr-sync"));
  } catch {
    /* quota or private mode: the office ledger still records the decision */
  }
}
