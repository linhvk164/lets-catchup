import type { PostcardPhoto } from "./types";

/**
 * Default postcard photography catalog.
 *
 * Place Connie Kang (and other) photos in:
 *   /public/images/postcards/
 *
 * Then register them here with caption + credit metadata.
 * Preferred formats: .jpg / .webp, portrait-friendly ~3:4 or 4:5.
 */
export const DEFAULT_POSTCARD_PHOTOS: PostcardPhoto[] = [
  {
    src: "/images/postcards/default-horizon.svg",
    caption: "Across the Horizon",
    credit: "Photography by Connie Kang",
  },
  {
    src: "/images/postcards/default-harbour.svg",
    caption: "Harbour Light",
    credit: "Photography by Connie Kang",
  },
  {
    src: "/images/postcards/default-lantern.svg",
    caption: "Evening Lanterns",
    credit: "Photography by Connie Kang",
  },
];

export function getDefaultPhoto(index = 0): PostcardPhoto {
  return DEFAULT_POSTCARD_PHOTOS[index % DEFAULT_POSTCARD_PHOTOS.length];
}

export function resolvePhotoSrc(photo?: PostcardPhoto): string {
  if (photo?.dataUrl) return photo.dataUrl;
  if (photo?.src) return photo.src;
  return getDefaultPhoto().src;
}
