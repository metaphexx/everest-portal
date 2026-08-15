// Elliot for tutors.
//
// The student's Elliot answers questions. A tutor's job is different: they are
// deciding what to give which student next, and the portal already holds the
// evidence to propose it - each student's school outline (what is coming up and
// when), their scores so far, and a Drive of booklets tagged by topic.
//
// So this is not a chat box. It derives concrete, one-tap suggestions:
//   - assign a booklet that matches a student's next assessment
//   - assign a practice paper when that assessment is a test or exam
//   - flag a student whose average has dropped
//
// Everything here is derived, never invented: each suggestion names the
// assessment or score it came from, so a tutor can see why it was raised.

import { Assessment, outlineAverage } from "./features";
import {
  DRIVE_FILES,
  DriveFile,
  MaterialKind,
  SharedOutline,
  Submission,
  TUTOR_COURSES,
  TUTOR_COURSE_ORDER,
  TutorCourseId,
  outlineRoster,
} from "./tutor-data";

/** Below this weighted average a student is flagged as needing attention. */
export const LOW_SCORE_PCT = 60;

export interface TutorSuggestion {
  id: string;
  kind: "assign" | "practice" | "alert";
  student: string;
  courseId: TutorCourseId;
  courseName: string;
  /** One line the tutor reads to decide. */
  title: string;
  /** Why this was raised - always traceable to real data. */
  reason: string;
  /** Present on assign/practice: what a tap would hand over. */
  file?: DriveFile;
  materialKind?: MaterialKind;
}

const STOP = new Set(["the", "and", "of", "a", "an", "for", "in", "on", "to", "test", "exam", "assessment", "task", "investigation", "practical", "report", "quiz", "unit"]);

