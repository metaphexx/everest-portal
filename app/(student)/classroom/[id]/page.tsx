// Student-side classroom - a Google-Classroom-style post stream shared with
// the tutor side (lib/classroom.tsx, mounted in both layouts). The Stream is
// posts + replies + file attachments (via the shared ClassroomStream
// component); Resources holds the files the tutor has shared; School materials
// and Messages are light pointers. The header mirrors the course page: a
// dynamic landscape photo with a gradient wash.
//
// Maya Kapoor is the only student persona, enrolled in one live classroom
// (chem11). Visiting any other id shows a graceful fallback.

import React, { useState } from "react";
import Link from "@/components/ui/Link";
import { useParams, useRouter } from "@/lib/router";
import { usePortal } from "@/lib/store";
import { CLASSROOMS, MATERIAL_KIND_META, TUTOR, TUTOR_COURSES, TUTOR_COURSE_FOR, rosterFor } from "@/lib/tutor-data";
import { CHEM_SESSION_KEYS, ICON } from "@/lib/data";
import { outlineAverage } from "@/lib/features";
import { Icon } from "@/components/ui/Icon";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";
import { ClassroomStream } from "@/components/portal/ClassroomStream";

const ME = "Maya Kapoor";
const ME_INIT = "MK";

type Tab = "stream" | "resources" | "school" | "messages";

const TABS: { k: Tab; label: string }[] = [
  { k: "stream", label: "Stream" },
  { k: "resources", label: "Resources" },
  { k: "school", label: "School materials" },
  { k: "messages", label: "Messages" },
];

export default function StudentClassroomPage() {
  const params = useParams<{ id: string }>();

  const room = CLASSROOMS.find((c) => c.id === params.id);
  const roster = room ? rosterFor(room.id) : [];
  const iAmEnrolled = room ? roster.some((s) => s.name === ME) : false;

  if (!room || !iAmEnrolled) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center", color: "var(--fg3)" }}>
        You are not part of this classroom.{" "}
        <Link href="/courses" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Back to My Courses</Link>
      </div>
    );
  }

  return <ClassroomBody roomId={room.id} />;
}

