# Runtime settings that survive deployment

`wrangler.jsonc` now sets `keep_vars: true`, so Wrangler retains ordinary runtime variables configured in the Cloudflare dashboard. Merge and deploy this configuration before future deployments. This preserves existing settings; it does not restore values already removed.

Cloudflare documents that encrypted secrets normally persist regardless of this flag. If a secret appears missing, check that you are viewing Worker `detail`, the intended account/environment, and the active version rather than a preview or build settings.

The application expects these runtime settings:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH_B64`
- `SESSION_SECRET`
- `RESEND_API_KEY`
- `BOOKING_EMAIL_FROM`
- `NEXT_PUBLIC_BASE_DOMAIN` (`nuecesdetail.com`)

Store credentials as encrypted Worker secrets, never in GitHub or the Wrangler `vars` object. The public domain can be an ordinary runtime variable; also set it in Cloudflare Workers Builds when needed at build time. Build variables and Worker runtime variables are separate.

To restore your local values from PowerShell in the updated project directory, while signed in to the correct Cloudflare account:

```powershell
npx wrangler whoami
npx wrangler secret bulk "D:\detail\detailreal-main\.env.local" --name detail
```

This uploads every entry in the named file as an encrypted runtime secret, including the public domain value. It updates the existing Worker immediately. Use only a file whose values are intended for this production Worker. The file is read locally and must not be committed. It does not configure Workers Builds variables. Changing SESSION_SECRET signs out existing owner sessions.

Verify the names without printing values:

```powershell
npx wrangler secret list --name detail
```

After the next deployment, verify owner login and make a controlled booking email test. Do not roll back to a deployment configuration lacking keep_vars if preserving dashboard-managed plaintext variables is required.

References: [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [Worker deploy command](https://developers.cloudflare.com/workers/wrangler/commands/workers/), [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
