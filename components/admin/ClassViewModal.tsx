// What the office sees when it opens a class from the Schedule.
//
// It answers the two questions the office is actually asked on the phone: what
// is this class and who is teaching it, and what has been handed out for it.
// Nothing is invented - the Library lists the materials a tutor really assigned
// to this session plus the booklets on its print request, and the roll is the
// student records attached to the class. When there is nothing, it says so
// rather than drawing an empty frame.
//
// Editing is not a second screen: the header's Edit goes to the right place for
// the KIND of class. An online class is edited here; an in-person one is a room
// and a tutor allocation, which lives in Master Records.

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";
import { AdminSession, centreStyle } from "@/lib/admin-schedule";
import { allStudents } from "@/lib/admin-data";
import {
  BOOKLET_META,
  BookletRequest,
  MATERIAL_KIND_META,
  MaterialAssignment,
  MaterialKind,
  bookletStatusFromRequest,
} from "@/lib/tutor-data";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  edit: "M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z",
  book: "M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V4Zm3 14h9V7a1 1 0 0 0-1-1H6v12.2A3 3 0 0 1 7 18Z",
  user: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5Z",
};

function initialsOf(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? h + "h " + (m ? m + "m" : "") : m + "m";
}

/** A material in the Library list, however it got attached to the class. */
interface LibraryItem {
  id: string;
  name: string;
  kind: MaterialKind;
  note: string;
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "13px 14px", minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 9 }}>{label}</div>
      {children}
    </div>
  );
}

