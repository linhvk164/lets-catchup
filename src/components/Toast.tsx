"use client";

import { useEffect } from "react";

/**
 * Small transient confirmation. Remount it with a fresh `key` to restart the
 * timer, since the same message can be shown twice in a row.
 */
export function Toast({
  title,
  message,
  onDismiss,
  duration = 4000,
}: {
  title: string;
  message?: string;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-5"
    >
      <div className="animate-fade-rise pointer-events-auto w-full max-w-sm rounded-2xl border border-ocean/25 bg-white px-4 py-3 shadow-[0_16px_40px_rgba(31,79,92,0.18)]">
        <p className="text-sm font-medium text-ink">{title}</p>
        {message ? (
          <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
