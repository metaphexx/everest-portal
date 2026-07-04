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
