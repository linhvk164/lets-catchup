import { DateTime } from "luxon";
import type { TimezoneInfo } from "./types";
import { CITY_TIMEZONE_SEEDS, type CityTimezoneSeed } from "./timezone-cities";

export interface TimezoneEntry {
  timezone: string;
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  aliases: string[];
  /** True when this row is a curated city, not a raw IANA fallback */
  curated: boolean;
}

const ABBREV_MAP: Record<string, string[]> = {
  est: ["America/Toronto", "America/New_York", "America/Montreal"],
  edt: ["America/Toronto", "America/New_York", "America/Montreal"],
  cst: ["America/Chicago", "America/Winnipeg"],
  cdt: ["America/Chicago", "America/Winnipeg"],
  mst: ["America/Denver", "America/Phoenix", "America/Edmonton"],
  mdt: ["America/Denver", "America/Edmonton"],
  pst: ["America/Los_Angeles", "America/Vancouver"],
  pdt: ["America/Los_Angeles", "America/Vancouver"],
  gmt: ["Europe/London", "Europe/Dublin", "UTC"],
  bst: ["Europe/London"],
  cet: ["Europe/Paris", "Europe/Berlin", "Europe/Amsterdam", "Europe/Rome", "Europe/Madrid"],
  cest: ["Europe/Paris", "Europe/Berlin", "Europe/Amsterdam", "Europe/Rome", "Europe/Madrid"],
  jst: ["Asia/Tokyo"],
  kst: ["Asia/Seoul"],
  ist: ["Asia/Kolkata", "Asia/Jerusalem", "Europe/Dublin"],
  ict: ["Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Saigon"],
  aest: ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane"],
  aedt: ["Australia/Sydney", "Australia/Melbourne"],
  nzst: ["Pacific/Auckland"],
  nzdt: ["Pacific/Auckland"],
  utc: ["UTC"],
};

function titleCase(raw: string): string {
  return raw.replace(/_/g, " ");
}

function seedToEntry(seed: CityTimezoneSeed): TimezoneEntry {
  return {
    timezone: seed.timezone,
    city: seed.city,
    country: seed.country,
    countryCode: seed.countryCode,
    flag: seed.flag,
    aliases: seed.aliases ?? [],
    curated: true,
  };
}

function ianaFallbackEntry(timezone: string): TimezoneEntry {
  const parts = timezone.split("/");
  const city = titleCase(parts[parts.length - 1] ?? timezone);
  const region = parts[0] ?? "";
  return {
    timezone,
    city,
    country: region,
    countryCode: "",
    flag: "🌍",
    aliases: [timezone.toLowerCase(), city.toLowerCase()],
    curated: false,
  };
}

function resolveVietnamTimezone(): string {
  const supported =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? new Set(Intl.supportedValuesOf("timeZone") as string[])
      : null;
  if (!supported || supported.has("Asia/Ho_Chi_Minh")) return "Asia/Ho_Chi_Minh";
  if (supported.has("Asia/Saigon")) return "Asia/Saigon";
  return "Asia/Bangkok";
}

function buildCatalog(): TimezoneEntry[] {
  const vietnamTz = resolveVietnamTimezone();
  const entries: TimezoneEntry[] = [];

  for (const seed of CITY_TIMEZONE_SEEDS) {
    const timezone =
      seed.timezone === "Asia/Ho_Chi_Minh" || seed.timezone === "Asia/Saigon"
        ? vietnamTz
        : seed.timezone;
    const entry = seedToEntry({ ...seed, timezone });
    entries.push(entry);
  }

  const supported =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl.supportedValuesOf("timeZone") as string[])
      : [];

  for (const timezone of supported) {
    const already = entries.some((e) => e.timezone === timezone && e.curated);
    if (already) continue;
    entries.push(ianaFallbackEntry(timezone));
  }

  return entries;
}

let CATALOG: TimezoneEntry[] | null = null;

function catalog(): TimezoneEntry[] {
  if (!CATALOG) CATALOG = buildCatalog();
  return CATALOG;
}

export function getOffsetLabel(timezone: string, at = DateTime.utc()): string {
  try {
    const mins = at.setZone(timezone).offset;
    if (mins === 0) return "GMT+0";
    const sign = mins > 0 ? "+" : "-";
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m === 0 ? `GMT${sign}${h}` : `GMT${sign}${h}:${String(m).padStart(2, "0")}`;
  } catch {
    return "GMT";
  }
}

export function getAbbreviation(timezone: string, at = DateTime.utc()): string {
  try {
    const dt = at.setZone(timezone);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(dt.toJSDate());
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    if (name && !/^GMT|[+-]\d/.test(name)) return name;
    return getOffsetLabel(timezone, at);
  } catch {
    return getOffsetLabel(timezone, at);
  }
}

