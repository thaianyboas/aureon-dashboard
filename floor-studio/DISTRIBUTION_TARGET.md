# AUREON Floor Studio — distribution target decision

## Existing GitHub repositories (verified 2026-10-30)

- `thaianyboas/aureon-dashboard`: HACS **Dashboard** repository, stable v0.28.0 distribution in `dist/`. Do not replace until accepted.
- `thaianyboas/neonplan3d`: existing HACS **Integration** repository, default branch `main`, with `custom_components/neonplan3d/manifest.json` and root `hacs.json`. It currently represents a copy of the original NeonPlan3D code. The user confirmed that production Home Assistant installs official NeonPlan3D from the official HACS source, **not** from this fork.

## Recommended separation

Continue building the modified integration candidate in `aureon-dashboard` CI without altering either stable distribution. The user confirmed the existing `neonplan3d` fork is only a source-code copy and has stated an intention to delete it. Do not rely on this fork as a permanent distribution destination. Prepare publication there only after the candidate build, integration compatibility and rollback safeguards are verified. Publishing the fork does **not** automatically update the official HACS integration currently installed in production.

Do not publish modified files to `thaianyboas/neonplan3d/main` while the user plans to delete that repository. Keep original source and candidate builds in `aureon-dashboard` for comparison. The modified backend has not passed a real Home Assistant acceptance test.

A separate HACS integration repository or another supported integration delivery path must be chosen after the user deletes the temporary fork. Because both builds use domain `neonplan3d`, they still cannot be installed side by side in the same Home Assistant instance.

## Remaining release blockers

1. Select an integration distribution target that will not be deleted, and verify its HACS install/update behavior.
2. Test candidate on a separate Home Assistant instance with a backup and without personal data in public GitHub.
3. Validate editor, persistence, permissions, five visual modes, four opt-in modules and rollback.
4. Complete the Real/PBR visual acceptance requirement.
5. Promote dashboard distribution only after all release gates pass.

No production Home Assistant or HACS installation test is claimed.

## Official AUREON repository layout (user-approved)

The user requests clearly named AUREON repositories and no unrelated duplicate source copies.

1. `thaianyboas/aureon-dashboard` — authoritative source, frontend/dashboard, modules, integration candidate generation and CI.
2. `thaianyboas/aureon-integration` — dedicated HACS Integration distribution repository (to be created); generated Python integration and required frontend bundle only. Do not independently develop a divergent fork here.

The old `thaianyboas/neonplan3d` source fork is not part of the AUREON distribution plan. Keep the installed official NeonPlan3D in Home Assistant until a separately validated migration is ready. Do not replace stable dashboard v0.28.0 yet.

**Repository provisioning:** The connected GitHub actions in this session can edit existing repositories but do not expose a create-repository operation. The dedicated repository therefore remains **planned, not created**. Once provisioned, CI publishing must be configured with explicitly approved credentials and a verified distribution layout. Never assert that automated cross-repository publication is already configured.
