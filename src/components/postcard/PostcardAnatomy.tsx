"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Empty postage stamp placeholder (top-right of postcard back). */
export function StampArea({ label = "Stamp" }: { label?: string }) {
  return (
    <div className="postcard-stamp postcard-layer-stamp" aria-label="Stamp area" role="img">
      <span className="postcard-stamp__label">{label}</span>
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

/** Handwritten-style personal note; optional live edit without form chrome. */
export function MessageArea({
  value,
  editable = false,
  onChange,
  fontFamily,
}: {
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  fontFamily?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const handStyle = fontFamily ? { fontFamily } : undefined;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, focused, fontFamily]);

  if (!editable || !onChange) {
    return (
      <div className="postcard-message font-hand" style={handStyle}>
        {value.split("\n").map((line, i) =>
          line ? (
            <p key={`${i}-${line}`} className={i > 0 ? "mt-2" : undefined}>
              {line}
            </p>
          ) : (
            <br key={`br-${i}`} />
          )
        )}
      </div>
    );
  }

  return (
    <textarea
      ref={ref}
      className={`postcard-message postcard-message--edit font-hand ${
        focused ? "is-editing" : ""
      }`}
      style={handStyle}
      value={value}
      rows={3}
      spellCheck
      aria-label="Postcard message"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
    />
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
      <p className="font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
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
