import { DateTime } from "luxon";
import type {
  AvailabilityKind,
  AvailabilityPreference,
  AvailabilityRule,
  DayOfWeek,
  ExceptionDate,
  FlexibilityLevel,
  TimeOfDay,
} from "./types";

const DAY_ALIASES: Record<string, DayOfWeek> = {
  mon: "monday",
  monday: "monday",
  tue: "tuesday",
  tues: "tuesday",
  tuesday: "tuesday",
  wed: "wednesday",
  wednesday: "wednesday",
  thu: "thursday",
  thur: "thursday",
  thurs: "thursday",
  thursday: "thursday",
  fri: "friday",
  friday: "friday",
  sat: "saturday",
  saturday: "saturday",
  sun: "sunday",
  sunday: "sunday",
};

const WEEKDAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

const WEEKENDS: DayOfWeek[] = ["saturday", "sunday"];

const ALL_DAYS: DayOfWeek[] = [...WEEKDAYS, ...WEEKENDS];

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const EXCLUSION_MARKER =
  /\b(?:except(?:\s+for)?|excluding|but\s+not|other\s+than|unavailable(?:\s+on)?|not\s+free|not\s+available)\b/i;

/** Recurring time-of-day hole punched out of availability (not a calendar date). */
interface TimeExclusion {
  start: TimeOfDay;
  end: TimeOfDay;
  days?: DayOfWeek[];
  label: string;
}

export interface ParsedAvailability {
  rules: AvailabilityRule[];
  preferences: AvailabilityPreference[];
  flexibility: FlexibilityLevel;
  /** Date-specific overrides extracted from the same availability text. */
  exceptions: ExceptionDate[];
  /** Short confirmation reflecting exact parsed rules. */
  summary: string;
  /** Extra trust line. */
  detail: string;
  /** Friendly breakdown of what was parsed. */
  debugLines: string[];
}

function tod(hour: number, minute = 0): TimeOfDay {
  return { hour, minute };
}

function parseClock(
  raw: string,
  fallbackMeridiem?: "am" | "pm"
): TimeOfDay | null {
  const cleaned = raw.trim().toLowerCase().replace(/\./g, "");

  if (cleaned === "noon") return tod(12);
  if (cleaned === "midnight") return tod(0);

  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  let meridiem = match[3]?.toLowerCase();
  if (!meridiem && fallbackMeridiem) meridiem = fallbackMeridiem;

  if (Number.isNaN(hour) || hour > 23 || minute > 59) return null;

  if (meridiem) {
    const isPm = meridiem.startsWith("p");
    if (hour === 12) hour = isPm ? 12 : 0;
    else if (isPm) hour += 12;
    else if (hour === 12) hour = 0;
  } else if (hour <= 7) {
    // Bare "6" / "7" without meridiem usually means evening in availability notes
    hour += 12;
  }

  return tod(hour, minute);
}

function extractMeridiem(raw: string): "am" | "pm" | undefined {
  const m = raw.toLowerCase().match(/\b(am|pm|a\.?m\.?|p\.?m\.?)\b/);
  if (!m) return undefined;
  return m[1].startsWith("p") ? "pm" : "am";
}

function extractDays(text: string): DayOfWeek[] {
  const found = new Set<DayOfWeek>();
  const tokens = text.toLowerCase().match(
    /\b(mon(?:day)?s?|tue(?:s|sday)?s?|wed(?:nesday)?s?|thu(?:rs|rsday|r)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?)\b/g
  );
  if (!tokens) return [];
  for (const token of tokens) {
    const stem = token.startsWith("mon")
      ? "monday"
      : token.startsWith("tue")
        ? "tuesday"
        : token.startsWith("wed")
          ? "wednesday"
          : token.startsWith("thu")
            ? "thursday"
            : token.startsWith("fri")
              ? "friday"
              : token.startsWith("sat")
                ? "saturday"
                : token.startsWith("sun")
                  ? "sunday"
                  : null;
    if (stem) found.add(stem);
  }
  return [...found];
}

function formatClock(t: TimeOfDay): string {
  const hour12 = ((t.hour + 11) % 12) + 1;
  const minute = String(t.minute).padStart(2, "0");
  const meridiem = t.hour >= 12 ? "PM" : "AM";
  return t.minute === 0
    ? `${hour12} ${meridiem}`
    : `${hour12}:${minute} ${meridiem}`;
}

function isFullDayTimes(start?: TimeOfDay, end?: TimeOfDay): boolean {
  return (
    !!start &&
    !!end &&
    start.hour === 0 &&
    start.minute === 0 &&
    end.hour === 0 &&
    end.minute === 0
  );
}

function hasAnytimePhrase(text: string): boolean {
  return (
    /\banytime\b/.test(text) ||
    /\bany\s+time\b/.test(text) ||
    /\bany\s+hour\b/.test(text) ||
    /\bwhenever\b/.test(text) ||
    /\ball\s*day\b/.test(text) ||
    /\bfree\s+all\s+day\b/.test(text)
  );
}

function hasFlexiblePhrase(text: string): boolean {
  return (
    /\bflexible\b/.test(text) ||
    /\bi'?m\s+usually\s+free\b/.test(text) ||
    /\bi\s+am\s+usually\s+free\b/.test(text) ||
    /\busually\s+free\b/.test(text) ||
    /\bmost\s+days?\s+work\b/.test(text) ||
    /\bfairly\s+open\b/.test(text)
  );
}

function hasWeekdays(text: string): boolean {
  return (
    /\bweekdays?\b/.test(text) ||
    /\bweek\s*days?\b/.test(text) ||
    /\bmon(?:day)?\s*[-–to]+\s*fri(?:day)?\b/.test(text)
  );
}

function hasWeekends(text: string): boolean {
  return /\bweekends?\b/.test(text);
}

function extractTimeRange(text: string): { start: TimeOfDay; end: TimeOfDay } | null {
  const patterns = [
    /\b(?:from|between)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?)\s*(?:to|and|-|–|—)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?)/i,
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?)\s*(?:to|-|–|—)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const endMeridiem = extractMeridiem(match[2]);
    const startMeridiem = extractMeridiem(match[1]) ?? endMeridiem;
    const start = parseClock(match[1], startMeridiem);
    const end = parseClock(match[2], endMeridiem);
    if (start && end) return { start, end };
  }
  return null;
}

