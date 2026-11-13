# Engineering review — 13 November 2026

## Implemented

- Replaced first-aid animated player with visible numbered instructions, read-all/read-step controls, stop control, emergency link and language-fallback status. Removed animation components, video files, manifests, render scripts and unrelated research repositories from release.
- Replaced localStorage JWT persistence with HttpOnly, SameSite=Strict cookies (Secure in production), eight-hour expiry, explicit HS256/issuer/audience verification, server-side session restoration and expired-session UI handling. Passwords are bcrypt-hashed; added email/type/length checks including bcrypt's 72-byte boundary.
- Restricted CORS, checked request Origin on cookie-authenticated mutations, disabled API caching, added CSP and other response headers, body limits, malformed-JSON handling and startup secret validation.
- Added per-IP API/auth/AI rate limits, bounded limiter/cache storage, two-request AI concurrency gate, bounded context/output and model timeout. Translation now requires authentication.
- Added validation for records, reminder dates/times/frequency, chat identifiers, image inputs and symptom state shape. Preserved user ownership predicates. Bounded record/history queries and model chat context.
- Added structured request audit events with request IDs, status, user ID and duration. No request bodies, credentials or health content in these events; route errors log codes rather than SQL parameter dumps. This is infrastructure auditing, not a full immutable clinical audit ledger.
- Fixed service worker interception of authenticated API requests and changed the cache version. Added same-origin API defaults/development proxy, code splitting, description/social metadata, robots policy, keyboard focus/reduced-motion styles, unsupported Notifications handling and visible reminder errors.
- Added Docker/Compose, database readiness, graceful shutdown and deployment documentation. No uploaded .env credentials or machine-specific environments are included.

## Verification performed

- Frontend production build passed.
- Frontend lint exited successfully; React effect/fast-refresh warnings remain in legacy components. No claim of zero lint warnings.
- Existing backend self-test: 20 passed, zero failed, using a fake model/database.
- Built-in triage evaluation: 46 cases; 45/46 top-1, 46/46 top-3; 11/11 emergency fixtures flagged. These are developer fixtures, not clinical validation or real-world accuracy measurements.
- New HTTP security integration checks passed for session cookies/restoration, origin rejection, invalid input, unauthenticated routes, ownership rejection, headers, no-store, logout expiry and rate limiting. Database operations are stubbed.
- npm audits after dependency updates: zero reported vulnerabilities in backend and frontend. This is time-specific and not proof of absence of vulnerabilities.
- Browser smoke-test launch was attempted but blocked by environment socket restrictions. Responsive/visual interaction checks were not completed.
- Docker is unavailable here; image build/Compose startup and live MySQL/Ollama/provider end-to-end tests were not run. See DEPLOYMENT.md for required acceptance checks.

## SEO assessment

Added document language, descriptive title, description, Open Graph title/description, favicon, theme color, robots file and noscript emergency text. Private features are behind authentication; API responses are no-store. The public landing page still renders via JavaScript. For stronger search indexing, add a prerendered public landing page, a canonical URL, absolute social-image URL and sitemap after choosing the real domain. Do not index personal medical screens or generate misleading medical/organization structured data.

## References used

- Express production security: https://expressjs.com/advanced/best-practice-security/
- OSM Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/

See DEPLOYMENT.md for the unresolved operational, account-lifecycle and clinical release requirements. This review does not certify that every defect has been found.
