# Production security checklist

- Verify CLIENT, SUPPORT and ADMIN permissions and resource ownership.
- Test IDOR attempts across projects, conversations, files, payments and invoices.
- Validate access-token expiry, refresh rotation, reuse detection and revocation.
- Validate CSRF protection with the final frontend/API domains.
- Configure strict CORS, HTTPS-only cookies and trusted proxy settings.
- Test password reset and email verification tokens for single use and expiry.
- Enforce upload MIME, extension, signature and size allowlists.
- Confirm uploaded objects cannot execute and cannot be accessed without authorization.
- Encrypt sensitive settings and mask bank/account values.
- Run dependency audit and secret scanning; resolve all critical and high findings.
- Confirm production responses omit stack traces and internal database details.
- Review audit coverage for role, payment, invoice, file and settings changes.
- Document database backup, restore and retention procedures.
- Verify payment webhook signatures and idempotency before enabling any provider.
