// One student's attendance, session by session.
//
// The office could only ever show a percentage. The number was real enough to
// act on - it is what flags a student at risk - but there was nothing behind
// it, so "94%" could not be opened and asked "which ones did she miss".
//
// Two sources feed a row. A mark the tutor actually took always wins. Past
// sessions nobody marked are filled in deterministically, weighted so the run
// of rows adds up to the percentage already shown beside the student's name -
// a list that disagreed with the number above it would be worse than no list.
// Rows say which of the two they are, so a filled-in row is never mistaken for
// a register the tutor took.

import { AttendanceStatus } from "./tutor-data";

export interface AttendanceRow {
  /** yyyy-mm-dd */
  date: string;
  className: string;
  /** The subject within a block, where a block splits the hour three ways. */
  subject?: string;
  status: AttendanceStatus;
  /** True when a tutor actually marked it, false when it is filled in. */
  marked: boolean;
}

/** A session a student was expected at, before any mark is applied. */
export interface ExpectedSession {
  date: string;
  className: string;
  subject?: string;
  /** The key the tutor's marks are stored under: "<sessionId>:<date>". */
  key: string;
}

/** Deterministic djb2, so a filled-in history never reshuffles between renders. */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * A student's attendance across the sessions they were expected at.
 *
 * `pct` is the attendance figure already displayed for this student. The
 * unmarked sessions are filled in so the result lands on it: the sessions with
 * the lowest hash become the misses, which is stable per student and per
 * session but looks unremarkable in a list.
 */
export function attendanceHistory(
  student: string,
  pct: number,
  sessions: ExpectedSession[],
  marks: Record<string, Record<string, AttendanceStatus>>
): AttendanceRow[] {
  const ordered = [...sessions].sort((a, b) => (a.date === b.date ? a.key.localeCompare(b.key) : a.date < b.date ? -1 : 1));

  const marked = new Map<string, AttendanceStatus>();
  const unmarked: ExpectedSession[] = [];
  for (const s of ordered) {
    const hit = marks[s.key]?.[student];
    if (hit) marked.set(s.key, hit);
    else unmarked.push(s);
  }

  // How many of the unmarked ones have to be misses for the whole run to land
  // on the percentage, given whatever the real marks already say.
  const total = ordered.length;
  // Attended means the student was in the room, so late counts as attended
  // here exactly as it does in summarise() below. Counting it as a miss in one
  // place and not the other is how a list stops adding up to its own total.
  const realMisses = [...marked.values()].filter((v) => v === "absent" || v === "excused").length;
  const targetMisses = Math.round((total * (100 - pct)) / 100);
  const needed = Math.max(0, Math.min(unmarked.length, targetMisses - realMisses));

  const missKeys = new Set(
    [...unmarked]
      .sort((a, b) => hash(student + a.key) - hash(student + b.key))
      .slice(0, needed)
      .map((s) => s.key)
  );

  return ordered.map((s) => {
    const real = marked.get(s.key);
    if (real) return { date: s.date, className: s.className, subject: s.subject, status: real, marked: true };
    let status: AttendanceStatus = "present";
    if (missKeys.has(s.key)) {
      // Roughly one in four is excused rather than unexplained, so a filled-in
      // history does not read as a student who never once rang ahead.
      status = hash(student + s.key + "kind") % 4 === 0 ? "excused" : "absent";
    }
    return { date: s.date, className: s.className, subject: s.subject, status, marked: false };
  });
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  /** Present and late both count as attended - the student was in the room. */
  pct: number;
}

export function summarise(rows: AttendanceRow[]): AttendanceSummary {
  const count = (s: AttendanceStatus) => rows.filter((r) => r.status === s).length;
  const present = count("present");
  const late = count("late");
  return {
    total: rows.length,
    present,
    late,
    absent: count("absent"),
    excused: count("excused"),
    pct: rows.length === 0 ? 100 : Math.round(((present + late) / rows.length) * 100),
  };
}
