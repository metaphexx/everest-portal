// ============================================================
// Classroom - a shared Google-Classroom-style post stream between a tutor
// and their class. One provider, mounted independently in both the tutor
// and student layouts (mirroring lib/messaging.tsx), both reading/writing
// the same localStorage blob so the two portals see the same classroom.
//
// The model is a single flat list of POSTS per classroom. A post has an
// author, a body, optional file attachments, and its own thread of REPLIES.
// A pinned post is an announcement (floats to the top). Anyone in the class
// can post and reply; every student-authored body runs through the same
// deterministic moderation classifier as messages. (The older split of
// announcements / flat feed / separate Q&A board is gone - it read like a
// group chat; this reads like Google Classroom.)
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { classifyMessage } from "./features";

export interface PostAttachment {
  name: string;
  ext: string; // pdf, docx, jpg, png ... or "link"
  kind?: "file" | "link"; // absent = file (older rows)
  url?: string; // set when kind === "link"
}

export interface PostReply {
  id: string;
  author: string;
  init: string;
  role: "tutor" | "student";
  body: string;
  when: string;
  ts: number;
  attachments?: PostAttachment[]; // files or links on a reply
  flag?: string;
  held?: boolean;
}

export interface ClassPost {
  id: string;
  classroomId: string;
  author: string;
  init: string;
  role: "tutor" | "student";
  pinned: boolean; // pinned posts (tutor announcements) float to the top
  body: string;
  when: string;
  ts: number;
  attachments: PostAttachment[];
  replies: PostReply[];
  flag?: string; // moderation category when flagged
  held?: boolean; // withheld pending review
}

export const CLASSROOM_DB_VERSION = 3; // schema changed: link attachments + reply attachments

interface ClassroomDb {
  v: number;
  posts: Record<string, ClassPost[]>;
}

