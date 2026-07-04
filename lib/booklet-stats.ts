// Booklet statistics for the tutor trackers (dashboard overall + per in-person
// course). Produces an 8-week cumulative time series for requested / approved /
// rejected / supplied booklets, plus the end-of-term counters.
//
// Unit = individual printed COPIES, not distinct titles. A request for "9 x
// Organic pathways" counts as 9 towards requested and, once printed, 9 towards
// supplied - so "Supplied" answers "how many booklets were actually printed".
//
// Model: a deterministic "term to date" baseline gives the line its shape (the
// seed data only carries a handful of requests, which would draw a near-flat
// line), and the tutor's LIVE requests are added onto the final week - so the
// chart looks like a real term and the last point visibly rises whenever a new
// booklet request is sent from the cart.

import { BookletRequest, TutorCourseId } from "./tutor-data";

export interface BookletSeries {
  labels: string[];
  requested: number[];
  approved: number[];
  rejected: number[];
  supplied: number[];
  totals: { requested: number; approved: number; rejected: number; supplied: number };
}

// Smooth-ish rising fractions across 8 weekly points (ends at 1 = full total).
const FRAC = [0.14, 0.27, 0.4, 0.52, 0.63, 0.75, 0.87, 1];

function weekLabels(): string[] {
  // Eight consecutive Mondays ending on the week of the demo "today" (4 Jul 2026).
  const end = new Date("2026-06-30T12:00:00"); // Tuesday of the current week; label by date
  const out: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 7 * 86400000);
    out.push(d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }));
  }
  return out;
}

// Count individual copies: sum every line-item's quantity across matching
// requests (a request for 9 copies of a booklet counts as 9, not 1).
function copyCount(reqs: BookletRequest[], pred: (r: BookletRequest) => boolean): number {
  return reqs.filter(pred).reduce((n, r) => n + r.items.reduce((c, it) => c + (it.qty || 1), 0), 0);
}

export type BookletTrackerMode = "cumulative" | "weekly";

/**
 * @param requests all booklet requests from the store
 * @param courseId when set, scopes the series to one in-person course (its
 *        classId prefix); otherwise the whole practice.
 * @param mode "cumulative" = running term total (line keeps rising);
 *        "weekly" = how many in each week (per-period counts, not cumulative).
 *        The counters always report the term totals regardless of mode.
 */
export function bookletSeries(requests: BookletRequest[], courseId?: TutorCourseId, mode: BookletTrackerMode = "cumulative"): BookletSeries {
  const scoped = courseId ? requests.filter((r) => r.classId?.startsWith(courseId + ":")) : requests;

  // Live totals from real requests, in individual printed copies.
  const live = {
    requested: copyCount(scoped, () => true),
    approved: copyCount(scoped, (r) => r.approval === "approved"),
    rejected: copyCount(scoped, (r) => r.approval === "rejected"),
    supplied: copyCount(scoped, (r) => r.printing === "completed"),
  };

  // Deterministic "term so far" baseline for line shape, in copies (kept
  // ordered: requested >= approved >= supplied, small rejected). Copy counts
  // are class-sized, so an in-person course prints dozens over a term.
  const base = courseId
    ? { requested: 58, approved: 48, rejected: 6, supplied: 41 }
    : { requested: 214, approved: 182, rejected: 22, supplied: 156 };

  // Cumulative (running total) arrays - the baseline shape plus live totals on
  // the final week.
  const buildCumulative = (metric: keyof typeof base) =>
    FRAC.map((f, i) => Math.round(base[metric] * f) + (i === FRAC.length - 1 ? live[metric] : 0));

  // Per-week counts = the increment between consecutive cumulative points.
  const toWeekly = (cum: number[]) => cum.map((v, i) => (i === 0 ? v : Math.max(0, v - cum[i - 1])));

  const cum = {
    requested: buildCumulative("requested"),
    approved: buildCumulative("approved"),
    rejected: buildCumulative("rejected"),
    supplied: buildCumulative("supplied"),
  };

  const plot = mode === "weekly"
    ? { requested: toWeekly(cum.requested), approved: toWeekly(cum.approved), rejected: toWeekly(cum.rejected), supplied: toWeekly(cum.supplied) }
    : cum;

  return {
    labels: weekLabels(),
    requested: plot.requested,
    approved: plot.approved,
    rejected: plot.rejected,
    supplied: plot.supplied,
    // Counters always show the term total (the cumulative end point).
    totals: {
      requested: cum.requested[cum.requested.length - 1],
      approved: cum.approved[cum.approved.length - 1],
      rejected: cum.rejected[cum.rejected.length - 1],
      supplied: cum.supplied[cum.supplied.length - 1],
    },
  };
}

export const BOOKLET_SERIES_COLORS = {
  requested: "var(--accent-violet)",
  approved: "var(--brand-500)",
  rejected: "var(--danger-500)",
  supplied: "var(--success-500)",
};
