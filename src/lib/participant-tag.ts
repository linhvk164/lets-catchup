/** Preset postcard name-tag colors (physical label palette). */
export const PARTICIPANT_TAG_COLORS = [
  "#C46040",
  "#F5D244",
  "#7FB0E8",
  "#D6D35E",
  "#888E46",
  "#F29CC3",
  "#FFBFBF",
  "#008371",
  "#D0CBEB",
] as const;

export type ParticipantTagColor = (typeof PARTICIPANT_TAG_COLORS)[number];

const DARK_TEXT = "#1e3340";
const LIGHT_TEXT = "#f8f4ec";

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function isParticipantTagColor(value: unknown): value is ParticipantTagColor {
  return (
    typeof value === "string" &&
    (PARTICIPANT_TAG_COLORS as readonly string[]).includes(value)
  );
}

/** Random preset for a newly created participant (persisted on the participant). */
export function pickRandomParticipantTagColor(): ParticipantTagColor {
  const index = Math.floor(Math.random() * PARTICIPANT_TAG_COLORS.length);
  return PARTICIPANT_TAG_COLORS[index]!;
}

/** Stable fallback from id/name when an older invite has no stored color. */
export function participantTagColorFromSeed(seed: string): ParticipantTagColor {
  return PARTICIPANT_TAG_COLORS[hashSeed(seed) % PARTICIPANT_TAG_COLORS.length]!;
}

export function resolveParticipantTagColor(input: {
  id: string;
  name?: string;
  tagColor?: string | null;
}): ParticipantTagColor {
  if (isParticipantTagColor(input.tagColor)) return input.tagColor;
  return participantTagColorFromSeed(input.id || input.name || "guest");
}

function srgbChannel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const r = srgbChannel(rgb.r);
  const g = srgbChannel(rgb.g);
  const b = srgbChannel(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Pick dark or light text for a tag background for WCAG AA-friendly contrast.
 */
export function contrastingTagTextColor(backgroundHex: string): string {
  const bg = relativeLuminance(backgroundHex);
  const darkContrast = contrastRatio(bg, relativeLuminance(DARK_TEXT));
  const lightContrast = contrastRatio(bg, relativeLuminance(LIGHT_TEXT));
  return darkContrast >= lightContrast ? DARK_TEXT : LIGHT_TEXT;
}
