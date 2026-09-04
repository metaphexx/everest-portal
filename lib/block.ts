// Multi-subject blocks: one room, three rosters.
//
// A block is ONE class - one room, one conferencing link, one recording - split
// into consecutive slots. Each slot owns a subject, a time window, a tutor and
// its own roster. A student enrolled in Maths and Science but not English is
// simply on two of the three rosters.
//
// The single most important rule: THE ROSTER LIVES ON THE SLOT, NEVER ON THE
// CLASS. The class roster is only ever the union of its slots. Get that
// backwards and you print thirteen English booklets for a class of six, and
// mark a Maths-only student absent from a subject they never took.

import { BLOCK8_SESSIONS, BlockSession, TUTOR_COURSES, TutorCourseId } from "./tutor-data";

/**
 * The Year 11 Wednesday block, as the STUDENT portal sees it. Maya takes
 * Chemistry and Verbal Reasoning but not Mathematics - the two-of-three case
 * this whole model exists for.
 */
export const BLOCK11_SESSIONS: BlockSession[] = [
  {
    id: "b11chem", subject: "Chemistry", start: "4:00pm", end: "5:00pm", t24: "16:00",
    tutor: "Priya Rao", color: "#7A5AF8", bg: "rgba(122,90,248,.13)", icon: "",
    students: [
      { name: "Maya Kapoor", init: "MK" }, { name: "Ethan Wu", init: "EW" },
      { name: "Zara Patel", init: "ZP" }, { name: "Oliver Reid", init: "OR" },
    ],
  },
  {
    id: "b11verb", subject: "Verbal Reasoning", start: "5:00pm", end: "6:00pm", t24: "17:00",
    tutor: "Grace Lin", color: "#0E9C8E", bg: "rgba(14,156,142,.13)", icon: "",
    students: [
      { name: "Maya Kapoor", init: "MK" }, { name: "Zara Patel", init: "ZP" },
      { name: "Ava Ng", init: "AN" },
    ],
  },
  {
    id: "b11math", subject: "Mathematics", start: "6:00pm", end: "7:00pm", t24: "18:00",
    tutor: "Tobi Okafor", color: "#D68910", bg: "rgba(214,137,16,.14)", icon: "",
    students: [
      { name: "Ethan Wu", init: "EW" }, { name: "Oliver Reid", init: "OR" },
      { name: "Ava Ng", init: "AN" },
    ],
  },
];

const BLOCKS: Record<string, BlockSession[]> = {
  block8: BLOCK8_SESSIONS,
  block11: BLOCK11_SESSIONS,
};

/** Slots for a block course, in running order. Empty for a single-subject course. */
const ENROL_KEY = "evr-block-enrolment";

function readEnrolPatches(): Record<string, string[]> {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(ENROL_KEY) : null;
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function writeEnrolPatches(next: Record<string, string[]>) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(ENROL_KEY, JSON.stringify(next));
  } catch {
    /* a full quota should not stop the ticks applying for this session */
  }
}

function initialsOf(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * An office edit to who is on ONE SLOT's roster, keyed by the slot id rather
 * than the subject name (which is not guaranteed unique across blocks).
 *
 * Applied inside slotsFor() itself, not by each caller, which is what makes it
 * visible everywhere a roster is read from one edit: the office's own
 * enrolment grid, a tutor's handover panel and Meet reconciliation, a
 * student's /block page. Patching only the office's copy would have left
 * tutors and students reading the old roster - the exact "two truths" bug
 * this file's own header warns against for the class-level roster.
 */
export function patchSlotRoster(slotId: string, studentNames: string[]) {
  writeEnrolPatches({ ...readEnrolPatches(), [slotId]: studentNames });
  // The office and the tutor/student portals are separate localStorage
  // origins in this demo, so this only reaches other tabs of the SAME
  // portal - same reach as the other evr-sync patches already in the app.
  if (typeof window !== "undefined") window.dispatchEvent(new Event("evr-sync"));
}

const ADDED_KEY = "evr-block-added";

function readAddedBlocks(): Record<string, BlockSession[]> {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(ADDED_KEY) : null;
    return raw ? (JSON.parse(raw) as Record<string, BlockSession[]>) : {};
  } catch {
    return {};
  }
}

