# Namaz Route

Namaz Route is a web-first MVP for travelers who need real jamaat information near their location or along a planned route. It combines nearby mosque discovery, route-aware filtering, Jummah visibility, and a QR-first update flow for mosque committees.

## Features

- Nearby mosque discovery using browser geolocation
- Google Maps list + map view
- Route mode using Google Directions and a 3 km route buffer
- Google Places discovery for mosques along route polylines
- Merge discovered mosques with internal DB jamaat intelligence
- Next jamaat computation with `Upcoming` and `Missed` state
- Jummah timings, remarks, verification badge, and update freshness
- QR-driven update page with no login
- Soft update protection: 3 updates per mosque per device per day
- Optional image upload support through Supabase Storage

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Google Maps JavaScript API
- Supabase for data and storage

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and add the required keys:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

Without Supabase keys the app falls back to built-in demo mosque data. Without a Google Maps key the map and route search show a configuration prompt instead of failing silently.

## Environment variables

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: required for live map rendering and route mode
- `GOOGLE_MAPS_SERVER_API_KEY`: optional server key for Places discovery (falls back to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- `NEXT_PUBLIC_SUPABASE_URL`: required for reading real mosque data
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: required for reading real mosque data
- `SUPABASE_SERVICE_ROLE_KEY`: required for QR updates and image uploads
- `SUPABASE_STORAGE_BUCKET`: optional, defaults to `mosque-images`
- `ADMIN_DASHBOARD_TOKEN`: required to access `/admin` mosque management API

## Suggested Supabase schema

```sql
create table if not exists mosques (
	id uuid primary key default gen_random_uuid(),
	place_id text unique,
	name text not null,
	latitude double precision not null,
	longitude double precision not null,
	address text not null,
	qr_token text not null unique,
	fajr text,
	zuhr text,
	asr text,
	maghrib text,
	isha text,
	juma1 text,
	juma2 text,
	remarks text,
	last_updated timestamptz not null default now(),
	is_verified boolean not null default false
);

create table if not exists mosque_images (
	id uuid primary key default gen_random_uuid(),
	mosque_id uuid not null references mosques(id) on delete cascade,
	image_url text not null,
	type text not null default 'general'
);

create table if not exists updates_log (
	id uuid primary key default gen_random_uuid(),
	mosque_id uuid not null references mosques(id) on delete cascade,
	updated_at timestamptz not null default now(),
	device_id text not null
);
```

## QR update flow

Each mosque should expose a QR URL like:

```txt
https://yourdomain.com/update/<qr_token>
```

The update page is prefilled and optimized for fast submission:

1. Scan the QR code.
2. Adjust the times.
3. Tap `Update all timings`.

## Admin dashboard

Open `/admin` to manage masjid update links and QR codes.

1. Set `ADMIN_DASHBOARD_TOKEN` in `.env.local`.
2. Enter the same token in the `/admin` page.
3. View all masjids with freshness (`updatedAgo` + exact date).
4. Copy each unique QR update link, or open edit directly.
5. Print/paste QR for masjid committee use.

## Route discovery merge behavior

- Route mode sends route polyline points to the backend.
- Backend discovers nearby mosques from Google Places (keyword `mosque`) near sampled route points.
- Places are deduplicated by `place_id`.
- Each discovered place is matched against DB by `place_id`, then by close lat/lng fallback.
- If matched: full jamaat timings and verification badges are shown.
- If unmatched: card shows `No jamaat data yet` with `Add timings` action.
- `Add timings` creates a DB mosque row (with nullable timings), generates a `qr_token`, and redirects to `/update/<qr_token>?edit=1`.

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add environment variables in Vercel Project Settings for all environments:

- `NEXT_PUBLIC_APP_URL` (preview URL for preview env, primary production URL for production env)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_MAPS_SERVER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `ADMIN_DASHBOARD_TOKEN`

4. Restrict Google API keys:

- Browser key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`): HTTP referrer restrictions to your Vercel domains.
- Server key (`GOOGLE_MAPS_SERVER_API_KEY`): no referrer restriction, API restrictions only to required server APIs.

5. Deploy and validate with the testing checklist below.

## Production readiness checklist

Before marking production live:

1. Security and secrets

- Confirm no real keys are committed in repository files.
- Use long random `ADMIN_DASHBOARD_TOKEN`.
- Rotate any previously exposed keys.

2. Supabase

- Create tables and indexes from schema.
- Enable Row Level Security where applicable.
- Ensure service-role key is used only on server routes.
- Verify storage bucket public/private policy matches your image needs.

3. Google APIs

- Enable only required APIs (Maps JS, Directions, Places).
- Add daily budget alerts in Google Cloud billing.
- Confirm key restrictions match preview and production domains.

4. App behavior and performance

- Validate nearby and route discovery under realistic mobile network conditions.
- Confirm cache behavior by repeating the same nearby/route queries.
- Test update flow with image uploads and rate-limit handling.

5. Monitoring

- Enable Vercel analytics and function logs.
- Add alerting for API error spikes (5xx) and latency.
- Keep an incident contact checklist for first week after launch.

## Recommended release plan

1. Phase 1: Preview testing (3-7 days)

- Deploy on Vercel preview URL only.
- Invite a small group of testers.
- Verify key flows daily: nearby, route, add timings, QR update, admin print, delete.
- Track any failed API calls and fix before production promotion.

2. Phase 2: Vercel production subdomain (2-3 days)

- Promote to production on `your-project.vercel.app`.
- Keep custom domain unbound initially.
- Confirm stable behavior under real traffic and monitor logs.

3. Phase 3: Custom domain cutover

- Add custom domain in Vercel and configure DNS records.
- Update `NEXT_PUBLIC_APP_URL` to the custom domain.
- Update Google key referrer restrictions to include custom domain.
- Redeploy and validate QR/update URLs and sitemap/robots on final domain.
- Keep Vercel subdomain as a fallback path.

## Testing checklist

- Nearby mode shows mosques around the current device location.
- Route mode returns mosques within 3 km of the selected route.
- Next jamaat and status update correctly throughout the day.
- QR update form submits within a few seconds on mobile.
- Image uploads land in Supabase Storage when configured.
