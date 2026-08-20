"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  messageFontFamily,
  messageFontSizePx,
  type MessageFontId,
} from "@/lib/message-fonts";

/** Empty postage stamp placeholder (top-right of postcard back). */
export function StampArea({ label = "Stamp" }: { label?: string }) {
  return (
    <div className="postcard-stamp postcard-layer-stamp" aria-label="Stamp area" role="img">
      <span className="postcard-stamp__label">{label}</span>
    </div>
  );
}

/** Ruled blank like a real postcard fill-in line. */
export function PostcardWriteLine({
  className = "",
  label,
  inline = false,
}: {
  className?: string;
  label?: string;
  inline?: boolean;
}) {
  return (
    <span
      role="presentation"
      aria-label={label}
      className={`postcard-write-line ${
        inline ? "postcard-write-line--inline" : ""
      } ${className}`}
    />
  );
}

/** Stack of write-in lines for longer blank fields (e.g. availability). */
export function PostcardWriteLines({
  count = 3,
  label,
}: {
  count?: number;
  label?: string;
}) {
  return (
    <div className="postcard-write-lines" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="postcard-write-line" />
      ))}
    </div>
  );
}

/** Horizontal rule separating personal postcard content from availability. */
export function PostcardDivider() {
  return <div className="postcard-divider-h" aria-hidden />;
}

