// Shared messaging UI used by both the student and tutor portals:
// delivery ticks, day separators, typing dots, attachment renderers,
// an image lightbox and the composer (real files, drag-drop, multiline).

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { categoryColor } from "@/lib/features";
import { ChatAttachment, ChatMessage, ChatThread, dayKey, dayLabel, fmtSize, fmtTime, useMessaging } from "@/lib/messaging";

export const IC = {
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z",
  clip: "M16.5 6.5v9a4.5 4.5 0 0 1-9 0V5a3 3 0 0 1 6 0v9.5a1.5 1.5 0 0 1-3 0V6.5H9v8a3 3 0 0 0 6 0V5a4.5 4.5 0 0 0-9 0v10.5a6 6 0 0 0 12 0v-9h-1.5Z",
  send: "M2 21 23 12 2 3v7l15 2-15 2v7Z",
  shield: "M12 1 3 5v6c0 5 3.8 9.4 9 11 5.2-1.6 9-6 9-11V5l-9-4Z",
  image: "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 11 11 14.01 14.5 9.5 19 15.5H5l3.5-4.5Z",
  down: "M12 16 6 10h4V3h4v7h4l-6 6Zm-7 2h14v3H5v-3Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
  search: "M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
};

// ---------- delivery ticks ----------

function Tick({ double, blue }: { double?: boolean; blue?: boolean }) {
  const c = blue ? "var(--brand-500)" : "var(--fg4)";
  return (
    <svg width="15" height="11" viewBox="0 0 16 11" fill="none" aria-hidden="true">
      <path d="M1 5.5 4.5 9 10 2" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {double && <path d="M6.5 5.5 10 9 15.5 2" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function DeliveryState({ msg, read }: { msg: ChatMessage; read: boolean }) {
  if (msg.held) {
    return (
      <span style={{ fontSize: 10.5, color: "var(--warn-700)", fontWeight: 600 }} aria-label="Held for review">
        Held for review
      </span>
    );
  }
  const label = read ? "Read" : msg.status === "delivered" ? "Delivered" : "Sent";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }} aria-label={label} title={label}>
      <Tick double={read || msg.status === "delivered"} blue={read} />
      <span style={{ fontSize: 10, color: read ? "var(--brand-600)" : "var(--fg4)", fontWeight: 600 }}>{label}</span>
    </span>
  );
}

// ---------- day separator ----------

export function DaySeparator({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0" }} role="separator" aria-label={label}>
      <span style={{ flex: 1, height: 1, background: "rgba(0,32,63,.08)" }} />
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: "rgba(0,32,63,.08)" }} />
    </div>
  );
}

/** Interleave messages with day separators. */
export function withDaySeparators(messages: ChatMessage[], now: number): (ChatMessage | { sep: string; id: string })[] {
  const out: (ChatMessage | { sep: string; id: string })[] = [];
  let lastKey = "";
  for (const m of messages) {
    const k = dayKey(m.sentAt);
    if (k !== lastKey) {
      out.push({ sep: dayLabel(m.sentAt, now), id: "sep-" + k });
      lastKey = k;
    }
    out.push(m);
  }
  return out;
}

export function isSep(x: ChatMessage | { sep: string; id: string }): x is { sep: string; id: string } {
  return (x as { sep?: string }).sep !== undefined;
}

// ---------- typing indicator ----------

export function TypingDots({ name }: { name: string }) {
  const dot = (delay: string) => (
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fg4)", display: "inline-block", animation: "evblink 1.2s ease-in-out " + delay + " infinite" }} />
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, animation: "evdrop .25s ease-out" }} aria-label={name + " is typing"}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.9)", borderRadius: "16px 16px 16px 4px", padding: "12px 15px", boxShadow: "0 8px 20px -12px rgba(0,32,63,.2)" }}>
        {dot("0s")}
        {dot(".2s")}
        {dot(".4s")}
      </div>
      <span style={{ fontSize: 10.5, color: "var(--fg4)" }}>{name} is typing</span>
    </div>
  );
}

