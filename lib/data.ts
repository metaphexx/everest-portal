// ============================================================
// Everest Student Portal - mock data + pure helpers
// Ported from the Claude Design prototype. In the live app these
// would come from lib/* + prisma; here they are static fixtures.
// ============================================================

import { getCourseVisual } from "./course-visuals";

export type CourseId = "chem" | "verbal" | "gate";

export interface ClassEvent {
  time: string;
  t24: string;
  title: string;
  tutor: string;
  color: string;
  bg: string;
}

export interface CourseDef {
  id: CourseId;
  name: string;
  tagline: string;
  tutor: string;
  tutorInit: string;
  tutorRole: string;
  sched: string;
  lessons: string;
  next: string;
  evTitle: string;
  gradePrefix: string;
  slotId: string;
  photo: string; // stock landscape shown until a class photo is dropped
  grad: string;
  icon: string;
}

export interface Worksheet {
  id: string;
  name: string;
  due: string;
  dot: string;
  course: CourseId;
}

export interface GradeRow {
  cls: string;
  wsName: string;
  file: string;
  at: string;
  grade: string;
  graded: boolean;
  fb: string;
}

export interface LibResource {
  date: string;
  name: string;
  meta: string;
  course: CourseId;
  color: string;
  icon: "play" | "doc";
}

// ---------- icon paths ----------
export const ICON = {
  flask: "M9 2v6.4L5 18a2 2 0 0 0 1.85 2.75h10.3A2 2 0 0 0 19 18l-4-9.6V2H9Z",
  text: "M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z",
  cap: "M12 3 1 9l11 6 9-4.91V17h2V9L12 3Z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z",
  play: "M8 5v14l11-7L8 5Z",
  grid: "M4 13h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1Zm0 8h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1Zm10 0h6a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1ZM13 4v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1Z",
  courses: "M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9Z",
  grade:
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-3.4 15.4-3.3-3.3 1.4-1.4 1.9 1.9 4.3-4.3 1.4 1.4-5.7 5.7ZM13 9V3.5L18.5 9H13Z",
  calendar:
    "M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V8h14v11Z",
  library:
    "M4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6Zm16-4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H8V4h12v12Z",
  chat: "M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z",
  drive: "M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z",
  support:
    "M12 2a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h3v-8H5v-2a7 7 0 0 1 14 0v2h-4v8h3a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9Z",
  settings:
    "M19.14 12.94a7.5 7.5 0 0 0 0-1.88l2-1.55-2-3.46-2.36.95a7.3 7.3 0 0 0-1.62-.94l-.36-2.51h-4l-.36 2.51c-.58.24-1.12.55-1.62.94l-2.36-.95-2 3.46 2 1.55a7.5 7.5 0 0 0 0 1.88l-2 1.55 2 3.46 2.36-.95c.5.39 1.04.7 1.62.94l.36 2.51h4l.36-2.51c.58-.24 1.12-.55 1.62-.94l2.36.95 2-3.46-2-1.55ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z",
  clipboard:
    "M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3Zm0 2H6v14h12V6h-3v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V6Zm1-2v2h4V4h-4Z",
  mail: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z",
};

// ---------- accent colours per category ----------
export const ACCENT: Record<CourseId, { color: string; bg: string }> = {
  chem: { color: "#7A5AF8", bg: "rgba(122,90,248,.13)" },
  verbal: { color: "#0E9C8E", bg: "rgba(18,181,165,.14)" },
  gate: { color: "#D68910", bg: "rgba(245,166,35,.16)" },
};

