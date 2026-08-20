import { DateTime } from "luxon";
import type { MeetingSlot, Participant } from "./types";

export interface CalendarTimezoneOption {
  timezone: string;
  cityLabel: string;
  offsetLabel: string;
}

/** Unique IANA timezones from invite participants and recommended slot cities. */
export function uniqueParticipantTimezones(
  participants: Participant[],
  slots: MeetingSlot[] = []
): CalendarTimezoneOption[] {
  const byTimezone = new Map<string, CalendarTimezoneOption>();

  const add = (timezone: string | undefined, cityLabel: string | undefined) => {
    const tz = timezone?.trim();
    if (!tz || byTimezone.has(tz)) return;
    const now = DateTime.now().setZone(tz);
    if (!now.isValid) return;
    byTimezone.set(tz, {
      timezone: tz,
      cityLabel: cityLabel?.trim() || tz,
      offsetLabel: now.toFormat("ZZZZ"),
    });
  };

  for (const p of participants) {
    add(p.timezone, p.cityLabel);
  }
  for (const slot of slots) {
    for (const lt of slot.localTimes ?? []) {
      add(lt.timezone, lt.cityLabel);
    }
  }

  return [...byTimezone.values()].sort((a, b) =>
    a.cityLabel.localeCompare(b.cityLabel)
  );
}

/** Slots that fall on a local calendar date in the display timezone. */
export function slotsOnLocalDate(
  slots: MeetingSlot[],
  dateKey: string,
  timezone: string
): MeetingSlot[] {
  return slots.filter((slot) => {
    const key = DateTime.fromISO(slot.startUtc, { zone: "utc" })
      .setZone(timezone)
      .toISODate();
    return key === dateKey;
  });
}

export interface CalendarDayColumn {
  dateKey: string;
  weekdayShort: string;
  dayNum: number;
  hasSlots: boolean;
}

export interface CalendarWeek {
  weekKey: string;
  start: DateTime;
  end: DateTime;
  days: CalendarDayColumn[];
}

/**
 * This week plus the next few weeks in the display zone (Mon–Sun),
 * with hasSlots marked from recommended slots.
 */
export function upcomingWeeks(
  slots: MeetingSlot[],
  timezone: string,
  weekCount = 4
): CalendarWeek[] {
  const dateKeys = new Set<string>();
  for (const slot of slots) {
    const dt = DateTime.fromISO(slot.startUtc, { zone: "utc" }).setZone(
      timezone
    );
    const key = dt.toISODate();
    if (key) dateKeys.add(key);
  }

  const origin = DateTime.now().setZone(timezone).startOf("week");
  const weeks: CalendarWeek[] = [];

  for (let i = 0; i < weekCount; i++) {
    const start = origin.plus({ weeks: i });
    const weekKey = start.toISODate()!;
    const days: CalendarDayColumn[] = [];
    for (let d = 0; d < 7; d++) {
      const day = start.plus({ days: d });
      const dateKey = day.toISODate()!;
      days.push({
        dateKey,
        weekdayShort: day.toFormat("ccc").toUpperCase(),
        dayNum: day.day,
        hasSlots: dateKeys.has(dateKey),
      });
    }
    weeks.push({
      weekKey,
      start,
      end: start.plus({ days: 6 }).endOf("day"),
      days,
    });
  }

  return weeks;
}

/** Relative label for a week offset from the current week (0 = this week). */
export function weekOffsetLabel(offset: number): string {
  if (offset <= 0) return "This week";
  if (offset === 1) return "Next week";
  return `In ${offset} weeks`;
}

/**
 * Weeks (Mon–Sun in display zone) that contain at least one recommended slot.
 * @deprecated Prefer upcomingWeeks for the calendar navigator.
 */
export function weeksWithAvailability(
  slots: MeetingSlot[],
  timezone: string
): CalendarWeek[] {
  const dateKeys = new Set<string>();
  for (const slot of slots) {
    const dt = DateTime.fromISO(slot.startUtc, { zone: "utc" }).setZone(timezone);
    const key = dt.toISODate();
    if (key) dateKeys.add(key);
  }
  if (dateKeys.size === 0) return [];

  const weekMap = new Map<string, CalendarWeek>();
  for (const key of [...dateKeys].sort()) {
    const day = DateTime.fromISO(key, { zone: timezone });
    if (!day.isValid) continue;
    const start = day.startOf("week"); // Monday
    const weekKey = start.toISODate()!;
    if (weekMap.has(weekKey)) continue;

    const days: CalendarDayColumn[] = [];
    for (let i = 0; i < 7; i++) {
      const d = start.plus({ days: i });
      const dateKey = d.toISODate()!;
      days.push({
        dateKey,
        weekdayShort: d.toFormat("ccc").toUpperCase(),
        dayNum: d.day,
        hasSlots: dateKeys.has(dateKey),
      });
    }

    weekMap.set(weekKey, {
      weekKey,
      start,
      end: start.plus({ days: 6 }).endOf("day"),
      days,
    });
  }

  return [...weekMap.values()].sort((a, b) =>
    a.weekKey.localeCompare(b.weekKey)
  );
}

export function slotsInWeek(
  slots: MeetingSlot[],
  week: CalendarWeek,
  timezone: string
): MeetingSlot[] {
  return slots.filter((slot) => {
    const dt = DateTime.fromISO(slot.startUtc, { zone: "utc" }).setZone(timezone);
    const key = dt.toISODate();
    return Boolean(key && week.days.some((d) => d.dateKey === key));
  });
}

export type DayPart = "morning" | "afternoon" | "evening";

export const DAY_PARTS: { id: DayPart; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

/** Morning before noon, afternoon until 5 PM, evening from 5 PM. */
export function dayPartForHour(hour: number): DayPart {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function slotDayPart(
  slot: MeetingSlot,
  timezone: string
): DayPart {
  const hour = DateTime.fromISO(slot.startUtc, { zone: "utc" })
    .setZone(timezone)
    .hour;
  return dayPartForHour(hour);
}

export function slotTimeLabel(
  slot: MeetingSlot,
  timezone: string
): string {
  return DateTime.fromISO(slot.startUtc, { zone: "utc" })
    .setZone(timezone)
    .toFormat("h:mm a");
}

export function slotsForDayAndPart(
  slots: MeetingSlot[],
  dateKey: string,
  part: DayPart,
  timezone: string
): MeetingSlot[] {
  return slots
    .filter((slot) => {
      const dt = DateTime.fromISO(slot.startUtc, { zone: "utc" }).setZone(
        timezone
      );
      return dt.toISODate() === dateKey && dayPartForHour(dt.hour) === part;
    })
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

/** Parts that have at least one slot in the given week. */
export function activeDayParts(
  slots: MeetingSlot[],
  timezone: string
): DayPart[] {
  const present = new Set<DayPart>();
  for (const slot of slots) {
    present.add(slotDayPart(slot, timezone));
  }
  return DAY_PARTS.map((p) => p.id).filter((id) => present.has(id));
}
