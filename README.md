# Portland Mobile Detailing

GitHub-ready mobile detailing website and built-in scheduler for a Portland, Texas business.

## What is included

- Public mobile-first marketing site
- Service cards and editable starter pricing
- Customer booking page with live appointment availability
- Portland/Central Time scheduling with daylight-saving-time handling
- Cloudflare D1 persistence
- Atomic protection against overlapping active bookings
- Password-protected owner dashboard
- Owner controls for weekly working hours, blocked dates, cancellations, and completed jobs
- `admin.` and `schedule.` owner subdomain routing plus optional `book.` customer-booking subdomain (Cloudflare-compatible Edge middleware)
- Photo placeholders that can be replaced with your real detailing images later

## Stack

- Next.js 16 / React 19
- TypeScript
- Cloudflare D1 (SQLite)
- Luxon for Central Time scheduling
- bcrypt password hashing
- No Calendly or other external scheduler required

## 1. Install

```bash
npm install
```

## 2. Create environment settings

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set your business information and owner credentials. No `DATABASE_URL` is needed.

Generate the owner password hash **after `npm install`**:

```bash
node -e "const b=require('bcryptjs'); console.log(Buffer.from(b.hashSync('YOUR-REAL-PASSWORD',12)).toString('base64'))"
```

Paste the output into `ADMIN_PASSWORD_HASH_B64`. It is base64-wrapped so the bcrypt `$` characters are not altered by `.env` variable expansion.

Generate a session secret:

```bash
openssl rand -base64 48
```

Paste that into `SESSION_SECRET`.

## 3. Create the database

Create a D1 database while signed in to Wrangler:

```bash
npx wrangler d1 create detailreal-db
```

Copy the `database_id` from the output into the D1 entry in `wrangler.jsonc`. Initialize the local development database with:

```bash
npm run db:init
```

Initialize the production D1 database with:

```bash
npm run db:init:remote
```

The SQLite schema is in `db/schema.sql`.

## 4. Run locally

```bash
npm run dev
```

Open:

- Website: `http://localhost:3000`
- Booking: `http://localhost:3000/book`
- Owner dashboard: `http://localhost:3000/admin`

The `/admin` route is protected even when you are not using a subdomain locally.

## 5. Deploy from GitHub

1. Create a new GitHub repository.
2. Copy this entire folder into the repository.
3. Commit and push it.
4. For Cloudflare Workers, connect the GitHub repository in Workers Builds.
5. Set the build command to `bunx opennextjs-cloudflare build` (or `npm exec opennextjs-cloudflare build`).
6. Set the deploy command to `bunx opennextjs-cloudflare deploy` (or `npm exec opennextjs-cloudflare deploy`).
7. Add the production environment variables/secrets in Cloudflare. Do **not** commit `.env.local` or `.dev.vars`.
8. Create the D1 database, add its ID to `wrangler.jsonc`, and run `npm run db:init:remote`.
9. Deploy.

The repository includes `wrangler.jsonc` and `open-next.config.ts`, so the OpenNext build does not need to auto-generate its Cloudflare configuration.

## 6. Subdomains

This project intentionally uses `middleware.ts` instead of Next.js 16 `proxy.ts`. `proxy.ts` runs as Node.js middleware, which the Cloudflare OpenNext adapter does not currently support. The Edge middleware recognizes `admin.`/`schedule.`/`book.` hostnames and rewrites their root routes inside the same Worker.

For a domain such as:

- Public site: `yourdetaildomain.com`
- Customer booking shortcut: `book.yourdetaildomain.com`
- Owner scheduling: `admin.yourdetaildomain.com` or `schedule.yourdetaildomain.com`

Set:

```env
NEXT_PUBLIC_BASE_DOMAIN=yourdetaildomain.com
```

Then add `yourdetaildomain.com`, `book.yourdetaildomain.com`, and whichever owner aliases you want (`admin.yourdetaildomain.com` and/or `schedule.yourdetaildomain.com`) to the same deployment project. Configure the DNS records exactly as your hosting provider shows in its domain setup screen. DNS values vary by provider, so use the values displayed by your host rather than hard-coding a generic CNAME target.

The owner can still use `yourdetaildomain.com/admin` as a fallback.

## Scheduler behavior

- Default hours: Monday-Saturday, 8:00 AM-5:00 PM Central; Sunday closed.
- Appointment choices are generated every 30 minutes.
- Each service has its own duration.
- A two-hour booking lead time is enforced.
- Cancelled jobs free their time again.
- Blocked dates show no customer availability.
- Overlapping active appointments are rejected at the database level.

## Edit services and pricing

All launch services, descriptions, duration, and starter prices are in:

`lib/services.ts`

Change that file before going live if the sample packages do not match the business.

## Add the real photos later

The home page currently includes a deliberate image placeholder in `app/page.tsx`. When you provide the images, replace that block with `next/image` images and add the files under `public/` (for example `public/images/hero.jpg`).

Good image slots to add next:

- Hero vehicle/detail photo
- 2-4 before/after pairs
- Interior-detail closeup
- Exterior gloss/paint photo
- Owner/team photo if desired

## Important launch items still to personalize

- Business name
- Real phone number and email
- Domain name
- Service prices and durations
- Travel radius / nearby cities
- Cancellation, weather, and access policies
- Real photos/logo

## Suggested next features

The current version focuses on a working scheduler. Useful phase-two additions are automated booking confirmations/reminders by email/SMS, deposits/payments, coupon codes, review links, analytics, and a customer reschedule/cancel link.


## Cloudflare/OpenNext notes

This repository is configured for Cloudflare Workers with `@opennextjs/cloudflare`. Important files:

- `wrangler.jsonc` — Worker entry point, assets binding, Node compatibility, and compatibility date.
- `open-next.config.ts` — OpenNext adapter configuration.
- `middleware.ts` — Edge middleware used for hostname rewrites. Do not rename it to `proxy.ts` while OpenNext lacks Node middleware support.
- `public/_headers` — long-lived caching for hashed Next.js static assets.

The `build` script uses `next build --webpack`. Next.js 16 defaults to Turbopack, but Webpack remains a conservative OpenNext deployment choice and avoids known Turbopack/runtime compatibility problems seen in some OpenNext releases.

Before deploying, configure these Cloudflare build variables/secrets: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH_B64`, `SESSION_SECRET`, and `NEXT_PUBLIC_BASE_DOMAIN`. `NEXT_PUBLIC_BASE_DOMAIN` must also exist during the Next.js build because `NEXT_PUBLIC_` values can be embedded at build time. The database is supplied through the `DB` binding in `wrangler.jsonc`, not an environment URL.

To test the Cloudflare output locally after installing dependencies:

```bash
npm run preview
```

To deploy from your machine:

```bash
npm run deploy
```
