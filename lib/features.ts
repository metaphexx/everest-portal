// ============================================================
// New features from the buildout handoff, implemented with
// DETERMINISTIC stubs so they work with no ANTHROPIC_API_KEY
// (the "aiEnabled" preview-gate pattern from the hshs app).
// When a real key is wired in, swap scanOutline() / classifyMessage()
// for the Claude JSON-schema calls described in lib/outline.ts and
// lib/moderation.ts of the reference codebase.
// ============================================================

// ---------------------------------------------------------------
// FEATURE 1 - Student course outline + AI scan -> Assessment Tracker
// ---------------------------------------------------------------

export type OutlineStatus = "pending" | "done" | "failed";

export interface Assessment {
  id: string;
  name: string;
  type: string;
  week: number;
  due: string;
  weight: string; // editable by the student if the outline was vague
  score?: string; // student-entered result, e.g. "78%" or "34/40"
  done?: boolean; // marked complete by the student
}

/** Parse a student-entered score into a percentage (0-100), or null. */
export function scoreToPct(score: string | undefined): number | null {
  if (!score) return null;
  const s = score.trim();
  const frac = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac) {
    const denom = parseFloat(frac[2]);
    return denom > 0 ? Math.round((parseFloat(frac[1]) / denom) * 100) : null;
  }
  const pct = s.match(/^(\d+(?:\.\d+)?)\s*%?$/);
  if (pct) {
    const v = parseFloat(pct[1]);
    return v >= 0 && v <= 100 ? Math.round(v) : null;
  }
  return null;
}

/** Average of entered scores; weighted by assessment weight when parseable. */
export function outlineAverage(assessments: Assessment[]): number | null {
  let wSum = 0;
  let wTotal = 0;
  let plain: number[] = [];
  for (const a of assessments) {
    const pct = scoreToPct(a.score);
    if (pct === null) continue;
    plain.push(pct);
    const w = parseFloat((a.weight || "").replace("%", ""));
    if (!isNaN(w) && w > 0) {
      wSum += pct * w;
      wTotal += w;
    }
  }
  if (plain.length === 0) return null;
  return wTotal > 0 ? Math.round(wSum / wTotal) : Math.round(plain.reduce((x, y) => x + y, 0) / plain.length);
}

export interface WeekTopic {
  week: number;
  topic: string;
}

export interface Outline {
  id: string;
  subject: string;
  term: string;
  fileName: string;
  uploadedAt: string;
  status: OutlineStatus;
  courseId?: string | null; // portal course this outline is linked to (2-way sync with the course page)
  assessments: Assessment[];
  topics: WeekTopic[];
}

/** Map a school subject to the portal course it most likely belongs to. */
export function subjectToCourse(subject: string): string | null {
  const s = subject.toLowerCase();
  if (s.includes("chem")) return "chem";
  if (s.includes("english") || s.includes("literature") || s.includes("verbal")) return "verbal";
  if (s.includes("gate") || s.includes("math")) return "gate";
  return null;
}

export const OUTLINE_SUBJECTS = [
  "Chemistry ATAR",
  "Mathematics Methods ATAR",
  "English ATAR",
  "Physics ATAR",
  "Human Biology ATAR",
  "Other subject",
];

interface SubjectTemplate {
  assessments: Omit<Assessment, "due" | "id">[];
  topics: string[];
}

