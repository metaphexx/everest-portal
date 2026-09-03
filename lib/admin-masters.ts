// Master data for the office portal.
//
// These are the reference records behind everything else: centres, printers,
// which printer sits in which centre, terms, courses, and the Drive folders the
// booklets actually live in. The live system calls them "masters", so this keeps
// that language rather than inventing a second vocabulary for the same screens.
//
// Values are plausible Everest data rather than the test rows currently in the
// staging database ("new printer", "sdda", "hfrhtrjtyjt"), so the layout is
// judged on real content lengths.

import { PrintFormat } from "./tutor-data";

export interface Centre {
  id: string;
  name: string;
  location: string;
  /** Who the office writes to about this centre. */
  adminEmail: string;
  active: boolean;
}

export const CENTRES_M: Centre[] = [
  { id: "c1", name: "Harrisdale SHS", location: "Harrisdale, Western Australia", adminEmail: "harrisdale@everesttutoring.com.au", active: true },
  { id: "c2", name: "Piara Waters", location: "Piara Waters, Western Australia", adminEmail: "piarawaters@everesttutoring.com.au", active: true },
  { id: "c3", name: "Willetton", location: "Willetton, Western Australia", adminEmail: "willetton@everesttutoring.com.au", active: true },
  { id: "c4", name: "Perth Modern", location: "Subiaco, Western Australia", adminEmail: "perthmodern@everesttutoring.com.au", active: true },
  { id: "c5", name: "Head office", location: "Willetton, Western Australia", adminEmail: "info@everesttutoring.com.au", active: true },
  { id: "c6", name: "Canning Vale", location: "Canning Vale, Western Australia", adminEmail: "canningvale@everesttutoring.com.au", active: false },
];

export interface Printer {
  id: string;
  name: string;
  model: string;
  centre: string;
  /** Whether this printer has a stapler fitted at all. */
  stapler: boolean;
  /** What a job sent here uses unless the request overrides it. */
  defaults: PrintFormat;
  active: boolean;
}

export const PRINTERS_M: Printer[] = [
  { id: "p1", name: "Harrisdale print room", model: "Kyocera TASKalfa 4053ci", centre: "Harrisdale SHS", stapler: true, defaults: { paper: "A4", sides: "Double sided", colour: "Black and white", orientation: "Portrait", staple: "Top left staple", scale: "100%", perSheet: "2 per page" }, active: true },
  { id: "p2", name: "Harrisdale back office", model: "Kyocera ECOSYS P3260dn", centre: "Harrisdale SHS", stapler: false, defaults: { paper: "A4", sides: "Double sided", colour: "Black and white", orientation: "Portrait", staple: "No staple", scale: "100%", perSheet: "1 per page" }, active: true },
  { id: "p3", name: "Piara Waters office", model: "Kyocera TASKalfa 3253ci", centre: "Piara Waters", stapler: true, defaults: { paper: "A4", sides: "Double sided", colour: "Black and white", orientation: "Portrait", staple: "Top left staple", scale: "100%", perSheet: "2 per page" }, active: true },
  { id: "p4", name: "Willetton front desk", model: "Canon imageRUNNER 2630i", centre: "Willetton", stapler: false, defaults: { paper: "A4", sides: "Single sided", colour: "Black and white", orientation: "Portrait", staple: "No staple", scale: "Fit to width", perSheet: "1 per page" }, active: true },
  { id: "p5", name: "Head office", model: "Kyocera TASKalfa 4053ci", centre: "Head office", stapler: true, defaults: { paper: "A4", sides: "Double sided", colour: "Colour", orientation: "Portrait", staple: "Top left staple", scale: "100%", perSheet: "2 per page" }, active: true },
  { id: "p6", name: "Perth Modern spare", model: "Brother HL-L6400DW", centre: "Perth Modern", stapler: false, defaults: { paper: "A4", sides: "Single sided", colour: "Black and white", orientation: "Portrait", staple: "No staple", scale: "100%", perSheet: "1 per page" }, active: false },
];

