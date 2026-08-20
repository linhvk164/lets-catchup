import { DateTime } from "luxon";
import type { MeetingSlot } from "./types";

export interface SlotDateGroup {
  dateKey: string;
  dateLabel: string;
  slots: MeetingSlot[];
}

export interface SlotWeekdayGroup {
  weekday: number;
  weekdayLabel: string;
  dates: SlotDateGroup[];
}

function zoneForSlots(slots: MeetingSlot[]): string {
  return slots[0]?.localTimes[0]?.timezone ?? "UTC";
}

/**
 * Group recommended slots as weekday → dates → times (chronological).
 */
export function groupSlotsByWeekday(slots: MeetingSlot[]): SlotWeekdayGroup[] {
  if (slots.length === 0) return [];

  const zone = zoneForSlots(slots);
  const weekdayMap = new Map<
    number,
    { label: string; earliest: number; dates: Map<string, MeetingSlot[]> }
  >();

  for (const slot of slots) {
    const dt = DateTime.fromISO(slot.startUtc, { zone: "utc" }).setZone(zone);
    if (!dt.isValid) continue;
    const dateKey = dt.toISODate();
    if (!dateKey) continue;

    let weekdayEntry = weekdayMap.get(dt.weekday);
    if (!weekdayEntry) {
      weekdayEntry = {
        label: dt.toFormat("cccc"),
        earliest: dt.startOf("day").toMillis(),
        dates: new Map(),
      };
      weekdayMap.set(dt.weekday, weekdayEntry);
    } else {
      weekdayEntry.earliest = Math.min(
        weekdayEntry.earliest,
        dt.startOf("day").toMillis()
      );
    }

    const existing = weekdayEntry.dates.get(dateKey) ?? [];
    existing.push(slot);
    weekdayEntry.dates.set(dateKey, existing);
  }

  return [...weekdayMap.entries()]
    .sort((a, b) => a[1].earliest - b[1].earliest)
    .map(([weekday, entry]) => ({
      weekday,
      weekdayLabel: entry.label,
      dates: [...entry.dates.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, dateSlots]) => {
          const sample = DateTime.fromISO(dateSlots[0]!.startUtc, {
            zone: "utc",
          }).setZone(zone);
          return {
            dateKey,
            dateLabel: sample.toFormat("LLL d"),
            slots: [...dateSlots].sort((a, b) =>
              a.startUtc.localeCompare(b.startUtc)
            ),
          };
        }),
    }));
}

export function timeLabelForSlot(slot: MeetingSlot): string {
  const first = slot.localTimes[0];
  if (first?.timeLabel) return first.timeLabel;
  const zone = first?.timezone ?? "UTC";
  return DateTime.fromISO(slot.startUtc, { zone: "utc" })
    .setZone(zone)
    .toFormat("h:mm a");
}
