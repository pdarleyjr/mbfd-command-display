# Security

This is a staff-only, read-only display. Its security posture has two pillars: a hard
**read-only boundary** (it can never write to MBFDHub or touch admin/write flows) and a
**staff-only access boundary** (Cloudflare Access). Sensitive fields are redacted at the hub
before they ever leave it.

## The hard boundary: read-only, never `/admin`

The display **must never** modify the hub's `/admin` Filament panel, employee
submission/write/approval flows, or production data. This is enforced structurally, not by
convention:

1. **SPA** — only ever issues `GET` (see [`apiClient.ts`](../src/lib/apiClient.ts), which hard-codes
   `method: 'GET'`).
2. **Edge `/api` middleware** — [`functions/api/_middleware.ts`](../functions/api/_middleware.ts)
   returns 405 JSON for any verb other than `GET`/`HEAD` (and 204 for `OPTIONS`). No write verb
   reaches a route.
3. **Per-route guards** — every route additionally exports
   `onRequestPost/Put/Patch/Delete = block` (the shared 405 handler in
   [`_shared/route.ts`](../functions/_shared/route.ts)) as defense-in-depth.
4. **Hub client** — [`fetchHub`](../functions/_shared/hubClient.ts) only ever sends
   `method: 'GET'`, so the gateway cannot trigger a write upstream even if a route bug let a
   non-GET through.
5. **Hub side** — the `/api/display/*` routes are behind a `display.readonly` middleware that
   returns 405 on non-GET requests, plus `throttle:120,1`.

The display only reads `/api/display/*`. It has no path to `/admin`, no path to any write
endpoint, and no credentials that would authorize a write.

## Access boundary: staff-only

- A **Cloudflare Access** application gates `command.mbfdhub.com` to `@miamibeachfl.gov`
  identities via OTP (team `darl.cloudflareaccess.com`). This is the primary authentication
  boundary; unauthenticated users never reach the SPA or the Functions.
- **Defense-in-depth JWT verification**: when `CF_ACCESS_AUD` + `CF_ACCESS_TEAM` are configured,
  [`requireAccess`](../functions/_shared/access.ts) independently validates the
  `Cf-Access-Jwt-Assertion` header inside each Function — checks `alg === RS256`, `exp`/`nbf`
  (60s skew), `aud` match, `iss` match, and RS256 signature against the team's JWKS
  (`/cdn-cgi/access/certs`, cached ~1h in-isolate). On any failure it returns 401. If the env
  vars are absent, this check is skipped and Access at the edge is the only guard.
- The Access cookie rides along on same-origin requests (`credentials: 'same-origin'` in the API
  client).

## Data redaction (at the hub)

The hub's `/api/display/*` API is redacted server-side before any payload leaves the origin. It
removes:

- `VIN`, Snipe-IT identifiers, free-text `notes`, `current_location`, signatures,
  `pd_case_number`.
- Personnel names — **except** the dedicated `/stations/{id}/personnel` endpoint, which is
  allowed to return names precisely because the display is staff-only behind Access.

The display types in [`src/types/display.ts`](../src/types/display.ts) mirror this redacted
shape: there are no fields for VIN, location, financials, or case numbers. The client never
requests, and the server never sends, the redacted data.

## No public attack surface for backends

- **No public Ollama.** The AI brief is generated server-side via the hub's `LocalAIService`
  (qwen3.6:35b). The browser never talks to Ollama. See [AI_BRIEFING.md](AI_BRIEFING.md).
- **No public database.** The SPA only sees redacted JSON over the edge gateway.
- **No secrets in the client bundle.** Only `VITE_`-prefixed (non-secret) values are baked into
  the build. Edge secrets (`HUB_DISPLAY_TOKEN`, `CF_ACCESS_*`) live in
  `wrangler pages secret put` and are never exposed to the browser.

## Edge gateway hardening

- **Security headers** on every gateway response (`securityHeaders()` in
  [`_shared/response.ts`](../functions/_shared/response.ts)): `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (the gateway emits
  JSON, never an embeddable document).
- **Input validation at the boundary.** Dynamic `:id` params are validated by
  [`positiveIntParam`](../functions/_shared/params.ts) (`^[0-9]{1,9}$`, positive integer) and
  rejected with 400 before any value is interpolated into a hub URL.
- **SSRF containment on camera resolvers.** The Ozolio resolver
  ([`api/cameras/ozolio.ts`](../functions/api/cameras/ozolio.ts)) only accepts an `oid` matching
  `^EMB_[A-Za-z0-9]{6,16}$` and only ever interpolates it into the fixed `relay.ozolio.com`
  upstream; the returned session id is re-validated and the `output.source` must contain
  `.m3u8`. The news resolver ([`api/cameras/news.ts`](../functions/api/cameras/news.ts)) is a
  strict allow-list — unknown keys 404 by design. Both return a 302 to the public, CORS-open
  HLS master so the browser plays it directly (no open proxy).
- **Rate limiting.** The hub side applies `throttle:120,1` to the display API (and a stricter
  throttle on the AI endpoint); the edge cache absorbs most repeat traffic before it reaches the
  hub.
- **`noindex, nofollow`** on the SPA shell ([`index.html`](../index.html)) — the display is not
  meant to be crawled or surfaced publicly.

## Auditing

- Cloudflare Access logs every authenticated session and identity.
- Cloudflare logs cover the Pages app and Functions.
- The optional browser Sentry DSN (`VITE_SENTRY_DSN`) captures client errors when configured.

## Secret hygiene checklist

- [ ] No secret committed (`.gitignore` denies `.env`, `.dev.vars`, `*.local`; only
      `.env.example` is tracked).
- [ ] Edge secrets set via `wrangler pages secret put`, never in `wrangler.toml` or `.env`.
- [ ] `VITE_*` contains only non-secret values (it ships in the bundle).
- [ ] Access application restricts to `@miamibeachfl.gov`.
- [ ] `HUB_DISPLAY_TOKEN` (if used) matches the hub's expected shared secret.

## Threat model summary

| Concern | Mitigation |
|---------|-----------|
| Unauthorized viewing | Cloudflare Access (+ optional in-Function JWT verify) |
| Write to the hub | GET-only at SPA, middleware, route, and hub client; hub `display.readonly` 405s |
| Touching `/admin` / write flows | No code path or credential exists; display only reads `/api/display/*` |
| Leaking PII / sensitive fields | Hub-side redaction; personnel names only behind Access on one endpoint |
| SSRF via camera params | Strict `oid` regex + fixed upstream; news key allow-list |
| Path injection via `:id` | `positiveIntParam` validation → 400 |
| Blank wall during an outage | Degrade-never-blank (edge cache → KV → empty) + client last-good |
| Public backend exposure | No public Ollama, no public DB, no secrets in bundle |
