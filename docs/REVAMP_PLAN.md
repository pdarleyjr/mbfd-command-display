# MBFD Watch Desk Revamp Plan

Date: 2026-06-09
Branch: `revamp/command-display-polish-audit`

## Product Direction

The redesigned app language is **MBFD Watch Desk**: a calm, premium, operational command surface for MBFD chiefs/admins. It should read like a civic operations desk, not a sci-fi dashboard.

Principles:

- Information hierarchy first, aesthetic second.
- Fewer things shown more clearly.
- Active runs, readiness exceptions, and source degradation must dominate.
- Cameras orient the viewer; they do not own the screen.
- AI describes grounded state; it never commands or recommends.
- Map provides territory context; it must be legible and non-decorative.
- Desktop FLOW is the default; wall FILL is explicit or reserved for true wall/ultrawide regimes.
- No panel is filler. Empty/stale/error states remain honest and stable.

## Phase 1 — Stability And Navigation

- Add canonical `/stations/:number` routes for stations 1, 2, 3, 4, and 6.
- Keep `/station/:number` as a redirect for backwards compatibility.
- Add a persistent command navigation bar with Overview and station links.
- Add visible breadcrumb on station detail.
- Add a prominent `Back to Overview` control.
- Make selected station obvious in nav and map.
- Resolve station detail by static station-number map when overview snapshot is unavailable.
- Remove generated PWA service worker registration and add an old-SW/cache cleanup path.
- Add SPA `_headers` for security/cache policy.
- Remove production sourcemaps unless explicitly enabled.
- Stop local camera resolver 404 noise by degrading directly to poster/iframe when Functions are unavailable.

## Phase 2 — Information Architecture

Overview layout:

1. Persistent command bar and navigation.
2. Operational status strip: active runs, station readiness exceptions, apparatus OOS, data freshness.
3. Main situational row: active runs + readiness list as the primary center of gravity.
4. Secondary context: map and four camera feeds.
5. Support row: AI brief, attention queue, recent activity/source health.

Station detail layout:

1. Persistent command bar + breadcrumb + selected station nav.
2. Station hero with readiness and reasons.
3. Apparatus checkout/status and inspection/submission posture.
4. Open defects/equipment requests and assigned operators.
5. Station-specific runs, cameras, map territory, AI station brief, and source health.

Structural changes:

- Merge apparatus issues and open requests into a single attention queue on overview.
- Keep recent submissions visible but quieter.
- Make AI brief supportive, not primary.
- Move source freshness from bottom-only to an always-visible status strip.

## Phase 3 — Visual Polish

- Refine tokens: navy/graphite foundation, one MBFD blue accent, ember only for live/critical, green/amber/red for state.
- Introduce documented type roles and reduce 10px dependence.
- Add `clamp()` typography tuned for desktop, 4K, and wall without comical scaling.
- Flatten nested borders; use row groups and dividers sparingly.
- Use station images only where they clarify identity: station detail hero, small contextual thumbnails/backdrops.
- Restyle the map with tokenized colors, better labels, and native button overlays for station pins.
- Restyle camera tiles around source state: live, reconnecting, stale, offline, last-good poster.
- Improve empty/stale/error states with stable heights and direct language.

## Phase 4 — Data And AI Quality

- Add sensitivity-aware browser persistence:
  - no localStorage persistence for personnel;
  - shorter TTL for incidents/submissions;
  - longer TTL only for non-sensitive station summary/reference data.
- Fix `okStatuses` so endpoint-specific success statuses are honored explicitly.
- Add station-number canonical mapping and station detail fallback.
- Validate AI payload shape client-side before rendering model prose.
- Remove confidence UI unless a real scored model brief exists and it helps.
- Improve grounded fallback language with data gaps and freshness.
- Avoid `undefined`, `NaN`, and `0/0` through formatting helpers and tests.

## Phase 5 — Testing And Validation

Add Playwright tests for:

- Overview renders in mock mode.
- `/stations/1`, `/stations/2`, `/stations/3`, `/stations/4`, `/stations/6` render.
- Legacy `/station/1` redirects.
- Station card click navigates.
- Back to Overview works.
- Breadcrumb and nav selected state are visible.
- No body horizontal overflow across viewport matrix.
- No top-level panel overlap across viewport matrix.
- No console errors in mock local app.
- Camera fallback visual state renders without black/blank tiles.
- AI fallback/empty/stale state renders grounded language.
- Display-fill mode works on wall/ultrawide routes.
- Screenshot baselines for phone, portrait monitor, laptop, desktop, qhd, ultrawide, 4K, 2-TV wall, 3-TV wall.

Validation commands:

- `npm run typecheck`
- `npx tsc -p functions/tsconfig.json`
- `npm run lint`
- `npm run build`
- `npx playwright test`
- Local production preview smoke test.
- Deployed preview smoke test behind Cloudflare Access if session/credentials allow.

## Phase 6 — Deployment And Reporting

- Commit changes on `revamp/command-display-polish-audit`.
- Push branch to GitHub.
- Deploy Cloudflare Pages preview from branch.
- Validate preview.
- Deploy production only after preview/build/tests pass.
- Confirm `command.mbfdhub.com` still redirects through Cloudflare Access for unauthenticated users.
- Final report will include branch, commits, changed files, URLs, deploy id, screenshot matrix, tests, cache decision, known issues, and boundary confirmations.
