// Notification items, shared so the desktop header and the phone account menu
// show the same list from one place rather than two drifting copies.

export interface NotifItem {
  id: string;
  dot: string;
  title: string;
  meta: string;
  href: string;
  read: boolean;
}

export const STUDENT_NOTIFS: NotifItem[] = [
  { id: "classroom", dot: "var(--accent-violet)", title: "Priya Rao replied to your post in the Chemistry classroom", meta: "Classroom · 1 hour ago", href: "/classroom/chem11", read: false },
  { id: "grade", dot: "var(--success-500)", title: "Stoichiometry Set 5 was graded: A", meta: "My Grades · yesterday", href: "/grades", read: false },
  { id: "worksheet", dot: "var(--danger-500)", title: "Whole Numbers Topic Test is due Saturday", meta: "Worksheets · 2 days away", href: "/courses", read: false },
  { id: "library", dot: "var(--brand-500)", title: "New notes added to Chemistry", meta: "Library · yesterday", href: "/library", read: false },
];

export const TUTOR_NOTIFS: NotifItem[] = [
  { id: "safeguard", dot: "var(--danger-500)", title: "Safeguarding alert: a message from Ruby Chen needs care", meta: "Messages · this morning", href: "/tutor/messages", read: false },
  { id: "classroom", dot: "var(--accent-violet)", title: "Ravi Shah posted a question in the Chemistry classroom", meta: "Classroom · 20 min ago", href: "/tutor/classroom/chem11", read: false },
  { id: "request", dot: "var(--success-500)", title: "REQ1782365660 was approved for printing", meta: "My Requests · 25 Jun", href: "/tutor/requests", read: false },
  { id: "outline", dot: "var(--brand-500)", title: "Maya Kapoor shared a Chemistry ATAR outline", meta: "Student Outlines · 28 Jun", href: "/tutor/outlines", read: false },
];
