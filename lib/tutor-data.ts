// ============================================================
// Everest Tutor Portal - mock data + pure helpers
// Mirrors lib/data.ts (student side). In the live app these come
// from the platform API; here they are deterministic fixtures.
// Persona: Priya Rao - Maya Kapoor's chemistry tutor, so the
// two portals tell one coherent story.
// ============================================================

import { dateKey, ICON } from "./data";
import { Assessment, WeekTopic, scanOutline } from "./features";

export const TUTOR = {
  name: "Priya Rao",
  short: "Priya",
  initials: "PR",
  role: "Everest Tutor",
  email: "p.rao@everesttutoring.com.au",
  phone: "0412 774 903",
  // The duties this tutor is actually assigned by the office. Priya Rao does
  // both, so she gets the in-person/online toggle. A single-duty tutor
  // (grants "in_person" or "online") has nothing to toggle, so the control
  // is hidden and the portal is locked to that one mode.
  grants: "both" as WorkingMode,
};

// ---------- working modes ----------
// Tutors are assigned one or both duties: requesting printed booklets for
// in-person centre classes, and/or running online classes (with everything
// that brings: marking, messaging, outlines, classrooms). The portal
// reshapes itself around whichever modes the tutor actually has.

export type WorkingMode = "both" | "in_person" | "online";

export type DeliveryMode = "in_person" | "online";

export const DELIVERY_META: Record<DeliveryMode, { label: string; short: string; color: string; bg: string }> = {
  in_person: { label: "In person", short: "Centre", color: "#0E8C86", bg: "rgba(18,181,165,.14)" },
  online: { label: "Online", short: "Online", color: "#007ECC", bg: "rgba(0,157,255,.12)" },
};

// ---------- booklet status (per class + per request printing) ----------

export type BookletStatus =
  | "not_requested"
  | "requested"
  | "approved"
  | "print_completed"
  | "rejected"
  | "print_failed";

export const BOOKLET_META: Record<BookletStatus, { label: string; color: string; bg: string }> = {
  not_requested: { label: "Not requested", color: "#66707F", bg: "rgba(0,32,63,.06)" },
  requested: { label: "Requested", color: "#6B4EE6", bg: "rgba(122,90,248,.13)" },
  approved: { label: "Approved", color: "#B27908", bg: "rgba(245,166,35,.16)" },
  print_completed: { label: "Printed", color: "#1B8049", bg: "rgba(34,160,91,.12)" },
  rejected: { label: "Rejected", color: "#E04141", bg: "rgba(224,65,65,.12)" },
  print_failed: { label: "Print failed", color: "#E04141", bg: "rgba(224,65,65,.12)" },
};

/**
 * Map a live booklet request's approval + printing status onto the per-class
 * booklet pill status, so the class chip (e.g. the dashboard hero "Rejected
 * booklets") reflects the actual request record end to end - not a static seed.
 * Printing outcomes win over approval; a request with no decision yet reads as
 * "requested". Returns null when the request carries no usable state.
 */
export function bookletStatusFromRequest(req: BookletRequest): BookletStatus {
  if (req.printing === "completed") return "print_completed";
  if (req.printing === "failed") return "print_failed";
  if (req.approval === "rejected") return "rejected";
  if (req.approval === "approved") return "approved";
  return "requested";
}

// ---------- the tutor's classes ----------

export type TutorCourseId = "chem11" | "sci9" | "found10" | "block8";

export interface TutorCourseDef {
  id: TutorCourseId;
  name: string;
  year: string;
  centre: string; // physical centre, or "Online"
  delivery: DeliveryMode;
  sched: string;
  time: string;
  t24: string;
  color: string;
  bg: string;
  grad: string;
  icon: string;
  tagline: string;
  photo: string; // stock landscape banner
  students: { name: string; init: string }[];
  isBlock?: boolean; // multi-subject back-to-back block (see BLOCK8)
  durationMins: number; // whole-session length shown on the Schedule (online only - in-person duration isn't modelled yet)
}

export const TUTOR_COURSES: Record<TutorCourseId, TutorCourseDef> = {
  chem11: {
    id: "chem11",
    photo: "/courses/chem.jpg",
    grad: "linear-gradient(165deg,rgba(122,90,248,.55) 0%,rgba(64,44,158,.72) 45%,rgba(0,32,63,.94) 100%)",
    name: "Year 11 Chemistry",
    year: "Year 11",
    centre: "Online",
    delivery: "online",
    sched: "Thursdays 7:00pm",
    time: "7:00pm",
    t24: "19:00",
    durationMins: 60,
    color: "#7A5AF8",
    bg: "rgba(122,90,248,.13)",
    icon: ICON.flask,
    tagline: "Reaction mechanisms, organic pathways and lab technique.",
    students: [
      { name: "Maya Kapoor", init: "MK" },
      { name: "Ethan Wu", init: "EW" },
      { name: "Zara Patel", init: "ZP" },
      { name: "Oliver Reid", init: "OR" },
      { name: "Ava Ng", init: "AN" },
      { name: "Lucas Marsh", init: "LM" },
      { name: "Priya Nair", init: "PN" },
      { name: "Tom Whitfield", init: "TW" },
      { name: "Isla Brennan", init: "IB" },
    ],
  },
  sci9: {
    id: "sci9",
    photo: "/courses/sci9.jpg",
    grad: "linear-gradient(165deg,rgba(14,140,128,.58) 0%,rgba(9,88,79,.76) 45%,rgba(4,54,48,.96) 100%)",
    name: "Year 9 Science",
    year: "Year 9",
    centre: "Harrisdale SHS",
    delivery: "in_person",
    sched: "Tuesdays 5:00pm to 8:00pm",
    time: "5:00pm",
    t24: "17:00",
    durationMins: 180,
    color: "#0E9C8E",
    bg: "rgba(18,181,165,.14)",
    icon: ICON.cap,
    tagline: "Core science foundations with weekly practicals.",
    students: [
      { name: "Ruby Chen", init: "RC" },
      { name: "Noah Fields", init: "NF" },
      { name: "Amara Okafor", init: "AO" },
      { name: "Jack Simmons", init: "JS" },
      { name: "Lily Tran", init: "LT" },
      { name: "Henry Walsh", init: "HW" },
      { name: "Sofia Marino", init: "SM" },
    ],
  },
  found10: {
    id: "found10",
    photo: "/courses/found10.jpg",
    grad: "linear-gradient(165deg,rgba(178,108,14,.62) 0%,rgba(140,84,10,.78) 45%,rgba(58,38,3,.96) 100%)",
    name: "Year 10 Chemistry Foundations",
    year: "Year 10",
    centre: "Piara Waters",
    delivery: "in_person",
    sched: "Saturdays 9:00am to 12:00pm",
    time: "9:00am",
    t24: "09:00",
    durationMins: 180,
    color: "#D68910",
    bg: "rgba(245,166,35,.16)",
    icon: ICON.doc,
    tagline: "Bridging course into ATAR chemistry for next year.",
    students: [
      { name: "Dev Sharma", init: "DS" },
      { name: "Grace Holt", init: "GH" },
      { name: "Leo Vasquez", init: "LV" },
      { name: "Mia Thompson", init: "MT" },
      { name: "Kai Nguyen", init: "KN" },
      { name: "Ella Doyle", init: "ED" },
    ],
  },
  block8: {
    id: "block8",
    photo: "/courses/block8.jpg",
    grad: "linear-gradient(165deg,rgba(0,157,255,.5) 0%,rgba(0,85,140,.72) 45%,rgba(0,32,63,.94) 100%)",
    name: "Year 8 Core Block",
    year: "Year 8",
    centre: "Online",
    delivery: "online",
    sched: "Wednesdays 4:00pm to 7:00pm",
    time: "4:00pm",
    t24: "16:00",
    durationMins: 180,
    color: "#0E7AC2",
    bg: "rgba(0,122,194,.12)",
    icon: ICON.courses,
    tagline: "Maths, Science and English back to back. One room, three rosters.",
    isBlock: true,
    students: [
      { name: "Aiden Clark", init: "AC" },
      { name: "Bella Nguyen", init: "BN" },
      { name: "Cooper Hall", init: "CH" },
      { name: "Daisy Kim", init: "DK" },
      { name: "Felix Osei", init: "FO" },
      { name: "Georgia Lane", init: "GL" },
      { name: "Hugo Silva", init: "HS" },
      { name: "Ivy Zhang", init: "IZ" },
      { name: "Jonah Reeves", init: "JR" },
      { name: "Keira Boyd", init: "KB" },
      { name: "Liam Foster", init: "LF" },
    ],
  },
};