/** Recipients shown as a wrapping "To:" address block. */
export function RecipientList({
  recipients,
  onEdit,
}: {
  recipients: { id: string; label: string }[];
  onEdit?: (id: string) => void;
}) {
  return (
    <div className="postcard-recipients text-left">
      <p className="postcard-recipients__label">To:</p>
      {recipients.length > 0 ? (
        <ul className="postcard-recipients__list">
          {recipients.map((r) => (
            <li key={r.id}>
              {onEdit ? (
                <button
                  type="button"
                  className="postcard-recipient postcard-recipient--interactive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(r.id);
                  }}
                >
                  {r.label}
                </button>
              ) : (
                <span className="postcard-recipient">{r.label}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const MESSAGE_MAX_FONT_DESKTOP_PX = 25; // ~22% under prior 32px; keeps title dominant
const MESSAGE_MAX_FONT_TABLET_PX = 22; // sm–lg
const MESSAGE_MAX_FONT_MOBILE_PX = 17; // < sm
const MESSAGE_MIN_FONT_PX = 11;
const MESSAGE_LINE_HEIGHT = 1.45;
const MESSAGE_MAX_LINES = 2;
/** Vertical padding on .postcard-message (0.15rem + 0.3rem). */
const MESSAGE_PAD_Y_PX = 7.2;

/**
 * Default message size follows viewport (same on landing + create),
 * not the rendered card width — so create matches the landing postcard.
 */
function maxFontForViewport(): number {
  if (typeof window === "undefined") return MESSAGE_MAX_FONT_MOBILE_PX;
  if (window.matchMedia("(min-width: 1024px)").matches) {
    return MESSAGE_MAX_FONT_DESKTOP_PX;
  }
  if (window.matchMedia("(min-width: 640px)").matches) {
    return MESSAGE_MAX_FONT_TABLET_PX;
  }
  return MESSAGE_MAX_FONT_MOBILE_PX;
}

function twoLineMaxHeight(maxFont: number): number {
  return maxFont * MESSAGE_LINE_HEIGHT * MESSAGE_MAX_LINES + MESSAGE_PAD_Y_PX;
}

function measureFitsTwoLines(el: HTMLElement, maxHeight: number): boolean {
  return el.scrollHeight <= maxHeight + 1;
}

/**
 * Keep the default size unless content needs more than 2 lines;
 * then binary-search down so it still fits in 2 lines.
 */
function fitFontSize(
  el: HTMLElement,
  maxHeight: number,
  maxFont: number,
  minFont: number
): number {
  el.style.height = "auto";
  el.style.fontSize = `${maxFont}px`;

  if (measureFitsTwoLines(el, maxHeight)) {
    if (el instanceof HTMLTextAreaElement) {
      el.style.height = `${Math.min(el.scrollHeight + 6, maxHeight)}px`;
    }
    return maxFont;
  }

  let lo = minFont;
  let hi = maxFont;
  let best = minFont;

  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = `${mid}px`;
    el.style.height = "auto";
    if (measureFitsTwoLines(el, maxHeight)) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  el.style.fontSize = `${best}px`;
  if (el instanceof HTMLTextAreaElement) {
    el.style.height = `${Math.min(el.scrollHeight + 6, maxHeight)}px`;
  }
  return best;
}

/** Handwritten note; default size until more than 2 lines, then shrinks to fit. */
export function MessageArea({
  value,
  editable = false,
  onChange,
  fontId,
  fontFamily,
}: {
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  /** Selected handwriting face. Drives family + perceived-size scale. */
  fontId?: MessageFontId | string | null;
  /** @deprecated Prefer `fontId`. Kept for callers that only pass a CSS family. */
  fontFamily?: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [fontSize, setFontSize] = useState(() =>
    messageFontSizePx(MESSAGE_MAX_FONT_MOBILE_PX, fontId)
  );

  const resolvedFamily = fontFamily || messageFontFamily(fontId);

  const fit = useCallback(() => {
    const shell = shellRef.current;
    const el = editable ? areaRef.current : textRef.current;
    if (!shell || !el) return;

    const baseMax = maxFontForViewport();
    // Calibrate CSS px per face so x-heights look similar; shell height follows.
    const maxFont = messageFontSizePx(baseMax, fontId, MESSAGE_MIN_FONT_PX);
    const minFont = messageFontSizePx(
      MESSAGE_MIN_FONT_PX,
      fontId,
      Math.max(8, MESSAGE_MIN_FONT_PX * 0.75)
    );
    const maxHeight = twoLineMaxHeight(maxFont);
    shell.style.maxHeight = `${maxHeight}px`;
    const next = fitFontSize(el, maxHeight, maxFont, minFont);
    setFontSize(next);
  }, [editable, fontId]);

  useLayoutEffect(() => {
    fit();
  }, [value, resolvedFamily, fontId, focused, fit]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const stage = shell.closest(".postcard-stage");
    const ro = new ResizeObserver(() => fit());
    ro.observe(shell);
    if (stage) ro.observe(stage);

    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    const mqTablet = window.matchMedia("(min-width: 640px)");
    const onViewportChange = () => fit();
    mqDesktop.addEventListener("change", onViewportChange);
    mqTablet.addEventListener("change", onViewportChange);

    return () => {
      ro.disconnect();
      mqDesktop.removeEventListener("change", onViewportChange);
      mqTablet.removeEventListener("change", onViewportChange);
    };
  }, [fit]);

  const handStyle: CSSProperties = {
    fontFamily: resolvedFamily || undefined,
    fontSize: `${fontSize}px`,
    lineHeight: MESSAGE_LINE_HEIGHT,
    whiteSpace: "pre-wrap",
  };

  if (!editable || !onChange) {
    return (
      <div ref={shellRef} className="postcard-message-shell">
        <div
          ref={textRef}
          className="postcard-message font-hand"
          style={handStyle}
        >
          {value}
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="postcard-message-shell">
      <textarea
        ref={areaRef}
        className={`postcard-message postcard-message--edit font-hand ${
          focused ? "is-editing" : ""
        }`}
        style={handStyle}
        value={value}
        rows={2}
        spellCheck
        aria-label="Postcard message"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Inline title edit that keeps display typography. */
export function EditableTitle({
  value,
  editable = false,
  onChange,
}: {
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  if (!editable || !onChange) {
    return (
      <p className="font-display text-2xl leading-tight tracking-tight text-ink sm:text-2xl lg:text-3xl">
        {value}
      </p>
    );
  }

  return (
    <input
      type="text"
      className={`postcard-title-edit font-display ${focused ? "is-editing" : ""}`}
      value={value}
      aria-label="Postcard title"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function AddressLine({
  children,
  onClick,
}: {
  children?: ReactNode;
  onClick?: () => void;
}) {
  const content = children ? (
    <span className="postcard-address-line__text">{children}</span>
  ) : null;

  if (onClick && children) {
    return (
      <button
        type="button"
        className="postcard-address-line postcard-address-line--interactive"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {content}
      </button>
    );
  }

  return <div className="postcard-address-line">{content}</div>;
}
