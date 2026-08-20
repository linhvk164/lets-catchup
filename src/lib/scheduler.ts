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
/** Never recommend below this share of the group. */
const MIN_AVAILABLE_RATIO = 0.5;

interface UtcWindow {
  start: DateTime;
  end: DateTime;
}

export type AvailabilityWindow = UtcWindow;

type HourBand = "ideal" | "acceptable" | "avoid";

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
    // "Free all day" still respects the default reasonable window (6 AM–midnight).
    const start = localDay.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    const end = localDay.plus({ days: 1 }).startOf("day");
    return [{ start: start.toUTC(), end: end.toUTC() }];
  }

  const day = dayName(localDay);
  const windows: UtcWindow[] = [];

  for (const rule of participant.rules) {
    if (!ruleAppliesToDay(rule, day)) continue;

    if (isFullDayRule(rule) && !rule.start && !rule.end) {
      // Day-only rules with no times: schedule as 6 AM–midnight, not overnight.
      const start = localDay.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      const end = localDay.plus({ days: 1 }).startOf("day");
      windows.push({ start: start.toUTC(), end: end.toUTC() });
      continue;
    }

    if (isFullDayRule(rule)) {
      // Explicit 00:00–00:00 full-day markers still clamp to reasonable hours.
      const start = localDay.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
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

    // Overnight window (e.g. 20:00–02:00) or end-at-midnight 06:00–00:00
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
  const merged: UtcWindow[] = [{ ...sorted[0] }];

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

function coversInterval(
  windows: UtcWindow[],
  start: DateTime,
  end: DateTime
): boolean {
  return windows.some((w) => w.start <= start && w.end >= end);
}

function hourBand(hour: number): HourBand {
  if (hour >= 8 && hour < 22) return "ideal";
  if ((hour >= 6 && hour < 8) || (hour >= 22 && hour < 24)) return "acceptable";
  return "avoid";
}

function prefersHour(participant: Participant, hour: number, minute: number): boolean {
  const prefs = participant.preferences ?? [];
  if (prefs.length === 0) return false;
  return prefs.some((pref) => hourInWindow(hour, minute, pref.start, pref.end));
}

/** Tier 4 ≥50%, tier 3 ≥75%, tier 2 ≥90%, tier 1 = 100%. */
export function availabilityTier(ratio: number): number {
  if (ratio >= 1) return 4;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.75) return 2;
  if (ratio >= MIN_AVAILABLE_RATIO) return 1;
  return 0;
}

function scoreCandidate(
  startUtc: DateTime,
  participants: Participant[],
  available: Participant[]
): number {
  const startIso = startUtc.toISO()!;
  const total = participants.length;
  const availableCount = available.length;
  const ratio = availableCount / total;
  const tier = availabilityTier(ratio);

  let score = tier * 1000 + availableCount * 80;

  let ideal = 0;
  let acceptable = 0;
  for (const p of participants) {
    const hour = localHour(startIso, p.timezone);
    const minute = DateTime.fromISO(startIso, { zone: "utc" })
      .setZone(p.timezone)
      .minute;
    const band = hourBand(hour);
    if (band === "ideal") {
      ideal += 1;
      score += 18;
    } else if (band === "acceptable") {
      acceptable += 1;
      score += 4;
    }

    if (available.some((a) => a.id === p.id) && (p.preferences?.length ?? 0) > 0) {
      if (prefersHour(p, hour, minute)) score += 16;
      else score -= 6;
    }
  }

  // Prefer solutions where almost everyone is in the ideal band.
  score += ideal * 12 + acceptable * 2;

  const daysOut = startUtc.diff(DateTime.utc(), "days").days;
  score -= daysOut * 0.5;

  return score;
}

function buildLocalTimes(
  startIso: string,
  participants: Participant[],
  availableIds: Set<string>
) {
  return participants.map((p) => ({
    participantId: p.id,
    name: p.name,
    timezone: p.timezone,
    cityLabel: p.cityLabel,
    flagEmoji: p.flagEmoji,
    timeLabel: formatLocalTime(startIso, p.timezone),
    hour: localHour(startIso, p.timezone),
    available: availableIds.has(p.id),
  }));
}

function alignToStep(dt: DateTime, stepMinutes: number): DateTime {
  const mod = dt.minute % stepMinutes;
  if (mod === 0 && dt.second === 0 && dt.millisecond === 0) {
    return dt.set({ second: 0, millisecond: 0 });
  }
  return dt
    .plus({ minutes: stepMinutes - mod })
    .set({ second: 0, millisecond: 0 });
}

/**
 * Collect candidate starts from availability edges and reasonable-hour
 * boundaries, then fill sparse gaps with a light 30-minute sweep.
 */
function collectCandidateStarts(
  windowsByParticipant: UtcWindow[][],
  participants: Participant[],
  fromUtc: DateTime,
  toUtc: DateTime,
  durationMinutes: number
): DateTime[] {
  const times = new Set<number>();

  const add = (dt: DateTime) => {
    if (!dt.isValid) return;
    const aligned = alignToStep(dt, SLOT_STEP_MINUTES);
    if (aligned >= fromUtc && aligned.plus({ minutes: durationMinutes }) <= toUtc) {
      times.add(aligned.toMillis());
    }
  };

  for (const windows of windowsByParticipant) {
    for (const w of windows) {
      add(w.start);
      add(w.end.minus({ minutes: durationMinutes }));
    }
  }

  // Reasonable / ideal hour boundaries in each participant's local zone.
  for (const p of participants) {
    let day = fromUtc.setZone(p.timezone).startOf("day");
    const last = toUtc.setZone(p.timezone).endOf("day");
    while (day <= last) {
      for (const hour of [6, 8, 22, 0]) {
        const local =
          hour === 0
            ? day.plus({ days: 1 }).startOf("day")
            : day.set({ hour, minute: 0, second: 0, millisecond: 0 });
        add(local.toUTC());
      }
      day = day.plus({ days: 1 });
    }
  }

  // Light fill so long open windows still produce options.
  let cursor = alignToStep(fromUtc, 30);
  while (cursor.plus({ minutes: durationMinutes }) <= toUtc) {
    add(cursor);
    cursor = cursor.plus({ minutes: 30 });
  }

  return [...times]
    .sort((a, b) => a - b)
    .map((ms) => DateTime.fromMillis(ms, { zone: "utc" }));
}

export interface FindSlotsOptions {
  /** Max diversified recommendations to return (default 12 for “view all”). */
  limit?: number;
  /** Minimum minutes between picked slots (default 120). */
  minGapMinutes?: number;
  /** Override “now” for deterministic tests. */
  now?: DateTime;
}

/**
 * Ranked scheduling: prefer times that work for most people at reasonable
 * local hours. Perfect overlap is best; strong partial overlap is next.
 */
export function findMeetingSlots(
  catchUp: CatchUp,
  options: FindSlotsOptions = {}
): MeetingSlot[] {
  const { limit = 12, minGapMinutes = 120, now: nowOption } = options;
  const { participants, duration } = catchUp;
  if (participants.length === 0) return [];

  const now = (nowOption ?? DateTime.utc()).plus({ minutes: 30 });
  const horizon = now.plus({ days: SEARCH_DAYS });
  const total = participants.length;

  const windowsByParticipant = participants.map((p) =>
    participantWindows(p, now, horizon)
  );

  const candidateStarts = collectCandidateStarts(
    windowsByParticipant,
    participants,
    now,
    horizon,
    duration
  );

  const candidates: MeetingSlot[] = [];
  const seen = new Set<string>();

  for (const start of candidateStarts) {
    const end = start.plus({ minutes: duration });
    const startIso = start.toISO();
    const endIso = end.toISO();
    if (!startIso || !endIso || seen.has(startIso)) continue;
    seen.add(startIso);

    // Hard reject extreme hours for anyone in the group.
    const unreasonable = participants.some((p) => {
      const band = hourBand(localHour(startIso, p.timezone));
      return band === "avoid";
    });
    if (unreasonable) continue;

    const available: Participant[] = [];
    for (let i = 0; i < participants.length; i++) {
      if (coversInterval(windowsByParticipant[i], start, end)) {
        available.push(participants[i]);
      }
    }

    const availableCount = available.length;
    const ratio = availableCount / total;
    if (ratio < MIN_AVAILABLE_RATIO) continue;

    const availableIds = new Set(available.map((p) => p.id));
    const unavailableNames = participants
      .filter((p) => !availableIds.has(p.id))
      .map((p) => p.name.trim() || "Someone")
      .filter(Boolean);

    const creatorTz = participants[0]?.timezone ?? "UTC";
    candidates.push({
      id: startIso,
      startUtc: startIso,
      endUtc: endIso,
      score: scoreCandidate(start, participants, available),
      label: formatSlotDate(startIso, creatorTz),
      localTimes: buildLocalTimes(startIso, participants, availableIds),
      availableCount,
      totalCount: total,
      unavailableNames,
    });
  }

  const labels = [
    "Best time",
    "Also works",
    "Another option",
    "One more",
  ];

  return candidates
    .sort((a, b) => {
      const tierA = availabilityTier(a.availableCount / a.totalCount);
      const tierB = availabilityTier(b.availableCount / b.totalCount);
      if (tierB !== tierA) return tierB - tierA;
      return b.score - a.score || a.startUtc.localeCompare(b.startUtc);
    })
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
      const windowsByParticipant = catchUp.participants.map((p) =>
        participantWindows(p, start.minus({ hours: 1 }), end.plus({ hours: 1 }))
      );
      const availableIds = new Set<string>();
      catchUp.participants.forEach((p, i) => {
        if (coversInterval(windowsByParticipant[i], start, end)) {
          availableIds.add(p.id);
        }
      });
      return {
        id: startIso,
        startUtc: startIso,
        endUtc: endIso,
        score: 0,
        label: "Confirmed",
        localTimes: buildLocalTimes(startIso, catchUp.participants, availableIds),
        availableCount: availableIds.size,
        totalCount: catchUp.participants.length,
        unavailableNames: catchUp.participants
          .filter((p) => !availableIds.has(p.id))
          .map((p) => p.name.trim() || "Someone"),
      };
    }
  }
  return list[0];
}

export function isPerfectOverlap(slot: MeetingSlot): boolean {
  return slot.availableCount >= slot.totalCount && slot.totalCount > 0;
}

export function overlapSummary(slot: MeetingSlot): string {
  const interval = Interval.fromISO(`${slot.startUtc}/${slot.endUtc}`);
  if (!interval.isValid) return "";
  return `${interval.start?.toUTC().toFormat("HH:mm")}–${interval.end?.toUTC().toFormat("HH:mm")} UTC`;
}