// ---------- Year 8 core block (multi-subject back-to-back) ----------
// One 3-hour online room, three subject sessions with their own rosters.
// Students join only during the sessions they are enrolled in; one link,
// per-session gating. A session only gets its own link if it runs in a
// different room (parallel tutors) - not the case for this block.

export interface BlockSession {
  id: string; // classroom + attendance key
  subject: string;
  start: string;
  end: string;
  t24: string;
  tutor: string;
  color: string;
  bg: string;
  icon: string;
  students: { name: string; init: string }[];
}

const B8_MATHS = [
  { name: "Aiden Clark", init: "AC" },
  { name: "Bella Nguyen", init: "BN" },
  { name: "Cooper Hall", init: "CH" },
  { name: "Daisy Kim", init: "DK" },
  { name: "Felix Osei", init: "FO" },
  { name: "Georgia Lane", init: "GL" },
  { name: "Hugo Silva", init: "HS" },
  { name: "Ivy Zhang", init: "IZ" },
];
const B8_SCIENCE = [
  { name: "Aiden Clark", init: "AC" },
  { name: "Bella Nguyen", init: "BN" },
  { name: "Daisy Kim", init: "DK" },
  { name: "Felix Osei", init: "FO" },
  { name: "Ivy Zhang", init: "IZ" },
  { name: "Jonah Reeves", init: "JR" },
];
const B8_ENGLISH = [
  { name: "Bella Nguyen", init: "BN" },
  { name: "Cooper Hall", init: "CH" },
  { name: "Georgia Lane", init: "GL" },
  { name: "Ivy Zhang", init: "IZ" },
  { name: "Jonah Reeves", init: "JR" },
  { name: "Keira Boyd", init: "KB" },
  { name: "Liam Foster", init: "LF" },
];

export const BLOCK8_SESSIONS: BlockSession[] = [
  { id: "b8math", subject: "Mathematics", start: "4:00pm", end: "5:00pm", t24: "16:00", tutor: "Priya Rao", color: "#7A5AF8", bg: "rgba(122,90,248,.13)", icon: ICON.grade, students: B8_MATHS },
  { id: "b8sci", subject: "Science", start: "5:00pm", end: "6:00pm", t24: "17:00", tutor: "Priya Rao", color: "#0E9C8E", bg: "rgba(18,181,165,.14)", icon: ICON.flask, students: B8_SCIENCE },
  { id: "b8eng", subject: "English", start: "6:00pm", end: "7:00pm", t24: "18:00", tutor: "Sam Whitlam", color: "#D68910", bg: "rgba(245,166,35,.16)", icon: ICON.text, students: B8_ENGLISH },
];

/** Union roster for the whole block (each student counted once). */
export function blockRoster(): { name: string; init: string }[] {
  const seen = new Map<string, { name: string; init: string }>();
  BLOCK8_SESSIONS.forEach((s) => s.students.forEach((st) => seen.set(st.name, st)));
  return Array.from(seen.values());
}

export const TUTOR_COURSE_ORDER: TutorCourseId[] = ["chem11", "block8", "sci9", "found10"];

export interface TutorClass {
  id: string;
  k: string; // date key yyyy-mm-dd
  course: TutorCourseId;
  session: number;
  booklet: BookletStatus;
}

// Term 2 into Term 3 schedule. "Today" in the demo is Thu 2 Jul 2026.
const CHEM_DATES = ["2026-06-04", "2026-06-11", "2026-06-18", "2026-06-25", "2026-07-02", "2026-07-09", "2026-07-16", "2026-07-23", "2026-07-30"];
const SCI_DATES = ["2026-06-02", "2026-06-09", "2026-06-16", "2026-06-23", "2026-06-30", "2026-07-07", "2026-07-14", "2026-07-21", "2026-07-28"];
const FOUND_DATES = ["2026-06-20", "2026-07-04", "2026-07-18"];
const BLOCK_DATES = ["2026-06-03", "2026-06-10", "2026-06-17", "2026-06-24", "2026-07-01", "2026-07-08", "2026-07-15", "2026-07-22", "2026-07-29"];

const SEED_BOOKLET: Record<string, BookletStatus> = {
  // upcoming fortnight tells the whole status story
  "chem11:2026-07-02": "approved",
  "chem11:2026-07-09": "not_requested",
  "chem11:2026-07-16": "not_requested",
  "sci9:2026-07-07": "requested",
  "sci9:2026-07-14": "not_requested",
  "found10:2026-07-04": "rejected",
  "found10:2026-07-18": "not_requested",
};