function extractTimeAfter(text: string): TimeOfDay | null {
  // Only explicit "after <time>", not "after work"
  const afterMatch = text.match(
    /\bafter\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?)\b/i
  );
  if (afterMatch) return parseClock(afterMatch[1]);
  return null;
}

function extractTimeBefore(text: string): TimeOfDay | null {
  // Only explicit "before <time>", not "before work" / "before noon"
  if (/\bbefore\s+work\b/.test(text) || /\bbefore\s+noon\b/.test(text)) {
    return null;
  }
  const beforeMatch = text.match(
    /\bbefore\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?)\b/i
  );
  if (beforeMatch) return parseClock(beforeMatch[1]);
  return null;
}

function sameTime(a?: TimeOfDay, b?: TimeOfDay): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.hour === b.hour && a.minute === b.minute;
}

/** Lower = more general. Specific named days beat weekdays/weekends beat every-day. */
function ruleSpecificity(rule: AvailabilityRule): number {
  const days = rule.days;
  if (!days || days.length === 0 || days.length === 7) return 0;
  if (days.length === 5 && WEEKDAYS.every((d) => days.includes(d))) return 1;
  if (days.length === 2 && WEEKENDS.every((d) => days.includes(d))) return 1;
  // Named day lists (including single days and mixed weekday/weekend picks)
  return 2 + Math.max(0, 5 - days.length);
}

/**
 * Resolve overlapping recurring rules into one window per day.
 * More specific day scopes beat general ranges; later equal-specificity
 * statements override earlier ones. Then regroup identical windows.
 */
function normalizeOverlappingRules(rules: AvailabilityRule[]): AvailabilityRule[] {
  if (rules.length <= 1) return rules;

  type DayAssignment = {
    start?: TimeOfDay;
    end?: TimeOfDay;
    label?: string;
    kind: AvailabilityRule["kind"];
    raw: string;
    specificity: number;
    order: number;
  };

  const byDay = new Map<DayOfWeek, DayAssignment>();

  rules.forEach((rule, order) => {
    const days = rule.days?.length ? rule.days : ALL_DAYS;
    const specificity = ruleSpecificity(rule);
    for (const day of days) {
      const existing = byDay.get(day);
      // Specific beats general; at the same specificity, later wins.
      const wins =
        !existing ||
        specificity > existing.specificity ||
        (specificity === existing.specificity && order > existing.order);
      if (!wins) continue;
      byDay.set(day, {
        start: rule.start,
        end: rule.end,
        label: rule.label,
        kind: rule.kind,
        raw: rule.raw,
        specificity,
        order,
      });
    }
  });

  type Group = {
    days: DayOfWeek[];
    start?: TimeOfDay;
    end?: TimeOfDay;
    label?: string;
    kind: AvailabilityRule["kind"];
    raw: string;
  };

  const groups: Group[] = [];
  for (const day of ALL_DAYS) {
    const assignment = byDay.get(day);
    if (!assignment) continue;
    const match = groups.find(
      (g) =>
        sameTime(g.start, assignment.start) &&
        sameTime(g.end, assignment.end) &&
        g.label === assignment.label &&
        g.kind === assignment.kind
    );
    if (match) {
      match.days.push(day);
    } else {
      groups.push({
        days: [day],
        start: assignment.start,
        end: assignment.end,
        label: assignment.label,
        kind: assignment.kind,
        raw: assignment.raw,
      });
    }
  }

  return groups.map((g) => {
    const isWeekdays =
      g.days.length === 5 && WEEKDAYS.every((d) => g.days.includes(d));
    const isWeekends =
      g.days.length === 2 && WEEKENDS.every((d) => g.days.includes(d));
    let kind = g.kind;
    if (isFullDayTimes(g.start, g.end)) {
      kind = isWeekends ? "weekends_anytime" : isWeekdays ? "all_day" : "specific_days";
    } else if (g.start && g.end && !isFullDayTimes(g.start, g.end)) {
      kind = "specific_days";
    }
    return {
      kind,
      days: g.days,
      start: g.start,
      end: g.end,
      label: g.label,
      raw: g.raw,
    } satisfies AvailabilityRule;
  });
}

function daysForClause(text: string): DayOfWeek[] | undefined {
  const hasWd = hasWeekdays(text);
  const hasWe = hasWeekends(text);
  // Never flatten both scopes into one rule — caller should split first.
  if (hasWd && hasWe) return undefined;
  if (hasWd) return [...WEEKDAYS];
  if (hasWe) return [...WEEKENDS];
  const specific = extractDays(text);
  return specific.length > 0 ? specific : undefined;
}

const DAY_START_RE =
  /^(?:and\s+|or\s+)?(?:mon(?:day)?s?|tue(?:s|sday)?s?|wed(?:nesday)?s?|thu(?:rs|rsday|r)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?|weekdays?|weekends?)\b/i;

const DAY_END_RE =
  /(?:mon(?:day)?s?|tue(?:s|sday)?s?|wed(?:nesday)?s?|thu(?:rs|rsday|r)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?|weekdays?|weekends?)\s*$/i;

/** True when a comma is continuing a day enumeration ("friday, saturday and thursday"). */
function isDayListCommaContinuation(left: string, right: string): boolean {
  return DAY_END_RE.test(left.trim()) && DAY_START_RE.test(right.trim());
}

/**
 * Split one availability note into separate rule clauses.
 * Sentence boundaries always split. Commas split different scopes
 * ("Weekdays after work, weekends anytime") but NOT day lists
 * ("Free friday, saturday and thursday").
 */
