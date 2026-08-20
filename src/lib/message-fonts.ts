export const MESSAGE_FONTS = [
  {
    id: "schoolbell",
    label: "Schoolbell",
    cssVar: "--font-schoolbell",
    /** Reference handwriting face. Other scales are relative to this. */
    sizeScale: 1,
  },
  {
    id: "sedgwick-ave",
    label: "Sedgwick Ave",
    cssVar: "--font-sedgwick-ave",
    // Bold graffiti caps read larger at the same CSS size.
    sizeScale: 0.86,
  },
  {
    id: "birthstone-bounce",
    label: "Birthstone Bounce",
    cssVar: "--font-birthstone-bounce",
    // Tall flourishes and caps dominate unless scaled down.
    sizeScale: 0.74,
  },
  {
    id: "gaegu",
    label: "Gaegu",
    cssVar: "--font-gaegu",
    // Slightly open round forms; nearly matches Schoolbell.
    sizeScale: 0.96,
  },
  {
    id: "gamja-flower",
    label: "Gamja Flower",
    cssVar: "--font-gamja-flower",
    // Small x-height and light strokes look undersized without a bump.
    sizeScale: 1.15,
  },
  {
    id: "homemade-apple",
    label: "Homemade Apple",
    cssVar: "--font-homemade-apple",
    // Chunky script with tall capitals; pull back a bit.
    sizeScale: 0.84,
  },
] as const;

export type MessageFontId = (typeof MESSAGE_FONTS)[number]["id"];

export const DEFAULT_MESSAGE_FONT: MessageFontId = MESSAGE_FONTS[0].id;

export function isMessageFontId(value: unknown): value is MessageFontId {
  return MESSAGE_FONTS.some((font) => font.id === value);
}

export function resolveMessageFontId(
  value?: string | null
): MessageFontId {
  return isMessageFontId(value) ? value : DEFAULT_MESSAGE_FONT;
}

export function getMessageFont(id?: string | null) {
  const resolved = resolveMessageFontId(id);
  return MESSAGE_FONTS.find((font) => font.id === resolved) ?? MESSAGE_FONTS[0];
}

export function nextMessageFontId(current?: string | null): MessageFontId {
  const resolved = resolveMessageFontId(current);
  const index = MESSAGE_FONTS.findIndex((font) => font.id === resolved);
  const next = MESSAGE_FONTS[(index + 1) % MESSAGE_FONTS.length];
  return next.id;
}

export function messageFontFamily(id?: string | null): string {
  const font = getMessageFont(id);
  return `var(${font.cssVar}), "Segoe Print", cursive`;
}

/** Font-specific scale so faces share a similar perceived size. */
export function messageFontSizeScale(id?: string | null): number {
  return getMessageFont(id).sizeScale;
}

/**
 * Apply a font's sizeScale to a base (viewport) pixel size.
 * Keeps a readable floor so tiny viewports stay usable.
 */
export function messageFontSizePx(
  basePx: number,
  id?: string | null,
  minPx = 10
): number {
  return Math.max(minPx, Math.round(basePx * messageFontSizeScale(id) * 10) / 10);
}
