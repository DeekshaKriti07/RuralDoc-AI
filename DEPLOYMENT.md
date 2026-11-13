# Deploy

## Required setup

Use a Linux host with Docker Engine and Compose, a domain and an HTTPS reverse proxy. Allow adequate RAM/disk for gemma3:4b; measure model latency on your host before serving users. The app is a Node server with a database and AI runtime, not a static-only ZIP for shared hosting.

1. Extract the archive. Copy root `.env.example` to `.env`.
2. Generate three different random values: `openssl rand -hex 32`. Set JWT_SECRET, DB_PASSWORD and DB_ROOT_PASSWORD. Never expose these in the frontend.
3. Set CORS_ORIGIN to the exact HTTPS URL, without a trailing slash. Keep frontend and API on that same origin. Cookie authentication intentionally requires this deployment arrangement.
4. Configure NOMINATIM_BASE_URL with a self-hosted or contracted Nominatim-compatible service. Without it, nearby-care requests return a clear unavailable message. Public OSM Nominatim is not a production POI discovery backend.
5. Run `docker compose up -d --build`.
6. Run `docker compose exec ollama ollama pull gemma3:4b`. Verify `GET /api/ai/health` reports the model available. The database initializes on its first empty volume only; upgrading an existing database requires a reviewed migration and backup.
7. Reverse proxy your HTTPS domain to `127.0.0.1:4000`. Example Caddy configuration:

```caddy
health.example.com {
  reverse_proxy 127.0.0.1:4000
}
```

The app port binds to loopback; DB and Ollama have no host ports. TRUST_PROXY=1 assumes exactly one trusted reverse proxy. Do not expose the app port directly or trust arbitrary forwarded headers. TLS is required for secure cookies, location, microphone and service workers.

## Verify before launch

- GET `/api/status` = 200; GET `/api/ready` = 200 checks MySQL. AI health is separate.
- Create an account, sign out/in and refresh. Test expired sessions. Test invalid passwords and verify throttling returns 429. Test two different accounts cannot access each other's records, reminders or chats.
- Create/delete records and reminders against real MySQL. Test a real model response, model-down fallback, photo upload, translation, location denied, configured nearby-care provider and network failure.
- Check first aid on desktop and phone: written steps, English fallback, selected languages, speech playback/stop, no video. Voices depend on browser/device; offline voices are not guaranteed.
- Browser reminders need the page open and notification permission. There is no background push scheduler. Do not rely on them for critical medication timing.
- Offline first aid is available only after its code/content has loaded and been cached. Do not advertise guaranteed first-use offline access.
- Set up encrypted database backups and prove a restore. Export structured stdout audit events to restricted durable log storage. Configure retention, monitoring, uptime/error alerts and disk limits.

## Release requirements and limits

This is a hardened deployment candidate, not a certification of production or clinical safety. Obtain clinician review of every first-aid instruction, all translations and AI guardrails before real patient use. Add a privacy notice, explicit consent for processing health data and images, retention/deletion workflow and incident-response ownership appropriate to your deployment.

The built-in limiter and AI concurrency gate support ONE app process. Before multiple replicas, replace them with shared Redis/gateway limits. Rate limits are per IP and may constrain shared village networks. Stateless sessions last 8 hours; logout clears the browser cookie but does not revoke a stolen token before expiry. Rotate JWT_SECRET to invalidate all sessions. Account recovery, email verification, MFA and user self-service account deletion are not implemented.

Do not expose Ollama publicly. For remote DB connections, configure verified database TLS. The provided Compose database stays on its internal network. Pin tested container image digests and schedule dependency updates in your deployment pipeline.
