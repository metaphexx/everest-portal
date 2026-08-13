// ClassroomStream - the shared Google-Classroom-style post feed, used by both
// the tutor and student classroom pages. A composer at the top creates a post
// (with optional file attachments; tutors can pin as an announcement); each
// post is a card with its own reply thread. Reads/writes through the shared
// useClassroom() provider so both portals see the same content.

import React, { useRef, useState } from "react";
import { useClassroom, ClassPost, PostAttachment } from "@/lib/classroom";
import { categoryColor, FlagCategory } from "@/lib/features";
import { Icon } from "@/components/ui/Icon";

const ATTACH_ICON = "M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5S13.5 3.62 13.5 5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7.5 2.79 7.5 5v11.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5Z";
const SEND_ICON = "M2 21l21-9L2 3v7l15 2-15 2v7Z";
const PIN_ICON = "M14 2 22 10l-1.41 1.41L19 9.83V16h-2V9.83l-1.59 1.58L14 10l3-3-3-3ZM8 2h8v2h-1.5l-.7 6.29L18 14.59V17h-5v5h-2v-5H6v-2.41l4.2-4.3L9.5 4H8V2Z";
const TRASH_ICON = "M9 3v1H4v2h16V4h-5V3H9ZM6 8v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8H6Z";
const DOC_ICON = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z";
const LINK_ICON = "M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 0 0 0 6h3v2h-3a5 5 0 0 1-5-5Zm8.1 1h4v-2h-4v2Zm3-6h-2.9v2H15a3 3 0 0 1 0 6h-2.9v2H15a5 5 0 0 0 0-10Z";

export interface Viewer {
  name: string;
  init: string;
  role: "tutor" | "student";
}

/** Extra context handed back with a preview click - lets link chips open the
    browser-style link preview instead of the document one. */
export interface PreviewOpts {
  kind?: "doc" | "link";
  url?: string;
}

function extOf(fileName: string): string {
  const m = fileName.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "file";
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Turns a pasted URL into a link attachment with a readable name. */
export function linkAttachment(rawUrl: string): PostAttachment {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : "https://" + rawUrl;
  return { name: hostOf(url), ext: "link", kind: "link", url };
}

function AttachmentChip({ a, onPreview }: { a: PostAttachment; onPreview: (name: string, meta: string, opts?: PreviewOpts) => void }) {
  const isLink = a.kind === "link";
  return (
    <button
      onClick={() => (isLink ? onPreview(a.name, a.url ? hostOf(a.url) : "Shared link", { kind: "link", url: a.url }) : onPreview(a.name, a.ext.toUpperCase() + " attachment"))}
      className="press"
      style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid rgba(0,32,63,.12)", background: "rgba(255,255,255,.75)", borderRadius: 10, padding: "6px 11px", cursor: "pointer", fontFamily: "inherit", maxWidth: "100%" }}
    >
      <span style={{ width: 24, height: 24, borderRadius: 7, flex: "none", background: isLink ? "rgba(34,160,91,.12)" : a.ext === "pdf" ? "rgba(224,65,65,.1)" : "rgba(0,157,255,.12)", color: isLink ? "var(--success-700)" : a.ext === "pdf" ? "var(--danger-500)" : "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon path={isLink ? LINK_ICON : DOC_ICON} size={12} />
      </span>
      <span style={{ minWidth: 0, textAlign: "left" }}>
        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--fg2-alt)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
        {isLink && a.url && <span style={{ display: "block", fontSize: 10, color: "var(--fg4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.url}</span>}
      </span>
    </button>
  );
}

/** Pending-attachment chips + the Attach / Link buttons shared by the post
    composer and every reply composer. */
function AttachControls({
  attachments,
  setAttachments,
  compact,
}: {
  attachments: PostAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<PostAttachment[]>>;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((f) => ({ name: f.name, ext: extOf(f.name) }));
    setAttachments((a) => [...a, ...next]);
  };

  const addLink = () => {
    if (!linkDraft.trim()) return;
    setAttachments((a) => [...a, linkAttachment(linkDraft.trim())]);
    setLinkDraft("");
    setLinkOpen(false);
  };

  const h = compact ? 28 : 32;
  return (
    <>
      {attachments.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: compact ? 8 : 10 }}>
          {attachments.map((a, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid rgba(0,32,63,.12)", background: "rgba(255,255,255,.75)", borderRadius: 10, padding: "5px 8px 5px 10px", fontSize: 12, fontWeight: 600, color: "var(--fg2-alt)", maxWidth: "100%" }}>
              <Icon path={a.kind === "link" ? LINK_ICON : DOC_ICON} size={12} style={{ color: a.kind === "link" ? "var(--success-700)" : "var(--fg3)", flex: "none" }} />
              <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
              <button onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))} aria-label="Remove attachment" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--fg4)", fontWeight: 700, fontSize: 13, lineHeight: 1, flex: "none" }}>✕</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: compact ? 8 : 0, flexWrap: "wrap" }}>
        <button onClick={() => fileRef.current?.click()} className="btn-ghost press" style={{ height: h, padding: "0 11px", borderRadius: 9, fontSize: compact ? 11.5 : 12, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.7)" }}>
          <Icon path={ATTACH_ICON} size={compact ? 12 : 14} style={{ color: "var(--fg3)" }} />
          Attach
        </button>
        <button onClick={() => setLinkOpen((v) => !v)} className="btn-ghost press" style={{ height: h, padding: "0 11px", borderRadius: 9, fontSize: compact ? 11.5 : 12, display: "inline-flex", alignItems: "center", gap: 6, background: linkOpen ? "rgba(34,160,91,.1)" : "rgba(255,255,255,.7)", color: linkOpen ? "var(--success-700)" : undefined }}>
          <Icon path={LINK_ICON} size={compact ? 12 : 14} style={{ color: linkOpen ? "var(--success-700)" : "var(--fg3)" }} />
          Link
        </button>
        <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        {linkOpen && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flex: 1, minWidth: 180, animation: "evfadein .2s ease" }}>
            <input
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLink()}
              placeholder="Paste a link, e.g. khanacademy.org/..."
              aria-label="Link URL"
              className="field"
              style={{ flex: 1, height: h, fontSize: 12, minWidth: 0 }}
              autoFocus
            />
            <button onClick={addLink} className="btn-soft press" style={{ height: h, padding: "0 12px", borderRadius: 9, fontSize: compact ? 11.5 : 12, flex: "none" }}>
              Add
            </button>
          </span>
        )}
      </div>
    </>
  );
}