export function buildTutorClasses(): TutorClass[] {
  const out: TutorClass[] = [];
  const push = (course: TutorCourseId, dates: string[]) =>
    dates.forEach((k, i) => {
      const key = course + ":" + k;
      const past = k < "2026-07-02";
      out.push({
        id: key,
        k,
        course,
        session: i + 1,
        booklet: SEED_BOOKLET[key] ?? (past ? "print_completed" : "not_requested"),
      });
    });
  push("chem11", CHEM_DATES);
  push("sci9", SCI_DATES);
  push("found10", FOUND_DATES);
  push("block8", BLOCK_DATES);
  return out.sort((a, b) => (a.k < b.k ? -1 : 1));
}

export function classLabel(c: TutorClass): string {
  const cd = TUTOR_COURSES[c.course];
  const d = new Date(c.k + "T12:00:00");
  return cd.name + " · " + d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export { dateKey };

// ---------- study material catalogue (booklet shop) ----------

export const CENTRES = ["Harrisdale SHS", "Piara Waters"];
export const YEAR_GROUPS = ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"];
export const CAT_SUBJECTS = ["Chemistry", "Science", "Mathematics", "English"];

/** The catalogue subject a course maps to, read from its name (e.g. "Year 11
 *  Chemistry" -> "Chemistry"). Returns null for multi-subject classes like the
 *  Year 8 Core Block, where the tutor still picks which subject's booklet. */
export function courseSubject(courseId: TutorCourseId): string | null {
  const name = TUTOR_COURSES[courseId].name.toLowerCase();
  return CAT_SUBJECTS.find((s) => name.includes(s.toLowerCase())) ?? null;
}

export interface CatalogueItem {
  id: string;
  name: string;
  subject: string;
  year: string;
  topic: string;
  pages: number;
  updated: string;
}

export const CATALOGUE: CatalogueItem[] = [
  { id: "m1", name: "Organic pathways booklet.pdf", subject: "Chemistry", year: "Year 11", topic: "Organic chemistry", pages: 24, updated: "28 Jun" },
  { id: "m2", name: "Reaction mechanisms worked examples.pdf", subject: "Chemistry", year: "Year 11", topic: "Organic chemistry", pages: 16, updated: "26 Jun" },
  { id: "m3", name: "Equilibrium practice set.pdf", subject: "Chemistry", year: "Year 11", topic: "Equilibrium", pages: 12, updated: "21 Jun" },
  { id: "m4", name: "Redox and electrochemistry booklet.pdf", subject: "Chemistry", year: "Year 11", topic: "Redox", pages: 20, updated: "14 Jun" },
  { id: "m5", name: "Stoichiometry revision pack.pdf", subject: "Chemistry", year: "Year 10", topic: "Stoichiometry", pages: 18, updated: "24 Jun" },
  { id: "m6", name: "Atomic structure foundations.pdf", subject: "Chemistry", year: "Year 10", topic: "Atomic structure", pages: 14, updated: "18 Jun" },
  { id: "m7", name: "Ecosystems practical workbook.pdf", subject: "Science", year: "Year 9", topic: "Ecosystems", pages: 22, updated: "27 Jun" },
  { id: "m8", name: "Forces and motion problem set.pdf", subject: "Science", year: "Year 9", topic: "Physics basics", pages: 15, updated: "20 Jun" },
  { id: "m9", name: "Cells and body systems booklet.pdf", subject: "Science", year: "Year 9", topic: "Biology basics", pages: 19, updated: "12 Jun" },
  { id: "m10", name: "Algebra consolidation pack.pdf", subject: "Mathematics", year: "Year 9", topic: "Algebra", pages: 26, updated: "22 Jun" },
  { id: "m11", name: "Essay structure scaffold.pdf", subject: "English", year: "Year 11", topic: "Essay writing", pages: 8, updated: "19 Jun" },
  { id: "m12", name: "Semester exam revision booklet.pdf", subject: "Chemistry", year: "Year 11", topic: "Exam revision", pages: 32, updated: "30 Jun" },
];

export function topicsFor(subject: string, year: string): string[] {
  const t = new Set<string>();
  CATALOGUE.forEach((c) => {
    if (c.subject === subject && c.year === year) t.add(c.topic);
  });
  return Array.from(t);
}

// ---------- print / booklet requests ----------

export type ApprovalStatus = "pending" | "approved" | "rejected";
export type PrintingStatus = "not_started" | "completed" | "failed";

export const APPROVAL_META: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#B27908", bg: "rgba(245,166,35,.16)" },
  approved: { label: "Approved", color: "#1B8049", bg: "rgba(34,160,91,.12)" },
  rejected: { label: "Rejected", color: "#E04141", bg: "rgba(224,65,65,.12)" },
};

export const PRINTING_META: Record<PrintingStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: "Not yet started", color: "#B27908", bg: "rgba(245,166,35,.16)" },
  completed: { label: "Completed", color: "#1B8049", bg: "rgba(34,160,91,.12)" },
  failed: { label: "Failed", color: "#E04141", bg: "rgba(224,65,65,.12)" },
};

export interface RequestItem {
  itemId: string;
  name: string;
  qty: number;
}

export interface PrintFormat {
  paper: string;
  sides: string;
  colour: string;
  orientation: string;
  staple: string;
  scale?: string; // absent on older rows -> treat as "100%"
  perSheet?: string; // pages per sheet; absent -> "1 per page"
}

export const DEFAULT_FORMAT: PrintFormat = {
  paper: "A4",
  sides: "Double sided",
  colour: "Black and white",
  orientation: "Portrait",
  staple: "Top left staple",
  scale: "100%",
  perSheet: "2 per page",
};

export const PRINTERS = ["Harrisdale SHS print room", "Piara Waters office", "Head office (Willetton)"];

/** Which centre a printer belongs to - used by History's centre column/filter. */
export function centreOfPrinter(printer: string): string {
  if (printer.startsWith("Harrisdale")) return "Harrisdale SHS";
  if (printer.startsWith("Piara")) return "Piara Waters";
  return "Head office";
}

/** Deterministic mock Google Drive file id for a booklet (djb2, base36). */
export function driveIdFor(name: string): string {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) >>> 0;
  const tail = h.toString(36).padStart(7, "0");
  return "1eY" + tail + "B76nMvKBGNbwQidqDr_ID3_QXy-";
}

export interface BookletRequest {
  id: string;
  ref: string;
  date: string; // display date
  time?: string; // display time, e.g. "01:34 pm" (absent on legacy rows)
  classId: string | null; // TutorClass id or null = custom request
  classText: string; // resolved label at creation time
  yearLevel: string;
  subject: string;
  items: RequestItem[];
  printer: string;
  format: PrintFormat;
  remark: string;
  approval: ApprovalStatus;
  printing: PrintingStatus;
  note?: string; // admin note e.g. rejection reason
  // Print jobs go through approval + the print pipeline. Digital packs
  // (online classes) deliver instantly to enrolled students' libraries -
  // approval only exists where money is spent.
  delivery?: "print" | "digital"; // absent = print (legacy rows)
  recipients?: number; // digital: how many students received the pack
}

