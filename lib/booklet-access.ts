// What the office has granted a tutor over a booklet folder.
//
// The Booklet Drive Map is where the office says which tutors may take from a
// folder, and whether each of them may hand it to anyone or only to their own
// students. That second flag was stored and displayed and read by nothing, so
// it granted precisely nothing. This is the side that reads it.

import { BOOKLET_DRIVE, BookletDriveMap } from "./admin-masters";
import { AdminStudent, allStudents } from "./admin-data";

/** Office edits and additions, read the way the other shared stores are. */
function officeRows(): BookletDriveMap[] {
  if (typeof window === "undefined") return BOOKLET_DRIVE;
  let patches: Record<string, Partial<BookletDriveMap>> = {};
  let added: BookletDriveMap[] = [];
  let deleted: string[] = [];
  try {
    patches = JSON.parse(window.localStorage.getItem("evr-admin-masters") ?? "{}");
  } catch {
    /* a corrupt blob just means the seeded grants stand */
  }
  try {
    added = JSON.parse(window.localStorage.getItem("evr-admin-master-adds") ?? "{}")["booklet-drive"] ?? [];
  } catch {
    /* as above */
  }
  try {
    deleted = JSON.parse(window.localStorage.getItem("evr-admin-master-deletes") ?? "{}")["booklet-drive"] ?? [];
  } catch {
    /* as above */
  }
  return [...BOOKLET_DRIVE, ...added]
    .filter((r) => !deleted.includes(r.id))
    .map((r) => ({ ...r, ...patches[r.id] }));
}

/**
 * Whether a tutor may assign booklets to students outside their own classes.
 *
 * Granted per folder, but it is a question about the tutor rather than about
 * one folder: holding it anywhere means the office trusts them to hand work to
 * a student who is not on their roll. An inactive folder grants nothing.
 */
export function canAssignToAnyStudent(tutor: string): boolean {
  return officeRows().some((r) => r.active && r.tutors.some((t) => t.name === tutor && t.allowAllStudents));
}

/**
 * The roster as the office holds it: the seeded students plus anyone the office
 * has enrolled in Master Records, minus anyone it has removed, with its edits
 * applied. A student enrolled today is on nobody's roll yet, so this is the
 * only list that contains them.
 */
function officeStudentRows(): { key: string; row: AdminStudent }[] {
  const seed = allStudents().map((row) => ({ key: row.name, row }));
  if (typeof window === "undefined") return seed;
  let added: AdminStudent[] = [];
  let deleted: string[] = [];
  let patches: Record<string, Partial<AdminStudent>> = {};
  try {
    added = JSON.parse(window.localStorage.getItem("evr-admin-master-adds") ?? "{}").students ?? [];
  } catch {
    /* a corrupt blob just means the seeded roster stands */
  }
  try {
    deleted = JSON.parse(window.localStorage.getItem("evr-admin-master-deletes") ?? "{}").students ?? [];
  } catch {
    /* as above */
  }
  try {
    patches = JSON.parse(window.localStorage.getItem("evr-admin-masters") ?? "{}");
  } catch {
    /* as above */
  }
  return [...seed, ...added.map((row) => ({ key: row.name, row }))]
    .filter((r) => !deleted.includes(r.key))
    // Office edits are keyed by the name the student was enrolled under, so the
    // key survives a rename and the rosters that hold that key still match.
    .map((r) => ({ key: r.key, row: { ...r.row, ...patches[r.key] } }));
}

export function officeStudents(): AdminStudent[] {
  return officeStudentRows().map((r) => r.row);
}

/**
 * Students a tutor may assign to who are not on any of their own rolls.
 *
 * Empty unless the office has ticked "any student" on a folder for them, and
 * empty anyway while every enrolled student is already one of theirs - which
 * is the ordinary state. It fills the moment the office enrols someone who has
 * not been placed in a class yet.
 */
export function studentsOutsideOwnClasses(tutor: string, ownNames: Iterable<string>): AdminStudent[] {
  if (!canAssignToAnyStudent(tutor)) return [];
  const mine = new Set(ownNames);
  return officeStudentRows()
    .filter((r) => !mine.has(r.key) && r.row.status !== "withdrawn" && r.row.delivery === "online")
    .map((r) => r.row);
}

/** The folders a tutor has been given, for telling them where the reach came from. */
export function grantedFolders(tutor: string): string[] {
  return officeRows()
    .filter((r) => r.active && r.tutors.some((t) => t.name === tutor))
    .map((r) => r.purpose);
}

// ---------------------------------------------------------------------------
// Enrolment status, as the tutor needs it
// ---------------------------------------------------------------------------

/**
 * A student's enrolment status, office edits included.
 *
 * The office holds this and the tutor never saw it, which is backwards for the
 * one status that matters most to them: a trial student is being decided on,
 * and the tutor is most of that decision.
 */
export function studentStatusOf(name: string): "active" | "trial" | "withdrawn" {
  return officeStudents().find((s) => s.name === name)?.status ?? "active";
}

/** Everyone on trial, so a roster can mark them without a lookup each. */
export function trialStudents(): Set<string> {
  return new Set(officeStudents().filter((s) => s.status === "trial").map((s) => s.name));
}
