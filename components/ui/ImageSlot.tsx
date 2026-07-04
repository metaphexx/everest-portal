import React, { useEffect, useRef, useState } from "react";

/**
 * Drop-a-photo slot. Mirrors the prototype's image-slot: drag or click to set
 * a class/campus photo; the image persists (localStorage) keyed by `slotId`,
 * and is shared across every slot with the same id (e.g. a course photo shows
 * on both the dashboard card and the course page).
 */
export function ImageSlot({
  slotId,
  placeholder,
  fallbackSrc,
  className,
  style,
}: {
  slotId: string;
  placeholder?: string;
  /** Default artwork (e.g. the course's stock landscape) shown until a photo is dropped. */
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const storeKey = "everest.photo." + slotId;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storeKey);
      if (saved) setSrc(saved);
    } catch {
      /* ignore */
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === storeKey) setSrc(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storeKey]);

  const readFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setSrc(dataUrl);
      try {
        localStorage.setItem(storeKey, dataUrl);
      } catch {
        /* quota, keep in-memory only */
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={className}
      style={{
        ...style,
        backgroundImage: src ? `url(${src})` : fallbackSrc ? `url(${fallbackSrc})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backgroundColor: src || fallbackSrc ? undefined : over ? "rgba(0,157,255,.12)" : "rgba(0,32,63,.04)",
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={placeholder || "Change photo"}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files?.[0]) readFile(e.dataTransfer.files[0]);
      }}
    >
      {!src && !fallbackSrc && placeholder && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--fg4)",
            textAlign: "center",
            padding: "0 16px",
            pointerEvents: "none",
          }}
        >
          {placeholder}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) readFile(e.target.files[0]);
        }}
      />
    </div>
  );
}