function splitClauses(raw: string): string[] {
  const primary = raw
    .split(/(?<=[.!?])\s+|\n+|;\s+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const withCommaScopes: string[] = [];
  for (const part of primary) {
    const commaParts = part
      .split(/,\s+/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (commaParts.length <= 1) {
      withCommaScopes.push(part);
      continue;
    }

    let current = commaParts[0];
    for (let i = 1; i < commaParts.length; i++) {
      const next = commaParts[i];
      if (isDayListCommaContinuation(current, next)) {
        current = `${current}, ${next}`;
      } else {
        withCommaScopes.push(current);
        current = next;
      }
    }
    withCommaScopes.push(current);
  }

  const refined: string[] = [];
  for (const part of withCommaScopes) {
    // If a fragment still mixes weekdays + weekends, split on "and" / space boundary.
    const mixed =
      part.match(
        /^([\s\S]*?\bweekdays?\b[\s\S]*?)(?:\s+and\s+|\s+)([\s\S]*\bweekends?\b[\s\S]*)$/i
      ) ||
      part.match(
        /^([\s\S]*?\bweekends?\b[\s\S]*?)(?:\s+and\s+|\s+)([\s\S]*\bweekdays?\b[\s\S]*)$/i
      );
    if (mixed) {
      refined.push(mixed[1], mixed[2]);
      continue;
    }
    refined.push(part);
  }

  return refined
    .map((c) => c.trim().replace(/^[.,;]+|[.,;]+$/g, "").trim())
    .filter((c) => c.length > 0);
}

function formatDayGroup(days?: DayOfWeek[]): string {
  if (!days || days.length === 0 || days.length === 7) return "Every day";
  if (days.length === 5 && WEEKDAYS.every((d) => days.includes(d))) {
    return "Mon–Fri";
  }
  if (days.length === 2 && WEEKENDS.every((d) => days.includes(d))) {
    return "Sat–Sun";
  }
  if (days.length === 1) return DAY_SHORT[days[0]];

  const sorted = ALL_DAYS.filter((d) => days.includes(d));
  const ranges: string[] = [];
  let start = 0;
  while (start < sorted.length) {
    let end = start;
    while (
      end + 1 < sorted.length &&
      ALL_DAYS.indexOf(sorted[end + 1]) === ALL_DAYS.indexOf(sorted[end]) + 1
    ) {
      end += 1;
    }
    if (end === start) {
      ranges.push(DAY_SHORT[sorted[start]]);
    } else if (end === start + 1) {
      ranges.push(`${DAY_SHORT[sorted[start]]}, ${DAY_SHORT[sorted[end]]}`);
    } else {
      ranges.push(`${DAY_SHORT[sorted[start]]}–${DAY_SHORT[sorted[end]]}`);
    }
    start = end + 1;
  }
  return ranges.join(", ");
}

function formatRuleDebug(rule: AvailabilityRule): string {
  const days = formatDayGroup(rule.days);
  const range =
    rule.start && rule.end && !isFullDayTimes(rule.start, rule.end)
      ? `${formatClock(rule.start)} – ${formatClock(rule.end)}`
      : null;

  if (rule.label === "After work" && range) {
    return `${days}: After work (${range})`;
  }
  if (rule.label === "Before work" && range) {
    return `${days}: Before work (${range})`;
  }
  if (rule.label === "During work hours" && range) {
    return `${days}: During work hours (${range})`;
  }
  if (rule.label === "Evenings" && range) {
    return `${days}: Evenings (${range})`;
  }

  if (isFullDayRule(rule) || isFullDayTimes(rule.start, rule.end)) {
    return `${days}: Anytime`;
  }
  // "Before 11 PM" — midnight start with an explicit end from "before <time>"
  if (
    rule.label === "Before" &&
    rule.end &&
    rule.start &&
    rule.start.hour === 0 &&
    rule.start.minute === 0
  ) {
    return `${days}: Before ${formatClock(rule.end)}`;
  }
  if (range) {
    return `${days}: ${range}`;
  }
  if (rule.start) {
    return `${days}: After ${formatClock(rule.start)}`;
  }
  return `${days}: ${rule.label ?? rule.kind}`;
}

function formatNiceDate(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate);
  if (!dt.isValid) return isoDate;
  return dt.toFormat("LLLL d");
}

function formatExceptionDebug(ex: ExceptionDate): string {
  const nice = formatNiceDate(ex.date);
  if (ex.type === "free_all_day") return `Available all day: ${nice}`;
  return `Not available: ${nice}`;
}

function formatTimeExclusionDebug(ex: TimeExclusion): string {
  return `Not available: ${formatDayGroup(ex.days)}, ${formatClock(ex.start)} – ${formatClock(ex.end)}`;
}

function sameDaySet(a?: DayOfWeek[], b?: DayOfWeek[]): boolean {
  const left = a?.length ? ALL_DAYS.filter((d) => a.includes(d)) : ALL_DAYS;
  const right = b?.length ? ALL_DAYS.filter((d) => b.includes(d)) : ALL_DAYS;
  if (left.length !== right.length) return false;
  return left.every((d, i) => d === right[i]);
}

function hasSpecialDebugLabel(rule: AvailabilityRule): boolean {
  return (
    rule.label === "After work" ||
    rule.label === "Before work" ||
    rule.label === "During work hours" ||
    rule.label === "Evenings" ||
    rule.label === "Before"
  );
}

/** Group same-day windows onto one confirmation line: "Mon–Fri: 10 AM – 12 PM, 1 PM – 5 PM". */
function formatRulesDebug(rules: AvailabilityRule[]): string[] {
  const lines: string[] = [];
  const used = new Set<number>();

  for (let i = 0; i < rules.length; i++) {
    if (used.has(i)) continue;
    const rule = rules[i];

    if (hasSpecialDebugLabel(rule)) {
      lines.push(formatRuleDebug(rule));
      used.add(i);
      continue;
    }

    if (
      rule.start &&
      rule.end &&
      !isFullDayTimes(rule.start, rule.end) &&
      !rule.label
    ) {
      const peerIndexes: number[] = [];
      for (let j = i; j < rules.length; j++) {
        if (used.has(j)) continue;
        const other = rules[j];
        if (
          other.start &&
          other.end &&
          !isFullDayTimes(other.start, other.end) &&
          !other.label &&
          !hasSpecialDebugLabel(other) &&
          sameDaySet(rule.days, other.days)
        ) {
          peerIndexes.push(j);
        }
      }

      const ranges = peerIndexes
        .map((idx) => rules[idx])
        .sort((a, b) => {
          const aStart = (a.start?.hour ?? 0) * 60 + (a.start?.minute ?? 0);
          const bStart = (b.start?.hour ?? 0) * 60 + (b.start?.minute ?? 0);
          // Midnight-end overnight windows sort by start; treat end-at-0 as late.
          return aStart - bStart;
        })
        .map(
          (r) => `${formatClock(r.start!)} – ${formatClock(r.end!)}`
        );

      lines.push(`${formatDayGroup(rule.days)}: ${ranges.join(", ")}`);
      for (const idx of peerIndexes) used.add(idx);
      continue;
    }

    lines.push(formatRuleDebug(rule));
    used.add(i);
  }

  return lines;
}

function buildConfirmation(
  rules: AvailabilityRule[],
  exceptions: ExceptionDate[],
  excludedDays: DayOfWeek[] = [],
  timeExclusions: TimeExclusion[] = []
): { summary: string; detail: string; debugLines: string[] } {
  const debugLines = [
    ...formatRulesDebug(rules),
    ...timeExclusions.map(formatTimeExclusionDebug),
    ...(excludedDays.length > 0
      ? [`Not available: ${formatDayGroup(excludedDays)}`]
      : []),
    ...exceptions.map(formatExceptionDebug),
  ];
  return {
    summary: "Got it!",
    detail: "",
    debugLines,
  };
}

function parseClause(clause: string, rawFull: string): AvailabilityRule | null {
  const text = clause.toLowerCase().trim();
  if (!text) return null;

  const days = daysForClause(text);
  const range = extractTimeRange(text);
  const after = extractTimeAfter(text);
  const anytime = hasAnytimePhrase(text);
  const flexible = hasFlexiblePhrase(text);
  const raw = clause.trim() || rawFull;

  // 1. Exact time ranges win
  if (range) {
    return {
      kind: days ? "specific_days" : "between_times",
      days,
      start: range.start,
      end: range.end,
      raw,
    };
  }

  // 2. Explicit "after <clock time>" → until midnight (12 AM)
  if (after) {
    return {
      kind: days ? "weekdays_after" : "after_time",
      days: days ?? (hasWeekdays(text) ? WEEKDAYS : undefined),
      start: after,
      end: tod(0),
      raw,
    };
  }

  // 3. Explicit "before <clock time>" → from midnight until that time
  const before = extractTimeBefore(text);
  if (before) {
    return {
      kind: days ? "specific_days" : "between_times",
      days: days ?? (hasWeekdays(text) ? WEEKDAYS : undefined),
      start: tod(0),
      end: before,
      label: "Before",
      raw,
    };
  }

  // 4. Work-relative phrases (must beat "anytime" when both appear in unsplit text)
  if (/\bafter\s+work\b|\bafter\s+hours?\b|\bafter\s+dinner\b/.test(text)) {
    return {
      kind: "weekdays_after",
      days: days ?? WEEKDAYS,
      start: tod(17),
      end: tod(23),
      label: "After work",
      raw,
    };
  }

  if (/\bbefore\s+work\b/.test(text)) {
    return {
      kind: "mornings",
      days: days ?? WEEKDAYS,
      start: tod(6),
      end: tod(9),
      label: "Before work",
      raw,
    };
  }

  if (/\bduring\s+work\s+hours?\b|\bwork\s+hours?\b/.test(text)) {
    return {
      kind: "between_times",
      days: days ?? WEEKDAYS,
      start: tod(9),
      end: tod(17),
      label: "During work hours",
      raw,
    };
  }

  // 5. Anytime / all day (only when said) — scoped to the days in this clause
  if (anytime) {
    const scopedDays =
      days ??
      (hasWeekends(text)
        ? WEEKENDS
        : hasWeekdays(text)
          ? WEEKDAYS
          : undefined);
    return {
      kind: scopedDays
        ? hasWeekends(text) && !hasWeekdays(text)
          ? "weekends_anytime"
          : "all_day"
        : "fully_flexible",
      days: scopedDays,
      start: tod(0),
      end: tod(0),
      label: "Anytime",
      raw,
    };
  }

  // 6. Vague flexible language (no exact times)
  if (flexible && !days) {
    return {
      kind: "broad",
      start: tod(8),
      end: tod(22),
      raw,
    };
  }

  if (/\bevenings?\b/.test(text)) {
    return {
      kind: "evenings",
      days,
      start: tod(17),
      end: tod(23),
      label: "Evenings",
      raw,
    };
  }

  if (/\bmornings?\b|\bbefore\s+noon\b/.test(text)) {
    return {
      kind: "mornings",
      days,
      start: tod(6),
      end: tod(12),
      raw,
    };
  }

  if (/\bafternoons?\b/.test(text)) {
    return {
      kind: "afternoons",
      days,
      start: tod(12),
      end: tod(17),
      raw,
    };
  }

  if (/\blate\s+nights?\b|\bnight\s*owl\b/.test(text)) {
    return {
      kind: "nights",
      days,
      start: tod(20),
      end: tod(2),
      raw,
    };
  }

  // Day-only free / usually free (e.g. "usually free Wednesdays")
  if (days && (flexible || /\bfree\b|\bavailable\b/.test(text))) {
    return {
      kind: "specific_days",
      days,
      start: tod(0),
      end: tod(0),
      label: "Anytime",
      raw,
    };
  }

  // Day-only mention without times (e.g. leftover "on weekends") — skip
  if (days && (hasWeekdays(text) || hasWeekends(text)) && text.length < 24) {
    return null;
  }

  return null;
}

function extractPreferredFromBut(text: string): AvailabilityPreference | null {
  const butMatch = text.match(
    /\b(?:but|though|although|preferably|prefer)\b(.{0,60})/i
  );
  if (!butMatch) return null;
  const clause = butMatch[1].toLowerCase();

  if (/\bevenings?\b/.test(clause)) {
    return { start: tod(18), end: tod(22), label: "evenings" };
  }
  if (/\bmornings?\b/.test(clause)) {
    return { start: tod(6), end: tod(12), label: "mornings" };
  }
  if (/\bafternoons?\b/.test(clause)) {
    return { start: tod(12), end: tod(17), label: "afternoons" };
  }
  if (/\bnights?\b|\bnight\s*owl\b/.test(clause)) {
    return { start: tod(20), end: tod(2), label: "late nights" };
  }
  return null;
}

function formatRulePhrase(rule: AvailabilityRule): string {
  const days = rule.days;
  const dayLabel =
    !days || days.length === 0
      ? ""
      : days.length === 5 && WEEKDAYS.every((d) => days.includes(d))
        ? "weekdays"
        : days.length === 2 && WEEKENDS.every((d) => days.includes(d))
          ? "weekends"
          : days.map((d) => DAY_SHORT[d]).join(", ");

  if (isFullDayRule(rule) || isFullDayTimes(rule.start, rule.end)) {
    return dayLabel ? `anytime on ${dayLabel}` : "anytime";
  }

  if (rule.kind === "broad" && rule.start && rule.end) {
    return `broadly free from ${formatClock(rule.start)} to ${formatClock(rule.end)}`;
  }

  if (rule.start && rule.end) {
    const range = `from ${formatClock(rule.start)} to ${formatClock(rule.end)}`;
    return dayLabel ? `${dayLabel} ${range}` : range;
  }

  if (rule.start) {
    return dayLabel
      ? `${dayLabel} after ${formatClock(rule.start)}`
      : `after ${formatClock(rule.start)}`;
  }

  switch (rule.kind) {
    case "mornings":
      return dayLabel ? `mornings on ${dayLabel}` : "mornings";
    case "afternoons":
      return dayLabel ? `afternoons on ${dayLabel}` : "afternoons";
    case "evenings":
      return dayLabel ? `evenings on ${dayLabel}` : "evenings";
    case "nights":
      return dayLabel ? `late nights on ${dayLabel}` : "late nights";
    default:
      return dayLabel || rule.kind;
  }
}

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const MONTH_PATTERN =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
const WEEKDAY_PATTERN =
  "mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday|r)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?";

function resolveWeekdayOccurrence(
  weekdayToken: string,
  which: "this" | "next",
  now: DateTime
): string | null {
  const day = DAY_ALIASES[weekdayToken.toLowerCase()];
  if (!day) return null;
  const luxonWeekday = (
    {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    } as Record<DayOfWeek, number>
  )[day];

  let thisOccurrence = now.startOf("day");
  for (let i = 0; i < 7; i++) {
    if (thisOccurrence.weekday === luxonWeekday) break;
    thisOccurrence = thisOccurrence.plus({ days: 1 });
  }

  const target =
    which === "this" ? thisOccurrence : thisOccurrence.plus({ weeks: 1 });
  return target.toISODate();
}

function parseAbsoluteDate(
  text: string,
  referenceYear: number
): { date: string; matchStart: number; matchEnd: number } | null {
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso && iso.index !== undefined) {
    return {
      date: `${iso[1]}-${iso[2]}-${iso[3]}`,
      matchStart: iso.index,
      matchEnd: iso.index + iso[0].length,
    };
  }

  const named = new RegExp(
    `\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b`,
    "i"
  );
  const m = text.match(named);
  if (!m || m.index === undefined) return null;
  const month = MONTHS[m[1].toLowerCase()];
  const day = Number(m[2]);
  const year = m[3] ? Number(m[3]) : referenceYear;
  if (!month || day < 1 || day > 31) return null;
  return {
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    matchStart: m.index,
    matchEnd: m.index + m[0].length,
  };
}

