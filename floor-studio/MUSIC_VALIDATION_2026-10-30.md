# AUREON Music candidate validation — 2026-10-30

**Not promoted to HACS. Stable v0.28.0 unchanged. No Home Assistant installation or live service calls were performed.**

## Implemented source

- New original Lit Full/Compact player, compiled with the actual AUREON dashboard candidate. Full mounts on Medien; Compact mounts on the existing Startseite/Início route and opens Full. They share one dashboard-scoped controller and backend states.
- Official supplied image guides the large cover-left/player-right composition, glass, green/blue/violet ambience, typography, controls and floating dock. Mobile adapts to a stacked layout. No Upgrade, commerce, fictional person/cover, hidden paid dependency or external script/CDN.
- HA capability/service checks for play/pause, previous/next, shuffle/repeat, volume, seek and source selection. SpotifyPlus remains an independent account-scoped integration; implemented services cover playlists/albums/favorite tracks, search tracks/albums/playlists, favorite status/write, Connect device discovery and explicit transfer.
- Optional Spotcast v6 service contract requires a selected compatible destination; no automatic fallback after an error. Generic HA players retain their actual native controls.
- Safe artwork URL validation, text-only entity labels, EN/DE/PT locale, focus preservation, unavailable/unsupported/loading/empty/error states, stale-account/track protection and subscription cleanup.
- Settings are session-local. Long libraries currently request the first 20 items; pagination/categories and persistent per-user configuration remain pending. No live Spotify account/device result is invented.
- Source modules under `dashboard/integrations` provide tested waste-format/date/calendar and calibrated vacuum-position contracts only. They are not yet visible widgets or live tracking.

## Local evidence

- 30 new dashboard/controller/contract unit tests (23 music/locale cases, 7 waste/vacuum cases).
- Existing AUREON/module/frontend regression suites remain part of `npm test`.
- TypeScript, native frontend build, bundle budgets and candidate dashboard compilation pass.
- Candidate packaging now verifies its own complete source/build-input inventory and bundle checksum, in addition to native frontend evidence. Stable `dist/` remains untouched.
- 18 real Chromium browser checks pass against isolated synthetic HA fixtures, including the actual dashboard container. The fixture never connects to a Home Assistant server.
- Desktop/tablet/mobile layouts at 1440/820/390 px were rendered, inspected and checked for horizontal overflow. Test covers are geometric synthetic assets used only by the browser test server, not application defaults.
- Browser cases: mount without service calls; pause payload; synchronized Full/Compact state; checked favorites; returned library playback; explicit search; actual returned device selection; permission-error display; 3 responsive layouts; locale switching; markup-injection protection; preserved keyboard focus; unavailable-state controls; unsubscribe cleanup; Compact-to-Medien navigation; integrated dashboard service routing.
- Archive CRC/member/hash inventory and relevant licenses/API architecture reviewed for all nine ZIPs. See `INTEGRATION_MATRIX.md`, `ZIP_INVENTORY_VERIFIED.json` and `PLATFORM_ROADMAP.md`.

## Still not certified

Live SpotifyPlus/Spotcast backend permissions, account/device variants, actual Spotify playback/favorites and final visual approval. Final Floor Studio editor/module acceptance, complete Real/PBR, other dashboard pages, waste widget, actual vacuum tracking, JARVIS/Assist adapter, HACS installation/update/migration/rollback also remain pending. Do not describe the platform as 100% complete.

Read-only ControlRoom Music Card reference: `fc3c869b3468301c6ff1f6ac59f98df06456d351`; that repository was not modified. No supplied ZIP, private apartment, paid pack, token, license key or reference image is included in the public source.