/** Words worth matching a booklet against, taken from an assessment's name. */
function keyWords(a: Assessment): string[] {
  return a.name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

/** Best-matching Drive file for an assessment, or null when nothing fits. */
function matchFile(a: Assessment, prefer: "practice" | "topic"): DriveFile | null {
  const words = keyWords(a);
  if (words.length === 0) return null;
  let best: { file: DriveFile; score: number } | null = null;
  for (const f of DRIVE_FILES) {
    const hay = (f.name + " " + f.topics.join(" ")).toLowerCase();
    let score = words.reduce((n, w) => n + (hay.includes(w) ? 10 : 0), 0);
    if (score === 0) continue;
    const isPractice = /practice|past|timed|revision|exam/.test(hay);
    // A practice paper is the right answer before a test, and the wrong one
    // when the student just needs to learn the topic.
    score += prefer === "practice" ? (isPractice ? 14 : 0) : isPractice ? -6 : 6;
    if (!best || score > best.score) best = { file: f, score };
  }
  return best ? best.file : null;
}

/** The next assessment a student has not ticked off. */
function nextAssessment(assessments: Assessment[]): Assessment | null {
  return assessments.find((a) => !a.done) ?? null;
}

export function tutorSuggestions(outlines: SharedOutline[], submissions: Submission[], limit = 6): TutorSuggestion[] {
  const out: TutorSuggestion[] = [];

  for (const cid of TUTOR_COURSE_ORDER) {
    const cd = TUTOR_COURSES[cid];
    // In-person students have no login, so there is nothing to assign them.
    if (cd.delivery !== "online") continue;

    for (const entry of outlineRoster(cid, outlines)) {
      const outline = entry.outline;
      if (!outline || outline.status !== "done") continue;

      const avg = outlineAverage(outline.assessments);
      if (avg !== null && avg < LOW_SCORE_PCT) {
        out.push({
          id: "alert:" + cid + ":" + entry.name,
          kind: "alert",
          student: entry.name,
          courseId: cid,
          courseName: cd.name,
          title: entry.name + " is averaging " + avg + "% in " + outline.subject,
          reason: "Across " + outline.assessments.filter((a) => a.score).length + " marked assessments in their school outline. Worth a check-in before the next one.",
        });
      }

      const next = nextAssessment(outline.assessments);
      if (!next) continue;

      const wantsPractice = /test|exam|paper/i.test(next.type) || /test|exam/i.test(next.name);
      const file = matchFile(next, wantsPractice ? "practice" : "topic");
      if (!file) continue;

      out.push({
        id: (wantsPractice ? "practice:" : "assign:") + cid + ":" + entry.name + ":" + file.id,
        kind: wantsPractice ? "practice" : "assign",
        student: entry.name,
        courseId: cid,
        courseName: cd.name,
        title: (wantsPractice ? "Set a practice paper for " : "Assign a booklet to ") + entry.name,
        reason:
          file.name +
          " matches " + next.name +
          " (" + next.type.toLowerCase() + ", week " + next.week + ", " + next.weight + ", due " + next.due + ").",
        file,
        materialKind: wantsPractice ? "worksheet" : "booklet",
      });
    }
  }

  // Low scores first - they need a person, not a file.
  const order = { alert: 0, practice: 1, assign: 2 };
  return out.sort((a, b) => order[a.kind] - order[b.kind]).slice(0, limit);
}

/** Marked work that came back weak, so a tutor can follow it up. */
export function weakSubmissions(submissions: Submission[]): Submission[] {
  return submissions.filter((s) => s.marked && (s.grade === "D" || s.grade === "Needs review"));
}

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------
//
// Suggestions are derived locally and cost nothing, so they are unlimited. A
// free-text question is a model call, so it is rationed - see TUTOR_ELLIOT_*
// below and the counter in lib/tutor-store.tsx. Every answer here is built from
// the same real data the suggestions use; Elliot never invents a student, a
// score or a booklet.

/** How many suggestion cards are shown before "Show more". */
export const SUGGESTIONS_PER_BATCH = 3;

export interface TutorAskContext {
  outlines: SharedOutline[];
  submissions: Submission[];
  toMarkCount: number;
  pendingRequests: number;
}

export interface TutorAskAction {
  label: string;
  href: string;
}

export interface TutorAskAnswer {
  text: string;
  actions?: TutorAskAction[];
}

/** Everyone with a completed outline, newest data first. */
function studentsWithOutlines(outlines: SharedOutline[]) {
  const rows: { name: string; courseId: TutorCourseId; courseName: string; outline: SharedOutline; avg: number | null }[] = [];
  for (const cid of TUTOR_COURSE_ORDER) {
    if (TUTOR_COURSES[cid].delivery !== "online") continue;
    for (const e of outlineRoster(cid, outlines)) {
      if (!e.outline || e.outline.status !== "done") continue;
      rows.push({ name: e.name, courseId: cid, courseName: TUTOR_COURSES[cid].name, outline: e.outline, avg: outlineAverage(e.outline.assessments) });
    }
  }
  return rows;
}

function findStudent(q: string, outlines: SharedOutline[]) {
  const rows = studentsWithOutlines(outlines);
  const ql = q.toLowerCase();
  return rows.find((r) => ql.includes(r.name.toLowerCase().split(" ")[0]) || ql.includes(r.name.toLowerCase())) ?? null;
}

/**
 * Answer a tutor's question from portal data. Deterministic stand-in for a model
 * call - same signature, so swapping in a real one changes nothing above it.
 */
export function tutorElliotReply(question: string, ctx: TutorAskContext): TutorAskAnswer {
  const q = question.trim().toLowerCase();
  const rows = studentsWithOutlines(ctx.outlines);
  const named = findStudent(q, ctx.outlines);

  // A named student: everything known about how they are travelling.
  if (named) {
    const next = named.outline.assessments.find((a) => !a.done);
    const marked = named.outline.assessments.filter((a) => a.score);
    const bits = [
      named.name + " is in " + named.courseName + ".",
      named.avg !== null
        ? "Weighted average " + named.avg + "% across " + marked.length + " marked assessment" + (marked.length === 1 ? "" : "s") + "."
        : "No marks recorded in their outline yet.",
      next
        ? "Next up: " + next.name + " (" + next.type.toLowerCase() + ", week " + next.week + ", " + next.weight + ", due " + next.due + ")."
        : "Nothing outstanding in their outline.",
    ];
    if (named.avg !== null && named.avg < LOW_SCORE_PCT) bits.push("That is below " + LOW_SCORE_PCT + "%, so they are worth a check-in.");
    return {
      text: bits.join(" "),
      actions: [{ label: "Open " + named.courseName, href: "/tutor/courses/" + named.courseId }, { label: "Message " + named.name.split(" ")[0], href: "/tutor/messages" }],
    };
  }

  if (/strug|behind|low|worried|risk|failing|weak/.test(q)) {
    const low = rows.filter((r) => r.avg !== null && r.avg < LOW_SCORE_PCT).sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));
    if (low.length === 0) return { text: "Nobody is under " + LOW_SCORE_PCT + "% right now. The lowest is " + (rows.length ? rows.slice().sort((a, b) => (a.avg ?? 100) - (b.avg ?? 100))[0].name + " at " + rows.slice().sort((a, b) => (a.avg ?? 100) - (b.avg ?? 100))[0].avg + "%." : "not recorded yet.") };
    return {
      text: low.map((r) => r.name + " (" + r.avg + "% in " + r.courseName + ")").join(", ") + ". Worth a check-in before their next assessment.",
      actions: [{ label: "Student outlines", href: "/tutor/outlines" }],
    };
  }

  if (/assign|give|set|next|what should/.test(q)) {
    const s = tutorSuggestions(ctx.outlines, ctx.submissions, 3);
    const assignable = s.filter((x) => x.file);
    if (assignable.length === 0) return { text: "Nothing obvious to assign right now. Once students record scores or their next assessment gets closer I will have something concrete.", actions: [{ label: "My Booklets", href: "/tutor/booklets" }] };
    return {
      text: assignable.map((x) => x.student + ": " + x.file!.name).join("; ") + ". They are on the Suggestions tab with a one-tap assign.",
    };
  }

  if (/mark|marking|feedback|submissions/.test(q)) {
    return {
      text: ctx.toMarkCount === 0 ? "Nothing waiting to be marked." : ctx.toMarkCount + " piece" + (ctx.toMarkCount === 1 ? "" : "s") + " of work waiting on your feedback. You can annotate straight in the portal and send the marked copy back.",
      actions: [{ label: "Open Marking", href: "/tutor/grade" }],
    };
  }

  if (/outline|uploaded|missing/.test(q)) {
    const missing: string[] = [];
    for (const cid of TUTOR_COURSE_ORDER) {
      if (TUTOR_COURSES[cid].delivery !== "online") continue;
      for (const e of outlineRoster(cid, ctx.outlines)) if (e.status === "missing") missing.push(e.name);
    }
    return {
      text: missing.length === 0 ? "Everyone in your online classes has shared an outline." : missing.length + " student" + (missing.length === 1 ? " has" : "s have") + " not shared a school outline yet: " + missing.slice(0, 6).join(", ") + (missing.length > 6 ? " and others" : "") + ".",
      actions: [{ label: "Student outlines", href: "/tutor/outlines" }],
    };
  }

  if (/print|booklet request|approval|cart/.test(q)) {
    return {
      text: ctx.pendingRequests === 0 ? "No booklet requests awaiting approval." : ctx.pendingRequests + " booklet request" + (ctx.pendingRequests === 1 ? "" : "s") + " awaiting approval. Printing is for in-person classes only.",
      actions: [{ label: "My Requests", href: "/tutor/requests" }],
    };
  }

  return {
    text: "I can help with what to assign, who is falling behind, what is waiting to be marked, and who still owes an outline. Ask about a student by name and I will pull together their marks and what is coming up.",
    actions: [{ label: "See suggestions", href: "" }],
  };
}
