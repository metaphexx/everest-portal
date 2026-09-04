// Every dated class session the office can see, and the colour system that
// tells you which centre it belongs to at a glance.
//
// Priya's sessions come from buildTutorClasses() - the same records her portal
// renders, complete with the booklet status that drives "has this been
// requested yet". Everyone else's are generated from their weekly slot, because
// only the office has a reason to know about them.

import {
  BookletRequest,
  BookletStatus,
  BOOKLET_META,
  DeliveryMode,
  TUTOR_COURSES,
  TutorClass,
  TutorCourseId,
  bookletStatusFromRequest,
  buildTutorClasses,
} from "./tutor-data";
import { STAFF, allClasses } from "./admin-data";
import { reliefOn } from "./class-changes";
import { hourOf } from "./block";

/**
 * A centre is the single most useful thing to know about a print request, so it
 * gets a colour and keeps it everywhere: calendar dot, card spine, table chip.
 */
export const CENTRE_COLOUR: Record<string, { colour: string; bg: string; short: string }> = {
  "Harrisdale SHS": { colour: "#7A5AF8", bg: "rgba(122,90,248,.13)", short: "HAR" },
  "Piara Waters": { colour: "#0E9C8E", bg: "rgba(14,156,142,.13)", short: "PIA" },
  Willetton: { colour: "#D68910", bg: "rgba(214,137,16,.14)", short: "WIL" },
  "Perth Modern": { colour: "#E0417F", bg: "rgba(224,65,127,.12)", short: "PER" },
  "Head office": { colour: "#66707F", bg: "rgba(102,112,127,.12)", short: "HO" },
  Online: { colour: "#009DFF", bg: "rgba(0,157,255,.12)", short: "ONL" },
};

export function centreStyle(centre: string) {
  return CENTRE_COLOUR[centre] ?? { colour: "#66707F", bg: "rgba(102,112,127,.12)", short: centre.slice(0, 3).toUpperCase() };
}

export interface AdminSession {
  id: string;
  /** yyyy-mm-dd */
  k: string;
  className: string;
  courseId: string;
  tutor: string;
  centre: string;
  delivery: DeliveryMode;
  time: string;
  students: number;
  /** Null for online classes - there is nothing to print, so the question does not apply. */
  booklet: BookletStatus | null;
  session?: number;
  /** Whole-session length. Only the tutor-side courses declare one; the rest run an hour. */
  durationMins?: number;
  /** The term this run belongs to. A class repeats weekly and stops at its end. */
  termId?: string;
}

/**
 * An office edit to one dated session. The first block are fields of the
 * session itself; the rest are things the office attaches to a lesson that the
 * timetable does not model - the meeting link, what is being handed out, and a
 * note for the tutor.
 */
export interface SessionPatch {
  className?: string;
  k?: string;
  time?: string;
  /** One or more tutors, joined for display. */
  tutor?: string;
  durationMins?: number;
  /**
   * The roll, by name. The session carries a COUNT, and the count is derived
   * from this - an office that picks the students should never also have to
   * keep a number in step with them.
   */
  studentNames?: string[];
  link?: string;
  notes?: string;
}

/** Overlay the office's edits onto the generated sessions. */
export function applySessionPatches(sessions: AdminSession[], patches: Record<string, SessionPatch>): AdminSession[] {
  const patched = !patches || Object.keys(patches).length === 0
    ? sessions
    : sessions.map((s) => {
        const p = patches[s.id];
        if (!p) return s;
        const { link, notes, studentNames, ...fields } = p;
        const next: AdminSession = { ...s, ...fields };
        if (studentNames) next.students = studentNames.length;
        return next;
      });

  // Relief last, so a covered session shows who is actually taking it. The
  // class keeps its real tutor everywhere else - this is the one week, not a
  // change of staff.
  return patched.map((s) => {
    const cover = reliefOn(s.courseId, s.k);
    return cover ? { ...s, tutor: cover.tutor + " (relief)" } : s;
  });
}

// ---------------------------------------------------------------------------
// Clashes
// ---------------------------------------------------------------------------

/** A class a student is already in at the time being asked about. */
export interface BusyClass {
  className: string;
  /** As the office writes it, e.g. "Tuesdays 5:00pm to 8:00pm". */
  when: string;
}

/** "7:00pm" -> 1140 minutes past midnight. */
function minutesOf(display: string): number {
  const m = display.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
}

/** Who is on a class's roll. Only the tutor courses carry named students. */
function rollOf(classId: string, patched?: string[]): string[] {
  if (patched) return patched;
  const c = TUTOR_COURSES[classId as TutorCourseId];
  return c ? c.students.map((s) => s.name) : [];
}

