# AUREON Floor Studio — distribution target decision

## Existing GitHub repositories (verified 2026-10-30)

- `thaianyboas/aureon-dashboard`: HACS **Dashboard** repository, stable v0.28.0 distribution in `dist/`. Do not replace until accepted.
- `thaianyboas/neonplan3d`: existing HACS **Integration** repository, default branch `main`, with `custom_components/neonplan3d/manifest.json` and root `hacs.json`. It currently represents a copy of the original NeonPlan3D code. The user confirmed that production Home Assistant installs official NeonPlan3D from the official HACS source, **not** from this fork.

## Recommended separation

Continue building the modified integration candidate in `aureon-dashboard` CI without altering either stable distribution. The user confirmed the existing `neonplan3d` fork is only a source-code copy and can serve as the future integration distribution destination. Prepare publication there only after the candidate build, integration compatibility and rollback safeguards are verified. Publishing the fork does **not** automatically update the official HACS integration currently installed in production.

Keep the fork's original code available for comparison and rollback until the candidate is ready. Before promoting modified files to `thaianyboas/neonplan3d/main`, verify the complete file inventory and reproducible packaging; the modified backend has not passed a real Home Assistant acceptance test.

A separate new HACS integration repository is unnecessary given the user's clarification. Because both builds use domain `neonplan3d`, they still cannot be installed side by side in the same Home Assistant instance.

## Remaining release blockers

1. Prepare the confirmed `thaianyboas/neonplan3d` fork as the integration distribution target and verify its HACS install/update behavior.
2. Test candidate on a separate Home Assistant instance with a backup and without personal data in public GitHub.
3. Validate editor, persistence, permissions, five visual modes, four opt-in modules and rollback.
4. Complete the Real/PBR visual acceptance requirement.
5. Promote dashboard distribution only after all release gates pass.

No production Home Assistant or HACS installation test is claimed.