// Deterministic per-subject content. A real scan would read the uploaded file;
// this stub returns a stable, plausible schedule keyed off the chosen subject.
const TEMPLATES: Record<string, SubjectTemplate> = {
  chemistry: {
    assessments: [
      { name: "Practical: Rates of reaction", type: "Practical", week: 3, weight: "10%" },
      { name: "Test 1: Chemical equilibrium", type: "Test", week: 5, weight: "15%" },
      { name: "Investigation: Organic pathways", type: "Assignment", week: 8, weight: "20%" },
      { name: "Semester examination", type: "Exam", week: 14, weight: "30%" },
    ],
    topics: [
      "Reaction rates and collision theory",
      "Chemical equilibrium and Le Chatelier",
      "Acids, bases and buffers",
      "Redox and electrochemistry",
      "Organic families and nomenclature",
      "Reaction mechanisms",
      "Analytical techniques",
      "Exam revision and past papers",
    ],
  },
  mathematics: {
    assessments: [
      { name: "Test 1: Calculus", type: "Test", week: 4, weight: "15%" },
      { name: "Investigation: Applications of integration", type: "Assignment", week: 7, weight: "20%" },
      { name: "Test 2: Statistics", type: "Test", week: 10, weight: "15%" },
      { name: "Semester examination", type: "Exam", week: 14, weight: "40%" },
    ],
    topics: [
      "Differentiation techniques",
      "Applications of differentiation",
      "Integration and the fundamental theorem",
      "Applications of integration",
      "Discrete random variables",
      "The binomial distribution",
      "Continuous random variables",
      "Exam revision",
    ],
  },
  english: {
    assessments: [
      { name: "Analytical essay: Text 1", type: "Assignment", week: 3, weight: "15%" },
      { name: "Oral presentation", type: "Oral", week: 6, weight: "15%" },
      { name: "Creative response", type: "Assignment", week: 9, weight: "20%" },
      { name: "Semester examination", type: "Exam", week: 14, weight: "30%" },
    ],
    topics: [
      "Close reading and analysis",
      "Perspectives and representation",
      "Genre conventions",
      "Constructing argument",
      "Creating for audience and purpose",
      "Comparative study",
      "Language and style",
      "Exam preparation",
    ],
  },
  physics: {
    assessments: [
      { name: "Practical: Projectile motion", type: "Practical", week: 3, weight: "10%" },
      { name: "Test 1: Motion and forces", type: "Test", week: 5, weight: "15%" },
      { name: "Investigation: Electromagnetism", type: "Assignment", week: 9, weight: "20%" },
      { name: "Semester examination", type: "Exam", week: 14, weight: "30%" },
    ],
    topics: [
      "Motion and forces",
      "Momentum and energy",
      "Gravity and orbits",
      "Electric fields and circuits",
      "Magnetism and induction",
      "Waves and the particle model",
      "Nuclear and standard model",
      "Exam revision",
    ],
  },
  default: {
    assessments: [
      { name: "Assessment 1", type: "Test", week: 4, weight: "15%" },
      { name: "Assessment 2", type: "Assignment", week: 8, weight: "20%" },
      { name: "Assessment 3", type: "Project", week: 11, weight: "20%" },
      { name: "Semester examination", type: "Exam", week: 14, weight: "35%" },
    ],
    topics: [
      "Unit 1 foundations",
      "Unit 1 applications",
      "Unit 2 core concepts",
      "Unit 2 extension",
      "Consolidation",
      "Assessment preparation",
      "Revision",
      "Examination revision",
    ],
  },
};

function templateFor(subject: string): SubjectTemplate {
  const s = subject.toLowerCase();
  if (s.includes("chem")) return TEMPLATES.chemistry;
  if (s.includes("math")) return TEMPLATES.mathematics;
  if (s.includes("english")) return TEMPLATES.english;
  if (s.includes("physic")) return TEMPLATES.physics;
  return TEMPLATES.default;
}

// Term start Mondays used to turn a week number into a due date.
const TERM_START: Record<string, string> = {
  "Term 1": "2026-02-02",
  "Term 2": "2026-04-20",
  "Term 3": "2026-07-13",
  "Term 4": "2026-10-12",
};

