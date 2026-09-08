# Appointment archive and hourly availability

The owner dashboard opens on **Upcoming bookings**, showing only confirmed appointments that have not ended. **Appointment archive** shows all completed, cancelled, and past appointments, newest first. Both views have Previous/Next controls with 50 appointments per page; there is no historical cutoff. A past confirmed appointment retains its recorded status until the owner marks it completed. Marking an appointment completed or cancelled removes it from Upcoming immediately without deleting it.

Under **Weekly hours**, set opening/closing times and use each day's **Block individual hours** controls to toggle one-hour blocks, including nonadjacent hours. Press **Save hours** to persist the settings. Blocks repeat on that weekday in America/Chicago time. A service (including add-ons) must fit completely within opening hours without touching a blocked interval. A service ending exactly when a block begins, or beginning exactly when a block ends, is allowed. Existing appointments are retained; check them before changing availability. The Open checkbox closes an entire weekday; Blocked dates still closes a particular date.

Full Detail now starts at **$199**. Other service and add-on prices are unchanged. Existing appointments retain the price recorded when booked.

## Deployment

Before deploying this code, apply the additive migration to the existing D1 database:

```sh
npm run db:migrate:remote
```

Migration `0003_weekly_blocked_hours.sql` creates the weekly hour-block table without changing existing hours or appointments. Use `npm run db:migrate` for local development. Do not deploy code that depends on this table before applying the migration. Follow the existing [D1 setup guide](D1_SETUP.md) for account access and backups.

## Verification

```sh
npm run typecheck
npm run test:db
npm run test:email
npm run test:addons
npm run test:schedule
```

After deployment, sign in to the owner panel, check both appointment views, save two separate blocked hours on a weekday, and verify the public booking page excludes overlapping services. Remove those test blocks afterward if they were only for verification.
