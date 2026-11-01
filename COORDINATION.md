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
| PRIV-01 | High | Claude → owner | Done in source (Claude batch 2026-11-01b): integration view `/api/neonplan3d/aureon_models/<name>.glb`, `requires_auth`, files only from `<config>/aureon_models/` (outside www), plain `.glb` names, 24 MB cap, `Cache-Control: private`. Viewer loads `/api/` model URLs with HA `fetchWithAuth`. Policy: any signed-in HA user (same as reading the building). Tests: pytest 401 anonymous / 200 signed-in / traversal 400–404 / not under /local; disposable HA curl: 401, 200, 400, 404. Not yet run: non-admin second user on owner HA. Owner must move GLBs from www/aureon-moveis to /config/aureon_models and delete the old folder. |
| VIS-01 | High | Claude → owner | Cause: original window-light spill on the ground (additive) in looks without a ground plane, plus additive glows writing alpha into the transparent AUREON stage → dark/teal planes outside the walls. Fix (AUREON stage only, frameScale ≠ 1): spill hidden in Day as already in Real; additive materials blend without alpha writes in all looks. Synthetic night Day capture shows no planes (build/home-reference/look-day.png). Owner-plan night Day capture still to be taken. |
| VIS-02 | High | Claude | Real lamp intensity lowered (≈ −40 %), softer lamp shadows, night exposure −14 %. Colour casts in earlier captures came from demo light entities linked only in the test copy (bed_light colour); Real keeps actual entity colours by design. Checked with automatic quality and forced High (labelled). Further tuning needs owner-device captures. |
| VIS-03 | High | Claude | Room-name pins on the Startseite smaller/lighter via new CSS hooks (`--aureon-pin-*`, original defaults unchanged); presentation fit picks the best camera quarter and includes exterior walls. Interior-view label clutter remains; actual iSG viewport not yet measured. |
| ASSET-01 | Medium | Claude | Furniture/curtains/decor fidelity still approximate. Some source models supplied by Codex were simplified. Do not claim exact product replicas or solve inaccurate geometry with lighting. |
| DOC-01 | Medium | Claude | Done privately (outside git): PROVISORIO.md v5 and MOVEIS.md v5 reconciled with current finishes, furniture and authenticated model storage. |
| ISG-01 | High | Owner + Claude | New Settings card "Gerätediagnose / Diagnóstico do aparelho": measures viewport, visualViewport, AUREON area, DPR, pointer, WebGL renderer, 5 s frame rate, plan size; local only, copy button. Owner runs it on the iSG and sends the text. No hardware validation claimed. |
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

## Claude batch — 2026-11-01b (privacy, dark planes, lighting, labels, iSG diagnostics)

Base: pulled 6df065a (Codex) first; Codex changes preserved (styles, locales, player, iSG captures).
Files: integration `aureon_models.py` (+ registration in `__init__.py`), `tests/test_aureon_models.py`;
viewer `aureon-models.ts` (authenticated fetch), `viewer3d.ts::renderScene` (AUREON stage blending/spill),
`real-pbr.ts` (lamp intensity/exposure), `components/view3d.ts` (pin CSS hooks, defaults original);
platform `page.mjs`/`locales.mjs`/`styles.mjs` (device diagnostics card, pin variables).
Tests actually run: npm test (dashboard + 515 NeonPlan unit + fidelity gate), test:browser (music, platform,
floor, editor), fidelity browser (10 scenarios), capture-home-reference (incl. Codex iSG cases),
capture-media-reference, validate, migration contract; pytest 139 (incl. 3 new) and ruff on the integration;
disposable HA: curl auth checks; owner plan import → editor reopen → Startseite load/reload with 20 own models via
the authenticated route; Startseite captures 1440/1280×800/820/390 with automatic quality (private, not in git).
Not done: owner HA, physical iSG, non-admin second user, night capture of the owner plan in Day.
Distribution: dist rebuilt (0.29.0-test.1, hash updated); integration repackaged and SOURCE_COMMIT advanced to this
batch's dashboard commit (renderer/backend changed).
Next: owner moves models + runs device diagnostics on the iSG; Claude: SEC-01 security fixes, ASSET-01;
Codex: MEDIA-01 on request.

