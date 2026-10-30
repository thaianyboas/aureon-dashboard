# AUREON Floor Studio — Home Assistant acceptance checklist

**Status:** pending manual Home Assistant runtime testing. This document is not proof of installation.

## Why there are two artifacts

The AUREON dashboard is a HACS **Dashboard** resource (existing `dist/aureon-dashboard.js`). NeonPlan3D is a Home Assistant **Integration** with Python backend, websocket commands, stored floorplans and static frontend resources. The integration candidate is generated separately at `build/neonplan3d-hacs-integration-candidate/custom_components/neonplan3d/` in GitHub Actions.

A GitHub Actions artifact is **not** automatically an installable HACS repository. The candidate must first be promoted to a supported distribution repository/layout after compatibility and runtime verification. The root `hacs.json` of the current AUREON repository remains configured for Dashboard; it must not be reused as evidence of an Integration installation.

## Safety before any runtime test

1. Make a complete Home Assistant backup and verify that it can be restored.
2. Use a separate test Home Assistant instance when possible, not the live household instance.
3. Inventory any existing `neonplan3d` integration and back up its configuration/storage. The candidate uses the **same domain** (`neonplan3d`), static URL (`/neonplan3d_static`) and panel path (`/neonplan3d`) as upstream; do not install both implementations side by side.
4. Do not place personal floorplans, tokens, passwords, apartment photographs or licensed packs in public GitHub issues, logs or artifacts.

## Candidate inspection (before installation)

- Confirm the latest Floor Studio workflow succeeded, including backend tests.
- Download the `floor-studio-build-candidate` artifact from the successful GitHub Actions run.
- Check the `neonplan3d-hacs-integration-candidate` directory contains `hacs.json`, `MANIFEST.json` and `custom_components/neonplan3d/manifest.json`.
- Confirm `MANIFEST.json` checksums and source license.
- Confirm the compiled frontend includes the five modes and the four optional AUREON modules. A source build alone is not evidence of runtime behavior.

## Runtime acceptance matrix (not yet performed)

| Case | Expected behavior | Evidence |
| --- | --- | --- |
| Integration load | No Python errors; config flow works | Pending |
| Dashboard resource | Existing AUREON stable card remains functional | Pending |
| Panel/editor | Authorized admin opens and edits floorplan | Pending |
| Persistence | Saved plan survives HA restart and browser reload | Pending |
| Nonadmin restrictions | Nonadmin cannot access restricted editor actions | Pending |
| Five modes | Neon, Blueprint, Day, Night, Real render and switch | Pending |
| Window Watch | Explicitly approved sensor mapping and alerts work | Pending |
| Announcements | Explicitly approved routing, quiet hours and fallback work | Pending |
| Heat Monitor | Authorized heating entities display correct readings | Pending |
| House Answers | Opt-in question/answer workflow works without leaking secrets | Pending |
| Import/export | Original compatible projects round-trip correctly | Pending |
| Upgrade/rollback | Backup restore and previous integration recover safely | Pending |

## Release gate

Do not replace `dist/aureon-dashboard.js` or claim HACS readiness until the installation path and runtime acceptance matrix have been validated. The physical Real renderer still requires final visual and device acceptance. Stable v0.28.0 remains the published dashboard.