// ---------- attachments ----------

export function AttachmentView({ atts, mine, onPreview }: { atts: ChatAttachment[]; mine: boolean; onPreview: (a: ChatAttachment) => void }) {
  const images = atts.filter((a) => a.kind === "image" && a.dataUrl);
  const files = atts.filter((a) => a.kind !== "image" || !a.dataUrl);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: atts.length ? 8 : 0 }}>
      {images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {images.map((a) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.id}
              src={a.dataUrl}
              alt={a.name}
              onClick={() => onPreview(a)}
              style={{ width: 132, height: 96, objectFit: "cover", borderRadius: 10, cursor: "zoom-in", border: "1px solid rgba(0,32,63,.1)", background: "#fff" }}
            />
          ))}
        </div>
      )}
      {files.map((a) => (
        <a
          key={a.id}
          href={a.dataUrl}
          download={a.dataUrl ? a.name : undefined}
          onClick={(e) => {
            if (!a.dataUrl) e.preventDefault();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 11px",
            borderRadius: 10,
            textDecoration: "none",
            background: mine ? "rgba(255,255,255,.2)" : "rgba(0,32,63,.05)",
            border: mine ? "1px solid rgba(255,255,255,.35)" : "1px solid rgba(0,32,63,.08)",
            color: "inherit",
            cursor: a.dataUrl ? "pointer" : "default",
            maxWidth: 260,
          }}
          title={a.dataUrl ? "Download " + a.name : a.name}
        >
          <Icon path={IC.doc} size={14} style={{ flex: "none", opacity: 0.85 }} />
          <span style={{ minWidth: 0, overflow: "hidden" }}>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
            <span style={{ display: "block", fontSize: 10, opacity: 0.75 }}>{fmtSize(a.size)}</span>
          </span>
          {a.dataUrl && <Icon path={IC.down} size={13} style={{ flex: "none", opacity: 0.7 }} />}
        </a>
      ))}
    </div>
  );
}