export interface CentrePrinter {
  id: string;
  centre: string;
  printers: string[];
  defaultPrinter: string;
  /** Tutors who may send to this centre's printers. Empty means everyone at it. */
  tutors: string[];
  active: boolean;
}

export const CENTRE_PRINTERS: CentrePrinter[] = [
  { id: "cp1", centre: "Harrisdale SHS", printers: ["Harrisdale print room", "Harrisdale back office"], defaultPrinter: "Harrisdale print room", tutors: ["Priya Rao", "Tobi Okafor"], active: true },
  { id: "cp2", centre: "Piara Waters", printers: ["Piara Waters office"], defaultPrinter: "Piara Waters office", tutors: ["Priya Rao"], active: true },
  { id: "cp3", centre: "Willetton", printers: ["Willetton front desk", "Head office"], defaultPrinter: "Willetton front desk", tutors: ["Grace Lin"], active: true },
  { id: "cp4", centre: "Perth Modern", printers: ["Perth Modern spare"], defaultPrinter: "Perth Modern spare", tutors: [], active: false },
  { id: "cp5", centre: "Head office", printers: ["Head office"], defaultPrinter: "Head office", tutors: [], active: true },
];

export interface SystemRow {
  id: string;
  hostname: string;
  label: string;
  centre: string | null;
  printers: string[];
  mac: string;
  os: string;
  status: "active" | "pending";
}

export const SYSTEMS: SystemRow[] = [
  { id: "s1", hostname: "HARRISDALE-FRONT", label: "Harrisdale front desk iMac", centre: "Harrisdale SHS", printers: ["Harrisdale print room", "Harrisdale back office"], mac: "c4:b3:01:d2:c1:0b", os: "macOS 15.2", status: "active" },
  { id: "s2", hostname: "PIARA-OFFICE-01", label: "Piara Waters office PC", centre: "Piara Waters", printers: ["Piara Waters office"], mac: "ec:69:83:c6:f1:00", os: "Windows 11", status: "active" },
  { id: "s3", hostname: "WILLETTON-DESK", label: "Willetton reception PC", centre: "Willetton", printers: ["Willetton front desk"], mac: "97:b6:48:06:4b:5a", os: "Windows 11", status: "active" },
  { id: "s4", hostname: "NEW-LAPTOP-04", label: "Not yet named", centre: null, printers: [], mac: "3a:11:9f:cc:00:71", os: "Windows 11", status: "pending" },
];

export interface Term {
  id: string;
  name: string;
  start: string;
  end: string;
  weeks: number;
  state: "ongoing" | "upcoming" | "finished";
}

export const TERMS: Term[] = [
  { id: "t1", name: "Term 3 2026", start: "20 Jul 2026", end: "25 Sep 2026", weeks: 10, state: "ongoing" },
  { id: "t2", name: "Term 4 2026", start: "12 Oct 2026", end: "17 Dec 2026", weeks: 10, state: "upcoming" },
  { id: "t3", name: "Term 2 2026", start: "20 Apr 2026", end: "3 Jul 2026", weeks: 11, state: "finished" },
  { id: "t4", name: "Term 1 2026", start: "2 Feb 2026", end: "10 Apr 2026", weeks: 10, state: "finished" },
];

export interface CourseCategory {
  id: string;
  name: string;
  courses: number;
  active: boolean;
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  { id: "cc1", name: "GATE and ASET preparation", courses: 4, active: true },
  { id: "cc2", name: "Lower school (Years 7 to 9)", courses: 6, active: true },
  { id: "cc3", name: "Upper school (Years 10 to 12)", courses: 5, active: true },
  { id: "cc4", name: "Holiday intensives", courses: 3, active: true },
  { id: "cc5", name: "Recorded courses", courses: 2, active: false },
];

export interface CourseRow {
  id: string;
  name: string;
  shortName: string;
  category: string;
  year: string;
  subjects: string[];
  durationWeeks: number;
  active: boolean;
}

