export const MESSAGE_FONTS = [
  { id: "schoolbell", label: "Schoolbell", cssVar: "--font-schoolbell" },
  { id: "sedgwick-ave", label: "Sedgwick Ave", cssVar: "--font-sedgwick-ave" },
  {
    id: "sue-ellen-francisco",
    label: "Sue Ellen Francisco",
    cssVar: "--font-sue-ellen-francisco",
  },
  {
    id: "birthstone-bounce",
    label: "Birthstone Bounce",
    cssVar: "--font-birthstone-bounce",
  },
  {
    id: "butterfly-kids",
    label: "Butterfly Kids",
    cssVar: "--font-butterfly-kids",
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