function todayKeyOf(now: number): string {
  const d = new Date(now);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function ClassroomBody({ roomId }: { roomId: string }) {
  const { now, outlines, assignedToMe, submitAssignedWorksheet } = usePortal();
  const [tab, setTab] = useState<Tab>("stream");
  const [preview, setPreview] = useState<{ name: string; meta: string; kind?: "doc" | "link"; url?: string } | null>(null);

  const room = CLASSROOMS.find((c) => c.id === roomId)!;
  const cv = TUTOR_COURSES[room.courseId]; // photo + gradient + icon
  // Outlines are keyed by the STUDENT course id ("chem"), not the tutor id.
  const studentCourseId = Object.keys(TUTOR_COURSE_FOR).find((k) => TUTOR_COURSE_FOR[k] === room.courseId) ?? null;
  const outline = studentCourseId ? outlines.find((o) => o.courseId === studentCourseId) ?? null : null;
  const assignments = assignedToMe().filter((a) => a.courseId === room.courseId);

  const tKey = todayKeyOf(now);
  const nextKey = CHEM_SESSION_KEYS.find((k) => k >= tKey);
  const nextLabel = nextKey
    ? new Date(nextKey + "T19:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" }) + ", 7:00pm"
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      <Link href="/courses" className="ev-tap-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--fg3)", textDecoration: "none", width: "fit-content" }}>
        <Icon path="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12l4.6-4.6Z" size={13} />
        Back to courses
      </Link>

      {/* HERO - course-page style, dynamic landscape photo */}
      {/* Content is absolutely positioned, so the card cannot grow with it: at
          375px the title wraps and the "Next session" value was being clipped
          by the bottom edge. .ev-hero-tall gives it more height on phones. */}
      <div className="ev-hero-tall" style={{ position: "relative", borderRadius: 20, overflow: "hidden", minHeight: 168, boxShadow: "0 18px 40px -20px rgba(0,32,63,.45)" }}>
        <div className="ev-kenburns" style={{ position: "absolute", inset: 0, backgroundImage: `url(${cv.photo})`, backgroundSize: "cover", backgroundPosition: "center", animation: ["evkenburns1 26s", "evkenburns2 31s", "evkenburns3 35s"][room.id.charCodeAt(0) % 3] + " ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, background: cv.grad, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 2, padding: "20px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", color: "#fff" }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon path={cv.icon} size={19} style={{ color: "#fff" }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>{room.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                <Pill>{TUTOR.name}</Pill>
                <Pill>{room.name.replace(/^Year \d+ /, "")}</Pill>
              </div>
            </div>
            {nextLabel && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, opacity: 0.8 }}>NEXT SESSION</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{nextLabel}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {/* Was flexWrap:"wrap", which dropped "Messages" onto a second line under
          the pill container and read as broken. Scrolls sideways instead. */}
      <div className="ev-tabs-scroll thin-scroll" style={{ display: "inline-flex", gap: 4, background: "rgba(0,32,63,.05)", borderRadius: 980, padding: 3, width: "fit-content", maxWidth: "100%", overflowX: "auto" }}>
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className="press"
            style={{ height: 32, padding: "0 15px", borderRadius: 980, border: "none", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: tab === t.k ? "#fff" : "transparent", color: tab === t.k ? "var(--fg1)" : "var(--fg3)", boxShadow: tab === t.k ? "0 2px 8px -2px rgba(0,32,63,.25)" : "none" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stream" && (
        <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
          <ClassroomStream
            classroomId={room.id}
            viewer={{ name: ME, init: ME_INIT, role: "student" }}
            accent={room.color}
            roomName={room.name.replace("Year 8 ", "").replace("Year 11 ", "").replace("Year 9 ", "")}
            onPreview={(name, meta, opts) => setPreview({ name, meta, ...opts })}
          />
          <StreamSidebar outline={outline} assignments={assignments} />
        </div>
      )}

      {tab === "resources" && (
        <ResourcesTab assignments={assignments} submitAssignedWorksheet={submitAssignedWorksheet} onPreview={(name, meta) => setPreview({ name, meta })} />
      )}

      {tab === "school" && <SchoolMaterialsTab outline={outline} />}

      {tab === "messages" && <MessagesTab />}

      {preview && <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} kind={preview.kind ?? "doc"} url={preview.url} />}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "rgba(255,255,255,.92)", color: "var(--navy-500)", fontSize: 10.5, fontWeight: 700, padding: "4px 11px", borderRadius: 980 }}>{children}</span>;
}

// ---------------------------------------------------------------
// Stream sidebar - assessment tracker + tutor-shared files (no term progress)
// ---------------------------------------------------------------

