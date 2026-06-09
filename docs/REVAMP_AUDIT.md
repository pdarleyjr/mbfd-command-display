# MBFD Command Display Revamp Audit

Date: 2026-06-09
Branch: `revamp/command-display-polish-audit`
Baseline audited from local mock mode against current branch plus production access check. Production `https://command.mbfdhub.com` redirects to Cloudflare Access, so unauthenticated browser inspection is intentionally blocked.

## Executive Summary

The prototype has a solid read-only boundary and a credible degrade-never-blank data architecture, but it is not yet command-center-grade. The biggest issues are navigation shape, stale service-worker behavior, visual density, camera fallback noise in local/non-Functions mode, route resilience, privacy-sensitive local persistence, and a performance regression caused by generated PWA/service-worker behavior plus eager module preload of the Three.js chunk.

Audit health score: **12/20 — acceptable, significant work needed**

| Dimension | Score | Key finding |
|---|---:|---|
| Product / UX | 2/4 | Overview shows all domains but does not create a single first-glance command narrative. |
| Accessibility | 2/4 | Focus states exist, but interactive SVG map semantics, breadcrumb absence, tiny labels, and status noise need work. |
| Performance | 2/4 | Build passes, but `three` is preloaded, sourcemaps ship, fonts are heavy, and live camera iframes can be expensive. |
| Responsive / Layout | 3/4 | No body horizontal overflow found; phone/tablet overlap detector flagged map/grid area collisions and several views require heavy internal scroll. |
| Security / Data | 3/4 | Strong GET-only edge boundary, but browser persistence and API cache headers need sensitivity-aware treatment. |
| Service Worker / Cache | 0/4 | Generated PWA precaches `index.html`; this can preserve stale app shells after deploy. |
| Code Quality / Tests | 0/4 | No Playwright coverage existed for navigation, overlap, screenshots, stale states, or accessibility smoke checks. |

## Research Pass — Design Implications

Targeted research on command-center dashboards, smart-city UIs, large-display dashboard legibility, accessible dashboard design, Core Web Vitals, visual regression testing, and Cloudflare cache pitfalls points to these implementation rules:

- Treat the wall as a decision surface, not a data mural: active runs, readiness exceptions, and source health must dominate.
- Use status lanes and grouped operational zones rather than equal-weight cards competing for attention.
- Avoid decorative glassmorphism; data cards need mostly opaque surfaces and contrast-tested text.
- Large-display legibility requires direct labels, thick visual marks, tabular numerals, and no 10px dependency for meaning.
- Responsive IA must adapt by context: phones need a commander brief; desktop needs readable flow; wall mode needs fill without scroll.
- Visual regression tests need deterministic fixtures and the exact wall aspect ratios.
- Service workers must not cache live APIs and should not cache `index.html` unless update UX is explicit.
- Every live data domain needs a clear distinction between loading, empty, stale, error, and last-good states.

## Product / UX Audit

What the app is trying to communicate:

- All-station readiness posture.
- Active PulsePoint runs and incident geography.
- Station-by-station operational readiness and defects.
- Camera context for territory awareness.
- A descriptive AI summary and data-gap narrative.
- Source freshness and cache provenance.

What is visually dominant now:

- The map and camera feeds pull disproportionate attention on overview.
- Header stat chips are dense and compete with the main panels.
- Station readiness rows contain valuable data, but they are buried among equal-weight panels.
- Station detail hero is visually strong, but supporting readiness reasons and apparatus context do not form a clear command story.

What is confusing or crowded:

- Overview does not answer “what matters right now?” within 5 seconds because active runs, readiness, cameras, map, AI, requests, and issues all look similarly important.
- Route naming is singular (`/station/:number`) while the mission requires `/stations/:number` deep links.
- Station detail has an `Overview` button, but no breadcrumb, persistent route context, selected-station nav state, or top-level station navigation.
- The map station pins are keyboard focusable inside an SVG, but the overview has no obvious station nav landmark.
- Camera header says “4 live” before actual health is known.
- AI model tag and confidence can make a fallback summary feel like model authority rather than grounded counts.

What should be removed, merged, collapsed, or restyled:

