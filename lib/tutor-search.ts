// Tutor portal search.
//
// Replaces a hardcoded eleven-item substring filter that returned nothing for
// most of what a tutor would actually type - "cart", "schedule", "settings",
// "attendance", or any student's name beyond the two that happened to be in the
// list. This builds a live index every call: every destination in the nav, every
// class, every student, every Drive file, every catalogue booklet, plus whatever
// requests and submissions currently exist.

import { Indexable, rank } from "./search-core";
import { CATALOGUE, DRIVE_FILES, BookletRequest, Submission, TUTOR_COURSES, TUTOR_COURSE_ORDER } from "./tutor-data";

const PAGE = "#66707F";

/**
 * Everywhere a tutor can navigate. `keywords` carries the words people type for
 * a page without them cluttering the result line - "roll" for attendance,
 * "basket" for cart, "log out" for settings.
 */
const DESTINATIONS: Indexable[] = [
  { name: "Dashboard", meta: "Your day at a glance", kind: "Page", color: "#009DFF", page: "/tutor", keywords: "home overview today summary", boost: 30 },
  { name: "My Courses", meta: "Every class you teach", kind: "Page", color: "#7A5AF8", page: "/tutor/courses", keywords: "classes subjects roster", boost: 30 },
  { name: "Schedule", meta: "Your term calendar", kind: "Page", color: "#0E9C8E", page: "/tutor/schedule", keywords: "calendar timetable sessions dates when", boost: 30 },
  { name: "Marking", meta: "Student work waiting on feedback", kind: "Page", color: "#E04141", page: "/tutor/grade", keywords: "grade grades feedback submissions mark work annotate", boost: 30 },
  { name: "Student Outlines", meta: "School outlines your students shared", kind: "Page", color: "#7A5AF8", page: "/tutor/outlines", keywords: "assessments school outline scanned", boost: 30 },
  { name: "Study Materials", meta: "Browse the booklet catalogue to request printing", kind: "Page", color: "#009DFF", page: "/tutor/materials", keywords: "catalogue print printing order booklets request in person", boost: 30 },
  { name: "Cart", meta: "Booklets queued for a print request", kind: "Page", color: "#D68910", page: "/tutor/cart", keywords: "basket checkout order print request", boost: 30 },
  { name: "My Requests", meta: "Print requests and their approval status", kind: "Page", color: "#22A05B", page: "/tutor/requests", keywords: "orders approvals pending rejected print status", boost: 30 },
  { name: "History", meta: "Everything printed for your classes", kind: "Page", color: "#66707F", page: "/tutor/history", keywords: "past printed record log archive", boost: 30 },
  { name: "My Booklets", meta: "Assign digital booklets to an online class", kind: "Page", color: "#0E7AC2", page: "/tutor/booklets", keywords: "assign drive materials digital online share", boost: 30 },
  { name: "My Drive", meta: "Your own teaching files", kind: "Page", color: "#7A5AF8", page: "/tutor/drive", keywords: "upload personal files storage", boost: 30 },
  { name: "Messages", meta: "Conversations with students and the office", kind: "Page", color: "#009DFF", page: "/tutor/messages", keywords: "chat dm conversation contact parent reply", boost: 30 },
  { name: "Ask Elliot", meta: "Suggestions and answers about your students", kind: "Page", color: "#7A5AF8", page: "/tutor/elliot", keywords: "ai assistant help suggest assign who is struggling chat", boost: 30 },
  { name: "Settings", meta: "Contact details, password and notifications", kind: "Page", color: "#66707F", page: "/tutor/settings", keywords: "account profile password email phone number photo picture sign out preferences", boost: 30 },
];

export interface TutorSearchInput {
  requests?: BookletRequest[];
  submissions?: Submission[];
}

export function buildTutorIndex(live: TutorSearchInput = {}): Indexable[] {
  const idx: Indexable[] = [...DESTINATIONS];

  for (const cid of TUTOR_COURSE_ORDER) {
    const cd = TUTOR_COURSES[cid];
    const online = cd.delivery === "online";
    idx.push({
      name: cd.name,
      meta: "Class · " + cd.sched + (online ? " · online" : " · " + cd.centre),
      kind: "Class",
      color: cd.color,
      page: "/tutor/courses/" + cid,
      keywords: cd.year + " " + cd.centre + " attendance roster students " + (online ? "online classroom" : "in person print"),
      boost: 18,
    });
    // Attendance and the classroom are per-class destinations in their own right.
    if (online) {
      idx.push({
        name: cd.name + " classroom",
        meta: "Classroom · stream, resources and questions",
        kind: "Classroom",
        color: cd.color,
        page: "/tutor/classroom/" + cid,
        keywords: "posts announcements stream discussion " + cd.year,
        boost: 8,
      });
    }
    for (const st of cd.students) {
      idx.push({
        name: st.name,
        meta: "Student · " + cd.name,
        kind: "Student",
        color: cd.color,
        page: "/tutor/courses/" + cid,
        keywords: cd.year + " " + (online ? "online" : "in person") + " attendance message",
        boost: 10,
      });
    }
  }

  for (const f of DRIVE_FILES) {
    idx.push({
      name: f.name,
      meta: "Assign digitally · " + (f.pages ? f.pages + " pages" : f.ext.toUpperCase()),
      kind: "File",
      color: "#0E7AC2",
      page: "/tutor/booklets",
      keywords: "assign booklet worksheet material " + f.ext,
    });
  }

  for (const c of CATALOGUE) {
    idx.push({
      name: c.name,
      meta: "Order for printing · " + c.year + " " + c.subject + " · " + c.topic,
      kind: "Print catalogue",
      color: "#009DFF",
      page: "/tutor/materials?preview=" + c.id,
      keywords: "print request order " + c.topic + " " + c.subject,
    });
  }

  for (const r of live.requests ?? []) {
    idx.push({
      name: r.ref,
      meta: "Request · " + r.classText + " · " + r.approval,
      kind: "Request",
      color: "#22A05B",
      page: "/tutor/requests",
      keywords: "print order approval " + r.items.map((i: { name: string }) => i.name).join(" "),
    });
  }

  for (const s of live.submissions ?? []) {
    idx.push({
      name: s.student + " · " + s.wsName,
      meta: s.marked ? "Marked · " + (s.grade ?? "") : "Waiting to be marked",
      kind: "Submission",
      color: s.marked ? "#22A05B" : "#E04141",
      page: "/tutor/grade",
      keywords: "marking feedback grade " + s.file,
    });
  }

  return idx;
}

export function tutorSearch(query: string, live: TutorSearchInput = {}, limit = 12) {
  return rank(buildTutorIndex(live), query, limit);
}