function dueForWeek(term: string, week: number): string {
  const start = TERM_START[term] || TERM_START["Term 3"];
  const d = new Date(start + "T12:00:00");
  d.setDate(d.getDate() + (week - 1) * 7 + 4); // Friday of that teaching week
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/** Deterministic "AI scan" of an uploaded outline. */
export function scanOutline(subject: string, term: string): { assessments: Assessment[]; topics: WeekTopic[] } {
  const tpl = templateFor(subject);
  const t = term || "Term 3";
  const stamp = Date.now().toString(36);
  return {
    assessments: tpl.assessments.map((a, i) => ({ ...a, id: "as-" + stamp + "-" + i, due: dueForWeek(t, a.week) })),
    topics: tpl.topics.map((topic, i) => ({ week: i + 1, topic })),
  };
}

export function seedOutlines(): Outline[] {
  const scan = scanOutline("Chemistry ATAR", "Term 3");
  // Seed one completed assessment with a score so the average and the
  // tutor-visible progress have something to show on first load.
  const assessments = scan.assessments.map((a, i) => (i === 0 ? { ...a, done: true, score: "82%" } : a));
  return [
    {
      id: "seed-chem",
      subject: "Chemistry ATAR",
      term: "Term 3",
      fileName: "Chemistry_Unit3_Outline.pdf",
      uploadedAt: "28 Jun",
      status: "done",
      courseId: "chem",
      assessments,
      topics: scan.topics,
    },
  ];
}

// ---------------------------------------------------------------
// FEATURE 2 - Message your tutor, AI-monitored
// ---------------------------------------------------------------

export type FlagCategory = "none" | "poaching" | "abuse" | "safeguarding" | "principle";
export type Severity = "low" | "medium" | "high";

export interface Classification {
  category: FlagCategory;
  severity: Severity;
  reason: string;
  // For a student sender: held content shows a gentle "may be reviewed" state
  // rather than being silently dropped; safeguarding is always delivered.
  held: boolean;
  safeguarding: boolean;
}

const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/;

/** Deterministic moderation classifier (stub for lib/moderation.ts). */
export function classifyMessage(text: string): Classification {
  const t = text.toLowerCase();

  const safeguardingHits = ["unsafe", "scared", "hurt myself", "hurt", "harm", "abuse at home", "can't cope", "cant cope", "help me", "bullied", "depressed", "not safe"];
  // Negated-safety phrasing ("don't feel safe", "never feel safe at home").
  const SAFETY_NEGATION_RE = /(don'?t|do not|doesn'?t|never|not|no longer)\s+(really\s+)?(feel|feeling)\s+(very\s+)?safe/;
  if (safeguardingHits.some((w) => t.includes(w)) || SAFETY_NEGATION_RE.test(t)) {
    return { category: "safeguarding", severity: "high", reason: "Possible wellbeing or safeguarding concern", held: false, safeguarding: true };
  }

  const poachingHits = ["whatsapp", "my number", "call me directly", "pay me", "cash", "outside the platform", "off platform", "private lesson", "venmo", "paypal", "bank transfer", "snapchat", "instagram", "discount if you book direct"];
  const poaching = poachingHits.some((w) => t.includes(w)) || PHONE_RE.test(text);
  if (poaching) {
    return { category: "poaching", severity: "high", reason: "Looks like an attempt to move payment or contact off the platform", held: true, safeguarding: false };
  }

  const abuseHits = ["idiot", "stupid", "hate you", "shut up", "useless", "loser"];
  if (abuseHits.some((w) => t.includes(w))) {
    return { category: "abuse", severity: "medium", reason: "Language that may breach the respectful-communication policy", held: true, safeguarding: false };
  }

  const principleHits = ["do it for me", "just give me the answer", "cheat", "share the answers", "refund"];
  if (principleHits.some((w) => t.includes(w))) {
    return { category: "principle", severity: "low", reason: "May touch an academic-integrity or policy principle", held: false, safeguarding: false };
  }

  return { category: "none", severity: "low", reason: "", held: false, safeguarding: false };
}

export function categoryColor(cat: FlagCategory): { color: string; bg: string; label: string } {
  switch (cat) {
    case "safeguarding": return { color: "#E04141", bg: "rgba(224,65,65,.12)", label: "Safeguarding" };
    case "poaching": return { color: "#B27908", bg: "rgba(245,166,35,.16)", label: "Off-platform" };
    case "abuse": return { color: "#E04141", bg: "rgba(224,65,65,.12)", label: "Conduct" };
    case "principle": return { color: "#007ECC", bg: "rgba(0,157,255,.12)", label: "Policy" };
    default: return { color: "#66707F", bg: "rgba(0,32,63,.06)", label: "" };
  }
}
