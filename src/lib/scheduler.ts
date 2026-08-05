import { DateTime, Interval } from "luxon";
import { hourInWindow, isFullDayRule } from "./availability";
import type {
  AvailabilityRule,
  CatchUp,
  DayOfWeek,
  MeetingSlot,
  Participant,
  TimeOfDay,
} from "./types";
import { formatLocalTime, formatSlotDate, localHour } from "./timezone";

const DAY_NAMES: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const SEARCH_DAYS = 14;
const SLOT_STEP_MINUTES = 15;

interface UtcWindow {
  start: DateTime;
  end: DateTime;
}

export type AvailabilityWindow = UtcWindow;

function toMinutes(t: TimeOfDay): number {
  return t.hour * 60 + t.minute;
}

function dayName(dt: DateTime): DayOfWeek {
  // Luxon: 1 = Monday ... 7 = Sunday
  return DAY_NAMES[dt.weekday - 1];
}

function defaultEnd(rule: AvailabilityRule): TimeOfDay {
  if (isFullDayRule(rule)) return { hour: 0, minute: 0 };
  switch (rule.kind) {
    case "mornings":
      return rule.end ?? { hour: 12, minute: 0 };
    case "afternoons":
      return rule.end ?? { hour: 17, minute: 0 };
    case "evenings":
      return rule.end ?? { hour: 22, minute: 0 };
    case "nights":
      return rule.end ?? { hour: 2, minute: 0 };
    case "broad":
      return rule.end ?? { hour: 22, minute: 0 };
    default:
      return rule.end ?? { hour: 22, minute: 0 };
  }
}

function defaultStart(rule: AvailabilityRule): TimeOfDay {
  if (isFullDayRule(rule)) return { hour: 0, minute: 0 };
  switch (rule.kind) {
    case "mornings":
      return rule.start ?? { hour: 6, minute: 0 };
    case "afternoons":
      return rule.start ?? { hour: 12, minute: 0 };
    case "evenings":
      return rule.start ?? { hour: 17, minute: 0 };
    case "nights":
      return rule.start ?? { hour: 20, minute: 0 };
    case "broad":
      return rule.start ?? { hour: 8, minute: 0 };
    default:
      return rule.start ?? { hour: 9, minute: 0 };
  }
}

function ruleAppliesToDay(rule: AvailabilityRule, day: DayOfWeek): boolean {
  if (rule.days && rule.days.length > 0) {
    return rule.days.includes(day);
  }

  switch (rule.kind) {
    case "weekdays_after":
      return ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day);
    case "weekends_anytime":
      return day === "saturday" || day === "sunday";
    case "fully_flexible":
    case "anytime":
    case "broad":
    case "all_day":
    case "after_time":
    case "between_times":
    case "mornings":
    case "afternoons":
    case "evenings":
    case "nights":
      return true;
    case "specific_days":
      return false;
    default:
      return true;
  }
}

function windowsForParticipantDay(
  participant: Participant,
  localDay: DateTime
): UtcWindow[] {
  const dateKey = localDay.toISODate();
  if (!dateKey) return [];

  const exception = participant.exceptions.find((e) => e.date === dateKey);
  if (exception?.type === "unavailable") return [];

  if (exception?.type === "free_all_day") {
    const start = localDay.startOf("day");
    const end = localDay.plus({ days: 1 }).startOf("day");
    return [{ start: start.toUTC(), end: end.toUTC() }];
  }

  const day = dayName(localDay);
  const windows: UtcWindow[] = [];

  for (const rule of participant.rules) {
    if (!ruleAppliesToDay(rule, day)) continue;

    if (isFullDayRule(rule)) {
      const start = localDay.startOf("day");
      const end = localDay.plus({ days: 1 }).startOf("day");
      windows.push({ start: start.toUTC(), end: end.toUTC() });
      continue;
    }

    const startTod = defaultStart(rule);
    const endTod = defaultEnd(rule);
    let start = localDay.set({
      hour: startTod.hour,
      minute: startTod.minute,
      second: 0,
      millisecond: 0,
    });
    let end = localDay.set({
      hour: endTod.hour,
      minute: endTod.minute,
      second: 0,
      millisecond: 0,
    });

    // Overnight window (e.g. 20:00–02:00) or full-day 00:00–00:00
    if (toMinutes(endTod) <= toMinutes(startTod)) {
      end = end.plus({ days: 1 });
    }

    if (end <= start) continue;
    windows.push({ start: start.toUTC(), end: end.toUTC() });
  }

  return mergeWindows(windows);
}

