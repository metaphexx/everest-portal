// Office search: the same ranked index the tutor portal uses, over the records
// the office actually works with. Built live each call so a class added or a
// request approved is searchable immediately.

import { Indexable, rank } from "./search-core";
import { ADMIN_NAV, SAFEGUARDING, STAFF, allClasses, allStudents } from "./admin-data";
import { BookletRequest, CATALOGUE } from "./tutor-data";

const DESTINATIONS: Indexable[] = [
  { name: "Dashboard", meta: "The day at a glance", kind: "Page", color: "#0E9C8E", page: "/admin", keywords: "home overview today", boost: 30 },
  { name: "Booklet Requests", meta: "Print requests waiting on a decision", kind: "Page", color: "#B27908", page: "/admin/approvals", keywords: "approve reject pending requests booklets queue", boost: 30 },
  { name: "Print History", meta: "Everything that has actually been printed", kind: "Page", color: "#009DFF", page: "/admin/history", keywords: "printed printer copies reprint receipt", boost: 30 },
  { name: "Schedule", meta: "The class calendar, and where new classes are added", kind: "Page", color: "#7A5AF8", page: "/admin/schedule", keywords: "calendar add class online in person timetable", boost: 30 },
  { name: "Messages", meta: "Threads with tutors, students and parents", kind: "Page", color: "#009DFF", page: "/admin/messages", keywords: "inbox reply chat contact", boost: 30 },
  { name: "Classes", meta: "Every class Everest runs", kind: "Page", color: "#7A5AF8", page: "/admin/classes", keywords: "timetable centre capacity enrolment online in person", boost: 30 },
  { name: "Tutors", meta: "Staff, duties and contact details", kind: "Page", color: "#0E7AC2", page: "/admin/masters?tab=tutors", keywords: "staff roster teachers duties leave", boost: 30 },
  { name: "Students", meta: "Enrolments, attendance and parent contacts", kind: "Page", color: "#22A05B", page: "/admin/masters?tab=students", keywords: "roster parents attendance trial withdrawn", boost: 30 },
  { name: "Catalogue", meta: "Booklets the office publishes to tutors", kind: "Page", color: "#D68910", page: "/admin/catalogue", keywords: "booklets materials library publish", boost: 30 },
  { name: "Shared Files", meta: "Every file shared on the platform", kind: "Page", color: "#7A5AF8", page: "/admin/files", keywords: "oversight uploads visibility audit who sent", boost: 30 },
  { name: "Safeguarding", meta: "Flagged messages needing a person", kind: "Page", color: "#E04141", page: "/admin/safeguarding", keywords: "wellbeing concern flag escalation child safety", boost: 30 },
  { name: "Settings", meta: "Office account and notifications", kind: "Page", color: "#66707F", page: "/admin/settings", keywords: "account password email notifications", boost: 30 },
];

export function buildAdminIndex(requests: BookletRequest[] = []): Indexable[] {
  const idx: Indexable[] = [...DESTINATIONS];

  for (const c of allClasses()) {
    idx.push({
      name: c.name,
      meta: "Class · " + c.tutorName + " · " + c.sched,
      kind: "Class",
      color: c.colour,
      page: "/admin/classes",
      keywords: c.year + " " + c.centre + " " + (c.delivery === "online" ? "online" : "in person"),
      boost: 16,
    });
  }
  for (const s of STAFF) {
    idx.push({
      name: s.name,
      meta: "Tutor · " + s.centres.join(", ") + (s.status === "on_leave" ? " · on leave" : ""),
      kind: "Tutor",
      color: s.colour,
      page: "/admin/masters?tab=tutors",
      keywords: s.email + " " + s.phone + " staff",
      boost: 12,
    });
  }
  for (const s of allStudents()) {
    idx.push({
      name: s.name,
      meta: "Student · " + s.classNames.join(", "),
      kind: "Student",
      color: "#22A05B",
      page: "/admin/masters?tab=students",
      keywords: s.year + " " + s.parent + " parent attendance",
      boost: 10,
    });
  }
  for (const c of CATALOGUE) {
    idx.push({ name: c.name, meta: "Catalogue · " + c.year + " " + c.subject, kind: "Booklet", color: "#D68910", page: "/admin/catalogue", keywords: c.topic + " print" });
  }
  for (const r of requests) {
    idx.push({
      name: r.ref,
      meta: "Request · " + r.classText + " · " + r.approval,
      kind: "Request",
      color: "#B27908",
      page: r.approval === "pending" ? "/admin/approvals" : r.printing === "completed" ? "/admin/history" : "/admin/approvals",
      keywords: "print approval " + r.items.map((i) => i.name).join(" ") + " " + r.printer,
    });
  }
  for (const f of SAFEGUARDING) {
    idx.push({ name: f.student + " · " + f.reason, meta: "Safeguarding · " + f.when, kind: "Safeguarding", color: "#E04141", page: "/admin/safeguarding", keywords: "flag wellbeing concern" });
  }
  return idx;
}

export function adminSearch(query: string, requests: BookletRequest[] = [], limit = 10) {
  return rank(buildAdminIndex(requests), query, limit);
}
