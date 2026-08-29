// Wireframe shown in the PAGE AREA while a route chunk downloads.
//
// It renders inside the layout, so the sidebar, header and background never
// blink - the only thing that changes is the content column, and it changes
// into grey card shapes rather than into nothing. Shapes echo the real page
// grid (one wide card, two half cards) so the swap to content is a fill-in,
// not a re-layout.

import React from "react";

function Bar({ w, h = 10 }: { w: string; h?: number }) {
  return <div className="ev-skel-bar" style={{ width: w, height: h }} />;
}

function Card({ span, children }: { span: number; children: React.ReactNode }) {
  return (
    <div className="glass-card" style={{ gridColumn: "span " + span, padding: "20px 22px", boxSizing: "border-box" }}>
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    // role=status + the label make the wait announced once, not read as an
    // empty page; aria-hidden bars keep the shapes out of the tree.
    <div role="status" aria-label="Loading this page" className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div aria-hidden="true" style={{ display: "contents" }}>
        <Card span={12}>
          <Bar w="34%" h={16} />
          <div style={{ height: 14 }} />
          <Bar w="90%" />
          <div style={{ height: 8 }} />
          <Bar w="72%" />
        </Card>
        <Card span={6}>
          <Bar w="46%" h={14} />
          <div style={{ height: 12 }} />
          <Bar w="100%" />
          <div style={{ height: 8 }} />
          <Bar w="84%" />
          <div style={{ height: 8 }} />
          <Bar w="61%" />
        </Card>
        <Card span={6}>
          <Bar w="52%" h={14} />
          <div style={{ height: 12 }} />
          <Bar w="100%" />
          <div style={{ height: 8 }} />
          <Bar w="77%" />
          <div style={{ height: 8 }} />
          <Bar w="68%" />
        </Card>
      </div>
    </div>
  );
}