export function seedRequests(): BookletRequest[] {
  return [
    {
      id: "req4",
      ref: "REQ1783051200",
      date: "1 Jul 2026",
      time: "09:12 am",
      classId: "sci9:2026-07-07",
      classText: "Year 9 Science · Tue 7 Jul",
      yearLevel: "Year 9",
      subject: "Science",
      items: [{ itemId: "m8", name: "Forces and motion problem set.pdf", qty: 7 }],
      printer: "Harrisdale SHS print room",
      format: DEFAULT_FORMAT,
      remark: "For Tuesday's forces revision, one per student.",
      approval: "pending",
      printing: "not_started",
    },
    {
      id: "req3",
      ref: "REQ1782365660",
      date: "25 Jun 2026",
      time: "01:34 pm",
      classId: "chem11:2026-07-02",
      classText: "Year 11 Chemistry · Thu 2 Jul",
      yearLevel: "Year 11",
      subject: "Chemistry",
      items: [
        { itemId: "m1", name: "Organic pathways booklet.pdf", qty: 9 },
        { itemId: "m2", name: "Reaction mechanisms worked examples.pdf", qty: 9 },
      ],
      printer: "Harrisdale SHS print room",
      format: DEFAULT_FORMAT,
      remark: "Needed before Thursday's session, one per student.",
      approval: "approved",
      printing: "not_started",
    },
    {
      id: "req2",
      ref: "REQ1770198099",
      date: "18 Jun 2026",
      time: "04:07 pm",
      classId: "sci9:2026-06-23",
      classText: "Year 9 Science · Tue 23 Jun",
      yearLevel: "Year 9",
      subject: "Science",
      items: [{ itemId: "m7", name: "Ecosystems practical workbook.pdf", qty: 7 }],
      printer: "Harrisdale SHS print room",
      format: DEFAULT_FORMAT,
      remark: "Practical workbook for the ecosystems prac.",
      approval: "approved",
      printing: "completed",
    },
    {
      id: "req1",
      ref: "REQ1769589001",
      date: "12 Jun 2026",
      time: "11:48 am",
      classId: "found10:2026-06-20",
      classText: "Year 10 Chemistry Foundations · Sat 20 Jun",
      yearLevel: "Year 10",
      subject: "Chemistry",
      items: [{ itemId: "m5", name: "Stoichiometry revision pack.pdf", qty: 6 }],
      printer: "Piara Waters office",
      format: { ...DEFAULT_FORMAT, colour: "Colour" },
      remark: "Colour needed for the annotated diagrams.",
      approval: "approved",
      printing: "failed",
      note: "Printer jam at Piara Waters. Re-queued for Monday.",
    },
  ];
}

// ---------- marking queue ----------

export interface Submission {
  id: string;
  student: string;
  init: string;
  course: TutorCourseId;
  wsName: string;
  file: string;
  when: string;
  marked: boolean;
  grade?: string;
  feedback?: string;
  /**
   * The marked-up copy handed back to the student. Either annotated in the
   * portal or uploaded by the tutor after marking it elsewhere - `returnedVia`
   * records which, so the student can see where the marks came from.
   */
  returnedFile?: string;
  returnedVia?: "annotated" | "uploaded";
}

export function seedSubmissions(): Submission[] {
  return [
    { id: "s1", student: "Maya Kapoor", init: "MK", course: "chem11", wsName: "Organic Naming Set 2", file: "Maya_Naming2.pdf", when: "Today, 8:04am", marked: false },
    { id: "s2", student: "Ethan Wu", init: "EW", course: "chem11", wsName: "Organic Naming Set 2", file: "Ethan_Naming2.pdf", when: "Yesterday, 9:12pm", marked: false },
    { id: "s3", student: "Ruby Chen", init: "RC", course: "sci9", wsName: "Forces Practical Report", file: "Ruby_Forces.pdf", when: "Yesterday, 6:40pm", marked: false },
    { id: "s4", student: "Zara Patel", init: "ZP", course: "chem11", wsName: "Equilibrium Quiz", file: "Zara_Equilibrium.pdf", when: "Tue, 7:55pm", marked: false },
    { id: "s5", student: "Dev Sharma", init: "DS", course: "found10", wsName: "Stoichiometry Warm-up", file: "Dev_Stoich.pdf", when: "Mon, 5:20pm", marked: false },
    { id: "s6", student: "Maya Kapoor", init: "MK", course: "chem11", wsName: "Stoichiometry Set 5", file: "Maya_Stoich5.pdf", when: "24 Jun", marked: true, grade: "A", feedback: "Excellent working. Watch unit conversions in Q4.", returnedFile: "Maya_Stoich5 (marked).pdf", returnedVia: "annotated" },
    { id: "s7", student: "Oliver Reid", init: "OR", course: "chem11", wsName: "Stoichiometry Set 5", file: "Oliver_Stoich5.pdf", when: "24 Jun", marked: true, grade: "B", feedback: "Good method. Show units at every step.", returnedFile: "Oliver_Stoich5 (marked).pdf", returnedVia: "annotated" },
  ];
}

// Everest marks whole letters only - no plus/minus bands - plus an explicit
// "Needs review" for work that cannot be graded as it stands.
export const GRADE_OPTIONS = ["A", "B", "C", "D", "Needs review"];

// ---------- student outlines shared with the tutor (Feature 1, tutor side) ----------

export interface SharedOutline {
  id: string;
  student: string;
  init: string;
  course: TutorCourseId;
  subject: string;
  term: string;
  fileName: string;
  uploadedAt: string;
  status: "pending" | "done" | "failed";
  assessments: Assessment[];
  topics: WeekTopic[];
}

// Overlay self-entered marks onto a fresh scan so the tutor's progress views
// have realistic per-student data (the students record these on their own
// Assessment Tracker; here we seed a believable spread).
function withMarks(scan: { assessments: Assessment[]; topics: WeekTopic[] }, marks: (string | null)[]) {
  return {
    ...scan,
    assessments: scan.assessments.map((a, i) => (marks[i] ? { ...a, done: true, score: marks[i]! } : a)),
  };
}

