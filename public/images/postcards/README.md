# Postcard photography

Place default postcard photos in this folder.

## Naming convention

Use **lowercase kebab-case** with a short descriptive subject, and a lowercase web-friendly extension:

- `spanish-beach.jpg`
- `coastal-road.jpg`
- `seagulls.jpg`

Avoid spaces, uppercase extensions (`.JPG`), and raw camera formats (`.tif`). Prefer `.jpg` or `.webp`, max long edge ~2400px for the web.

## For Connie Kang (and other photographers)

1. Add image files here following the naming convention above.
2. Register each photo in `src/lib/photos.ts` with:
   - `src`: `/images/postcards/your-file.jpg`
   - `caption`: short title (e.g. `"Spanish Beach"`)
   - `credit`: e.g. `"Photography by Connie Kang"`

## Orientation

Vertical / portrait crops work best (about 3:4), since the postcard front is tall. Landscape photos still work via `object-cover`.
