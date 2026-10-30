# Native plan bindings — continuation checkpoint

Stable v0.28.0 remains frozen. No installation, real HA runtime, migration or production acceptance is claimed. All tests below use synthetic data and isolated services/stores.

## Implementation

The Settings page now has a native plan association section. Refresh loads native floors, rooms, objects and openings. Select the floor and target category, expand a target, then choose an HA area/entity. Room climate sensors, object device/power/presence/status/vacuum-room sensors, and door/window contacts/blinds/locks/position sensors are selectable without code. Options use the visible registry/state rows and domain allowlists. Existing unavailable/missing assignments are reported without printing hidden entity IDs. `Automatic` restores original discovery; `None` explicitly detaches an entity. Only HA administrators can edit the native plan.

The old local-only floor preference is retained only for settings backward compatibility, not presented as a native association. Unlike that earlier preference, these changes are written into the original `neonplan3d.building` format, consumed by the original editor and 3D adapters. No geometry, furniture pack, material or arbitrary service payload is accepted by the narrow binding API. Full private backups preserve bindings; the existing share-template cleanup removes them. Selecting an unavailable but still existing entity is permitted for configuration; deleted entities are rejected when creating a new binding.

`neonplan3d/building/bind` validates target kind/field, domain, target existence, HA entity/area existence and admin authorization on the server. It requires the revision from the last native read. The storage layer serializes building saves and checks the revision inside the lock: a concurrent editor save causes a visible conflict instead of overwriting newer geometry. Saving errors restore the previously successful in-memory plan/revision. No silent retry is performed. Refresh resolves a conflict for a subsequent explicit selection.

Existing native building update dispatch remains in use, so native editor/view subscribers receive successful changes. HA state changes continue through the native view adapters; this is not a parallel simplified renderer. The association form itself refreshes plan structure explicitly, rather than opening a permanent websocket subscription. Native geometry is installation-shared with original HA permissions; this is not a new per-user private-plan backend. Browser preferences and cached binding responses remain user/connection scoped.

## Tests and evidence

- 711 JavaScript/TypeScript tests: 196 dashboard/module/contract tests plus 515 native frontend tests.
- 130 isolated Python backend tests, including nine new binding/storage cases: geometry preservation, domain/input rejection, save/reload/removal, stale revisions, concurrent saves, read-only server denial and simulated disk failure.
- Ten publication gate regressions and stable checksum/public-data/license checks.
- 61 Chromium checks: Music 20, platform 24, original renderer 9, native editor 8. New checks use the visual association form and reload native data; serialized native opening bindings pass through the original `openingEntities`/`openingState` adapters into the real renderer for open/closed/blind/unavailable states.
- Frontend selector/server domain parity is checked directly against the pure Python allowlist.
- Typecheck/build/candidate packaging and Python Ruff checks pass. Actions must be checked at the final published source/pinned integration commits before reporting remote success.

Files: `dashboard/platform/bindings.mjs`, `controller.mjs`, `page.mjs`, `locales.mjs`; native `bindings.py`, `storage.py`, `websocket.py`; `tests/test_bindings.py`; dashboard binding contract/controller tests; platform/renderer browser fixtures.

## Remaining work

Do not call priority 1 or milestone A complete solely from these checks. Further end-to-end coverage must exercise every requested device category (including lights, temperature, motion, vacuum, camera and alarms), complex imports and the complete native editor/view wrapper, plus accessibility and larger-plan performance. Remaining priorities include module configuration/approval/persistence/UI, calibrated robot tracking presentation, native notification scheduling and final visual/material/integration acceptance. Real HA/device permission/storage/streaming and installation/migration/rollback evidence remains external and absent. No intermediate HA testing is requested.