const SLOT_COLOURS = [
  { color: "#7A5AF8", bg: "rgba(122,90,248,.13)" },
  { color: "#0E9C8E", bg: "rgba(14,156,142,.14)" },
  { color: "#D68910", bg: "rgba(245,166,35,.16)" },
  { color: "#0E7AC2", bg: "rgba(0,122,194,.12)" },
];

/**
 * Registers a block the office has just created, so every reader of slotsFor()
 * treats it exactly like a seeded one: isBlock() is true for it, the enrolment
 * grid has columns to tick, and the tutor's handover panel has slots to hand
 * over between. Without this a new block was a class with a block-shaped form
 * behind it and nothing on the other side.
 */
export function addBlock(courseId: string, slots: { subject: string; start: string; end: string; tutor: string }[], students: string[] = []) {
  const roster = students.map((name) => ({ name, init: initialsOf(name) }));
  const sessions: BlockSession[] = slots.map((s, i) => ({
    id: courseId + "-s" + i,
    subject: s.subject,
    start: s.start,
    end: s.end,
    t24: s.start,
    tutor: s.tutor,
    color: SLOT_COLOURS[i % SLOT_COLOURS.length].color,
    bg: SLOT_COLOURS[i % SLOT_COLOURS.length].bg,
    icon: "",
    // Everyone starts on every slot; the office then unticks what a student
    // does not take. Starting empty would mean a new block had no roster to
    // uncheck from, which is the harder way round to fill a grid in.
    students: roster,
  }));
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADDED_KEY, JSON.stringify({ ...readAddedBlocks(), [courseId]: sessions }));
      window.dispatchEvent(new Event("evr-sync"));
    }
  } catch {
    /* a full quota should not stop the class being created */
  }
}

export function slotsFor(courseId: string): BlockSession[] {
  const base = BLOCKS[courseId] ?? readAddedBlocks()[courseId] ?? [];
  if (base.length === 0) return base;
  const patches = readEnrolPatches();
  if (Object.keys(patches).length === 0) return base;
  // The pool a slot can draw from is the whole block's roster - enrolling
  // someone in a subject they were never near the block for is not a thing
  // this grid can do, so every patched name resolves against it.
  const pool = new Map<string, { name: string; init: string }>();
  for (const s of base) for (const st of s.students) if (!pool.has(st.name)) pool.set(st.name, st);
  return base.map((s) => {
    const patch = patches[s.id];
    if (!patch) return s;
    return { ...s, students: patch.map((name) => pool.get(name) ?? { name, init: initialsOf(name) }) };
  });
}

export function isBlock(courseId: string): boolean {
  return slotsFor(courseId).length > 0;
}

/** "4:00pm" -> 16.0, "5:30pm" -> 17.5. The demo stores display times. */
export function hourOf(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h + Number(m[2]) / 60;
}

/** The slot running at a given clock hour, or null between/outside slots. */
export function slotAt(courseId: string, hour: number): BlockSession | null {
  return slotsFor(courseId).find((s) => hour >= hourOf(s.start) && hour < hourOf(s.end)) ?? null;
}

/** Every subject a student is enrolled in, for this block. */
export function slotsForStudent(courseId: string, student: string): BlockSession[] {
  return slotsFor(courseId).filter((s) => s.students.some((x) => x.name === student));
}

/** The union roster - everyone who attends any part of the block. */
export function blockRoster(courseId: string): { name: string; init: string }[] {
  const seen = new Map<string, { name: string; init: string }>();
  for (const s of slotsFor(courseId)) for (const st of s.students) if (!seen.has(st.name)) seen.set(st.name, st);
  return [...seen.values()];
}

/**
 * What a student does across the block, as a single line they can read:
 * when to join, when to leave, and the gap if their subjects are not adjacent.
 */
export interface StudentPlan {
  slots: BlockSession[];
  joinAt: string;
  leaveAt: string;
  /** Slots in the middle of the block the student is NOT in - they leave and rejoin. */
  gaps: BlockSession[];
  contiguous: boolean;
}