- Merge open requests and apparatus issues into an “Attention Queue” on overview so issues that need action do not compete as separate filler cards.
- Collapse low-priority recent activity into a calmer bottom strip or smaller support panel.
- Keep the map but reduce its dominance unless there are active incident pins.
- Keep four overview cameras maximum; use health-aware labels and avoid loading unnecessary station cameras offscreen.
- Reduce chip proliferation in the header and panels.

## Layout / Responsiveness Audit

Baseline screenshots were captured in `docs/screenshots/baseline/` for overview and Station 1 detail.

| Viewport | Overview screenshot | Station screenshot | Findings |
|---|---|---|---|
| 390x844 phone | `docs/screenshots/baseline/phone-overview.jpg` | `docs/screenshots/baseline/phone-station-1.jpg` | No body horizontal overflow; overview scrolls heavily; overlap detector flagged map/grid due first stacked rows; labels as small as 10px. |
| 768x1024 tablet portrait | `docs/screenshots/baseline/tablet-portrait-overview.jpg` | `docs/screenshots/baseline/tablet-portrait-station-1.jpg` | No body overflow; overview and station detail scroll; overlap detector flagged station hero vs first panels in portrait grid. |
| 1080x1920 portrait monitor | `docs/screenshots/baseline/portrait-monitor-overview.jpg` | `docs/screenshots/baseline/portrait-monitor-station-1.jpg` | Readable but too tall/scroll-heavy; no breadcrumb; overview still lacks 5-second command hierarchy. |
| 1366x768 laptop | `docs/screenshots/baseline/laptop-overview.jpg` | `docs/screenshots/baseline/laptop-station-1.jpg` | No horizontal overflow; overview requires scroll on common laptop height; panel density remains high. |
| 1440x900 desktop | `docs/screenshots/baseline/desktop-1440-overview.jpg` | `docs/screenshots/baseline/desktop-1440-station-1.jpg` | No horizontal overflow; overview scrolls; station detail almost fits but still lacks route context. |
| 1920x1080 TV/desktop | `docs/screenshots/baseline/desktop-1080p-overview.jpg` | `docs/screenshots/baseline/desktop-1080p-station-1.jpg` | Overview barely overflows vertically; station detail fits; hierarchy still equal-weight. |
| 2560x1440 desktop | `docs/screenshots/baseline/qhd-overview.jpg` | `docs/screenshots/baseline/qhd-station-1.jpg` | Layout fits; map/cameras still pull focus. |
| 3440x1440 ultrawide | `docs/screenshots/baseline/ultrawide-overview.jpg` | `docs/screenshots/baseline/ultrawide-station-1.jpg` | FILL mode activates; no overflow; information feels spread out rather than intentionally staged. |
| 3840x2160 4K | `docs/screenshots/baseline/4k-overview.jpg` | `docs/screenshots/baseline/4k-station-1.jpg` | FLOW mode stays active; good readability but excessive negative regions in some panels. |
| 8248x2160 wall approximation | `docs/screenshots/baseline/wall-2tv-overview.jpg` | `docs/screenshots/baseline/wall-2tv-station-1.jpg` | FILL mode fits; need stronger wall-specific hierarchy and station nav. |
| 12372x2160 three-TV wall | `docs/screenshots/baseline/wall-3tv-overview.jpg` | `docs/screenshots/baseline/wall-3tv-station-1.jpg` | FILL mode fits; giant width makes equal-weight panels feel scattered. |

Baseline automated checks:

- Body horizontal overflow: none found in tested local mock viewports.
- Body vertical overflow: none; app owns scroll regions.
- Internal vertical overflow: expected in FLOW, heavy on phone/tablet/portrait/laptop.
- Panel overlap: detected on phone/tablet overview and tablet station detail by DOM intersection measurement.
- Text floor: 10px elements appear across layouts; several are functional labels and too small for wall/TV viewing.
- Navigation: station click works, but route is `/station/1` not required `/stations/1`; breadcrumb absent.

## Visual Design Audit

Color tokens:

- Token system exists and is better than a generic neon dashboard.
- MBFD navy/interactive blue is used but the map still embeds raw hex values.
- Ember is appropriately reserved for active runs/live, but camera “live” state is optimistic.

Spacing and typography:

- Fluid type scale exists, but small labels and control text reach 10px.
- The header uses many stats in one line; it is efficient but noisy.
- Card padding is consistent but too uniform, creating “all panels equal” visual rhythm.

