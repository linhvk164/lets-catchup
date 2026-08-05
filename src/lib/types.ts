export type DurationMinutes = 15 | 30 | 45 | 60;

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type AvailabilityKind =
  | "fully_flexible"
  | "broad"
  | "weekdays_after"
  | "weekends_anytime"
  | "specific_days"
  | "all_day"
  | "after_time"
  | "between_times"
  | "mornings"
  | "afternoons"
  | "evenings"
  | "nights"
  /** @deprecated use fully_flexible */
  | "anytime";

export type FlexibilityLevel = "high" | "medium" | "low";

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export interface AvailabilityRule {
  kind: AvailabilityKind;
  start?: TimeOfDay;
  end?: TimeOfDay;
  days?: DayOfWeek[];
  /** Display preference from the user's words, e.g. "After work". */
  label?: string;
  raw: string;
}

/** Soft preference windows used for ranking, not hard constraints. */
export interface AvailabilityPreference {
  start: TimeOfDay;
  end: TimeOfDay;
  days?: DayOfWeek[];
  label?: string;
}

export interface ExceptionDate {
  date: string;
  type: "unavailable" | "free_all_day";
  label: string;
}

export interface PostcardPhoto {
  /** Path under /public, e.g. /images/postcards/paris-sunset.jpg */
  src: string;
  caption: string;
  credit: string;
  /** Optional data URL for a user-uploaded photo (local only; not shared via URL) */
  dataUrl?: string;
}

export interface Participant {
  id: string;
  name: string;
  timezone: string;
  cityLabel: string;
  countryCode?: string;
  countryLabel?: string;
  flagEmoji?: string;
  availabilityText: string;
  rules: AvailabilityRule[];
  /** Soft preferences for ranking (may be empty). */
  preferences?: AvailabilityPreference[];
  flexibility?: FlexibilityLevel;
  exceptions: ExceptionDate[];
  isCreator?: boolean;
}

export interface CatchUp {
  id: string;
  title: string;
  /** Personal note on the postcard back */
  message?: string;
  /** Handwriting font for the postcard message */
  messageFont?: string;
  duration: DurationMinutes;
  createdAt: string;
  participants: Participant[];
  selectedSlotId?: string;
  photo?: PostcardPhoto;
}

export interface LocalTimeDisplay {
  participantId: string;
  name: string;
  timezone: string;
  cityLabel: string;
  flagEmoji?: string;
  timeLabel: string;
  hour: number;
}

export interface MeetingSlot {
  id: string;
  startUtc: string;
  endUtc: string;
  score: number;
  label: string;
  localTimes: LocalTimeDisplay[];
}

export interface TimezoneInfo {
  timezone: string;
  cityLabel: string;
  countryCode?: string;
  countryLabel?: string;
  flagEmoji?: string;
  abbreviation?: string;
  offsetLabel?: string;
}
