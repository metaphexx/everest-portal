// The office (admin) portal's own data.
//
// Everything the tutor and student portals do ends somewhere in the office: a
// print request needs approving, a file needs to be visible, a safeguarding
// flag needs a person. This file describes that side of the business, and it
// derives from lib/tutor-data.ts wherever the two must agree - a class shown
// here and the same class shown to its tutor are the same record, not two
// seeds that will drift apart.

import { ICON } from "@/components/portal/nav-icons";
import {
  CENTRES,
  DeliveryMode,
  TUTOR,
  TUTOR_COURSES,
  TUTOR_COURSE_ORDER,
  TutorCourseId,
} from "./tutor-data";

export const ADMIN = {
  name: "Nadia Rahman",
  short: "Nadia",
  initials: "NR",
  role: "Everest Office",
  email: "office@everesttutoring.com.au",
  phone: "0421 118 460",
  centre: "Head office (Willetton)",
};

/** Teal, so the three portals are never mistaken for one another at a glance. */
export const ADMIN_ACCENT = "var(--accent-teal)";

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export interface StaffMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  /** Duties the office has granted, mirroring the tutor portal's WorkingMode. */
  duties: "both" | "in_person" | "online";
  centres: string[];
  colour: string;
  /** Ids of TUTOR_COURSES this person teaches, where they are Priya. */
  courseIds?: TutorCourseId[];
  /** Classes taught by other staff, described here because only the office sees them. */
  extraClasses?: { name: string; year: string; centre: string; delivery: DeliveryMode; sched: string; students: number }[];
  status: "active" | "on_leave";
}

export const STAFF: StaffMember[] = [
  {
    id: "priya",
    name: TUTOR.name,
    initials: TUTOR.initials,
    role: TUTOR.role,
    email: TUTOR.email,
    phone: TUTOR.phone,
    duties: "both",
    centres: ["Harrisdale SHS", "Piara Waters", "Online"],
    colour: "#7A5AF8",
    courseIds: [...TUTOR_COURSE_ORDER],
    status: "active",
  },
  {
    id: "lin",
    name: "Grace Lin",
    initials: "GL",
    role: "Everest Tutor",
    email: "g.lin@everesttutoring.com.au",
    phone: "0413 552 018",
    duties: "online",
    centres: ["Online"],
    colour: "#009DFF",
    extraClasses: [
      { name: "Year 11 Verbal Reasoning", year: "Year 11", centre: "Online", delivery: "online", sched: "Tuesdays 7:00pm", students: 12 },
      { name: "Year 10 English", year: "Year 10", centre: "Online", delivery: "online", sched: "Sundays 4:00pm", students: 8 },
    ],
    status: "active",
  },
  {
    id: "chen",
    name: "David Chen",
    initials: "DC",
    role: "Everest Tutor",
    email: "d.chen@everesttutoring.com.au",
    phone: "0400 918 774",
    duties: "both",
    centres: ["Piara Waters", "Online"],
    colour: "#D68910",
    extraClasses: [
      { name: "GATE Workshop", year: "Year 6", centre: "Online", delivery: "online", sched: "Saturdays 10:00am", students: 16 },
      { name: "Year 7 GATE Preparation", year: "Year 7", centre: "Piara Waters", delivery: "in_person", sched: "Saturdays 1:00pm", students: 14 },
    ],
    status: "active",
  },
  {
    id: "okafor",
    name: "Tobi Okafor",
    initials: "TO",
    role: "Everest Tutor",
    email: "t.okafor@everesttutoring.com.au",
    phone: "0432 087 116",
    duties: "in_person",
    centres: ["Harrisdale SHS"],
    colour: "#0E9C8E",
    extraClasses: [
      { name: "Year 10 Mathematics", year: "Year 10", centre: "Harrisdale SHS", delivery: "in_person", sched: "Wednesdays 4:30pm", students: 11 },
      { name: "Year 8 Mathematics", year: "Year 8", centre: "Harrisdale SHS", delivery: "in_person", sched: "Thursdays 4:30pm", students: 13 },
    ],
    status: "active",
  },
  {
    id: "hassan",
    name: "Amira Hassan",
    initials: "AH",
    role: "Everest Tutor",
    email: "a.hassan@everesttutoring.com.au",
    phone: "0448 330 927",
    duties: "in_person",
    centres: ["Piara Waters"],
    colour: "#E04141",
    extraClasses: [{ name: "Year 9 Mathematics", year: "Year 9", centre: "Piara Waters", delivery: "in_person", sched: "Mondays 5:00pm", students: 9 }],
    status: "on_leave",
  },
];

