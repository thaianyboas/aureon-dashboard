# AUREON platform completion roadmap

The attached mission expands the existing project; it does not restart it. Stable `dist/aureon-dashboard.js` v0.28.0 is frozen. Publish only reviewed source/candidate changes to master. Final promotion requires authorization. No intermediate Home Assistant installation or runtime test.

## Milestone A — Floor Studio

| Requirement | Evidence | Remaining acceptance |
| --- | --- | --- |
| Native NeonPlan engine/editor | Source integrated; frontend/backend build and tests | Final editor permissions, persistence/reload, native loading and interaction |
| Free library and own imports | Commerce removed; model importer and signature/binding preserved | Final import/restore UX and representative free model acceptance |
| Five looks | Neon/blueprint/day/night/real registered; shader tests | Final visual/device acceptance; Real remains procedural, full PBR pending |
| Four AUREON modules | Shared source/build implementations and tests | Final configuration UX and HA service acceptance |
| Integration/HACS | Separate builder, checksum/license/source provenance | Final install/update/migration/rollback; build success is not installation validation |

## Milestone B — product pages

| Page | Current source | Remaining work |
| --- | --- | --- |
| Startseite | Actual presence/weather overview; new Compact music | Replace preparation tiles; waste/energy/security summaries and consistent locale |
| Räume | Actual HA area/device/entity discovery; area-to-device navigation | Compact popups, light/climate controls, floor associations, room customization |
| Geräte | Registry filters and capability-based controls | Remaining domain coverage and accessible visual refinement; click-first settings |
| Energie | Navigation/preparation card; Floor Studio energy is separate | Configurable real usage/power/cost/history and rate settings; no guessed totals |
| Sicherheit | Navigation/preparation card; Floor Studio window module separate | Door/window/alarm summaries, scoped controls and sensitive confirmations |
| Kameras | Navigation/preparation card; Floor Studio camera features separate | Permission-aware streams/states, optional floor association and reconnect behavior |
| Medien | Functional Full/Compact player in source candidate | Live SpotifyPlus/Spotcast acceptance, pagination/categories/edge cases, final visual approval |
| Automationen | Dedicated page absent | HA automations/scripts/scenes, state/actions and safe confirmations |
| Kalender | Agenda navigation/preparation card | Native events, explicit waste sources, timezone/locale, empty/loading/error states |
| Einstellungen | Existing theme/registry/card settings; music settings | Unify per-user persistence, visibility and integration configuration without ordinary YAML editing |
| Floor Studio | Planta route exists | Final navigation/permission polish, without private defaults |

Existing page labels are not consistently translated. A route or preparation tile is not an implemented feature. New music follows HA EN/DE/PT; other pages still require shared localization.

## Milestone C — complementary integrations

- `INTEGRATION_MATRIX.md` and `ZIP_INVENTORY_VERIFIED.json` ground all nine original archives and licenses. The ninth is SpotifyPlus Card.
- SpotifyPlus, Spotcast, Dreame and Waste Collection Schedule remain independent installations; no duplicated backend or mandatory paid dependency.
- Full and Compact music share one controller per dashboard, with capability checks and protection against stale account/library responses. No global private-library cache.
- Waste date/calendar normalization is implemented and tested as a **contract**, not yet a visible widget. Next: explicit source/type selection and widget presentation.
- Cross-provider vacuum transform is implemented and tested as a **contract**, not live tracking. Require actual position, map identity, units, timestamp and calibration. Missing/stale/unmatched data yields no position.
- Simon42/Bubble Card inform independently written components; no restricted Simon code/assets copied.
- The supplied JARVIS is a Claude Code browser assistant. Do not import its bridge as a mandatory HA backend. Native HA conversation/basic queries can be independent; optional providers require an explicit adapter and permission model. Sensitive actions require server authorization and appropriate confirmation.

## Milestone D — quality and distribution

1. Preserve stable checksum, private-data scan, upstream license and module parity.
2. Build frontend and dashboard candidate from locked dependencies; reject stale source/bundle evidence. Never package unbuilt source as a compiled dashboard.
3. Run unit/contract/gate tests and real browser checks with isolated synthetic fixtures. These do not certify HA runtime behavior.
4. Verify Actions at exact published commits in both repositories. Pin integration `SOURCE_COMMIT`; no installable intermediate integration.
5. Complete responsive/accessibility/performance and final visual/editor/page acceptance. Finish Real/PBR before claiming it.
6. Only after candidate completion and authorized promotion: verify final HACS and actual HA behavior, migration and rollback. No 100% claim from mocks/build alone.

## Music reference and limits

The supplied image is the official visual reference: horizontal large cover left, controls right, dark glass, green/blue/violet ambience and floating dock. No Upgrade, purchase, advertising, fictional person or reference cover is a default. ControlRoom Music Card reference commit `fc3c869b3468301c6ff1f6ac59f98df06456d351` was inspected read-only and is unchanged.

Implemented: native transport, volume, seek, shuffle/repeat, actual artwork/title/artist, player/account selection, SpotifyPlus favorites, device discovery/transfer, playlists/albums/favorite tracks and search. Missing capabilities are disabled. Optional Spotcast requires explicit compatible destination. Settings remain session-local; persistent per-user settings and broader category/pagination parity are pending.

Browser checks use synthetic artwork and mocked HA services, including the actual dashboard container. Checks cover service payloads, synchronization, errors, injection, keyboard focus, cleanup and 1440/820/390 px layouts. This does not replace live backend validation or the user's final visual approval.
