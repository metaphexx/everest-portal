import React, { useEffect, useState } from "react";
import { usePathname } from "@/lib/router";
import { Background } from "@/components/portal/Background";
import { TutorSidebar } from "./TutorSidebar";
import { TutorHeader } from "./TutorHeader";
import { useTutor } from "@/lib/tutor-store";
import { Icon } from "@/components/ui/Icon";
import { AccountMenu } from "@/components/portal/AccountMenu";
import { TutorElliotFab } from "./TutorElliotFab";
import { TUTOR } from "@/lib/tutor-data";
import { TUTOR_NOTIFS } from "@/lib/notifications";
import { TUTOR_ME, useMessaging } from "@/lib/messaging";

function TutorToast() {
  const { toast } = useTutor();
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 26,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,32,63,.93)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "#fff",
        borderRadius: 12,
        padding: "11px 18px",
        fontSize: 13,
        fontWeight: 500,
        zIndex: "var(--z-modal)",
        boxShadow: "0 18px 40px -12px rgba(0,32,63,.55)",
        animation: "evfadeup .22s ease-out",
        whiteSpace: "nowrap",
      }}
    >
      {toast}
    </div>
  );
}

export function TutorShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const { unreadTotal } = useMessaging();
  const { notWired } = useTutor();

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="ev-shell">
      <Background />

      <div className="ev-mobilebar">
        <AccountMenu
          name={TUTOR.name}
          initials={TUTOR.initials}
          role={TUTOR.role}
          accent="var(--accent-violet)"
          seed={TUTOR_NOTIFS}
          unreadMsgs={unreadTotal(TUTOR_ME)}
          messagesHref="/tutor/messages"
          onSignOut={() => notWired("Sign out")}
        />
        <button className="ev-hamburger" aria-label="Open menu" onClick={() => setNavOpen(true)}>
          <Icon path="M3 6h18M3 12h18M3 18h18" size={20} stroke />
        </button>
        {/* Full portal lockup (mark + "Tutor Portal" script), centred. The bare
            mark was small and anonymous on a phone - this is the brand moment. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ev-mobilebar-logo" src="/tutor-portal-logo.png" alt="Everest Tutoring - Tutor Portal" width={400} height={200} fetchPriority="high" decoding="async" />
      </div>

      <div className="ev-sidewrap" data-open={navOpen}>
        <TutorSidebar />
      </div>
      <div className="ev-scrim" onClick={() => setNavOpen(false)} />

      <main className="ev-main thin-scroll">
        <div className="ev-main-inner">
          <TutorHeader />
          {children}
        </div>
      </main>
      <TutorToast />

      <TutorElliotFab />
    </div>
  );
}