type ClassPatchLike = { sched?: string; studentNames?: string[]; tutorName?: string };

interface BusyOpts {
  patches?: Record<string, ClassPatchLike>;
  excludeClassId?: string;
}

/**
 * The classes matching `isOn` that overlap a proposed time.
 *
 * `weekday` is a JavaScript day number (0 = Sunday), and the window is minutes
 * past midnight. Two classes clash when they overlap AT ALL, not merely when
 * they start together - which matters here because a three-hour block swallows
 * any one-hour class dropped inside it.
 */
function busyAt(
  isOn: (c: ReturnType<typeof allClasses>[number], p?: ClassPatchLike) => boolean,
  weekday: number,
  startMin: number,
  endMin: number,
  { patches = {}, excludeClassId }: BusyOpts
): BusyClass[] {
  const out: BusyClass[] = [];
  for (const c of allClasses()) {
    if (c.id === excludeClassId) continue;
    const p = patches[c.id];
    if (!isOn(c, p)) continue;
    const sched = p?.sched ?? c.sched;
    if (dayOf(sched) !== weekday) continue;
    const s = minutesOf(timeOf(sched));
    // Only the tutor courses model a length; an hour is the sane default.
    const e = s + (TUTOR_COURSES[c.id as TutorCourseId]?.durationMins ?? 60);
    if (s < endMin && startMin < e) out.push({ className: c.name, when: sched });
  }
  return out;
}

/**
 * What a student is already in at a proposed time.
 *
 * Listing what a student is enrolled in looked like a safety net but was not
 * one: it never said whether any of it collided with the class being scheduled,
 * so the office still had to hold the timetable in its head. This answers the
 * question that actually prevents a double booking.
 */
export function studentBusyAt(student: string, weekday: number, startMin: number, endMin: number, opts: BusyOpts = {}): BusyClass[] {
  return busyAt((c, p) => rollOf(c.id, p?.studentNames).includes(student), weekday, startMin, endMin, opts);
}

/**
 * What a tutor is already teaching at a proposed time.
 *
 * Unlike a student's, this counts IN-PERSON classes too: a tutor cannot be in a
 * room at Harrisdale and on a call at the same moment, so every class they take
 * is a constraint on the next one. A class can carry more than one tutor, so
 * the name is matched against the list rather than the whole string.
 */
export function tutorBusyAt(tutor: string, weekday: number, startMin: number, endMin: number, opts: BusyOpts = {}): BusyClass[] {
  return busyAt(
    (c, p) => (p?.tutorName ?? c.tutorName).split(",").map((t) => t.trim()).includes(tutor),
    weekday,
    startMin,
    endMin,
    opts
  );
}

/** The office demo clock - Thursday 2 July 2026 at 7:00pm, the header's date. */
export const OFFICE_NOW = { k: "2026-07-02", hour: 19 };

/** Sessions on the clock's day that have started and have not finished. */
export function runningNow(sessions: AdminSession[], now = OFFICE_NOW): AdminSession[] {
  return sessions.filter((s) => {
    if (s.k !== now.k) return false;
    const start = hourOf(s.time);
    return start <= now.hour && now.hour < start + (s.durationMins ?? 60) / 60;
  });
}

/** The first session on the clock's day still to start, if any. */
export function nextToday(sessions: AdminSession[], now = OFFICE_NOW): AdminSession | null {
  return sessions.filter((s) => s.k === now.k && hourOf(s.time) > now.hour).sort((a, b) => hourOf(a.time) - hourOf(b.time))[0] ?? null;
}

const WEEKDAY: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function dayOf(sched: string): number {
  for (const [name, n] of Object.entries(WEEKDAY)) if (sched.startsWith(name)) return n;
  return 1;
}

function timeOf(sched: string): string {
  const m = sched.match(/\d{1,2}:\d{2}\s?(am|pm)/i);
  return m ? m[0] : "4:00pm";
}

function pad(n: number) {
  return n < 10 ? "0" + n : String(n);
}

