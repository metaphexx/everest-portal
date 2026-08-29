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

import React from "react";
import { useRouter, useSearchParams } from "@/lib/router";
import { useAdmin } from "@/lib/admin-store";
import { Column, MasterTable, PILL } from "@/components/admin/MasterTable";
import {
  BOOKLET_DRIVE,
  CENTRES_M,
  CLASSROOM_MAP,
  CURRICULUM,
  CENTRE_PRINTERS,
  CLASS_SELECTIONS,
  COURSES,
  COURSE_CATEGORIES,
  COURSE_TUTORS,
  DRIVE_DATA,
  PRINTERS_M,
  ROOMS,
  SUBJECTS,
  SUBJECT_DRIVE,
  SYSTEMS,
  TERMS,
  TOPICS,
  YEAR_GROUPS,
} from "@/lib/admin-masters";
import { STAFF, allStudents } from "@/lib/admin-data";

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
  { id: "systems", label: "Systems", group: "Places" },
  { id: "tutors", label: "Tutors", group: "People" },
  { id: "students", label: "Students", group: "People" },
  { id: "class-selection", label: "Class selection", group: "People" },
  { id: "rooms", label: "Rooms", group: "Places" },
  { id: "classroom-map", label: "Classroom map", group: "Places" },
  { id: "terms", label: "Terms", group: "Teaching" },
  { id: "year-groups", label: "Year groups", group: "Teaching" },
  { id: "subjects", label: "Subjects", group: "Teaching" },
  { id: "topics", label: "Topics", group: "Teaching" },
  { id: "curriculum", label: "Curriculum", group: "Teaching" },
  { id: "courses", label: "Courses", group: "Teaching" },
  { id: "categories", label: "Course categories", group: "Teaching" },
  { id: "course-tutors", label: "Course tutors", group: "Teaching" },
  { id: "subject-drive", label: "Subject Drive map", group: "Drive" },
  { id: "booklet-drive", label: "Booklet Drive map", group: "Drive" },
  { id: "drive-data", label: "Drive access", group: "Drive" },
];

