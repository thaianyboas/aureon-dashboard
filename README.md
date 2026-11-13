# AUREON Dashboard

**Prévia HACS 0.29.0-test.4.** Selecione Forest Luxe · Botanical em Configurações → Aparência. Alterne em Configurações → Página Início → Exibir planta 3D. A versão anterior pode ser recuperada pelo commit `2c3e485`, e a versão estável continua em `rollback/v0.28.0/`.

**Owner test build 0.29.0-test.3 (2026-11-03).** At the owner's request the HACS distribution in `dist/` now carries the current AUREON platform build for testing in her own Home Assistant. The compact settings and visual theme gallery have owner approval; this remains an owner test build. It needs the matching NeonPlan3D AUREON integration from `thaianyboas/aureon-integration` (same `neonplan3d` domain; replaces the official integration, keeps its storage). The previous stable v0.28.0 file is kept in `rollback/v0.28.0/`. See [OWNER_TEST_2026-11-01.md](OWNER_TEST_2026-11-01.md).

## Balance and personal cards — 2026-11-02

Select **Aubergine · Balance** in Settings → Appearance → AUREON theme for the approved burgundy,
plum and champagne palette. The equipment view groups native controls by function and offers combined
room, type, availability and Label filters. Labels only filter the current equipment view; choose All labels or clear the active chip to reset. Earlier global include/exclude rules are retired. Reserved no_dboard visibility and system-device control restrictions still apply.

Use **Edit cards** on a dashboard page to remove/restore cards, rename them, change size, move them
with the arrows, or add an eligible equipment card. Arrows move cards among siblings in their section.
**Undo** restores the previous edit; **Reset layout** restores that page. Personal layouts stay in this
Home Assistant user's browser and are included in settings export/import. They do not rename HA entities,
change automations or call services. Equipment controls keep their original Home Assistant permissions.

Update both the dashboard and matching AUREON integration from HACS, then restart Home Assistant
for the integration and refresh the browser cache. This is an owner-authorized master test build;
physical Home Assistant/iSG acceptance is still separate from the automated synthetic-fixture checks.

## Approved settings revision — 2026-11-03

Settings use compact categories, bounded equipment/source lists, expandable room pictures and a compact
mobile More menu. Home Assistant controls the language automatically, including existing installations
that previously saved a manual choice. Choose among 26 visual theme miniatures in Appearance; selection
applies immediately, shows the active palette and preserves gallery scroll.

For this settings revision, update **AUREON Dashboard** in HACS and reload the browser. The integration's
renderer/editor/backend did not change; its existing 69857f1 source pin remains compatible.

## Floor Studio source integration

`floor-studio/` contains the supplied consolidated source checkpoint, the original MIT-licensed NeonPlan3D frontend/editor/backend, five visual modes (Neon, Blueprint, Day, Night, Real) and four optional AUREON modules: Window Watch, Announcements, Heat Monitor and House Answers. Each module requires explicit administrator approval. AUREON's distribution scope is free/open-source functionality and the user-supplied AUREON extensions only. No commercial furniture packs, paid Pro extensions, or personal apartment presets may be bundled. Compatibility code inherited from the open-source upstream may remain, but commercial assets and promotional materials are outside the AUREON scope.

The build uses the exact frontend lockfile. The tested module implementations and the modules bundled in the frontend are checked for byte-for-byte parity. Real currently uses procedural palette/shader shading; it is not a completed PBR renderer.

```sh
npm ci --prefix floor-studio/neonplan3d-main/frontend
npm run validate
python3 -m unittest discover -s floor-studio/tests -p 'test_*.py'
npm test
npm run build
npm run readiness
```

Gate regression tests isolate the missing-evidence case and also run after a build; runtime readiness stays blocked. `npm run build` typechecks, compiles all NeonPlan3D bundles, records hashes and packages a **candidate only** under `build/floor-studio-candidate`. It does not overwrite the stable HACS distribution. GitHub Actions runs source tests, the build and backend tests and uploads the candidate without creating releases or development branches.

## Installation blockers

The supplied dashboard bridge uses the NeonPlan3D integration's original card and `/neonplan3d` editor. Updating this repository as a HACS **Dashboard** does not install the Python backend or replace the original integration's served frontend. A supported HACS installation path for the modified integration must be validated before promotion. The nested backend is source, not a claim of HACS integration packaging.

The readiness gate remains blocked until actual Home Assistant functional testing verifies the floor view, administrator editor, nonadministrator restrictions, project persistence and module permissions. Backend unit tests use Home Assistant's test harness with mocked frontend registration; they do not establish browser/runtime acceptance. No runtime evidence is fabricated.

Upstream license: `floor-studio/neonplan3d-main/LICENSE`. Unrelated upstream demo media, firmware, shop tooling and tutorial recordings are omitted; the complete supplied ZIP was inspected locally.

## Platform and music candidate

The expanded mission is tracked in [PLATFORM_ROADMAP.md](floor-studio/PLATFORM_ROADMAP.md). All nine original ZIPs were recovered and fingerprint-verified; [INTEGRATION_MATRIX.md](floor-studio/INTEGRATION_MATRIX.md) distinguishes available source, licenses, actual integrations and pending work. The ninth project is SpotifyPlus Card.

The original AUREON Music Player Full/Compact is implemented under `floor-studio/dashboard/music`, compiled into the review-only dashboard candidate and mounted in Medien/Startseite. SpotifyPlus and optional Spotcast remain independent backends. The official supplied image guides the composition, without a commercial button or fictional default cover/person. ControlRoom Music Card is unchanged.

`npm run build` now compiles both native NeonPlan frontend and the dashboard candidate and verifies their separate evidence. `npm run test:browser` uses a real Chrome/Chromium (`CHROME_BIN`) with isolated synthetic HA fixtures, not an installed HA instance. CI runs it after compilation. See [music validation](floor-studio/MUSIC_VALIDATION_2026-10-30.md) for implemented behavior and limits. Stable `dist/` remains v0.28.0; do not update expecting this player yet.
