# Claude ↔ Codex — shared handoff

Updated: 2026-11-01. Owner requested collaboration through git and explicit iSG
Display Max support. Read this before work; append your outcomes after each batch.
This file is a checkpoint, not a live agent-to-agent connection.

## Baseline and distribution

- Reviewed dashboard baseline: c9795dfbf71a09cca77b13a3dc78fcb23ec31fb3.
- Integration baseline: 19d77ec59a8b9db43e53d8048899afd528a79f08;
  SOURCE_COMMIT points to that dashboard baseline.
- Integration default branch was already master when checked. Do not ask the
  owner to change main to master again.
- Owner has Blueprint Studio in HA. Instructions must fit that environment;
  access to /config/www and binary upload capabilities must be verified rather
  than assuming a File editor/Samba add-on.
- Owner authorized master/HACS test updates; this is not final visual approval.
  Preserve rollback/v0.28.0. No owner HA connection or installation was performed
  by Codex in this batch.

## Codex batch — short landscape layout and source cleanup

Implemented:
- platform/styles.mjs: short landscape layout retains plan + right column when
  HA content is at least 760 CSS px wide; compact cards/header and 44px minimum
  targets for relevant coarse-pointer controls. Portrait/phone flow retained.
- scripts/capture-home-reference.mjs: synthetic iSG cases at 1280x800,
  1280x744 with a simulated 256px HA sidebar, and 1024x640 scaled viewport;
  assertions for two columns, overflow, stage height and touch targets.
- music/player.mjs: removed the obsolete first overview() implementation; the
  existing newer library implementation remains authoritative.
- platform/locales.mjs + page.mjs: separated roomLight from theme light key,
  preserving Hell/Claro for theme selection and Licht/Luz for room controls.
- AGENTS.md: shared workflow entry point for future sessions.

Validation and distribution outcome: see the final entry below, written after
checks complete. Do not infer a physical-device pass from a synthetic fixture.

## iSG acceptance target

Official product page (checked 2026-11-01):
https://www.linknlink.com/products/isg-display-max-smart-home-hub-home-assistant
lists a 10-inch 1280x800 touchscreen, quad-core 1.5GHz, 4GB RAM.
Native resolution is NOT guaranteed to equal innerWidth/innerHeight. Record
actual CSS viewport, devicePixelRatio, browser/WebView version and WebGL support
on the owner's installation before marking device support complete. The page's
current firmware description does not establish the owner's installed HA type.

Required checks: landscape with HA sidebar expanded/collapsed and header;
fullscreen; scaled CSS viewport; portrait if used; usable touch targets; readable
type; no horizontal scrolling/cropped plan; controls remain reachable; 3D pan,
rotate and zoom work with touch; context loss/reload recovery; device remains
responsive after sustained use. Measure frame rate and loading time on hardware.
Do not force High quality globally to imitate screenshots or invent an FPS pass.

## Open queue / ownership

| ID | Priority | Next owner | Status / concrete completion evidence |
| --- | --- | --- | --- |
| PRIV-01 | High | Claude | Personal GLBs served through /local are unauthenticated. Unguessable is not authenticated. Design an authenticated asset route and authorized loading; test unauthenticated and other-user requests. Do not rename current storage as fully private. |
| VIS-01 | High | Claude | Investigate dark planes outside the apartment in the owner's supplied Day mobile capture. Identify geometry/material cause; do not hide it by cropping. Show Day/Real before/after in a synthetic regression plus private owner validation. |
| VIS-02 | High | Claude | Tune lighting: avoid blown-out tabletop and unintended strong room color casts. Respect actual entity colors; distinguish preview lighting from live states. Test automatic quality as well as explicitly forced High. |
| VIS-03 | High | Claude | Improve plan framing and label clutter, particularly interior views; preserve geometry and interaction. Review at the actual iSG content viewport. |
| ASSET-01 | Medium | Claude | Furniture/curtains/decor fidelity still approximate. Some source models supplied by Codex were simplified. Do not claim exact product replicas or solve inaccurate geometry with lighting. |
| DOC-01 | Medium | Claude | Private v4 PROVISORIO.md still lists obsolete floors and suggestion furniture while MOVEIS.md describes current finishes. Reconcile private documents outside public git. |
| ISG-01 | High | Claude + owner | Obtain real iSG viewport/browser and physical touch/performance validation. Synthetic layout checks are only the first stage. |
| MEDIA-01 | High | Codex, next requested review | Review current Medien against approved layout and actual SpotifyPlus data, then implement a bounded follow-up. Not started in this batch; no background work implied. |
| SEC-01 | High | Claude | Earlier security report fixes remain open; CI success is not security approval. |
| DATA-01 | Medium | Claude | Energy discovery and wider language coverage remain open. Do not replace missing live data with unlabeled demo values. |

## Coordination protocol

Claude: read this batch before editing the same files; pull master first. Add a
dated entry with task IDs, exact commit, tests actually run, screenshots obtained,
known limits and next owner. Codex does the same on each subsequent requested turn.
Keep one queue here rather than conflicting completion claims across session docs.
Private screenshots and apartment details stay outside this public file.

## Validation / publication record — Codex, 2026-11-01

- 67 dashboard unit tests passed, including a theme/room-light translation regression.
- Existing platform browser suite passed; media browser suite passed 22 checks.
- Home reference suite passed, including the three new iSG landscape simulations,
  portrait/phone regression, room dialog, themes and all five plan looks.
- `npm run build` passed frontend build/typecheck and candidate integrity checks.
- Original NeonPlan fidelity gate passed (2150 methods/handlers; 23 critical files).
- `npm run validate` passed HACS checksum, module parity and public-source guard.
- Build warnings for duplicate overview/light keys were eliminated by the source cleanup.
- HACS `dist/aureon-dashboard.js` rebuilt and checksum updated. Version remains
  0.29.0-test.1; no tag/release. Redownload master and refresh browser to get it.
- Integration renderer/backend unchanged, so no new integration publication or
  SOURCE_COMMIT advance is needed for this dashboard-only batch.
- Screenshots use invented fixtures and software WebGL; these do NOT validate
  owner's apartment, hardware frame rate, actual WebView, privacy or live HA.