export default function AdminMasters() {
  const params = useSearchParams();
  const router = useRouter();
  const { notWired } = useAdmin();
  const tab = params.get("tab") ?? "centres";

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
          { key: "col", label: "Colour", render: (r) => (r.colour ? "Colour and mono" : "Mono only"), text: (r) => (r.colour ? "colour" : "mono"), minor: true },
        ];
        return (
          <MasterTable
            rows={PRINTERS_M}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search printers by name, model or centre"
            addLabel="Add a printer"
            onAdd={() => add("printer")}
            onEdit={() => edit("printer")}
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
            rows={CENTRE_PRINTERS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search by centre or printer"
            addLabel="Map a printer"
            onAdd={() => add("mapping")}
            onEdit={() => edit("mapping")}
            onDelete={() => del("mapping")}
            onExport={exp}
            emptyTitle="Nothing mapped yet"
            emptyBody="A centre with no printer cannot receive a print request, so map at least one to each."
          />
        );
      }
      case "systems": {
        const cols: Column<(typeof SYSTEMS)[number]>[] = [
          { key: "h", label: "System", render: (r) => (<><strong style={{ fontWeight: 700 }}>{r.label}</strong><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.hostname}</span></>), text: (r) => r.label + " " + r.hostname },
          { key: "c", label: "Centre", render: (r) => (r.centre ?? <span style={{ color: "var(--warn-700)" }}>Not mapped</span>), text: (r) => r.centre ?? "not mapped" },
          { key: "p", label: "Printers", render: (r) => <List items={r.printers} empty="None yet" />, text: (r) => r.printers.join(" "), width: 260 },
          { key: "os", label: "Machine", render: (r) => (<><span>{r.os}</span><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.mac}</span></>), text: (r) => r.os + " " + r.mac, minor: true },
        ];
        return (
          <MasterTable
            rows={SYSTEMS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.status === "active" ? PILL.active : { label: "Waiting to pair", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" })}
            searchHint="Search by system, centre or address"
            addLabel="Pair a system"
            onAdd={() => add("system")}
            onEdit={() => edit("system")}
            onDelete={() => del("system")}
            onExport={exp}
            emptyTitle="No systems paired"
            emptyBody="Pair the front desk machine at each centre so print jobs reach the right printer."
          />
        );
      }
      case "tutors": {
        const cols: Column<(typeof STAFF)[number]>[] = [
          { key: "n", label: "Tutor", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "e", label: "Email", render: (r) => r.email, text: (r) => r.email, width: 240 },
          { key: "p", label: "Phone", render: (r) => r.phone, text: (r) => r.phone },
          { key: "d", label: "Duties", render: (r) => (r.duties === "both" ? "In person and online" : r.duties === "online" ? "Online only" : "In person only"), text: (r) => r.duties },
          { key: "c", label: "Centres", render: (r) => <List items={r.centres} />, text: (r) => r.centres.join(" "), minor: true },
        ];
        return (
          <MasterTable
            rows={STAFF}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.status === "active" ? PILL.active : { label: "On leave", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" })}
            searchHint="Search tutors by name, email or centre"
            addLabel="Add a tutor"
            onAdd={() => add("tutor")}
            onEdit={() => edit("tutor")}
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
            searchHint="Search students by name, parent or class"
            addLabel="Enrol a student"
            onAdd={() => add("student")}
            onEdit={() => edit("student")}
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
            // The live version prints "27-Feb 2026 | 07-Mar 2026 +5 More", which
            // is a date range typed out badly. First, last and a count reads.
            render: (r) => (r.dates.length <= 2 ? r.dates.join(" and ") : r.dates[0] + " to " + r.dates[r.dates.length - 1] + " (" + r.dates.length + " sessions)"),
            text: (r) => r.dates.join(" "),
            width: 260,
          },
        ];
        return (
          <MasterTable
            rows={CLASS_SELECTIONS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search by tutor, centre or subject"
            addLabel="Add a selection"
            onAdd={() => add("class selection")}
            onEdit={() => edit("class selection")}
            onDelete={() => del("class selection")}
            onExport={exp}
            emptyTitle="No class selections"
            emptyBody="A class selection is which subjects a tutor covers at a centre, and on which dates."
          />
        );
      }
      case "rooms": {
        const cols: Column<(typeof ROOMS)[number]>[] = [
          { key: "n", label: "Room", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "c", label: "Centre", render: (r) => r.centre, text: (r) => r.centre },
          { key: "cap", label: "Seats", render: (r) => r.capacity + " students", text: (r) => String(r.capacity) },
          { key: "no", label: "Notes", render: (r) => (r.notes ? r.notes : <span style={{ color: "var(--fg4)" }}>None</span>), text: (r) => r.notes, width: 260, minor: true },
        ];
        return (
          <MasterTable
            rows={ROOMS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search rooms by name or centre"
            addLabel="Add a room"
            onAdd={() => add("room")}
            onEdit={() => edit("room")}
            onDelete={() => del("room")}
            emptyTitle="No rooms set up"
            emptyBody="A room needs a centre and a seat count before a class can be timetabled into it."
          />
        );
      }
      case "classroom-map": {
        const cols: Column<(typeof CLASSROOM_MAP)[number]>[] = [
          { key: "y", label: "Year", render: (r) => <strong style={{ fontWeight: 700 }}>{r.year}</strong>, text: (r) => r.year },
          { key: "s", label: "Subject", render: (r) => r.subject, text: (r) => r.subject, width: 220 },
          // The live Classroom Map prints the record id here. A mapping is only
          // useful if you can read what it maps, so this names the rooms.
          { key: "r", label: "Rooms it can use", render: (r) => <List items={r.rooms} empty="No room mapped" />, text: (r) => r.rooms.join(" "), width: 280 },
        ];
        return (
          <MasterTable
            rows={CLASSROOM_MAP}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search by year, subject or room"
            addLabel="Add a mapping"
            onAdd={() => add("classroom mapping")}
            onEdit={() => edit("classroom mapping")}
            onDelete={() => del("classroom mapping")}
            emptyTitle="Nothing mapped to a room yet"
            emptyBody="Mapping a subject to its rooms is what stops two classes being put in the same room."
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
            rows={YEAR_GROUPS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search year groups"
            addLabel="Add a year group"
            onAdd={() => add("year group")}
            onEdit={() => edit("year group")}
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
          { key: "t", label: "Topics", render: (r) => (r.topics === 0 ? <span style={{ color: "var(--warn-700)" }}>None yet</span> : r.topics + " topics"), text: (r) => String(r.topics), minor: true },
        ];
        return (
          <MasterTable
            rows={SUBJECTS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search subjects by name, year or area"
            addLabel="Add a subject"
            onAdd={() => add("subject")}
            onEdit={() => edit("subject")}
            onDelete={() => del("subject")}
            emptyTitle="No subjects defined"
            emptyBody="A subject is the unit a class, a booklet and a curriculum outline all point at."
          />
        );
      }
      case "topics": {
        const cols: Column<(typeof TOPICS)[number]>[] = [
          { key: "n", label: "Topic", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "s", label: "Subject", render: (r) => (<><span>{r.subject}</span><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.year}</span></>), text: (r) => r.subject + " " + r.year, width: 200 },
          { key: "d", label: "What it covers", render: (r) => r.description, text: (r) => r.description, width: 320, minor: true },
        ];
        return (
          <MasterTable
            rows={TOPICS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search topics by name or subject"
            addLabel="Add a topic"
            onAdd={() => add("topic")}
            onEdit={() => edit("topic")}
            onDelete={() => del("topic")}
            emptyTitle="No topics yet"
            emptyBody="Topics sit under a subject and are what a booklet request and a weekly outline both name."
          />
        );
      }
      case "curriculum": {
        const cols: Column<(typeof CURRICULUM)[number]>[] = [
          { key: "s", label: "Subject", render: (r) => (<><strong style={{ fontWeight: 700 }}>{r.subject}</strong><span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.term}</span></>), text: (r) => r.subject + " " + r.term, width: 190 },
          {
            key: "w",
            label: "Week by week",
            // The live Curriculum master shows "Wk 1: Grammar ()(+2 more)". The
            // whole value of this row is the sequence, so the sequence shows.
            render: (r) => (
              <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {r.weeks.map((w, i) => (
                  <span key={i} style={{ fontSize: 10.5, fontWeight: 600, background: "rgba(0,32,63,.05)", borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" }}>
                    <span style={{ color: "var(--fg4)" }}>W{i + 1}</span> {w}
                  </span>
                ))}
              </span>
            ),
            text: (r) => r.weeks.join(" "),
            width: 460,
          },
          { key: "l", label: "Weeks", render: (r) => r.weeks.length, text: (r) => String(r.weeks.length), minor: true },
        ];
        return (
          <MasterTable
            rows={CURRICULUM}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search the curriculum by subject or week"
            addLabel="Add an outline"
            onAdd={() => add("curriculum outline")}
            onEdit={() => edit("curriculum outline")}
            onDelete={() => del("curriculum outline")}
            emptyTitle="No curriculum outlines"
            emptyBody="An outline is the week by week plan a tutor teaches to, and what a parent is shown."
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
            rows={TERMS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.state === "ongoing" ? PILL.ongoing : r.state === "upcoming" ? PILL.pending : PILL.inactive)}
            searchHint="Search terms"
            addLabel="Add a term"
            onAdd={() => add("term")}
            onEdit={() => edit("term")}
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
          { key: "n", label: "Category", render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
          { key: "c", label: "Courses in it", render: (r) => r.courses, text: (r) => String(r.courses) },
        ];
        return (
          <MasterTable
            rows={COURSE_CATEGORIES}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search categories"
            addLabel="Add a category"
            onAdd={() => add("category")}
            onEdit={() => edit("category")}
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
            rows={COURSE_TUTORS}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search by course or tutor"
            onEdit={() => edit("mapping")}
            onExport={exp}
            emptyTitle="Nothing assigned"
            emptyBody="Assign a tutor to a course so the course appears in their portal."
          />
        );
      }
      case "subject-drive":
      case "booklet-drive": {
        const rows = tab === "subject-drive" ? SUBJECT_DRIVE : BOOKLET_DRIVE;
        const cols: Column<(typeof rows)[number]>[] = [
          { key: "l", label: tab === "subject-drive" ? "Subject" : "Booklet", render: (r) => <strong style={{ fontWeight: 700 }}>{r.label}</strong>, text: (r) => r.label },
          { key: "o", label: tab === "subject-drive" ? "Owner" : "Subject", render: (r) => r.owner, text: (r) => r.owner },
          { key: "f", label: "Drive folder", render: (r) => <DriveLink url={r.folder} />, text: (r) => r.folder, width: 200 },
        ];
        return (
          <MasterTable
            rows={rows}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search by name or folder"
            addLabel="Map a folder"
            onAdd={() => add("mapping")}
            onEdit={() => edit("mapping")}
            onDelete={() => del("mapping")}
            emptyTitle="Nothing mapped"
            emptyBody="Point each subject at the Drive folder its booklets live in, so tutors see the right files."
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
          { key: "r", label: "Rooms", render: (r) => r.rooms, text: (r) => String(r.rooms) },
        ];
        return (
          <MasterTable
            rows={CENTRES_M}
            columns={cols}
            idOf={(r) => r.id}
            statusOf={onOff}
            searchHint="Search centres by name or suburb"
            addLabel="Add a centre"
            onAdd={() => add("centre")}
            onEdit={() => edit("centre")}
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
          fourteen tabs still read as four ideas. */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "14px 16px 10px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        {groups.map((g) => (
          <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
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
    </div>
  );
}
