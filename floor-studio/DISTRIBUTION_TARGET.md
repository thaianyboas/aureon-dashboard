# AUREON Floor Studio — distribution target decision

## Existing GitHub repositories (verified 2026-10-30)

- `thaianyboas/aureon-dashboard`: HACS **Dashboard** repository, stable v0.28.0 distribution in `dist/`. Do not replace until accepted.
- `thaianyboas/neonplan3d`: existing HACS **Integration** repository, default branch `main`, with `custom_components/neonplan3d/manifest.json` and root `hacs.json`. It currently represents the original NeonPlan3D code, and may be the user's production installation source.

## Recommended separation

Continue building the modified integration candidate in `aureon-dashboard` CI without altering either stable distribution. The existing `neonplan3d` repository is a **possible** distribution destination, not an approved one. Before updating it, verify whether the live Home Assistant installation is sourced from this repository, whether the user wants to repurpose it, and whether the integration can be rolled back safely.

Do **not** automatically push candidate source to `thaianyboas/neonplan3d/main`. Doing so could unexpectedly update an installed integration through HACS, and the modified backend has not passed a real Home Assistant acceptance test.

A separate new HACS integration repository may be safer if the existing `neonplan3d` repository is used for the official version. Because both builds use domain `neonplan3d`, they still cannot be installed side by side in the same Home Assistant instance.

## Remaining release blockers

1. Select a safe integration distribution target and verify its HACS install/update behavior.
2. Test candidate on a separate Home Assistant instance with a backup and without personal data in public GitHub.
3. Validate editor, persistence, permissions, five visual modes, four opt-in modules and rollback.
4. Complete the Real/PBR visual acceptance requirement.
5. Promote dashboard distribution only after all release gates pass.

No production Home Assistant or HACS installation test is claimed.
