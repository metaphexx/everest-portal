import React from "react";
import { LineChart } from "everest-portal";

const labels = ["12 May", "19 May", "26 May", "2 Jun", "9 Jun", "16 Jun", "23 Jun", "30 Jun"];

export const BookletTracker = () => (
  <div style={{ width: 560 }}>
    <LineChart
      labels={labels}
      height={220}
      yLabel="copies"
      series={[
        { label: "Requested", color: "#7A5AF8", points: [18, 44, 79, 118, 150, 186, 219, 252] },
        { label: "Approved",  color: "#009DFF", points: [12, 36, 66, 101, 129, 158, 187, 213] },
        { label: "Printed",   color: "#22A05B", points: [6, 24, 48, 74, 97, 121, 143, 163] },
        { label: "Rejected",  color: "#E04141", points: [1, 3, 6, 9, 13, 17, 20, 22] },
      ]}
    />
  </div>
);

export const SingleSeries = () => (
  <div style={{ width: 460 }}>
    <LineChart
      labels={labels}
      height={170}
      yLabel="students"
      series={[{ label: "Attendance", color: "#0E9C8E", points: [21, 23, 22, 25, 24, 26, 25, 27] }]}
    />
  </div>
);
