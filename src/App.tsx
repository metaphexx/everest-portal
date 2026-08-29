// Central route table. Mirrors the old Next.js file-based routes exactly:
//   - the student portal (route group "(student)") lives at the root
//   - the tutor portal lives under /tutor
// Each layout mounts its providers + shell and renders <Outlet /> for the page.

import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import StudentLayout from "@/app/(student)/layout";
import TutorLayout from "@/app/tutor/layout";
import AdminLayout from "@/app/admin/layout";

// Office (admin) pages
const AdminDashboard = lazy(() => import("@/app/admin/page"));
const AdminApprovals = lazy(() => import("@/app/admin/approvals/page"));
const AdminClasses = lazy(() => import("@/app/admin/classes/page"));
const AdminMasters = lazy(() => import("@/app/admin/masters/page"));
const AdminHistory = lazy(() => import("@/app/admin/history/page"));
const AdminCatalogue = lazy(() => import("@/app/admin/catalogue/page"));
const AdminFiles = lazy(() => import("@/app/admin/files/page"));
const AdminSafeguarding = lazy(() => import("@/app/admin/safeguarding/page"));
const AdminSettings = lazy(() => import("@/app/admin/settings/page"));
const AdminSearch = lazy(() => import("@/app/admin/search/page"));
const AdminSchedule = lazy(() => import("@/app/admin/schedule/page"));
const AdminMessages = lazy(() => import("@/app/admin/messages/page"));
import StaffLayout from "@/app/staff/layout";

// Student pages
const StudentDashboard = lazy(() => import("@/app/(student)/page"));
const StudentCourses = lazy(() => import("@/app/(student)/courses/page"));
const StudentCourseDetail = lazy(() => import("@/app/(student)/courses/[id]/page"));
const StudentTimetable = lazy(() => import("@/app/(student)/timetable/page"));
const StudentOutline = lazy(() => import("@/app/(student)/outline/page"));
const StudentLibrary = lazy(() => import("@/app/(student)/library/page"));
const StudentDrive = lazy(() => import("@/app/(student)/drive/page"));
const StudentGrades = lazy(() => import("@/app/(student)/grades/page"));
const StudentMessages = lazy(() => import("@/app/(student)/messages/page"));
const StudentChat = lazy(() => import("@/app/(student)/chat/page"));
const StudentClassroom = lazy(() => import("@/app/(student)/classroom/[id]/page"));
const StudentSupport = lazy(() => import("@/app/(student)/support/page"));
const StudentSettings = lazy(() => import("@/app/(student)/settings/page"));
const StudentSearch = lazy(() => import("@/app/(student)/search/page"));
const StudentBlock = lazy(() => import("@/app/(student)/block/page"));

// Tutor pages
const TutorDashboard = lazy(() => import("@/app/tutor/page"));
const TutorCourses = lazy(() => import("@/app/tutor/courses/page"));
const TutorCourseDetail = lazy(() => import("@/app/tutor/courses/[id]/page"));
const TutorSchedule = lazy(() => import("@/app/tutor/schedule/page"));
const TutorGrade = lazy(() => import("@/app/tutor/grade/page"));
const TutorOutlines = lazy(() => import("@/app/tutor/outlines/page"));
const TutorMaterials = lazy(() => import("@/app/tutor/materials/page"));
const TutorCart = lazy(() => import("@/app/tutor/cart/page"));
const TutorRequests = lazy(() => import("@/app/tutor/requests/page"));
const TutorHistory = lazy(() => import("@/app/tutor/history/page"));
const TutorBooklets = lazy(() => import("@/app/tutor/booklets/page"));
const TutorDrive = lazy(() => import("@/app/tutor/drive/page"));
const TutorClassroom = lazy(() => import("@/app/tutor/classroom/[id]/page"));
const TutorMessages = lazy(() => import("@/app/tutor/messages/page"));
const TutorSearch = lazy(() => import("@/app/tutor/search/page"));
const TutorSettings = lazy(() => import("@/app/tutor/settings/page"));
const TutorElliot = lazy(() => import("@/app/tutor/elliot/page"));
const TutorTeach = lazy(() => import("@/app/tutor/teach/[id]/page"));