export function seedSharedOutlines(): SharedOutline[] {
  return [
    { id: "so1", student: "Maya Kapoor", init: "MK", course: "chem11", subject: "Chemistry ATAR", term: "Term 3", fileName: "Chemistry_Unit3_Outline.pdf", uploadedAt: "28 Jun", status: "done", ...withMarks(scanOutline("Chemistry ATAR", "Term 3"), ["82%", "76%"]) },
    { id: "so2", student: "Ethan Wu", init: "EW", course: "chem11", subject: "Physics ATAR", term: "Term 3", fileName: "Physics_Unit3_Outline.pdf", uploadedAt: "26 Jun", status: "done", ...withMarks(scanOutline("Physics ATAR", "Term 3"), ["68%"]) },
    { id: "so4", student: "Zara Patel", init: "ZP", course: "chem11", subject: "Chemistry ATAR", term: "Term 3", fileName: "Chem_ATAR_Outline.pdf", uploadedAt: "24 Jun", status: "done", ...withMarks(scanOutline("Chemistry ATAR", "Term 3"), ["91%", "88%"]) },
    { id: "so5", student: "Bella Nguyen", init: "BN", course: "block8", subject: "Year 8 Mathematics", term: "Semester 2", fileName: "Yr8_Maths_Outline.pdf", uploadedAt: "23 Jun", status: "done", ...withMarks(scanOutline("Year 9 Science", "Semester 2"), ["48%", "55%"]) },
    { id: "so6", student: "Daisy Kim", init: "DK", course: "block8", subject: "Year 8 Science", term: "Semester 2", fileName: "Yr8_Science_Outline.pdf", uploadedAt: "Today", status: "pending", assessments: [], topics: [] },
    { id: "so3", student: "Ruby Chen", init: "RC", course: "sci9", subject: "Year 9 Science", term: "Term 3", fileName: "Science_Sem2_Outline.pdf", uploadedAt: "Today", status: "pending", assessments: [], topics: [] },
  ];
}

// ---------- outline roster + nudge classification ----------

export interface OutlineRosterEntry {
  name: string;
  init: string;
  outline?: SharedOutline;
  status: "done" | "pending" | "failed" | "missing"; // missing = no outline uploaded yet
}

/** The full class roster paired with each student's outline status, so the
    tutor sees who has submitted, who is still scanning and who hasn't uploaded
    at all - grouped per class rather than one flat list. */
export function outlineRoster(courseId: TutorCourseId, outlines: SharedOutline[]): OutlineRosterEntry[] {
  const forCourse = outlines.filter((o) => o.course === courseId);
  return TUTOR_COURSES[courseId].students.map((s) => {
    const outline = forCourse.find((o) => o.student === s.name);
    return { name: s.name, init: s.init, outline, status: outline ? outline.status : ("missing" as const) };
  });
}

/** The year number of a course (11 for "Year 11 Chemistry"), or 0 if unknown. */
export function courseYear(courseId: TutorCourseId): number {
  const m = TUTOR_COURSES[courseId].year.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** Year 7-10 students are auto-reminded to upload their school outline (Year 11
    ATAR students manage their own; the reminder targets the younger years). */
export function isReminderYear(courseId: TutorCourseId): boolean {
  const y = courseYear(courseId);
  return y >= 7 && y <= 10;
}

// ---------- booklet cloud drive (My Booklets) ----------

export interface BookletFile {
  folder: string;
  name: string;
  meta: string;
}

export const BOOKLET_FILES: BookletFile[] = [
  { folder: "Year 11 Chemistry", name: "Organic pathways booklet.pdf", meta: "24 pages · updated 28 Jun" },
  { folder: "Year 11 Chemistry", name: "Reaction mechanisms worked examples.pdf", meta: "16 pages · updated 26 Jun" },
  { folder: "Year 11 Chemistry", name: "Equilibrium practice set.pdf", meta: "12 pages · updated 21 Jun" },
  { folder: "Year 9 Science", name: "Ecosystems practical workbook.pdf", meta: "22 pages · updated 27 Jun" },
  { folder: "Year 9 Science", name: "Forces and motion problem set.pdf", meta: "15 pages · updated 20 Jun" },
  { folder: "Year 10 Foundations", name: "Stoichiometry revision pack.pdf", meta: "18 pages · updated 24 Jun" },
  { folder: "Year 10 Foundations", name: "Atomic structure foundations.pdf", meta: "14 pages · updated 18 Jun" },
];

// ---------- tutor global search ----------

export const TUTOR_SEARCH_ITEMS = [
  { name: "Year 11 Chemistry", meta: "My Courses · Thursdays 7pm", color: "#7A5AF8", page: "/tutor/courses/chem11" },
  { name: "Year 9 Science", meta: "My Courses · Tuesdays 5pm", color: "#0E9C8E", page: "/tutor/courses/sci9" },
  { name: "Year 10 Chemistry Foundations", meta: "My Courses · Saturdays 9am", color: "#D68910", page: "/tutor/courses/found10" },
  { name: "Organic pathways booklet", meta: "Study Materials", color: "#009DFF", page: "/tutor/materials" },
  { name: "REQ1782365660", meta: "My Requests · approved", color: "#22A05B", page: "/tutor/requests" },
  { name: "Organic Naming Set 2", meta: "Marking · 2 to mark", color: "#E04141", page: "/tutor/grade" },
  { name: "Maya Kapoor", meta: "Student · Year 11 Chemistry", color: "#7A5AF8", page: "/tutor/courses/chem11" },
  { name: "Chemistry ATAR outline", meta: "Student outlines · Maya Kapoor", color: "#7A5AF8", page: "/tutor/outlines" },
  { name: "Ruby Chen", meta: "Messages · safeguarding alert", color: "#E04141", page: "/tutor/messages" },
  { name: "Print history", meta: "History", color: "#66707F", page: "/tutor/history" },
  { name: "Year 8 Core Block", meta: "My Courses · Wednesdays 4-7pm online", color: "#0E7AC2", page: "/tutor/courses/block8" },
];

// ---------- attendance (hshs pattern: student x session x date) ----------

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export const ATTENDANCE_META: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present: { label: "Present", color: "#1B8049", bg: "rgba(34,160,91,.12)" },
  late: { label: "Late", color: "#B27908", bg: "rgba(245,166,35,.16)" },
  absent: { label: "Absent", color: "#E04141", bg: "rgba(224,65,65,.12)" },
  excused: { label: "Excused", color: "#66707F", bg: "rgba(0,32,63,.08)" },
};

/** Roster for an attendance key: a block session id or a whole course id. */
export function rosterFor(sessionId: string): { name: string; init: string }[] {
  const block = BLOCK8_SESSIONS.find((s) => s.id === sessionId);
  if (block) return block.students;
  const course = TUTOR_COURSES[sessionId as TutorCourseId];
  return course ? course.students : [];
}

// Seeded attendance for last week's block (1 Jul) so history isn't empty.
export function seedAttendance(): Record<string, Record<string, AttendanceStatus>> {
  const mk = (students: { name: string }[], overrides: Record<string, AttendanceStatus>) => {
    const out: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (out[s.name] = overrides[s.name] ?? "present"));
    return out;
  };
  return {
    "b8math:2026-07-01": mk(B8_MATHS, { "Cooper Hall": "late", "Hugo Silva": "absent" }),
    "b8sci:2026-07-01": mk(B8_SCIENCE, { "Jonah Reeves": "excused" }),
    "b8eng:2026-07-01": mk(B8_ENGLISH, {}),
    "chem11:2026-07-02": mk(TUTOR_COURSES.chem11.students, { "Oliver Reid": "absent" }),
  };
}

