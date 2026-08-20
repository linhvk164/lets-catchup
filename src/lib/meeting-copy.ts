import type { MeetingSlot } from "./types";

/** "Jenny isn't available" / "Sarah and Alex aren't available" (no trailing period). */
export function formatUnavailableClause(names: string[]): string | null {
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) {
    return `${cleaned[0]} isn't available`;
  }
  if (cleaned.length === 2) {
    return `${cleaned[0]} and ${cleaned[1]} aren't available`;
  }
  const last = cleaned[cleaned.length - 1];
  const head = cleaned.slice(0, -1).join(", ");
  return `${head}, and ${last} aren't available`;
}

/** Full sentence used when listing who is missing. */
export function formatUnavailableSentence(names: string[]): string | null {
  const clause = formatUnavailableClause(names);
  return clause ? `${clause} at this time.` : null;
}

/** Partial-overlap note under the city list. */
export function formatAvailableCountPrompt(slot: MeetingSlot): string | null {
  const clause = formatUnavailableClause(slot.unavailableNames ?? []);
  if (!clause) return null;
  return `${clause} at this time. Try adjusting availabilities!`;
}
