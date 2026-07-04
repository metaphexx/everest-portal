// Search results - the full-page version of the header's AI search. Pressing
// Enter in the header search lands here (/search?q=...); every result links
// to the page that actually holds it. A refine box at the top re-runs the
// search without going back to the header.

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/router";
import { usePortal } from "@/lib/store";
import { aiSearch } from "@/lib/search";
import { Icon } from "@/components/ui/Icon";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { outlines, dueCount } = usePortal();
  const [draft, setDraft] = useState(q);

  // Keep the refine box in sync when the query in the URL changes.
  useEffect(() => setDraft(q), [q]);

  const { answer, hits } = useMemo(() => aiSearch(q, outlines, dueCount, 30), [q, outlines, dueCount]);

  const runSearch = (text: string) => {
    const t = text.trim();
    router.push(t ? "/search?q=" + encodeURIComponent(t) : "/search");
  };

  const total = hits.length + (answer ? 1 : 0);

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
            placeholder="Search your courses, worksheets, grades and more"
            aria-label="Search the portal"
            autoFocus
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 15, color: "var(--fg1)", minWidth: 0 }}
          />
          <span title="AI search: understands questions and everyday words" aria-hidden="true" style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, color: "var(--accent-violet)", background: "rgba(122,90,248,.12)", padding: "3px 7px", borderRadius: 980, flex: "none" }}>AI</span>
        </div>
        {q && (
          <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 12 }}>
            {total > 0 ? (
              <>
                <b>{total}</b> result{total === 1 ? "" : "s"} for &quot;<b>{q}</b>&quot;
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
            <div style={{ fontSize: 12, marginTop: 3 }}>Try &quot;what&apos;s due&quot;, a subject, a tutor or a booklet name.</div>
          </div>
        )}

        {q && answer && (
          <button
            onClick={() => router.push(answer.page)}
            className="list-hover"
            style={{ display: "flex", width: "100%", textAlign: "left", gap: 11, padding: "13px 12px", borderRadius: 12, cursor: "pointer", background: "rgba(122,90,248,.06)", border: "1px solid rgba(122,90,248,.16)", marginBottom: 6, alignItems: "flex-start", fontFamily: "inherit" }}
          >
            <span aria-hidden="true" style={{ fontSize: 15, marginTop: 1 }}>✦</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, color: "#2E1E66" }}>{answer.text}</span>
              <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, color: "var(--accent-violet)", marginTop: 4 }}>{answer.label} →</span>
            </span>
          </button>
        )}

        {q && hits.map((r, i) => (
          <button
            key={i}
            onClick={() => router.push(r.page)}
            className="list-hover"
            style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 13, padding: "12px 12px", borderRadius: 12, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 4, background: r.color, flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>{r.meta}</span>
            </span>
            <Icon path="M9 6l6 6-6 6" size={15} style={{ color: "var(--fg5-decorative)", flex: "none" }} />
          </button>
        ))}

        {q && total === 0 && (
          <div style={{ padding: "34px 12px", textAlign: "center", color: "var(--fg4)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg3)" }}>Nothing matched that search</div>
            <div style={{ fontSize: 12, marginTop: 3 }}>Try a different word, or ask a question like &quot;what&apos;s due this week?&quot;</div>
          </div>
        )}
      </div>
    </div>
  );
}