// ---------- courses ----------
export const COURSE_DEFS: Record<CourseId, CourseDef> = {
  chem: {
    id: "chem",
    name: "Chemistry",
    tagline: "Reaction mechanisms, organic pathways and lab technique.",
    tutor: "Priya Rao",
    tutorInit: "DR",
    tutorRole: "Chemistry tutor",
    sched: "Thursdays 7:00pm",
    lessons: "16 sessions this term",
    next: "Tonight, 7:00pm",
    evTitle: "Chemistry",
    gradePrefix: "Chemistry",
    slotId: "courseHeroChem",
    // Same photo + gradient as the tutor's Year 11 Chemistry (chem11) - it's
    // the one class both portals actually share, so the look must match.
    photo: "/courses/chem.jpg",
    grad: "linear-gradient(165deg,rgba(122,90,248,.45) 0%,rgba(64,44,158,.62) 45%,rgba(0,32,63,.94) 100%)",
    icon: ICON.flask,
  },
  verbal: {
    id: "verbal",
    name: "Verbal Reasoning",
    tagline: "Comprehension, analysis and written response each week.",
    tutor: "Grace Lin",
    tutorInit: "ML",
    tutorRole: "Verbal Reasoning tutor",
    sched: "Tuesdays 7:00pm",
    lessons: "12 sessions this term",
    next: "Tuesday 7 July, 7:00pm",
    evTitle: "Verbal Reasoning",
    gradePrefix: "Verbal",
    slotId: "courseHeroVerbal",
    photo: "/courses/verbal.jpg",
    grad: "linear-gradient(165deg,rgba(18,181,165,.42) 0%,rgba(11,110,99,.6) 45%,rgba(4,54,48,.94) 100%)",
    icon: ICON.text,
  },
  gate: {
    id: "gate",
    name: "GATE Exam Prep",
    tagline: "Exam strategy and timed practice for the GATE papers.",
    tutor: "David Chen",
    tutorInit: "MC",
    tutorRole: "GATE program tutor",
    sched: "Saturdays 10:00am",
    lessons: "10 workshops this term",
    next: "Saturday 11 July, 10:00am",
    evTitle: "GATE Workshop",
    gradePrefix: "GATE",
    slotId: "courseHeroGate",
    photo: "/courses/gate.jpg",
    grad: "linear-gradient(165deg,rgba(245,166,35,.45) 0%,rgba(178,108,14,.6) 45%,rgba(58,38,3,.94) 100%)",
    icon: ICON.cap,
  },
};

export const COURSE_ORDER: CourseId[] = ["chem", "verbal", "gate"];

// ---------- enrolment (drives the dashboard "My courses" section) ----------
// A lightweight, self-contained view of what the student is enrolled in, kept
// separate from the heavy CourseDef typing so the enrolment list can grow
// without cascading through grades/events/etc. Each entry is one card.

export interface EnrolledCourse {
  id: string;
  name: string;
  tagline: string;
  tutor: string;
  shortSched: string;
  icon: string;
  photo: string;
  grad: string;
  href: string; // where the card navigates
  slotId?: string; // reuse the drop-a-photo persistence for the core courses
}

/**
 * BACKEND OPTION - the courses this student is enrolled in. This is the single
 * lever the dashboard reads:
 *   - 0 enrolled   -> a "sign up to more courses" empty card (CTA unwired)
 *   - 1 to 3       -> a normal grid of cards
 *   - 4 or more    -> a horizontal carousel with left/right arrows
 * Wire this to a real enrolment API later; for now edit the array to change
 * how many courses appear. Defaulted to 5 so the carousel is demonstrable.
 */
export const ENROLLED_COURSES: EnrolledCourse[] = [
  { id: "chem", name: COURSE_DEFS.chem.name, tagline: COURSE_DEFS.chem.tagline, tutor: COURSE_DEFS.chem.tutor, shortSched: "Thu 7pm", icon: COURSE_DEFS.chem.icon, photo: COURSE_DEFS.chem.photo, grad: COURSE_DEFS.chem.grad, href: "/courses/chem", slotId: COURSE_DEFS.chem.slotId },
  { id: "verbal", name: COURSE_DEFS.verbal.name, tagline: COURSE_DEFS.verbal.tagline, tutor: COURSE_DEFS.verbal.tutor, shortSched: "Tue 7pm", icon: COURSE_DEFS.verbal.icon, photo: COURSE_DEFS.verbal.photo, grad: COURSE_DEFS.verbal.grad, href: "/courses/verbal", slotId: COURSE_DEFS.verbal.slotId },
  { id: "gate", name: COURSE_DEFS.gate.name, tagline: COURSE_DEFS.gate.tagline, tutor: COURSE_DEFS.gate.tutor, shortSched: "Sat 10am", icon: COURSE_DEFS.gate.icon, photo: COURSE_DEFS.gate.photo, grad: COURSE_DEFS.gate.grad, href: "/courses/gate", slotId: COURSE_DEFS.gate.slotId },
  // Extra enrolments (real ATAR subjects) - use pooled photos, link to the
  // catalogue since they have no dedicated demo page. Remove to drop below 4.
  { id: "physics", name: "Physics ATAR", tagline: "Motion, fields and the physics exam toolkit.", tutor: "Emeka Okafor", shortSched: "Mon 5pm", icon: ICON.grid, ...getCourseVisual("physics-atar"), href: "/courses" },
  { id: "methods", name: "Mathematics Methods", tagline: "Calculus, statistics and methods exam drills.", tutor: "Anjali Devi", shortSched: "Wed 6pm", icon: ICON.grade, ...getCourseVisual("methods-atar"), href: "/courses" },
];

