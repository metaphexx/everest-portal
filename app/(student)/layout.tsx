import type { Metadata } from "next";
import { PortalProvider } from "@/lib/store";
import { MessagingProvider } from "@/lib/messaging";
import { ClassroomProvider } from "@/lib/classroom";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata: Metadata = {
  title: "Everest Student Portal",
  description: "Everest Tutoring student portal",
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalProvider>
      <MessagingProvider>
        <ClassroomProvider>
          <PortalShell>{children}</PortalShell>
        </ClassroomProvider>
      </MessagingProvider>
    </PortalProvider>
  );
}
