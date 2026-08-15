// ============================================================
// AI portal search. Deterministic stand-in for an embedding
// search: synonym expansion + fuzzy token matching + weighted
// ranking across everything in the portal, plus direct answers
// for question-shaped queries. Swap rankSearch() for a real
// vector search when the backend lands.
// ============================================================

import { SEARCH_ITEMS, TUTOR_FILES, BASE_SUBMISSIONS, libAll, gradeBase, wsBase, COURSE_DEFS } from "./data";
import { Outline } from "./features";
import { Indexable, rank } from "./search-core";

export interface SearchHit {
  name: string;
  meta: string;
  color: string;
  page: string;
  score: number;
}

export interface SearchAnswer {
  text: string;
  page: string;
  label: string;
}

export interface SearchResponse {
  answer: SearchAnswer | null;
  hits: SearchHit[];
}




/** Build the live index: static items + everything dynamic the student owns. */
function buildIndex(outlines: Outline[], dueCount: number): Indexable[] {
  const idx: Indexable[] = [...SEARCH_ITEMS];
  // courses -> their real pages
  (Object.keys(COURSE_DEFS) as (keyof typeof COURSE_DEFS)[]).forEach((cid) => {
    const cd = COURSE_DEFS[cid];
    idx.push({ name: cd.name, meta: "Course · " + cd.tutor + " · " + cd.sched, color: "#7A5AF8", page: "/courses/" + cid });
  });
  wsBase().forEach((w) => idx.push({ name: w.name, meta: "Worksheet · " + w.due, color: "#E04141", page: "/drive" }));
  gradeBase().forEach((g) => idx.push({ name: g.wsName, meta: "My Grades · " + g.grade + (g.graded ? "" : " pending"), color: "#22A05B", page: "/grades" }));
  libAll().forEach((r) => idx.push({ name: r.name, meta: "Library · " + r.meta, color: r.color, page: "/library" }));
  TUTOR_FILES.forEach((f) => idx.push({ name: f.name, meta: "My Drive · from " + f.from, color: f.color, page: "/drive" }));
  BASE_SUBMISSIONS.forEach((f) => idx.push({ name: f.name, meta: "My Drive · " + f.kind, color: f.color, page: "/drive" }));
  outlines.forEach((o) => {
    idx.push({ name: o.subject + " outline", meta: "Assessment Tracker · " + o.term, color: "#7A5AF8", page: o.courseId ? "/courses/" + o.courseId : "/outline" });
    o.assessments.forEach((a) =>
      idx.push({ name: a.name, meta: "Assessment · Wk " + a.week + " · " + a.weight + (a.score ? " · you got " + a.score : ""), color: "#007ECC", page: "/outline" })
    );
  });
  // Every destination in the nav, so search works as navigation and not only as
  // a content lookup. "classroom" and "courses" previously returned nothing.
  idx.push(
    { name: "Dashboard", meta: "Page · your day at a glance", color: "#009DFF", page: "/", keywords: "home overview today", boost: 30 },
    { name: "My Courses", meta: "Page · everything you are enrolled in", color: "#7A5AF8", page: "/courses", keywords: "classes subjects enrolled", boost: 30 },
    { name: "Timetable", meta: "Page · your classes this term", color: "#0E9C8E", page: "/timetable", keywords: "calendar schedule when sessions", boost: 30 },
    { name: "Classroom", meta: "Page · class stream, resources and questions", color: "#7A5AF8", page: "/classroom/chem11", keywords: "posts announcements discussion stream chemistry", boost: 30 },
    { name: "Library", meta: "Page · notes, recordings and worksheets", color: "#D68910", page: "/library", keywords: "materials resources recordings notes", boost: 30 },
    { name: "My Drive", meta: "Page · your uploads and shared files", color: "#7A5AF8", page: "/drive", keywords: "upload submit files worksheets", boost: 30 },
    { name: "My Grades", meta: "Page · marks and tutor feedback", color: "#22A05B", page: "/grades", keywords: "marks results feedback marked", boost: 30 },
    { name: "Message a Tutor", meta: "Page · monitored messages", color: "#009DFF", page: "/messages", keywords: "chat contact dm conversation", boost: 30 },
    { name: "Everest Support", meta: "Message the Everest team", color: "#00203F", page: "/messages", keywords: "help office admin billing" },
    { name: "Support requests", meta: "Page · track your requests", color: "#1B8049", page: "/support", keywords: "help problem issue report", boost: 20 },
    { name: "Chat with Elliot", meta: "Page · AI study help", color: "#009DFF", page: "/chat", keywords: "ask question tutor bot help", boost: 20 },
    { name: "Assessment Tracker", meta: "Page · outlines and scores", color: "#7A5AF8", page: "/outline", keywords: "school outline assessments weights due", boost: 30 },
    { name: "Settings", meta: "Page · profile and login", color: "#66707F", page: "/settings", keywords: "account password profile sign out notifications", boost: 30 },
    { name: "You have " + dueCount + " worksheets due", meta: "Dashboard · submit from My Drive", color: "#E04141", page: "/drive" }
  );
  // The static seed list and the live index both describe some of the same
  // things (a course, an uploaded outline), so "chemistry" was returning
  // "Chemistry" twice and inflating the result count. Same name pointing at the
  // same page is the same result - keep whichever entry says more.
  const byKey = new Map<string, Indexable>();
  for (const item of idx) {
    // Key on the name plus the CATEGORY (the bit before the first "·"), not the
    // page: the seed entry and the live one often route differently while
    // describing the same thing.
    const k = item.name.toLowerCase() + "|" + item.meta.split("·")[0].trim().toLowerCase();
    const seen = byKey.get(k);
    if (!seen || item.meta.length > seen.meta.length) byKey.set(k, item);
  }
  return [...byKey.values()];
}