export const TITLE_TO_CID: Record<string, CourseId> = {
  Chemistry: "chem",
  "Verbal Reasoning": "verbal",
  "GATE Workshop": "gate",
};

// ---------- calendar events ----------
// Chemistry session dates, shared with the tutor portal's chem11 schedule so
// join events stamped here line up with the sessions the tutor actually sees.
export const CHEM_SESSION_KEYS = ["2026-06-04", "2026-06-11", "2026-06-18", "2026-06-25", "2026-07-02", "2026-07-09", "2026-07-16", "2026-07-23", "2026-07-30"];

export function buildEvents(): Record<string, ClassEvent[]> {
  const ev: Record<string, ClassEvent[]> = {};
  const add = (k: string, e: ClassEvent) => {
    (ev[k] = ev[k] || []).push(e);
  };
  const chem: ClassEvent = { time: "7:00pm", t24: "19:00", title: "Chemistry", tutor: "Priya Rao", color: "#7A5AF8", bg: "rgba(122,90,248,.13)" };
  const verb: ClassEvent = { time: "7:00pm", t24: "19:00", title: "Verbal Reasoning", tutor: "Grace Lin", color: "#0E9C8E", bg: "rgba(18,181,165,.14)" };
  const gate: ClassEvent = { time: "10:00am", t24: "10:00", title: "GATE Workshop", tutor: "David Chen", color: "#D68910", bg: "rgba(245,166,35,.16)" };
  CHEM_SESSION_KEYS.forEach((k) => add(k, chem));
  ["2026-06-02", "2026-06-09", "2026-06-16", "2026-06-23", "2026-06-30", "2026-07-07", "2026-07-14", "2026-07-21", "2026-07-28"].forEach((k) => add(k, verb));
  ["2026-07-11", "2026-07-25"].forEach((k) => add(k, gate));
  return ev;
}

export const EVENTS = buildEvents();