function seedPosts(): Record<string, ClassPost[]> {
  const T = (iso: string) => Date.parse(iso);
  return {
    chem11: [
      {
        id: "cp-chem-1",
        classroomId: "chem11",
        author: "Priya Rao",
        init: "PR",
        role: "tutor",
        pinned: true,
        body: "Bring your Organic pathways booklet tonight - we are working through reaction mechanisms and you will want the worked examples beside you.",
        when: "Today 9:10am",
        ts: T("2026-07-04T09:10:00"),
        attachments: [
          { name: "Organic pathways booklet.pdf", ext: "pdf" },
          { name: "Reaction mechanisms explained - Khan Academy", ext: "link", kind: "link", url: "https://www.khanacademy.org/science/organic-chemistry/reaction-mechanisms" },
        ],
        replies: [
          { id: "cp-chem-1-r1", author: "Maya Kapoor", init: "MK", role: "student", body: "Got it, thanks! Should we finish the worked examples on page 6 first?", when: "Today 9:32am", ts: T("2026-07-04T09:32:00") },
          { id: "cp-chem-1-r2", author: "Priya Rao", init: "PR", role: "tutor", body: "Yes please, up to and including question 6b. Here is my worked solution for 6a if you get stuck.", when: "Today 9:40am", ts: T("2026-07-04T09:40:00"), attachments: [{ name: "Question 6a worked solution.pdf", ext: "pdf" }] },
        ],
      },
      {
        id: "cp-chem-2",
        classroomId: "chem11",
        author: "Ethan Wu",
        init: "EW",
        role: "student",
        pinned: false,
        body: "Does anyone else get 2.4 mol for Q3b of the equilibrium set? The answer key says 1.8.",
        when: "Tue 7:40pm",
        ts: T("2026-06-30T19:40:00"),
        attachments: [],
        replies: [
          { id: "cp-chem-2-r1", author: "Zara Patel", init: "ZP", role: "student", body: "Same here, I got 2.4 too.", when: "Tue 7:52pm", ts: T("2026-06-30T19:52:00") },
          { id: "cp-chem-2-r2", author: "Priya Rao", init: "PR", role: "tutor", body: "Good catch Ethan - check the mole ratio in step two, the 2:3 trips everyone up. We will run through it tonight.", when: "Tue 8:05pm", ts: T("2026-06-30T20:05:00") },
        ],
      },
      {
        id: "cp-chem-3",
        classroomId: "chem11",
        author: "Priya Rao",
        init: "PR",
        role: "tutor",
        pinned: false,
        body: "Stoichiometry Set 5 results are back. Lovely improvement across the class - check My Grades for your feedback.",
        when: "Mon 4:20pm",
        ts: T("2026-06-29T16:20:00"),
        attachments: [],
        replies: [],
      },
    ],
    b8math: [
      {
        id: "cp-b8m-1",
        classroomId: "b8math",
        author: "Priya Rao",
        init: "PR",
        role: "tutor",
        pinned: true,
        body: "This week: linear equations continued. Have last week's worksheet ready to review in the first ten minutes.",
        when: "Tue 5:30pm",
        ts: T("2026-06-30T17:30:00"),
        attachments: [{ name: "Linear equations worksheet.pdf", ext: "pdf" }],
        replies: [],
      },
      {
        id: "cp-b8m-2",
        classroomId: "b8math",
        author: "Bella Nguyen",
        init: "BN",
        role: "student",
        pinned: false,
        body: "Is the homework the whole algebra pack or just the first two pages?",
        when: "Mon 5:12pm",
        ts: T("2026-06-29T17:12:00"),
        attachments: [],
        replies: [
          { id: "cp-b8m-2-r1", author: "Priya Rao", init: "PR", role: "tutor", body: "Just pages 1 and 2, Bella. The rest is extension if you want a challenge.", when: "Mon 5:30pm", ts: T("2026-06-29T17:30:00") },
        ],
      },
    ],
    b8sci: [
      {
        id: "cp-b8s-1",
        classroomId: "b8sci",
        author: "Priya Rao",
        init: "PR",
        role: "tutor",
        pinned: true,
        body: "We start the ecosystems topic on Wednesday. The practical workbook is in Resources.",
        when: "Mon 2:15pm",
        ts: T("2026-06-29T14:15:00"),
        attachments: [{ name: "Ecosystems practical workbook.pdf", ext: "pdf" }],
        replies: [],
      },
    ],
    b8eng: [
      {
        id: "cp-b8e-1",
        classroomId: "b8eng",
        author: "Sam Whitlam",
        init: "SW",
        role: "tutor",
        pinned: true,
        body: "Persuasive writing drafts are due Wednesday. Post here if you get stuck on structure.",
        when: "Sun 6:00pm",
        ts: T("2026-06-28T18:00:00"),
        attachments: [],
        replies: [
          { id: "cp-b8e-1-r1", author: "Jonah Reeves", init: "JR", role: "student", body: "Can we use a real news article for the persuasive piece?", when: "Sat 11:00am", ts: T("2026-06-27T11:00:00") },
        ],
      },
    ],
  };
}

interface ClassroomContextValue {
  postsFor: (classroomId: string) => ClassPost[];
  createPost: (input: { classroomId: string; body: string; author: string; init: string; role: "tutor" | "student"; pinned?: boolean; attachments?: PostAttachment[] }) => void;
  replyToPost: (postId: string, input: { body: string; author: string; init: string; role: "tutor" | "student"; attachments?: PostAttachment[] }) => void;
  togglePin: (postId: string) => void;
  deletePost: (postId: string) => void;
}

const ClassroomContext = createContext<ClassroomContextValue | null>(null);

export function useClassroom(): ClassroomContextValue {
  const ctx = useContext(ClassroomContext);
  if (!ctx) throw new Error("useClassroom must be used within ClassroomProvider");
  return ctx;
}

const LS_KEY = "evr-classroom";

function seedDb(): ClassroomDb {
  return { v: CLASSROOM_DB_VERSION, posts: seedPosts() };
}

