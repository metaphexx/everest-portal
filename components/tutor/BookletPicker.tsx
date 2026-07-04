"use client";

// BookletPicker - assign Drive-linked booklets/worksheets to a class or a
// student. Visual register copied from RequestTargetSelector.tsx (tiles,
// pill chips, glass popover) and the existing glass modals (ClassModal,
// WorksheetPicker): a centred glass dialog over a blurred scrim.

import React, { useEffect, useMemo, useState } from "react";
import { useTutor } from "@/lib/tutor-store";
import {
  AssignTarget,
  DRIVE_FILES,
  DRIVE_FOLDERS,
  DriveFile,
  MATERIAL_KIND_META,
  MaterialKind,
  TUTOR_COURSES,
  TUTOR_COURSE_ORDER,
  TutorCourseId,
  searchDrive,
} from "@/lib/tutor-data";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

const ONLINE_COURSE_IDS = (Object.keys(TUTOR_COURSES) as TutorCourseId[]).filter((id) => TUTOR_COURSES[id].delivery === "online");

const PDF_ICON = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z";
const SEARCH_ICON = "M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 5L20.49 19l-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z";
const CHECK_ICON = "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z";
const CHEV = "M7 10l5 5 5-5H7Z";

// Only these material types are assignable from the picker (booklets,
// worksheets, study notes). The other library kinds (video/recording/reference)
// aren't things a tutor hands out this way.
const ASSIGN_KINDS: MaterialKind[] = ["booklet", "worksheet", "study_notes"];

interface BookletPickerProps {
  open: boolean;
  onClose: () => void;
  courseId?: TutorCourseId;
  sessionISO?: string;
  fixedTarget?: AssignTarget;
  defaultKind?: MaterialKind;
  /** When opened from a specific booklet's "Assign" button, that file is
      pre-selected (and the picker opens on its folder) so the tutor doesn't
      have to find it again. */
  preselectFileId?: string;
}

function fileSizeLabel(f: DriveFile): string {
  const kb = f.sizeKB;
  const size = kb >= 1024 ? (kb / 1024).toFixed(1) + " MB" : kb + " KB";
  return f.pages ? f.pages + " pages · " + size : size;
}

function FileRow({ file, folderName, why, selected, onToggle }: { file: DriveFile; folderName?: string; why?: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className="list-hover"
      style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 11, padding: "10px 10px", margin: "0 -10px", borderRadius: 12, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          flex: "none",
          background: file.ext === "pdf" ? "rgba(224,65,65,.1)" : "rgba(0,157,255,.12)",
          color: file.ext === "pdf" ? "var(--danger-500)" : "var(--brand-600)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon path={PDF_ICON} size={15} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
        <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>
          {folderName ? folderName + " · " : ""}
          {fileSizeLabel(file)}
        </span>
        {why && <span style={{ display: "block", fontSize: 11, color: "var(--accent-purple)", marginTop: 2 }}>{why}</span>}
      </span>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          flex: "none",
          border: selected ? "none" : "1.5px solid rgba(0,32,63,.16)",
          background: selected ? "var(--brand-600)" : "transparent",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <Icon path={CHECK_ICON} size={13} />}
      </span>
    </button>
  );
}