export function Lightbox({ att, onClose }: { att: ChatAttachment | null; onClose: () => void }) {
  useEffect(() => {
    if (!att) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [att, onClose]);
  if (!att || !att.dataUrl) return null;
  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-label={"Preview of " + att.name}
      style={{ position: "fixed", inset: 0, zIndex: "var(--z-toast)", background: "rgba(0,20,40,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, animation: "evfadein .18s ease-out", cursor: "zoom-out" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={att.dataUrl} alt={att.name} style={{ maxWidth: "88%", maxHeight: "86%", borderRadius: 14, boxShadow: "0 40px 90px -30px rgba(0,0,0,.6)" }} />
      <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,.85)", fontSize: 12.5 }}>
        {att.name} · {fmtSize(att.size)} · click anywhere to close
      </div>
    </div>
  );
}

// ---------- message bubble ----------

export function Bubble({
  msg,
  mine,
  read,
  accent,
  onPreview,
}: {
  msg: ChatMessage;
  mine: boolean;
  read: boolean;
  accent?: string; // sender bubble colour, defaults to brand blue
  onPreview: (a: ChatAttachment) => void;
}) {
  if (msg.role === "system") {
    const safeguard = msg.flag === "safeguarding";
    const heldTone = msg.held && !safeguard;
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            maxWidth: "84%",
            textAlign: "center",
            fontSize: 11.5,
            fontWeight: 600,
            lineHeight: 1.5,
            color: safeguard ? "var(--success-700)" : heldTone ? "#8C2B2B" : "var(--fg3)",
            background: safeguard ? "rgba(34,160,91,.1)" : heldTone ? "rgba(224,65,65,.08)" : "rgba(0,32,63,.05)",
            border: safeguard ? "1px solid rgba(34,160,91,.25)" : heldTone ? "1px dashed rgba(224,65,65,.35)" : "1px solid rgba(0,32,63,.08)",
            borderRadius: 12,
            padding: "9px 14px",
            animation: "evdrop .25s ease-out",
          }}
        >
          {msg.text}
        </div>
      </div>
    );
  }

  const cat = msg.flag && msg.flag !== "none" ? categoryColor(msg.flag) : null;
  const bg = mine ? (msg.held ? "rgba(0,157,255,.4)" : accent ?? "var(--brand-500)") : msg.role === "admin" ? "rgba(0,32,63,.9)" : "rgba(255,255,255,.9)";
  const fg = mine || msg.role === "admin" ? "#fff" : "var(--fg1)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 3 }}>
      {msg.topic && (
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg3)", background: "rgba(0,32,63,.06)", borderRadius: 980, padding: "2px 8px", textTransform: "uppercase" }}>
          {msg.topic === "urgent" ? "Something is wrong" : msg.topic}
        </span>
      )}
      <div
        style={{
          maxWidth: "72%",
          padding: "11px 15px",
          borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: bg,
          color: fg,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          boxShadow: mine ? "0 8px 20px -10px rgba(0,157,255,.5)" : "0 8px 20px -12px rgba(0,32,63,.2)",
          animation: "evdrop .25s ease-out",
        }}
      >
        {msg.text}
        {msg.attachments && <AttachmentView atts={msg.attachments} mine={mine || msg.role === "admin"} onPreview={onPreview} />}
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {cat && !mine && (
          <span style={{ fontSize: 9.5, fontWeight: 700, color: cat.color, background: cat.bg, padding: "1px 7px", borderRadius: 980 }}>{cat.label}</span>
        )}
        <span style={{ fontSize: 10, color: "var(--fg4)" }}>{fmtTime(msg.sentAt)}</span>
        {mine && <DeliveryState msg={msg} read={read} />}
      </span>
    </div>
  );
}

// ---------- composer ----------

const ACCEPT = "image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv";
const MAX_FILES = 5;
const MAX_FILE_BYTES = 2_500_000; // keep the localStorage demo store comfortable

export interface ComposerHandle {
  addFiles: (files: FileList | File[]) => void;
}