Card treatment:

- Flat panels are a good direction.
- Too many nested bordered rows and chips increase density.
- The station hero image is tasteful, but overview station cards no longer use thumbnails; this is fine for density, but station identity could be warmer without photo collage.

Contrast:

- Main text contrast is generally acceptable on opaque panels.
- Faint labels and map labels can be too subtle, especially on wall/TV.
- Text over camera/video uses black gradients; this is safer than raw image text but should be tested against live feeds.

State design:

- Empty states exist and avoid blank panels.
- Loading/stale/source badges exist but are not consistently prominent.
- Camera offline and reconnecting states exist but local dev produces repeated 404 console errors when Functions are not running.
- AI fallback is grounded, but needs less model-centric presentation and clearer data-gap wording.

## Accessibility Audit

Positive findings:

- Buttons are native in station cards and header controls.
- `:focus-visible` ring exists.
- Reduced-motion CSS disables ticker and reveal animation.
- Status chips combine glyph/text/color.
- The SPA uses a real `<main>` region.

Issues:

- No persistent `<nav>` landmark or breadcrumb in station detail.
- Overview has no accessible page heading beyond header label structure.
- Interactive station pins are `<g role="button">` inside an SVG with parent `role="img"`, which can flatten descendants in assistive tech.
- Space key on SVG pins does not prevent page scroll.
- Several meaningful labels render at 10px.
- Camera and map labels depend on small text and low-contrast faint color.
- Some status is effectively color-first (station left border/bar) even if labels exist nearby.
- Ticker-like recent submissions can create screen-reader noise if not contained.

## Performance Audit

Baseline build:

- `npm run build` passed.
- Main CSS: 44.4 kB, gzip 8.84 kB.
- Main app JS: 79.08 kB, gzip 24.73 kB.
- Vendor JS: 66.04 kB, gzip 21.38 kB.
- Three.js chunk: 1,557.57 kB, gzip 449.10 kB.
- Source maps are generated and large (`three` map ~6.1 MB).
- `dist/index.html` modulepreloads the `three` chunk even though ambient backdrop is disabled by default.

Risks:

- LCP target is likely achievable for shell, but modulepreloaded `three` and many font files compete with useful work.
- CLS risk is moderate: panels reserve space, but station images, iframe cameras, and variable panel content can still shift.
- Camera iframes load external YouTube/Ozolio resources and stats calls; overview should keep exactly four and station routes should avoid offscreen excess.
- No memory soak test exists for cameras.
- No Lighthouse run against production because Access blocks unauthenticated inspection; local production preview should be used after fixes.

## Data-State Audit

Positive findings:

- Dev fixtures are explicitly gated by `import.meta.env.DEV && VITE_MOCK === '1'`, so they should not ship in production.
- Normalizers reconcile flat hub readiness into nested UI shape.
- Edge gateway has KV last-good and safe empty fallbacks.
- UI generally avoids blank panels.

Issues:

- `useStationDetail()` depends on overview summary to discover station id, so direct station routes are weak when snapshot is missing.
- `okStatuses` option is declared but not passed to `getJson()`; 202/504 are globally allowed instead.
- Browser `localStorage` last-good cache stores all query types for 12h, including personnel and incident data.
- API origin responses set `cache-control: public`, including sensitive staff-only JSON routes.
- Mock data intentionally uses low readiness everywhere, but the UI can make that look like production alarm if screenshots are shared out of context.
- No automated guard for literal `undefined`, `NaN`, or `0/0` exists.

## Navigation Audit

Current behavior:

- Overview station cards navigate to station detail.
- Station detail has a small `Overview` button.
- Browser Back works for `/station/1` because React Router handles it.
- Direct `/station/1` works only after snapshot resolves enough to map number to station id.

Missing requirements:

- Required routes `/stations/1`, `/stations/2`, `/stations/3`, `/stations/4`, `/stations/6` do not exist.
- Breadcrumb is missing.
- Persistent top navigation across stations is missing.
- Selected station state is not visually represented outside the station page title.
- No deep-link fallback when overview snapshot is unavailable.

## Service Worker / Cache Audit

Current generated behavior after `npm run build`:

