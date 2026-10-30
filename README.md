# AUREON Dashboard

The stable HACS dashboard distribution remains unchanged in `dist/aureon-dashboard.js` (v0.28.0 line). Do not update expecting Floor Studio yet.

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

Run the gate regression tests before the build: they deliberately test the state without generated build evidence. `npm run build` typechecks, compiles all NeonPlan3D bundles, records hashes and packages a **candidate only** under `build/floor-studio-candidate`. It does not overwrite the stable HACS distribution. GitHub Actions runs source tests, the build and backend tests and uploads the candidate without creating releases or development branches.

## Installation blockers

The supplied dashboard bridge uses the NeonPlan3D integration's original card and `/neonplan3d` editor. Updating this repository as a HACS **Dashboard** does not install the Python backend or replace the original integration's served frontend. A supported HACS installation path for the modified integration must be validated before promotion. The nested backend is source, not a claim of HACS integration packaging.

The readiness gate remains blocked until actual Home Assistant functional testing verifies the floor view, administrator editor, nonadministrator restrictions, project persistence and module permissions. Backend unit tests use Home Assistant's test harness with mocked frontend registration; they do not establish browser/runtime acceptance. No runtime evidence is fabricated.

Upstream license: `floor-studio/neonplan3d-main/LICENSE`. Unrelated upstream demo media, firmware, shop tooling and tutorial recordings are omitted; the complete supplied ZIP was inspected locally.
