/** Optional personal note on the postcard back. Empty means nothing is shown. */
export function resolvePostcardMessage(message?: string): string | null {
  const trimmed = message?.trim();
  return trimmed ? trimmed : null;
}

/** Shown in the message area while the create draft has no personal details yet. */
export const ENTER_DETAILS_HINT = "Enter details to see them appear here";

/** Rough capacity once the postcard message is at its smallest fitted font. */
const MESSAGE_TOO_LONG_CHARS = 90;
const MESSAGE_TOO_LONG_LINES = 4;

export const MESSAGE_TOO_LONG_HINT =
  "your message is too long, wanna call them instead? :D";

export function isPostcardMessageTooLong(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  const lines = text.split(/\n/).length;
  return text.length > MESSAGE_TOO_LONG_CHARS || lines > MESSAGE_TOO_LONG_LINES;
}
