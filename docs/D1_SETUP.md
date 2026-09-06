# Cloudflare D1 setup: beginner walkthrough

This guide is for **mattyaug/detailreal**, a Next.js website deployed to **Cloudflare Workers through OpenNext**. D1 is Cloudflare's managed database using SQLite SQL. You do not install a database server or put a database password in your website.

Your customer's browser calls the website's API. The API runs on the Worker and reads/writes D1 through a private binding named `DB`. Customers never receive direct database access. Local development uses a separate SQLite database managed by Wrangler on your computer.

## 1. Get the updated code and tools

On the GitHub pull request for this change, review the files and merge when ready. On the repository page choose **Code → Download ZIP**, then extract it. Alternatively, with Git installed, clone the repository and check out the change branch before it is merged.

Install Node.js 24 LTS from https://nodejs.org/. Open a new terminal afterward. On Windows you can open the extracted folder in File Explorer, right-click an empty area, and choose **Open in Terminal**. The terminal must be in the folder containing `package.json` and `wrangler.jsonc`.

Run these commands one at a time (do not type the code fences):

```sh
node --version
npm --version
npm install
```

If PowerShell says `npm.ps1` cannot run, use `npm.cmd` instead of `npm` and `npx.cmd` instead of `npx` for the commands below. Do not change your machine's security settings just to run these commands.

## 2. Sign in to Cloudflare and create D1

Create or sign in to your Cloudflare account at https://dash.cloudflare.com/.

```sh
npx wrangler login
npx wrangler whoami
npx wrangler d1 create detailreal-db
```

The login command opens a browser authorization page. Complete it with the account that will host this website. The create command prints your new database's ID, shaped like a UUID. If the database already exists, use `npx wrangler d1 list` to find its ID instead of creating another one.

Open `wrangler.jsonc` in a text editor. Keep the existing settings, and replace only `REPLACE_WITH_D1_DATABASE_ID` with that real ID. The database entry should look like this, with your actual ID:

```json
{
  "binding": "DB",
  "database_name": "detailreal-db",
  "database_id": "YOUR-ACTUAL-DATABASE-ID",
  "migrations_dir": "migrations"
}
```

Keep the binding name exactly `DB`: that is the name the server code uses. If Wrangler offers to update your configuration automatically, inspect the result and keep just one `DB` entry. The ID identifies a database; it is not a password and can be committed. No `DATABASE_URL` is required.

## 3. Prepare your local database

```sh
npm run db:migrate
```

This creates the tables in the local database and records applied migrations. It does not change the live Cloudflare database. You should see both `0001_initial.sql` and `0002_booking_conflicts.sql` finish successfully.

- `availability`: seven weekday rows, Sunday = 0, Saturday = 6; times are Central Time, and `is_enabled` is 0 or 1.
- `blocked_dates`: full dates the owner has closed.
- `bookings`: customer contact details, service and price at booking time, UTC start/end timestamps, and appointment status.
- `d1_migrations`: Wrangler's record of installed database changes. Leave this table alone.

New databases start with every day open 8 AM–5 PM. Change hours or disable weekdays in `/admin`. Existing hours are preserved. Prices are integer cents; appointment timestamps written by the app use UTC ISO text. Do not manually insert timestamps in another format, because booking comparisons use that consistent format.

Check the local setup:

```sh
npx wrangler d1 execute DB --local --command="SELECT weekday, start_time, end_time, is_enabled FROM availability ORDER BY weekday;"
```

Expect seven rows. Keep `--local` when experimenting.

## 4. Configure owner login locally

Copy `.env.example` to `.env.local` using your editor or file manager. On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set `ADMIN_EMAIL` to the email you want to use for owner login. Generate a password hash using this command, replacing the sample password with your own. Use a password without quote characters for this command to avoid shell quoting problems:

```sh
node -e "const b=require('bcryptjs'); console.log(Buffer.from(b.hashSync('REPLACE-WITH-YOUR-LONG-PASSWORD',12)).toString('base64'))"
```

Copy the output into `ADMIN_PASSWORD_HASH_B64`. This is an encoded bcrypt hash, not the password you type to log in. The command may remain in terminal history; do this on your own computer.