// ---------- classroom pages (per subject) ----------
// The Announcement/ClassPost/Question content itself lives in
// lib/classroom.tsx (a shared provider mounted in both portals, like
// lib/messaging.tsx) since students need to read and post into it too.
// This file keeps only the roster-scoping definitions.

export interface ClassroomDef {
  id: string; // course id or block session id
  name: string;
  courseId: TutorCourseId; // owning course (block sessions -> block8)
  color: string;
  bg: string;
}

export const CLASSROOMS: ClassroomDef[] = [
  { id: "chem11", name: "Year 11 Chemistry", courseId: "chem11", color: "#7A5AF8", bg: "rgba(122,90,248,.13)" },
  { id: "b8math", name: "Year 8 Mathematics", courseId: "block8", color: "#7A5AF8", bg: "rgba(122,90,248,.13)" },
  { id: "b8sci", name: "Year 8 Science", courseId: "block8", color: "#0E9C8E", bg: "rgba(18,181,165,.14)" },
  { id: "b8eng", name: "Year 8 English", courseId: "block8", color: "#D68910", bg: "rgba(245,166,35,.16)" },
];

// The tutor course whose online classroom Maya (our one student persona)
// actually belongs to. Shared here so both portals map CourseId -> the
// TutorCourseId/classroom id the same way instead of duplicating the table.
export const TUTOR_COURSE_FOR: Partial<Record<string, TutorCourseId>> = {
  chem: "chem11",
};

// ============================================================
// Online class materials: linked Drive folder, AI search, assignments,
// join-based attendance. Replaces the old digital-pack/cart flow for
// online classes - the tutor browses/searches a Drive-style tree linked
// by the admin office and assigns booklets or worksheets straight to a
// student or a whole class. See lib/tutor-store.tsx for the actions and
// lib/live-sync.ts for the cross-portal localStorage read helpers.
// ============================================================

// ---------- linked drive ----------

export const TUTOR_DRIVE: { linkedBy: string; linkedAt: string; url: string } = {
  linkedBy: "Everest Admin Office",
  linkedAt: "3 Jun 2026",
  url: "https://drive.google.com/drive/folders/1EvrTutor-SharedMaterials",
};

// ---------- folders + files ----------

export interface DriveFolder {
  id: string;
  name: string;
  courseId?: TutorCourseId;
  note?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  ext: "pdf" | "docx";
  sizeKB: number;
  pages?: number;
  topics: string[];
  folderId: string;
  // Representative body text pulled from inside the booklet, so the search can
  // look INTO the document (headings, worked examples, key terms) - not just
  // the file name and topics.
  content?: string;
}

export const DRIVE_FOLDERS: DriveFolder[] = [
  { id: "f-chem11", name: "Year 11 Chemistry", courseId: "chem11", note: "Organic pathways, equilibrium, redox" },
  { id: "f-block8", name: "Year 8 Core Block", courseId: "block8", note: "Maths, Science and English resources" },
  { id: "f-examrev", name: "Exam revision" },
  { id: "f-general", name: "General resources" },
];

export const DRIVE_FILES: DriveFile[] = [
  // Year 11 Chemistry (online)
  {
    id: "d1",
    name: "Organic pathways booklet.pdf",
    ext: "pdf",
    sizeKB: 1840,
    pages: 24,
    topics: ["organic chemistry", "reaction pathways", "functional groups", "synthesis routes"],
    folderId: "f-chem11",
  },
  {
    id: "d2",
    name: "Reaction mechanisms worked examples.pdf",
    ext: "pdf",
    sizeKB: 1260,
    pages: 16,
    topics: ["reaction mechanisms", "organic chemistry", "curly arrows", "nucleophiles and electrophiles"],
    folderId: "f-chem11",
  },
  {
    id: "d3",
    name: "Equilibrium practice set.pdf",
    ext: "pdf",
    sizeKB: 940,
    pages: 12,
    topics: ["equilibrium", "le chatelier's principle", "kc calculations", "reversible reactions"],
    folderId: "f-chem11",
  },
  {
    id: "d4",
    name: "Redox and electrochemistry booklet.pdf",
    ext: "pdf",
    sizeKB: 1510,
    pages: 20,
    topics: ["redox", "electrochemistry", "galvanic cells", "oxidation states", "titration"],
    folderId: "f-chem11",
  },
  {
    id: "d5",
    name: "Acids and bases titration workbook.docx",
    ext: "docx",
    sizeKB: 610,
    pages: 14,
    topics: ["acids and bases", "titration", "ph calculations", "stoichiometry", "neutralisation"],
    folderId: "f-chem11",
  },
  {
    id: "d6",
    name: "Stoichiometry revision pack.pdf",
    ext: "pdf",
    sizeKB: 1120,
    pages: 18,
    topics: ["stoichiometry", "mole calculations", "limiting reagent", "molar mass"],
    folderId: "f-chem11",
  },
  // Year 8 Core Block (online)
  {
    id: "d7",
    name: "Linear equations worksheet.pdf",
    ext: "pdf",
    sizeKB: 480,
    pages: 6,
    topics: ["algebra", "linear equations", "solving for x", "maths"],
    folderId: "f-block8",
  },
  {
    id: "d8",
    name: "Forces and motion problem set.pdf",
    ext: "pdf",
    sizeKB: 720,
    pages: 15,
    topics: ["forces", "motion", "physics basics", "newton's laws", "speed and acceleration"],
    folderId: "f-block8",
  },
  {
    id: "d9",
    name: "Cells and body systems booklet.pdf",
    ext: "pdf",
    sizeKB: 990,
    pages: 19,
    topics: ["cells", "body systems", "biology basics", "organs"],
    folderId: "f-block8",
  },
  {
    id: "d10",
    name: "Persuasive writing scaffold.docx",
    ext: "docx",
    sizeKB: 340,
    pages: 8,
    topics: ["essay writing", "persuasive writing", "text structure", "english"],
    folderId: "f-block8",
  },
  {
    id: "d11",
    name: "Fractions and decimals warm-up.pdf",
    ext: "pdf",
    sizeKB: 410,
    pages: 5,
    topics: ["fractions", "decimals", "number", "maths"],
    folderId: "f-block8",
  },
  // Exam revision
  {
    id: "d12",
    name: "Semester exam revision booklet.pdf",
    ext: "pdf",
    sizeKB: 2340,
    pages: 32,
    topics: ["exam revision", "chemistry", "mixed topics", "practice questions"],
    folderId: "f-examrev",
  },
  {
    id: "d13",
    name: "Timed practice paper, Chemistry Unit 3.pdf",
    ext: "pdf",
    sizeKB: 880,
    pages: 14,
    topics: ["exam revision", "practice paper", "chemistry", "time management"],
    folderId: "f-examrev",
  },
  {
    id: "d14",
    name: "Quick recall flashcard set.pdf",
    ext: "pdf",
    sizeKB: 300,
    pages: 10,
    topics: ["exam revision", "flashcards", "key terms", "quick recall"],
    folderId: "f-examrev",
  },
  {
    id: "d15",
    name: "Common exam mistakes checklist.docx",
    ext: "docx",
    sizeKB: 180,
    pages: 4,
    topics: ["exam revision", "exam technique", "common mistakes"],
    folderId: "f-examrev",
  },
  // General resources
  {
    id: "d16",
    name: "Essay structure scaffold.pdf",
    ext: "pdf",
    sizeKB: 260,
    pages: 8,
    topics: ["essay writing", "text structure", "english", "planning a response"],
    folderId: "f-general",
  },
  {
    id: "d17",
    name: "Periodic table and data sheet.pdf",
    ext: "pdf",
    sizeKB: 210,
    pages: 2,
    topics: ["periodic table", "reference sheet", "chemistry data", "constants"],
    folderId: "f-general",
  },
  {
    id: "d18",
    name: "Study skills and time management guide.docx",
    ext: "docx",
    sizeKB: 150,
    pages: 6,
    topics: ["study skills", "time management", "exam preparation", "wellbeing"],
    folderId: "f-general",
  },
  {
    id: "d19",
    name: "Lab safety and equipment reference.pdf",
    ext: "pdf",
    sizeKB: 390,
    pages: 9,
    topics: ["lab safety", "equipment", "practical work", "science"],
    folderId: "f-general",
  },
];

