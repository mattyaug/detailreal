# Booking email setup (Resend + Cloudflare)

Every new successful booking attempts two separate emails: a confirmation to the customer's booking email and a notification to **matthewdaguinaldo@gmail.com**. Existing appointments are not emailed retroactively. Cancellations and status changes do not send emails in this version.

## 1. Create your Resend account and verify your domain

1. Sign up at https://resend.com/.
2. Open **Domains** and add a domain you own, or a sending subdomain such as `mail.nuecesdetail.com`.
3. Resend will show DNS records to add. In your domain's DNS dashboard (Cloudflare if it manages your DNS), add exactly the names, types, and values Resend supplies.
4. Return to Resend and verify the domain. Wait for its status to show verified.

You cannot verify `gmail.com`; your Gmail address is the notification recipient and reply address, not the sender. The Resend testing sender cannot deliver confirmations to arbitrary customers. Use a verified domain before testing with customers.

For nuecesdetail.com, verify the sending subdomain `mail.nuecesdetail.com` and use `Nueces Detail <bookings@mail.nuecesdetail.com>`. Use `Nueces Detail <bookings@mail.nuecesdetail.com>` as `BOOKING_EMAIL_FROM` after that subdomain is verified. Replies to customer confirmations are directed to matthewdaguinaldo@gmail.com, so this sender does not need an inbox for replies.

## 2. Create an API key

In Resend, open **API Keys**, create a sending key, and copy it. Keep it private. Do not paste the key into GitHub, a public file, or chat. If you restrict the key to a domain, choose the verified sender domain.

## 3. Add two runtime secrets in Cloudflare

Open Cloudflare → Workers & Pages → your Worker **detail** → Settings → Variables and Secrets. Add both entries as secrets:

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | The key from Resend |
| `BOOKING_EMAIL_FROM` | Your complete sender, e.g. `Nueces Detail <bookings@mail.nuecesdetail.com>` |

Save/apply the changes using Cloudflare's controls. These must be Worker runtime settings, not only build variables. Do not prefix either name with `NEXT_PUBLIC_`.

Alternatively, from the updated project folder after `npx wrangler login`:

```sh
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put BOOKING_EMAIL_FROM
```

Each command prompts for its value. The owner notification recipient is already set to **matthewdaguinaldo@gmail.com** in server code; you do not need to change `ADMIN_EMAIL` or your login credentials.

## 4. Connect nuecesdetail.com and deploy

In Cloudflare, open Worker **detail** → Settings → Domains & Routes and add `nuecesdetail.com` as a custom domain. Add `www.nuecesdetail.com` as well if you want that address to work. Keep the Worker name and D1 database name `detail`; the public brand does not require renaming infrastructure. Set the build variable `NEXT_PUBLIC_BASE_DOMAIN=nuecesdetail.com`. If older `NEXT_PUBLIC_BUSINESS_NAME` or email settings exist, update them to the new brand and your real contact email. Domain verification in Resend and the website custom domain are separate setup steps.

Merge the branding and booking-email pull requests and let your configured GitHub deployment finish, or check out that branch and deploy using `npm run deploy`. No new database migration is needed for this feature. Make sure the deployed version includes `lib/booking-email.ts`.

## 5. Test one real booking

1. Choose a future open time on the live `/book` page.
2. Use an email address you control and submit the booking once.
3. Confirm the appointment appears in `/admin`.
4. Check that customer inbox and **matthewdaguinaldo@gmail.com**, including spam folders.
5. In Resend's email logs, inspect the two messages. API acceptance means submitted for delivery, not guaranteed inbox delivery. Resend can report bounces or other delivery events.
6. Cancel the test booking in `/admin` to free the time. This does not send a cancellation email.

## Local development

Add `RESEND_API_KEY` and `BOOKING_EMAIL_FROM` to your private `.env.local` for `npm run dev`, or `.dev.vars` for Cloudflare preview, then restart. These are real sends when credentials are present: use your own recipient address for tests. Leaving the values empty skips sending and logs that email is not configured. No credentials are supplied in `.env.example`.

## Failure behavior and limits

The appointment is saved before emails are attempted. Each recipient gets an independent request, a five-second timeout, and one retry for network failures, rate limits, or server errors. Retries reuse the same Resend idempotency key to reduce duplicate messages. The response can take approximately eleven extra seconds during an outage.

If sending fails, the booking stays confirmed and the customer is told to keep the reference rather than book again. Check Cloudflare Worker logs for `Booking email rejected`, `Booking email request failed`, or `Booking email is not configured`; logs include the booking ID and recipient category, not the API key or customer details. Check Resend for delivery failures and domain/key errors. This version does not include a persistent email queue or automatic retries after the request finishes; prolonged outages require owner follow-up from the booking dashboard. Never create a duplicate appointment to resend an email.

The emails include only the service, booking reference, Central Time appointment, and estimated duration. Customer email is used for delivery and as the owner notification reply address. Addresses, phone numbers, vehicles, and notes stay in the dashboard. Keep your privacy policy aligned with sending booking information through Resend. Monitor your Resend account's sending limits before launch.

## Checks for developers

```sh
npm run test:email
npm run typecheck
```

The tests mock Resend; they do not send emails. They cover recipients, replies, time formatting, independent failures, retry keys, and missing credentials.

Official references: [Send email API](https://resend.com/docs/api-reference/emails/send-email), [sender setup](https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