function Avatar({ init, tutor, size = 32 }: { init: string; tutor: boolean; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size < 30 ? 9.5 : 11,
        fontWeight: 800,
        color: "#fff",
        background: tutor ? "linear-gradient(135deg,var(--brand-500),var(--accent-violet))" : "rgba(0,32,63,.42)",
      }}
    >
      {init}
    </span>
  );
}

function HeldNotice() {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 600, color: "#8C2B2B", background: "rgba(224,65,65,.08)", border: "1px dashed rgba(224,65,65,.35)", borderRadius: 10, padding: "8px 12px" }}>
      This post is being reviewed by the Everest team before the class can see it.
    </div>
  );
}

function FlagChip({ flag }: { flag: string }) {
  const fc = categoryColor(flag as FlagCategory);
  if (!fc.label) return null;
  return <span style={{ fontSize: 9.5, fontWeight: 800, color: fc.color, background: fc.bg, padding: "2px 8px", borderRadius: 980 }}>{fc.label}</span>;
}

function ReplyComposer({ onSend, accent }: { onSend: (body: string, attachments: PostAttachment[]) => void; accent: string }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const send = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text, attachments);
    setText("");
    setAttachments([]);
  };
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Add a reply..."
          className="field"
          style={{ flex: 1, height: 34, fontSize: 12.5 }}
        />
        <button onClick={send} className="press" aria-label="Send reply" style={{ height: 34, width: 34, borderRadius: 9, border: "none", background: accent, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Icon path={SEND_ICON} size={15} />
        </button>
      </div>
      <AttachControls attachments={attachments} setAttachments={setAttachments} compact />
    </div>
  );
}

