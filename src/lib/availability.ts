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

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export interface ParsedAvailability {
  rules: AvailabilityRule[];
  preferences: AvailabilityPreference[];
  flexibility: FlexibilityLevel;
  /** Short confirmation reflecting exact parsed rules. */
  summary: string;
  /** Extra trust line. */
  detail: string;
  /** Development-friendly breakdown of what was parsed. */
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
    /\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday|r)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/g
  );
  if (!tokens) return [];
  for (const token of tokens) {
    const day = DAY_ALIASES[token];
    if (day) found.add(day);
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

function daysForClause(text: string): DayOfWeek[] | undefined {
  if (hasWeekdays(text)) return [...WEEKDAYS];
  if (hasWeekends(text)) return [...WEEKENDS];
  const specific = extractDays(text);
  return specific.length > 0 ? specific : undefined;
}

function splitClauses(raw: string): string[] {
  // Prefer sentence boundaries so "10 am to 5 pm on weekdays" stays one clause.
  return raw
    .split(/(?<=[.!?])\s+|\n+|;\s+/)
    .map((c) => c.trim().replace(/^[.,;]+|[.,;]+$/g, "").trim())
    .filter((c) => c.length > 0);
}

function formatDayGroup(days?: DayOfWeek[]): string {
  if (!days || days.length === 0) return "Every day";
  if (days.length === 5 && WEEKDAYS.every((d) => days.includes(d))) return "Mon–Fri";
  if (days.length === 2 && WEEKENDS.every((d) => days.includes(d))) return "Sat–Sun";
  return days.map((d) => DAY_SHORT[d]).join(", ");
}

function formatRuleDebug(rule: AvailabilityRule): string {
  const days = formatDayGroup(rule.days);
  if (isFullDayRule(rule) || isFullDayTimes(rule.start, rule.end)) {
    return `${days}: All day`;
  }
  if (rule.start && rule.end) {
    return `${days}: ${formatClock(rule.start)} – ${formatClock(rule.end)}`;
  }
  if (rule.start) {
    return `${days}: After ${formatClock(rule.start)}`;
  }
  return `${days}: ${rule.kind}`;
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
      return describeRules([rule]);
  }
}

function buildConfirmation(
  rules: AvailabilityRule[],
  _preferences: AvailabilityPreference[]
): { summary: string; detail: string; debugLines: string[] } {
  const debugLines = rules.map(formatRuleDebug);
  return {
    summary: "Got it! To summarize:",
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

  // 1. Exact time ranges win
  if (range) {
    return {
      kind: days
        ? hasWeekends(text) && days.every((d) => WEEKENDS.includes(d))
          ? "weekends_anytime"
          : "specific_days"
        : "between_times",
      days,
      start: range.start,
      end: range.end,
      raw: rawFull,
    };
  }

  // 2. Explicit "after <clock time>"
  if (after) {
    return {
      kind: days ? "weekdays_after" : "after_time",
      days: days ?? (hasWeekdays(text) ? WEEKDAYS : undefined),
      start: after,
      end: tod(23),
      raw: rawFull,
    };
  }

  // 3. Anytime / all day (only when said)
  if (anytime) {
    return {
      kind: days
        ? hasWeekends(text)
          ? "weekends_anytime"
          : "all_day"
        : "fully_flexible",
      days,
      start: tod(0),
      end: tod(0),
      raw: rawFull,
    };
  }

  // 4. Vague flexible language (no exact times)
  if (flexible && !days) {
    return {
      kind: "broad",
      start: tod(8),
      end: tod(22),
      raw: rawFull,
    };
  }

  // 5. Categories only when user used vague words (no exact times)
  if (/\bafter\s+work\b|\bafter\s+hours?\b|\bafter\s+dinner\b/.test(text)) {
    return {
      kind: "weekdays_after",
      days: days ?? WEEKDAYS,
      start: tod(17),
      end: tod(23),
      raw: rawFull,
    };
  }

  if (/\bevenings?\b/.test(text)) {
    return {
      kind: "evenings",
      days,
      start: tod(17),
      end: tod(22),
      raw: rawFull,
    };
  }

  if (/\bmornings?\b|\bbefore\s+noon\b/.test(text)) {
    return {
      kind: "mornings",
      days,
      start: tod(6),
      end: tod(12),
      raw: rawFull,
    };
  }

  if (/\bafternoons?\b/.test(text)) {
    return {
      kind: "afternoons",
      days,
      start: tod(12),
      end: tod(17),
      raw: rawFull,
    };
  }

  if (/\blate\s+nights?\b|\bnight\s*owl\b/.test(text)) {
    return {
      kind: "nights",
      days,
      start: tod(20),
      end: tod(2),
      raw: rawFull,
    };
  }

  // Day-only mention without times (e.g. leftover "on weekends") — skip; other clause handles it
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

/**
 * Deterministic natural-language availability parser.
 * Exact times always win over vague categories. Multiple clauses stay separate.
 */
export function parseAvailabilityInput(input: string): ParsedAvailability {
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
      summary: "Got it! To summarize:",
      detail: "",
      debugLines: confirmation.debugLines,
    };
  }

  const text = raw.toLowerCase();
  const clauses = splitClauses(raw);
  const rules: AvailabilityRule[] = [];

  for (const clause of clauses) {
    const rule = parseClause(clause, raw);
    if (rule) rules.push(rule);
  }

  // Whole-string fallback if clause splitting missed a combined phrase
  if (rules.length === 0) {
    const fallback = parseClause(raw, raw);
    if (fallback) rules.push(fallback);
  }

  // Still nothing: try whole-string exact range / anytime / categories
  if (rules.length === 0) {
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
    } else if (hasAnytimePhrase(text) && !hasWeekdays(text) && !hasWeekends(text)) {
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
    } else {
      // Ambiguous: keep a useful default without pretending the user said "after work"
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
  }

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
    : rules.some((r) => isFullDayTimes(r.start, r.end) || r.kind === "weekends_anytime")
      ? "medium"
      : "medium";

  const confirmation = buildConfirmation(rules, preferences);
  return {
    rules,
    preferences,
    flexibility,
    ...confirmation,
  };
}

/** Back-compat: hard availability rules only. */
export function parseAvailability(input: string): AvailabilityRule[] {
  return parseAvailabilityInput(input).rules;
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

export function parseException(
  input: string,
  referenceYear = new Date().getFullYear()
): ExceptionDate | null {
  const raw = input.trim();
  if (!raw) return null;

  const text = raw.toLowerCase();
  const unavailable = /\bunavailable\b|\bcannot\b|\bcan't\b|\bbusy\b|\bout\b/.test(text);
  const free = /\bfree\b|\bavailable\b/.test(text);

  const dateMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b/i
  );

  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);

  let year = referenceYear;
  let month = 0;
  let day = 0;

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (dateMatch) {
    month = MONTHS[dateMatch[1].toLowerCase()];
    day = Number(dateMatch[2]);
    if (dateMatch[3]) year = Number(dateMatch[3]);
  } else {
    return null;
  }

  if (!month || !day || day < 1 || day > 31) return null;

  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    date,
    type: unavailable ? "unavailable" : free ? "free_all_day" : "unavailable",
    label: raw,
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