/**
 * Split base availability from exclusion clauses.
 * "Except" / "excluding" / "but not" / etc. never define availability —
 * they only remove or override what came before.
 */
function splitBaseAndExclusions(input: string): {
  base: string;
  exclusionTexts: string[];
} {
  const exclusionTexts: string[] = [];
  const marker = new RegExp(EXCLUSION_MARKER.source, "gi");
  const match = marker.exec(input);

  if (!match) {
    return { base: input.trim(), exclusionTexts: [] };
  }

  const base = input.slice(0, match.index).trim();
  let cursor = match.index + match[0].length;

  while (true) {
    marker.lastIndex = cursor;
    const next = marker.exec(input);
    const end = next ? next.index : input.length;
    const chunk = input.slice(cursor, end).trim();
    if (chunk) exclusionTexts.push(chunk.replace(/[.,;]+$/g, "").trim());
    if (!next) break;
    cursor = next.index + next[0].length;
  }

  return {
    base: base.replace(/[.,;]+$/g, "").trim(),
    exclusionTexts: exclusionTexts.filter(Boolean),
  };
}

function parseExclusionSegment(
  text: string,
  now: DateTime,
  contextDays?: DayOfWeek[]
): {
  exceptions: ExceptionDate[];
  excludedDays: DayOfWeek[];
  timeExclusions: TimeExclusion[];
} {
  let working = text.trim();
  const exceptions: ExceptionDate[] = [];
  const excludedDaySet = new Set<DayOfWeek>();
  const timeExclusions: TimeExclusion[] = [];
  const seenDates = new Set<string>();

  function pushDate(ex: ExceptionDate) {
    const key = `${ex.date}:${ex.type}`;
    if (seenDates.has(key)) return;
    seenDates.add(key);
    exceptions.push(ex);
  }

  // tomorrow
  {
    const m = working.match(
      /\b(?:on\s+)?tomorrow\b|\bnot\s+available\s+tomorrow\b/i
    );
    if (m && m.index !== undefined) {
      const date = now.plus({ days: 1 }).toISODate();
      if (date) {
        pushDate({ date, type: "unavailable", label: m[0].trim() });
      }
      working =
        working.slice(0, m.index) + working.slice(m.index + m[0].length);
    }
  }

  // this / next weekday → date exception (not a recurring day removal)
  {
    const re = new RegExp(
      `\\b(this|next)\\s+(${WEEKDAY_PATTERN})s?\\b`,
      "gi"
    );
    let m: RegExpExecArray | null;
    const toStrip: { start: number; end: number }[] = [];
    while ((m = re.exec(working)) !== null) {
      const which = m[1].toLowerCase() as "this" | "next";
      const date = resolveWeekdayOccurrence(m[2], which, now);
      if (date) {
        pushDate({ date, type: "unavailable", label: m[0].trim() });
      }
      toStrip.push({ start: m.index, end: m.index + m[0].length });
    }
    for (const span of [...toStrip].reverse()) {
      working =
        working.slice(0, span.start) + " " + working.slice(span.end);
    }
  }

  // Absolute dates
  {
    let guard = 0;
    while (guard++ < 8) {
      const abs = parseAbsoluteDate(working, now.year);
      if (!abs) break;
      pushDate({
        date: abs.date,
        type: "unavailable",
        label: working.slice(abs.matchStart, abs.matchEnd).trim(),
      });
      working =
        working.slice(0, abs.matchStart) +
        " " +
        working.slice(abs.matchEnd);
    }
  }

  working = working.replace(/\s{2,}/g, " ").trim();

  // Time-range exclusions ("from 12pm to 1pm", "8-9 PM", "between noon and 2")
  const range = extractTimeRange(working);
  const namedDays = daysForClause(working) ?? extractDays(working);
  if (range) {
    timeExclusions.push({
      start: range.start,
      end: range.end,
      days: namedDays.length > 0 ? namedDays : contextDays,
      label: text.trim(),
    });
    // Strip clock tokens so leftover day names aren't double-counted as full-day blocks
    working = working
      .replace(
        /\b(?:from|between)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?\s*(?:to|and|-|–|—)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?/gi,
        " "
      )
      .replace(
        /\b\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?\s*(?:to|-|–|—)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?)?/gi,
        " "
      )
      .replace(/\b(?:noon|midnight)\b/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  } else {
    // Remaining weekday names are recurring full-day exclusions
    for (const day of extractDays(working)) {
      excludedDaySet.add(day);
    }
  }

  return {
    exceptions,
    excludedDays: ALL_DAYS.filter((d) => excludedDaySet.has(d)),
    timeExclusions,
  };
}

