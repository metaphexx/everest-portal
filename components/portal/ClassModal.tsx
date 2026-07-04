import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { COURSE_DEFS, ICON, LIB_CATEGORIES, matsFor } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";
import { Modal } from "@/components/ui/Modal";

function todayKey(now: number) {
  const d = new Date(now);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function ClassModal() {
  const { modal, modalCat, setModalCat, closeModal, now, showToast } = usePortal();
  const [preview, setPreview] = useState<{ name: string; video: boolean } | null>(null);
  if (!modal) return null;

  const tKey = todayKey(now);
  const isPast = !!(modal.cid && modal.k && modal.k < tKey);
  const items = isPast && modal.cid && modal.k ? matsFor(modal.cid, modal.k, modalCat) : [];
  const icon = modal.cid ? COURSE_DEFS[modal.cid].icon : ICON.cap;
  const tutorInit = (modal.tutor || "T").split(" ").map((p) => p[0]).join("").toUpperCase();
  const isRecording = modalCat === "Class Recordings";

  return (
    <>
    <Modal onClose={closeModal} labelledBy="class-modal-title" panelStyle={{ width: 560, maxWidth: "92vw", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div id="class-modal-title" style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 800, letterSpacing: -0.4 }}>{modal.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--fg4)", marginTop: 3 }}>{modal.dateLabel}</div>
          </div>
          <button onClick={closeModal} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 14, lineHeight: 1, flex: "none", background: "#fff" }}>
            ✕
          </button>
        </div>

        <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0 18px" }}>
          <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 16, padding: "14px 16px", background: "rgba(255,255,255,.55)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: modal.color, marginBottom: 9 }}>SUBJECT &amp; COURSE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: modal.bg, color: modal.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path={icon} size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{modal.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                  <Icon path="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z" size={12} style={{ color: "var(--fg3)" }} />
                  <span style={{ fontSize: 12, color: "var(--fg2)", fontWeight: 600 }}>{modal.time}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.12)", padding: "2px 8px", borderRadius: 980, whiteSpace: "nowrap" }}>1h 0m</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 16, padding: "14px 16px", background: "rgba(255,255,255,.55)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "var(--success-700)", marginBottom: 9 }}>ASSIGNED TUTOR</div>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", flex: "none", background: "linear-gradient(135deg,var(--accent-blue-light),var(--accent-violet-light))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{tutorInit}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{modal.tutor}</div>
                <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>Your tutor</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon path={ICON.library} size={16} style={{ color: "var(--brand-600)" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 800, color: "var(--brand-600)" }}>Library Resources</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {LIB_CATEGORIES.map((cname) => {
            const on = modalCat === cname;
            return (
              <button
                key={cname}
                onClick={() => setModalCat(cname)}
                style={{
                  height: 30,
                  padding: "0 13px",
                  borderRadius: 980,
                  border: "1px solid rgba(0,32,63,.1)",
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background .2s ease,color .2s ease",
                  background: on ? "rgba(0,157,255,.16)" : "rgba(255,255,255,.7)",
                  color: on ? "var(--brand-600)" : "var(--fg2)",
                }}
              >
                {cname}
              </button>
            );
          })}
        </div>

        {items.map((name, i) => (
          <button
            key={i}
            onClick={() => setPreview({ name, video: isRecording })}
            className="list-hover"
            style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 10, padding: "9px 10px", margin: "0 -10px", borderRadius: 10, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
          >
            <Icon path={isRecording ? "M8 5v14l11-7L8 5Z" : ICON.doc} size={15} style={{ color: "var(--fg3)" }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{name}</span>
            <span style={{ fontSize: 11.5, color: "var(--brand-600)", fontWeight: 600 }}>{isRecording ? "Watch" : "Preview"}</span>
          </button>
        ))}
        {items.length === 0 && (
          <div style={{ border: "1.5px dashed rgba(0,32,63,.14)", borderRadius: 14, padding: 24, textAlign: "center" }}>
            <Icon path={ICON.drive} size={30} style={{ color: "var(--fg5-decorative)" }} />
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg3)", marginTop: 6 }}>No files in this category yet</div>
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>Materials appear here once your tutor uploads them.</div>
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(0,32,63,.08)", marginTop: 16, paddingTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={closeModal} className="btn-ghost" style={{ height: 40, padding: "0 18px", borderRadius: 12, fontSize: 13, color: "var(--fg2)", background: "rgba(255,255,255,.8)" }}>
            Close
          </button>
          <button
            onClick={() => {
              closeModal();
              showToast("The classroom link opens at class time");
            }}
            className="btn-primary"
            style={{ height: 40, padding: "0 22px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}
          >
            Join Live Class
          </button>
        </div>
    </Modal>
    {preview && (
      <PdfPreviewModal
        open
        onClose={() => setPreview(null)}
        fileName={preview.name}
        meta={modal.title + " · " + modalCat}
        kind={preview.video ? "video" : "doc"}
      />
    )}
    </>
  );
}