export const COURSES: CourseRow[] = [
  { id: "co1", name: "Year 11 Chemistry ATAR", shortName: "Y11 Chem", category: "Upper school (Years 10 to 12)", year: "Year 11", subjects: ["Chemistry"], durationWeeks: 10, active: true },
  { id: "co2", name: "Year 9 Science", shortName: "Y9 Sci", category: "Lower school (Years 7 to 9)", year: "Year 9", subjects: ["Science"], durationWeeks: 10, active: true },
  { id: "co3", name: "Year 8 Core Block", shortName: "Y8 Block", category: "Lower school (Years 7 to 9)", year: "Year 8", subjects: ["Mathematics", "English", "Science"], durationWeeks: 10, active: true },
  { id: "co4", name: "Year 10 Chemistry Foundations", shortName: "Y10 Found", category: "Upper school (Years 10 to 12)", year: "Year 10", subjects: ["Chemistry"], durationWeeks: 10, active: true },
  { id: "co5", name: "GATE Workshop", shortName: "GATE WS", category: "GATE and ASET preparation", year: "Year 6", subjects: ["Reasoning", "Writing"], durationWeeks: 8, active: true },
  { id: "co6", name: "Year 7 GATE Preparation", shortName: "Y7 GATE", category: "GATE and ASET preparation", year: "Year 7", subjects: ["Mathematics", "English"], durationWeeks: 10, active: true },
  { id: "co7", name: "Summer Chemistry intensive", shortName: "Summer Chem", category: "Holiday intensives", year: "Year 11", subjects: ["Chemistry"], durationWeeks: 2, active: false },
];

export interface CourseTutorMap {
  id: string;
  course: string;
  tutors: string[];
  active: boolean;
}

export const COURSE_TUTORS: CourseTutorMap[] = [
  { id: "ct1", course: "Year 11 Chemistry ATAR", tutors: ["Priya Rao"], active: true },
  { id: "ct2", course: "Year 9 Science", tutors: ["Priya Rao", "Tobi Okafor"], active: true },
  { id: "ct3", course: "Year 8 Core Block", tutors: ["Priya Rao"], active: true },
  { id: "ct4", course: "Year 10 Chemistry Foundations", tutors: ["Priya Rao"], active: true },
  { id: "ct5", course: "GATE Workshop", tutors: ["David Chen"], active: true },
  { id: "ct6", course: "Year 7 GATE Preparation", tutors: ["David Chen", "Amira Hassan"], active: true },
  { id: "ct7", course: "Summer Chemistry intensive", tutors: [], active: false },
];

export interface DriveMap {
  id: string;
  label: string;
  folder: string;
  owner: string;
  active: boolean;
}

const DRIVE = "https://drive.google.com/drive/folders/";

export const SUBJECT_DRIVE: DriveMap[] = [
  { id: "sd1", label: "Year 11 Chemistry", folder: DRIVE + "1LfSj1G63g3IwiFtKD1xZQZWrm3eZBbQQ", owner: "Everest office", active: true },
  { id: "sd2", label: "Year 9 Science", folder: DRIVE + "19KwNmGuI9_Tu2-2qL5b1uZRYVQVbAalc", owner: "Everest office", active: true },
  { id: "sd3", label: "Year 8 English", folder: DRIVE + "12pAiUPKD-Z0vNn1gRAUNMuA65coYwTf0", owner: "Everest office", active: true },
  { id: "sd4", label: "Year 8 Science", folder: DRIVE + "1Y4phIAmaGpZ7TbKzc_Z04-MC55skJ5GE", owner: "Everest office", active: true },
  { id: "sd5", label: "Year 9 Mathematics", folder: DRIVE + "1c9Wq2sLp0zTn4RvB7mYh6XdEa8FgHjKl", owner: "Everest office", active: true },
  { id: "sd6", label: "Year 7 English", folder: DRIVE + "1QpR3tYuI5oP7aS9dF2gH4jK6lZ8xC0vB", owner: "Everest office", active: false },
];