function toMinutes(t: TimeOfDay): number {
  return t.hour * 60 + t.minute;
}

function minutesToTod(total: number): TimeOfDay {
  if (total >= 24 * 60) return tod(0);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return tod(hour, minute);
}

/** Inclusive start / exclusive-ish end in minutes from midnight; midnight end = 24*60. */
function windowBounds(
  start: TimeOfDay,
  end: TimeOfDay
): { start: number; end: number } {
  if (isFullDayTimes(start, end)) return { start: 0, end: 24 * 60 };
  const s = toMinutes(start);
  let e = toMinutes(end);
  if (e <= s) e = e === 0 ? 24 * 60 : e + 24 * 60;
  return { start: s, end: e };
}

function cutWindow(
  start: TimeOfDay,
  end: TimeOfDay,
  cutStart: TimeOfDay,
  cutEnd: TimeOfDay
): { start: TimeOfDay; end: TimeOfDay }[] {
  const win = windowBounds(start, end);
  const cut = windowBounds(cutStart, cutEnd);
  const lo = Math.max(win.start, cut.start);
  const hi = Math.min(win.end, cut.end);
  if (lo >= hi) return [{ start, end }];

  const parts: { start: TimeOfDay; end: TimeOfDay }[] = [];
  if (win.start < lo) {
    parts.push({ start: minutesToTod(win.start), end: minutesToTod(lo) });
  }
  if (hi < win.end) {
    parts.push({ start: minutesToTod(hi), end: minutesToTod(win.end) });
  }
  return parts;
}

