# Security

Report suspected vulnerabilities privately to the configured studio security contact. Do not include credentials, access tokens, bank details or personal client data in an issue.

## Baseline controls

- Passwords are hashed with bcrypt.
- Refresh tokens are random, hashed at rest, rotated and revocable.
- Private resources require server-side authentication, role checks and ownership filters.
- Mutating browser requests require an allowed origin.
- The API applies security headers, request-size limits and rate limiting.
- Production secrets and bank settings must be stored in managed environment variables or encrypted server-side settings.
- File storage must use non-executable object storage with MIME, extension, size and ownership checks.
- Logs must not contain passwords, tokens, payment details or uploaded file content.

Before production release, complete the OWASP ASVS-oriented checks documented in `docs/security-checklist.md`.
