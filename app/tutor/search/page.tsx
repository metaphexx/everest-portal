// Tutor search results - the full-page version of the header search. Pressing
// Enter in the header search lands here (/tutor/search?q=...); every result
// links to the page that holds it (courses, materials, requests, marking...).

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/router";
import { tutorSearch } from "@/lib/tutor-search";
import { useTutor } from "@/lib/tutor-store";
import { Icon } from "@/components/ui/Icon";

export default function TutorSearchPage() {
  return (
    <Suspense fallback={null}>
      <TutorSearchInner />
    </Suspense>
  );
}

function TutorSearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { requests, submissions } = useTutor();
  const q = params.get("q") ?? "";
  const [draft, setDraft] = useState(q);

  useEffect(() => setDraft(q), [q]);

  // Live index: pages, classes, students, Drive files, catalogue booklets, plus
  // the requests and submissions that exist right now.
  const results = useMemo(() => tutorSearch(q, { requests, submissions }, 24), [q, requests, submissions]);

  const runSearch = (text: string) => {
    const t = text.trim();
    router.push(t ? "/tutor/search?q=" + encodeURIComponent(t) : "/tutor/search");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* Refine box */}
      <div className="glass-card" style={{ padding: "16px 18px" }}>
        <div className="glass-control" style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "0 15px", height: 48 }}>
          <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={16} style={{ color: "var(--fg4)", flex: "none" }} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(draft)}
            placeholder="Search courses, students, materials, requests and more"
            aria-label="Search the portal"
            autoFocus
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 15, color: "var(--fg1)", minWidth: 0 }}
          />
        </div>
        {q && (
          <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 12 }}>
            {results.length > 0 ? (
              <>
                <b>{results.length}</b> result{results.length === 1 ? "" : "s"} for &quot;<b>{q}</b>&quot;
              </>
            ) : (
              <>No results for &quot;<b>{q}</b>&quot;</>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="glass-card" style={{ padding: "10px 12px" }}>
        {!q && (
          <div style={{ padding: "34px 12px", textAlign: "center", color: "var(--fg4)" }}>
            <Icon path="m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" size={30} style={{ color: "var(--fg5-decorative)" }} />
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 10, color: "var(--fg3)" }}>Start typing to search the portal</div>
            <div style={{ fontSize: 12, marginTop: 3 }}>Try a class, a student, a booklet or a request reference.</div>
          </div>
        )}

        {q && results.map((r, i) => (
          <button
            key={i}
            onClick={() => router.push(r.page)}
            className="list-hover"
            style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 13, padding: "12px 12px", borderRadius: 12, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 4, background: r.color, flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="ev-title-2" style={{ display: "block", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>{r.meta}</span>
            </span>
            <Icon path="M9 6l6 6-6 6" size={15} style={{ color: "var(--fg5-decorative)", flex: "none" }} />
          </button>
        ))}

        {q && results.length === 0 && (
          <div style={{ padding: "34px 12px", textAlign: "center", color: "var(--fg4)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg3)" }}>Nothing matched that search</div>
            <div style={{ fontSize: 12, marginTop: 3 }}>Try a different class, student or booklet name.</div>
          </div>
        )}
      </div>
    </div>
  );
}