export function dateKey(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// ---------- worksheets ----------
export function wsBase(): Worksheet[] {
  return [
    { id: "w1", name: "Whole Numbers Topic Test", due: "For the Sat 4 Jul class", dot: "#E04141", course: "gate" },
    { id: "w2", name: "Complete Study Guide", due: "For the Mon 6 Jul class", dot: "#F5A623", course: "chem" },
    { id: "w3", name: "Algebra Practice Set", due: "For the Thu 9 Jul class", dot: "#8A94A3", course: "gate" },
    { id: "w4", name: "Booklet Template 2025", due: "For the Sat 11 Jul class", dot: "#8A94A3", course: "chem" },
    { id: "w5", name: "Reading Comprehension 4", due: "For the Wed 15 Jul class", dot: "#8A94A3", course: "verbal" },
  ];
}

// ---------- grades ----------
export function gradeBase(): GradeRow[] {
  return [
    { cls: "GATE · Sat 27 Jun", wsName: "Quantitative Paper 2", file: "Maya_Quant2.pdf", at: "26 Jun, 4:44pm", grade: "Pending", graded: false, fb: "Awaiting feedback from David Chen." },
    { cls: "Chemistry · Thu 25 Jun", wsName: "Stoichiometry Set 5", file: "Maya_Stoich5.pdf", at: "24 Jun, 6:12pm", grade: "A", graded: true, fb: "Excellent working. Watch unit conversions in Q4." },
    { cls: "Verbal · Tue 23 Jun", wsName: "Passage Analysis 11", file: "Maya_Passage11.pdf", at: "23 Jun, 8:40am", grade: "B+", graded: true, fb: "Stronger thesis this week. Quote more precisely." },
    { cls: "Chemistry · Thu 18 Jun", wsName: "Organic Naming Quiz", file: "Maya_Naming.pdf", at: "17 Jun, 9:02pm", grade: "A-", graded: true, fb: "Nearly perfect. Revisit ester suffixes." },
    { cls: "Verbal · Tue 16 Jun", wsName: "Vocabulary Sprint", file: "Maya_Vocab.pdf", at: "15 Jun, 5:30pm", grade: "B", graded: true, fb: "Solid list. Aim for nuance over synonyms." },
    { cls: "GATE · Sat 13 Jun", wsName: "Abstract Reasoning 4", file: "Maya_AR4.pdf", at: "13 Jun, 7:55am", grade: "87%", graded: true, fb: "Great pace. Two careless slips in section C." },
    { cls: "Chemistry · Thu 11 Jun", wsName: "Moles and Mass Set", file: "Maya_Moles.pdf", at: "10 Jun, 7:18pm", grade: "A", graded: true, fb: "Beautiful setout. Keep showing units at each step." },
  ];
}

// ---------- library ----------
export function libAll(): LibResource[] {
  return [
    { date: "Tuesday 30 June", name: "Session recording, Verbal Reasoning", meta: "Video · 52 min", course: "verbal", color: "#0E9C8E", icon: "play" },
    { date: "Tuesday 30 June", name: "Passage annotation guide", meta: "PDF · 1.1 MB", course: "verbal", color: "#0E9C8E", icon: "doc" },
    { date: "Sunday 28 June", name: "Study Notes, Chapter 7", meta: "PDF · 2.4 MB", course: "chem", color: "#7A5AF8", icon: "doc" },
    { date: "Saturday 27 June", name: "Timed practice paper 3", meta: "PDF · 3.0 MB", course: "gate", color: "#D68910", icon: "doc" },
    { date: "Saturday 27 June", name: "Workshop recording, GATE", meta: "Video · 47 min", course: "gate", color: "#D68910", icon: "play" },
    { date: "Thursday 25 June", name: "Stoichiometry worked answers", meta: "PDF · 800 KB", course: "chem", color: "#7A5AF8", icon: "doc" },
    { date: "Thursday 25 June", name: "Session recording, Chemistry", meta: "Video · 55 min", course: "chem", color: "#7A5AF8", icon: "play" },
  ];
}

export const LIB_CATEGORIES = ["Study Materials", "Worksheets", "Booklets", "Class Recordings"];

export function matsFor(cid: CourseId, k: string, cat: string): string[] {
  const dl = new Date(k + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const nm = COURSE_DEFS[cid].name;
  if (cat === "Study Materials") return ["Session notes, " + dl + ".pdf", "Worked examples, " + dl + ".pdf"];
  if (cat === "Worksheets") return [nm + " worksheet, " + dl + ".pdf"];
  if (cat === "Booklets") return ["Term booklet extract, " + dl + ".pdf"];
  return ["Class recording, " + dl + " (54 min)"];
}

export function pastSessions(cid: CourseId, todayKey: string): { k: string; d: Date }[] {
  const out: { k: string; d: Date }[] = [];
  Object.keys(EVENTS)
    .sort()
    .reverse()
    .forEach((k) => {
      if (k < todayKey)
        (EVENTS[k] || []).forEach((e) => {
          if (e.title === COURSE_DEFS[cid].evTitle && out.length < 5) out.push({ k, d: new Date(k + "T12:00:00") });
        });
    });
  return out;
}

// ---------- chat ----------
export interface ChatMsg {
  who: "u" | "e";
  text: string;
}
export interface ChatThread {
  title: string;
  when: string;
  msgs: ChatMsg[];
}

export function chatSeeds(): Record<string, ChatThread> {
  return {
    c1: {
      title: "Balancing redox equations",
      when: "Yesterday",
      msgs: [
        { who: "u", text: "How do I balance redox equations in acidic solution?" },
        { who: "e", text: "Use the half-equation method: split into oxidation and reduction, balance atoms, then O with water, H with hydrogen ions, and charge with electrons. Multiply so the electrons cancel, then add the halves back together. Want to try one from your Set 5 worksheet?" },
      ],
    },
    c2: {
      title: "Comma splices in essays",
      when: "Monday",
      msgs: [
        { who: "u", text: "Grace Lin said I have comma splices. What are they?" },
        { who: "e", text: 'A comma splice joins two complete sentences with only a comma. Fix it with a full stop, a semicolon, or a conjunction. For example: "The tone shifts, the author turns hopeful" becomes "The tone shifts; the author turns hopeful."' },
      ],
    },
    c3: {
      title: "GATE timing strategy",
      when: "Last week",
      msgs: [
        { who: "u", text: "I keep running out of time on GATE quantitative papers." },
        { who: "e", text: "Try the two-pass method: first sweep answers everything you can do in under a minute, second pass tackles the rest. Your practice data shows you spend 4 minutes on early hard questions, which starves the easy marks at the end." },
      ],
    },
  };
}

export function elliotReply(text: string, dueCount: number): string {
  const t = text.toLowerCase();
  if (t.includes("progress")) return "Here is where you are at, Maya: 7 submissions this term with an 82% completion rate. Chemistry is your strongest subject, sitting at an A average, and your last three scores trend upward. The Whole Numbers Topic Test is due Saturday, so that is the one to tackle next.";
  if (t.includes("practice") || t.includes("recommend")) return "Based on your recent feedback I would focus on: 1) stoichiometry worked examples, since unit conversions cost you marks in Set 5, 2) two timed verbal passages, and 3) one GATE quantitative paper with the two-pass method. All three are in your library.";
  if (t.includes("explain") || t.includes("concept")) return "Happy to explain a concept. Which one is on your mind? Your next class covers reaction mechanisms, so nucleophiles and electrophiles would be a good warm-up if you want a head start.";
  if (t.includes("due") || t.includes("worksheet") || t.includes("submit")) return "You have " + dueCount + " worksheets to submit. The most urgent is the Whole Numbers Topic Test for Saturday's class. You can submit from the dashboard, or in My Drive under Submit your worksheets.";
  if (t.includes("next class") || t.includes("when is") || t.includes("timetable")) return "Your next class is Organic Chemistry tonight at 7:00pm with Priya Rao. The Join button on your dashboard goes live at class time, and your Timetable shows the whole month.";
  if (t.includes("recording") || t.includes("library") || t.includes("notes")) return "Recordings and notes live in the Library: pick your course on the left, choose a class date, then a category like Class Recordings. The 30 June Verbal session was added yesterday.";
  if (t.includes("grade") || t.includes("mark") || t.includes("feedback")) return "Your latest mark was an A on Stoichiometry Set 5, and Quantitative Paper 2 is still awaiting feedback from David Chen. The full history is in My Grades.";
  return "Thanks Maya, let me help with that. Could you attach the worksheet question or a photo of the problem? I can walk you through it step by step rather than just giving the answer.";
}

// ---------- drive ----------
export const TUTOR_FILES = [
  { name: "Extension problems, organic chemistry.pdf", from: "Priya Rao", when: "29 Jun", color: "#7A5AF8", bg: "rgba(122,90,248,.13)" },
  { name: "Annotated essay exemplar.pdf", from: "Grace Lin", when: "24 Jun", color: "#0E9C8E", bg: "rgba(18,181,165,.14)" },
  { name: "GATE formula sheet.pdf", from: "David Chen", when: "20 Jun", color: "#D68910", bg: "rgba(245,166,35,.16)" },
  { name: "Holiday revision plan.docx", from: "Priya Rao", when: "18 Jun", color: "#009DFF", bg: "rgba(0,157,255,.12)" },
];

export const BASE_SUBMISSIONS = [
  { name: "Maya_Quant2.pdf", kind: "Quantitative Paper 2", size: "1.2 MB", when: "26 Jun", color: "#D68910", bg: "rgba(245,166,35,.16)" },
  { name: "Maya_Stoich5.pdf", kind: "Stoichiometry Set 5", size: "980 KB", when: "24 Jun", color: "#7A5AF8", bg: "rgba(122,90,248,.13)" },
  { name: "Maya_Passage11.pdf", kind: "Passage Analysis 11", size: "760 KB", when: "23 Jun", color: "#0E9C8E", bg: "rgba(18,181,165,.14)" },
];

// ---------- global search ----------
export const SEARCH_ITEMS = [
  { name: "Chemistry", meta: "Course · Priya Rao", color: "#7A5AF8", page: "/" },
  { name: "Verbal Reasoning", meta: "Course · Grace Lin", color: "#0E9C8E", page: "/" },
  { name: "GATE Exam Prep", meta: "Course · David Chen", color: "#D68910", page: "/" },
  { name: "Whole Numbers Topic Test", meta: "Worksheet · due 4 Jul", color: "#E04141", page: "/" },
  { name: "Stoichiometry Set 5", meta: "My Grades · marked A", color: "#22A05B", page: "/grades" },
  { name: "Session recording, 30 Jun", meta: "Library · Verbal", color: "#0E9C8E", page: "/library" },
  { name: "Timed practice paper 3", meta: "Library · GATE", color: "#D68910", page: "/library" },
  { name: "Balancing redox equations", meta: "Chat with Elliot", color: "#009DFF", page: "/chat" },
  { name: "School report, Term 2.pdf", meta: "My Drive", color: "#D68910", page: "/drive" },
  { name: "Chemistry ATAR outline", meta: "Assessment Tracker", color: "#7A5AF8", page: "/outline" },
  { name: "Message Priya Rao", meta: "Message a Tutor · Chemistry", color: "#7A5AF8", page: "/messages" },
];

// ---------- constants ----------
export const STUDENT = {
  name: "Maya Kapoor",
  initials: "MK",
  year: "Year 11",
  email: "maya.k@example.com",
};

export const ASSIGNED_TOTAL = 22;
export const BASE_SUBMITTED = 17;
export const AVATAR_GRADIENT = "linear-gradient(135deg,#A5D8FF,#C4B5FD)";

export function iconForResource(icon: "play" | "doc"): string {
  return icon === "play" ? ICON.play : ICON.doc;
}
