# NeonPlan3D → AUREON: preservation and rollback

**This is a preparation guide, not permission to uninstall the official integration.**

The modified integration still uses domain `neonplan3d`. It shares storage keys and URL paths with upstream. Its source also has a legacy migration for `floorplan_3d.*`. Replacing an existing integration without a verified backup could lose access to saved plans, images, history, packs or license settings.

## Confirmed storage keys from the source

- `neonplan3d.building` — building/floorplan, including rooms and furniture
- `neonplan3d.images` — associated image data
- `neonplan3d.history` — restore history
- `neonplan3d.packs` — imported furniture packs
- `neonplan3d.license` — shop license state; **private, never publish**
- `neonplan3d.diagnostics` — opt-in diagnostics state
- `neonplan3d.voice` — voice settings

The actual Home Assistant storage files are generally under the private configuration directory `.storage/`. They must **not** be committed to this public repository. Other integration settings may also be stored in Home Assistant config entries.

## Before testing on a separate Home Assistant instance

1. Keep the official NeonPlan3D integration installed on the production instance.
2. Create a full Home Assistant backup using the instance's own backup mechanism. Confirm that the backup exists and that you know how to restore it.
3. Export the plan through the original editor if supported; keep that export locally, not in GitHub.
4. Record the installed official integration version and how it was installed. Keep the official installation source available for rollback.
5. Use a separate test instance with a copy of the relevant configuration. **Never** upload real apartment layouts or license credentials to a public repository.
6. Confirm test-instance startup, existing plan load, editor permissions, save/reload, all five themes, optional module approvals, and logs.
7. Confirm rollback in the test instance before any production migration.

## Production change gate

Only after a tested installation path exists, test the upgrade/replacement procedure with a fresh backup and a verified rollback. Avoid running official and modified `neonplan3d` integrations simultaneously. Do not delete the integration's config entry or `.storage` records as an upgrade shortcut.

**Current state:** no Home Assistant runtime test or migration/rollback validation has been performed. Stable AUREON v0.28.0 remains published.
