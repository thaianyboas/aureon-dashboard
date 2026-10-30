# Source build status — 2026-10-30

- TypeScript typecheck: passed.
- Full frontend build: passed. Measured main bundle ~744 KiB; 3D bundle ~837 KiB. Size budgets explicitly adjusted to 752/840 KiB for the added modules and themes, with the other upstream limits retained.
- JavaScript: 125 AUREON/module/shader regression tests and 507 original frontend tests passed.
- Release-gate regression tests: 10 passed before build evidence generation.
- Backend: 124 tests passed using Python 3.13 and the Home Assistant test harness. Frontend registration is mocked by that harness.
- Public distribution scan and stable HACS checksum: passed. No paid `.fp3dpack` or personal apartment preset included.
- The duplicated module implementations were synchronized: announcements routing/quiet hours/fallback, weather selection, daily heating readings and localized settings now reach the compiled frontend.
- Home Assistant browser/runtime acceptance: NOT performed.
- HACS installation of the modified Python integration: NOT validated. Existing repository category remains Dashboard; nested Python source is not installed by its existing HACS configuration.
- Real mode: procedural surface shading, not finished physical/PBR materials.

The stable HACS JavaScript is unchanged. This is a validated source-build checkpoint, not the final HACS update. Build artifacts and readiness report are uploaded by Actions. No releases or development branches are created.