function mergeWindows(windows: UtcWindow[]): UtcWindow[] {
  if (windows.length === 0) return [];
  const sorted = [...windows].sort((a, b) => a.start.toMillis() - b.start.toMillis());
  const merged: UtcWindow[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = current.end > last.end ? current.end : last.end;
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

function intersectWindows(a: UtcWindow[], b: UtcWindow[]): UtcWindow[] {
  const result: UtcWindow[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    const start = a[i].start > b[j].start ? a[i].start : b[j].start;
    const end = a[i].end < b[j].end ? a[i].end : b[j].end;
    if (start < end) {
      result.push({ start, end });
    }
    if (a[i].end < b[j].end) i += 1;
    else j += 1;
  }

  return result;
}

/** UTC availability windows for a participant within a range. */
export function getAvailabilityWindows(
  participant: Participant,
  fromUtc: DateTime,
  toUtc: DateTime
): UtcWindow[] {
  return participantWindows(participant, fromUtc, toUtc);
}

function participantWindows(
  participant: Participant,
  fromUtc: DateTime,
  toUtc: DateTime
): UtcWindow[] {
  const zone = participant.timezone;
  let cursor = fromUtc.setZone(zone).startOf("day");
  const endLocal = toUtc.setZone(zone).endOf("day");
  const windows: UtcWindow[] = [];

  while (cursor <= endLocal) {
    windows.push(...windowsForParticipantDay(participant, cursor));
    cursor = cursor.plus({ days: 1 });
  }

  return mergeWindows(windows).filter(
    (w) => w.end > fromUtc && w.start < toUtc
  );
}

function prefersHour(participant: Participant, hour: number, minute: number): boolean {
  const prefs = participant.preferences ?? [];
  if (prefs.length === 0) return false;
  return prefs.some((pref) => hourInWindow(hour, minute, pref.start, pref.end));
}

function scoreSlot(startUtc: DateTime, participants: Participant[]): number {
  let score = 100;
  const startIso = startUtc.toISO()!;

  for (const p of participants) {
    const hour = localHour(startIso, p.timezone);
    const minute = DateTime.fromISO(startIso, { zone: "utc" }).setZone(p.timezone)
      .minute;
    const flexible = p.flexibility === "high";

    // Comfort bands for local time
    if (hour >= 8 && hour < 22) score += 14;
    else if (hour >= 6 && hour < 8) score += 2;
    else if (hour >= 22 && hour < 24) score -= flexible ? 4 : 12;
    else score -= flexible ? 18 : 40; // 00:00–06:00 last resort

    // Soft preference boost / miss
    if ((p.preferences?.length ?? 0) > 0) {
      if (prefersHour(p, hour, minute)) score += 22;
      else score -= 10;
    }

    // Mild working-hours drag when someone prefers evenings
    const prefersEvenings = (p.preferences ?? []).some(
      (pref) => pref.start.hour >= 17 || pref.label === "evenings"
    );
    if (prefersEvenings && hour >= 9 && hour < 17) score -= 6;

    // Flexible people: don't over-penalize unusual hours
    if (flexible && (hour < 7 || hour >= 23)) score += 10;
  }

  // Prefer sooner dates slightly
  const daysOut = startUtc.diff(DateTime.utc(), "days").days;
  score -= daysOut * 0.5;

  return score;
}

function isTooHarshForParticipant(participant: Participant, startIso: string): boolean {
  const hour = localHour(startIso, participant.timezone);
  // Fully flexible people can meet any hour; others avoid deep night
  if (participant.flexibility === "high") return false;
  return hour < 6 || hour >= 24;
}

export interface FindSlotsOptions {
  /** Max diversified recommendations to return (default 12 for “view all”). */
  limit?: number;
  /** Minimum minutes between picked slots (default 120). */
  minGapMinutes?: number;
}

/**
 * Deterministic scheduling for any number of participants:
 * convert each person's local windows to UTC, intersect all of them,
 * generate duration-sized slots, and return ranked recommendations.
 */
export function findMeetingSlots(
  catchUp: CatchUp,
  options: FindSlotsOptions = {}
): MeetingSlot[] {
  const { limit = 12, minGapMinutes = 120 } = options;
  const { participants, duration } = catchUp;
  if (participants.length === 0) return [];

  const now = DateTime.utc().plus({ minutes: 30 });
  const horizon = now.plus({ days: SEARCH_DAYS });

  let overlap = participantWindows(participants[0], now, horizon);
  for (let i = 1; i < participants.length; i++) {
    const next = participantWindows(participants[i], now, horizon);
    overlap = intersectWindows(overlap, next);
    if (overlap.length === 0) break;
  }

  const candidates: MeetingSlot[] = [];
  const seen = new Set<string>();

  for (const window of overlap) {
    let cursor = window.start;
    // Align to 15-minute boundaries
    const mod = cursor.minute % SLOT_STEP_MINUTES;
    if (mod !== 0 || cursor.second !== 0 || cursor.millisecond !== 0) {
      cursor = cursor
        .plus({ minutes: SLOT_STEP_MINUTES - mod })
        .set({ second: 0, millisecond: 0 });
    }

    while (cursor.plus({ minutes: duration }) <= window.end) {
      const end = cursor.plus({ minutes: duration });
      const startIso = cursor.toISO();
      const endIso = end.toISO();
      if (!startIso || !endIso) {
        cursor = cursor.plus({ minutes: SLOT_STEP_MINUTES });
        continue;
      }

      // Skip harsh hours unless everyone involved is flexible enough
      const tooHarsh = participants.some((p) => isTooHarshForParticipant(p, startIso));

      if (!tooHarsh && !seen.has(startIso)) {
        seen.add(startIso);
        const creatorTz = participants[0]?.timezone ?? "UTC";
        candidates.push({
          id: startIso,
          startUtc: startIso,
          endUtc: endIso,
          score: scoreSlot(cursor, participants),
          label: formatSlotDate(startIso, creatorTz),
          localTimes: participants.map((p) => ({
            participantId: p.id,
            name: p.name,
            timezone: p.timezone,
            cityLabel: p.cityLabel,
            flagEmoji: p.flagEmoji,
            timeLabel: formatLocalTime(startIso, p.timezone),
            hour: localHour(startIso, p.timezone),
          })),
        });
      }

      cursor = cursor.plus({ minutes: SLOT_STEP_MINUTES });
    }
  }

  const labels = [
    "Best time",
    "Also works",
    "Another option",
    "One more",
  ];

  return candidates
    .sort((a, b) => b.score - a.score || a.startUtc.localeCompare(b.startUtc))
    .reduce<MeetingSlot[]>((picked, slot) => {
      if (picked.length >= limit) return picked;
      const tooClose = picked.some((existing) => {
        const diffMins = Math.abs(
          DateTime.fromISO(existing.startUtc).diff(
            DateTime.fromISO(slot.startUtc),
            "minutes"
          ).minutes
        );
        return diffMins < minGapMinutes;
      });
      if (!tooClose) picked.push(slot);
      return picked;
    }, [])
    .map((slot, index) => ({
      ...slot,
      label: labels[index] ?? `Option ${index + 1}`,
    }));
}

export function getSelectedSlot(
  catchUp: CatchUp,
  slots?: MeetingSlot[]
): MeetingSlot | undefined {
  const list = slots ?? findMeetingSlots(catchUp, { limit: 12 });
  if (catchUp.selectedSlotId) {
    const found = list.find((s) => s.id === catchUp.selectedSlotId);
    if (found) return found;

    // Reconstruct from selected UTC start even if it fell outside the diversified top list
    const start = DateTime.fromISO(catchUp.selectedSlotId, { zone: "utc" });
    if (start.isValid) {
      const end = start.plus({ minutes: catchUp.duration });
      const startIso = start.toISO()!;
      const endIso = end.toISO()!;
      return {
        id: startIso,
        startUtc: startIso,
        endUtc: endIso,
        score: 0,
        label: "Confirmed",
        localTimes: catchUp.participants.map((p) => ({
          participantId: p.id,
          name: p.name,
          timezone: p.timezone,
          cityLabel: p.cityLabel,
          flagEmoji: p.flagEmoji,
          timeLabel: formatLocalTime(startIso, p.timezone),
          hour: localHour(startIso, p.timezone),
        })),
      };
    }
  }
  return list[0];
}

export function overlapSummary(slot: MeetingSlot): string {
  const interval = Interval.fromISO(`${slot.startUtc}/${slot.endUtc}`);
  if (!interval.isValid) return "";
  return `${interval.start?.toUTC().toFormat("HH:mm")}–${interval.end?.toUTC().toFormat("HH:mm")} UTC`;
}
