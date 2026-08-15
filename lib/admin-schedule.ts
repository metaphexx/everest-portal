// Every dated class session the office can see, and the colour system that
// tells you which centre it belongs to at a glance.
//
// Priya's sessions come from buildTutorClasses() - the same records her portal
// renders, complete with the booklet status that drives "has this been
// requested yet". Everyone else's are generated from their weekly slot, because
// only the office has a reason to know about them.

import {
  BookletStatus,
  BOOKLET_META,
  DeliveryMode,
  TUTOR_COURSES,
  TutorClass,
  buildTutorClasses,
} from "./tutor-data";
import { STAFF } from "./admin-data";

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

/** Priya's four courses, from the real records, plus every other tutor's slots. */
export function allSessions(extra: AdminSession[] = []): AdminSession[] {
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

  return [...out, ...extra].sort((a, b) => (a.k === b.k ? a.className.localeCompare(b.className) : a.k < b.k ? -1 : 1));
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
