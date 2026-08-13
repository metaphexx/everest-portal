// "Requesting materials for" - the visual target picker on Study Materials.
// A card trigger + popover: a Custom Request tile, then the tutor's upcoming
// classes as tiles (each with its delivery chip). Auto-reflects requestClassId
// so a "Request booklets" CTA from anywhere in the portal lands here pre-filled.

import React, { useState } from "react";
import Link from "@/components/ui/Link";
import { useTutor } from "@/lib/tutor-store";
import { DELIVERY_META, TUTOR_COURSES, classLabel } from "@/lib/tutor-data";
import { todayKey } from "@/lib/calendar";
import { useDismissable } from "@/lib/use-dismissable";
import { Icon } from "@/components/ui/Icon";

const STACK = "M12 2 2 7l10 5 10-5-10-5Zm7.7 8.15L12 14 4.3 10.15 2 11.3l10 5 10-5-2.3-1.15Zm0 4L12 18 4.3 14.15 2 15.3l10 5 10-5-2.3-1.15Z";
const CHEV = "M7 10l5 5 5-5H7Z";

function Tile({ icon, title, subtitle, chip, active, onClick }: { icon: string; title: string; subtitle: string; chip?: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="list-hover ev-wrap-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        textAlign: "left",
        border: "none",
        background: active ? "rgba(0,157,255,.08)" : "transparent",
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <span style={{ width: 38, height: 38, borderRadius: "50%", flex: "none", background: "linear-gradient(135deg,var(--accent-violet-light),var(--accent-blue-light))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon path={icon} size={18} />
      </span>
      <span className="ev-wrap-main" style={{ flex: 1, minWidth: 0 }}>
        <span className="ev-title-2" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--fg1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</span>
      </span>
      {chip}
      {active && <Icon path="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" size={16} style={{ color: "var(--brand-600)", flex: "none" }} />}
    </button>
  );
}

function DeliveryChip({ delivery }: { delivery: "in_person" | "online" }) {
  const m = DELIVERY_META[delivery];
  return (
    <span style={{ fontSize: 9.5, fontWeight: 800, color: m.color, background: m.bg, padding: "3px 9px", borderRadius: 980, flex: "none" }}>{m.label}</span>
  );
}

export function RequestTargetSelector({ hideCartLink }: { hideCartLink?: boolean } = {}) {
  const { now, classes, cart, requestClassId, setRequestClass } = useTutor();
  const tKey = todayKey(now);
  const [open, setOpen] = useState(false);
  const wrapRef = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const upcoming = classes.filter((c) => c.k >= tKey).slice(0, 10);
  const ctxClass = requestClassId ? classes.find((c) => c.id === requestClassId) : null;
  const ctxCd = ctxClass ? TUTOR_COURSES[ctxClass.course] : null;

  const choose = (id: string | null) => {
    setRequestClass(id);
    setOpen(false);
  };

  return (
    <div className="glass-card" style={{ padding: "16px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", flex: "none" }}>REQUESTING MATERIALS FOR</span>

        {/* Trigger + popover */}
        <div ref={wrapRef} style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              borderRadius: 13,
              border: "1px solid " + (open ? "var(--brand-500)" : "rgba(0,32,63,.12)"),
              background: "rgba(255,255,255,.85)",
              padding: "8px 12px",
              fontFamily: "inherit",
              boxShadow: open ? "0 0 0 3px rgba(0,157,255,.12)" : "none",
              transition: "border-color .15s ease, box-shadow .15s ease",
            }}
          >
            <span style={{ width: 40, height: 40, borderRadius: "50%", flex: "none", background: "linear-gradient(135deg,var(--accent-violet-light),var(--accent-blue-light))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon path={STACK} size={19} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="ev-title-2" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--fg1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ctxClass ? classLabel(ctxClass) : "Custom Request"}
                </span>
                {ctxCd && <DeliveryChip delivery={ctxCd.delivery} />}
              </span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>
                {ctxClass ? ctxCd!.centre + " · " + ctxCd!.time + " · " + ctxCd!.students.length + " students" : "Not linked to a specific scheduled class"}
              </span>
            </span>
            <Icon path={CHEV} size={18} style={{ color: "var(--fg4)", flex: "none", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }} />
          </button>

          {open && (
            <div
              role="menu"
              aria-label="Choose a request target"
              className="thin-scroll"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: "var(--z-dropdown)",
                maxHeight: 360,
                overflowY: "auto",
                background: "rgba(255,255,255,.97)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,.9)",
                borderRadius: 16,
                boxShadow: "0 28px 60px -20px rgba(0,32,63,.4)",
                padding: 8,
                animation: "evdrop .18s ease-out",
              }}
            >
              <Tile
                icon={STACK}
                title="Custom Request"
                subtitle="Select materials without linking to a schedule"
                active={!requestClassId}
                onClick={() => choose(null)}
              />
              {upcoming.length > 0 && (
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, color: "var(--fg4)", padding: "10px 12px 4px" }}>UPCOMING CLASSES</div>
              )}
              {upcoming.map((c) => {
                const cd = TUTOR_COURSES[c.course];
                const d = new Date(c.k + "T12:00:00");
                return (
                  <Tile
                    key={c.id}
                    icon={cd.icon}
                    title={cd.name}
                    subtitle={d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) + " · " + cd.time + " · " + cd.centre}
                    chip={<DeliveryChip delivery={cd.delivery} />}
                    active={requestClassId === c.id}
                    onClick={() => choose(c.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {!hideCartLink && (
          <Link href="/tutor/cart" className="btn-soft" style={{ height: 40, padding: "0 18px", borderRadius: 11, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", flex: "none" }}>
            Go to cart{cart.length > 0 ? " (" + cart.length + ")" : ""}
          </Link>
        )}
      </div>
    </div>
  );
}