export function Composer({
  placeholder,
  disabled,
  onSend,
  onError,
  registerDropTarget,
}: {
  placeholder: string;
  disabled?: boolean;
  onSend: (text: string, attachments: ChatAttachment[]) => boolean; // return true to clear
  onError: (msg: string) => void;
  /** Lets the parent register the thread container as a drag-drop zone. */
  registerDropTarget?: (handle: ComposerHandle) => void;
}) {
  const [draft, setDraft] = useState("");
  const [atts, setAtts] = useState<ChatAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      setAtts((prev) => {
        let next = [...prev];
        for (const f of list) {
          if (next.length >= MAX_FILES) {
            onError("You can attach up to " + MAX_FILES + " files per message");
            break;
          }
          if (f.size > MAX_FILE_BYTES) {
            onError('"' + f.name + '" is too big for this demo (2.5 MB max)');
            continue;
          }
          const id = "att" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          const kind: "image" | "file" = f.type.startsWith("image/") ? "image" : "file";
          const att: ChatAttachment = { id, name: f.name, size: f.size, mime: f.type || "application/octet-stream", kind };
          next = [...next, att];
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
            setAtts((cur) => cur.map((a) => (a.id === id ? { ...a, dataUrl } : a)));
          };
          reader.readAsDataURL(f);
        }
        return next;
      });
    },
    [onError]
  );

  useEffect(() => {
    registerDropTarget?.({ addFiles });
  }, [registerDropTarget, addFiles]);

  const doSend = () => {
    if (busy || disabled) return;
    if (!draft.trim() && atts.length === 0) return;
    setBusy(true);
    const ok = onSend(draft, atts);
    if (ok) {
      setDraft("");
      setAtts([]);
      if (taRef.current) taRef.current.style.height = "auto";
    }
    setBusy(false);
    taRef.current?.focus();
  };

  const autoGrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 108) + "px";
  };

  return (
    <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,32,63,.07)" }}>
      {atts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {atts.map((a) => (
            <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,32,63,.05)", borderRadius: 9, padding: "4px 10px", fontSize: 11.5, color: "var(--fg2)" }}>
              <Icon path={a.kind === "image" ? IC.image : IC.doc} size={13} style={{ color: "var(--fg3)", flex: "none" }} />
              <span style={{ maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
              <span style={{ color: "var(--fg4)", fontSize: 10.5 }}>{fmtSize(a.size)}</span>
              <button
                onClick={() => setAtts((cur) => cur.filter((x) => x.id !== a.id))}
                aria-label={"Remove " + a.name}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--fg4)", fontWeight: 700, padding: 0, lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "rgba(255,255,255,.85)", border: "1px solid rgba(0,32,63,.1)", borderRadius: 14, padding: "6px 8px 6px 14px" }}>
        <textarea
          ref={taRef}
          value={draft}
          rows={1}
          disabled={disabled}
          onChange={(e) => {
            setDraft(e.target.value);
            autoGrow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              doSend();
            }
          }}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData?.files ?? []);
            if (files.length) {
              e.preventDefault();
              addFiles(files);
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="thin-scroll"
          style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", minWidth: 0, resize: "none", outline: "none", lineHeight: 1.5, padding: "7px 0", maxHeight: 108 }}
        />
        <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => e.target.files && (addFiles(e.target.files), (e.target.value = ""))} />
        <button
          onClick={() => fileRef.current?.click()}
          title="Attach files"
          aria-label="Attach files"
          className="list-hover ev-tap"
          style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: "transparent", color: "var(--fg3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}
        >
          <Icon path={IC.clip} size={16} />
        </button>
        <button
          onClick={doSend}
          disabled={disabled || busy || (!draft.trim() && atts.length === 0)}
          aria-label="Send message"
          className="btn-primary"
          style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", opacity: disabled || (!draft.trim() && atts.length === 0) ? 0.5 : 1 }}
        >
          <Icon path={IC.send} size={15} />
        </button>
      </div>
      {/* Keyboard shortcuts and drag-and-drop are desktop affordances - on a
          phone they are noise, and the line wrapped to two orphaned words. */}
      <div style={{ fontSize: 11, color: "var(--fg3)", marginTop: 5, paddingLeft: 2 }}>
        <span className="ev-only-desktop">Enter to send · Shift+Enter for a new line · drag files anywhere in the thread</span>
        <span className="ev-only-mobile-t">Tap the clip to attach a file.</span>
      </div>
    </div>
  );
}

// ---------- drop zone wrapper ----------

export function DropZone({ onFiles, children, style }: { onFiles: (files: FileList) => void; children: React.ReactNode; style?: React.CSSProperties }) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  return (
    <div
      style={{ position: "relative", ...style }}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setOver(false);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
      }}
    >
      {children}
      {over && (
        <div
          style={{
            position: "absolute",
            inset: 8,
            zIndex: 5,
            borderRadius: 14,
            border: "2px dashed var(--brand-500)",
            background: "rgba(0,157,255,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            animation: "evfadein .15s ease-out",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-600)", background: "rgba(255,255,255,.92)", borderRadius: 10, padding: "8px 16px" }}>Drop files to attach</span>
        </div>
      )}
    </div>
  );
}

// ---------- unread badge ----------

export function UnreadBadge({ n, muted }: { n: number; muted?: boolean }) {
  if (!n) return null;
  return (
    <span
      aria-label={n + " unread"}
      style={{
        flex: "none",
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        background: muted ? "rgba(0,32,63,.35)" : "var(--brand-500)",
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 5px",
      }}
    >
      {n > 9 ? "9+" : n}
    </span>
  );
}
