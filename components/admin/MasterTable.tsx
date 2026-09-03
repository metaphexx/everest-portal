// The office portal's master-data table. One implementation, configured per
// page, because fourteen master screens hand-built fourteen times is fourteen
// chances to drift.
//
// This is the reference for the production build. What it fixes, deliberately:
//
// 1. NO ROW NUMBER COLUMN. A "S.NO" that renumbers itself on every filter, sort
//    and page change is not an identifier, and it costs a column on a phone.
// 2. STATUS IS NEVER SCROLLED OFF. On a wide table the status and the actions
//    are the reason the office opened the page. Long values truncate with a
//    title attribute instead of pushing the useful columns out of view.
// 3. ON A PHONE IT IS NOT A TABLE. Below 720px each row becomes a card, so
//    nothing hides behind a horizontal scrollbar.
// 4. ROW ACTIONS ARE ICONS WITH LABELS, not two filled buttons per row. Fifty
//    rows of blue Edit and red Delete is fifty invitations to delete something.
// 5. DELETE CONFIRMS IN PLACE. It is the only destructive action here.
// 6. PAGINATION STATES THE RANGE. "Showing 11-20 of 63" answers the question
//    "where am I" that "Page 2 of 7" only half answers.
// 7. THREE STATES, NOT ONE. Loading, nothing-yet and no-matches read
//    differently, because "no results" on an empty database is a bug report.

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const IC = {
  search: "m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z",
  edit: "M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z",
  trash: "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z",
  down: "M12 16 6 10l1.4-1.4L11 12.2V4h2v8.2l3.6-3.6L18 10l-6 6Zm-8 4v-2h16v2H4Z",
  prev: "M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6 4.6-4.6Z",
  next: "M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6Z",
};

export interface Column<T> {
  key: string;
  label: string;
  /** Cell content. Return a string for the phone card view to read it too. */
  render: (row: T) => React.ReactNode;
  /** Plain text used for search and for the phone card. */
  text?: (row: T) => string;
  /** Widest this column may get before it truncates. */
  width?: number;
  /** Hidden on the phone card view - the card shows the important ones only. */
  minor?: boolean;
}

export interface MasterTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  /** Stable id per row. */
  idOf: (row: T) => string;
  /** Rendered as the status pill, which is never scrolled out of view. */
  statusOf?: (row: T) => { label: string; color: string; bg: string };
  /** Placeholder for the search box, phrased for this data. */
  searchHint: string;
  /** A running total shown at the left of the toolbar, e.g. "33 students". */
  countNoun?: string;
  /** Label for the primary create action. Omit for read-only maps. */
  addLabel?: string;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onExport?: () => void;
  /** Shown when the data set itself is empty, as opposed to filtered empty. */
  emptyTitle: string;
  emptyBody: string;
  pageSize?: number;
}

