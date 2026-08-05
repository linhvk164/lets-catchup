# One Postcard Away

A mobile-first web app that helps people across different time zones find a good time to connect — and seals it with a digital postcard.

## Philosophy

Not a corporate scheduling tool. An invitation across distance. The postcard is the central object.

## MVP flow

1. **Landing** — concept + create CTA
2. **Create** — compose a postcard (photo, name, title, timezone, availability)
3. **Share link** — friends open the postcard invitation
4. **Join** — add availability (any number of participants)
5. **Results** — recommended times on the postcard (+ view all)
6. **Confirm** — selected time stamped on the postcard

## Postcard photos

Default photography lives in [`public/images/postcards/`](./public/images/postcards/).
Add Connie Kang (or other) photos there and register them in `src/lib/photos.ts`.

## Tech

- Next.js (App Router) + React + TypeScript + Tailwind CSS
- Luxon for timezones
- Local storage + URL-encoded state (no accounts, no API)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deploy to Vercel as a standard Next.js app.
