// Pricing and discounts.
//
// The live version of this screen never got the redesign - a raw blue table at
// eight point type on a white page. It also hides what the table is actually
// for: the rate is set by HOW MANY SUBJECTS a student takes, which is the same
// question the block enrolment grid asks. So this page leads with the ladder
// (one subject, two, three) and what each extra subject costs, because that is
// the number the office quotes on the phone.

import React, { useState } from "react";
import { useAdmin } from "@/lib/admin-store";
import { Column, MasterTable, PILL } from "@/components/admin/MasterTable";
import { PRICE_BUNDLES, PriceBundle, SIBLING_DISCOUNTS, perSubject, rateFor } from "@/lib/admin-pricing";

const TABS = [
  { id: "bundles", label: "Price bundles" },
  { id: "siblings", label: "Sibling discount" },
];

function money(n: number): string {
  return "$" + n.toFixed(2);
}

/** The ladder the office quotes from, and what each extra subject adds. */
function Ladder() {
  const rungs = [1, 2, 3].map((n) => rateFor(n)).filter(Boolean) as PriceBundle[];
  return (
    <div className="glass-card" style={{ gridColumn: "span 12", padding: "18px 20px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      <h2 className="portal-section-title" style={{ fontSize: 15, margin: "0 0 3px" }}>What a week costs</h2>
      <p style={{ margin: "0 0 14px", fontSize: 11.5, color: "var(--fg4)" }}>
        Termly rates. A student on a three-subject block pays the third rung, not three times the first.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
        {rungs.map((b, i) => {
          const prev = i > 0 ? rungs[i - 1] : null;
          const step = prev ? b.rate - prev.rate : b.rate;
          return (
            <div key={b.id} style={{ borderRadius: 14, padding: "14px 16px", background: i === rungs.length - 1 ? "linear-gradient(135deg,rgba(0,157,255,.1),rgba(122,90,248,.1))" : "rgba(255,255,255,.7)", border: "1px solid rgba(0,32,63,.07)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, color: "var(--fg4)" }}>
                {b.subjects} SUBJECT{b.subjects === 1 ? "" : "S"}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                {money(b.rate)}
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg4)" }}> / wk</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 6, lineHeight: 1.5 }}>
                {money(perSubject(b))} per subject
                {prev && (
                  <>
                    <br />
                    <span style={{ color: "var(--success-700)", fontWeight: 700 }}>+{money(step)}</span> for the {b.subjects === 2 ? "second" : "third"}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* The office gets asked this on every call, so it is stated rather than
          left to be worked out from three cards. */}
      {rungs.length === 3 && (
        <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--fg3)", background: "rgba(14,156,142,.07)", borderRadius: 11, padding: "10px 13px", lineHeight: 1.55 }}>
          Three subjects works out at {money(perSubject(rungs[2]))} each against {money(rungs[0].rate)} for one, so the full block saves a
          family {money(rungs[0].rate * 3 - rungs[2].rate)} a week over booking the three separately.
        </div>
      )}
    </div>
  );
}

export default function AdminPricing() {
  const { notWired } = useAdmin();
  const [tab, setTab] = useState("bundles");

  const add = (what: string) => notWired("Add a " + what);
  const edit = (what: string) => notWired("Edit this " + what);
  const del = (what: string) => notWired("Delete this " + what);

  const bundleCols: Column<PriceBundle>[] = [
    { key: "s", label: "Subjects", render: (r) => <strong style={{ fontWeight: 700 }}>{r.subjects} subject{r.subjects === 1 ? "" : "s"}</strong>, text: (r) => String(r.subjects) },
    { key: "p", label: "Billed", render: (r) => r.period, text: (r) => r.period },
    { key: "r", label: "Rate", render: (r) => (<><strong style={{ fontWeight: 700 }}>{money(r.rate)}</strong><span style={{ color: "var(--fg4)" }}> / wk</span></>), text: (r) => String(r.rate) },
    { key: "ps", label: "Per subject", render: (r) => money(perSubject(r)), text: (r) => String(perSubject(r)), minor: true },
    { key: "e", label: "Effective from", render: (r) => r.effective, text: (r) => r.effective, minor: true },
  ];

  const sibCols: Column<(typeof SIBLING_DISCOUNTS)[number]>[] = [
    { key: "n", label: "Applies to", render: (r) => <strong style={{ fontWeight: 700 }}>{r.nth === 2 ? "Second sibling" : r.nth === 3 ? "Third sibling" : "Sibling " + r.nth + " and beyond"}</strong>, text: (r) => String(r.nth) },
    { key: "p", label: "Discount", render: (r) => <span style={{ fontWeight: 700, color: "var(--success-700)" }}>{r.percent}% off</span>, text: (r) => String(r.percent) },
    { key: "a", label: "What it covers", render: (r) => r.appliesTo, text: (r) => r.appliesTo, width: 320, minor: true },
  ];

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <Ladder />

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className="press ev-tap-h"
              style={{ height: 36, padding: "0 15px", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, background: tab === t.id ? "var(--brand-500)" : "rgba(0,32,63,.05)", color: tab === t.id ? "#fff" : "var(--fg3)" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "bundles" ? (
          <MasterTable
            rows={PRICE_BUNDLES}
            columns={bundleCols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search rates by subject count or period"
            addLabel="Add a rate"
            onAdd={() => add("rate")}
            onEdit={() => edit("rate")}
            onDelete={() => del("rate")}
            emptyTitle="No rates set"
            emptyBody="Until a rate exists for a subject count, nobody can be quoted a price for it."
          />
        ) : (
          <MasterTable
            rows={SIBLING_DISCOUNTS}
            columns={sibCols}
            idOf={(r) => r.id}
            statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
            searchHint="Search discounts"
            addLabel="Add a discount"
            onAdd={() => add("discount")}
            onEdit={() => edit("discount")}
            onDelete={() => del("discount")}
            emptyTitle="No sibling discount set"
            emptyBody="Families with more than one child here are the ones most likely to ask, so it is worth setting."
          />
        )}
      </div>
    </div>
  );
}