export function planFor(courseId: string, student: string): StudentPlan | null {
  const mine = slotsForStudent(courseId, student);
  if (mine.length === 0) return null;
  const all = slotsFor(courseId);
  const firstIx = all.indexOf(mine[0]);
  const lastIx = all.indexOf(mine[mine.length - 1]);
  const gaps = all.slice(firstIx, lastIx + 1).filter((s) => !mine.includes(s));
  return {
    slots: mine,
    joinAt: mine[0].start,
    leaveAt: mine[mine.length - 1].end,
    gaps,
    contiguous: gaps.length === 0,
  };
}

// ---------------------------------------------------------------------------
// Handover
// ---------------------------------------------------------------------------

export interface Handover {
  /** The slot that just finished. Null at the very start of the block. */
  from: BlockSession | null;
  /** The slot starting now. Null after the last slot. */
  to: BlockSession | null;
  /** On the finishing roster but not the starting one - these people leave. */
  leaving: { name: string; init: string }[];
  /** On the starting roster but not the finishing one - these people arrive. */
  arriving: { name: string; init: string }[];
  /** On both - they stay put. */
  staying: { name: string; init: string }[];
}

export function handoverAt(courseId: string, boundaryHour: number): Handover | null {
  const all = slotsFor(courseId);
  if (all.length === 0) return null;
  const from = all.find((s) => hourOf(s.end) === boundaryHour) ?? null;
  const to = all.find((s) => hourOf(s.start) === boundaryHour) ?? null;
  if (!from && !to) return null;
  const fromNames = new Set((from?.students ?? []).map((s) => s.name));
  const toNames = new Set((to?.students ?? []).map((s) => s.name));
  return {
    from,
    to,
    leaving: (from?.students ?? []).filter((s) => !toNames.has(s.name)),
    arriving: (to?.students ?? []).filter((s) => !fromNames.has(s.name)),
    staying: (from?.students ?? []).filter((s) => toNames.has(s.name)),
  };
}

/**
 * Who is in the room but not on the current slot's roster.
 *
 * Usually innocent - a sibling waiting for a lift, a student who forgot their
 * subject had finished - which is exactly why this surfaces to the tutor as a
 * prompt rather than ejecting anyone automatically.
 */
export function lingerers(courseId: string, hour: number, inRoom: string[]): string[] {
  const slot = slotAt(courseId, hour);
  if (!slot) return [];
  const enrolled = new Set(slot.students.map((s) => s.name));
  return inRoom.filter((n) => !enrolled.has(n));
}

// ---------------------------------------------------------------------------
// Google Meet reconciliation (Workspace Business Plus)
// ---------------------------------------------------------------------------
//
// Business Plus gives per-participant join and leave times, but the attendance
// report is produced AFTER the conference ends - there is no live push. So Meet
// can never drive marking during the lesson; it reconciles afterwards.
//
// The flow this supports:
//   during  - the tutor marks, auto-suggested from who is currently in the room
//   after   - the Meet report arrives and any disagreement is surfaced, not
//             silently overwritten. A tutor who marked someone present had a
//             reason, and a student on a dropping connection can look absent.

export interface MeetRow {
  name: string;
  /** Decimal hours, e.g. 16.05 for 4:03pm. */
  joined: number;
  left: number;
}

export type DerivedStatus = "present" | "late" | "absent" | "partial";

/** How much of a slot a participant was actually present for, 0 to 1. */
export function coverage(row: MeetRow, slot: BlockSession): number {
  const s = hourOf(slot.start);
  const e = hourOf(slot.end);
  const overlap = Math.min(e, row.left) - Math.max(s, row.joined);
  return Math.max(0, overlap) / (e - s);
}

/** Late threshold in minutes, and the coverage below which a slot counts as partial. */
export const LATE_MINUTES = 5;
export const PARTIAL_BELOW = 0.8;

export function deriveStatus(rows: MeetRow[], slot: BlockSession, student: string): DerivedStatus {
  const mine = rows.filter((r) => r.name === student);
  if (mine.length === 0) return "absent";
  const cov = mine.reduce((n, r) => n + coverage(r, slot), 0);
  if (cov <= 0) return "absent";
  const firstJoin = Math.min(...mine.map((r) => r.joined));
  if (cov < PARTIAL_BELOW) return "partial";
  return firstJoin > hourOf(slot.start) + LATE_MINUTES / 60 ? "late" : "present";
}

