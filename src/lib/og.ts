/** Static Open Graph image (logo on landing background — not personalized). */
export const OG_DESCRIPTION = "Find a time to catch up, wherever you are.";
export const OG_IMAGE_PATH = "/images/og/postcard-invite.jpg";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** iMessage / link preview title — personalized with inviter name. */
export function catchupInviteTitle(fromName?: string | null): string {
  const name = fromName?.trim() || "someone special";
  return `Catchup invite from ${name}`;
}

export const SHARE_OG = {
  description: OG_DESCRIPTION,
  images: [
    {
      url: OG_IMAGE_PATH,
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: "Let's Catch-up",
    },
  ],
} as const;