Generate a session secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64'))"
```

Copy that output into `SESSION_SECRET`. Leave `NEXT_PUBLIC_BASE_DOMAIN` empty for localhost, or set it to your real domain before building for production. Never upload `.env.local`, plaintext passwords, session secrets, or database backups to GitHub. The supplied ignore rules exclude local credentials and common backup filenames.

## 5. Run and test the website

```sh
npm run dev
```

Open http://localhost:3000, then `/book` and `/admin`. Use your configured email and original password to log in. Stop the development server with Ctrl+C when finished.

Test with made-up customer data:

1. Book a future available appointment. Confirm it appears in the owner dashboard.
2. Refresh the booking page: overlapping slots should be gone.
3. Cancel it: the slot should be available again.
4. Disable a weekday in owner hours: that weekday should have no slots.
5. Block a date: it should have no slots.
6. Cancel an appointment, book its time again, then try restoring the first appointment. The owner should see a conflict message.

If storage is unavailable, the website reports an availability error rather than displaying invented free times.

Developer checks:

```sh
npm run test:db
npm run typecheck
npm run build
```

The database tests use Node 24's SQLite support. For a preview in Cloudflare's local runtime, copy the same owner credential values to an untracked `.dev.vars` file, then run `npm run preview`. Use the local address it prints. Keep `.dev.vars` and `.env.local` values consistent. Local test bookings are not uploaded when you deploy.

## 6. Initialize the live D1 database

If this is an existing live database, first follow the backup/upgrade section below. Otherwise run:

```sh
npm run db:migrate:remote
npm run db:status
npx wrangler d1 execute DB --remote --command="SELECT COUNT(*) AS weekdays FROM availability;"
```

Confirm the database/account before accepting the migration prompt. Expect no pending migrations and a weekday count of 7. `--remote` means real Cloudflare data. Creating a database and deploying website code are separate steps: both are required.

## 7. Deploy the website to Workers

This project uses **Workers**, not a static GitHub Pages site. For your first deployment from this computer:

```sh
npm run deploy
```

This builds the Next.js app using OpenNext and deploys the Worker named `detail` in `wrangler.jsonc`. If you already have a different Worker name, change `name` to match that existing Worker before deployment. Avoid unintentionally creating a second website.

Configure production credentials as Worker secrets (paste the appropriate value at each prompt):

```sh
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD_HASH_B64
npx wrangler secret put SESSION_SECRET
```

Use the same email/hash/secret you generated, or generate separate production ones. These secrets belong to the deployed Worker; `.env.local` is not uploaded automatically. In Cloudflare's Worker settings, verify that the D1 binding is named `DB` and targets `detailreal-db`. Follow the `workers.dev` address printed by deploy and repeat the booking/login checks before sharing the site with customers.

For automatic GitHub deployments, connect `mattyaug/detailreal` in Cloudflare Workers Builds after merging. Use `npx opennextjs-cloudflare build` for the build command and `npx opennextjs-cloudflare deploy` for the deploy command. Set `NEXT_PUBLIC_BASE_DOMAIN` in build variables if using a domain. Owner credentials must also exist as runtime Worker secrets. Apply future remote migrations deliberately before deploying code that depends on them; do not connect untrusted preview branches to a production database.

## 8. Existing databases, backups, and future changes

If you already initialized this repository's original `db/schema.sql`, the new migrations work with those tables and retain their rows. They add overlap triggers without rebuilding or deleting tables. They do not repair appointments that already overlap: review such appointments in the owner dashboard and resolve them before launch.

Before upgrading a live database:

```sh
npx wrangler d1 export DB --remote --output=detailreal-backup.sql
```

Store that backup privately: it contains customer data. Then run `npm run db:migrate:remote`. The first migration inserts missing weekday rows without overwriting your saved settings. Running migrations again only applies files not already recorded.

For future schema edits, create a new migration:

```sh
npx wrangler d1 migrations create DB describe_your_change
```

Edit the newly created SQL file, test with `npm run db:migrate`, back up production, and apply with `npm run db:migrate:remote`. Do not rewrite migrations already applied to production. `db/schema.sql` is only a legacy baseline; new installations and upgrades must use the migration commands so the overlap rules are installed too.

If you have a separate SQLite `.db` file from another system, do not upload it blindly or overwrite this database. Its tables and date formats must be mapped to these tables first. Test imports into a separate D1 database and check record counts and time zones before switching production. Cloudflare supports SQL imports; a raw SQLite file is not the setup input for this project.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Binding `DB` is not configured | Confirm one D1 entry named `DB` in the configuration and redeploy. |
| `no such table` | Run migrations in the environment actually being used: local or remote. |
| Local bookings absent online | Expected: local and remote are separate databases. |
| No available times | Check enabled weekday, hours, blocked dates, existing appointments, and two-hour lead time. |
| Login fails online | Check runtime secrets, encoded hash, exact email, and original password. |
| Database not found or authorization error | Run `npx wrangler whoami`; check account and database ID. |
| Restore returns a conflict | Another active booking occupies that time; cancel or keep the original cancelled. |
| Windows preview/build fails | Try the Cloudflare GitHub build or WSL; retain the full error for diagnosis. |

## Official references

- D1 and SQLite overview: https://developers.cloudflare.com/d1/
- Database creation and binding: https://developers.cloudflare.com/d1/get-started/
- Versioned migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Local database isolation: https://developers.cloudflare.com/d1/best-practices/local-development/
- Import/export: https://developers.cloudflare.com/d1/best-practices/import-export-data/
- OpenNext Worker deployment: https://opennext.js.org/cloudflare/get-started
