import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { PortalProvider } from "@/lib/store";
import { MessagingProvider } from "@/lib/messaging";
import { ClassroomProvider } from "@/lib/classroom";
import { PortalShell } from "@/components/portal/PortalShell";

export default function StudentLayout() {
  return (
    <PortalProvider>
      <MessagingProvider>
        <ClassroomProvider>
          <PortalShell>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </PortalShell>
        </ClassroomProvider>
      </MessagingProvider>
    </PortalProvider>
  );
}
