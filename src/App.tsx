// Central route table. Mirrors the old Next.js file-based routes exactly:
//   - the student portal (route group "(student)") lives at the root
//   - the tutor portal lives under /tutor
// Each layout mounts its providers + shell and renders <Outlet /> for the page.

import { Routes, Route } from "react-router-dom";

import StudentLayout from "@/app/(student)/layout";
import TutorLayout from "@/app/tutor/layout";
import AdminLayout from "@/app/admin/layout";

// Office (admin) pages
import AdminDashboard from "@/app/admin/page";
import AdminApprovals from "@/app/admin/approvals/page";
import AdminClasses from "@/app/admin/classes/page";
import AdminMasters from "@/app/admin/masters/page";
import AdminHistory from "@/app/admin/history/page";
import AdminCatalogue from "@/app/admin/catalogue/page";
import AdminFiles from "@/app/admin/files/page";
import AdminSafeguarding from "@/app/admin/safeguarding/page";
import AdminSettings from "@/app/admin/settings/page";
import AdminSearch from "@/app/admin/search/page";
import AdminSchedule from "@/app/admin/schedule/page";
import AdminMessages from "@/app/admin/messages/page";
import StaffLayout from "@/app/staff/layout";

// Student pages
import StudentDashboard from "@/app/(student)/page";
import StudentCourses from "@/app/(student)/courses/page";
import StudentCourseDetail from "@/app/(student)/courses/[id]/page";
import StudentTimetable from "@/app/(student)/timetable/page";
import StudentOutline from "@/app/(student)/outline/page";
import StudentLibrary from "@/app/(student)/library/page";
import StudentDrive from "@/app/(student)/drive/page";
import StudentGrades from "@/app/(student)/grades/page";
import StudentMessages from "@/app/(student)/messages/page";
import StudentChat from "@/app/(student)/chat/page";
import StudentClassroom from "@/app/(student)/classroom/[id]/page";
import StudentSupport from "@/app/(student)/support/page";
import StudentSettings from "@/app/(student)/settings/page";
import StudentSearch from "@/app/(student)/search/page";
import StudentBlock from "@/app/(student)/block/page";

// Tutor pages
import TutorDashboard from "@/app/tutor/page";
import TutorCourses from "@/app/tutor/courses/page";
import TutorCourseDetail from "@/app/tutor/courses/[id]/page";
import TutorSchedule from "@/app/tutor/schedule/page";
import TutorGrade from "@/app/tutor/grade/page";
import TutorOutlines from "@/app/tutor/outlines/page";
import TutorMaterials from "@/app/tutor/materials/page";
import TutorCart from "@/app/tutor/cart/page";
import TutorRequests from "@/app/tutor/requests/page";
import TutorHistory from "@/app/tutor/history/page";
import TutorBooklets from "@/app/tutor/booklets/page";
import TutorDrive from "@/app/tutor/drive/page";
import TutorClassroom from "@/app/tutor/classroom/[id]/page";
import TutorMessages from "@/app/tutor/messages/page";
import TutorSearch from "@/app/tutor/search/page";
import TutorSettings from "@/app/tutor/settings/page";
import TutorElliot from "@/app/tutor/elliot/page";
import TutorTeach from "@/app/tutor/teach/[id]/page";

function NotFound() {
  return (
    <div style={{ padding: "80px 22px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>Page not found</div>
      <div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 8 }}>That page does not exist.</div>
    </div>
  );
}

export default function App() {
  return (
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
  );
}