/**
 * Punch unavailable time ranges out of availability rules.
 * Day-scoped exclusions only affect matching days; remaining days keep the original window.
 */
function applyTimeExclusions(
  rules: AvailabilityRule[],
  exclusions: TimeExclusion[]
): AvailabilityRule[] {
  if (exclusions.length === 0) return rules;

  const result: AvailabilityRule[] = [];

  for (const rule of rules) {
    if (!rule.start || !rule.end) {
      result.push(rule);
      continue;
    }

    const ruleDays = rule.days?.length ? rule.days : ALL_DAYS;
    const applicable = exclusions.filter((ex) => {
      const exDays = ex.days?.length ? ex.days : ruleDays;
      return ruleDays.some((d) => exDays.includes(d));
    });

    if (applicable.length === 0) {
      result.push(rule);
      continue;
    }

    const affectedDays = ruleDays.filter((d) =>
      applicable.some((ex) => (ex.days?.length ? ex.days : ruleDays).includes(d))
    );
    const unaffectedDays = ruleDays.filter((d) => !affectedDays.includes(d));

    if (unaffectedDays.length > 0) {
      result.push({
        ...rule,
        days: unaffectedDays,
        kind:
          unaffectedDays.length === 7
            ? rule.kind
            : rule.kind === "between_times" || rule.kind === "broad"
              ? "specific_days"
              : rule.kind,
      });
    }

    if (affectedDays.length === 0) continue;

    // Only apply exclusions that intersect these affected days
    const cuts = applicable.filter((ex) => {
      const exDays = ex.days?.length ? ex.days : ruleDays;
      return affectedDays.some((d) => exDays.includes(d));
    });

    let windows: { start: TimeOfDay; end: TimeOfDay }[] = [
      { start: rule.start, end: rule.end },
    ];
    for (const cut of cuts) {
      windows = windows.flatMap((w) =>
        cutWindow(w.start, w.end, cut.start, cut.end)
      );
    }

    for (const w of windows) {
      result.push({
        kind: "specific_days",
        days: affectedDays,
        start: w.start,
        end: w.end,
        raw: rule.raw,
      });
    }
  }

  return result;
}

function isLunchBreakClause(text: string): boolean {
  return /\blunch(?:\s+break)?\b/i.test(text);
}

function parseLunchExclusion(
  clause: string,
  contextDays?: DayOfWeek[]
): TimeExclusion | null {
  if (!isLunchBreakClause(clause)) return null;
  const range = extractTimeRange(clause) ?? {
    start: tod(12),
    end: tod(13),
  };
  return {
    start: range.start,
    end: range.end,
    days: daysForClause(clause.toLowerCase()) ?? contextDays,
    label: clause.trim(),
  };
}

function applyExcludedDays(
  rules: AvailabilityRule[],
  excludedDays: DayOfWeek[]
): AvailabilityRule[] {
  if (excludedDays.length === 0) return rules;
  const exclude = new Set(excludedDays);
  const next: AvailabilityRule[] = [];

  for (const rule of rules) {
    const baseDays = rule.days?.length ? rule.days : ALL_DAYS;
    const nextDays = baseDays.filter((d) => !exclude.has(d));
    if (nextDays.length === 0) continue;
    next.push({
      ...rule,
      days: nextDays,
      kind:
        rule.kind === "between_times" || rule.kind === "broad"
          ? "specific_days"
          : rule.kind,
    });
  }

  return next;
}

/**
 * Pull date-specific overrides out of availability text, returning cleaned remainder
 * for recurring rule parsing. Rule-based only (no LLM).
 */
