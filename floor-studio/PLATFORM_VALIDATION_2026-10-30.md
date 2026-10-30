# Platform and physical renderer candidate — 2026-10-30

This document updates the source candidate. Stable v0.28.0 is unchanged. It is not final installation approval, real Home Assistant acceptance, or a claim of product completion.

## Implemented source

- `dashboard/platform/preferences.mjs`: whitelisted configuration, scoped to HA origin and user. No credential, private plan or unrestricted service payload import/export. Blocked/corrupt storage recovers safely.
- `controller.mjs`, `actions.mjs`: visibility-filtered real state model, validated capabilities/parameters, explicit commands, single-use 60-second sensitive confirmations. User/connection/visibility changes invalidate async data and confirmations.
- `page.mjs`, `locales.mjs`, `styles.mjs`: functional home, rooms, devices, energy, security, cameras, automation, calendar, settings and assistant views. Home includes Compact music; Medien uses Full. See roadmap for exact remaining limitations.
- Music library: manual offset paging (20 library items, 10 search results), categories through the published SpotifyPlus services. Category list is bounded and locally paged; category selection browses playlists rather than playing a synthetic URI. Provider `next` URLs are never fetched. Cache/account invalidation remains shared by Full/Compact.
- `frontend/src/viewer/real-pbr.ts`: real Three.js MeshPhysicalMaterial rendering, generated albedo/roughness/metalness/normal maps, PMREM RoomEnvironment, directional/environment lighting, shadows and ACES tone mapping. Preserves original renderer geometry/ownership/fold masks, restores original materials/settings after drawing and disposes cached physical resources on quality changes. Other looks retain their original rendering path.
- Real supports architectural, wood, fabric, metal, glass and stone presets. Generated maps are deterministic, not downloaded paid textures. Furniture groups use type-based presets; this is not a finished user-authored PBR material-map editor or proof of photorealistic fidelity for every imported asset. Low quality reduces texture size and omits expensive shadows/transmission.

## Verification

`npm test`: 702 passing JavaScript/TypeScript tests (190 dashboard/module/contract tests plus 512 native frontend tests). This includes 26 new platform tests, five physical-material tests and three music pagination/category tests.

`python -m unittest discover -s floor-studio/tests -p 'test_*.py'`: ten publication gate tests. Isolated Python backend suite: 121 tests; exact published revision also runs in both repository workflows.

`npm run build`: typecheck, locked frontend build, measured bundle budgets, dashboard compilation and candidate packaging pass. Viewer measures 859.9 KiB; its bounded budget is now 880 KiB to accommodate physical shaders/environment generation (previous 840 KiB). Other bundle budgets are unchanged.

`npm run test:browser` runs three actual Chromium suites against synthetic fixtures, without connecting to or installing HA:

- Music: 20 checks, Full/Compact synchronization, actual service payloads, categories/paging, failures, locale, injection, focus, cleanup and 1440/820/390 layouts.
- Platform: 22 checks, functional pages/commands/confirmations, lazy native camera fixture, statistics/calendar/assistant, cross-account cleanup and ten pages at three widths.
- Original floor renderer: eight checks, all five modes draw triangles with valid shaders and distinct captures; actual physical maps/materials present; original materials restored after draw; low quality releases previous resources; disposal removes canvas.

Native camera helper, recorder/calendar/service responses are synthetic contracts. They are not a substitute for actual HA/provider/device acceptance. Browser screenshots are review evidence, not final visual approval. The synthetic standalone page does not load HA's icon registry.

## Captures and reproduction

Workflows upload `build/music-browser`, `build/platform-browser` and `build/floor-browser` as review artifacts. They include full/compact at 1440/820/390; all ten platform views at those widths; Neon, Blueprint, Day, Night, Real and Real-low. Only synthetic data/artwork/plans appear. Run locked dependency installation, `npm run build`, then `CHROME_BIN=/path/to/chromium npm run test:browser` to reproduce.

## Remaining development and external acceptance

Milestone A (all development ready for final acceptance) is **not complete**. Remaining independent work includes broader editor persistence/import/permission interaction tests; write-through native room/plan association; richer module/room/integration configuration; calibration-driven cross-provider robot tracking presentation; notification scheduling; accessibility/performance review and final design comparison. Physical material authoring and imported asset fidelity still need more coverage.

Milestone B (100% production validation) is **not complete**: no live HA, SpotifyPlus/Spotcast, actual camera/robot or user device has been exercised; no installation/update/migration/rollback runtime has occurred. Stable HACS update is not approved. Final promotion requires explicit user authorization after candidate completion. No intermediate installation or real HA test is requested.
