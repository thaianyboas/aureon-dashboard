# Shared AUREON workflow

Read `CLAUDE.md` and `COORDINATION.md` before editing. The latter is the shared
handoff for Claude and Codex; it is not an automatic messaging channel.

- Fetch `origin/master` and check its current head before starting or publishing.
  Never overwrite another agent's work or force-push. If the head changed, review
  and integrate it before continuing. Publish through master; no tags/releases.
- Update `COORDINATION.md` in each work batch: owner, files, validation, open
  problems and next step. Do not describe a planned task as completed.
- Keep personal plans, models, photos, local addresses and credentials out of git,
  including tests, screenshots and history. Use synthetic browser fixtures.
- HACS distribution is `dist/`; source changes alone are not installed changes.
  Rebuild and validate the candidate, copy the bundle to dist and update its hash
  only when deliberately publishing a tested dashboard change.
- Renderer/backend changes additionally need a rebuilt integration and a reviewed
  `SOURCE_COMMIT` update in aureon-integration. Never silently advance that pin.
- The iSG Display Max is a first-class target. Test short landscape layouts,
  sidebar/header space, touch, WebGL recovery and real-device performance.
  Browser emulation is not physical-device validation.
- Preserve the original NeonPlan editor and all five visualization modes.
- Communicate with the owner in Portuguese. Use Blueprint Studio for file access
  instructions when suitable; do not assume File editor or Samba is installed.
