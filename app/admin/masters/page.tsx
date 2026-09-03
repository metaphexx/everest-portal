// Every master screen, one file.
//
// The live portal has fourteen of these on separate routes reached through
// three collapsing sidebar groups. They are the same screen with different
// columns, so here they share one route with a tab strip: the office can move
// from Centres to Printers to Terms without hunting through a nav tree, and the
// production build gets one component to maintain rather than fourteen.
//
// If the developers prefer to keep separate routes, every tab below is a
// self-contained <MasterTable> config and lifts out unchanged.

import React, { useState } from "react";
import { useRouter, useSearchParams } from "@/lib/router";
import { useAdmin } from "@/lib/admin-store";
import { Column, MasterTable, PILL } from "@/components/admin/MasterTable";
import {
  BookletDriveMap,
  BOOKLET_DRIVE,
  Centre,
  CentrePrinter,
  CENTRES_M,
  CENTRE_PRINTERS,
  CLASS_SELECTIONS,
  ClassSelectionRow,
  COURSES,
  CourseCategory,
  COURSE_CATEGORIES,
  CourseTutorMap,
  COURSE_TUTORS,
  DriveMap,
  DRIVE_DATA,
  Printer,
  PRINTERS_M,
  SubjectRow,
  SUBJECTS,
  SUBJECT_DRIVE,
  Term,
  TERMS,
  YearGroup,
  YEAR_GROUPS,
} from "@/lib/admin-masters";
import { AdminStudent, STAFF, StaffMember, allStudents } from "@/lib/admin-data";
import {
  EditCentreModal,
  EditCentrePrinterModal,
  EditClassSelectionModal,
  BookletDriveModal,
  CourseCategoryModal,
  SubjectDriveModal,
  EditCourseTutorModal,
  EditTermModal,
  EditYearGroupModal,
  SubjectModal,
  EditPrinterModal,
  EditStudentModal,
  EditTutorModal,
} from "@/components/admin/MasterEditModals";

/** A short grey line, used wherever a cell is a list of other records. */
function List({ items, empty = "None" }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <span style={{ color: "var(--fg4)" }}>{empty}</span>;
  return <>{items.join(", ")}</>;
}

/** Drive links are 70 characters of noise. Show the folder id, link the whole cell. */
function DriveLink({ url }: { url: string }) {
  const id = url.split("/").pop() ?? url;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ color: "var(--brand-600)", textDecoration: "none", fontWeight: 600 }} title={url}>
      {id.slice(0, 10)}...{id.slice(-4)}
    </a>
  );
}

const TABS = [
  { id: "centres", label: "Centres", group: "Places" },
  { id: "printers", label: "Printers", group: "Places" },
  { id: "centre-printers", label: "Centre printers", group: "Places" },
  { id: "tutors", label: "Tutors", group: "People" },
  { id: "students", label: "Online students", group: "People" },
  { id: "class-selection", label: "Class selection", group: "People" },
  { id: "terms", label: "Terms", group: "Teaching" },
  { id: "year-groups", label: "Year groups", group: "Teaching" },
  { id: "subjects", label: "Subjects", group: "Teaching" },
  { id: "courses", label: "Courses", group: "Teaching" },
  { id: "categories", label: "Course categories", group: "Teaching" },
  { id: "course-tutors", label: "Course tutors", group: "Teaching" },
  { id: "subject-drive", label: "(In person) Subject Drive map", group: "Drive" },
  { id: "booklet-drive", label: "Booklet Drive map", group: "Drive" },
  { id: "drive-data", label: "Drive access", group: "Drive" },
];

type EditTarget =
  | { kind: "centre"; row: Centre }
  | { kind: "printer"; row: Printer }
  | { kind: "centre-printer"; row: CentrePrinter }
  | { kind: "tutor"; row: StaffMember }
  | { kind: "student"; row: AdminStudent }
  | { kind: "class-selection"; row: ClassSelectionRow }
  | { kind: "term"; row: Term }
  | { kind: "year-group"; row: YearGroup }
  | { kind: "subject"; row: SubjectRow }
  | { kind: "category"; row: CourseCategory }
  | { kind: "course-tutor"; row: CourseTutorMap }
  | { kind: "subject-drive"; row: DriveMap }
  | { kind: "booklet-drive"; row: BookletDriveMap };

