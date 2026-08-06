"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FieldActionButton } from "@/components/ui";
import {
  detectTimezone,
  formatTimezoneResult,
  searchTimezones,
} from "@/lib/timezone";
import type { TimezoneInfo } from "@/lib/types";

export function TimezonePicker({
  value,
  onChange,
  error,
  required,
}: {
  value: TimezoneInfo;
  onChange: (info: TimezoneInfo) => void;
  error?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const didDetect = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (didDetect.current) return;
    didDetect.current = true;
    if (!value.timezone || (value.timezone === "UTC" && value.cityLabel === "UTC")) {
      onChange(detectTimezone());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const results = useMemo(() => searchTimezones(query, 10), [query]);
  const display = formatTimezoneResult(value);

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          Timezone
          {required ? <span className="ml-0.5 text-stamp">*</span> : null}
        </p>
        <FieldActionButton
          onClick={() => {
            setEditing((v) => !v);
            setOpen(true);
            setQuery("");
          }}
        >
          {editing ? (
            <>
              <span aria-hidden>✓</span>
              Done
            </>
          ) : (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Search / edit
            </>
          )}
        </FieldActionButton>
      </div>

      <div
        className={`rounded-xl border bg-white px-3.5 py-2 ${
          error ? "border-stamp/60" : "border-ink/10"
        }`}
      >
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <p className="min-w-0 text-sm font-medium text-ink">
            {display.primary}
          </p>
          <p className="min-w-0 text-xs text-ink-soft sm:shrink-0 sm:text-right">
            {display.secondary}
            <span className="mx-1.5 text-ink/20">·</span>
            {display.tertiary}
          </p>
        </div>
      </div>

      {editing && (
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search city, country, or EST / GMT…"
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-base text-ink outline-none ring-ocean/30 placeholder:text-ink-soft/50 focus:border-ocean/40 focus:ring-2"
            autoComplete="off"
          />
          {open && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-ink/10 bg-white shadow-[0_16px_40px_rgba(31,79,92,0.18)]">
              {results.length === 0 ? (
                <li className="px-4 py-3 text-sm text-ink-soft">No matches</li>
              ) : (
                results.map((info, index) => {
                  const row = formatTimezoneResult(info);
                  return (
                    <li
                      key={`${info.timezone}:${info.cityLabel}:${info.countryCode ?? ""}:${index}`}
                    >                      <button
                        type="button"
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-sky/25"
                        onClick={() => {
                          onChange(info);
                          setQuery("");
                          setOpen(false);
                          setEditing(false);
                        }}
                      >
                        <span className="text-sm font-medium text-ink">{row.primary}</span>
                        <span className="text-xs text-ink-soft">
                          {row.secondary}
                          <span className="mx-1.5 text-ink/20">·</span>
                          {row.tertiary}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      )}

      {error ? <p className="text-sm text-stamp">{error}</p> : null}
    </div>
  );
}