// Representative body text from inside each booklet - headings, worked examples
// and key terms. Attached to the files so the "AI" search can look INTO the
// document, surfacing a booklet when the tutor searches for content that isn't
// in the file name or topic tags (e.g. "curly arrows", "Le Chatelier",
// "pomodoro"). Kept as a separate map so the file list above stays readable.
const DRIVE_CONTENT: Record<string, string> = {
  d1: "haloalkanes, alkenes and alcohols; addition, substitution and elimination reactions; markovnikov's rule; esterification; worked example converting ethene to ethanol.",
  d2: "step by step curly arrow mechanisms; sn1 and sn2 substitution; electrophilic addition across a double bond; carbocation intermediates; homolytic and heterolytic bond breaking.",
  d3: "dynamic equilibrium; le chatelier predictions for temperature, pressure and concentration; calculating kc from equilibrium concentrations; ice tables; the haber process.",
  d4: "oxidation numbers; half equations; balancing redox in acidic solution; galvanic and electrolytic cells; standard electrode potentials; cell diagrams; the salt bridge.",
  d5: "strong and weak acids; ph and poh; titration curves; indicators and end point; neutralisation; conjugate acid base pairs; worked ph calculation for a diprotic acid.",
  d6: "mole ratios; limiting reagent; percentage yield; molar mass; concentration in mol/l; gas volume calculations at stp; empirical and molecular formula.",
  d7: "solving one and two step equations; the balancing method; substitution to check a solution; forming equations from worded problems with an unknown.",
  d8: "newton's first, second and third laws; f = ma; free body diagrams; friction; distance time and velocity time graphs; acceleration due to gravity.",
  d9: "plant and animal cells; organelles including mitochondria and nucleus; diffusion and osmosis; the circulatory, respiratory and digestive systems.",
  d10: "thesis statement; topic sentences; rhetorical devices; ethos pathos and logos; anticipating and rebutting counter arguments; a strong call to action conclusion.",
  d11: "equivalent fractions; converting between fractions, decimals and percentages; adding and subtracting with a common denominator; placing values on a number line.",
  d12: "mixed practice across organic chemistry, equilibrium, redox and stoichiometry; extended response questions; a full marking guide with model answers.",
  d13: "a full length exam under timed conditions; multiple choice and extended response; questions that use the data booklet; suggested timing per section.",
  d14: "key definitions; formulae to memorise; common ion charges; functional group names; rapid fire revision prompts for the night before.",
  d15: "significant figures and units; rounding errors; misreading the command word; forgetting to show working; state symbols in equations.",
  d16: "introduction, body and conclusion; teel paragraphs - topic sentence, evidence, explanation, link; an essay planning template with a thesis line.",
  d17: "atomic masses; electronegativity values; physical constants; solubility rules; a table of common ions and their charges for reference.",
  d18: "spaced repetition and active recall; the pomodoro technique; building a weekly study timetable; managing exam stress and sleep.",
  d19: "risk assessment before a practical; hazard symbols; lighting and using a bunsen burner safely; measuring cylinders and pipettes; personal protective equipment.",
};
DRIVE_FILES.forEach((f) => {
  f.content = DRIVE_CONTENT[f.id];
});

// Small synonym map so concept words the tutor types surface relevant
// booklets even when the exact word is not in the file name. Deterministic
// "AI" search: this is the whole model, no network call involved.
const SEARCH_SYNONYMS: Record<string, string[]> = {
  titration: ["acids and bases", "ph calculations", "redox", "stoichiometry"],
  acid: ["acids and bases", "ph calculations", "neutralisation"],
  base: ["acids and bases", "ph calculations", "neutralisation"],
  forces: ["motion", "physics basics", "newton's laws"],
  motion: ["forces", "physics basics", "speed and acceleration"],
  physics: ["forces", "motion", "physics basics"],
  essay: ["essay writing", "persuasive writing", "text structure"],
  writing: ["essay writing", "persuasive writing", "text structure"],
  moles: ["mole calculations", "stoichiometry", "molar mass"],
  algebra: ["linear equations", "solving for x"],
  exam: ["exam revision", "practice paper", "exam technique"],
  revision: ["exam revision", "practice questions", "quick recall"],
  cells: ["biology basics", "body systems", "organs"],
  biology: ["cells", "body systems", "organs"],
  equilibrium: ["le chatelier's principle", "kc calculations", "reversible reactions"],
  organic: ["organic chemistry", "reaction pathways", "functional groups"],
  safety: ["lab safety", "equipment", "practical work"],
};