export interface AdminClass {
  id: string;
  name: string;
  year: string;
  centre: string;
  delivery: DeliveryMode;
  sched: string;
  tutorId: string;
  tutorName: string;
  colour: string;
  students: number;
  /** Seats the room or the online cap allows. Capacity is an office concept. */
  capacity: number;
}

/**
 * Every class Everest runs, from both sources: Priya's are the real records the
 * tutor portal renders, so the office and the tutor can never disagree about
 * them; everyone else's come from STAFF.extraClasses.
 */
export function allClasses(): AdminClass[] {
  const out: AdminClass[] = [];
  for (const s of STAFF) {
    for (const cid of s.courseIds ?? []) {
      const c = TUTOR_COURSES[cid];
      out.push({
        id: cid,
        name: c.name,
        year: c.year,
        centre: c.centre,
        delivery: c.delivery,
        sched: c.sched,
        tutorId: s.id,
        tutorName: s.name,
        colour: c.color,
        students: c.students.length,
        capacity: c.delivery === "online" ? 12 : 16,
      });
    }
    (s.extraClasses ?? []).forEach((e, i) => {
      out.push({
        id: s.id + "-x" + i,
        name: e.name,
        year: e.year,
        centre: e.centre,
        delivery: e.delivery,
        sched: e.sched,
        tutorId: s.id,
        tutorName: s.name,
        colour: s.colour,
        students: e.students,
        capacity: e.delivery === "online" ? 12 : 16,
      });
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export interface AdminStudent {
  name: string;
  initials: string;
  year: string;
  classNames: string[];
  centre: string;
  delivery: DeliveryMode;
  parent: string;
  parentPhone: string;
  /** Percentage of sessions attended this term. */
  attendance: number;
  /** Enrolment state. Withdrawn students stay visible to the office. */
  status: "active" | "trial" | "withdrawn";
}

const PARENTS: Record<string, { parent: string; phone: string }> = {
  "Maya Kapoor": { parent: "Anita Kapoor", phone: "0412 664 209" },
  "Ethan Wu": { parent: "Helen Wu", phone: "0433 771 508" },
  "Zara Patel": { parent: "Rakesh Patel", phone: "0421 903 117" },
  "Ruby Chen": { parent: "Wei Chen", phone: "0404 118 662" },
  "Dev Sharma": { parent: "Meera Sharma", phone: "0417 220 934" },
  "Bella Nguyen": { parent: "Linh Nguyen", phone: "0438 551 027" },
  "Cooper Hall": { parent: "Jane Hall", phone: "0429 664 810" },
};

/** Deterministic djb2 hash, so demo data never reshuffles between renders. */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

const PARENT_FIRST = ["Anita", "Raj", "Helen", "Michael", "Priya", "Daniel", "Sara", "James", "Mei", "Omar", "Laura", "Vikram"];

/**
 * A parent for students without a hand-written one. Every row in the office's
 * roster carries a real-looking contact - a column repeating "on file with the
 * office" twenty-six times reads as broken data, not as privacy.
 */
function parentFor(name: string): { parent: string; phone: string } {
  const known = PARENTS[name];
  if (known) return { parent: known.parent, phone: known.phone };
  const h = hash(name);
  const surname = name.split(" ").slice(1).join(" ") || name;
  const digits = String(h % 100000000).padStart(8, "0");
  return { parent: PARENT_FIRST[h % PARENT_FIRST.length] + " " + surname, phone: "04" + digits.slice(0, 2) + " " + digits.slice(2, 5) + " " + digits.slice(5, 8) };
}

/** Roster of every enrolled student, built from the class records. */
export function allStudents(): AdminStudent[] {
  const byName = new Map<string, AdminStudent>();
  for (const cid of TUTOR_COURSE_ORDER) {
    const c = TUTOR_COURSES[cid];
    for (const st of c.students) {
      const existing = byName.get(st.name);
      if (existing) {
        existing.classNames.push(c.name);
        continue;
      }
      const p = parentFor(st.name);
      byName.set(st.name, {
        name: st.name,
        initials: st.init,
        year: c.year,
        classNames: [c.name],
        centre: c.centre,
        delivery: c.delivery,
        parent: p.parent,
        parentPhone: p.phone,
        // Deterministic so the roster does not reshuffle between renders.
        attendance: 100 - (hash(st.name) % 24),
        status: st.name === "Cooper Hall" ? "trial" : "active",
      });
    }
  }
  return [...byName.values()];
}

// ---------------------------------------------------------------------------
// Oversight
// ---------------------------------------------------------------------------

/**
 * The office sees every file shared on the platform. This is the seed of that
 * ledger; live assignments from the tutor blob are folded in on top by
 * lib/admin-store.tsx, so the page shows what has actually happened today as
 * well as what happened before the demo started.
 */
export interface SharedFileRow {
  id: string;
  file: string;
  from: string;
  to: string;
  context: string;
  when: string;
  kind: "assigned" | "message" | "classroom" | "drive";
  /**
   * Where the file came from. "everest" is a folder the office provided and
   * vetted; "tutor" is something the tutor made or uploaded to their own My
   * Drive. The office has no other way to tell those apart, and only one of
   * them has been through anybody's hands but the tutor's.
   */
  source: "everest" | "tutor";
}

export const SHARED_FILES: SharedFileRow[] = [
  { id: "sf1", file: "Organic pathways booklet.pdf", from: "Priya Rao", to: "Year 11 Chemistry (whole class)", context: "Assigned material", when: "25 Jun, 6:40pm", kind: "assigned", source: "everest" },
  { id: "sf2", file: "Question 6a worked solution.pdf", from: "Priya Rao", to: "Year 11 Chemistry classroom", context: "Classroom post", when: "Today, 9:40am", kind: "classroom", source: "tutor" },
  { id: "sf3", file: "GATE_timed_paper_4.pdf", from: "David Chen", to: "Maya Kapoor", context: "Direct message", when: "1 Jul, 6:20pm", kind: "message", source: "everest" },
  { id: "sf4", file: "Annotated essay exemplar.pdf", from: "Grace Lin", to: "Maya Kapoor", context: "Direct message", when: "24 Jun, 5:05pm", kind: "message", source: "tutor" },
  { id: "sf5", file: "Forces and motion problem set.pdf", from: "Priya Rao", to: "Cooper Hall", context: "Assigned material", when: "17 Jun, 4:12pm", kind: "assigned", source: "everest" },
  { id: "sf6", file: "Holiday revision plan.docx", from: "Priya Rao", to: "Maya Kapoor", context: "Direct message", when: "18 Jun, 8:02pm", kind: "message", source: "tutor" },
  // From a tutor's OWN My Drive: made by them, seen by nobody at the office
  // until it turns up here.
  { id: "sf7", file: "Trial exam - my own questions.pdf", from: "Priya Rao", to: "Year 11 Chemistry (whole class)", context: "From their My Drive", when: "Today, 7:12am", kind: "drive", source: "tutor" },
  { id: "sf8", file: "Equilibrium cheat sheet (draft).docx", from: "Tobi Okafor", to: "Year 10 Mathematics (whole class)", context: "From their My Drive", when: "Yesterday, 8:55pm", kind: "drive", source: "tutor" },
  { id: "sf9", file: "Past paper solutions 2024.pdf", from: "Grace Lin", to: "Zara Patel", context: "From their My Drive", when: "30 Jun, 4:30pm", kind: "drive", source: "tutor" },
];

/** Messages the safeguarding classifier flagged, newest first. */
export interface SafeguardingFlag {
  id: string;
  student: string;
  tutor: string;
  reason: string;
  excerpt: string;
  when: string;
  status: "open" | "actioned";
}

export const SAFEGUARDING: SafeguardingFlag[] = [
  {
    id: "sg1",
    student: "Ruby Chen",
    tutor: "Priya Rao",
    reason: "Wellbeing concern",
    excerpt: "I can't cope with everything this term and I don't really feel safe talking to anyone at school about it.",
    when: "Today, 7:48am",
    status: "open",
  },
  {
    id: "sg2",
    student: "Dev Sharma",
    tutor: "Priya Rao",
    reason: "Contact details withheld",
    excerpt: "A phone number was removed from this message automatically before delivery.",
    when: "27 Jun, 4:31pm",
    status: "actioned",
  },
];

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

export const ADMIN_NAV = {
  dashboard: ICON.grid,
  approvals: ICON.clipboard,
  print: ICON.doc,
  classes: ICON.courses,
  tutors: ICON.text,
  students: ICON.grade,
  files: ICON.drive,
  safeguarding: ICON.mail,
  catalogue: ICON.library,
  settings: ICON.settings,
};

export { CENTRES };
