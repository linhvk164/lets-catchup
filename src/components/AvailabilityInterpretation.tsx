"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  ParsedAvailability,
  StructuredAvailability,
  StructuredTimeRange,
} from "@/lib/availability";
import {
  ANYTIME_END,
  ANYTIME_START,
  serializeStructuredAvailability,
} from "@/lib/availability";
import type { DayOfWeek, ExceptionDate, TimeOfDay } from "@/lib/types";

const DAY_OPTIONS: { id: DayOfWeek; label: string; initial: string }[] = [
  { id: "monday", label: "Monday", initial: "M" },
  { id: "tuesday", label: "Tuesday", initial: "T" },
  { id: "wednesday", label: "Wednesday", initial: "W" },
  { id: "thursday", label: "Thursday", initial: "Th" },
  { id: "friday", label: "Friday", initial: "F" },
  { id: "saturday", label: "Saturday", initial: "S" },
  { id: "sunday", label: "Sunday", initial: "S" },
];

const DEFAULT_RANGE: StructuredTimeRange = {
  start: { hour: 9, minute: 0 },
  end: { hour: 17, minute: 0 },
};

function cloneRanges(ranges: StructuredTimeRange[]): StructuredTimeRange[] {
  return ranges.map((tr) => ({
    start: { ...tr.start },
    end: { ...tr.end },
    label: tr.label,
  }));
}

function cloneStructured(
  structured: StructuredAvailability
): StructuredAvailability {
  return {
    days: [...structured.days],
    timeRanges: structured.timeRanges.map((tr) => ({
      start: { ...tr.start },
      end: { ...tr.end },
      label: tr.label,
    })),
    exceptions: structured.exceptions.map((ex) => ({ ...ex })),
    excludedDays: [...structured.excludedDays],
    windows: structured.windows.map((w) => ({
      days: [...w.days],
      timeRanges: w.timeRanges.map((tr) => ({
        start: { ...tr.start },
        end: { ...tr.end },
        label: tr.label,
      })),
    })),
  };
}