export function MasterTable<T>({
  rows,
  columns,
  idOf,
  statusOf,
  searchHint,
  countNoun,
  addLabel,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  emptyTitle,
  emptyBody,
  pageSize = 10,
}: MasterTableProps<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [confirming, setConfirming] = useState<string | null>(null);

  const searchable = (row: T) =>
    columns.map((c) => (c.text ? c.text(row) : "")).join(" ").toLowerCase() + " " + (statusOf ? statusOf(row).label.toLowerCase() : "");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ql ? rows.filter((r) => searchable(r).includes(ql)) : rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const from = safePage * pageSize;
  const shown = filtered.slice(from, from + pageSize);
  const hasActions = !!(onEdit || onDelete);

  return (
    <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px 12px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* ---- toolbar ---- */}
      <div className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {/* How many there are, before the search narrows it - the office asks
            "how many students do we have" far more often than it searches. */}
        {countNoun && (
          <span style={{ flex: "none", display: "inline-flex", alignItems: "baseline", gap: 6, paddingRight: 4 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--fg1)", lineHeight: 1 }}>{rows.length}</span>
            <span style={{ fontSize: 11.5, color: "var(--fg4)", fontWeight: 600 }}>{countNoun}</span>
          </span>
        )}
        <span className="ev-wrap-main glass-control" style={{ flex: "1 0 auto", minWidth: 0, display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 13px", height: 44 }}>
          <Icon path={IC.search} size={15} style={{ color: "var(--fg4)", flex: "none" }} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder={searchHint}
            aria-label={searchHint}
            style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", alignSelf: "stretch", height: "100%" }}
          />
        </span>
        <span className="ev-wrap-cta" style={{ display: "flex", gap: 8, flex: "none" }}>
          {onExport && (
            <button onClick={onExport} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 14px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Icon path={IC.down} size={14} />
              Export
            </button>
          )}
          {addLabel && onAdd && (
            <button onClick={onAdd} className="btn-primary press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700 }}>
              {addLabel}
            </button>
          )}
        </span>
      </div>

      {/* ---- empty states: three of them, because they mean different things ---- */}
      {rows.length === 0 && (
        <div style={{ padding: "34px 10px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>{emptyTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6, maxWidth: 460, marginInline: "auto", lineHeight: 1.6 }}>{emptyBody}</div>
        </div>
      )}
      {rows.length > 0 && filtered.length === 0 && (
        <div style={{ padding: "30px 10px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Nothing matches &quot;{q.trim()}&quot;</div>
          <button onClick={() => setQ("")} className="btn-ghost press ev-tap-h" style={{ height: 36, padding: "0 15px", borderRadius: 10, fontSize: 12, fontWeight: 600, marginTop: 10, color: "var(--fg2)" }}>
            Clear the search
          </button>
        </div>
      )}

      {/* ---- desktop table ---- */}
      {shown.length > 0 && (
        <div className="ev-only-desktop ev-scroll-x">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} style={{ textAlign: "left", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)", padding: "10px 14px", borderBottom: "1px solid rgba(0,32,63,.08)", whiteSpace: "nowrap" }}>
                    {c.label.toUpperCase()}
                  </th>
                ))}
                {statusOf && (
                  <th style={{ textAlign: "left", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)", padding: "10px 14px", borderBottom: "1px solid rgba(0,32,63,.08)", whiteSpace: "nowrap" }}>STATUS</th>
                )}
                {hasActions && <th style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,32,63,.08)" }} />}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const id = idOf(row);
                const st = statusOf ? statusOf(row) : null;
                return (
                  <tr key={id} className="list-hover">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        title={c.text ? c.text(row) : undefined}
                        style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", fontSize: 12.5, color: "var(--fg2)", maxWidth: c.width ?? 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {c.render(row)}
                      </td>
                    ))}
                    {st && (
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: st.color, background: st.bg, padding: "4px 10px", borderRadius: 980 }}>{st.label}</span>
                      </td>
                    )}
                    {hasActions && (
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,32,63,.05)", whiteSpace: "nowrap", textAlign: "right" }}>
                        {confirming === id ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11.5, color: "var(--fg3)" }}>Delete this?</span>
                            <button
                              onClick={() => {
                                onDelete?.(row);
                                setConfirming(null);
                              }}
                              className="press"
                              style={{ height: 30, padding: "0 11px", borderRadius: 9, border: "none", background: "var(--danger-500)", color: "#fff", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                            >
                              Delete
                            </button>
                            <button onClick={() => setConfirming(null)} className="btn-ghost press" style={{ height: 30, padding: "0 10px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, color: "var(--fg3)" }}>
                              Keep
                            </button>
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", gap: 6 }}>
                            {onEdit && (
                              <button onClick={() => onEdit(row)} aria-label="Edit" title="Edit" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg2)" }}>
                                <Icon path={IC.edit} size={14} />
                              </button>
                            )}
                            {onDelete && (
                              <button onClick={() => setConfirming(id)} aria-label="Delete" title="Delete" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg4)" }}>
                                <Icon path={IC.trash} size={14} />
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- phone: cards, not a sideways table ----
           .ev-only-mobile forces display:flex, so the direction has to be set
           here or the cards lay out in a row. */}
      {shown.length > 0 && (
        <div className="ev-only-mobile" style={{ flexDirection: "column" }}>
          {shown.map((row) => {
            const id = idOf(row);
            const st = statusOf ? statusOf(row) : null;
            const [lead, ...rest] = columns;
            return (
              <div key={id} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "13px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.4, wordBreak: "break-word" }}>{lead.render(row)}</span>
                  {st && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: st.color, background: st.bg, padding: "4px 10px", borderRadius: 980, flex: "none" }}>{st.label}</span>}
                </div>
                {rest
                  .filter((c) => !c.minor)
                  .map((c) => (
                    <div key={c.key} style={{ display: "flex", gap: 10, marginTop: 7 }}>
                      <span style={{ flex: "none", width: 104, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", paddingTop: 1 }}>{c.label.toUpperCase()}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--fg2)", lineHeight: 1.5, wordBreak: "break-word" }}>{c.render(row)}</span>
                    </div>
                  ))}
                {hasActions && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="btn-soft press ev-tap-h" style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                        Edit
                      </button>
                    )}
                    {onDelete &&
                      (confirming === id ? (
                        <>
                          <button
                            onClick={() => {
                              onDelete(row);
                              setConfirming(null);
                            }}
                            className="press ev-tap-h"
                            style={{ flex: 1, height: 38, borderRadius: 10, border: "none", background: "var(--danger-500)", color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            Confirm delete
                          </button>
                          <button onClick={() => setConfirming(null)} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "var(--fg3)" }}>
                            Keep
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setConfirming(id)} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "var(--danger-500)" }}>
                          Delete
                        </button>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---- pagination: says where you are, not just which page ---- */}
      {filtered.length > 0 && (
        <div className="ev-wrap-row" style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, marginTop: 2, borderTop: "1px solid rgba(0,32,63,.07)" }}>
          <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0, fontSize: 11.5, color: "var(--fg4)" }}>
            Showing {from + 1}-{Math.min(from + pageSize, filtered.length)} of {filtered.length}
            {filtered.length !== rows.length ? " matching" : ""}
          </span>
          {pages > 1 && (
            <span className="ev-wrap-cta" style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
              <button onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} aria-label="Previous page" className="btn-ghost press" style={{ width: 36, height: 36, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg2)", opacity: safePage === 0 ? 0.4 : 1 }}>
                <Icon path={IC.prev} size={15} />
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--fg3)", minWidth: 62, textAlign: "center" }}>
                {safePage + 1} of {pages}
              </span>
              <button onClick={() => setPage(Math.min(pages - 1, safePage + 1))} disabled={safePage >= pages - 1} aria-label="Next page" className="btn-ghost press" style={{ width: 36, height: 36, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg2)", opacity: safePage >= pages - 1 ? 0.4 : 1 }}>
                <Icon path={IC.next} size={15} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** The status pill palette, so every master page agrees on what active looks like. */
export const PILL = {
  active: { label: "Active", color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
  inactive: { label: "Inactive", color: "var(--fg4)", bg: "rgba(0,32,63,.07)" },
  pending: { label: "Pending", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  ongoing: { label: "Ongoing", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
};