export function entryToInfo(entry: TimezoneEntry): TimezoneInfo {
  return {
    timezone: entry.timezone,
    cityLabel: entry.city,
    countryCode: entry.countryCode || undefined,
    countryLabel: entry.country,
    flagEmoji: entry.flag,
    abbreviation: getAbbreviation(entry.timezone),
    offsetLabel: getOffsetLabel(entry.timezone),
  };
}

export function getTimezoneInfo(timezone: string): TimezoneInfo {
  const curated = catalog().find((e) => e.timezone === timezone && e.curated);
  if (curated) return entryToInfo(curated);
  const any = catalog().find((e) => e.timezone === timezone);
  if (any) return entryToInfo(any);
  return {
    timezone,
    cityLabel: titleCase(timezone.split("/").pop() ?? timezone),
    abbreviation: getAbbreviation(timezone),
    offsetLabel: getOffsetLabel(timezone),
  };
}

export function detectTimezone(): TimezoneInfo {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return getTimezoneInfo(timezone);
}

export function formatTimezoneLabel(info: TimezoneInfo): string {
  const place = info.countryLabel
    ? `${info.cityLabel}, ${info.countryLabel}`
    : info.cityLabel;
  return info.flagEmoji ? `${place} ${info.flagEmoji}` : place;
}

export function formatTimezoneResult(info: TimezoneInfo): {
  primary: string;
  secondary: string;
  tertiary: string;
} {
  const primary = formatTimezoneLabel(info);
  const abbr = info.abbreviation ?? getAbbreviation(info.timezone);
  const offset = info.offsetLabel ?? getOffsetLabel(info.timezone);
  const secondary =
    abbr.startsWith("GMT") || abbr === offset ? offset : `${abbr} (${offset})`;
  return {
    primary,
    secondary,
    tertiary: info.timezone,
  };
}

/** Flexible search across curated cities and the full IANA timezone set. */
export function searchTimezones(query: string, limit = 12): TimezoneInfo[] {
  const q = query.trim().toLowerCase();
  const all = catalog();

  if (!q) {
    return all.filter((e) => e.curated).slice(0, limit).map(entryToInfo);
  }

  const abbrevHits = new Set(ABBREV_MAP[q] ?? []);
  const scored: { entry: TimezoneEntry; score: number }[] = [];

  for (const entry of all) {
    let score = 0;
    const city = entry.city.toLowerCase();
    const country = entry.country.toLowerCase();
    const tz = entry.timezone.toLowerCase();

    if (city === q) score += 120;
    else if (city.startsWith(q)) score += 90;
    else if (city.includes(q)) score += 55;

    if (country === q) score += 95;
    else if (country.startsWith(q)) score += 70;
    else if (country.includes(q)) score += 40;

    if (entry.aliases.some((a) => a === q)) score += 100;
    else if (entry.aliases.some((a) => a.startsWith(q))) score += 65;
    else if (entry.aliases.some((a) => a.includes(q))) score += 35;

    if (tz.includes(q.replace(/\s+/g, "_"))) score += 45;
    if (abbrevHits.has(entry.timezone)) score += 80;

    try {
      const offset = getOffsetLabel(entry.timezone).toLowerCase();
      const abbr = getAbbreviation(entry.timezone).toLowerCase();
      if (offset === q || offset.includes(q)) score += 50;
      if (abbr === q) score += 75;
    } catch {
      /* skip invalid zones */
    }

    if (score === 0) continue;
    if (entry.curated) score += 8;
    scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.city.localeCompare(b.entry.city))
    .slice(0, limit)
    .map(({ entry }) => entryToInfo(entry));
}

export const COMMON_TIMEZONES = CITY_TIMEZONE_SEEDS.map((e) => e.timezone);

export function formatLocalTime(
  utcIso: string,
  timezone: string,
  opts?: { includeDate?: boolean }
): string {
  const dt = DateTime.fromISO(utcIso, { zone: "utc" }).setZone(timezone);
  if (opts?.includeDate) {
    return dt.toFormat("ccc, LLL d · h:mm a");
  }
  return dt.toFormat("h:mm a");
}

export function formatSlotDate(utcIso: string, timezone: string): string {
  return DateTime.fromISO(utcIso, { zone: "utc" })
    .setZone(timezone)
    .toFormat("cccc, LLLL d");
}

export function localHour(utcIso: string, timezone: string): number {
  return DateTime.fromISO(utcIso, { zone: "utc" }).setZone(timezone).hour;
}

export function timeOfDayEmoji(hour: number): string {
  if (hour >= 5 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 17) return "🌤";
  if (hour >= 17 && hour < 21) return "🌆";
  return "🌙";
}
