import React from "react";
import { BookletStatsPanel, seedRequests } from "everest-portal";

const requests = seedRequests();

export const WholePractice = () => (
  <div style={{ width: 620 }}>
    <BookletStatsPanel requests={requests} subtitle="All in-person classes - copies over the term" />
  </div>
);

export const ScopedToACourse = () => (
  <div style={{ width: 620 }}>
    <BookletStatsPanel
      requests={requests}
      courseId="sci9"
      title="Year 9 Science"
      subtitle="Copies requested for this class"
      height={170}
    />
  </div>
);
