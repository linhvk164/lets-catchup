/** Optional personal note on the postcard back. Empty means nothing is shown. */
export function resolvePostcardMessage(message?: string): string | null {
  const trimmed = message?.trim();
  return trimmed ? trimmed : null;
}