export function extractExceptionsFromText(
  input: string,
  now = DateTime.local()
): { exceptions: ExceptionDate[]; remainder: string } {
  let remainder = input;
  const exceptions: ExceptionDate[] = [];
  const seen = new Set<string>();

  function push(ex: ExceptionDate) {
    const key = `${ex.date}:${ex.type}`;
    if (seen.has(key)) return;
    seen.add(key);
    exceptions.push(ex);
  }

  function removeSpan(start: number, end: number) {
    remainder =
      remainder.slice(0, start).trimEnd() +
      " " +
      remainder.slice(end).trimStart();
    remainder = remainder.replace(/\s{2,}/g, " ").replace(/\s+([.,;])/g, "$1").trim();
  }

  // Work on a mutable copy while matching against current remainder repeatedly
  let guard = 0;
  while (guard++ < 20) {
    const lower = remainder.toLowerCase();
    let matched = false;

    // not tomorrow / unavailable tomorrow / busy tomorrow
    {
      const m = lower.match(
        /\b(?:but\s+)?(?:i'?m\s+)?(?:not\s+available|unavailable|can't|cannot|busy|not)\s+(?:on\s+)?tomorrow\b|\bnot\s+tomorrow\b|\bunavailable\s+tomorrow\b/
      );
      if (m && m.index !== undefined) {
        const date = now.plus({ days: 1 }).toISODate();
        if (date) {
          push({
            date,
            type: "unavailable",
            label: m[0].trim(),
          });
        }
        removeSpan(m.index, m.index + m[0].length);
        matched = true;
      }
    }
    if (matched) continue;

    // free / available tomorrow (all day)
    {
      const m = lower.match(
        /\b(?:free|available)\s+(?:all\s+day\s+)?(?:on\s+)?tomorrow\b/
      );
      if (m && m.index !== undefined) {
        const date = now.plus({ days: 1 }).toISODate();
        if (date) {
          push({ date, type: "free_all_day", label: m[0].trim() });
        }
        removeSpan(m.index, m.index + m[0].length);
        matched = true;
      }
    }
    if (matched) continue;

    // but not this Wednesday / not this Friday
    {
      const m = lower.match(
        new RegExp(
          `\\b(?:but\\s+)?not\\s+(?:this\\s+)?(${WEEKDAY_PATTERN})\\b`
        )
      );
      if (m && m.index !== undefined) {
        const date = resolveWeekdayOccurrence(m[1], "this", now);
        if (date) {
          push({ date, type: "unavailable", label: m[0].trim() });
        }
        removeSpan(m.index, m.index + m[0].length);
        matched = true;
      }
    }
    if (matched) continue;

    // next Wednesday works / free next Wednesday
    {
      const m = lower.match(
        new RegExp(
          `\\b(?:free|available)?\\s*next\\s+(${WEEKDAY_PATTERN})(?:\\s+works)?\\b`
        )
      );
      if (m && m.index !== undefined) {
        const date = resolveWeekdayOccurrence(m[1], "next", now);
        if (date) {
          push({ date, type: "free_all_day", label: m[0].trim() });
        }
        removeSpan(m.index, m.index + m[0].length);
        matched = true;
      }
    }
    if (matched) continue;

    // unavailable / except / not available + absolute date
    {
      const prefix =
        /\b(?:but\s+)?(?:i'?m\s+)?(?:unavailable|not\s+available|can't|cannot|busy|except(?:\s+for)?)\b/i;
      const pref = lower.match(prefix);
      if (pref && pref.index !== undefined) {
        const after = remainder.slice(pref.index + pref[0].length);
        const abs = parseAbsoluteDate(after, now.year);
        if (abs) {
          const start = pref.index;
          const end = pref.index + pref[0].length + abs.matchEnd;
          const label = remainder.slice(start, end).trim();
          push({ date: abs.date, type: "unavailable", label });
          removeSpan(start, end);
          matched = true;
        }
      }
    }
    if (matched) continue;

    // free all day August 15 / available August 15
    {
      const prefix =
        /\b(?:free|available)(?:\s+all\s+day)?(?:\s+on)?\b/i;
      const pref = lower.match(prefix);
      if (pref && pref.index !== undefined) {
        const after = remainder.slice(pref.index + pref[0].length);
        const abs = parseAbsoluteDate(after, now.year);
        if (abs) {
          const start = pref.index;
          const end = pref.index + pref[0].length + abs.matchEnd;
          const label = remainder.slice(start, end).trim();
          push({ date: abs.date, type: "free_all_day", label });
          removeSpan(start, end);
          matched = true;
        }
      }
    }
    if (matched) continue;

    break;
  }

  // Cleanup leftover conjunctions
  remainder = remainder
    .replace(/\.{2,}/g, ".")
    .replace(/\b(but|and|though)\s*[.,;]?\s*$/i, "")
    .replace(/^\s*(but|and|though)\b[,.]?\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  return { exceptions, remainder };
}

function rememberAvailabilityDays(
  clause: string,
  rule: AvailabilityRule
): DayOfWeek[] | undefined {
  if (rule.days?.length) return rule.days;
  const lower = clause.toLowerCase();
  if (hasWeekdays(lower)) return [...WEEKDAYS];
  if (hasWeekends(lower)) return [...WEEKENDS];
  return undefined;
}

/**
 * Deterministic natural-language availability parser.
 * Clauses are processed in order: each exclusion applies to the closest
 * previous availability scope unless it names its own days.
 */
export function parseAvailabilityInput(
  input: string,
  now = DateTime.local()
): ParsedAvailability {
  const raw = input.trim();
  if (!raw) {
    const rules: AvailabilityRule[] = [
      { kind: "evenings", start: tod(18), end: tod(22), raw: "" },
    ];
    const confirmation = buildConfirmation(rules, []);
    return {
      rules,
      preferences: [],
      flexibility: "low",
      exceptions: [],
      summary: confirmation.summary,
      detail: "",
      debugLines: confirmation.debugLines,
    };
  }

  // Pull embedded date overrides (e.g. "not tomorrow") without peeling later clauses.
  const { exceptions: baseExceptions, remainder } = extractExceptionsFromText(
    raw,
    now
  );

  const recurringSource = remainder.trim() || raw;
  const text = recurringSource.toLowerCase();
  const clauses = splitClauses(recurringSource);

  let rules: AvailabilityRule[] = [];
  const timeExclusions: TimeExclusion[] = [];
  const excludedDaySet = new Set<DayOfWeek>();
  const exclusionExceptions: ExceptionDate[] = [];
  let lastAvailabilityDays: DayOfWeek[] | undefined;

  const hasRecurringSignal =
    recurringSource.trim().length > 0 &&
    !/^(but|and|though|except)\.?$/i.test(recurringSource.trim());

  function absorbExclusionSegment(exclusionText: string, contextDays?: DayOfWeek[]) {
    const parsed = parseExclusionSegment(exclusionText, now, contextDays);
    for (const day of parsed.excludedDays) excludedDaySet.add(day);
    exclusionExceptions.push(...parsed.exceptions);
    timeExclusions.push(...parsed.timeExclusions);
  }

  if (hasRecurringSignal) {
    for (const clause of clauses) {
      const lunch = parseLunchExclusion(clause, lastAvailabilityDays);
      if (lunch) {
        timeExclusions.push(lunch);
        continue;
      }

      // Peel inline "except …" / "not free …" from this clause only — never
      // consume following sentences (those are separate clauses).
      const { base, exclusionTexts } = splitBaseAndExclusions(clause);
      const availabilityText = base.trim();

      if (availabilityText) {
        const rule = parseClause(availabilityText, raw);
        if (rule) {
          rules.push(rule);
          const remembered = rememberAvailabilityDays(availabilityText, rule);
          if (remembered) lastAvailabilityDays = remembered;
        }
      } else if (exclusionTexts.length === 0) {
        // Whole clause may still be availability (no exclusion marker).
        const rule = parseClause(clause, raw);
        if (rule) {
          rules.push(rule);
          const remembered = rememberAvailabilityDays(clause, rule);
          if (remembered) lastAvailabilityDays = remembered;
        }
      }

      // Exclusions attach to the active (previous) availability scope.
      for (const exclusionText of exclusionTexts) {
        absorbExclusionSegment(exclusionText, lastAvailabilityDays);
      }
    }

    if (rules.length === 0 && timeExclusions.length === 0) {
      const fallback = parseClause(recurringSource, raw);
      if (fallback) rules.push(fallback);
    }

    if (rules.length === 0 && timeExclusions.length === 0) {
      const range = extractTimeRange(text);
      if (range) {
        rules.push({
          kind: hasWeekdays(text)
            ? "specific_days"
            : hasWeekends(text)
              ? "specific_days"
              : "between_times",
          days: daysForClause(text),
          start: range.start,
          end: range.end,
          raw,
        });
      } else if (
        hasAnytimePhrase(text) &&
        !hasWeekdays(text) &&
        !hasWeekends(text)
      ) {
        rules.push({
          kind: "fully_flexible",
          start: tod(0),
          end: tod(0),
          raw,
        });
      } else if (hasFlexiblePhrase(text)) {
        rules.push({
          kind: "broad",
          start: tod(8),
          end: tod(22),
          raw,
        });
      }
    }
  }

  const excludedDays = ALL_DAYS.filter((d) => excludedDaySet.has(d));

  const exceptionSeen = new Set<string>();
  const exceptions: ExceptionDate[] = [];
  for (const ex of [...exclusionExceptions, ...baseExceptions]) {
    const key = `${ex.date}:${ex.type}`;
    if (exceptionSeen.has(key)) continue;
    exceptionSeen.add(key);
    exceptions.push(ex);
  }

  // Fallback defaults only when nothing else was understood.
  if (
    rules.length === 0 &&
    timeExclusions.length === 0 &&
    exceptions.length === 0 &&
    excludedDays.length === 0
  ) {
    rules.push(
      {
        kind: "between_times",
        days: WEEKDAYS,
        start: tod(17),
        end: tod(22),
        raw,
      },
      {
        kind: "weekends_anytime",
        days: WEEKENDS,
        start: tod(10),
        end: tod(22),
        raw,
      }
    );
  }

  // Apply recurring day exclusions to the base schedule.
  rules = applyExcludedDays(rules, excludedDays);

  // Specific day rules override broader recurring rules (no overlapping days).
  rules = normalizeOverlappingRules(rules);

  // Punch time-range exclusions into the resolved schedule (never as availability).
  rules = applyTimeExclusions(rules, timeExclusions);

  const preferences: AvailabilityPreference[] = [];
  const preferredBut = extractPreferredFromBut(text);
  if (preferredBut) preferences.push(preferredBut);

  const flexibility: FlexibilityLevel = rules.every(
    (r) =>
      r.kind === "fully_flexible" ||
      r.kind === "anytime" ||
      r.kind === "broad" ||
      isFullDayTimes(r.start, r.end)
  )
    ? "high"
    : rules.some(
          (r) => isFullDayTimes(r.start, r.end) || r.kind === "weekends_anytime"
        )
      ? "medium"
      : "medium";

  const confirmation = buildConfirmation(
    rules,
    exceptions,
    excludedDays,
    timeExclusions
  );
  return {
    rules,
    preferences,
    flexibility,
    exceptions,
    ...confirmation,
  };
}

/** Back-compat: hard availability rules only. */
export function parseAvailability(input: string): AvailabilityRule[] {
  return parseAvailabilityInput(input).rules;
}

export function parseException(
  input: string,
  referenceYear = new Date().getFullYear()
): ExceptionDate | null {
  const extracted = extractExceptionsFromText(input, DateTime.local().set({
    year: referenceYear,
  }));
  if (extracted.exceptions.length > 0) return extracted.exceptions[0];

  const abs = parseAbsoluteDate(input.toLowerCase(), referenceYear);
  if (!abs) return null;
  const text = input.toLowerCase();
  const free = /\bfree\b|\bavailable\b/.test(text);
  const unavailable =
    /\bunavailable\b|\bcannot\b|\bcan't\b|\bbusy\b|\bout\b|\bexcept\b|\bnot\b/.test(
      text
    );
  return {
    date: abs.date,
    type: unavailable && !free ? "unavailable" : free ? "free_all_day" : "unavailable",
    label: input.trim(),
  };
}

export function describeRules(rules: AvailabilityRule[]): string {
  if (rules.length === 0) return "No availability parsed yet";
  return rules.map(formatRulePhrase).join(" · ");
}

export function describeParsedAvailability(parsed: ParsedAvailability): string {
  return parsed.summary;
}

export function hourInWindow(
  hour: number,
  minute: number,
  start: TimeOfDay,
  end: TimeOfDay
): boolean {
  const m = hour * 60 + minute;
  const s = start.hour * 60 + start.minute;
  const e = end.hour * 60 + end.minute;
  if (e === s) return true;
  if (e < s) return m >= s || m < e;
  return m >= s && m < e;
}

export function isFullDayRule(rule: AvailabilityRule): boolean {
  return (
    rule.kind === "fully_flexible" ||
    rule.kind === "anytime" ||
    isFullDayTimes(rule.start, rule.end)
  );
}

export function ruleKindLabel(kind: AvailabilityKind): string {
  switch (kind) {
    case "fully_flexible":
    case "anytime":
      return "fully flexible";
    case "broad":
      return "broad";
    default:
      return kind.replace(/_/g, " ");
  }
}
