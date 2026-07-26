# API conventions

Base URL: `/api`.

Successful responses use `{ "success": true, "message": "...", "data": ... }`. Errors use `{ "success": false, "message": "...", "error": { "code": "..." } }`.

Implemented route groups:

- `/auth`: registration, login, logout, refresh-token rotation, current profile, password
  recovery and email verification.
- `/users`: authenticated profile updates.
- `/orders`: public validated project-request creation and signed, time-limited attachment
  uploads.
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

Resource access is enforced server-side from the authenticated user id and role; client
identifiers supplied by the browser are never trusted as authorization evidence.