export default function AdminMasters() {
  const params = useSearchParams();
  const router = useRouter();
  const { notWired, masterPatches, patchMaster, masterAdds, addMaster } = useAdmin();
  const tab = params.get("tab") ?? "centres";
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [adding, setAdding] = useState<"subject" | "category" | "subject-drive" | "booklet-drive" | null>(null);
  /** Tutors as the Drive panels need them: a name, an address and initials. */
  const driveTutors = STAFF.map((t) => ({ name: t.name, email: t.email, initials: t.initials, colour: t.colour }));

  /** Office edits sit over the seeded master records wherever they are read. */
  const patched = <T extends { id: string }>(rows: T[]): T[] => rows.map((r) => ({ ...r, ...(masterPatches[r.id] as Partial<T>) }));
  const save = (label: string) => (id: string, patch: Record<string, unknown>) => {
    patchMaster(id, patch, label);
    setEditing(null);
  };

  const go = (id: string) => router.push("/admin/masters?tab=" + id);
  const add = (what: string) => notWired("Add a " + what);
  const edit = (what: string) => notWired("Edit " + what);
  const del = (what: string) => notWired("Delete " + what);
  const exp = () => notWired("Export");

  const onOff = (r: { active: boolean }) => (r.active ? PILL.active : PILL.inactive);

  const table = () => {
    switch (tab) {
      case "printers": {
        const cols: Column<(typeof PRINTERS_M)[number]>[] = [
          { key: "n", label: "Printer", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "m", label: "Model", render: (r) => r.model, text: (r) => r.model },
          { key: "c", label: "Centre", render: (r) => r.centre, text: (r) => r.centre },
        ];
        return (
          <MasterTable
            rows={patched(PRINTERS_M)}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search printers by name, model or centre"
            addLabel="Add a printer"
            onAdd={() => add("printer")}
            onEdit={(r) => setEditing({ kind: "printer", row: r })}
            onDelete={() => del("printer")}
            onExport={exp}
            emptyTitle="No printers yet"
            emptyBody="Add the printers at each centre so tutors can pick one when they request booklets."
          />
        );
      }
      case "centre-printers": {
        const cols: Column<(typeof CENTRE_PRINTERS)[number]>[] = [
          { key: "c", label: "Centre", render: (r) => <strong style={{ fontWeight: 700 }}>{r.centre}</strong>, text: (r) => r.centre },
          { key: "p", label: "Printers", render: (r) => <List items={r.printers} empty="No printer mapped" />, text: (r) => r.printers.join(" "), width: 300 },
          { key: "d", label: "Default", render: (r) => r.defaultPrinter, text: (r) => r.defaultPrinter },
        ];
        return (
          <MasterTable
            rows={patched(CENTRE_PRINTERS)}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search by centre or printer"
            addLabel="Map a printer"
            onAdd={() => add("mapping")}
            onEdit={(r) => setEditing({ kind: "centre-printer", row: r })}
            onDelete={() => del("mapping")}
            onExport={exp}
            emptyTitle="Nothing mapped yet"
            emptyBody="A centre with no printer cannot receive a print request, so map at least one to each."
          />
        );
      }
      case "tutors": {
        const cols: Column<(typeof STAFF)[number]>[] = [
          { key: "n", label: "Tutor", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "e", label: "Email", render: (r) => r.email, text: (r) => r.email, width: 240 },
          { key: "p", label: "Phone", render: (r) => r.phone, text: (r) => r.phone },
        ];
        return (
          <MasterTable
            rows={patched(STAFF)}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.status === "active" ? PILL.active : { label: "On leave", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" })}
            searchHint="Search tutors by name, email or centre"
            addLabel="Add a tutor"
            onAdd={() => add("tutor")}
            onEdit={(r) => setEditing({ kind: "tutor", row: r })}
            onDelete={() => del("tutor")}
            onExport={exp}
            emptyTitle="No tutors yet"
            emptyBody="Add your teaching staff and grant each of them in-person duties, online duties, or both."
          />
        );
      }
      case "students": {
        const rows = allStudents();
        const cols: Column<(typeof rows)[number]>[] = [
          { key: "n", label: "Student", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "y", label: "Year", render: (r) => r.year, text: (r) => r.year },
          { key: "c", label: "Classes", render: (r) => <List items={r.classNames} />, text: (r) => r.classNames.join(" "), width: 260 },
          { key: "p", label: "Parent", render: (r) => (<><span>{r.parent}</span><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.parentPhone}</span></>), text: (r) => r.parent + " " + r.parentPhone },
          { key: "a", label: "Attendance", render: (r) => <span style={{ fontWeight: 700, color: r.attendance < 80 ? "var(--warn-700)" : "var(--fg2)" }}>{r.attendance}%</span>, text: (r) => String(r.attendance), minor: true },
        ];
        return (
          <MasterTable
            rows={rows}
            columns={cols}
            idOf={(r) => r.name}
            statusOf={(r) => (r.status === "trial" ? PILL.pending : r.status === "active" ? PILL.active : PILL.inactive)}
            countNoun="online students"
            searchHint="Search students by name, parent or class"
            addLabel="Enrol a student"
            onAdd={() => add("student")}
            onEdit={(r) => setEditing({ kind: "student", row: r })}
            onExport={exp}
            emptyTitle="No students enrolled"
            emptyBody="Enrol students and put them in a class to give them a portal login."
          />
        );
      }
      case "class-selection": {
        const cols: Column<(typeof CLASS_SELECTIONS)[number]>[] = [
          { key: "t", label: "Tutor", render: (r) => <strong style={{ fontWeight: 700 }}>{r.tutor}</strong>, text: (r) => r.tutor },
          { key: "c", label: "Centre", render: (r) => r.centre, text: (r) => r.centre },
          { key: "s", label: "Subjects", render: (r) => <List items={r.subjects} />, text: (r) => r.subjects.join(" "), width: 280 },
          {
            key: "d",
            label: "Session dates",
            // Every date, in order, with the count at the end. The live version
            // prints "27-Feb 2026 | 07-Mar 2026 +5 More", which hides most of
            // what the office came to check.
            render: (r) => r.dates.join(", ") + " (" + r.dates.length + " session" + (r.dates.length === 1 ? "" : "s") + ")",
            text: (r) => r.dates.join(" "),
            width: 380,
          },
        ];
        return (
          <MasterTable
            rows={patched(CLASS_SELECTIONS)}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            numbered
            searchHint="Search by tutor, centre or subject"
            addLabel="Add a selection"
            onAdd={() => add("class selection")}
            onEdit={(r) => setEditing({ kind: "class-selection", row: r })}
            onDelete={() => del("class selection")}
            onExport={exp}
            emptyTitle="No class selections"
            emptyBody="A class selection is which subjects a tutor covers at a centre, and on which dates."
          />
        );
      }
      case "year-groups": {
        const cols: Column<(typeof YEAR_GROUPS)[number]>[] = [
          { key: "n", label: "Cohort", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "y", label: "Year level", render: (r) => r.year, text: (r) => r.year },
          { key: "s", label: "Subjects", render: (r) => SUBJECTS.filter((x) => x.year === r.year).length + " subjects", text: (r) => r.year, minor: true },
        ];
        return (
          <MasterTable
            rows={patched(YEAR_GROUPS)}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search year groups"
            addLabel="Add a year group"
            onAdd={() => add("year group")}
            onEdit={(r) => setEditing({ kind: "year-group", row: r })}
            onDelete={() => del("year group")}
            emptyTitle="No year groups"
            emptyBody="A year group is what a subject and a class both hang off, so set these up first."
          />
        );
      }
      case "subjects": {
        const cols: Column<(typeof SUBJECTS)[number]>[] = [
          { key: "n", label: "Subject", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          // The live Subject Master leaves this column empty on every row. A
          // subject that does not know its year cannot be put on a timetable.
          { key: "y", label: "Year level", render: (r) => r.year, text: (r) => r.year },
          { key: "a", label: "Area", render: (r) => r.area, text: (r) => r.area },
        ];
        return (
          <MasterTable
            rows={[...patched(SUBJECTS), ...((masterAdds.subjects ?? []) as unknown as SubjectRow[])]}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search subjects by name, year or area"
            addLabel="Add a subject"
            onAdd={() => setAdding("subject")}
            onEdit={(r) => setEditing({ kind: "subject", row: r })}
            onDelete={() => del("subject")}
            emptyTitle="No subjects defined"
            emptyBody="A subject is the unit a class, a booklet and a curriculum outline all point at."
          />
        );
      }
      case "terms": {
        const cols: Column<(typeof TERMS)[number]>[] = [
          { key: "n", label: "Term", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "s", label: "Starts", render: (r) => r.start, text: (r) => r.start },
          { key: "e", label: "Ends", render: (r) => r.end, text: (r) => r.end },
          { key: "w", label: "Length", render: (r) => r.weeks + " weeks", text: (r) => r.weeks + " weeks" },
        ];
        return (
          <MasterTable
            rows={patched(TERMS)}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.state === "ongoing" ? PILL.ongoing : r.state === "upcoming" ? PILL.pending : PILL.inactive)}
            searchHint="Search terms"
            addLabel="Add a term"
            onAdd={() => add("term")}
            onEdit={(r) => setEditing({ kind: "term", row: r })}
            onDelete={() => del("term")}
            emptyTitle="No terms set up"
            emptyBody="Terms drive the timetable and the booklet tracker, so add the current one first."
          />
        );
      }
      case "courses": {
        const cols: Column<(typeof COURSES)[number]>[] = [
          { key: "n", label: "Course", render: (r) => (<><strong style={{ fontWeight: 700 }}>{r.name}</strong><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.shortName}</span></>), text: (r) => r.name + " " + r.shortName },
          { key: "c", label: "Category", render: (r) => r.category, text: (r) => r.category, width: 240 },
          { key: "y", label: "Year", render: (r) => r.year, text: (r) => r.year },
          { key: "s", label: "Subjects", render: (r) => <List items={r.subjects} />, text: (r) => r.subjects.join(" ") },
          { key: "d", label: "Length", render: (r) => r.durationWeeks + " weeks", text: (r) => String(r.durationWeeks), minor: true },
        ];
        return (
          <MasterTable
            rows={COURSES}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search courses by name, category or subject"
            addLabel="Add a course"
            onAdd={() => add("course")}
            onEdit={() => edit("course")}
            onDelete={() => del("course")}
            onExport={exp}
            emptyTitle="No courses yet"
            emptyBody="A course is what a student enrols in. Classes are the sessions that run it."
          />
        );
      }
      case "categories": {
        const cols: Column<(typeof COURSE_CATEGORIES)[number]>[] = [
          { key: "n", label: "Category", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name, width: 240 },
          { key: "d", label: "Description", render: (r) => r.description, text: (r) => r.description, width: 360 },
          { key: "c", label: "Courses in it", render: (r) => r.courses, text: (r) => String(r.courses) },
        ];
        return (
          <MasterTable
            rows={[...patched(COURSE_CATEGORIES), ...((masterAdds.categories ?? []) as unknown as CourseCategory[])]}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search categories"
            addLabel="Add a category"
            onAdd={() => setAdding("category")}
            onEdit={(r) => setEditing({ kind: "category", row: r })}
            onDelete={() => del("category")}
            emptyTitle="No categories yet"
            emptyBody="Categories group courses on the enrolment pages."
          />
        );
      }
      case "course-tutors": {
        const cols: Column<(typeof COURSE_TUTORS)[number]>[] = [
          { key: "c", label: "Course", render: (r) => <strong style={{ fontWeight: 700 }}>{r.course}</strong>, text: (r) => r.course },
          { key: "t", label: "Tutors", render: (r) => <List items={r.tutors} empty="Nobody assigned" />, text: (r) => r.tutors.join(" "), width: 320 },
        ];
        return (
          <MasterTable
            rows={patched(COURSE_TUTORS)}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            numbered
            searchHint="Search by course or tutor"
            onEdit={(r) => setEditing({ kind: "course-tutor", row: r })}
            onExport={exp}
            emptyTitle="Nothing assigned"
            emptyBody="Assign a tutor to a course so the course appears in their portal."
          />
        );
      }
      case "subject-drive": {
        const cols: Column<(typeof SUBJECT_DRIVE)[number]>[] = [
          { key: "l", label: "Subject", render: (r) => <strong style={{ fontWeight: 700 }}>{r.label}</strong>, text: (r) => r.label, width: 220 },
          { key: "f", label: "Drive link", render: (r) => <DriveLink url={r.folder} />, text: (r) => r.folder, width: 240 },
        ];
        return (
          <MasterTable
            rows={[...patched(SUBJECT_DRIVE), ...((masterAdds["subject-drive"] ?? []) as unknown as DriveMap[])]}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            numbered
            searchHint="Search by subject or folder"
            addLabel="Map a folder"
            onAdd={() => setAdding("subject-drive")}
            onEdit={(r) => setEditing({ kind: "subject-drive", row: r })}
            onDelete={() => del("mapping")}
            emptyTitle="Nothing mapped"
            emptyBody="Point each subject at the Drive folder its materials live in, so tutors see the right files."
          />
        );
      }
      case "booklet-drive": {
        const cols: Column<(typeof BOOKLET_DRIVE)[number]>[] = [
          { key: "f", label: "Drive link", render: (r) => <DriveLink url={r.folder} />, text: (r) => r.folder, width: 260 },
          {
            key: "t",
            label: "Tutors",
            render: (r) =>
              r.tutors.length === 0 ? (
                <span style={{ color: "var(--warn-700)" }}>Shared with nobody</span>
              ) : (
                <span style={{ display: "inline-flex", gap: 6, flexWrap: "nowrap" }}>
                  {r.tutors.map((t) => (
                    <span key={t.name} style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-700)", background: "rgba(0,157,255,.1)", padding: "3px 9px", borderRadius: 980, flex: "none" }}>
                      {t.name}
                    </span>
                  ))}
                </span>
              ),
            text: (r) => r.tutors.map((t) => t.name).join(" "),
            width: 340,
          },
        ];
        return (
          <MasterTable
            rows={[...patched(BOOKLET_DRIVE), ...((masterAdds["booklet-drive"] ?? []) as unknown as BookletDriveMap[])]}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            numbered
            searchHint="Search by folder or tutor"
            addLabel="Map a folder"
            onAdd={() => setAdding("booklet-drive")}
            onEdit={(r) => setEditing({ kind: "booklet-drive", row: r })}
            onDelete={() => del("mapping")}
            emptyTitle="Nothing mapped"
            emptyBody="Point a Drive folder of booklets at the tutors who may take from it."
          />
        );
      }
      case "drive-data": {
        const cols: Column<(typeof DRIVE_DATA)[number]>[] = [
          { key: "p", label: "Folder is for", render: (r) => <strong style={{ fontWeight: 700 }}>{r.purpose}</strong>, text: (r) => r.purpose },
          { key: "f", label: "Drive folder", render: (r) => <DriveLink url={r.folder} />, text: (r) => r.folder, width: 200 },
          { key: "t", label: "Tutors with access", render: (r) => <List items={r.tutors} empty="Nobody yet" />, text: (r) => r.tutors.join(" "), width: 300 },
        ];
        return (
          <MasterTable
            rows={DRIVE_DATA}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search by folder or tutor"
            addLabel="Grant access"
            onAdd={() => add("access rule")}
            onEdit={() => edit("access rule")}
            onDelete={() => del("access rule")}
            emptyTitle="No access granted"
            emptyBody="This controls which tutors can see which Drive folders inside the portal."
          />
        );
      }
      default: {
        const cols: Column<(typeof CENTRES_M)[number]>[] = [
          { key: "n", label: "Centre", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "l", label: "Location", render: (r) => r.location, text: (r) => r.location, width: 280 },
        ];
        return (
          <MasterTable
            rows={patched(CENTRES_M)}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search centres by name or suburb"
            addLabel="Add a centre"
            onAdd={() => add("centre")}
            onEdit={(r) => setEditing({ kind: "centre", row: r })}
            onDelete={() => del("centre")}
            onExport={exp}
            emptyTitle="No centres yet"
            emptyBody="A centre is a physical location that runs in-person classes and holds a printer."
          />
        );
      }
    }
  };

  const groups = [...new Set(TABS.map((t) => t.group))];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* One tab strip instead of three collapsing sidebar trees. Grouped, so
          fourteen tabs still read as four ideas. On a phone the four rows of
          pills stack taller than the screen, so below 720px the strip becomes
          one select, grouped the same way. */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "14px 16px 10px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <span className="ev-only-mobile" style={{ marginBottom: 4 }}>
          <select value={tab} onChange={(e) => go(e.target.value)} aria-label="Master record" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }}>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {TABS.filter((t) => t.group === g).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </span>
        {groups.map((g) => (
          <div key={g} className="ev-only-desktop" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ flex: "none", width: 66, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)" }}>{g.toUpperCase()}</span>
            <span className="ev-scroll-x" style={{ display: "flex", gap: 7, flex: 1, minWidth: 0 }}>
              {TABS.filter((t) => t.group === g).map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => go(t.id)}
                    aria-pressed={on}
                    className="press ev-tap-h"
                    style={{ height: 34, padding: "0 13px", borderRadius: 980, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", background: on ? "var(--accent-teal)" : "rgba(255,255,255,.8)", color: on ? "#fff" : "var(--fg3)" }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </span>
          </div>
        ))}
      </div>

      {table()}

      {editing?.kind === "centre" && (
        <EditCentreModal centre={editing.row} onClose={() => setEditing(null)} onSave={save("Centre")} />
      )}
      {editing?.kind === "printer" && (
        <EditPrinterModal printer={editing.row} centres={CENTRES_M.map((c) => c.name)} onClose={() => setEditing(null)} onSave={save("Printer")} />
      )}
      {editing?.kind === "centre-printer" && (
        <EditCentrePrinterModal mapping={editing.row} centres={CENTRES_M.map((c) => c.name)} printers={patched(PRINTERS_M)} onClose={() => setEditing(null)} onSave={save("Mapping")} />
      )}
      {editing?.kind === "tutor" && (
        <EditTutorModal tutor={editing.row} onClose={() => setEditing(null)} onSave={save("Tutor")} />
      )}
      {editing?.kind === "student" && (
        <EditStudentModal student={editing.row} onClose={() => setEditing(null)} onSave={save("Student")} />
      )}
      {editing?.kind === "term" && <EditTermModal term={editing.row} onClose={() => setEditing(null)} onSave={save("Term")} />}
      {editing?.kind === "year-group" && <EditYearGroupModal group={editing.row} onClose={() => setEditing(null)} onSave={save("Year group")} />}
      {editing?.kind === "category" && <CourseCategoryModal category={editing.row} onClose={() => setEditing(null)} onSave={save("Category")} />}
      {adding === "category" && (
        <CourseCategoryModal
          onClose={() => setAdding(null)}
          onSave={(id, patch) => {
            addMaster("categories", { id, ...patch }, "Category");
            setAdding(null);
          }}
        />
      )}
      {editing?.kind === "subject-drive" && (
        <SubjectDriveModal map={editing.row} subjects={SUBJECTS.map((x) => x.name)} onClose={() => setEditing(null)} onSave={save("Drive map")} />
      )}
      {adding === "subject-drive" && (
        <SubjectDriveModal
          subjects={SUBJECTS.map((x) => x.name)}
          onClose={() => setAdding(null)}
          onSave={(id, patch) => {
            addMaster("subject-drive", { id, ...patch }, "Drive map");
            setAdding(null);
          }}
        />
      )}
      {editing?.kind === "booklet-drive" && (
        <BookletDriveModal map={editing.row} tutors={driveTutors} onClose={() => setEditing(null)} onSave={save("Drive map")} />
      )}
      {adding === "booklet-drive" && (
        <BookletDriveModal
          tutors={driveTutors}
          onClose={() => setAdding(null)}
          onSave={(id, patch) => {
            addMaster("booklet-drive", { id, ...patch }, "Drive map");
            setAdding(null);
          }}
        />
      )}
      {editing?.kind === "course-tutor" && (
        <EditCourseTutorModal mapping={editing.row} tutors={STAFF.map((t) => t.name)} onClose={() => setEditing(null)} onSave={save("Course tutors")} />
      )}
      {editing?.kind === "subject" && <SubjectModal subject={editing.row} onClose={() => setEditing(null)} onSave={save("Subject")} />}
      {adding === "subject" && (
        <SubjectModal
          onClose={() => setAdding(null)}
          onSave={(id, patch) => {
            addMaster("subjects", { id, ...patch }, "Subject");
            setAdding(null);
          }}
        />
      )}
      {editing?.kind === "class-selection" && (
        <EditClassSelectionModal
          selection={editing.row}
          tutors={STAFF.map((t) => t.name)}
          centres={CENTRES_M.map((c) => c.name)}
          subjects={SUBJECTS.map((x) => x.name)}
          onClose={() => setEditing(null)}
          onSave={save("Class selection")}
        />
      )}
    </div>
  );
}
