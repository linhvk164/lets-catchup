import type { LocalTimeDisplay } from "./types";

function cityKey(cityLabel: string): string {
  return cityLabel.trim().toLowerCase();
}

/**
 * One row per city for location/time lists.
 * Keeps participant data intact; only collapses presentation duplicates.
 * Same city name merges even if multiple people share it. Different cities
 * stay separate even when they share a timezone.
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
    if (!key || byCity.has(key)) continue;
    byCity.set(key, place);
  }

  return [...byCity.values()];
}
