# Nueces Detail email setup: Resend sending and Gmail forwarding

This setup uses two addresses on nuecesdetail.com:

| Address | Purpose | Service |
| --- | --- | --- |
| bookings@nuecesdetail.com | Sends appointment confirmations and owner notifications | Resend |
| contact@nuecesdetail.com | Receives questions and customer replies, then forwards them to matthewdaguinaldo@gmail.com | Cloudflare Email Routing |

The website displays **361-633-9667** and **contact@nuecesdetail.com**. Customer confirmation emails use contact@nuecesdetail.com as their Reply-To address. New-booking notifications still go directly to matthewdaguinaldo@gmail.com; replies to those owner notifications go to the customer.

## 1. Verify nuecesdetail.com for sending in Resend

1. Sign in at https://resend.com/ and open Domains.
2. Add **nuecesdetail.com**, not mail.nuecesdetail.com. Verifying the root domain lets you use bookings@nuecesdetail.com as the visible sender.
3. Enable sending. Leave Resend receiving disabled: incoming contact mail will use Cloudflare Email Routing.
4. Resend shows the DNS records required for your account. In Cloudflare, open nuecesdetail.com → DNS → Records and add the exact names, types, and values shown by Resend.
5. Return to Resend and verify until sending is marked verified.

You do not need to create a mailbox called bookings in Resend. Once the sending domain is verified, your application can use an address on that domain. The full sender value will be:

```text
Nueces Detail <bookings@nuecesdetail.com>
```

The previous mail.nuecesdetail.com verification does not by itself verify the root-domain sender. Add and verify nuecesdetail.com before changing the live sender.

Resend may request MX and SPF records on a return-path subdomain such as **send.nuecesdetail.com**. Those handle sending feedback and are separate from the root-domain MX records used to receive contact mail. Copy the exact records Resend gives you; do not invent record values or replace the root MX records with Resend receiving records. Do not add multiple SPF records at the same DNS name. Records at the root and at a subdomain are different names.

## 2. Create contact@nuecesdetail.com and forward it to Gmail

1. In Cloudflare, open Email Routing for **nuecesdetail.com**. Depending on the dashboard layout, find it under your domain's Email section or Compute → Email Service → Email Routing.
2. Add **matthewdaguinaldo@gmail.com** as a destination address.
3. Open that Gmail inbox and click Cloudflare's verification link. The destination must show verified before forwarding works.
4. Enable Email Routing and let Cloudflare provide the DNS records it requires. If the root domain already has an email provider, review those existing MX records before replacing them: changing them changes where all domain mail is received.
5. Under routing rules/custom addresses, create **contact@nuecesdetail.com**.
6. Choose **Send to an email** and select **matthewdaguinaldo@gmail.com** as its destination. Save and enable the rule.
7. Confirm that both Email Routing DNS and the custom address rule are active.

Use a specific contact rule; you do not need catch-all forwarding. This creates a forwarding address, not a separate mailbox with a password. You read the incoming mail in Gmail.

Sending through Resend and receiving through Cloudflare can coexist because their records serve different purposes. Root-domain MX records belong to Cloudflare Email Routing for this setup; Resend's sending return-path records remain on the hostnames it specifies.

## 3. Configure the website's Worker settings

In Resend, create a sending API key authorized for **nuecesdetail.com**. An existing API key restricted to mail.nuecesdetail.com must be changed or replaced with one authorized for the new domain.

In Cloudflare → Workers & Pages → **detail** → Settings → Variables and Secrets, set:

| Runtime secret | Value |
| --- | --- |
| RESEND_API_KEY | Your private Resend sending API key |
| BOOKING_EMAIL_FROM | Nueces Detail <bookings@nuecesdetail.com> |

Keep your existing owner login credentials. The public contact address is separate from ADMIN_EMAIL and does not change how you sign in. Keep NEXT_PUBLIC_BASE_DOMAIN set to nuecesdetail.com in the build settings when needed. The existing Worker and D1 database are still named detail.

Save the secrets and deploy the intended Worker version. A secret change may create a version that still needs deployment. Do not publish an unrelated pending code version just to update a secret. Keep the keep_vars setting from the runtime-persistence fix when merging configuration changes; it preserves dashboard-managed plaintext variables. Encrypted secrets normally persist independently.

For local development, update BOOKING_EMAIL_FROM in your private .env.local or .dev.vars, then restart the server. Never commit an API key or your local secret files. Editing .env.example only documents the setting and does not change the live Worker.

## 4. Deploy and test

1. Merge the contact-details change and deploy the updated website.
2. Check the footer displays 361-633-9667 and contact@nuecesdetail.com. The mobile Call link uses the same phone number.
3. Send a test message to contact@nuecesdetail.com from a different inbox than the destination Gmail. Confirm it reaches matthewdaguinaldo@gmail.com; check spam and Cloudflare's routing activity if it does not.
4. Make one future test booking with an email address you control. Confirm the appointment appears in the owner dashboard.
5. Check the customer receives an email from bookings@nuecesdetail.com and that clicking Reply addresses it to contact@nuecesdetail.com. Send a test reply and verify forwarding.
6. Check the owner notification arrives directly in matthewdaguinaldo@gmail.com.
7. Cancel the test booking to free the time. Cancellation does not send an email in this version.

Cloudflare Email Routing forwards incoming messages; it does not configure Gmail to send as contact@nuecesdetail.com. If you reply from Gmail normally, recipients see your personal Gmail sender. To send manual replies as contact@nuecesdetail.com, separately configure an authenticated outbound email service and Gmail Send mail as, or use a domain mailbox provider. That is separate from automated booking emails through Resend.

## Troubleshooting

- **Resend rejects the sender:** verify nuecesdetail.com (the exact sender domain) and ensure the key has access to it. Confirm BOOKING_EMAIL_FROM no longer contains mail.nuecesdetail.com.
- **Contact mail never reaches Gmail:** verify the destination, enable the specific contact rule, and check root-domain MX records and routing activity. Do not enable Resend receiving on the root domain for this setup.
- **The old address appears after deployment:** update the live BOOKING_EMAIL_FROM secret and deploy that settings version. A local file or documentation change does not update production.
- **Secret changes are blocked by a pending Worker version:** use the dashboard's version-aware secret controls and deploy the intended version; see docs/RUNTIME_SETTINGS.md for persistence guidance.
- **Email sending fails after a booking:** the appointment stays saved. Keep the booking reference and do not book again to resend. Check Resend delivery logs and Worker logs.

Each email attempt has a five-second timeout and one retry for temporary failures. Customer and owner notifications are independent. There is no persistent retry queue: prolonged failures need owner follow-up. API acceptance means submitted for delivery, not guaranteed inbox delivery. Existing appointments are not emailed retroactively, and cancellations/status changes do not send notifications.

Messages contain the booking reference, service, Central Time appointment, and duration. Customer email is used for delivery and the owner's reply address. Addresses, phone numbers, vehicle details, and notes remain in the dashboard.

## Developer checks

```sh
npm run test:email
npm run typecheck
```

These tests mock sending and do not email real recipients.

## Official references

- [Create a sending address in Resend](https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend)
- [Cloudflare routing rules and destination verification](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)
- [Cloudflare email DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-records/)
- [Resend receiving domains and MX behavior](https://resend.com/docs/dashboard/receiving/custom-domains)

