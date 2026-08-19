import React from "react";
import { AssessmentTable, AverageChip, UpcomingAssessments } from "everest-portal";

const outline = {
  id: "o1",
  subject: "Chemistry ATAR",
  term: "Term 3",
  fileName: "Chemistry_Unit3_Outline.pdf",
  uploadedAt: "28 Jun",
  status: "done" as const,
  courseId: "chem",
  topics: [],
  assessments: [
    { id: "a1", name: "Practical: Rates of reaction", type: "Practical",  week: 3,  due: "31 July", weight: "10%", score: "82%", done: true },
    { id: "a2", name: "Test 1: Chemical equilibrium", type: "Test",       week: 5,  due: "14 Aug",  weight: "15%" },
    { id: "a3", name: "Investigation: Organic pathways", type: "Assignment", week: 8, due: "4 Sept", weight: "20%" },
    { id: "a4", name: "Semester examination",         type: "Exam",       week: 14, due: "16 Oct",  weight: "30%" },
  ],
};

export const Tracker = () => (
  <div style={{ width: 620 }}>
    <AssessmentTable outline={outline} onUpdate={() => {}} />
  </div>
);

export const Compact = () => (
  <div style={{ width: 620 }}>
    <AssessmentTable outline={outline} onUpdate={() => {}} compact />
  </div>
);

export const Average = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
    <AverageChip assessments={outline.assessments} />
    <span style={{ fontSize: 12.5, color: "#4A5563" }}>weighted across marked assessments only</span>
  </div>
);

export const Upcoming = () => (
  <div style={{ width: 480 }}>
    <UpcomingAssessments outline={outline} limit={3} />
  </div>
);
