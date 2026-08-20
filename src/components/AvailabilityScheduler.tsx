"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DateTime } from "luxon";
import { TimeSlotCard } from "@/components/TimeSlotCard";
import {
  activeDayParts,
  DAY_PARTS,
  slotsForDayAndPart,
  slotsInWeek,
  slotTimeLabel,
  uniqueParticipantTimezones,
  upcomingWeeks,
  weekOffsetLabel,
  type CalendarTimezoneOption,
  type CalendarWeek,
  type DayPart,
} from "@/lib/availability-calendar";
import { isPerfectOverlap } from "@/lib/scheduler";
import type { MeetingSlot, Participant } from "@/lib/types";

function NavArrowIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="h-4 w-4"
    >
      {direction === "prev" ? (
        <path
          d="M15 5L8 12l7 7"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M9 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function TimezoneMenu({
  options,
  value,
  onChange,
}: {
  options: CalendarTimezoneOption[];
  value: string;
  onChange: (timezone: string) => void;
}) {
  if (options.length === 0) return null;

  const selected =
    options.find((o) => o.timezone === value)?.timezone ?? options[0]!.timezone;

  return (
    <label className="relative inline-flex min-w-0 max-w-full items-center">
      <span className="sr-only">Show times in</span>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full appearance-none rounded-lg border border-ink/10 bg-paper/80 py-1.5 pr-8 pl-2.5 text-sm text-ink transition hover:border-ink/20 focus:border-ocean/40 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.timezone} value={opt.timezone}>
            {opt.cityLabel} ({opt.offsetLabel})
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-soft"
        aria-hidden
      >
        ▾
      </span>
    </label>
  );
}

function SlotChip({
  slot,
  timezone,
  selected,
  best,
  onSelect,
}: {
  slot: MeetingSlot;
  timezone: string;
  selected: boolean;
  best: boolean;
  onSelect: () => void;
}) {
  const label = slotTimeLabel(slot, timezone);
  const perfect = isPerfectOverlap(slot);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={label}
      className={`w-full rounded-md px-1.5 py-1.5 text-left transition ${
        selected
          ? "bg-ocean-deep text-white shadow-md ring-2 ring-ocean/40"
          : best
            ? "bg-ocean text-white shadow-sm hover:brightness-105"
            : "bg-sky/70 text-ink hover:bg-sky"
      }`}
    >
      {best ? (
        <span className="block text-[9px] font-medium uppercase tracking-[0.12em] opacity-90">
          {perfect ? "Best" : "Best avail."}
        </span>
      ) : null}
      <span className="block truncate text-[11px] font-medium leading-tight sm:text-xs">
        {label}
      </span>
    </button>
  );
}