export function ClassroomProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<ClassroomDb>(seedDb);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ClassroomDb;
        if (parsed && parsed.v === CLASSROOM_DB_VERSION) setDb(parsed);
        // Older-version blobs are ignored (kept on the seed) so the schema
        // change never crashes a browser that has a stale classroom store.
      }
    } catch {
      /* corrupted store: fall back to the seed */
    }
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as ClassroomDb;
        if (parsed && parsed.v === CLASSROOM_DB_VERSION) setDb(parsed);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(db));
    } catch {
      /* quota or serialisation issue: state still lives in memory */
    }
  }, [db, hydrated]);

  // Pinned posts first, then newest-first within each group.
  const postsFor = useCallback(
    (classroomId: string): ClassPost[] =>
      [...(db.posts[classroomId] ?? [])].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.ts - a.ts;
      }),
    [db.posts]
  );

  const createPost = useCallback(
    (input: { classroomId: string; body: string; author: string; init: string; role: "tutor" | "student"; pinned?: boolean; attachments?: PostAttachment[] }) => {
      const text = input.body.trim();
      if (!text && !(input.attachments && input.attachments.length)) return;
      const cls = classifyMessage(text);
      const now = Date.now();
      setDb((s) => ({
        ...s,
        posts: {
          ...s.posts,
          [input.classroomId]: [
            {
              id: "cp" + now,
              classroomId: input.classroomId,
              author: input.author,
              init: input.init,
              role: input.role,
              pinned: !!input.pinned,
              body: text,
              when: "Just now",
              ts: now,
              attachments: input.attachments ?? [],
              replies: [],
              flag: cls.category !== "none" ? cls.category : undefined,
              held: cls.held || undefined,
            },
            ...(s.posts[input.classroomId] ?? []),
          ],
        },
      }));
    },
    []
  );

  const findPost = useCallback(
    (postId: string): string | null => {
      for (const [classroomId, list] of Object.entries(db.posts)) {
        if (list.some((p) => p.id === postId)) return classroomId;
      }
      return null;
    },
    [db.posts]
  );

  const replyToPost = useCallback(
    (postId: string, input: { body: string; author: string; init: string; role: "tutor" | "student"; attachments?: PostAttachment[] }) => {
      const text = input.body.trim();
      const files = input.attachments ?? [];
      if (!text && files.length === 0) return;
      const classroomId = findPost(postId);
      if (!classroomId) return;
      const cls = classifyMessage(text);
      const now = Date.now();
      const reply: PostReply = { id: "pr" + now, author: input.author, init: input.init, role: input.role, body: text, when: "Just now", ts: now, attachments: files.length ? files : undefined, flag: cls.category !== "none" ? cls.category : undefined, held: cls.held || undefined };
      setDb((s) => ({
        ...s,
        posts: {
          ...s.posts,
          [classroomId]: s.posts[classroomId].map((p) => (p.id === postId ? { ...p, replies: [...p.replies, reply] } : p)),
        },
      }));
    },
    [findPost]
  );

  const togglePin = useCallback(
    (postId: string) => {
      const classroomId = findPost(postId);
      if (!classroomId) return;
      setDb((s) => ({
        ...s,
        posts: {
          ...s.posts,
          [classroomId]: s.posts[classroomId].map((p) => (p.id === postId ? { ...p, pinned: !p.pinned } : p)),
        },
      }));
    },
    [findPost]
  );

  const deletePost = useCallback(
    (postId: string) => {
      const classroomId = findPost(postId);
      if (!classroomId) return;
      setDb((s) => ({
        ...s,
        posts: { ...s.posts, [classroomId]: s.posts[classroomId].filter((p) => p.id !== postId) },
      }));
    },
    [findPost]
  );

  const value: ClassroomContextValue = { postsFor, createPost, replyToPost, togglePin, deletePost };

  return <ClassroomContext.Provider value={value}>{children}</ClassroomContext.Provider>;
}