/** Weekly dates for a weekday across the demo window, June to August 2026. */
function weeklyDates(weekday: number): string[] {
  const out: string[] = [];
  const d = new Date(2026, 5, 1); // 1 June 2026
  while (d < new Date(2026, 7, 31)) {
    if (d.getDay() === weekday) out.push(d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Priya's four courses, from the real records, plus every other tutor's slots.
 *
 * Pass the live requests and each in-person session's booklet status is DERIVED
 * from the request against it - no request, no status. That is what stops the
 * calendar badging a day "Booklets requested" while the queue below it has
 * nothing to show. Without them the sessions carry their seeded status, which
 * is only used to work out which classes print at all.
 */
export function allSessions(extra: AdminSession[] = [], requests?: BookletRequest[]): AdminSession[] {
  const out: AdminSession[] = [];

  for (const c of buildTutorClasses() as TutorClass[]) {
    const cd = TUTOR_COURSES[c.course];
    out.push({
      id: c.id,
      k: c.k,
      className: cd.name,
      courseId: c.course,
      tutor: "Priya Rao",
      centre: cd.delivery === "online" ? "Online" : cd.centre,
      delivery: cd.delivery,
      time: cd.time,
      students: cd.students.length,
      booklet: cd.delivery === "online" ? null : c.booklet,
      session: c.session,
      durationMins: cd.durationMins,
    });
  }

  for (const s of STAFF) {
    (s.extraClasses ?? []).forEach((e, ci) => {
      weeklyDates(dayOf(e.sched)).forEach((k, i) => {
        out.push({
          id: s.id + "-x" + ci + ":" + k,
          k,
          className: e.name,
          courseId: s.id + "-x" + ci,
          tutor: s.name,
          centre: e.delivery === "online" ? "Online" : e.centre,
          delivery: e.delivery,
          time: timeOf(e.sched),
          students: e.students,
          // Deterministic spread so the calendar shows every status, not one.
          booklet: e.delivery === "online" ? null : (["print_completed", "approved", "requested", "not_requested"][(i + ci) % 4] as BookletStatus),
          session: i + 1,
        });
      });
    });
  }

  const all = [...out, ...extra];

  if (requests) {
    // The request is the evidence. An in-person class shows the state of its
    // request, or "not requested" when there is not one - never a status the
    // queue cannot account for.
    const byClass = new Map<string, BookletRequest>();
    for (const r of requests) if (r.classId) byClass.set(r.classId, r);
    for (const s of all) {
      if (s.booklet === null) continue; // online: nothing is printed
      const r = byClass.get(s.id);
      s.booklet = r ? bookletStatusFromRequest(r) : "not_requested";
    }
  }

  return all.sort((a, b) => (a.k === b.k ? a.className.localeCompare(b.className) : a.k < b.k ? -1 : 1));
}

/** What the office needs to see about a session's booklets, in one line. */
export function bookletLabel(s: AdminSession): { label: string; color: string; bg: string } {
  if (s.booklet === null) return { label: "Online - no printing", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" };
  const meta = BOOKLET_META[s.booklet];
  return { label: meta.label, color: meta.color, bg: meta.bg };
}

/** True when an in-person session still has no booklet request against it. */
export function needsRequest(s: AdminSession): boolean {
  return s.delivery === "in_person" && s.booklet === "not_requested";
}

export function monthKey(y: number, m: number, d: number): string {
  return y + "-" + pad(m + 1) + "-" + pad(d);
}

// ---------------------------------------------------------------------------
// Term-bounded runs
//
// A class repeats weekly and then STOPS, at the end of the term it belongs to.
// Both the setup form and the roll-over need the same list of dates out of a
// term, so it is worked out in one place rather than twice with a drift
// between them.
// ---------------------------------------------------------------------------

/** Weekday names as the office writes them, Monday first. */
export const DAY_NAMES = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];

/**
 * A Date as a YYYY-MM-DD day key, read from its local parts.
 *
 * Never use toISOString() for this. Dates here are built and walked forward in
 * local time, and toISOString() converts to UTC first, which rolls the day back
 * anywhere ahead of UTC - Perth included.
 */
export function dateKey(d: Date): string {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/** Every date a weekly class on `day` runs on, inside `term`. */
export function termDates(day: string, term: { start: string; weeks: number }): string[] {
  const d = new Date(term.start);
  if (Number.isNaN(d.getTime())) return [];
  const target = (DAY_NAMES.indexOf(day) + 1) % 7; // DAY_NAMES is Monday-first, getDay() is Sunday-first
  while (d.getDay() !== target) d.setDate(d.getDate() + 1);
  return Array.from({ length: term.weeks }, (_, i) => {
    const s = new Date(d);
    s.setDate(s.getDate() + i * 7);
    return dateKey(s);
  });
}

/** The weekday a "Wednesdays 4:00pm" style schedule string runs on. */
export function dayOfSched(sched: string): string {
  return DAY_NAMES.find((d) => sched.startsWith(d)) ?? DAY_NAMES[2];
}
