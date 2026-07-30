# Deployment

## Frontend

Create a Vercel project with `apps/web` as the application directory. Set `VITE_API_URL` to the HTTPS API URL and `VITE_SITE_URL` to the canonical public URL. Add the canonical URL to metadata and sitemap configuration before release.

## API and database

Create managed PostgreSQL and deploy the root repository using `render.yaml`, or reproduce the same commands on Railway. The Render Blueprint runs checked migrations with `prisma migrate deploy` in the pre-deploy phase before starting the new API version.

Configure:

- `DATABASE_URL`
- `WEB_ORIGIN`
- `CORS_ALLOWED_ORIGINS`, `COOKIE_DOMAIN` and `COOKIE_SAME_SITE`
- independent high-entropy JWT secrets
- a base64-encoded 32-byte `SETTINGS_ENCRYPTION_KEY`
- `RESEND_API_KEY` and a verified `SMTP_FROM` sender (or SMTP settings as a fallback)
- `FILE_STORAGE=s3` and S3-compatible endpoint, bucket, region and credentials

Use HTTPS for both applications. Keep `FILE_STORAGE=local` only for development; production
deployments must use the S3-compatible adapter so files survive restarts and rolling releases.

The checked-in Render Blueprint uses paid production-capable instances. Applying it creates
billable resources. Review the current Render pricing before applying it.

## Operations

Enable database backups and test restore procedures. Add uptime and error monitoring, define retention for audit logs and files, rotate secrets, and review dependency/security alerts before each production release.

Follow `docs/production-runbook.md` for the exact release order, production variables, smoke test,
monitoring, backup and restore drill.
