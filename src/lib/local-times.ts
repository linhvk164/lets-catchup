import type { LocalTimeDisplay, Participant } from "./types";

function cityKey(cityLabel: string): string {
  return cityLabel.trim().toLowerCase();
}

/**
 * One row per city for location/time lists.
 * Keeps participant data intact; only collapses presentation duplicates.
 * Same city name merges even if multiple people share it. Different cities
 * stay separate even when they share a timezone.
 * If anyone in a city is unavailable for the proposed slot, the row is marked
 * available: false so the UI can show a (proposed) tag.
 */
export function uniqueLocalTimesByCity(
  localTimes: LocalTimeDisplay[]
): LocalTimeDisplay[] {
  const byCity = new Map<string, LocalTimeDisplay>();

  const sorted = [...localTimes].sort(
    (a, b) => a.hour - b.hour || a.cityLabel.localeCompare(b.cityLabel)
  );

  for (const place of sorted) {
    const key = cityKey(place.cityLabel);
    if (!key) continue;
    const existing = byCity.get(key);
    if (!existing) {
      byCity.set(key, { ...place });
      continue;
    }
    if (place.available === false) {
      existing.available = false;
    }
  }

  return [...byCity.values()];
}

export interface CityParticipantGroup {
  cityKey: string;
  cityLabel: string;
  flagEmoji?: string;
  participants: Participant[];
}

/**
 * Group people under each distinct city for the postcard map.
 * Does not mutate participants; order is stable by first appearance then name.
 */
export function groupParticipantsByCity(
  participants: Participant[]
): CityParticipantGroup[] {
  const groups = new Map<string, CityParticipantGroup>();

  for (const person of participants) {
    const label = person.cityLabel?.trim();
    if (!label) continue;
    const key = cityKey(label);
    const existing = groups.get(key);
    if (existing) {
      existing.participants.push(person);
      if (!existing.flagEmoji && person.flagEmoji) {
        existing.flagEmoji = person.flagEmoji;
      }
    } else {
      groups.set(key, {
        cityKey: key,
        cityLabel: label,
        flagEmoji: person.flagEmoji,
        participants: [person],
      });
    }
  }

  for (const group of groups.values()) {
    group.participants.sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...groups.values()];
}
