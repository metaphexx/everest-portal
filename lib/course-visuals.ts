// ============================================================
// Shared course photo + colour-overlay assignment.
//
// A course's card art (landscape/space photo + gradient wash) is derived
// from a single canonical key - the same key the tutor portal and student
// portal both use for the same real-world class - so the two portals are
// guaranteed to render an identical look for a shared course. Whenever a
// new course id shows up, its look is picked deterministically from the
// pool below (a hash of the key selects the photo and the gradient), so it
// never has to be hand-picked, and it never changes across reloads.
// ============================================================

/** All real photos (Unsplash + the 6 originals) - 24 total. The 6 named
    courses pin their own photo explicitly (see lib/tutor-data.ts / lib/data.ts);
    this pool is what a NEW course draws from when none is hand-picked. */
export const COURSE_PHOTO_POOL: string[] = [
  "/courses/chem.jpg",
  "/courses/verbal.jpg",
  "/courses/gate.jpg",
  "/courses/sci9.jpg",
  "/courses/found10.jpg",
  "/courses/block8.jpg",
  "/courses/mtn-lake-dawn.jpg",
  "/courses/misty-peaks.jpg",
  "/courses/mountain-night.jpg",
  "/courses/alpine-lake.jpg",
  "/courses/snow-range.jpg",
  "/courses/green-hills.jpg",
  "/courses/valley-road.jpg",
  "/courses/lake-reflection.jpg",
  "/courses/forest-fog.jpg",
  "/courses/forest-sun.jpg",
  "/courses/autumn-forest.jpg",
  "/courses/desert-dunes.jpg",
  "/courses/coastal-cliffs.jpg",
  "/courses/milky-way.jpg",
  "/courses/starry-night.jpg",
  "/courses/nebula-sky.jpg",
  "/courses/aurora.jpg",
  "/courses/galaxy-core.jpg",
];

/** Curated gradient washes (same visual language as the app's existing course
    heroes) - randomising among these rather than raw RGB keeps every result
    on-brand instead of occasionally garish. */
export const COURSE_OVERLAY_POOL: string[] = [
  "linear-gradient(165deg,rgba(122,90,248,.45) 0%,rgba(64,44,158,.62) 45%,rgba(0,32,63,.94) 100%)", // violet
  "linear-gradient(165deg,rgba(18,181,165,.42) 0%,rgba(11,110,99,.6) 45%,rgba(4,54,48,.94) 100%)", // teal
  "linear-gradient(165deg,rgba(245,166,35,.45) 0%,rgba(178,108,14,.6) 45%,rgba(58,38,3,.94) 100%)", // amber
  "linear-gradient(165deg,rgba(0,157,255,.4) 0%,rgba(0,85,140,.62) 45%,rgba(0,32,63,.94) 100%)", // blue
  "linear-gradient(165deg,rgba(224,65,65,.4) 0%,rgba(139,32,32,.6) 45%,rgba(43,10,10,.94) 100%)", // rose
  "linear-gradient(165deg,rgba(94,102,224,.42) 0%,rgba(48,52,140,.6) 45%,rgba(14,16,50,.94) 100%)", // indigo
  "linear-gradient(165deg,rgba(52,199,89,.4) 0%,rgba(26,120,54,.6) 45%,rgba(8,42,20,.94) 100%)", // emerald
  "linear-gradient(165deg,rgba(148,163,184,.38) 0%,rgba(71,85,105,.58) 45%,rgba(15,23,42,.94) 100%)", // slate/storm
  "linear-gradient(165deg,rgba(236,72,153,.4) 0%,rgba(157,23,101,.6) 45%,rgba(46,7,32,.94) 100%)", // pink/magenta
  "linear-gradient(165deg,rgba(56,189,248,.4) 0%,rgba(14,116,144,.6) 45%,rgba(3,38,48,.94) 100%)", // cyan
];

/** Small deterministic string hash (djb2) - stable across reloads/servers,
    no Math.random involved, so the "random" pick never drifts. */
function hashKey(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = (h * 33) ^ key.charCodeAt(i);
  }
  return Math.abs(h);
}

export interface CourseVisual {
  photo: string;
  grad: string;
}

/** Deterministically assigns a photo + gradient to a canonical course key.
    Same key -> same result, always, on both portals. Use a stable id that
    both the tutor and student side agree represents the same real class
    (e.g. the tutor-side TutorCourseId) so a shared course never mismatches. */
export function getCourseVisual(canonicalKey: string): CourseVisual {
  const h = hashKey(canonicalKey);
  // Two independent hash lanes so photo and colour don't move in lockstep
  // (offsetting the key keeps the two picks decorrelated).
  const photo = COURSE_PHOTO_POOL[h % COURSE_PHOTO_POOL.length];
  const grad = COURSE_OVERLAY_POOL[hashKey(canonicalKey + ":grad") % COURSE_OVERLAY_POOL.length];
  return { photo, grad };
}
