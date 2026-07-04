// My Booklets - the tutor's view onto the Drive the Everest admin office has
// linked for online teaching materials. Search is the deterministic "AI"
// search (searchDrive), folder browse is the fallback when nothing is typed.
// Every file has Preview (opens the in-portal viewer) and Assign (opens
// BookletPicker pre-selected on that file). A prominent Assign CTA opens the
// picker empty for free search-and-assign.

import React, { useMemo, useState } from "react";
import { useTutor } from "@/lib/tutor-store";
import {
  DRIVE_FILES,
  DRIVE_FOLDERS,
  DriveFile,
  DriveFolder,
  MATERIAL_KIND_META,
  MATERIAL_KIND_ORDER,
  MaterialKind,
  TUTOR_COURSES,
  TutorCourseId,
  searchDrive,
} from "@/lib/tutor-data";
import { ICON } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { BookletPicker } from "@/components/tutor/BookletPicker";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";

function fileSizeLabel(f: DriveFile): string {
  const size = f.sizeKB >= 1024 ? (f.sizeKB / 1024).toFixed(1) + " MB" : f.sizeKB + " KB";
  return f.pages ? f.pages + " pages · " + size : size;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned", color: "var(--accent-purple)", bg: "rgba(122,90,248,.13)" },
  submitted: { label: "Submitted", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  graded: { label: "Graded", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
};

// One booklet as a list row (not a card): file meta, topics, then Preview and
// Assign actions. Used by both search results and folder detail.
function BookletRow({
  file,
  folder,
  why,
  onPreview,
  onAssign,
  last,
}: {
  file: DriveFile;
  folder?: DriveFolder;
  why?: string;
  onPreview: () => void;
  onAssign: () => void;
  last?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: last ? "none" : "1px solid rgba(0,32,63,.06)" }}>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flex: "none",
          background: file.ext === "pdf" ? "rgba(224,65,65,.1)" : "rgba(0,157,255,.12)",
          color: file.ext === "pdf" ? "var(--danger-500)" : "var(--brand-600)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon path={ICON.doc} size={16} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
        <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {folder ? folder.name + " · " : ""}
          {fileSizeLabel(file)}
          {file.topics.length > 0 ? " · " + file.topics.slice(0, 3).join(", ") : ""}
        </span>
        {why && <span style={{ display: "block", fontSize: 11, color: "var(--accent-purple)", marginTop: 2 }}>{why}</span>}
      </span>
      <button onClick={onPreview} className="btn-ghost press" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", flex: "none" }}>
        Preview
      </button>
      <button onClick={onAssign} className="btn-primary press" style={{ height: 30, padding: "0 14px", borderRadius: 9, fontSize: 11.5, flex: "none" }}>
        Assign
      </button>
    </div>
  );
}