export function BookletPicker({ open, onClose, courseId, sessionISO, fixedTarget, defaultKind = "booklet", preselectFileId }: BookletPickerProps) {
  const { assignMaterial } = useTutor();

  const [mode, setMode] = useState<"search" | "browse">("search");
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string>(DRIVE_FOLDERS[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [course, setCourse] = useState<TutorCourseId>(courseId ?? ONLINE_COURSE_IDS[0]);
  const [target, setTarget] = useState<AssignTarget>(fixedTarget ?? { kind: "class" });
  const [kind, setKind] = useState<MaterialKind>(defaultKind);
  const [due, setDue] = useState("");
  // Which course accordions are expanded in the ASSIGN TO section.
  const [openCourseIds, setOpenCourseIds] = useState<Set<string>>(new Set([courseId ?? ONLINE_COURSE_IDS[0]]));

  // Every class the tutor teaches is assignable - a student sometimes needs a
  // booklet from a different year level, so the target is never locked to the
  // course the booklet was opened from (that course just becomes the default).
  const assignCourseIds = TUTOR_COURSE_ORDER;
  const toggleCourseOpen = (cid: string) =>
    setOpenCourseIds((s) => {
      const n = new Set(s);
      if (n.has(cid)) n.delete(cid);
      else n.add(cid);
      return n;
    });
  const selectTarget = (cid: TutorCourseId, t: AssignTarget) => {
    setCourse(cid);
    setTarget(t);
  };
  const chipStyle = (on: boolean): React.CSSProperties => ({
    height: 30,
    padding: "0 13px",
    borderRadius: 980,
    border: "1px solid rgba(0,32,63,.1)",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    background: on ? "rgba(0,157,255,.16)" : "rgba(255,255,255,.7)",
    color: on ? "var(--brand-600)" : "var(--fg2)",
  });

  // The caller may open this same (always-mounted) picker with a different
  // defaultKind / preselected file each time, so re-sync on every open rather
  // than only reading the props once at first mount. When a booklet is
  // preselected we jump to its folder and tick it, so the tutor lands on the
  // exact file already chosen instead of an empty picker.
  useEffect(() => {
    if (!open) return;
    setKind(defaultKind);
    const initialCourse = courseId ?? ONLINE_COURSE_IDS[0];
    setCourse(initialCourse);
    setTarget(fixedTarget ?? { kind: "class" });
    setOpenCourseIds(new Set([initialCourse]));
    if (preselectFileId) {
      const file = DRIVE_FILES.find((f) => f.id === preselectFileId);
      setSelected(new Set([preselectFileId]));
      if (file) {
        setMode("browse");
        setActiveFolder(file.folderId);
      }
    } else {
      setSelected(new Set());
      setMode("search");
    }
  }, [open, defaultKind, preselectFileId, courseId, fixedTarget]);

  // `course` is seeded from the caller's courseId (if any) on open, then follows
  // the tutor's ASSIGN TO choice - so it's the single source of truth here.
  const effectiveCourseId = course;

  const searchResults = useMemo(() => (mode === "search" ? searchDrive(query) : []), [mode, query]);
  const folderFiles = useMemo(() => DRIVE_FILES.filter((f) => f.folderId === activeFolder), [activeFolder]);
  const folderById = useMemo(() => new Map(DRIVE_FOLDERS.map((f) => [f.id, f])), []);

  if (!open) return null;

  const toggleFile = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setQuery("");
    setSelected(new Set());
    setMode("search");
    setDue("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (selected.size === 0 || !effectiveCourseId) return;
    assignMaterial({
      fileIds: Array.from(selected),
      courseId: effectiveCourseId,
      target,
      kind,
      sessionISO,
      due: kind === "worksheet" && due.trim() ? due.trim() : undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      onClose={handleClose}
      labelledBy="booklet-picker-title"
      panelClassName="thin-scroll"
      panelStyle={{ width: 600, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", background: "rgba(255,255,255,.96)", padding: 24 }}
    >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <div id="booklet-picker-title" style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Assign materials</div>
            <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 4, lineHeight: 1.45 }}>
              Search or browse the linked Drive, then assign materials to a class or a student.
            </div>
          </div>
          <button onClick={handleClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14, lineHeight: 1, flex: "none", background: "#fff" }}>
            ✕
          </button>
        </div>

        {/* Search / browse toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <button
            onClick={() => setMode("search")}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 10,
              border: "none",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: mode === "search" ? "rgba(0,157,255,.16)" : "rgba(0,32,63,.05)",
              color: mode === "search" ? "var(--brand-600)" : "var(--fg3)",
            }}
          >
            Search
          </button>
          <button
            onClick={() => setMode("browse")}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 10,
              border: "none",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: mode === "browse" ? "rgba(0,157,255,.16)" : "rgba(0,32,63,.05)",
              color: mode === "browse" ? "var(--brand-600)" : "var(--fg3)",
            }}
          >
            Browse folders
          </button>
        </div>

        {mode === "search" ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <Icon path={SEARCH_ICON} size={16} style={{ position: "absolute", left: 13, top: 12, color: "var(--fg4)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "titration", "forces", "essay" ...'
                style={{
                  width: "100%",
                  height: 40,
                  boxSizing: "border-box",
                  borderRadius: 11,
                  border: "1px solid rgba(0,32,63,.12)",
                  background: "rgba(255,255,255,.85)",
                  padding: "0 12px 0 38px",
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {searchResults.map(({ file, folder, why }) => (
                <FileRow key={file.id} file={file} folderName={folder.name} why={why} selected={selected.has(file.id)} onToggle={() => toggleFile(file.id)} />
              ))}
              {query.trim() && searchResults.length === 0 && (
                <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "14px 4px" }}>No matches. Try a different word, or browse folders instead.</div>
              )}
              {!query.trim() && (
                <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "14px 4px" }}>Start typing a topic, concept or file name.</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {DRIVE_FOLDERS.map((f) => {
                const on = activeFolder === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFolder(f.id)}
                    style={{
                      height: 30,
                      padding: "0 13px",
                      borderRadius: 980,
                      border: "1px solid rgba(0,32,63,.1)",
                      fontFamily: "inherit",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: on ? "rgba(0,157,255,.16)" : "rgba(255,255,255,.7)",
                      color: on ? "var(--brand-600)" : "var(--fg2)",
                    }}
                  >
                    {f.name}
                  </button>
                );
              })}
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {folderFiles.map((file) => (
                <FileRow key={file.id} file={file} selected={selected.has(file.id)} onToggle={() => toggleFile(file.id)} />
              ))}
              {folderFiles.length === 0 && <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "14px 4px" }}>No files in this folder.</div>}
            </div>
          </div>
        )}

        {/* Target chooser - courses collapse, expand one to pick whole class or
            an individual student (keeps a full roster from getting huge). */}
        {!fixedTarget && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 6 }}>ASSIGN TO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assignCourseIds.map((cid) => {
                const cData = TUTOR_COURSES[cid];
                const expanded = openCourseIds.has(cid);
                const courseSelected = effectiveCourseId === cid;
                const selLabel = courseSelected ? (target.kind === "class" ? "Whole class" : target.studentName) : null;
                return (
                  <div
                    key={cid}
                    style={{
                      border: "1px solid " + (courseSelected ? "rgba(0,157,255,.4)" : "rgba(0,32,63,.1)"),
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "rgba(255,255,255,.55)",
                    }}
                  >
                    <button
                      onClick={() => toggleCourseOpen(cid)}
                      aria-expanded={expanded}
                      style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "9px 12px", border: "none", background: "none", fontFamily: "inherit", textAlign: "left", cursor: "pointer" }}
                    >
                      <span style={{ width: 30, height: 30, borderRadius: 9, background: cData.bg, color: cData.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        <Icon path={cData.icon} size={15} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{cData.name}</span>
                        <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{cData.students.length} students</span>
                      </span>
                      {selLabel && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.12)", padding: "3px 9px", borderRadius: 980, flex: "none" }}>{selLabel}</span>
                      )}
                      <Icon path={CHEV} size={16} style={{ color: "var(--fg4)", flex: "none", transition: "transform .2s ease", transform: expanded ? "rotate(180deg)" : "none" }} />
                    </button>
                    {expanded && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 12px 11px" }}>
                        <button onClick={() => selectTarget(cid, { kind: "class" })} style={chipStyle(courseSelected && target.kind === "class")}>
                          Whole class
                        </button>
                        {cData.students.map((st) => {
                          const on = courseSelected && target.kind === "student" && target.studentId === st.name;
                          return (
                            <button key={st.name} onClick={() => selectTarget(cid, { kind: "student", studentId: st.name, studentName: st.name })} style={chipStyle(on)}>
                              {st.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kind toggle */}
        <div style={{ marginBottom: due || kind === "worksheet" ? 10 : 18 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 6 }}>TYPE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ASSIGN_KINDS.map((k) => {
              const on = kind === k;
              return (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 980,
                    border: "1px solid rgba(0,32,63,.1)",
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: on ? "rgba(0,157,255,.16)" : "rgba(255,255,255,.7)",
                    color: on ? "var(--brand-600)" : "var(--fg2)",
                  }}
                >
                  {MATERIAL_KIND_META[k].label}
                </button>
              );
            })}
          </div>
          {kind === "worksheet" && (
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 6 }}>Worksheets must be completed by the student and sent back.</div>
          )}
        </div>

        {kind === "worksheet" && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 6 }}>DUE DATE (OPTIONAL)</div>
            <input
              value={due}
              onChange={(e) => setDue(e.target.value)}
              placeholder="e.g. 2026-07-11"
              style={{
                width: "100%",
                height: 38,
                boxSizing: "border-box",
                borderRadius: 11,
                border: "1px solid rgba(0,32,63,.12)",
                background: "rgba(255,255,255,.85)",
                padding: "0 12px",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            />
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(0,32,63,.08)", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--fg3)" }}>{selected.size} file{selected.size === 1 ? "" : "s"} selected</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleClose} className="btn-ghost" style={{ height: 40, padding: "0 18px", borderRadius: 12, fontSize: 13, color: "var(--fg2)", background: "rgba(255,255,255,.8)" }}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="btn-primary"
              style={{ height: 40, padding: "0 22px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: selected.size === 0 ? 0.5 : 1, cursor: selected.size === 0 ? "not-allowed" : "pointer" }}
            >
              Assign {MATERIAL_KIND_META[kind].label.toLowerCase()}{selected.size > 1 ? "s" : ""}
            </button>
          </div>
        </div>
    </Modal>
  );
}