function PostCard({
  post,
  viewer,
  accent,
  onPreview,
  canPin,
}: {
  post: ClassPost;
  viewer: Viewer;
  accent: string;
  onPreview: (name: string, meta: string, opts?: PreviewOpts) => void;
  canPin: boolean;
}) {
  const { replyToPost, togglePin, deletePost } = useClassroom();
  const [showReply, setShowReply] = useState(false);

  return (
    <div
      className="glass-card"
      style={{ padding: "16px 18px", borderLeft: post.pinned ? "3px solid var(--warn-500)" : undefined }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar init={post.init} tutor={post.role === "tutor"} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{post.author}</span>
            {post.role === "tutor" && <span style={{ fontSize: 9, fontWeight: 800, color: "var(--brand-600)", background: "rgba(0,157,255,.12)", padding: "1px 7px", borderRadius: 980 }}>TUTOR</span>}
            {post.pinned && <span style={{ fontSize: 9, fontWeight: 800, color: "var(--warn-700)", background: "rgba(245,166,35,.2)", padding: "1px 7px", borderRadius: 980 }}>PINNED</span>}
            {post.flag && <FlagChip flag={post.flag} />}
          </span>
          <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{post.when}</span>
        </span>
        {canPin && (
          <div style={{ display: "flex", gap: 4, flex: "none" }}>
            <button onClick={() => togglePin(post.id)} title={post.pinned ? "Unpin" : "Pin as announcement"} className="press ev-tap" style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: post.pinned ? "rgba(245,166,35,.16)" : "rgba(0,32,63,.05)", color: post.pinned ? "var(--warn-700)" : "var(--fg4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path={PIN_ICON} size={13} />
            </button>
            <button onClick={() => deletePost(post.id)} title="Delete post" className="press ev-tap" style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(224,65,65,.08)", color: "var(--danger-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path={TRASH_ICON} size={13} />
            </button>
          </div>
        )}
      </div>

      {/* body */}
      {post.held ? (
        <div style={{ marginTop: 10 }}>
          <HeldNotice />
        </div>
      ) : (
        <>
          {post.body && <div style={{ fontSize: 13, color: "var(--fg2-alt)", lineHeight: 1.55, marginTop: 10, whiteSpace: "pre-wrap" }}>{post.body}</div>}
          {post.attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {post.attachments.map((a, i) => (
                <AttachmentChip key={i} a={a} onPreview={onPreview} />
              ))}
            </div>
          )}
        </>
      )}

      {/* replies */}
      {post.replies.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,32,63,.06)", display: "flex", flexDirection: "column", gap: 10 }}>
          {post.replies.map((r) =>
            r.held ? (
              <HeldNotice key={r.id} />
            ) : (
              <div key={r.id} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <Avatar init={r.init} tutor={r.role === "tutor"} size={26} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{r.author}</span>
                    {r.role === "tutor" && <span style={{ fontSize: 8.5, fontWeight: 800, color: "var(--brand-600)", background: "rgba(0,157,255,.12)", padding: "1px 6px", borderRadius: 980 }}>TUTOR</span>}
                    {r.flag && <FlagChip flag={r.flag} />}
                    <span style={{ fontSize: 10.5, color: "var(--fg4)" }}>{r.when}</span>
                  </span>
                  {r.body && <span style={{ display: "block", fontSize: 12.5, color: "var(--fg2-alt)", lineHeight: 1.5, marginTop: 1 }}>{r.body}</span>}
                  {(r.attachments ?? []).length > 0 && (
                    <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {(r.attachments ?? []).map((a, i) => (
                        <AttachmentChip key={i} a={a} onPreview={onPreview} />
                      ))}
                    </span>
                  )}
                </span>
              </div>
            )
          )}
        </div>
      )}

      {/* reply affordance */}
      {showReply ? (
        <ReplyComposer
          accent={accent}
          onSend={(body, attachments) => {
            replyToPost(post.id, { body, author: viewer.name, init: viewer.init, role: viewer.role, attachments });
            setShowReply(false);
          }}
        />
      ) : (
        <button onClick={() => setShowReply(true)} className="press ev-tap-link" style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "var(--brand-600)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
          Reply
        </button>
      )}
    </div>
  );
}

export function ClassroomStream({
  classroomId,
  viewer,
  accent,
  roomName,
  onPreview,
}: {
  classroomId: string;
  viewer: Viewer;
  accent: string;
  roomName: string;
  onPreview: (name: string, meta: string, opts?: PreviewOpts) => void;
}) {
  const { postsFor, createPost } = useClassroom();
  const posts = postsFor(classroomId);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [pinned, setPinned] = useState(false);
  const canPin = viewer.role === "tutor";

  const submit = () => {
    if (!draft.trim() && attachments.length === 0) return;
    createPost({ classroomId, body: draft, author: viewer.name, init: viewer.init, role: viewer.role, pinned: canPin && pinned, attachments });
    setDraft("");
    setAttachments([]);
    setPinned(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      {/* composer */}
      <div className="glass-card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
          <Avatar init={viewer.init} tutor={viewer.role === "tutor"} />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={canPin ? "Share something with the class..." : "Post to the " + roomName + " class..."}
            className="field"
            rows={2}
            style={{ flex: 1, minHeight: 44, resize: "vertical", fontSize: 13, padding: "10px 12px", lineHeight: 1.5 }}
          />
        </div>

        <div style={{ marginLeft: 43, marginTop: 12 }}>
          <AttachControls attachments={attachments} setAttachments={setAttachments} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, marginLeft: 43, flexWrap: "wrap" }}>
          {canPin && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg2)", cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" className="ev-tap-area" checked={pinned} onChange={(e) => setPinned(e.target.checked)} style={{ width: 17, height: 17, accentColor: "var(--brand-500)", cursor: "pointer" }} />
              Pin as announcement
            </label>
          )}
          <span className="ev-spacer-flex" style={{ flex: 1 }} />
          <button onClick={submit} className="btn-primary press" style={{ height: 34, padding: "0 18px", borderRadius: 10, fontSize: 12.5, fontWeight: 700 }}>
            Post
          </button>
        </div>
      </div>

      {/* feed */}
      {posts.length === 0 ? (
        <div className="glass-card" style={{ padding: "28px 22px", textAlign: "center", fontSize: 12.5, color: "var(--fg4)" }}>
          No posts yet. Share the first update with the class.
        </div>
      ) : (
        posts.map((p) => (
          <PostCard key={p.id} post={p} viewer={viewer} accent={accent} onPreview={onPreview} canPin={canPin} />
        ))
      )}
    </div>
  );
}