export default function BookletsPage() {
  const { hasOnline, effectiveAssignments, removeAssignment } = useTutor();
  const [activeFolder, setActiveFolder] = useState<DriveFolder | null>(null);
  const [q, setQ] = useState("");
  const [picker, setPicker] = useState<{ courseId?: TutorCourseId; fileId?: string } | null>(null);
  const [preview, setPreview] = useState<{ name: string; meta: string } | null>(null);

  // Recently assigned controls
  const [assignQ, setAssignQ] = useState("");
  const [assignKind, setAssignKind] = useState<"all" | MaterialKind>("all");
  const [assignStatus, setAssignStatus] = useState<"all" | "assigned" | "submitted" | "graded">("all");

  // Folder detail controls
  const [folderKind, setFolderKind] = useState<"all" | "pdf" | "docx">("all");
  const [folderSort, setFolderSort] = useState<"name" | "size" | "pages">("name");

  const ql = q.trim();
  const searchResults = useMemo(() => (ql ? searchDrive(ql) : []), [ql]);
  const folderFiles = useMemo(() => {
    if (!activeFolder) return [];
    const list = DRIVE_FILES.filter((f) => f.folderId === activeFolder.id && (folderKind === "all" || f.ext === folderKind));
    const sorted = [...list];
    if (folderSort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (folderSort === "size") sorted.sort((a, b) => b.sizeKB - a.sizeKB);
    else sorted.sort((a, b) => (b.pages || 0) - (a.pages || 0));
    return sorted;
  }, [activeFolder, folderKind, folderSort]);

  const assignments = useMemo(() => {
    const needle = assignQ.trim().toLowerCase();
    return effectiveAssignments.filter((a) => {
      if (assignKind !== "all" && a.kind !== assignKind) return false;
      if (assignStatus !== "all" && a.status !== assignStatus) return false;
      if (needle) {
        const cd = TUTOR_COURSES[a.courseId];
        const hay = (a.fileName + " " + cd.name + " " + (a.target.kind === "class" ? "whole class" : a.target.studentName)).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [effectiveAssignments, assignQ, assignKind, assignStatus]);

  if (!hasOnline) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>My Booklets is part of online teaching</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Your account is set up for in-person booklet requests only. Ask the office if your role is changing.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* SEARCH + prominent Assign CTA */}
      <div className="glass-card" style={{ padding: "16px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <div className="ev-stack-sm" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 11, padding: "0 13px", height: 44, flex: 1, minWidth: 0 }}>
            <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={14} style={{ color: "var(--fg4)" }} />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setActiveFolder(null); }}
              placeholder='Search inside your booklets - try "curly arrows", "Le Chatelier", "titration" ...'
              aria-label="Search booklets"
              style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", flex: 1, minWidth: 0 }}
            />
            {q && (
              <button onClick={() => setQ("")} className="btn-ghost" style={{ height: 28, padding: "0 12px", borderRadius: 8, fontSize: 11.5, flex: "none" }}>
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => setPicker({})}
            className="btn-primary press"
            style={{ height: 44, padding: "0 20px", borderRadius: 11, fontSize: 13.5, fontWeight: 700, flex: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Icon path="M12 5v14M5 12h14" size={16} stroke />
            Assign a booklet
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, fontSize: 11.5, color: "var(--fg4)" }}>
          <Icon path="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" size={13} style={{ color: "var(--accent-purple)", flex: "none" }} />
          Smart search reads file names, topics and the text inside each booklet.
        </div>

        {ql && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 4 }}>
              {searchResults.length} MATCH{searchResults.length === 1 ? "" : "ES"} FOR &quot;{ql}&quot;
            </div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0", color: "var(--fg4)" }}>
                <Icon path={ICON.drive} size={30} style={{ color: "var(--fg5-decorative)" }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: "var(--fg3)" }}>No matches</div>
                <div style={{ fontSize: 12, marginTop: 3 }}>Try a different word, or browse the folders below.</div>
              </div>
            ) : (
              <div>
                {searchResults.map(({ file, folder, why }, i) => (
                  <BookletRow
                    key={file.id}
                    file={file}
                    folder={folder}
                    why={why}
                    last={i === searchResults.length - 1}
                    onPreview={() => setPreview({ name: file.name, meta: folder.name })}
                    onAssign={() => setPicker({ courseId: folder.courseId, fileId: file.id })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOLDER BROWSE (only when not searching) */}
      {!ql && !activeFolder && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 14 }}>
          {DRIVE_FOLDERS.map((f, i) => {
            const count = DRIVE_FILES.filter((x) => x.folderId === f.id).length;
            const cd = f.courseId ? TUTOR_COURSES[f.courseId] : null;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f)}
                className="glass-card is-interactive"
                style={{ padding: "20px 20px 18px", boxSizing: "border-box", animation: `evrise .5s cubic-bezier(.16,1,.3,1) ${0.14 + i * 0.05}s backwards`, textAlign: "left", border: "none", fontFamily: "inherit", display: "block", width: "100%" }}
              >
                <span style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(0,157,255,.1)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon path={ICON.library} size={19} />
                </span>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{f.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>
                  {count} file{count === 1 ? "" : "s"}{cd ? " · " + cd.name : ""}
                </div>
                {f.note && <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 5, lineHeight: 1.4 }}>{f.note}</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* FOLDER DETAIL - list of booklets with Preview + Assign */}
      {!ql && activeFolder && (
        <div className="glass-card" style={{ padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .1s backwards" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
            <button
              onClick={() => setActiveFolder(null)}
              style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--brand-600)", padding: 0 }}
            >
              Booklets
            </button>
            <span style={{ color: "var(--fg5-decorative)" }}>›</span>
            <span>{activeFolder.name}</span>
          </div>
          {/* filter + sort */}
          <div className="ev-wrap-sm" style={{ display: "flex", gap: 8, margin: "10px 0 4px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--fg4)", flex: 1, minWidth: 120 }}>{folderFiles.length} file{folderFiles.length === 1 ? "" : "s"}</span>
            <select value={folderKind} onChange={(e) => setFolderKind(e.target.value as typeof folderKind)} aria-label="Filter folder by file type" style={selStyle}>
              <option value="all">All types</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
            </select>
            <select value={folderSort} onChange={(e) => setFolderSort(e.target.value as typeof folderSort)} aria-label="Sort folder" style={selStyle}>
              <option value="name">Name A-Z</option>
              <option value="size">Largest first</option>
              <option value="pages">Most pages</option>
            </select>
          </div>
          {folderFiles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "var(--fg4)" }}>
              <Icon path={ICON.drive} size={30} style={{ color: "var(--fg5-decorative)" }} />
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: "var(--fg3)" }}>No files match those filters</div>
            </div>
          ) : (
            <div className="thin-scroll" style={{ maxHeight: 420, overflowY: "auto" }}>
              {folderFiles.map((file, i) => (
                <BookletRow
                  key={file.id}
                  file={file}
                  last={i === folderFiles.length - 1}
                  onPreview={() => setPreview({ name: file.name, meta: activeFolder.name })}
                  onAssign={() => setPicker({ courseId: activeFolder.courseId, fileId: file.id })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* RECENTLY ASSIGNED - searchable, filterable, scrollable, shows all */}
      <div className="glass-card" style={{ padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .18s backwards" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <h2 className="portal-section-title" style={{ fontSize: 15 }}>Assigned materials</h2>
          <span style={{ fontSize: 12, color: "var(--fg4)" }}>{assignments.length} of {effectiveAssignments.length}</span>
        </div>
        <div className="ev-wrap-sm" style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <div className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 10, padding: "0 12px", height: 38, flex: 1, minWidth: 180 }}>
            <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={13} style={{ color: "var(--fg4)", flex: "none" }} />
            <input
              value={assignQ}
              onChange={(e) => setAssignQ(e.target.value)}
              placeholder="Search assigned by file, class or student"
              aria-label="Search assigned materials"
              style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12.5, color: "var(--fg1)", flex: 1, minWidth: 0 }}
            />
          </div>
          <select value={assignKind} onChange={(e) => setAssignKind(e.target.value as typeof assignKind)} aria-label="Filter by type" style={selStyle}>
            <option value="all">All types</option>
            {MATERIAL_KIND_ORDER.map((k) => (
              <option key={k} value={k}>{MATERIAL_KIND_META[k].label}</option>
            ))}
          </select>
          <select value={assignStatus} onChange={(e) => setAssignStatus(e.target.value as typeof assignStatus)} aria-label="Filter by status" style={selStyle}>
            <option value="all">All statuses</option>
            <option value="assigned">Assigned</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
          </select>
        </div>

        {effectiveAssignments.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "10px 0" }}>Nothing assigned yet. Search or browse above and hit Assign.</div>
        ) : assignments.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "10px 0" }}>No assigned materials match those filters.</div>
        ) : (
          <div className="thin-scroll" style={{ maxHeight: 360, overflowY: "auto" }}>
            {assignments.map((a, i) => {
              const cd = TUTOR_COURSES[a.courseId];
              const sm = STATUS_META[a.status];
              const km = MATERIAL_KIND_META[a.kind];
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < assignments.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,157,255,.1)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Icon path={ICON.doc} size={15} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.fileName}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cd.name} · {a.target.kind === "class" ? "Whole class" : a.target.studentName} · assigned {new Date(a.assignedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: km.color, background: km.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{km.label}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: sm.color, background: sm.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{sm.label}</span>
                  <button
                    onClick={() => removeAssignment(a.id)}
                    title="Remove"
                    aria-label={"Remove " + a.fileName}
                    className="btn-ghost press hit-area-8"
                    style={{ width: 28, height: 28, borderRadius: 8, fontSize: 13, color: "var(--danger-500)", flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {picker && (
        <BookletPicker
          open={!!picker}
          onClose={() => setPicker(null)}
          courseId={picker.courseId}
          preselectFileId={picker.fileId}
        />
      )}
      {preview && <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} annotate={false} />}
    </div>
  );
}

const selStyle: React.CSSProperties = {
  height: 38,
  borderRadius: 10,
  border: "1px solid rgba(0,32,63,.12)",
  background: "rgba(255,255,255,.8)",
  padding: "0 11px",
  fontFamily: "inherit",
  fontSize: 12.5,
  color: "var(--fg1)",
  flex: "none",
};
