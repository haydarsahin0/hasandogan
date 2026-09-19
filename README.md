# Hasan Doğan Eğitim Merkezi

Turkish-language seminar administration and participant portal built with React, Vinext and a Cloudflare Worker/D1 backend.

## Implemented

- Admin dashboard, 81-city specialty selection, deduplicated Google Places discovery jobs, resumable pagination and per-job leases.
- Google Places results retain only place IDs and our search context. Names, addresses and telephone numbers are fetched live on demand with Google attribution. Results indicate possible candidates, not verified interest. The system cannot guarantee finding every physician in Turkey.
- Separate manually verified contact directory with recorded WhatsApp permission, opt-out and relationship status.
- Seminar creation/editing, Turkish timezone handling, draft/published state, price, capacity, online/in-person format.
- Registration requests, administrator-created participant accounts, one-time display of random initial passwords, mandatory first-login password change, secure cookies, server-side authorization, login rate limits.
- Separate instructor/admin accounts created by the owner; payment approval/revocation and capacity checks.
- Meeting links hidden from public and unpaid users. Participant joining opens 30 minutes before the seminar and closes at its end. Google Meet opens in a separate tab; Meet REST API does not embed the complete conferencing UI in this site. Screen sharing takes place in Meet. Restricted rooms still require host admission; portal access does not guarantee Google admission and a copied Meet link is ultimately subject to Google access rules.
- Optional Meet REST room creation using an already-authorized Google OAuth client and refresh token.
- WhatsApp Cloud API sending with an approved static template, batches of at most 10 permissioned contacts, unique campaign/contact delivery claims and separate accepted/failed/unknown results. API acceptance is not proof of delivery or reading. Unknown outcomes are deliberately not retried automatically.
- Provider secrets encrypted at rest with AES-GCM; an application encryption key is held in the hosting runtime.
- GitHub Actions workflow and authenticated `/api/automation` endpoint for resuming queued discovery without an open browser.

## Activation required

The first deployment is owner-private for review. On the site, the owner chooses **Yönetimi başlat**; the platform-authenticated owner identity is then recorded atomically. Never make the site public while owner setup is still unclaimed. Set `ALLOW_OWNER_SETUP=false` after claiming ownership. Create the instructor's personal admin account in **Bağlantılar**, and copy the temporary credentials securely. Public/external participant access requires a separate Site access change; the app's own login does not bypass the outer hosting audience restriction.

Runtime environment:

- `APP_ENCRYPTION_KEY`: high-entropy secret. Keep stable; replacing it makes existing encrypted provider values unreadable.
- `ALLOW_OWNER_SETUP`: `true` only during initial owner-private setup, then `false`.
- `CRON_SECRET`: independent high-entropy bearer secret for the scheduler.

In **Bağlantılar**, configure:

1. A Google Cloud key with Places API (New) enabled and billing/quota configured. The current implementation uses IDs-only text search and live place details. Google platform fees apply. Follow the relevant Google Maps terms for your account; this is not a permanent exported Google business directory.
2. WhatsApp Business Cloud API phone number ID and token. Campaigns currently support approved templates without parameter placeholders or media headers. Template content must contain the intended seminar information and a clear opt-out route. Permission is recorded separately; being listed in Maps is not permission to message. Live messages are sent only by the operator's explicit send action.
3. For automatic Meet creation, Google OAuth client ID, client secret and refresh token authorized for `https://www.googleapis.com/auth/meetings.space.created`. Alternatively paste an existing Meet link into a seminar. Obtaining consent and refresh tokens is an external setup step; entering a client ID alone does not authorize a Google account.
4. Instagram and Facebook profile links. This release links to profiles; it does not automatically import or publish social media posts.

For unattended discovery, configure GitHub repository secrets `PORTAL_ORIGIN` (HTTPS origin, no trailing slash) and `CRON_SECRET` (matching the runtime secret). The endpoint must be reachable by GitHub Actions; owner-private Sites reject external scheduler calls. The workflow runs every 15 minutes and advances up to five search pages per run; it processes queued jobs, not new searches without an operator-created job. The workflow is a no-op until these secrets are configured. Panel-driven processing also works and resumes after reopening. No Google or Meta credentials were provided during implementation, so live provider calls and unattended production scheduling remain unverified.

Payments are currently reviewed manually after bank transfer or another off-platform payment. No card payment provider, automatic financial webhook, invoice generation, WhatsApp delivery/read webhook, AI model or patient-treatment assistant is connected. Site login is separate from Google identity and does not itself grant Meet admission.

## Development and validation

Node 22.13+; preserve the included package manager and lockfile. Install using the Sites dependency helper. `node node_modules/typescript/bin/tsc --noEmit` checks types. Build using the Sites build helper. Generate schema migrations with the `db:generate` package script. Then run `node tests/integration.mjs` to exercise the built Worker against an isolated in-memory D1 database. Test data is never deployed. The test suite covers owner claiming, authorization, CSRF, credential creation, password change/session revocation, payment gating, meeting URL validation, secret handling and scheduler authentication.

Local preview uses `sites-preview start /absolute/project/path` in the managed environment. Apply local Drizzle migrations in order through Wrangler using `.wrangler/state`. Production migrations are applied by Sites publishing. Do not run schema DDL at request time. Do not commit `.env`, `.wrangler`, build output, account credentials or WhatsApp screenshots.

Sources: [Meet REST API](https://developers.google.com/workspace/meet/api/guides/overview), [Meet authorization](https://developers.google.com/workspace/meet/api/guides/authenticate-authorize), [Places Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search), [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies).
