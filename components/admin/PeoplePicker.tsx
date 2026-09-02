// Pick several people - tutors on a class, or the students in it.
//
// A count box was the wrong control for a roster: "10 students enrolled" tells
// the office a number and nothing about who, so nobody can check it, and the
// roll has to be entered a second time somewhere else. Choosing the actual
// people gives the count for free.
//
// Chips for what is chosen, a searchable list to add from. Dismissal goes
// through the shared use-dismissable hook so this closes on an outside click
// and on Escape like every other menu in the portal.

import React, { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDismissable } from "@/lib/use-dismissable";

const IC = {
  chev: "M7 10l5 5 5-5H7Z",
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  search: "m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z",
};

export interface PickerOption {
  /** Unique and what gets stored - a person's name in this app. */
  id: string;
  label: string;
  /** Second line in the list, e.g. a year group or which centres they cover. */
  meta?: string;
  initials: string;
  colour?: string;
}

export function PeoplePicker({
  options,
  value,
  onChange,
  label,
  placeholder,
  emptyHint,
  required,
}: {
  options: PickerOption[];
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder: string;
  emptyHint?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useDismissable<HTMLDivElement>(open, () => {
    setOpen(false);
    setQ("");
  });

  const chosen = useMemo(() => options.filter((o) => value.includes(o.id)), [options, value]);
  const ql = q.trim().toLowerCase();
  const list = useMemo(
    () => (ql ? options.filter((o) => (o.label + " " + (o.meta ?? "")).toLowerCase().includes(ql)) : options),
    [options, ql]
  );

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>
        {label}
        {required && <span style={{ color: "var(--danger-500)" }}> *</span>}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="glass-control press"
        style={{
          width: "100%",
          minHeight: 44,
          borderRadius: 12,
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          border: open ? "1px solid var(--brand-500)" : undefined,
          boxShadow: open ? "0 0 0 3px rgba(0,157,255,.12)" : undefined,
        }}
      >
        {chosen.length === 0 && <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--fg4)" }}>{placeholder}</span>}

        {chosen.map((o) => (
          <span
            key={o.id}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,157,255,.1)", color: "var(--brand-700)", borderRadius: 980, padding: "3px 5px 3px 8px", fontSize: 11.5, fontWeight: 700, flex: "none", maxWidth: "100%" }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
            {/* A nested <button> is invalid inside the trigger button, so the
                remove control is a span that stops the click reaching it. */}
            <span
              role="button"
              tabIndex={0}
              aria-label={"Remove " + o.label}
              onClick={(e) => {
                e.stopPropagation();
                toggle(o.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(o.id);
                }
              }}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "rgba(0,32,63,.08)", cursor: "pointer", flex: "none" }}
            >
              <Icon path={IC.close} size={9} />
            </span>
          </span>
        ))}

        {chosen.length > 0 && <span style={{ flex: 1 }} />}
        <Icon path={IC.chev} size={16} style={{ color: "var(--fg4)", flex: "none", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }} />
      </button>

      {emptyHint && chosen.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 4, lineHeight: 1.45 }}>{emptyHint}</div>
      )}

      {open && (
        <div
          className="thin-scroll"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: "var(--z-dropdown)" as unknown as number,
            maxHeight: 300,
            overflowY: "auto",
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,.9)",
            borderRadius: 14,
            boxShadow: "0 28px 60px -20px rgba(0,32,63,.4)",
            padding: 8,
            animation: "evdrop .18s ease-out",
          }}
        >
          <span className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 11, padding: "0 11px", height: 40, marginBottom: 6 }}>
            <Icon path={IC.search} size={14} style={{ color: "var(--fg4)", flex: "none" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              aria-label={"Search " + label.toLowerCase()}
              autoFocus
              style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, height: "100%" }}
            />
          </span>

          {list.length === 0 && <div style={{ padding: "12px 10px", fontSize: 12.5, color: "var(--fg4)" }}>Nobody matches &quot;{q.trim()}&quot;.</div>}

          {list.map((o) => {
            const on = value.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                aria-pressed={on}
                className="list-hover"
                style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: "none", background: on ? "rgba(0,157,255,.08)" : "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
              >
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: o.colour ?? "rgba(14,156,142,.14)", color: o.colour ? "#fff" : "var(--accent-teal)", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  {o.initials}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--fg1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                  {o.meta && <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.meta}</span>}
                </span>
                <span
                  style={{ width: 20, height: 20, borderRadius: 6, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: on ? "none" : "1.5px solid rgba(0,32,63,.16)", background: on ? "var(--brand-500)" : "transparent", color: "#fff" }}
                >
                  {on && <Icon path={IC.tick} size={12} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
