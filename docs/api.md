# API conventions

Base URL: `/api`.

Successful responses use `{ "success": true, "message": "...", "data": ... }`. Errors use `{ "success": false, "message": "...", "error": { "code": "..." } }`.

Implemented route groups:

- `/auth`: registration, login, logout, refresh-token rotation, current profile, password
  recovery, email verification and production admin email second-factor verification.
- `/users`: authenticated profile updates.
- `/orders`: public validated project-request creation and signed, time-limited attachment
  uploads. Project briefs use a server-priced feature catalogue, separate first and last
  names, and optional billing fields that can be carried into future invoices.
- `/contact`: rate-limited contact requests.
- `/services` and `/portfolio`: public catalog lists and detail records.
- `/reviews`: approved public reviews, authenticated submissions and administrator
  moderation.
- `/client`: owner-scoped orders, projects, payments, invoices, PDF downloads and
  notifications.
- `/messages`: participant-scoped conversations, messages, search and read state.
- `/files`: owner/administrator-scoped upload, listing and download.
- `/admin`: role-protected dashboard, order conversion, clients, projects, payments,
  invoices, catalog management, encrypted bank settings and audit logs.

List endpoints return pagination metadata where applicable. Browser clients must send
credentials and the configured frontend Origin. Cookie-authenticated state-changing
requests are rejected when their `Origin` does not match `WEB_ORIGIN`.

Authentication and recovery endpoints have dedicated brute-force limits. JSON bodies are
strictly validated, unsupported content types and excessive URLs are rejected before route
handling, and public forms include layered rate limiting and bot-trap checks.

Resource access is enforced server-side from the authenticated user id and role; client
identifiers supplied by the browser are never trusted as authorization evidence.
Admin routes require the current database role to be `ADMIN`. Admin and client route groups
revalidate the account status and role against PostgreSQL on every request, so blocked accounts
and changed permissions take effect immediately.
