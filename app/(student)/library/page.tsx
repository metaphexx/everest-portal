"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { ACCENT, COURSE_DEFS, COURSE_ORDER, CourseId, EVENTS, ICON, LIB_CATEGORIES, matsFor, pastSessions, TITLE_TO_CID } from "@/lib/data";
import { DOWS_MON, monthGrid, monthLabel, todayKey } from "@/lib/calendar";
import { Icon } from "@/components/ui/Icon";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";

export default function LibraryPage() {
  const { now, vm, vy, prevMonth, nextMonth } = usePortal();
  const tKey = todayKey(now);

  const [libOpen, setLibOpen] = useState<CourseId | "">("chem");
  const [selKey, setSelKey] = useState("");
  const [selDate, setSelDate] = useState("");
  const [selCourse, setSelCourse] = useState<CourseId>("chem");
  const [cat, setCat] = useState("Study Materials");
  const [allFor, setAllFor] = useState<CourseId | "">("");
  const [preview, setPreview] = useState<{ name: string; meta: string } | null>(null);

  const pickSession = (cid: CourseId, k: string) => {
    setLibOpen(cid);
    setSelKey(cid + k);
    setSelDate(k);
    setSelCourse(cid);
    setAllFor("");
    setCat("Study Materials");
  };

  // detail
  let detailTitle = "Browse materials";
  let showCats = false;
  let items: { name: string; tag: string }[] = [];
  if (allFor) {
    detailTitle = "Every material, " + COURSE_DEFS[allFor].name;
    pastSessions(allFor, tKey).forEach((s) => LIB_CATEGORIES.forEach((cn) => matsFor(allFor, s.k, cn).forEach((nm) => items.push({ name: nm, tag: cn }))));
  } else if (selKey) {
    showCats = true;
    detailTitle = COURSE_DEFS[selCourse].name + " · " + new Date(selDate + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
    items = matsFor(selCourse, selDate, cat).map((nm) => ({ name: nm, tag: cat }));
  }
  const empty = !allFor && !selKey;

  const cells = monthGrid(vm, vy);

  return (
    <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* Left: browse by course */}
      <div className="glass-card" style={{ padding: "16px 20px" }}>
        <h2 style={{ margin: "4px 0 8px", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Browse by course</h2>
        {COURSE_ORDER.map((cid) => {
          const cd = COURSE_DEFS[cid];
          const open = libOpen === cid;
          const sessions = pastSessions(cid, tKey);
          return (
            <div key={cid} style={{ borderBottom: "1px solid rgba(0,32,63,.06)" }}>
              <button onClick={() => setLibOpen(open ? "" : cid)} aria-expanded={open} className="row-hover" style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, padding: "12px 4px", cursor: "pointer", borderRadius: 12, border: "none", background: "none", fontFamily: "inherit", textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, flex: "none", background: ACCENT[cid].bg, color: ACCENT[cid].color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon path={cd.icon} size={16} />
                </div>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{cd.name}</span>
                <Icon path="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z" size={14} style={{ color: "var(--fg4)", flex: "none", transition: "transform .25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              {open && (
                <div style={{ padding: "0 4px 12px 48px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)", marginBottom: 4 }}>PAST CLASSES</div>
                  {sessions.map((s, i) => {
                    const on = selKey === cid + s.k;
                    return (
                      <button key={i} onClick={() => pickSession(cid, s.k)} aria-pressed={on} className="list-hover" style={{ display: "flex", width: "100%", alignItems: "center", gap: 9, padding: "8px 10px", margin: "0 0 2px -10px", borderRadius: 10, cursor: "pointer", background: on ? "rgba(0,157,255,.1)" : "transparent", border: "none", fontFamily: "inherit", textAlign: "left" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT[cid].color, flex: "none" }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: on ? "var(--brand-600)" : "var(--fg2)" }}>{s.d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
                      </button>
                    );
                  })}
                  <button onClick={() => { setAllFor(cid); setSelKey(""); setLibOpen(cid); }} className="btn-ghost" style={{ marginTop: 8, height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: "var(--brand-600)", background: "rgba(255,255,255,.7)" }}>
                    View every material
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: calendar + detail */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="glass-card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>{monthLabel(vm, vy)}</h2>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={prevMonth} className="mini-nav" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 14 }}>‹</button>
              <button onClick={nextMonth} className="mini-nav" style={{ width: 28, height: 28, borderRadius: 9, fontSize: 14 }}>›</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, textAlign: "center", fontSize: 10.5, color: "var(--fg4)", fontWeight: 700, marginBottom: 4 }}>
            {DOWS_MON.map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, textAlign: "center" }}>
            {cells.map((c, i) => {
              const isToday = c.k === tKey;
              const hit = (EVENTS[c.k] || [])[0];
              const isPastEv = !!hit && c.k < tKey;
              const cid2 = hit ? TITLE_TO_CID[hit.title] : undefined;
              const isSelDay = selDate === c.k && !!selKey;
              return (
                <button
                  key={i}
                  onClick={isPastEv && cid2 ? () => pickSession(cid2, c.k) : undefined}
                  disabled={!(isPastEv && cid2)}
                  aria-label={c.d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }) + (hit ? ", " + hit.title : "")}
                  aria-pressed={isSelDay}
                  className="list-hover"
                  style={{ padding: "2px 0", cursor: isPastEv ? "pointer" : "default", borderRadius: 10, display: "flex", justifyContent: "center", border: "none", background: "none", fontFamily: "inherit", width: "100%" }}
                >
                  <span style={{ position: "relative", display: "inline-flex", width: 30, height: 30, borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: isToday || isSelDay ? 700 : 500, background: isToday ? "var(--brand-500)" : isSelDay ? "rgba(0,157,255,.14)" : "transparent", color: isToday ? "#fff" : isSelDay ? "var(--brand-600)" : c.inMonth ? "var(--fg1)" : "var(--fg5-decorative)" }}>
                    {c.d.getDate()}
                    <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: hit ? (isToday ? "#fff" : isPastEv && cid2 ? ACCENT[cid2].color : "var(--fg5-decorative)") : "transparent" }} />
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 8 }}>Days with a dot are class sessions. Pick a past one to open its materials.</div>
        </div>

        <div className="glass-card" style={{ padding: "20px 22px" }}>
          <h2 style={{ margin: "0 0 10px", fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 800 }}>{detailTitle}</h2>
          {showCats && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {LIB_CATEGORIES.map((cn) => {
                const on = cat === cn;
                return (
                  <button key={cn} onClick={() => setCat(cn)} style={{ height: 30, padding: "0 13px", borderRadius: 980, border: "1px solid rgba(0,32,63,.1)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, cursor: "pointer", transition: "background .2s ease,color .2s ease", background: on ? "rgba(0,157,255,.16)" : "rgba(255,255,255,.7)", color: on ? "var(--brand-600)" : "var(--fg2)" }}>{cn}</button>
                );
              })}
            </div>
          )}
          {empty && (
            <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "6px 0", lineHeight: 1.5 }}>
              Pick a class on the left, or a dotted day on the calendar, to browse its study materials, worksheets, booklets and recordings.
            </div>
          )}
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: "1px solid rgba(0,32,63,.06)" }}>
              <Icon path={ICON.doc} size={16} style={{ color: "var(--fg3)", flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fg3)", background: "rgba(0,32,63,.06)", padding: "3px 8px", borderRadius: 980, flex: "none" }}>{it.tag}</span>
              <a href="#" onClick={(e) => { e.preventDefault(); setPreview({ name: it.name, meta: it.tag }); }} style={{ fontSize: 11.5, color: "var(--brand-600)", textDecoration: "none", fontWeight: 700, flex: "none" }}>Preview</a>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} />
      )}
    </div>
  );
}
