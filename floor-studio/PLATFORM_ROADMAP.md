# AUREON platform completion roadmap

The attached mission expands the existing project; it does not restart it. Stable `dist/aureon-dashboard.js` v0.28.0 is frozen. Publish only reviewed source/candidate changes to master. Final promotion requires authorization. No intermediate Home Assistant installation or runtime test.

## Milestone A — Floor Studio

| Requirement | Evidence | Remaining acceptance |
| --- | --- | --- |
| Native NeonPlan engine/editor | Source integrated; frontend/backend build and tests | Final editor permissions, persistence/reload, native loading and interaction |
| Free library and own imports | Commerce removed; model importer and signature/binding preserved | Final import/restore UX and representative free model acceptance |
| Five looks | Neon/blueprint/day/night/real registered; shader tests | Final visual/device acceptance; Real now uses physical materials/maps/environment/shadows; final material authoring, fidelity and device acceptance pending |
| Four AUREON modules | Shared source/build implementations and tests | Final configuration UX and HA service acceptance |
| Integration/HACS | Separate builder, checksum/license/source provenance | Final install/update/migration/rollback; build success is not installation validation |

## Milestone B — product pages

The candidate now registers a shared, localized platform controller and Lit page component through `dashboard/entry.mjs`. These are working source components, not route-only preparation tiles. Data and commands remain HA-owned; no private home is a default.

| Page | Implemented candidate behavior | Remaining acceptance |
| --- | --- | --- |
| Startseite | Real user/time/presence and associated phone battery; weather/forecast, configured energy/cost, waste, light/climate/security/vacuum controls, existing scenes/scripts, Compact music | Final visual acceptance and real device behavior; optional summaries require selected sources |
| Räume | Discovered areas, native modal controls, explicit stored floor choice | Write-through room-to-native-plan mapping and room customization beyond local floor selection |
| Geräte | Registry/state intersection, search/area/domain/category filters, paginated entities; capability-based actions and dimmer/temperature/cover controls | Remaining domain-specific controls and live permission/device acceptance |
| Energie | Explicit power/period usage sources, validated units/tariff/currency, recorder change statistics, chart/table and comparisons | Real statistic metadata/reset/missing-period acceptance; no guessed meter or tariff |
| Sicherheit | Real locks/alarms/door/window/motion states; history; single-use scoped confirmation for sensitive commands | Server permission and code-required live device acceptance |
| Kameras | Native HA live card only after explicit open, state/close/reconnect; scope changes remove stream | Browser/provider streaming and native HA permission acceptance; no invented stream URL |
| Medien | Shared Full/Compact controls, categories and bounded service-offset pagination; persisted per-user preferences | Live SpotifyPlus/Spotcast edge cases and final visual approval |
| Automationen | HA automation toggles/trigger preserving conditions, confirmed scripts/scenes | Real execution/permissions and broader configuration UX |
| Kalender | Selected native calendars, 7/14/30/90-day agenda, explicit waste sensor/calendar widget with HA timezone | Real provider/update acceptance and notification scheduling (not implemented) |
| Einstellungen | Scoped user/origin persistence, EN/DE/PT, theme/appearance/density/widgets, energy/waste/floors/visibility; whitelisted import/export and native admin settings link | More granular module/room/integration editors and accessibility review; native users remain HA-managed |
| Assistant | Local visible-state query and explicitly confirmed native HA conversation | Real Assist availability/permissions; optional external providers not implemented |
| Floor Studio | Original engine/editor route retained, new physical Real rendering path | Final editor/import/reload/native interaction acceptance |

New platform page dictionaries have matching EN/DE/PT keys and follow HA language unless explicitly overridden per user. Legacy Floor Studio and optional-module translations still need a complete end-to-end visual audit.

## Milestone C — complementary integrations

- `INTEGRATION_MATRIX.md` and `ZIP_INVENTORY_VERIFIED.json` ground all nine original archives and licenses. The ninth is SpotifyPlus Card.
- SpotifyPlus, Spotcast, Dreame and Waste Collection Schedule remain independent installations; no duplicated backend or mandatory paid dependency.
- Full and Compact music share one controller per dashboard, with capability checks and protection against stale account/library responses. No global private-library cache.
- Waste date/calendar normalization is integrated into visible home/calendar widgets with explicit source selection. Scheduling notifications and real provider acceptance remain pending.
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

Implemented: native transport, volume, seek, shuffle/repeat, actual artwork/title/artist, player/account selection, SpotifyPlus favorites, device discovery/transfer, playlists/albums/favorite tracks and search. Missing capabilities are disabled. Optional Spotcast requires explicit compatible destination. Player/account/provider/appearance/optional destination settings persist through the scoped platform preferences. Categories and offset pagination are implemented; remaining provider edge cases need live acceptance.

Browser checks use synthetic artwork and mocked HA services, including the actual dashboard container. Checks cover service payloads, synchronization, errors, injection, keyboard focus, cleanup and 1440/820/390 px layouts. This does not replace live backend validation or the user's final visual approval.
