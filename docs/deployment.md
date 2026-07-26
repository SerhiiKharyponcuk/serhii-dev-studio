# Deployment

## Frontend

Create a Vercel project with `apps/web` as the application directory. Set `VITE_API_URL` to the HTTPS API URL and `VITE_SITE_URL` to the canonical public URL. Add the canonical URL to metadata and sitemap configuration before release.

## API and database

Create managed PostgreSQL and deploy the root repository using `render.yaml`, or reproduce the same commands on Railway. Run checked migrations with `prisma migrate deploy` during a controlled release step before starting the new API version.

Configure:

- `DATABASE_URL`
- `WEB_ORIGIN`
- independent high-entropy JWT secrets
- a base64-encoded 32-byte `SETTINGS_ENCRYPTION_KEY`
- `RESEND_API_KEY` and a verified `SMTP_FROM` sender (or SMTP settings as a fallback)
- `FILE_STORAGE=s3` and S3-compatible endpoint, bucket, region and credentials

Use HTTPS for both applications. Keep `FILE_STORAGE=local` only for development; production
deployments must use the S3-compatible adapter so files survive restarts and rolling releases.

The checked-in Render Blueprint uses free instances only for an initial staging smoke test. Free
Render Postgres expires after 30 days and has no backups, so upgrade the API and database before a
commercial launch. On a paid API service, move `prisma migrate deploy` from `startCommand` to
Render's `preDeployCommand`.

## Operations

Enable database backups and test restore procedures. Add uptime and error monitoring, define retention for audit logs and files, rotate secrets, and review dependency/security alerts before each production release.
