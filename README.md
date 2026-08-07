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
- Upstash Redis for shared invite storage (short `/catchup/[id]` links)
- Browser local storage as a client cache (no accounts)

## Backend setup

1. Create a free Redis database at [Upstash Console](https://console.upstash.com).
2. Copy the REST URL and token into `.env.local` (see [`.env.example`](./.env.example)):

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Invites are stored as full JSON documents with a ~90-day TTL refreshed on each update. The free tier is usually enough for early / portfolio use; watch Upstash command and storage limits if traffic grows.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deploy to Vercel as a standard Next.js app. Add the Upstash env vars in the project settings.