export interface Discrepancy {
  student: string;
  marked: string;
  derived: DerivedStatus;
  minutesPresent: number;
}

/** Rows where the Meet report and the tutor disagree. Nothing is overwritten. */
export function reconcile(
  rows: MeetRow[],
  slot: BlockSession,
  marks: Record<string, string>
): Discrepancy[] {
  const out: Discrepancy[] = [];
  for (const st of slot.students) {
    const derived = deriveStatus(rows, slot, st.name);
    const marked = marks[st.name];
    if (!marked) continue;
    const agrees =
      marked === derived ||
      (marked === "present" && derived === "late") ||
      (marked === "excused" && derived === "absent");
    if (agrees) continue;
    const mins = rows
      .filter((r) => r.name === st.name)
      .reduce((n, r) => n + coverage(r, slot) * (hourOf(slot.end) - hourOf(slot.start)) * 60, 0);
    out.push({ student: st.name, marked, derived, minutesPresent: Math.round(mins) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Recordings
// ---------------------------------------------------------------------------
//
// Business Plus records the whole block as ONE file. A Maths-only student must
// not receive three hours containing two subjects they did not take and other
// children's voices, so the recording is published as per-slot chapters and
// each chapter is visible only to that slot's roster.

export interface RecordingChapter {
  slotId: string;
  subject: string;
  /** Seconds from the start of the recording. */
  startSec: number;
  endSec: number;
  label: string;
}

export function chaptersFor(courseId: string, blockStart: string): RecordingChapter[] {
  const start = hourOf(blockStart);
  return slotsFor(courseId).map((s) => ({
    slotId: s.id,
    subject: s.subject,
    startSec: Math.round((hourOf(s.start) - start) * 3600),
    endSec: Math.round((hourOf(s.end) - start) * 3600),
    label: s.subject + " · " + s.start + " to " + s.end,
  }));
}

/** Only the chapters a given student is entitled to. */
export function chaptersForStudent(courseId: string, blockStart: string, student: string): RecordingChapter[] {
  const mine = new Set(slotsForStudent(courseId, student).map((s) => s.id));
  return chaptersFor(courseId, blockStart).filter((c) => mine.has(c.slotId));
}

export function hhmm(sec: number): string {
  const m = Math.floor(sec / 60);
  return String(Math.floor(m / 60)) + ":" + String(m % 60).padStart(2, "0") + ":00";
}

export { TUTOR_COURSES };
export type { BlockSession, TutorCourseId };

/**
 * A Meet attendance report for last week's block, as the Workspace export
 * gives it: one row per participant session, with join and leave times.
 * Deliberately messy - Cooper drops and rejoins, Hugo leaves Science early,
 * and Daisy sits through English without being enrolled in it.
 */
export function seedMeetRows(): MeetRow[] {
  // A plausible Meet report for one Wednesday: most rows match the roster, and
  // three do not. Those three are the whole point - they are the cases a tutor
  // has to look at, and the reasons a report cannot be trusted blindly.
  return [
    { name: "Aiden Clark", joined: 16.0, left: 18.0 },
    { name: "Bella Nguyen", joined: 15.98, left: 19.0 },
    // Cooper drops out and rejoins: two rows for one student, and neither row
    // on its own looks like a full slot.
    { name: "Cooper Hall", joined: 16.2, left: 16.55 },
    { name: "Cooper Hall", joined: 16.62, left: 19.0 },
    // Daisy is enrolled to 6:00pm but is still in the room at 7:00pm.
    { name: "Daisy Kim", joined: 16.0, left: 19.0 },
    { name: "Felix Osei", joined: 16.0, left: 18.0 },
    { name: "Georgia Lane", joined: 16.0, left: 19.0 },
    // Hugo takes Mathematics only, and leaves 20 minutes into it.
    { name: "Hugo Silva", joined: 16.05, left: 16.4 },
    { name: "Ivy Zhang", joined: 16.0, left: 19.0 },
    { name: "Jonah Reeves", joined: 17.0, left: 19.0 },
    { name: "Keira Boyd", joined: 18.0, left: 19.0 },
    { name: "Liam Foster", joined: 18.1, left: 19.0 },
  ];
}
