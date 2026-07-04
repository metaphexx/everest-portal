import React, { useEffect, useState } from "react";
import { usePathname } from "@/lib/router";
import { Background } from "./Background";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Toast } from "./Toast";
import { ClassModal } from "./ClassModal";
import { WorksheetPicker } from "./WorksheetPicker";
import { ElliotFab } from "./ElliotFab";
import { Icon } from "@/components/ui/Icon";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="ev-shell">
      <Background />

      {/* Mobile top bar (hidden on desktop via CSS) */}
      <div className="ev-mobilebar">
        <button className="ev-hamburger" aria-label="Open menu" onClick={() => setNavOpen(true)}>
          <Icon path="M3 6h18M3 12h18M3 18h18" size={20} stroke />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/everest-logo.png" alt="Everest Tutoring" style={{ height: 24, width: "auto" }} />
      </div>

      <div className="ev-sidewrap" data-open={navOpen}>
        <Sidebar />
      </div>
      <div className="ev-scrim" onClick={() => setNavOpen(false)} />

      <main className="ev-main thin-scroll">
        <div className="ev-main-inner">
          <Header />
          {children}
        </div>
      </main>

      <WorksheetPicker />
      <ElliotFab />
      <ClassModal />
      <Toast />
    </div>
  );
}