/** Question-shaped queries get a direct answer row above the results. */
function directAnswer(q: string, outlines: Outline[], dueCount: number): SearchAnswer | null {
  const t = q.toLowerCase();
  if (/(what|which|anything).*(due|submit|homework)|^due|worksheets? due/.test(t)) {
    return { text: dueCount === 0 ? "Nothing is due right now. You are all caught up." : "You have " + dueCount + " worksheets to submit. The Whole Numbers Topic Test (Saturday) is the most urgent.", page: "/drive", label: "Open My Drive" };
  }
  if (/next (class|session|lesson)|when.*(class|session|lesson)/.test(t)) {
    return { text: "Your next class is Organic Chemistry tonight at 7:00 pm with Priya Rao.", page: "/timetable", label: "Open Timetable" };
  }
  if (/(next|upcoming).*(assessment|test|exam)|assessment.*(next|when)/.test(t)) {
    const next = outlines.flatMap((o) => o.assessments).filter((a) => !a.done)[0];
    return next
      ? { text: "Next assessment: " + next.name + " in week " + next.week + " (" + next.due + ", " + next.weight + ").", page: "/outline", label: "Open tracker" }
      : { text: "No upcoming assessments in your outlines yet. Upload an outline and Elliot will map them.", page: "/outline", label: "Upload outline" };
  }
  if (/average|how am i (doing|going)|my progress/.test(t)) {
    return { text: "Your Chemistry assessment average and full progress live in the Assessment Tracker; worksheet grades are under My Grades.", page: "/outline", label: "See progress" };
  }
  if (/who.*(teach|tutor)|my tutors?$/.test(t)) {
    return { text: "Your tutors: Priya Rao (Chemistry), Grace Lin (Verbal Reasoning) and David Chen (GATE). You can message any of them.", page: "/messages", label: "Message a tutor" };
  }
  return null;
}

export function aiSearch(q: string, outlines: Outline[], dueCount: number, limit = 6): SearchResponse {
  const raw = q.trim().toLowerCase();
  if (!raw) return { answer: null, hits: [] };
  const hits = rank(buildIndex(outlines, dueCount), raw, limit * 3)
    // de-dupe by name+page keeping the best score
    .filter((h, i, arr) => arr.findIndex((x) => x.name === h.name && x.page === h.page) === i)
    .slice(0, limit);
  return { answer: directAnswer(raw, outlines, dueCount), hits };
}
