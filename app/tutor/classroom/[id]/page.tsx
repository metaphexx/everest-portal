// Tutor-side classroom - the same Google-Classroom-style post stream the
// students see (shared lib/classroom.tsx provider). Two tabs: Stream (posts +
// replies + file attachments via the shared ClassroomStream, plus a roster
// sidebar) and Resources (the linked Drive files for this course, with an
// Assign action and a list of previously assigned materials). The header
// mirrors the course page: a dynamic landscape photo with a gradient wash.

import React, { useMemo, useState } from "react";
import Link from "@/components/ui/Link";
import { useParams } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { CLASSROOMS, DRIVE_FILES, DRIVE_FOLDERS, MATERIAL_KIND_META, MaterialAssignment, TUTOR_COURSES, TutorCourseId, rosterFor } from "@/lib/tutor-data";
import { Icon } from "@/components/ui/Icon";

import { BookletPicker } from "@/components/tutor/BookletPicker";
import { ClassroomStream } from "@/components/portal/ClassroomStream";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";

const TUTOR_NAME = "Priya Rao";
const TUTOR_INIT = "PR";
const PDF_ICON = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z";

type Tab = "stream" | "resources";

const ASSIGN_STATUS_META: Record<MaterialAssignment["status"], { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  submitted: { label: "Submitted", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
  graded: { label: "Graded", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
};

function targetLabel(target: MaterialAssignment["target"]): string {
  return target.kind === "class" ? "Whole class" : target.studentName;
}

export default function ClassroomPage() {
  const params = useParams<{ id: string }>();
  const { hasOnline, effectiveAssignments } = useTutor();
  const [tab, setTab] = useState<Tab>("stream");
  const [preview, setPreview] = useState<{ name: string; meta: string; kind?: "doc" | "link"; url?: string } | null>(null);

  const room = CLASSROOMS.find((c) => c.id === params.id);

  if (!room) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center", color: "var(--fg3)" }}>
        That classroom does not exist. <Link href="/tutor/courses" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Back to My Courses</Link>
      </div>
    );
  }

  if (!hasOnline) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>Classrooms are part of online teaching</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Your account is set up for in-person booklet requests only. Ask the office if your role is changing.</div>
      </div>
    );
  }

  const course = TUTOR_COURSES[room.courseId];
  const roster = rosterFor(room.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* HERO - course-page style, dynamic landscape photo */}
      <div className="ev-hero-tall" style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 168, boxShadow: "0 18px 40px -20px rgba(0,32,63,.45)" }}>
        <div className="ev-kenburns" style={{ position: "absolute", inset: 0, backgroundImage: `url(${course.photo})`, backgroundSize: "cover", backgroundPosition: "center", animation: ["evkenburns1 26s", "evkenburns2 31s", "evkenburns3 35s"][room.id.charCodeAt(0) % 3] + " ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, background: course.grad, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 2, padding: "20px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path={course.icon} size={19} style={{ color: "#fff" }} />
            </div>
            <Link href={"/tutor/courses/" + room.courseId} className="ev-tap-link" style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.45)", padding: "7px 14px", borderRadius: 980, textDecoration: "none", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
              Course page
            </Link>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>{room.name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
              <Pill>{TUTOR_NAME}</Pill>
              <Pill>{roster.length} students</Pill>
              <Pill>{course.sched}</Pill>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "inline-flex", gap: 4, background: "rgba(0,32,63,.05)", borderRadius: 980, padding: 3, alignSelf: "flex-start" }}>
        {([{ k: "stream" as const, label: "Stream" }, { k: "resources" as const, label: "Resources" }]).map((opt) => (
          <button
            key={opt.k}
            onClick={() => setTab(opt.k)}
            className="press ev-tap-h"
            style={{ height: 32, padding: "0 15px", borderRadius: 980, border: "none", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", background: tab === opt.k ? "#fff" : "transparent", color: tab === opt.k ? "var(--fg1)" : "var(--fg3)", boxShadow: tab === opt.k ? "0 2px 8px -2px rgba(0,32,63,.25)" : "none" }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {tab === "stream" ? (
        <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
          <ClassroomStream
            classroomId={room.id}
            viewer={{ name: TUTOR_NAME, init: TUTOR_INIT, role: "tutor" }}
            accent={room.color}
            roomName={course.name}
            onPreview={(name, meta, opts) => setPreview({ name, meta, ...opts })}
          />
          {/* Roster */}
          <div className="glass-card" style={{ padding: "18px 20px" }}>
            <h2 className="portal-section-title" style={{ fontSize: 14, marginBottom: 10 }}>Students</h2>
            {roster.map((s, i) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < roster.length - 1 ? "1px solid rgba(0,32,63,.05)" : "none" }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: room.bg, color: room.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, flex: "none" }}>{s.init}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.name}</span>
              </div>
            ))}
            <div style={{ fontSize: 10.5, color: "var(--fg4)", marginTop: 10, lineHeight: 1.5 }}>
              
            </div>
          </div>
        </div>
      ) : (
        <ResourcesTab courseId={room.courseId} effectiveAssignments={effectiveAssignments} onPreview={(name, meta) => setPreview({ name, meta })} />
      )}

      {preview && <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} kind={preview.kind ?? "doc"} url={preview.url} />}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "rgba(255,255,255,.92)", color: "var(--navy-500)", fontSize: 10.5, fontWeight: 700, padding: "4px 11px", borderRadius: 980 }}>{children}</span>;
}

