// The things that happen to a class after it is set up.
//
// A class is not a fixed list of people taught by a fixed person. Students
// leave partway through a term, a tutor gets sick and someone covers, and a
// student who missed a lesson sits in on another class that week. All three
// were invisible to this app: a removed student simply vanished, a relief
// tutor meant overwriting the real tutor's name, and a catch-up had nowhere
// to be recorded at all.
//
// All three live here, in one place both portals read, for the same reason the
// block rosters do: the office writes them and the tutor and the student have
// to see the result. Anything else is two truths about one class.

const LEAVERS_KEY = "evr-class-leavers";
const RELIEF_KEY = "evr-class-relief";
const CATCHUP_KEY = "evr-class-catchups";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event("evr-sync"));
    }
  } catch {
    /* a full quota should not stop the change applying for this session */
  }
}

/** The demo's today, so a leaving date and a relief window agree with the calendar. */
export const TODAY_ISO = "2026-07-02";

export function displayDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Students who leave
// ---------------------------------------------------------------------------

export interface Leaver {
  name: string;
  /** yyyy-mm-dd. */
  on: string;
}

export function leaversFor(classId: string): Leaver[] {
  return read<Record<string, Leaver[]>>(LEAVERS_KEY, {})[classId] ?? [];
}

/**
 * Records that a student has left, rather than dropping them silently.
 *
 * Their attendance and their submissions were never deleted by a roster change
 * - they are stored per student, not per class - but with the roster being the
 * only thing that listed them, removing someone put their whole history out of
 * reach. This is what keeps the door open to it.
 */
export function recordLeavers(classId: string, names: string[], on = TODAY_ISO) {
  if (names.length === 0) return;
  const all = read<Record<string, Leaver[]>>(LEAVERS_KEY, {});
  const existing = all[classId] ?? [];
  const added = names.filter((n) => !existing.some((l) => l.name === n)).map((name) => ({ name, on }));
  if (added.length === 0) return;
  write(LEAVERS_KEY, { ...all, [classId]: [...existing, ...added] });
}

/** Puts someone back on the roll, for the one that was a mistake. */
export function restoreLeaver(classId: string, name: string) {
  const all = read<Record<string, Leaver[]>>(LEAVERS_KEY, {});
  write(LEAVERS_KEY, { ...all, [classId]: (all[classId] ?? []).filter((l) => l.name !== name) });
}

// ---------------------------------------------------------------------------
// Relief tutors
// ---------------------------------------------------------------------------

export interface Relief {
  id: string;
  classId: string;
  /** Who is covering. */
  tutor: string;
  /** Inclusive yyyy-mm-dd window. A single date has from === to. */
  from: string;
  to: string;
}

export function allRelief(): Relief[] {
  return read<Relief[]>(RELIEF_KEY, []);
}

export function reliefFor(classId: string): Relief[] {
  return allRelief().filter((r) => r.classId === classId);
}

/** Who is actually taking a class on a date: the relief if there is one, else nobody. */
export function reliefOn(classId: string, dateISO: string): Relief | null {
  return allRelief().find((r) => r.classId === classId && dateISO >= r.from && dateISO <= r.to) ?? null;
}

export function addRelief(r: Omit<Relief, "id">) {
  write(RELIEF_KEY, [...allRelief(), { ...r, id: "rl" + Date.now().toString(36) }]);
}

export function cancelRelief(id: string) {
  write(RELIEF_KEY, allRelief().filter((r) => r.id !== id));
}

// ---------------------------------------------------------------------------
// Catch-up sessions
// ---------------------------------------------------------------------------

export interface CatchUp {
  id: string;
  student: string;
  /** The class they are enrolled in and missed. */
  homeClass: string;
  /** The class whose session they want to sit in on. */
  hostClass: string;
  hostClassId: string;
  /** yyyy-mm-dd of the session they want to join. */
  date: string;
  time: string;
  status: "pending" | "approved" | "declined";
  requestedOn: string;
}

export function allCatchUps(): CatchUp[] {
  return read<CatchUp[]>(CATCHUP_KEY, []);
}

export function catchUpsFor(student: string): CatchUp[] {
  return allCatchUps().filter((c) => c.student === student);
}

/** Approved catch-ups sitting in on one class on one date, for the tutor's roll. */
export function catchUpsOn(hostClassId: string, dateISO: string): CatchUp[] {
  return allCatchUps().filter((c) => c.hostClassId === hostClassId && c.date === dateISO && c.status === "approved");
}

export function pendingCatchUps(): CatchUp[] {
  return allCatchUps().filter((c) => c.status === "pending");
}

export function requestCatchUp(c: Omit<CatchUp, "id" | "status" | "requestedOn">) {
  write(CATCHUP_KEY, [...allCatchUps(), { ...c, id: "cu" + Date.now().toString(36), status: "pending" as const, requestedOn: TODAY_ISO }]);
}

export function setCatchUpStatus(id: string, status: CatchUp["status"]) {
  write(CATCHUP_KEY, allCatchUps().map((c) => (c.id === id ? { ...c, status } : c)));
}
