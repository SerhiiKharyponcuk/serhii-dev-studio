# Serhii Dev Studio

Full-stack platform for a freelance web-development business: public portfolio and services, structured project enquiries, secure client accounts, project tracking, manual payments, invoices, messaging, files, notifications and administration.

## Architecture

- `apps/web`: React, TypeScript, Vite, Tailwind CSS and TanStack Query.
- `apps/api`: Express, TypeScript, Prisma and PostgreSQL.
- `packages/contracts`: shared Zod validation contracts and domain types.

Money values are stored as integer minor units. Public branding lives in `apps/web/src/config/site.ts`. Runtime and sensitive settings remain server-side.

## Local setup

1. Install Node.js 22 or newer and PostgreSQL.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and replace every example secret.
4. Create the PostgreSQL database referenced by `DATABASE_URL`.
5. Run `npm run prisma:generate --workspace @serhii-dev/api`.
6. Run `npm run prisma:migrate --workspace @serhii-dev/api`.
7. Set non-production `SEED_ADMIN_PASSWORD` and `SEED_CLIENT_PASSWORD`, then run `npm run prisma:seed --workspace @serhii-dev/api`.
8. Start the API with `npm run dev:api` and the web app with `npm run dev:web`.

Never reuse seed credentials in production.

## Quality checks

```text
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
npm run format:check
npm run audit:prod
```

The end-to-end suite exercises desktop and mobile Chromium flows and runs automated
accessibility checks with axe. Database migrations and seed data should also be verified
against a disposable PostgreSQL instance before deployment.

## Deployment

Deploy `apps/web` to Vercel and `apps/api` to Render or Railway. Use managed PostgreSQL and an S3-compatible object store for production files. Configure `WEB_ORIGIN`, secrets, SMTP and database values through the hosting provider. Serve the frontend and API on HTTPS subdomains of the same parent domain where possible.

No commit or push should be performed until the final QA and security report is reviewed.