export const BOOKLET_DRIVE: DriveMap[] = [
  { id: "bd1", label: "Organic pathways booklet.pdf", folder: DRIVE + "1LfSj1G63g3IwiFtKD1xZQZWrm3eZBbQQ", owner: "Year 11 Chemistry", active: true },
  { id: "bd2", label: "Equilibrium practice set.pdf", folder: DRIVE + "1LfSj1G63g3IwiFtKD1xZQZWrm3eZBbQQ", owner: "Year 11 Chemistry", active: true },
  { id: "bd3", label: "Forces and motion problem set.pdf", folder: DRIVE + "19KwNmGuI9_Tu2-2qL5b1uZRYVQVbAalc", owner: "Year 9 Science", active: true },
  { id: "bd4", label: "Ecosystems practical workbook.pdf", folder: DRIVE + "19KwNmGuI9_Tu2-2qL5b1uZRYVQVbAalc", owner: "Year 9 Science", active: true },
  { id: "bd5", label: "Algebra consolidation pack.pdf", folder: DRIVE + "1c9Wq2sLp0zTn4RvB7mYh6XdEa8FgHjKl", owner: "Year 9 Mathematics", active: true },
];

export interface DriveDataMap {
  id: string;
  folder: string;
  tutors: string[];
  purpose: string;
  active: boolean;
}

export const DRIVE_DATA: DriveDataMap[] = [
  { id: "dd1", folder: DRIVE + "1LfSj1G63g3IwiFtKD1xZQZWrm3eZBbQQ", tutors: ["Priya Rao"], purpose: "Chemistry booklets", active: true },
  { id: "dd2", folder: DRIVE + "19KwNmGuI9_Tu2-2qL5b1uZRYVQVbAalc", tutors: ["Priya Rao", "Tobi Okafor"], purpose: "Science booklets", active: true },
  { id: "dd3", folder: DRIVE + "12pAiUPKD-Z0vNn1gRAUNMuA65coYwTf0", tutors: ["Grace Lin"], purpose: "English booklets", active: true },
  { id: "dd4", folder: DRIVE + "1QpR3tYuI5oP7aS9dF2gH4jK6lZ8xC0vB", tutors: [], purpose: "Not yet in use", active: false },
];

export interface ClassSelectionRow {
  id: string;
  tutor: string;
  centre: string;
  subjects: string[];
  dates: string[];
  active: boolean;
}

export const CLASS_SELECTIONS: ClassSelectionRow[] = [
  { id: "cs1", tutor: "Priya Rao", centre: "Harrisdale SHS", subjects: ["Year 9 Science", "Year 9 Mathematics"], dates: ["21 Jul", "28 Jul", "4 Aug", "11 Aug", "18 Aug", "25 Aug"], active: true },
  { id: "cs2", tutor: "Priya Rao", centre: "Piara Waters", subjects: ["Year 10 Chemistry"], dates: ["25 Jul", "1 Aug", "8 Aug", "15 Aug"], active: true },
  { id: "cs3", tutor: "Tobi Okafor", centre: "Harrisdale SHS", subjects: ["Year 10 Mathematics", "Year 8 Mathematics"], dates: ["22 Jul", "29 Jul", "5 Aug", "12 Aug", "19 Aug"], active: true },
  { id: "cs4", tutor: "David Chen", centre: "Piara Waters", subjects: ["Year 7 Mathematics", "Year 7 English"], dates: ["25 Jul", "1 Aug", "8 Aug"], active: true },
  { id: "cs5", tutor: "Amira Hassan", centre: "Piara Waters", subjects: ["Year 9 Mathematics"], dates: ["20 Jul", "27 Jul"], active: false },
];

// ---------------------------------------------------------------------------
// Curriculum spine: year group -> subject -> topic.
//
// The live system keeps these three as separate masters with nothing joining
// them, which is why its Subject Master shows an empty Year Level on every row
// and its Classroom Map prints raw record ids where a year should be. Here a
// subject names its year group and a topic names its subject, so every row can
// say what it belongs to.
// ---------------------------------------------------------------------------

export interface YearGroup {
  id: string;
  name: string;
  year: string;
  active: boolean;
}

