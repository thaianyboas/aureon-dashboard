# NeonPlan 3D – notes for Claude

- Spec and phase plan: `private/docs/plan.md` (German, not public). Unreleased docs (Pool Pro) live in `private/docs/pending/`. Talk to the user in German; code, identifiers and comments in English.
- AUREON fork: domain `aureon_floor` (separated from the official `neonplan3d` on 2026-11-05, see floor-studio/NEONPLAN_MIGRATION_AND_ROLLBACK.md); upstream repo `mastershort/neonplan3d`, minimum Home Assistant 2025.1.
- Frontend lives in `frontend/` (Lit 3 + TypeScript, no decorators; three.js in a separate lazily loaded bundle).
  Bundles are committed to `custom_components/aureon_floor/frontend/`, and CI fails when they are stale, so run `npm run build` before committing.
- Checks: `npm test`, `npm run typecheck`, `npm run build` (size budgets), `ruff check` / `ruff format`.
  HA integration tests only run in the Linux CI.
- Visual self-check: `npm run screenshot` renders `preview/index.html` (invented demo data, mock hass) into `preview/screenshots/`.
- Deploy to the user's HA: `npm run deploy` (target in the untracked `deploy.local.json`). Never commit real floor plans, IPs or device names.
- After each phase: bump the version in `manifest.json`, commit, push, check CI, and tell the user in German what is new and how to test it.