- `vite-plugin-pwa` generates `dist/sw.js`, `dist/workbox-*.js`, `dist/registerSW.js`, and source maps.
- `dist/index.html` registers `/sw.js` automatically.
- Workbox precaches `index.html`, JS chunks, CSS, favicon, and manifest.
- Runtime route for `/api/` is `NetworkOnly`.
- Local dev had no active SW registrations/cache names, but production builds will register the generated SW.

Risks:

- Precached `index.html` can preserve a stale app shell and explains hard-refresh reports.
- Cache names are generated Workbox names, not an explicit MBFD version strategy.
- It does not collide with `mbfd-wall-v1` by name in this local build, but generated Workbox caches are opaque to operators.
- PWA install value is low for this staff display; Cloudflare Pages plus browser HTTP cache is enough for hashed assets.

Decision to implement: remove/disable the generated PWA service worker, ship an unregister/cleanup path for old `sw.js` registrations and legacy wall caches, and keep API/cache freshness at the edge/browser data layer instead of app-shell SW.

## Security Boundary Audit

Verified/positive:

- Production `command.mbfdhub.com` is still behind Cloudflare Access.
- SPA API client hard-codes `GET`.
- `/api` middleware rejects non-GET/HEAD.
- Route helpers and `fetchHub()` are GET-only.
- No direct Ollama browser exposure is present.
- No `/admin` or write route code path is present in this repo.
- Station camera resolver params are allow-listed/validated.
- No secrets found in inspected source files.

Security issues to fix:

- Add Pages `_headers` for the SPA document: CSP, frame ancestors, permissions policy, referrer, nosniff.
- Change browser cache semantics for JSON to `private`/`no-store` while still allowing Cloudflare edge cache/KV internally.
- Do not persist personnel to localStorage; shorten incident/submission persistence.
- Disable source maps in production deploys unless private error tracking needs them.

## Code Quality Audit

Positive:

- Component boundaries are reasonably clear: command, station, common, hooks, lib, data.
- Read-only edge gateway is centralized.
- Station/camera catalogs are explicit and honest about gaps.
- Typecheck/build baseline passes.

Issues:

- No Playwright config/tests exist.
- `docs/ARCHITECTURE.md` says wide/ultrawide/wall are no-scroll, while code only makes ultrawide/wall no-scroll.
- Map embeds raw colors and an emoji anchor.
- Local dev without `wrangler pages dev` yields repeated `/api/cameras/ozolio` 404 console errors.
- `CameraTile` native HLS path never escalates from reconnecting to offline.
- Header metrics repeat and compress too much on small screens.
- Lint warning remains in `src/components/three/MiamiBeachTerrain.tsx` because component and non-component exports are mixed.

## Priority Findings

### P0 Blocking

- Stale app shell risk from generated service worker precaching `index.html`.
- Required route contract `/stations/:number` missing.
- No automated Playwright regression coverage for this layout-sensitive product.

### P1 Major

- Station detail lacks breadcrumb and persistent station navigation.
- Direct station detail depends on overview snapshot to resolve station id.
- Overview hierarchy is too equal-weight and cluttered.
- Browser localStorage persists sensitive staff data too broadly.
- JSON responses use `public` cache semantics for staff-only data.
- Three.js chunk is modulepreloaded despite ambient backdrop being off.
- SVG map interactivity is not robustly accessible.
- Camera health labels and counts are optimistic.

### P2 Minor

- Production sourcemaps are enabled.
- PWA manifest has no icons.
- Small labels at 10px are overused.
- Map raw colors bypass tokens.
- React Router v7 future warnings appear in console.
- Local dev camera resolver path produces noisy 404s unless Functions are running.

### P3 Polish

- Header stat spacing and chip density can be calmer.
- Station images could provide better contextual identity in detail and selected station views.
- Recent submissions ticker should be visually quieter and less screen-reader noisy.

## Baseline Verification Commands

- `npm run build` — passed; warned about large `three` chunk.
- Subagent baseline: `npm run typecheck` — passed.
- Subagent baseline: `npx tsc -p functions/tsconfig.json` — passed.
- Subagent baseline: `npm run lint` — passed with one Fast Refresh warning.
- Playwright local mock viewport audit — completed with screenshots in `docs/screenshots/baseline/`.
- Production Access check — unauthenticated browser redirected to Cloudflare Access login.
