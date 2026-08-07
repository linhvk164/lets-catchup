"use client";

import { useState } from "react";
import type {
  ParsedAvailability,
  StructuredAvailability,
  StructuredTimeRange,
  StructuredWindow,
} from "@/lib/availability";
import {
  ANYTIME_END,
  ANYTIME_START,
  serializeStructuredAvailability,
} from "@/lib/availability";
import type { DayOfWeek, TimeOfDay } from "@/lib/types";
import { Button } from "@/components/ui";

const DAY_OPTIONS: { id: DayOfWeek; label: string }[] = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

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

function toggleDay(days: DayOfWeek[], day: DayOfWeek): DayOfWeek[] {
  return days.includes(day)
    ? days.filter((d) => d !== day)
    : DAY_OPTIONS.map((d) => d.id).filter((d) => days.includes(d) || d === day);
}

function DayToggles({
  days,
  onChange,
  label,
}: {
  days: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {DAY_OPTIONS.map((day) => {
          const active = days.includes(day.id);
          return (
            <button
              key={day.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(toggleDay(days, day.id))}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-ocean text-paper"
                  : "border border-ink/10 bg-white text-ink-soft hover:border-ink/20 hover:text-ink"
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeRangeEditor({
  ranges,
  onChange,
}: {
  ranges: StructuredTimeRange[];
  onChange: (ranges: StructuredTimeRange[]) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink-soft">Times</p>
      {ranges.length === 0 ? (
        <p className="text-xs text-ink-soft">No times — available those days.</p>
      ) : null}
      {ranges.map((range, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <input
            type="time"
            value={timeToInput(range.start)}
            onChange={(e) => {
              const next = ranges.map((r, i) =>
                i === index ? { ...r, start: inputToTime(e.target.value), label: undefined } : r
              );
              onChange(next);
            }}
            className="rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-sm text-ink"
          />
          <span className="text-xs text-ink-soft">to</span>
          <input
            type="time"
            value={timeToInput(range.end)}
            onChange={(e) => {
              const next = ranges.map((r, i) =>
                i === index ? { ...r, end: inputToTime(e.target.value), label: undefined } : r
              );
              onChange(next);
            }}
            className="rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-sm text-ink"
          />
          <button
            type="button"
            className="text-xs text-ink-soft hover:text-ink"
            onClick={() => onChange(ranges.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-xs font-medium text-ocean hover:text-ocean-deep"
        onClick={() =>
          onChange([
            ...ranges,
            {
              start: { ...ANYTIME_START },
              end: { hour: 22, minute: 0 },
            },
          ])
        }
      >
        Add time range
      </button>
      {ranges.length === 0 ? (
        <button
          type="button"
          className="ml-3 text-xs font-medium text-ocean hover:text-ocean-deep"
          onClick={() =>
            onChange([
              {
                start: { ...ANYTIME_START },
                end: { ...ANYTIME_END },
                label: "Anytime",
              },
            ])
          }
        >
          Set anytime
        </button>
      ) : null}
    </div>
  );
}

function WindowEditor({
  window,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  window: StructuredWindow;
  index: number;
  onChange: (window: StructuredWindow) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-3 border-t border-ocean/15 pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink">
          {window.timeRanges.length === 0
            ? "Days"
            : `Schedule${index > 0 ? ` ${index + 1}` : ""}`}
        </p>
        {canRemove ? (
          <button
            type="button"
            className="text-xs text-ink-soft hover:text-ink"
            onClick={onRemove}
          >
            Remove
          </button>
        ) : null}
      </div>
      <DayToggles
        label="Available"
        days={window.days}
        onChange={(days) => onChange({ ...window, days })}
      />
      <TimeRangeEditor
        ranges={window.timeRanges}
        onChange={(timeRanges) => onChange({ ...window, timeRanges })}
      />
    </div>
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
  const [draft, setDraft] = useState(() => cloneStructured(parsed.structured));

  if (parsed.debugLines.length === 0 && parsed.understood) return null;

  if (editing) {
    return (
      <div className="rounded-xl border border-ocean/20 bg-ocean/5 px-3 py-2.5">
        <p className="text-sm font-medium text-ink">Adjust availability</p>
        <div className="mt-3 space-y-3">
          {draft.windows.map((window, index) => (
            <WindowEditor
              key={index}
              window={window}
              index={index}
              canRemove={draft.windows.length > 1}
              onChange={(next) => {
                setDraft((prev) => ({
                  ...prev,
                  windows: prev.windows.map((w, i) => (i === index ? next : w)),
                }));
              }}
              onRemove={() => {
                setDraft((prev) => ({
                  ...prev,
                  windows: prev.windows.filter((_, i) => i !== index),
                }));
              }}
            />
          ))}

          <button
            type="button"
            className="text-xs font-medium text-ocean hover:text-ocean-deep"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                windows: [
                  ...prev.windows,
                  { days: ["monday", "tuesday", "wednesday", "thursday", "friday"], timeRanges: [] },
                ],
              }))
            }
          >
            Add days
          </button>

          <DayToggles
            label="Not available"
            days={draft.excludedDays}
            onChange={(excludedDays) =>
              setDraft((prev) => ({ ...prev, excludedDays }))
            }
          />

          {draft.exceptions.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-ink-soft">Date notes</p>
              <ul className="space-y-1">
                {draft.exceptions.map((ex, index) => (
                  <li
                    key={`${ex.date}-${index}`}
                    className="flex items-center justify-between gap-2 text-sm text-ink"
                  >
                    <span>
                      {ex.type === "unavailable" ? "Not available" : "Available"}:{" "}
                      {ex.label}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-ink-soft hover:text-ink"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          exceptions: prev.exceptions.filter((_, i) => i !== index),
                        }))
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

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            className="flex-1 py-2"
            onClick={() => {
              const text = serializeStructuredAvailability(draft);
              onChangeAvailability(text);
              setEditing(false);
            }}
          >
            Done
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1 py-2"
            onClick={() => {
              setDraft(cloneStructured(parsed.structured));
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(cloneStructured(parsed.structured));
        setEditing(true);
      }}
      className="w-full rounded-xl border border-ocean/20 bg-ocean/5 px-3 py-2.5 text-left transition hover:border-ocean/35 hover:bg-ocean/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean/30"
      aria-label={
        parsed.understood ? "Adjust availability" : "Add availability manually"
      }
    >
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