function NotFound() {
  return (
    <div style={{ padding: "80px 22px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>Page not found</div>
      <div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 8 }}>That page does not exist.</div>
    </div>
  );
}

import { PageSkeleton } from "@/components/ui/PageSkeleton";

/** Only the layout-less routes (the teaching tab) ever reach this boundary -
    every portal layout carries its own, wrapped around just the outlet. */
function PageFallback() {
  return <div style={{ padding: "24px 18px" }}><PageSkeleton /></div>;
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      {/* Student portal */}
      <Route element={<StudentLayout />}>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/courses" element={<StudentCourses />} />
        <Route path="/courses/:id" element={<StudentCourseDetail />} />
        <Route path="/timetable" element={<StudentTimetable />} />
        <Route path="/outline" element={<StudentOutline />} />
        <Route path="/library" element={<StudentLibrary />} />
        <Route path="/drive" element={<StudentDrive />} />
        <Route path="/grades" element={<StudentGrades />} />
        <Route path="/messages" element={<StudentMessages />} />
        <Route path="/chat" element={<StudentChat />} />
        <Route path="/classroom/:id" element={<StudentClassroom />} />
        <Route path="/support" element={<StudentSupport />} />
        <Route path="/settings" element={<StudentSettings />} />
        <Route path="/search" element={<StudentSearch />} />
        <Route path="/block" element={<StudentBlock />} />
      </Route>

      {/* Tutor portal */}
      <Route element={<TutorLayout />}>
        <Route path="/tutor" element={<TutorDashboard />} />
        <Route path="/tutor/courses" element={<TutorCourses />} />
        <Route path="/tutor/courses/:id" element={<TutorCourseDetail />} />
        <Route path="/tutor/schedule" element={<TutorSchedule />} />
        <Route path="/tutor/grade" element={<TutorGrade />} />
        <Route path="/tutor/outlines" element={<TutorOutlines />} />
        <Route path="/tutor/materials" element={<TutorMaterials />} />
        <Route path="/tutor/cart" element={<TutorCart />} />
        <Route path="/tutor/requests" element={<TutorRequests />} />
        <Route path="/tutor/history" element={<TutorHistory />} />
        <Route path="/tutor/booklets" element={<TutorBooklets />} />
        <Route path="/tutor/drive" element={<TutorDrive />} />
        <Route path="/tutor/classroom/:id" element={<TutorClassroom />} />
        <Route path="/tutor/messages" element={<TutorMessages />} />
        <Route path="/tutor/search" element={<TutorSearch />} />

        <Route path="/tutor/settings" element={<TutorSettings />} />


        <Route path="/tutor/elliot" element={<TutorElliot />} />
      </Route>

      {/* Office portal */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/approvals" element={<AdminApprovals />} />
        <Route path="/admin/classes" element={<AdminClasses />} />
        <Route path="/admin/schedule" element={<AdminSchedule />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/admin/masters" element={<AdminMasters />} />
        <Route path="/admin/history" element={<AdminHistory />} />
        <Route path="/admin/catalogue" element={<AdminCatalogue />} />
        <Route path="/admin/files" element={<AdminFiles />} />
        <Route path="/admin/safeguarding" element={<AdminSafeguarding />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/search" element={<AdminSearch />} />
      </Route>

      {/* Print room: the same components, a deliberately smaller route table.
          Anything not listed here does not exist for this role. */}
      <Route element={<StaffLayout />}>
        <Route path="/staff" element={<AdminDashboard />} />
        <Route path="/staff/approvals" element={<AdminApprovals />} />
        <Route path="/staff/history" element={<AdminHistory />} />
        <Route path="/staff/classes" element={<AdminClasses />} />
        <Route path="/staff/settings" element={<AdminSettings />} />
        <Route path="/staff/search" element={<AdminSearch />} />
      </Route>

      {/* Teaching view: deliberately OUTSIDE the tutor layout. The whole tab is
          shared to a class, so it carries no sidebar, no unread counts and no
          roster. */}
      <Route path="/tutor/teach/:id" element={<TutorTeach />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
