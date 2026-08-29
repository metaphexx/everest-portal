import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { TutorProvider } from "@/lib/tutor-store";
import { MessagingProvider } from "@/lib/messaging";
import { ClassroomProvider } from "@/lib/classroom";
import { TutorShell } from "@/components/tutor/TutorShell";

export default function TutorLayout() {
  return (
    <TutorProvider>
      <MessagingProvider>
        <ClassroomProvider>
          <TutorShell>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </TutorShell>
        </ClassroomProvider>
      </MessagingProvider>
    </TutorProvider>
  );
}