function StreamSidebar({
  outline,
  assignments,
}: {
  outline: ReturnType<typeof usePortal>["outlines"][number] | null;
  assignments: ReturnType<ReturnType<typeof usePortal>["assignedToMe"]>;
}) {
  const avg = outline ? outlineAverage(outline.assessments) : null;
  const nextAssessment = outline ? outline.assessments.find((a) => !a.done) : null;
  const latest = [...assignments].slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Assessment Tracker (condensed) */}
      <div className="glass-card" style={{ padding: "18px 20px" }}>
        <h2 className="portal-section-title" style={{ fontSize: 13.5, marginBottom: 8 }}>Assessment Tracker</h2>
        {!outline && <div style={{ fontSize: 12, color: "var(--fg4)" }}>No outline uploaded for this course yet.</div>}
        {outline && (
          <>
            <div style={{ fontSize: 12.5, color: "var(--fg3)", marginBottom: 6 }}>{outline.subject}</div>
            {avg !== null && (
              <span style={{ fontSize: 11.5, fontWeight: 800, color: avg >= 75 ? "var(--success-700)" : avg >= 55 ? "var(--warn-700)" : "var(--danger-500)", background: avg >= 75 ? "rgba(34,160,91,.12)" : avg >= 55 ? "rgba(245,166,35,.16)" : "rgba(224,65,65,.12)", padding: "4px 11px", borderRadius: 980 }}>
                {avg}% average
              </span>
            )}
            {nextAssessment && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--fg2)" }}>
                Next up: <strong>{nextAssessment.name}</strong> · due {nextAssessment.due}
              </div>
            )}
            <Link href="/outline" style={{ display: "block", marginTop: 10, fontSize: 12, color: "var(--brand-600)", fontWeight: 600, textDecoration: "none" }}>Open Assessment Tracker</Link>
          </>
        )}
      </div>

      {/* Resources this week */}
      <div className="glass-card" style={{ padding: "18px 20px" }}>
        <h2 className="portal-section-title" style={{ fontSize: 13.5, marginBottom: 8 }}>Resources this week</h2>
        {latest.length === 0 && (
          <div style={{ textAlign: "center", padding: "18px 10px", color: "var(--fg4)" }}>
            <Icon path={ICON.doc} size={24} style={{ color: "var(--fg5-decorative)", display: "block", margin: "0 auto" }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 6, color: "var(--fg3)" }}>Nothing shared yet</div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>Files your tutor posts this week appear here.</div>
          </div>
        )}
        {latest.map((a, i) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", borderBottom: i < latest.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(122,90,248,.13)", color: "var(--accent-violet)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon path={ICON.doc} size={13} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Resources tab - files the tutor has shared with the class
// ---------------------------------------------------------------

function ResourcesTab({
  assignments,
  submitAssignedWorksheet,
  onPreview,
}: {
  assignments: ReturnType<ReturnType<typeof usePortal>["assignedToMe"]>;
  submitAssignedWorksheet: (id: string) => void;
  onPreview: (name: string, meta: string) => void;
}) {
  return (
    <div className="glass-card" style={{ padding: "20px 22px" }}>
      <h2 style={{ margin: "0 0 3px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Resources</h2>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--fg3)" }}>Files your tutor has shared with the class.</p>
      {assignments.length === 0 && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--fg4)" }}>Nothing shared yet for this classroom.</p>}
      {assignments.map((a, i) => {
        const due = a.due ? new Date(a.due + "T12:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : null;
        const km = MATERIAL_KIND_META[a.kind];
        return (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < assignments.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: km.bg, color: km.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path={ICON.doc} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName}</div>
              <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>
                Assigned {new Date(a.assignedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                {due ? " · Due " + due : ""}
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: km.color, background: km.bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>{km.label}</span>
            {a.kind === "worksheet" ? (
              a.status === "graded" ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "6px 13px", borderRadius: 980, flex: "none" }}>Graded</span>
              ) : a.status === "submitted" ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)", padding: "6px 13px", borderRadius: 980, flex: "none" }}>Submitted</span>
              ) : (
                <button onClick={() => submitAssignedWorksheet(a.id)} className="btn-primary press" style={{ height: 30, padding: "0 14px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>Submit</button>
              )
            ) : (
              <button onClick={() => onPreview(a.fileName, km.label)} className="btn-soft press" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>Preview</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------
// School materials tab
// ---------------------------------------------------------------

function SchoolMaterialsTab({ outline }: { outline: ReturnType<typeof usePortal>["outlines"][number] | null }) {
  return (
    <div className="glass-card" style={{ padding: "20px 22px" }}>
      <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>School materials</h2>
      {!outline && (
        <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--fg4)" }}>
          You have not uploaded a school outline for this course yet. Upload it from the Assessment Tracker.
        </p>
      )}
      {outline && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: "rgba(0,157,255,.12)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon path={ICON.doc} size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{outline.fileName}</div>
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{outline.subject} · {outline.term}</div>
          </div>
        </div>
      )}
      <Link href="/outline" style={{ display: "inline-block", marginTop: 14, fontSize: 12.5, color: "var(--brand-600)", fontWeight: 600, textDecoration: "none" }}>
        Manage in Assessment Tracker
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------
// Messages tab
// ---------------------------------------------------------------

function MessagesTab() {
  const router = useRouter();
  return (
    <div className="glass-card" style={{ padding: "20px 22px", maxWidth: 360 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent-blue-light),var(--accent-violet-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flex: "none" }}>{TUTOR.initials}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{TUTOR.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg4)" }}>{TUTOR.role}</div>
        </div>
      </div>
      <button onClick={() => router.push("/messages?tutor=" + encodeURIComponent("Chemistry"))} className="btn-ghost" style={{ width: "100%", height: 38, borderRadius: 11, fontSize: 12.5, background: "rgba(255,255,255,.8)" }}>
        Message your tutor
      </button>
    </div>
  );
}