function CalendarGrid({
  week,
  weekSlots,
  timezone,
  selectedSlotId,
  bestSlotId,
  onSelectSlot,
}: {
  week: CalendarWeek;
  weekSlots: MeetingSlot[];
  timezone: string;
  selectedSlotId?: string;
  bestSlotId?: string;
  onSelectSlot: (slot: MeetingSlot) => void;
}) {
  const parts = useMemo(
    () => activeDayParts(weekSlots, timezone),
    [weekSlots, timezone]
  );

  const selectedDateKey = useMemo(() => {
    if (!selectedSlotId) return week.days.find((d) => d.hasSlots)?.dateKey;
    const slot = weekSlots.find((s) => s.id === selectedSlotId);
    if (!slot) return week.days.find((d) => d.hasSlots)?.dateKey;
    return DateTime.fromISO(slot.startUtc, { zone: "utc" })
      .setZone(timezone)
      .toISODate();
  }, [selectedSlotId, weekSlots, week.days, timezone]);

  const visibleDays = week.days.filter((d) => d.hasSlots);
  const columns = visibleDays;
  const rows: DayPart[] =
    parts.length > 0 ? parts : ["morning", "afternoon", "evening"];

  if (columns.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-soft">
        No available times in this week. Try another week.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-0">
        <div
          className="grid border-b border-ink/10"
          style={{
            gridTemplateColumns: `4.5rem repeat(${columns.length}, minmax(0, 1fr))`,
          }}
        >
          <div aria-hidden />
          {columns.map((day) => {
            const isSelected = day.dateKey === selectedDateKey;
            return (
              <div key={day.dateKey} className="px-1 pb-2 pt-1 text-center">
                <p
                  className={`text-[10px] font-medium uppercase tracking-[0.14em] ${
                    isSelected ? "text-ocean" : "text-ink-soft"
                  }`}
                >
                  {day.weekdayShort}
                </p>
                <p
                  className={`mt-0.5 font-display text-lg leading-none ${
                    isSelected ? "text-ocean-deep" : "text-ink"
                  }`}
                >
                  {day.dayNum}
                </p>
              </div>
            );
          })}
        </div>

        <div className="divide-y divide-ink/[0.06]">
          {rows.map((partId) => {
            const partMeta = DAY_PARTS.find((p) => p.id === partId)!;
            return (
              <div
                key={partId}
                className="grid"
                style={{
                  gridTemplateColumns: `4.5rem repeat(${columns.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="flex items-start pt-3 pr-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                    {partMeta.label}
                  </p>
                </div>
                {columns.map((day) => {
                  const daySlots = slotsForDayAndPart(
                    weekSlots,
                    day.dateKey,
                    partId,
                    timezone
                  );
                  return (
                    <div
                      key={`${day.dateKey}-${partId}`}
                      className={`min-h-[3rem] space-y-1.5 border-l border-ink/[0.06] p-1.5 ${
                        day.dateKey === selectedDateKey ? "bg-ocean/[0.04]" : ""
                      }`}
                    >
                      {daySlots.map((slot) => (
                        <SlotChip
                          key={slot.id}
                          slot={slot}
                          timezone={timezone}
                          selected={slot.id === selectedSlotId}
                          best={slot.id === bestSlotId}
                          onSelect={() => onSelectSlot(slot)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AvailabilityScheduler({
  slots,
  recommendationBestId,
  participants,
  selectedSlotId,
  onSelectSlot,
}: {
  /** Calendar slots (may include week projections). */
  slots: MeetingSlot[];
  /** Id of the top recommendation (for Best badge). */
  recommendationBestId?: string;
  participants: Participant[];
  selectedSlotId?: string;
  onSelectSlot: (slot: MeetingSlot) => void;
}) {
  const timezoneOptions = useMemo(
    () => uniqueParticipantTimezones(participants, slots),
    [participants, slots]
  );
  const defaultZone =
    timezoneOptions[0]?.timezone ??
    participants[0]?.timezone ??
    "UTC";

  const [timezone, setTimezone] = useState(defaultZone);
  const weeks = useMemo(
    () => upcomingWeeks(slots, timezone, 4),
    [slots, timezone]
  );

  const selectedWeekIndex = useMemo(() => {
    if (weeks.length === 0) return 0;
    if (!selectedSlotId) return 0;
    const idx = weeks.findIndex((week) =>
      slotsInWeek(slots, week, timezone).some((s) => s.id === selectedSlotId)
    );
    return idx >= 0 ? idx : 0;
  }, [weeks, slots, timezone, selectedSlotId]);

  const [weekIndex, setWeekIndex] = useState(selectedWeekIndex);

  useEffect(() => {
    setWeekIndex(selectedWeekIndex);
  }, [selectedWeekIndex, timezone]);

  useEffect(() => {
    if (
      timezoneOptions.length > 0 &&
      !timezoneOptions.some((o) => o.timezone === timezone)
    ) {
      setTimezone(timezoneOptions[0]!.timezone);
    }
  }, [timezoneOptions, timezone]);

  const week = weeks[Math.min(weekIndex, Math.max(weeks.length - 1, 0))];
  const weekSlots = useMemo(
    () => (week ? slotsInWeek(slots, week, timezone) : []),
    [slots, week, timezone]
  );

  const bestSlotId = recommendationBestId ?? slots[0]?.id;
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const [focusedSlotId, setFocusedSlotId] = useState<string | undefined>(
    selectedSlotId ?? recommendationBestId ?? slots[0]?.id
  );

  useEffect(() => {
    if (selectedSlotId) setFocusedSlotId(selectedSlotId);
  }, [selectedSlotId]);

  useEffect(() => {
    if (
      focusedSlotId &&
      slots.some((s) => s.id === focusedSlotId)
    ) {
      return;
    }
    setFocusedSlotId(selectedSlotId ?? slots[0]?.id);
  }, [slots, focusedSlotId, selectedSlotId]);

  const focusSlot = useCallback((slot: MeetingSlot) => {
    setFocusedSlotId(slot.id);
    requestAnimationFrame(() => {
      cardRefs.current.get(slot.id)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, []);

  const focusedSlot =
    slots.find((s) => s.id === focusedSlotId) ??
    slots.find((s) => s.id === selectedSlotId) ??
    slots.find((s) => s.id === recommendationBestId) ??
    slots[0];

  if (!week || slots.length === 0 || !focusedSlot) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_12px_32px_rgba(31,79,92,0.06)]">
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)] lg:items-start">
        <div className="min-w-0 border-b border-ink/10 p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="shrink-0 text-sm text-ink-soft">Timezone</span>
              <TimezoneMenu
                options={timezoneOptions}
                value={timezone}
                onChange={setTimezone}
              />
            </div>

            <div className="flex items-center sm:justify-end">
              <button
                type="button"
                className="inline-flex h-8 w-7 items-center justify-center rounded-md text-ink transition hover:bg-ink/[0.06] disabled:opacity-30"
                disabled={weekIndex <= 0}
                onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
                aria-label="Previous week"
              >
                <NavArrowIcon direction="prev" />
              </button>
              <p className="px-0.5 text-center text-sm font-medium text-ink">
                {weekOffsetLabel(weekIndex)}
              </p>
              <button
                type="button"
                className="inline-flex h-8 w-7 items-center justify-center rounded-md text-ink transition hover:bg-ink/[0.06] disabled:opacity-30"
                disabled={weekIndex >= weeks.length - 1}
                onClick={() =>
                  setWeekIndex((i) => Math.min(weeks.length - 1, i + 1))
                }
                aria-label="Next week"
              >
                <NavArrowIcon direction="next" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <CalendarGrid
              week={week}
              weekSlots={weekSlots}
              timezone={timezone}
              selectedSlotId={focusedSlotId}
              bestSlotId={bestSlotId}
              onSelectSlot={focusSlot}
            />
          </div>
        </div>

        <div className="bg-paper/40 p-4 sm:p-5">
          <TimeSlotCard
            slot={focusedSlot}
            featured={focusedSlot.id === bestSlotId}
            selected={selectedSlotId === focusedSlot.id}
            onSelect={() => {
              setFocusedSlotId(focusedSlot.id);
              onSelectSlot(focusedSlot);
              const idx = weeks.findIndex((w) =>
                slotsInWeek(slots, w, timezone).some(
                  (s) => s.id === focusedSlot.id
                )
              );
              if (idx >= 0) setWeekIndex(idx);
            }}
            cardRef={(node) => {
              if (node) cardRefs.current.set(focusedSlot.id, node);
              else cardRefs.current.delete(focusedSlot.id);
            }}
          />
        </div>
      </div>
    </div>
  );
}
