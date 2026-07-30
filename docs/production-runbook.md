# Production runbook

## Release topology

- Web: Vercel project rooted at `apps/web`.
- API: paid Render web service in Frankfurt.
- Database: paid Render PostgreSQL in Frankfurt, private connection string, PITR enabled.
- Files: private S3-compatible bucket; downloads are authorized and proxied by the API.
- Recommended domains: `www.<domain>` for the web app, `api.<domain>` for the API and
  `updates.<domain>` as the Resend sending subdomain.

Use sibling custom domains. Set `WEB_ORIGIN=https://www.<domain>` and `COOKIE_SAME_SITE=lax`.
Prefer leaving `COOKIE_DOMAIN` empty so authentication cookies remain host-only on the API.
Do not set `COOKIE_DOMAIN` while using provider-owned `vercel.app` and `onrender.com` domains; for
that temporary cross-site setup use `COOKIE_SAME_SITE=none`, but expect some browsers to block
third-party cookies.

## Release order

1. Create the paid PostgreSQL instance and record its recovery window.
2. Create a private S3-compatible bucket with public access blocked, default encryption,
   versioning and lifecycle retention.
3. Verify the Resend sending subdomain with the exact SPF, MX and DKIM records shown by Resend.
   Add DMARC after SPF and DKIM pass.
4. Apply `render.yaml`, fill every `sync: false` value and wait for `/api/ready`.
5. Confirm the pre-deploy Prisma migration completed before the API process started.
6. Create the Vercel project with Root Directory `apps/web`; set `VITE_API_URL` and
   `VITE_SITE_URL` for Production.
7. Add the custom domains and then update API cookie/CORS variables to the final HTTPS origins.
8. Configure the GitHub `production` environment, its URL variables and dedicated smoke-client
   secrets. Run the Production smoke test workflow.
9. Enable Render deploy-failure notifications and an external HTTPS uptime check against
   `/api/ready`. Enable Vercel Observability and Speed Insights.
10. Perform the launch checklist below before announcing the URL.

## Required Render variables

`DATABASE_URL` is provided by the Blueprint database. Set these manually:

- `WEB_ORIGIN`: canonical frontend HTTPS origin, without a trailing slash.
- `CORS_ALLOWED_ORIGINS`: optional comma-separated additional exact HTTPS origins.
- `COOKIE_DOMAIN`: normally empty for safer host-only cookies; set a parent domain only when a
  documented cross-subdomain requirement exists.
- `COOKIE_SAME_SITE`: `lax` for sibling custom domains; `none` only for cross-site HTTPS.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: independent random secrets of at least 32 characters.
- `SETTINGS_ENCRYPTION_KEY`: output of `openssl rand -base64 32`.
- `RESEND_API_KEY`, `SMTP_FROM`: key and sender on the verified Resend subdomain.
- `FILE_STORAGE=s3` plus the S3 endpoint, region, bucket and least-privilege credentials.
- `S3_SERVER_SIDE_ENCRYPTION`: `AES256` or `aws:kms` when supported.
- `S3_KMS_KEY_ID`: required only for `aws:kms`.

Never put production values in `.env`, repository files, build logs or Vercel variables that start
with `VITE_` unless the value is intentionally public.

## Backup and restore

Paid Render PostgreSQL provides point-in-time recovery. Confirm it is visible under
Database > Recovery and record the available window. Create a logical export after the first
production migration and after every high-risk schema release. Store long-term exports in a
separate, versioned backup bucket with retention rules and separate least-privilege credentials.

Quarterly restore drill:

1. Start a new isolated database from PITR or a logical export.
2. Never restore over the active production database.
3. Run `prisma migrate status`, the API readiness check and the database integration suite against
   the restored database.
4. Record recovery point, recovery time, row-count checks and the person who approved the drill.
5. Delete the isolated recovery database only after validation is documented.

## Launch checklist

- Render migration, API readiness and Vercel deployment are green.
- Resend domain status is `verified` and a real inbox receives a test message.
- S3 upload/download works for admin and client; an unrelated client receives 404.
- Registration, verification, login, refresh, logout and password reset pass.
- Admin, support and client authorization boundaries pass.
- Production smoke workflow passes with no skipped authenticated test.
- Database PITR is enabled and the first logical export is stored off-instance.
- Error/deploy notifications and uptime alerts reach the owner.
- Privacy, terms, cookie and contact details are reviewed for the actual business.
- DNS redirects, canonical metadata, sitemap and robots.txt use the final domain.