export function searchDrive(q: string): { file: DriveFile; folder: DriveFolder; why: string }[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const folderById = new Map(DRIVE_FOLDERS.map((f) => [f.id, f]));

  // Expand the query with any synonym hits so concept words surface topics
  // that do not literally contain the typed word.
  const expansions = new Set<string>();
  Object.keys(SEARCH_SYNONYMS).forEach((key) => {
    if (query.includes(key)) SEARCH_SYNONYMS[key].forEach((t) => expansions.add(t));
  });

  const results: { file: DriveFile; folder: DriveFolder; why: string; score: number }[] = [];

  DRIVE_FILES.forEach((file) => {
    const folder = folderById.get(file.folderId);
    if (!folder) return;
    const nameLc = file.name.toLowerCase();
    const folderLc = folder.name.toLowerCase();

    if (nameLc.includes(query)) {
      results.push({ file, folder, why: 'matches file name "' + query + '"', score: 3 });
      return;
    }
    if (folderLc.includes(query)) {
      results.push({ file, folder, why: "in folder " + folder.name, score: 2 });
      return;
    }
    const directTopic = file.topics.find((t) => t.includes(query));
    if (directTopic) {
      results.push({ file, folder, why: "matches topic: " + directTopic, score: 2 });
      return;
    }
    // Look INSIDE the booklet text - the "search the content" step. Pull a
    // short snippet around the match so the tutor sees why it was found.
    const content = file.content || "";
    const hit = content.indexOf(query);
    if (hit >= 0) {
      const start = Math.max(0, hit - 24);
      const snippet = (start > 0 ? "..." : "") + content.slice(start, hit + query.length + 32).trim() + "...";
      results.push({ file, folder, why: "found in the booklet: " + snippet, score: 1.5 });
      return;
    }
    const synonymTopic = file.topics.find((t) => expansions.has(t));
    if (synonymTopic) {
      results.push({ file, folder, why: "mentions " + synonymTopic, score: 1 });
      return;
    }
    // Last resort: a synonym-expanded concept appears in the body text.
    const synonymInContent = Array.from(expansions).find((t) => content.includes(t));
    if (synonymInContent) {
      results.push({ file, folder, why: "covers " + synonymInContent, score: 0.8 });
    }
  });

  return results.sort((a, b) => b.score - a.score).map(({ file, folder, why }) => ({ file, folder, why }));
}

// ---------- material assignments (booklets, worksheets + library kinds) ----------

export type AssignTarget = { kind: "class" } | { kind: "student"; studentId: string; studentName: string };

export type MaterialKind = "booklet" | "worksheet" | "study_notes" | "video" | "recording" | "reference_notes";

export const MATERIAL_KIND_ORDER: MaterialKind[] = ["booklet", "worksheet", "study_notes", "video", "recording", "reference_notes"];

export const MATERIAL_KIND_META: Record<MaterialKind, { label: string; plural: string; color: string; bg: string }> = {
  booklet: { label: "Booklet", plural: "Booklets", color: "#66707F", bg: "rgba(0,32,63,.06)" },
  worksheet: { label: "Worksheet", plural: "Worksheets", color: "#6B4EE6", bg: "rgba(122,90,248,.13)" },
  study_notes: { label: "Study notes", plural: "Study Notes", color: "#0E9C8E", bg: "rgba(18,181,165,.14)" },
  video: { label: "Video", plural: "Videos", color: "#E04141", bg: "rgba(224,65,65,.1)" },
  recording: { label: "Recording", plural: "Recording", color: "#007ECC", bg: "rgba(0,157,255,.12)" },
  reference_notes: { label: "Reference notes", plural: "Reference Notes", color: "#B27908", bg: "rgba(245,166,35,.16)" },
};

export interface MaterialAssignment {
  id: string;
  fileId: string;
  fileName: string;
  courseId: TutorCourseId;
  target: AssignTarget;
  kind: MaterialKind;
  assignedAt: string;
  sessionISO?: string;
  due?: string;
  status: "assigned" | "submitted" | "graded";
}

export const SEED_ASSIGNMENTS: MaterialAssignment[] = [
  {
    id: "ma1",
    fileId: "d1",
    fileName: "Organic pathways booklet.pdf",
    courseId: "chem11",
    target: { kind: "class" },
    kind: "booklet",
    assignedAt: "2026-06-25T09:00:00",
    sessionISO: "2026-06-25T19:00:00",
    status: "assigned",
  },
  {
    id: "ma2",
    fileId: "d6",
    fileName: "Stoichiometry revision pack.pdf",
    courseId: "chem11",
    target: { kind: "student", studentId: "maya-kapoor", studentName: "Maya Kapoor" },
    kind: "worksheet",
    assignedAt: "2026-06-18T08:30:00",
    sessionISO: "2026-06-18T19:00:00",
    due: "2026-06-25",
    status: "graded",
  },
  {
    id: "ma3",
    fileId: "d3",
    fileName: "Equilibrium practice set.pdf",
    courseId: "chem11",
    target: { kind: "student", studentId: "ethan-wu", studentName: "Ethan Wu" },
    kind: "worksheet",
    assignedAt: "2026-06-27T08:30:00",
    sessionISO: "2026-06-25T19:00:00",
    due: "2026-07-02",
    status: "submitted",
  },
  {
    id: "ma4",
    fileId: "d7",
    fileName: "Linear equations worksheet.pdf",
    courseId: "block8",
    target: { kind: "class" },
    kind: "booklet",
    assignedAt: "2026-06-24T10:00:00",
    sessionISO: "2026-06-24T16:00:00",
    status: "assigned",
  },
  {
    id: "ma5",
    fileId: "d8",
    fileName: "Forces and motion problem set.pdf",
    courseId: "block8",
    target: { kind: "student", studentId: "cooper-hall", studentName: "Cooper Hall" },
    kind: "worksheet",
    assignedAt: "2026-06-17T10:00:00",
    sessionISO: "2026-06-17T17:00:00",
    due: "2026-06-24",
    status: "assigned",
  },
  {
    id: "ma6",
    fileId: "d2",
    fileName: "Reaction mechanisms worked examples.pdf",
    courseId: "chem11",
    target: { kind: "class" },
    kind: "study_notes",
    assignedAt: "2026-06-29T09:00:00",
    sessionISO: "2026-07-02T19:00:00",
    status: "assigned",
  },
  {
    id: "ma7",
    fileId: "d17",
    fileName: "Periodic table and data sheet.pdf",
    courseId: "chem11",
    target: { kind: "class" },
    kind: "reference_notes",
    assignedAt: "2026-06-20T09:00:00",
    status: "assigned",
  },
];

// ---------- attendance sourced from student "Join class" clicks ----------

export interface JoinEvent {
  studentId: string;
  studentName: string;
  courseId: TutorCourseId;
  sessionISO: string;
  joinedAt: string;
  minsLate: number;
}

/** Minutes after session start still counted as "on time". */
export const ON_TIME_GRACE_MIN = 5;
