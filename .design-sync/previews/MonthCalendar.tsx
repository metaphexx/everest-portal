import React from "react";
import { MonthCalendar, DayList, allSessions } from "everest-portal";

const sessions = allSessions();

export const Month = () => (
  <div style={{ maxWidth: 620 }}>
    <MonthCalendar sessions={sessions} selected="2026-07-02" onSelect={() => {}} />
  </div>
);

export const WithDayList = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, alignItems: "start" }}>
    <MonthCalendar sessions={sessions} selected="2026-07-07" onSelect={() => {}} />
    <DayList dayKey="2026-07-07" sessions={sessions} />
  </div>
);
