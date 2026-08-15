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