export const YEAR_GROUPS: YearGroup[] = [
  { id: "yg7", name: "Year 7 cohort", year: "Year 7", active: true },
  { id: "yg8", name: "Year 8 cohort", year: "Year 8", active: true },
  { id: "yg9", name: "Year 9 cohort", year: "Year 9", active: true },
  { id: "yg10", name: "Year 10 cohort", year: "Year 10", active: true },
  { id: "yg11", name: "Year 11 cohort", year: "Year 11", active: true },
  { id: "yg12", name: "Year 12 cohort", year: "Year 12", active: false },
];

export interface SubjectRow {
  id: string;
  name: string;
  year: string;
  area: "Mathematics" | "English" | "Science" | "Humanities";
  active: boolean;
}

export const SUBJECTS: SubjectRow[] = [
  { id: "sb1", name: "Year 7 Mathematics", year: "Year 7", area: "Mathematics", active: true },
  { id: "sb2", name: "Year 7 English", year: "Year 7", area: "English", active: true },
  { id: "sb3", name: "Year 7 Science", year: "Year 7", area: "Science", active: true },
  { id: "sb4", name: "Year 8 Mathematics", year: "Year 8", area: "Mathematics", active: true },
  { id: "sb5", name: "Year 8 English", year: "Year 8", area: "English", active: true },
  { id: "sb6", name: "Year 8 Science", year: "Year 8", area: "Science", active: true },
  { id: "sb7", name: "Year 9 Mathematics", year: "Year 9", area: "Mathematics", active: true },
  { id: "sb8", name: "Year 9 English", year: "Year 9", area: "English", active: true },
  { id: "sb9", name: "Year 9 Science", year: "Year 9", area: "Science", active: true },
  { id: "sb10", name: "Year 10 Mathematics", year: "Year 10", area: "Mathematics", active: true },
  { id: "sb11", name: "Year 10 English", year: "Year 10", area: "English", active: true },
  { id: "sb12", name: "Year 10 Science", year: "Year 10", area: "Science", active: true },
  { id: "sb13", name: "Year 11 Chemistry", year: "Year 11", area: "Science", active: true },
  { id: "sb14", name: "Year 11 Humanities", year: "Year 11", area: "Humanities", active: false },
];

export interface TopicRow {
  id: string;
  name: string;
  subject: string;
  year: string;
  description: string;
  active: boolean;
}

export const TOPICS: TopicRow[] = [
  { id: "tp1", name: "Algebraic techniques", subject: "Year 8 Mathematics", year: "Year 8", description: "Expanding, factorising and substituting into expressions.", active: true },
  { id: "tp2", name: "Linear relationships", subject: "Year 8 Mathematics", year: "Year 8", description: "Plotting, gradient and the equation of a straight line.", active: true },
  { id: "tp3", name: "Measurement and area", subject: "Year 8 Mathematics", year: "Year 8", description: "Perimeter, area and volume of composite shapes.", active: true },
  { id: "tp4", name: "Persuasive writing", subject: "Year 8 English", year: "Year 8", description: "TEACL paragraphs, rhetorical devices and audience.", active: true },
  { id: "tp5", name: "Text response", subject: "Year 8 English", year: "Year 8", description: "Reading closely and quoting with purpose.", active: true },
  { id: "tp6", name: "Chemical reactions", subject: "Year 8 Science", year: "Year 8", description: "Reactants, products and word equations.", active: true },
  { id: "tp7", name: "Body systems", subject: "Year 8 Science", year: "Year 8", description: "Circulatory, respiratory and digestive systems.", active: true },
  { id: "tp8", name: "Quadratics", subject: "Year 10 Mathematics", year: "Year 10", description: "Factorising, the quadratic formula and parabolas.", active: true },
  { id: "tp9", name: "Trigonometry", subject: "Year 10 Mathematics", year: "Year 10", description: "Right-angled triangles, sine and cosine rules.", active: true },
  { id: "tp10", name: "Organic pathways", subject: "Year 11 Chemistry", year: "Year 11", description: "Functional groups and reaction pathways.", active: true },
  { id: "tp11", name: "Equilibrium", subject: "Year 11 Chemistry", year: "Year 11", description: "Le Chatelier's principle and equilibrium constants.", active: true },
  { id: "tp12", name: "Statistics and probability", subject: "Year 9 Mathematics", year: "Year 9", description: "Standard deviation, spread and two-way tables.", active: false },
];

