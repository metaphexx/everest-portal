"use client";

// Study Materials - the booklet catalogue. Cascading Centre -> Year -> Subject
// -> Topic filters (topic stays disabled until the rest are chosen), a request
// context ("requesting materials for"), preview + add-to-cart per file.

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTutor } from "@/lib/tutor-store";
import {
  CATALOGUE,
  CENTRES,
  CAT_SUBJECTS,
  YEAR_GROUPS,
  courseSubject,
  topicsFor,
  TUTOR_COURSES,
} from "@/lib/tutor-data";
import { ICON } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { RequestTargetSelector } from "@/components/tutor/RequestTargetSelector";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";

const selStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 11,
  border: "1px solid rgba(0,32,63,.12)",
  background: "rgba(255,255,255,.8)",
  padding: "0 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: "var(--fg1)",
  minWidth: 0,
};

export default function StudyMaterialsPage() {
  return (
    <Suspense fallback={null}>
      <StudyMaterialsInner />
    </Suspense>
  );
}

function StudyMaterialsInner() {
  const { classes, cart, requestClassId, addToCart, showToast, hasInPerson } = useTutor();
  const searchParams = useSearchParams();

  const [centre, setCentre] = useState("Harrisdale SHS");
  const [year, setYear] = useState("Year 11");
  const [subject, setSubject] = useState("Chemistry");
  const [topic, setTopic] = useState("");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  // Deep link from History's "View preview": ?preview=<catalogue id> opens that
  // booklet's preview here, and searches for it so its row is on screen.
  useEffect(() => {
    const pid = searchParams.get("preview");
    if (!pid) return;
    const item = CATALOGUE.find((c) => c.id === pid);
    if (item) {
      setPreview(pid);
      setQ(item.name);
    }
  }, [searchParams]);

  // When a real class is chosen in the "requesting materials for" selector, the
  // catalogue filters follow that class - its centre, year and subject are set
  // and locked. Only a Custom Request lets you pick any centre / year / subject.
  useEffect(() => {
    if (!requestClassId) return; // Custom Request - leave filters editable
    const cls = classes.find((c) => c.id === requestClassId);
    if (!cls) return;
    const cd = TUTOR_COURSES[cls.course];
    if (CENTRES.includes(cd.centre)) setCentre(cd.centre);
    setYear(cd.year);
    const subj = courseSubject(cls.course);
    if (subj) setSubject(subj);
    setTopic("");
  }, [requestClassId, classes]);

  const topics = useMemo(() => (subject && year ? topicsFor(subject, year) : []), [subject, year]);
  const topicChosen = topic !== "";

  const results = useMemo(() => {
    if (!topicChosen && !q.trim()) return [];
    return CATALOGUE.filter((c) => {
      if (q.trim()) return (c.name + " " + c.subject + " " + c.year + " " + c.topic).toLowerCase().includes(q.trim().toLowerCase());
      return c.subject === subject && c.year === year && c.topic === topic;
    });
  }, [topicChosen, topic, subject, year, q]);

  const inCart = (id: string) => cart.some((c) => c.itemId === id);
  const ctxClass = requestClassId ? classes.find((c) => c.id === requestClassId) : null;
  const defaultQty = ctxClass ? TUTOR_COURSES[ctxClass.course].students.length : 8;

  // Filters are locked to the selected class (Custom Request keeps them free).
  // Centre only locks to a real print centre; subject stays free for the
  // multi-subject Year 8 Core Block, where courseSubject() is null.
  const lockCentre = !!ctxClass && CENTRES.includes(TUTOR_COURSES[ctxClass.course].centre);
  const lockYear = !!ctxClass;
  const lockSubject = !!ctxClass && !!courseSubject(ctxClass.course);
  const lockedStyle = (locked: boolean): React.CSSProperties => (locked ? { opacity: 0.65, cursor: "not-allowed", background: "rgba(0,32,63,.04)" } : {});

  if (!hasInPerson) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>Study Materials is part of in-person booklet requests</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>
          Your account is set up for online teaching only. Browse and assign booklets from{" "}
          <Link href="/tutor/booklets" style={{ color: "var(--brand-600)", fontWeight: 600 }}>My Booklets</Link> instead.
        </div>
      </div>
    );
  }

  const previewItem = preview ? CATALOGUE.find((c) => c.id === preview) : null;

  return (
    <>
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* REQUEST CONTEXT */}
      <div style={{ gridColumn: "span 12", position: "relative", zIndex: "var(--z-nav)" }}>
        <RequestTargetSelector />
      </div>

      {/* FILTERS */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .12s backwards" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15 }}>Find study materials</h2>
          {ctxClass ? (
            <span style={{ fontSize: 12, color: "var(--fg4)", fontWeight: 600 }}>Set from {TUTOR_COURSES[ctxClass.course].name} · pick Custom Request to change</span>
          ) : (!topicChosen && !q.trim() && (
            <span style={{ fontSize: 12, color: "var(--warn-700)", fontWeight: 600 }}>Choose down to a topic to see materials, or search the whole drive</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <select value={centre} onChange={(e) => setCentre(e.target.value)} disabled={lockCentre} style={{ ...selStyle, ...lockedStyle(lockCentre) }} aria-label="Centre">
            {CENTRES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => { setYear(e.target.value); setTopic(""); }} disabled={lockYear} style={{ ...selStyle, ...lockedStyle(lockYear) }} aria-label="Year group">
            {YEAR_GROUPS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <select value={subject} onChange={(e) => { setSubject(e.target.value); setTopic(""); }} disabled={lockSubject} style={{ ...selStyle, ...lockedStyle(lockSubject) }} aria-label="Subject">
            {CAT_SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} disabled={topics.length === 0} style={{ ...selStyle, opacity: topics.length === 0 ? 0.5 : 1 }} aria-label="Topic">
            <option value="">{topics.length === 0 ? "Topic (no materials here yet)" : "Choose a topic"}</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <div className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 11, padding: "0 13px", height: 40, flex: 1 }}>
            <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={14} style={{ color: "var(--fg4)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Or search everything in the drive" style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", flex: 1 }} />
          </div>
          {(topicChosen || q) && (
            <button onClick={() => { setTopic(""); setQ(""); }} className="btn-ghost" style={{ height: 40, padding: "0 16px", borderRadius: 11, fontSize: 12.5 }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* RESULTS */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .18s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, marginBottom: 6 }}>
          {q.trim() ? "Search results" : topicChosen ? subject + " · " + year + " · " + topic : "Materials"}
        </h2>
        {results.length === 0 && (
          <div style={{ textAlign: "center", padding: "36px 0", color: "var(--fg4)" }}>
            <Icon path={ICON.library} size={34} style={{ color: "var(--fg5-decorative)" }} />
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 10, color: "var(--fg3)" }}>
              {topicChosen || q.trim() ? "No materials match that yet" : "Pick a centre, year group, subject and topic"}
            </div>
            <div style={{ fontSize: 12, marginTop: 3 }}>
              {topicChosen || q.trim() ? "Try a different topic or search term." : "The topic list unlocks once the other filters are set."}
            </div>
          </div>
        )}
        {results.map((m, i) => {
          const added = inCart(m.id);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < results.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(0,157,255,.1)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon path={ICON.doc} size={16} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>
                  {m.subject} · {m.year} · {m.topic} · {m.pages} pages · updated {m.updated}
                </span>
              </span>
              <button onClick={() => setPreview(m.id)} className="btn-ghost" style={{ height: 30, padding: "0 13px", borderRadius: 9, fontSize: 11.5, color: "var(--brand-600)", background: "rgba(255,255,255,.7)", flex: "none" }}>
                Preview
              </button>
              <button
                onClick={() => (added ? showToast("Already in your cart. Adjust the copies there.") : addToCart(m, defaultQty))}
                className={added ? "btn-ghost press" : "btn-primary press"}
                style={{ height: 30, padding: "0 14px", borderRadius: 9, fontSize: 11.5, flex: "none", ...(added ? { color: "var(--success-700)", background: "rgba(34,160,91,.1)", border: "1px solid rgba(34,160,91,.3)" } : {}) }}
              >
                {added ? "In cart" : "Add to cart"}
              </button>
            </div>
          );
        })}
      </div>
    </div>

    {/* Pop-up preview - same in-portal document viewer as My Booklets (loads the
        booklet, no annotation tools), rendered outside the cards so its overlay
        sits above everything. */}
    {previewItem && (
      <PdfPreviewModal
        open
        onClose={() => setPreview(null)}
        fileName={previewItem.name}
        meta={previewItem.subject + " · " + previewItem.year + " · " + previewItem.topic}
        annotate={false}
      />
    )}
    </>
  );
}
