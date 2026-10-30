# AUREON Module Suite 04 — source integration bundle (NOT a finished release)

Four original AUREON modules: Window Watch, Announcements, Heat Monitor, House Answers.
`src/module-settings.mjs` adds NeonPlan3D-compatible GUI configuration fields.

## Security and licensing
- This package contains no Mastershort commercial module code, purchased packs, keys or copyrighted furniture.
- House Answers only reads HA states and returns deterministic responses; it does not execute arbitrary voice commands.
- Announcements requires explicit confirmation and a configured TTS entity.
- The original NeonPlan3D production loader accepts only approved pack modules. These source files are **not** an installable `.fp3dpack` or a drop-in HACS release. Do not bypass the module approval mechanism.

## Development / integration
- Run `node --test tests/*.test.mjs` from this folder.
- Source modules use the original `NeonModule` API shape (`api:1`, `voice`, `alerts`, `settings`, etc.).
- A production implementation still needs packaging/approval through the original NeonPlan3D module lifecycle, full editor/dashboard integration, full frontend build, and Home Assistant device testing.
- The Night/Real Floor Studio source and the existing AUREON dashboard remain separate until a verified integration is complete.