export interface Room {
  id: string;
  name: string;
  centre: string;
  capacity: number;
  notes: string;
  active: boolean;
}

export const ROOMS: Room[] = [
  { id: "rm1", name: "Room 1", centre: "Harrisdale SHS", capacity: 12, notes: "Projector and whiteboard", active: true },
  { id: "rm2", name: "Room 2", centre: "Harrisdale SHS", capacity: 12, notes: "Projector and whiteboard", active: true },
  { id: "rm3", name: "Room 3", centre: "Harrisdale SHS", capacity: 16, notes: "Largest room, used for mocks", active: true },
  { id: "rm4", name: "Room 4", centre: "Piara Waters", capacity: 12, notes: "", active: true },
  { id: "rm5", name: "Room 5", centre: "Piara Waters", capacity: 10, notes: "No projector", active: true },
  { id: "rm6", name: "Room 6", centre: "Willetton", capacity: 12, notes: "Shares a wall with reception", active: true },
  { id: "rm7", name: "Room 7", centre: "Willetton", capacity: 8, notes: "Small group and one to one", active: false },
];

export interface ClassroomMapRow {
  id: string;
  year: string;
  subject: string;
  rooms: string[];
  active: boolean;
}

export const CLASSROOM_MAP: ClassroomMapRow[] = [
  { id: "cm1", year: "Year 8", subject: "Year 8 Mathematics", rooms: ["Room 1", "Room 2", "Room 3"], active: true },
  { id: "cm2", year: "Year 8", subject: "Year 8 Science", rooms: ["Room 1", "Room 3"], active: true },
  { id: "cm3", year: "Year 8", subject: "Year 8 English", rooms: ["Room 2", "Room 4"], active: true },
  { id: "cm4", year: "Year 9", subject: "Year 9 Mathematics", rooms: ["Room 4", "Room 5"], active: true },
  { id: "cm5", year: "Year 10", subject: "Year 10 Mathematics", rooms: ["Room 3", "Room 6"], active: true },
  { id: "cm6", year: "Year 11", subject: "Year 11 Chemistry", rooms: [], active: false },
];

export interface CurriculumRow {
  id: string;
  year: string;
  subject: string;
  term: string;
  /** Week by week, in order. The live system truncates this to "(+2 more)". */
  weeks: string[];
  active: boolean;
}

export const CURRICULUM: CurriculumRow[] = [
  { id: "cu1", year: "Year 8", subject: "Year 8 English", term: "Term 3 2026", weeks: ["Grammar and sentence control", "Persuasive devices", "Building a TEACL paragraph", "Evidence and embedding quotes", "Counter-argument", "Full persuasive essay", "Editing and proofreading", "Assessment week"], active: true },
  { id: "cu2", year: "Year 8", subject: "Year 8 Mathematics", term: "Term 3 2026", weeks: ["Algebraic expansion", "Factorising", "Linear graphs", "Gradient and intercept", "Simultaneous equations", "Measurement", "Revision", "Assessment week"], active: true },
  { id: "cu3", year: "Year 8", subject: "Year 8 Science", term: "Term 3 2026", weeks: ["Particle model", "Chemical change", "Word equations", "Body systems", "Cells and tissues", "Practical report", "Revision", "Assessment week"], active: true },
  { id: "cu4", year: "Year 10", subject: "Year 10 Mathematics", term: "Term 3 2026", weeks: ["Quadratic factorising", "Quadratic formula", "Parabolas", "Trigonometry basics", "Sine and cosine rules", "Revision", "Assessment week"], active: true },
  { id: "cu5", year: "Year 11", subject: "Year 11 Chemistry", term: "Term 3 2026", weeks: ["Functional groups", "Reaction pathways", "Equilibrium", "Le Chatelier"], active: false },
];
