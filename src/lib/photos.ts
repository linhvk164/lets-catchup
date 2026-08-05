import type { PostcardPhoto } from "./types";

/**
 * Default postcard photography catalog.
 *
 * Place Connie Kang (and other) photos in:
 *   /public/images/postcards/
 *
 * Then register them here with caption + credit metadata.
 * Preferred formats: .jpg / .webp, portrait-friendly ~3:4 or 4:5.
 * Naming: lowercase kebab-case (e.g. spanish-beach.jpg).
 */
export const DEFAULT_POSTCARD_PHOTOS: PostcardPhoto[] = [
  {
    src: "/images/postcards/spanish-beach.jpg",
    caption: "Spanish Beach",
    credit: "Photography by Connie Kang",
  },
  {
    src: "/images/postcards/coastal-road.jpg",
    caption: "Coastal Road",
    credit: "Photography by Connie Kang",
  },
  {
    src: "/images/postcards/seagulls.jpg",
    caption: "Seagulls",
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