// ============================================================
// Resources tab - the linked Drive files + previously assigned
// ============================================================

function ResourcesTab({ courseId, effectiveAssignments, onPreview }: { courseId: TutorCourseId; effectiveAssignments: MaterialAssignment[]; onPreview: (name: string, meta: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const folderIds = useMemo(() => new Set(DRIVE_FOLDERS.filter((f) => f.courseId === courseId).map((f) => f.id)), [courseId]);
  const files = useMemo(() => DRIVE_FILES.filter((f) => folderIds.has(f.folderId)), [folderIds]);

  const courseAssignments = effectiveAssignments
    .filter((a) => a.courseId === courseId)
    .slice()
    .sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="glass-card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 14.5, margin: 0 }}>Course resources</h2>
          <button onClick={() => setPickerOpen(true)} className="btn-primary press" style={{ height: 34, padding: "0 15px", borderRadius: 10, fontSize: 12.5 }}>
            Assign materials
          </button>
        </div>
        {files.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)" }}>No files linked to this classroom&apos;s folder yet.</div>
        ) : (
          files.map((f, i) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i < files.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: f.ext === "pdf" ? "rgba(224,65,65,.1)" : "rgba(0,157,255,.12)", color: f.ext === "pdf" ? "var(--danger-500)" : "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon path={PDF_ICON} size={14} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{f.pages ? f.pages + " pages" : ""}</span>
              </span>
              <button onClick={() => onPreview(f.name, f.ext.toUpperCase() + " file")} className="btn-ghost press" style={{ height: 28, padding: "0 12px", borderRadius: 9, fontSize: 11.5, color: "var(--fg2)", background: "rgba(255,255,255,.7)", flex: "none" }}>
                Preview
              </button>
              <button onClick={() => setPickerOpen(true)} className="btn-ghost press" style={{ height: 28, padding: "0 12px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", flex: "none" }}>
                Assign
              </button>
            </div>
          ))
        )}
      </div>

      <div className="glass-card" style={{ padding: "18px 20px" }}>
        <h2 className="portal-section-title" style={{ fontSize: 14.5, marginBottom: 10 }}>Previously assigned</h2>
        {courseAssignments.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)" }}>Nothing assigned to this class yet.</div>
        ) : (
          <div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {courseAssignments.map((a, i) => {
                const sm = ASSIGN_STATUS_META[a.status];
                const km = MATERIAL_KIND_META[a.kind];
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i < courseAssignments.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                    <Icon path={PDF_ICON} size={14} style={{ color: "var(--fg3)", flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="ev-title-2" style={{ display: "block", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName}</span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{targetLabel(a.target)}</span>
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: km.color, background: km.bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>{km.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: sm.color, background: sm.bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>{sm.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <BookletPicker open={pickerOpen} onClose={() => setPickerOpen(false)} courseId={courseId} />
    </div>
  );
}
