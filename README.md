# Portland Mobile Detailing

Next.js website and owner-managed appointment scheduler for Portland, Texas, deployed on Cloudflare Workers with OpenNext and D1 (SQLite).

**Start here: [Complete beginner D1 setup guide](docs/D1_SETUP.md).** It covers installing tools, creating and binding the database, owner credentials, local testing, live deployment, backups, upgrades, and troubleshooting.

## Database architecture

Browser → Next.js API on a Cloudflare Worker → `DB` binding → D1.

- `lib/db.ts`: prepared D1 queries and transactional batches.
- `migrations/0001_initial.sql`: tables and non-destructive initial hours.
- `migrations/0002_booking_conflicts.sql`: SQLite triggers preventing overlaps on insert, reschedule, or restore.
- `wrangler.jsonc`: Worker and D1 configuration; replace the database ID placeholder.
- `.env.example`: owner login settings for local development.

Use `npm run db:migrate` locally and `npm run db:migrate:remote` for Cloudflare. Old `db:init` aliases now also use migrations. Do not initialize from `db/schema.sql` alone: that legacy baseline omits subsequent migrations.

## Scheduler

New databases default to 8 AM–5 PM every day, editable in `/admin`; existing saved hours are preserved. Disabled weekdays and blocked dates have no slots. Slots start every 30 minutes, respect service duration and a two-hour lead time, and use America/Chicago with daylight saving. Appointments are stored as UTC ISO text and prices as integer cents. Cancelled bookings free their slots; overlapping restores are rejected. Storage failures return an error rather than fabricated availability.

## Commands

```sh
npm install
npm run db:migrate
npm run dev
npm run test:db
npm run typecheck
npm run build
npm run preview
```

Configure owner credentials before login and follow the setup guide before deploying. `test:db` requires Node.js 24. Local data and credentials are not automatically uploaded.

## Customization

Services/prices/durations live in `lib/services.ts`. Marketing content lives in `app/page.tsx`; images belong in `public/`. Set real business contact information, pricing, policies, and domain before launch. `/admin` is the owner dashboard; `/book` is customer booking. The existing middleware supports optional `admin.`, `schedule.`, and `book.` aliases on your domain. `NEXT_PUBLIC_BASE_DOMAIN` must be set at build time for domain routing.
