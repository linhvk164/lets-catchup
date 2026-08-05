import { DateTime } from "luxon";
import { getAvailabilityWindows } from "./scheduler";
import type { MeetingSlot, Participant } from "./types";

export interface TimelineSegment {
  startPct: number;
  widthPct: number;
}

export interface TimelineParticipantRow {
  participant: Participant;
  segments: TimelineSegment[];
}

export interface TimelineHourMark {
  label: string;
  pct: number;
}

export interface TimelineViewModel {
  windowStart: DateTime;
  windowEnd: DateTime;
  referenceTimezone: string;
  dateLabel: string;
  hours: TimelineHourMark[];
  rows: TimelineParticipantRow[];
  highlight: TimelineSegment | null;
  highlightLabel: string;
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function toSegment(
  start: DateTime,
  end: DateTime,
  windowStart: DateTime,
  rangeMs: number
): TimelineSegment | null {
  const left = ((start.toMillis() - windowStart.toMillis()) / rangeMs) * 100;
  const right = ((end.toMillis() - windowStart.toMillis()) / rangeMs) * 100;
  const startPct = clampPct(left);
  const endPct = clampPct(right);
  const widthPct = endPct - startPct;
  if (widthPct <= 0.15) return null;
  return { startPct, widthPct };
}

/**
 * Build a shared UTC-aligned day view around a recommended slot.
 * Hour labels use the first participant's local timezone for the slot.
 */
export function buildAvailabilityTimeline(
  participants: Participant[],
  slot: MeetingSlot | null
): TimelineViewModel | null {
  if (participants.length === 0) return null;

  const referenceTimezone =
    slot?.localTimes[0]?.timezone ?? participants[0].timezone;

  const anchor = slot
    ? DateTime.fromISO(slot.startUtc, { zone: "utc" }).setZone(referenceTimezone)
    : DateTime.now().setZone(referenceTimezone);

  const dayStart = anchor.startOf("day");
  const windowStart = dayStart.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
  const windowEnd = dayStart.plus({ days: 1 }).set({
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const rangeMs = windowEnd.toMillis() - windowStart.toMillis();
  if (rangeMs <= 0) return null;

  const hours: TimelineHourMark[] = [];
  for (let hour = 6; hour <= 22; hour += 2) {
    const mark = windowStart.set({ hour, minute: 0 });
    hours.push({
      label: mark.toFormat("h a"),
      pct: clampPct(
        ((mark.toMillis() - windowStart.toMillis()) / rangeMs) * 100
      ),
    });
  }

  const rows: TimelineParticipantRow[] = participants.map((participant) => {
    const windows = getAvailabilityWindows(
      participant,
      windowStart.toUTC(),
      windowEnd.toUTC()
    );
    const segments = windows
      .map((w) => {
        const start = w.start < windowStart.toUTC() ? windowStart.toUTC() : w.start;
        const end = w.end > windowEnd.toUTC() ? windowEnd.toUTC() : w.end;
        return toSegment(start, end, windowStart.toUTC(), rangeMs);
      })
      .filter((s): s is TimelineSegment => Boolean(s));
    return { participant, segments };
  });

  let highlight: TimelineSegment | null = null;
  let highlightLabel = "";
  if (slot) {
    const start = DateTime.fromISO(slot.startUtc, { zone: "utc" });
    const end = DateTime.fromISO(slot.endUtc, { zone: "utc" });
    highlight = toSegment(start, end, windowStart.toUTC(), rangeMs);
    const local = start.setZone(referenceTimezone);
    const localEnd = end.setZone(referenceTimezone);
    highlightLabel = `${local.toFormat("h:mm a")} – ${localEnd.toFormat("h:mm a")}`;
  }

  return {
    windowStart,
    windowEnd,
    referenceTimezone,
    dateLabel: anchor.toFormat("cccc, LLLL d"),
    hours,
    rows,
    highlight,
    highlightLabel,
  };
}