export function ClassViewModal({
  session,
  request,
  assignments,
  onClose,
  onEdit,
}: {
  session: AdminSession;
  /** The print request against this class, if one has been raised. */
  request?: BookletRequest;
  assignments: MaterialAssignment[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState<"library" | "participations">("library");
  const [kind, setKind] = useState<"all" | MaterialKind>("all");
  const [preview, setPreview] = useState<LibraryItem | null>(null);

  const s = session;
  const online = s.delivery === "online";
  const cs = centreStyle(online ? "Online" : s.centre);
  const dateLabel = new Date(s.k + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Everything genuinely attached to this class: what the tutor assigned, and
  // the booklets that were sent to the print room for it.
  const items = useMemo<LibraryItem[]>(() => {
    const out: LibraryItem[] = [];
    for (const a of assignments) {
      out.push({ id: a.id, name: a.fileName, kind: a.kind, note: MATERIAL_KIND_META[a.kind].label + " · assigned " + a.assignedAt });
    }
    if (request) {
      for (const it of request.items) {
        if (out.some((o) => o.name === it.name)) continue;
        out.push({ id: request.id + ":" + it.itemId, name: it.name, kind: "booklet", note: it.qty + " copies · " + request.printer });
      }
    }
    return out;
  }, [assignments, request]);

  const kinds = useMemo(() => [...new Set(items.map((i) => i.kind))], [items]);
  const shown = kind === "all" ? items : items.filter((i) => i.kind === kind);

  const roll = useMemo(() => allStudents().filter((st) => st.classNames.includes(s.className)), [s.className]);

  return (
    <>
      <Modal onClose={onClose} labelledBy="clsview-title" panelStyle={{ width: "min(700px, calc(100vw - 32px))", maxHeight: "min(90vh, 880px)", overflowY: "auto" }}>
        <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ flex: "none", width: 5, alignSelf: "stretch", borderRadius: 3, background: cs.colour }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span id="clsview-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>
                {s.className}
              </span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>{dateLabel}</span>
            </span>
            <span style={{ display: "inline-flex", gap: 8, flex: "none" }}>
              <button onClick={onEdit} aria-label="Edit this class" title="Edit this class" className="btn-ghost press ev-tap-h" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg2)" }}>
                <Icon path={IC.edit} size={14} />
              </button>
              <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)" }}>
                <Icon path={IC.close} size={14} />
              </button>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 16 }}>
            <Card label="SUBJECT AND COURSE">
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 34, height: 34, borderRadius: 11, background: cs.bg, color: cs.colour, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Icon path={IC.book} size={16} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{s.className}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--fg4)", marginTop: 3 }}>
                    <Icon path={IC.clock} size={12} />
                    {s.time}
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fg3)", background: "rgba(0,32,63,.06)", padding: "2px 7px", borderRadius: 980 }}>{durationLabel(s.durationMins ?? 60)}</span>
                  </span>
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 10, paddingTop: 9, borderTop: "1px solid rgba(0,32,63,.06)" }}>
                {online ? "Online · nothing is printed" : s.centre + " · in person"}
              </div>
            </Card>

            <Card label="ASSIGNED TUTOR">
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(14,156,142,.14)", color: "var(--accent-teal)", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  {initialsOf(s.tutor)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{s.tutor}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>{online ? "Takes this class online" : "Can request booklets for this class"}</span>
                </span>
              </div>
              {/* Read from the request itself where there is one. Deriving this
                  from the class's delivery alone said "no print request
                  applies" on a class whose booklets are listed below it. */}
              <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 10, paddingTop: 9, borderTop: "1px solid rgba(0,32,63,.06)" }}>
                {(() => {
                  const status = request ? bookletStatusFromRequest(request) : s.booklet;
                  if (!status) return "No booklets requested for this class";
                  return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                      Booklets
                      <span style={{ fontSize: 10, fontWeight: 700, color: BOOKLET_META[status].color, background: BOOKLET_META[status].bg, padding: "2px 8px", borderRadius: 980 }}>
                        {BOOKLET_META[status].label}
                      </span>
                    </span>
                  );
                })()}
              </div>
            </Card>
          </div>

          {/* tabs */}
          <div className="glass-control" style={{ display: "inline-flex", gap: 2, padding: 4, borderRadius: 12, marginTop: 16 }}>
            {([
              { id: "library", label: "Library" },
              { id: "participations", label: "Participations" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className="press ev-tap-h"
                style={{ height: 34, padding: "0 15px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: tab === t.id ? "var(--accent-teal)" : "transparent", color: tab === t.id ? "#fff" : "var(--fg3)" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "library" && (
            <div style={{ marginTop: 14 }}>
              {kinds.length > 1 && (
                <div className="ev-scroll-x" style={{ display: "flex", gap: 7, marginBottom: 10 }}>
                  {(["all", ...kinds] as const).map((k) => {
                    const on = kind === k;
                    const label = k === "all" ? "All" : MATERIAL_KIND_META[k as MaterialKind].plural;
                    return (
                      <button
                        key={k}
                        onClick={() => setKind(k as "all" | MaterialKind)}
                        aria-pressed={on}
                        className="press ev-tap-h"
                        style={{ height: 32, padding: "0 13px", borderRadius: 980, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", flex: "none", background: on ? "rgba(0,157,255,.12)" : "rgba(255,255,255,.8)", color: on ? "var(--brand-600)" : "var(--fg3)" }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {shown.length === 0 && (
                <div style={{ textAlign: "center", padding: "26px 10px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800 }}>Nothing handed out yet</div>
                  <div style={{ fontSize: 12, color: "var(--fg4)", marginTop: 5, lineHeight: 1.55 }}>
                    Materials a tutor assigns to this class, and any booklets requested for it, appear here.
                  </div>
                </div>
              )}

              {shown.map((it) => (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: MATERIAL_KIND_META[it.kind].bg, color: MATERIAL_KIND_META[it.kind].color, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Icon path={IC.doc} size={14} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, wordBreak: "break-word" }}>{it.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>{it.note}</span>
                  </span>
                  <button onClick={() => setPreview(it)} className="btn-ghost press ev-tap-h" style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)", flex: "none" }}>
                    Preview
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "participations" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11.5, color: "var(--fg3)", marginBottom: 4, lineHeight: 1.55 }}>
                {roll.length === 0
                  ? s.students + " seats are counted against this class in the timetable."
                  : roll.length + (roll.length === 1 ? " student is" : " students are") + " on the roll for this class."}
              </div>

              {roll.length === 0 && (
                <div style={{ textAlign: "center", padding: "26px 10px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800 }}>No student records attached</div>
                  <div style={{ fontSize: 12, color: "var(--fg4)", marginTop: 5, lineHeight: 1.55 }}>
                    Enrolments for this class have not been entered against student records yet.
                  </div>
                </div>
              )}

              {roll.map((st) => (
                <div key={st.name} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                  <span style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(14,156,142,.14)", color: "var(--accent-teal)", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    {st.initials}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{st.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>{st.year}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: st.attendance < 80 ? "var(--warn-700)" : "var(--fg3)", flex: "none" }}>{st.attendance}%</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={onEdit} className="btn-primary press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon path={IC.edit} size={13} />
              Edit this class
            </button>
            <span className="ev-spacer-flex" style={{ flex: 1 }} />
            <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
              Close
            </button>
          </div>
        </div>
      </Modal>

      <PdfPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        fileName={preview?.name ?? ""}
        meta={preview ? s.className + " · " + preview.note : undefined}
        annotate={false}
      />
    </>
  );
}
