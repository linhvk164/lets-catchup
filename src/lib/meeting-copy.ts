import type { MeetingSlot } from "./types";

export function formatUnavailableSentence(names: string[]): string | null {
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) {
    return `${cleaned[0]} isn't available at this time.`;
  }
  if (cleaned.length === 2) {
    return `${cleaned[0]} and ${cleaned[1]} aren't available at this time.`;
  }
  const last = cleaned[cleaned.length - 1];
  const head = cleaned.slice(0, -1).join(", ");
  return `${head}, and ${last} aren't available at this time.`;
}

export function formatAvailableCount(slot: MeetingSlot): string {
  return `${slot.availableCount} of ${slot.totalCount} people available`;
}

/** Partial-overlap subheader under the recommended date. */
export function formatAvailableCountPrompt(slot: MeetingSlot): string {
  return `${formatAvailableCount(slot)}. Try adjusting the time!`;
}