function timeToInput(t: TimeOfDay): string {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

function inputToTime(value: string): TimeOfDay {
  const [hourRaw, minuteRaw] = value.split(":");
  return {
    hour: Number(hourRaw) || 0,
    minute: Number(minuteRaw) || 0,
  };
}

function rangeKey(ranges: StructuredTimeRange[]): string {
  return JSON.stringify(
    ranges.map((tr) => ({
      sh: tr.start.hour,
      sm: tr.start.minute,
      eh: tr.end.hour,
      em: tr.end.minute,
    }))
  );
}

function toDayRanges(
  structured: StructuredAvailability
): Record<DayOfWeek, StructuredTimeRange[]> {
  const next: Record<DayOfWeek, StructuredTimeRange[]> = {
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
  };
  const excluded = new Set(structured.excludedDays);

  for (const window of structured.windows) {
    const ranges =
      window.timeRanges.length > 0
        ? cloneRanges(window.timeRanges)
        : [
            {
              start: { ...ANYTIME_START },
              end: { ...ANYTIME_END },
              label: "Anytime",
            },
          ];
    for (const day of window.days) {
      if (excluded.has(day)) continue;
      next[day].push(...cloneRanges(ranges));
    }
  }

  return next;
}

function fromDayRanges(
  dayRanges: Record<DayOfWeek, StructuredTimeRange[]>,
  exceptions: ExceptionDate[]
): StructuredAvailability {
  const groups = new Map<string, StructuredTimeRange[]>();
  const daysByKey = new Map<string, DayOfWeek[]>();

  for (const day of DAY_OPTIONS.map((d) => d.id)) {
    const ranges = dayRanges[day];
    if (ranges.length === 0) continue;
    const key = rangeKey(ranges);
    if (!groups.has(key)) {
      groups.set(key, cloneRanges(ranges));
      daysByKey.set(key, []);
    }
    daysByKey.get(key)?.push(day);
  }

  const windows = [...groups.entries()].map(([key, timeRanges]) => ({
    days: daysByKey.get(key) ?? [],
    timeRanges,
  }));

  const days = DAY_OPTIONS.map((d) => d.id).filter(
    (day) => dayRanges[day].length > 0
  );

  return {
    days,
    timeRanges: windows.flatMap((w) => w.timeRanges),
    exceptions: [...exceptions],
    excludedDays: [],
    windows,
  };
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink"
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 5v6M5 8h6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.5 3.5l7 7M10.5 3.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <rect
        x="5"
        y="3.5"
        width="7"
        height="8.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 5.5H3A1.2 1.2 0 0 0 1.8 6.7v6.1A1.2 1.2 0 0 0 3 14h6.1A1.2 1.2 0 0 0 10.3 12.8V12"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function TimeField({
  value,
  onChange,
}: {
  value: TimeOfDay;
  onChange: (next: TimeOfDay) => void;
}) {
  return (
    <input
      type="time"
      value={timeToInput(value)}
      onChange={(e) => onChange(inputToTime(e.target.value))}
      className="min-w-[6.5rem] rounded-lg border-0 bg-ink/[0.07] px-2.5 py-1.5 text-sm text-ink outline-none ring-ocean/30 focus:ring-2"
    />
  );
}

function WeeklyHoursEditor({
  dayRanges,
  onChange,
}: {
  dayRanges: Record<DayOfWeek, StructuredTimeRange[]>;
  onChange: (next: Record<DayOfWeek, StructuredTimeRange[]>) => void;
}) {
  const [copyingFrom, setCopyingFrom] = useState<DayOfWeek | null>(null);
  const [copyTargets, setCopyTargets] = useState<DayOfWeek[]>([]);

  function setDay(day: DayOfWeek, ranges: StructuredTimeRange[]) {
    onChange({ ...dayRanges, [day]: ranges });
  }

  function addRange(day: DayOfWeek) {
    setDay(day, [...dayRanges[day], { ...DEFAULT_RANGE, start: { ...DEFAULT_RANGE.start }, end: { ...DEFAULT_RANGE.end } }]);
  }

  function updateRange(
    day: DayOfWeek,
    index: number,
    patch: Partial<StructuredTimeRange>
  ) {
    setDay(
      day,
      dayRanges[day].map((range, i) =>
        i === index
          ? {
              ...range,
              ...patch,
              label: undefined,
            }
          : range
      )
    );
  }

  function removeRange(day: DayOfWeek, index: number) {
    setDay(
      day,
      dayRanges[day].filter((_, i) => i !== index)
    );
  }

  function openCopy(day: DayOfWeek) {
    if (copyingFrom === day) {
      setCopyingFrom(null);
      return;
    }
    setCopyingFrom(day);
    setCopyTargets(
      DAY_OPTIONS.map((d) => d.id).filter((id) => id !== day)
    );
  }

  function applyCopy() {
    if (!copyingFrom) return;
    const source = cloneRanges(dayRanges[copyingFrom]);
    const next = { ...dayRanges };
    for (const day of copyTargets) next[day] = cloneRanges(source);
    onChange(next);
    setCopyingFrom(null);
  }

  return (
    <ul className="divide-y divide-ink/10">
      {DAY_OPTIONS.map((day) => {
        const ranges = dayRanges[day.id];
        const available = ranges.length > 0;

        return (
          <li key={day.id} className="py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-deep text-xs font-medium text-paper"
                aria-hidden
              >
                {day.initial}
              </span>
              <span className="sr-only">{day.label}</span>

              {!available ? (
                <div className="flex min-h-8 flex-1 items-center justify-between gap-2">
                  <p className="text-sm text-ink-soft">Unavailable</p>
                  <IconButton
                    label={`Add hours on ${day.label}`}
                    onClick={() => addRange(day.id)}
                  >
                    <PlusIcon />
                  </IconButton>
                </div>
              ) : (
                <div className="min-w-0 flex-1 space-y-2">
                  {ranges.map((range, index) => (
                    <div
                      key={`${day.id}-${index}`}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <TimeField
                        value={range.start}
                        onChange={(start) =>
                          updateRange(day.id, index, { start })
                        }
                      />
                      <span className="text-ink-soft">–</span>
                      <TimeField
                        value={range.end}
                        onChange={(end) => updateRange(day.id, index, { end })}
                      />
                      <IconButton
                        label={`Remove hours on ${day.label}`}
                        onClick={() => removeRange(day.id, index)}
                      >
                        <CloseIcon />
                      </IconButton>
                      {index === 0 ? (
                        <>
                          <IconButton
                            label={`Add another range on ${day.label}`}
                            onClick={() => addRange(day.id)}
                          >
                            <PlusIcon />
                          </IconButton>
                          <IconButton
                            label={`Copy ${day.label} hours to other days`}
                            onClick={() => openCopy(day.id)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </>
                      ) : null}
                    </div>
                  ))}
                  {copyingFrom === day.id ? (
                    <div className="rounded-lg border border-ink/10 bg-white px-2.5 py-2">
                      <p className="text-xs font-medium text-ink">
                        Copy to other days
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {DAY_OPTIONS.filter((d) => d.id !== day.id).map((d) => {
                          const checked = copyTargets.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              aria-pressed={checked}
                              onClick={() =>
                                setCopyTargets((prev) =>
                                  checked
                                    ? prev.filter((id) => id !== d.id)
                                    : [...prev, d.id]
                                )
                              }
                              className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                                checked
                                  ? "bg-ocean-deep text-paper"
                                  : "bg-ink/[0.06] text-ink-soft hover:text-ink"
                              }`}
                            >
                              {d.initial === "Th" ? "Th" : d.initial}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="text-xs font-medium text-ocean hover:text-ocean-deep"
                          onClick={applyCopy}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="text-xs text-ink-soft hover:text-ink"
                          onClick={() => setCopyingFrom(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AvailabilityInterpretation({
  parsed,
  onChangeAvailability,
}: {
  parsed: ParsedAvailability;
  onChangeAvailability: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [dayRanges, setDayRanges] = useState(() =>
    toDayRanges(parsed.structured)
  );
  const [exceptions, setExceptions] = useState(() =>
    parsed.structured.exceptions.map((ex) => ({ ...ex }))
  );

  const previewStructured = useMemo(
    () => cloneStructured(parsed.structured),
    [parsed.structured]
  );

  if (parsed.debugLines.length === 0 && parsed.understood) return null;

  if (editing) {
    return (
      <div className="rounded-xl border border-ocean/20 bg-ocean/5 px-5 py-5">
        <p className="text-sm font-medium text-ink">Adjust availability</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          Set when you are typically available
        </p>
        <div className="mt-4">
          <WeeklyHoursEditor dayRanges={dayRanges} onChange={setDayRanges} />

          {exceptions.length > 0 ? (
            <div className="mt-3 space-y-1.5 border-t border-ocean/15 pt-3">
              <p className="text-xs font-medium text-ink-soft">Date notes</p>
              <ul className="space-y-1">
                {exceptions.map((ex, index) => (
                  <li
                    key={`${ex.date}-${index}`}
                    className="flex items-center justify-between gap-2 text-sm text-ink"
                  >
                    <span>
                      {ex.type === "unavailable" ? "Not available" : "Available"}
                      : {ex.label}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-ink-soft hover:text-ink"
                      onClick={() =>
                        setExceptions((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-ink/10 bg-white/70 px-3.5 py-2 text-sm text-ink-soft transition hover:bg-white hover:text-ink"
            onClick={() => {
              setDayRanges(toDayRanges(previewStructured));
              setExceptions(previewStructured.exceptions.map((ex) => ({ ...ex })));
              setEditing(false);
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-ocean px-3.5 py-2 text-sm font-medium text-paper transition hover:bg-ocean-deep"
            onClick={() => {
              const text = serializeStructuredAvailability(
                fromDayRanges(dayRanges, exceptions)
              );
              onChangeAvailability(text);
              setEditing(false);
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDayRanges(toDayRanges(parsed.structured));
        setExceptions(parsed.structured.exceptions.map((ex) => ({ ...ex })));
        setEditing(true);
      }}
      className="relative w-full rounded-xl border border-ocean/20 bg-ocean/5 px-3 py-2.5 pr-20 text-left transition hover:border-ocean/35 hover:bg-ocean/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/30"
      aria-label={
        parsed.understood ? "Adjust availability" : "Add availability manually"
      }
    >
      <span className="absolute right-2.5 top-2.5 text-xs text-ink">
        Click to edit
      </span>
      {parsed.understood ? (
        <>
          <p className="text-sm font-medium text-ink">{parsed.summary}</p>
          <ul className="mt-1.5 space-y-1">
            {parsed.debugLines.map((line) => (
              <li key={line} className="text-sm text-ink">
                <span className="text-ocean" aria-hidden>
                  ✓{" "}
                </span>
                {line}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-ink">
          I don&apos;t understand that. Click this box to add your availability
          manually.
        </p>
      )}
    </button>
  );
}
