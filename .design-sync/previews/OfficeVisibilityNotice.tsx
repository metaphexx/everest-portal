import React from "react";
import { OfficeVisibilityNotice } from "everest-portal";

export const Default = () => (
  <div style={{ maxWidth: 560 }}>
    <OfficeVisibilityNotice />
  </div>
);

export const Compact = () => (
  <div style={{ maxWidth: 560 }}>
    <OfficeVisibilityNotice compact />
  </div>
);