## Claude batch — 2026-11-01c (embedded editor, wall editing, editor theme, speed)

Base: origin/master = beddb4a (no newer commits; Codex 6df065a preserved).
Owner requests: (1) editor embedded without iframe, (2) visible name "AUREON Floor Studio", (3) walls of the
imported plan selectable/movable/removable, (4) frontend 2.0.9 vs backend 2.0.7 warning, (5) editor follows the
AUREON theme live, (6) speed.

Changed:
- `aureon-dashboard.js`: Floor Studio page mounts `neonplan3d-panel` directly (attribute `aureon-embedded`;
  no iframe, no second HA header/sidebar, same element/store as /neonplan3d and the Startseite; removed on leave →
  WebGL disposed). Height fitted below the AUREON header. Non-AUREON (official) panel bundle → visible warning,
  never hidden. Editor gets `--aureon-ui-*` tokens from the resolved AUREON theme, re-applied on palette/appearance
  /HA dark-mode change without reload. Home page kept alive (hidden) while other pages are open — no WebGL
  rebuild, model reload or shader recompile when returning to Início; hidden page skips renders.
- `panel.ts`: `aureonEmbedded` (hides ha-menu-button/h1 only), `static aureonEmbed = 1` marker, title
  "AUREON Floor Studio". `const.py` PANEL_TITLE "AUREON Floor Studio" (url/domain/storage stay neonplan3d).
  i18n: app-name strings → AUREON Floor Studio; upstream service/Pro/diagnostics/credits keep NeonPlan.
- `styles.ts` + editor/panel/view3d CSS: colours read `--aureon-ui-*` with the original values as fallback;
  device/warning colours kept.
- `editor.ts` (recorded as aureon_extension in SYMBOLS.json: guardFixed, pointerDown, onPointerMove, onPointerUp,
  onKey, selectItem, renderRooms, renderRoomForm): tap a room outline edge → wall picked + panel (Straighten,
  Remove/restore divider = wall height 0 on both sides, rooms kept); drag moves the whole straight wall line
  (Shift: one segment); corner drag moves coincident corners of neighbours (Shift: original); doors/windows keep
  their world position; Delete on a picked wall removes only the divider.
- Tests: iframe-specific source tests replaced by `floor-embedded.test.mjs`; i18n test updated.

Tests actually run: npm test (92 dashboard + 520 NeonPlan unit + fidelity gate), test:browser (music, platform,
floor, editor), fidelity browser (10 scenarios, original vs candidate), capture-home-reference (incl. iSG cases),
capture-media-reference, validate; pytest 139 + ruff. Disposable HA 2026.2.3 (NOT owner HA) with the owner's
private plan v5: no-iframe/one-shell assertions; iSG-sized emulations 1280×800 sidebar open/collapsed and
1024×640 (emulation, not the device); shared wall move, undo/redo, remove/restore divider, straighten,
contour move, shared corner, autosave, reload/reopen, Startseite, editor removal on leave, live theme switch
(Forest Luxe Botanical / Sage / Sapphire) without editor rebuild and persistence after reopening.
Speed (disposable HA, SwiftShader software GL — absolute numbers not representative of the iSG): back to Início
13.3 s → 1.9 s; Räume 1.7 → 0.7 s; Geräte 1.8 → 0.3 s; idle main-thread work 1.4 s → 0.2 s per 10 s.
First 3D load is dominated by shader compilation in software GL; must be measured on the iSG (ISG-01).
Version warning: our integration and frontend are both 2.0.7; a 2.0.9 frontend can only come from the official
NeonPlan 3D repository in HACS writing the same folder. Owner steps in OWNER_TEST doc / chat.
Distribution: dist 0.29.0-test.2 (hash updated); integration repackaged, SOURCE_COMMIT advanced.
Not done: owner HA, physical iSG, non-admin second user test of the embedded panel.
