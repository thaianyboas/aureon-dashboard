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

## Claude batch — 2026-11-01d (speed) and owner requirement for Real

Speed (follow-up of 01c):
- platform `controller.mjs`: the row index (filter/sort of all entities) is rebuilt only when the registry, the
  hidden list, the scope or the number of entities changes — not on every state change.
- platform `page.mjs`: a single change renders at once; bursts of state changes render once per frame.
- shell: runtime-entity check uses the entity count instead of a sorted join of all ids per update; home
  overview rows filtered once per registry.
- `aureon-models.ts`: one download per model file and page, shared by the Startseite and Floor Studio viewers.
- Private (not in git): owner models optimized (dedup/join/weld/light simplify, same size/centre/textures,
  verified in the disposable HA for 20 items): total 5.2 MB → 3.3 MB; SINNERLIG 2.4 MB → 1.2 MB.
Measured in the disposable HA (116 entities, SwiftShader): command tap → HA event ≈ 13–19 ms → UI updated ≈ 20 ms
on Geräte. Per-update script cost is negligible at 116 entities before and after; the index change matters for
installations with many entities (owner HA not measured). 3D frame cost dominates on the Startseite and is
not representative in software GL — iSG measurement (ISG-01) still required.

### Owner requirement — VIS-REAL-01 (open, not approved)
The owner supplied a reference image (warm, furnished 3D apartment: detailed sofa/rug/plants/lamps, wood and
fabric textures at real scale, balanced warm lighting without blown highlights, contact shadows, framing).
"Real" by name is NOT visual approval. Before applying finishes to the whole apartment: a proof of the living
room in the project's real renderer (interactive 3D, not a static/generated image), with capture + video compared
to the reference, settings and performance (test browser vs physical iSG kept separate). If the renderer cannot
reach the target, list missing features and propose the solution first. Owner HA interaction must be preserved.

VIS-REAL-01 first proof (Claude, 2026-11-01, disposable HA, SwiftShader — not the iSG): Sala in Real, High forced,
evening simulated (sun −8°), 2 Sala lamps linked to demo lights at 2700 K in a test copy only. Result: does NOT
reach the reference. Measured: 700 draw calls, 325k triangles, 39 shader programs, 2 lamp shadow maps + sun shadow.
Gaps: (1) furniture models are simplified parametric reconstructions with 256 px textures (no upholstery detail,
no fabric/wood normal maps); (2) no decor set (rug, plants, cushions, table/floor lamps, candles); (3) lighting is
two point lights — no lamp glow/bloom, no soft area light, hot spot on the dining table; (4) no ambient occlusion /
contact shadows; (5) walls/ceiling plain, no skirting/trim; (6) labels over the stage. Proposal sent to owner
for approval before any apartment-wide work (detailed models + CC0 PBR textures, warm light rig with bloom,
contact shadows/AO with a quality tier for the iSG, decor set). Status: open, awaiting owner decision.

VIS-REAL-01 step 2 (Claude, owner said "do what is needed"; still NOT approved):
- Renderer (public code): `aureon-models.ts` reads normal, metallic-roughness and emissive textures, MASK cut-outs
  and sampler wrapping (repeat) from own .glb files; soft contact shadow under floor-standing models (Real/Day);
  `real-pbr.ts`: glow around lit lamps (alpha-safe blending), warm night fill, softer per-lamp intensity.
- Private assets (not in git): material sets per model (512 px colour/normal/roughness, real-scale box UVs);
  new detailed JÄTTEBO (rounded seat/back cushions, arm, throw pillows; same footprint); decor models (tropical
  plants from the owner's renders, wool rug and walnut coffee table on the existing suggestions); plan v6.
- Proof in the disposable HA (SwiftShader): visibly better (cushioned sofa, wood grain, rug, plants, contact
  shadows) but still short of the reference: walls/trim, further models (BESTÅ, chairs, TV wall), more warm light
  sources, AO. Scene cost now ~746 draw calls / ~458k triangles at High — needs the iSG tier (Low/Auto) measured.

VIS-REAL-01 step 3 (Claude, 2026-11-01; owner: "do what is needed … like professional render programs", walls are
white and smooth, wall paint in the editor, "image quality all the time, any angle"; still NOT approved):
- Photo refinement of the Real look (public code): while the view rests, the picture is path traced
  (three-gpu-pathtracer 0.0.27 + three-mesh-bvh 0.9.17, MIT, notice in `frontend/THIRD_PARTY_PATHTRACE.txt`) and
  fades in over the live picture; any camera move shows the live picture at once and starts over after 0.4 s.
  Own lazy bundle `neonplan3d-pathtrace.js` (215 KB, budget 240 KB) that borrows three.js from the 3D bundle
  (`viewer/aureon-three-lend.ts`; build.mjs fails if the tracer needs an unlent class). Runs on Real when the
  quality is not the low tier: High always, Auto only with a graphics chip (software WebGL such as SwiftShader /
  llvmpipe is excluded); the low tier keeps the live picture only. Whether the iSG gets it on Auto is unmeasured. Lamps in candela for the photo, lamp shades translucent, glows/lines/contact planes excluded,
  ≤1 MP, 2×2 tiles per frame, 160 samples then it stops (now OFF by default, see below); a changing scene (models arriving) pauses 15 s, a lasting
  error turns it off for that view. No HA calls.
- Several lit lamps share the light budget (no hot spots when three lamps are on).
- Wall paint (public code): room form "Cor da parede" — 8 matt paints + free colour, stored in
  `room.aureon_finish.walls = {material:"paint", color}` (backend passes extra fields through), undo/redo,
  shown on the room's inner walls in 3D. Disposable HA test (`ha-paint.mjs`, private): pick, undo, redo, free
  colour, reload persistence — pass. Fidelity: renderRoomForm extension note updated.
- Private (not in git): detailed BESTÅ/HEDEVIKEN (6 fronts, 3 mm joints), ADSLEV-like chair (curved padded back,
  tapered oak legs), gathered DYTÅG curtain, floor lamp; plan v7 = v6 + table lamp and floor lamp as
  "Sugestão" + white smooth paint in all rooms except bathroom tiles / balcony brick.
- Test browser is SwiftShader (no GPU): one full path-traced sample of the Sala view (784×440) takes ~100 s
  there; on a real GPU it is expected in tens of ms — NOT measured on the iSG (ISG-01 still open).
- Follow-up the same evening: tracer sees walls cut and models clipped like the live picture (CPU copy of the fold
  shader rules), edge-preserving denoise for young pictures. Proofs (disposable HA + a private standalone harness
  with the repo renderer, all SwiftShader): night isometric converged to 32 samples at half resolution with soft
  bounce light, but the DAY proof showed wrong results for some own models (sofa/chairs nearly invisible, plant
  flat green) and some runs stalled at 0 samples — cause not found yet (models render correctly in an isolated
  three.js path-trace test with the same files and parser). Therefore the refinement is now OFF by default
  (`AureonPathTrace.enabled = false`), shipped code only; no user sees it until the proof passes.

### VIS-REAL-01 — owner brief of 2026-11-01 19:10 (quality references) and plan
Owner: references define the finish (well-modelled furniture with curves/seams/thickness, real-scale wood/fabric/
ceramic/metal, coherent glass, balanced natural+artificial light, soft and contact shadows, depth, no blocks/plastic/
blown lights, in isometric AND interior views). Not "recolour or brighter lights". Full Sala proof first with the
private plan and models, compare, name what blocks the target. Validate separately: (1) browser quality,
(2) iSG Display Max fluidity/stability, (3) phone. Best sustainable quality per device, never High forced
everywhere without measuring; no desktop capture as iSG proof. Capture + video of the real renderer with settings
and measurements. If the technology cannot reach the target: explain the limit and propose a concrete architecture
change with costs/effects on editing, interaction and performance. Owner later: "focus on quality, not the iSG";
she supplied product photos (JÄTTEBO, SINNERLIG, BÖJA, BLIDVÄDER, LINDBYN, TARSELE, BESTÅ/HEDEVIKEN chevron
doors 180×42×64 wall-mounted, ADSLEV armchairs from JYSK, corduroy cushion) — private, not in git.

Gaps found (Sala, live picture and refinement):
1. Geometry: own models are code-built approximations (boxes with rounding). Chairs, lamps, BESTÅ doors, table
   edge/legs, curtains miss the curves, seams and thickness of the references. JÄTTEBO rebuilt from the owner's
   photos/dimensions (modules, base + seat cushions, piping, corduroy, recessed feet) — others pending.
2. Materials: 512–1024 px procedural textures; no sheen (velvet/corduroy), clearcoat, subsurface; the parser reads
   base/normal/MR/emissive/alpha only. Wood grain wavy and too saturated on TARSELE.
3. Light: the live picture has direct lights + painted light pools, no bounce light and no ambient occlusion — the
   main reason it looks flat ("blocks"). Path tracing fixes this at rest but needs a GPU and is not yet correct.
4. Image treatment: ACES only; no bloom/glare on shades, no exposure adaptation, labels over the picture.
5. Phone (EMULATION 390×844@3x, SwiftShader): Auto chose the low tier (correct for an unmeasured device), but it
   renders at pixel ratio 1 on a 3× screen (soft/pixelated), and the 3D card is crowded by the look menu, Passeio
   and Floor Studio buttons; a tap on the Sala opened the room sheet over the 3D. Physical phone not tested.
6. iSG: not tested (no access); its tier stays Auto with the refinement off.

Architecture proposal (not started, needs owner OK):
A. Keep: live raster + (once fixed) path-traced refinement at rest — always coherent with edits and HA states
   because it is rebuilt from the live scene; cost: GPU time, off on low tier.
B. Recommended next: baked bounce light (lightmaps) per light for walls/floors/static furniture, computed with the
   same tracer in a capable browser and stored in HA per plan revision; live view = raster + lightmaps (+ SSAO).
   Gives GI/AO while moving at almost no runtime cost (iSG/phone friendly). Limits: rebake after moving walls or
   furniture (until then the current look), one lightmap set per lamp so on/off/dim/colour stay coherent
   (linear), moving things (people, robot, opened doors) get no baked light; costs: xatlas UV unwrap (~200 KB wasm,
   lazy), ~4–16 MB textures per floor per lamp, bake seconds–minutes on a GPU, storage in /config.
C. Assets: real product models (owner's photos → careful modelling, or manufacturer 3D files kept private) and
   scanned CC0 materials with sheen/clearcoat parsing. Largest visible gain, independent of A/B.
D. Not as main path: offline renders (Blender/Cycles on another machine) — reference quality but no interaction.

VIS-REAL-01 step 4 (Claude, 2026-11-01 evening; owner: "keep going, realistic like professional programs"; all
furniture must stay editable — it does: every model is an ordinary plan item with `aureon_model`, moved/turned/
resized/deleted in the editor; still NOT approved):
- Live Real look, quality "High" only: ambient occlusion (three.js GTAO from the depth of the drawn picture, so cut
  walls/clipped models are respected; denoised; transparent canvas kept) → contact darkening under sofa/chairs/
  table, corners and between cushions while moving, at any angle. Cost: one extra full-screen pass set; 3D bundle
  +40 KB (budget 944 KB). Known difference: the painted window light patch (additive glow) is not drawn when AO is
  on. Auto/Low unchanged (no AO) until a device is measured.
- Private assets rebuilt from the owner's product photos (not in git): JÄTTEBO 310 (modules, base + seat cushions,
  piping, corduroy), BESTÅ/HEDEVIKEN chevron 3 doors on the floor, JYSK ADSLEV tub armchairs (channelled back,
  splayed oak legs), TARSELE (thick oak top, black U legs), LG OLED83B59LA on the wall, SINNERLIG (three woven
  bamboo drums, cut-out), two BÖJA on a walnut sofa console with inset socket, oak/felt acoustic panel, 3D wooden
  world map behind the sofa, large light-beige plush rug, DYTÅG linen white + beige on a double ceiling track on
  both sides of the window, corduroy cushions; private plan v7 updated (sofa 21 cm off the wall for the console).
- Evidence (private harness = repo renderer + private plan, Chromium/SwiftShader, not HA/iSG/phone): day/night,
  isometric and interior captures, orbit video, comparison with the owner's references. Remaining gap vs the
  references: bounce light (still no GI while moving), image treatment (glow/exposure, TV reflections), chair leg
  joints, curtains seen from inside; platform browser test flaked once under load (passed on rerun).

VIS-REAL-01 step 5 (Claude, 2026-11-02; owner: "fix everything to look like professional programs"; still NOT approved):
- Photo refinement (path tracing at rest) fixed and switched back on, quality "High" only (Auto/Low never trace):
  causes found with the private harness: (1) own models had metalness 1 with metal/rough maps → mirror-like sofa/
  chairs in the trace; private models re-exported with metalness 0 for non-metals; the tracer also gets lean copies
  (colour/alpha only, metal only where named); (2) the tracer stores ONE material per vertex, so multi-material
  meshes (walls/floors with PBR groups) with shared vertices mixed materials (orange walls, green floor) — it now
  gets one plain, unshared, single-material mesh per material range (`splitByMaterial`, tested); (3) cut copies kept
  the original layout. Brighter sky for daylight in the photo; seamless rug texture.
- Unit tests 529 pass; browser floor/editor/platform/music pass; fidelity unchanged.

### CI-INT-01 — aureon-integration validation failures (Claude, 2026-11-02, owner request)
Root cause (logs of runs 41309856615, 41344081791, 41351602347): `Verify pre-release guard` failed with
`AssertionError: package not built from SOURCE_COMMIT` — the package was generated BEFORE the dashboard commit was
made, so `MANIFEST.json.source_commit` named the previous commit while `SOURCE_COMMIT` named the new one (2cd65cc:
4d6e0cf vs f64cfc6; d463b09: 429f643 vs b49690b; 1363acc: b49690b vs 23de01a). A real inconsistency, correctly caught.
Fix at the source: `scripts/package-hacs-integration-candidate.mjs` refuses uncommitted changes and writes
`SOURCE_COMMIT` into the package (copy it, never hand-write it). Integration repo: `validate.yml` now runs
`.github/scripts/validate_distribution.py` (YAML, hacs.json schema, integration manifest, Python compile, JSON,
source pin, per-file checksums vs MANIFEST, release guard, secret patterns; actionable messages and annotations),
`candidate.yml` also proves the committed package is byte-identical to a fresh build of SOURCE_COMMIT; both on
`ubuntu-24.04`, Node-24 actions, concurrency groups; monthly grouped Dependabot for actions; `CI.md` (publish order,
diagnosis table). The older candidate failure (41301876357, migration contract expected test.1) was already fixed.

## THEME-02 — Silver Penthouse / Amethyst Lounge (Codex, 2026-11-02)
Owner requested both visual concepts in Einstellungen → theme selection.
- Added distinct `silver-penthouse` (charcoal/silver/ice blue) and
  `amethyst-lounge` (plum/rose gold) palettes without replacing existing IDs.
- Settings exposes both names in the selector and compact CSS colour previews.
  Selecting a palette or preview activates custom appearance directly; existing
  per-user preference persistence and shared AUREON/Floor Studio tokens apply.
- Scope: theme colours/finishes. The reference images' separate desktop/mobile
  compositions and architectural image quality are NOT implemented by a palette.
  Next owner: Claude for those layout requirements, preserving these palette IDs.
- Source files: floor-studio/aureon-dashboard.js, dashboard/platform/page.mjs and
  styles.mjs; browser coverage added to scripts/test-platform-browser.mjs.
- Build/typecheck and 67 dashboard unit tests passed. Browser outcome and HACS
  promotion recorded below after execution. No physical iSG/phone or live HA test.
- Final validation: platform browser suite passed, including direct activation of
  both previews and 390px settings width. Existing binding test now waits for its
  rendered summary after loading (avoids an asynchronous rendering race).
- Added both IDs to the preference validator; otherwise reload/save discarded
  new selections. HACS dist rebuilt, checksum updated; npm run validate passed.
- Dashboard-only change: integration backend and SOURCE_COMMIT unchanged.


## CONTOUR-01 — Entire imported plan outline editing (Codex, 2026-11-02)
Owner requests moving/resizing/removing existing walls and corners throughout the
imported plan, not just drawing new free walls.
- Root usability issues: hit testing only accepted a 7px centreline; furniture and
  openings were selected before the room contour; outer-wall removal was blocked.
- Room inspector now offers “Edit plan outline” and every numbered contour edge,
  including short/obscured edges. Explicit mode prioritizes walls over objects;
  standard mode and original insert/corner controls are preserved. Selection
  accounts for visible wall thickness. Numeric X/Z endpoints follow shared corners
  and reproject openings; unshared corner drags now also reproject openings.
- Wall removal/restoration supports exterior walls without deleting room/floor.
  Shared wall restoration discovers both sources even when both heights are zero.
  Existing plan locks and admin checks remain. Furniture remains independent of
  contour changes; no automatic rewrite/migration of private plans.
- Files: editor.ts, EN/DE/PT labels, generated integration bundles; reviewed the
  onPointerMove, pointerDown and renderRoomForm fidelity extensions explicitly.
- Added scripts/test-contour-browser.mjs to npm run test:browser. Synthetic six-room
  fixture checks every edge, thick-wall selection, outline toggle, left/bottom
  drags, corner drag, numeric edit, exterior/shared remove+restore, undo/redo,
  save/reopen, lock and narrow-screen controls. Private backup used locally only;
  no plan, model, screenshot or credentials committed.
- Build/typecheck, 529 frontend unit tests, full npm test and original editor
  browser suite passed. New contour tests passed against synthetic and owner
  backup. These are local compiled-editor fixtures, NOT live HA or iSG validation.
- Next: owner checks installed integration after HACS redownload + HA restart.
  This batch changes editor resources, so integration packaging must name the
  published dashboard commit in SOURCE_COMMIT; never hand-edit that pin.

## OWN-FURN-01 — "Meus móveis" in the editor and load-time diagnostics (Claude, 2026-11-02)

- Owner request: the furniture she removed from her plan must stay available in the editor's furniture list.
- Backend: websocket `neonplan3d/aureon_models/list` (signed-in users, read-only) lists the `.glb` files in
  `/config/aureon_models` with their real size read from the GLB bounds; an optional private `catalog.json` there
  adds display names, furniture type, `mount_y` and `mirror` (validated, unknown keys ignored). No files in git.
- Editor: section "Meus móveis" at the top of the furniture library (search box above 8 items). A tap adds a normal
  furniture item (`aureon_model`, real size) to the selected room or plan centre; it is moved, resized, undone and
  deleted like any item, and the file stays in the list. Fidelity: `renderFurnitureLibrary` recorded as
  `aureon_extension` (one added call).
- Diagnostics: the AUREON device check now also reports load times (navigation, JS bundles, own models, first 3D
  frame, models on screen, long tasks) so the owner can measure Chrome/GPU PC and iPhone without guessing.
- Tests: npm test 174 + 529, validate, migration contract, typecheck, browser suites, backend pytest 141 (incl. the
  new list tests), ruff. Disposable HA (emulated desktop, SwiftShader): list shows 24 private models with names and
  sizes; add sofa + 2 lamps, undo, saved to HA; plan restored. Not tested on the owner's HA, iSG or phone.


## LOAD-01 — Endless plan loading / reconnect recovery (Codex, 2026-11-02)
Owner screenshot shows the native card's “Loading” placeholder, before building
arrival (not evidence of a GPU/model bottleneck). Actual owner latency is unmeasured.
- Found unbounded building reads and setHass starting only for the first connection:
  a request that never settles stays loading; replacing the HA connection does not
  reload. No claim that this is the sole cause on the owner's installation.
- Building reads now have a 12s deadline, a localized explanation and explicit
  Retry. Optional pack reads have a separate 4s deadline and do not block showing
  the building. No repeated background polling or private-plan disk cache added.
- Scope/read generations discard stale completions after timeout, retry, detach
  and connection replacement. Subscriptions acquired after detach are released.
  Original save/edit logic and renderer quality are unchanged.
- Added deadline unit tests and scripts/test-loading-browser.mjs to test:browser:
  simulated never-returning WS request -> timeout message+Retry; recovery with
  optional packs stalled; late reply cannot overwrite recovered plan; new HA
  connection reloads. Actual compiled card + synthetic WS, not owner HA hardware.
- Build/typecheck, npm test and focused loading browser tests passed. Broader
  browser outcome is recorded below. No actual load-time improvement on the owner's
  PC/iSG/phone has been measured; owner diagnostics remain needed for that claim.
- Final validation: all six browser suites passed (music, platform, floor,
  original editor, contour, loading); final build/typecheck, npm test and validate
  passed. Timeout messages are localized in the shared controller, so other
  native views do not display an internal error code. Integration package must
  pin this published source revision. Real owner load latency still unmeasured.
## PAINT-02 — single-wall paint, pure white, bathroom tiles with navy band (Claude, 2026-11-02, owner request)

- `room.aureon_finish.wall_paints`: colour per room edge (aligned with `points` like `wall_heights`; null = room
  colour). Picked wall panel gets "Cor só desta parede" (swatches, free colour, "Igual ao cômodo"); corner insert and
  delete keep the list aligned (`spliceWallPaints`; fidelity notes on pointerDown/deleteVertex). 3D: those edges leave
  the room surface and get their own paint surface (only this room's side of a shared wall).
- Paint list starts with "Branco puro" `#fbfbfa` (owner: the previous whites looked odd).
- Wall covering buttons: "Azulejo branco" and new finish `white_tiles_navy_band` (white 30×60 tiles, navy mosaic band
  1.20–1.32 m, one band per 2.40 m repeat). White tiles drawn plain glazed (no marble veins).
- Budgets: editor 952 KB (+8), card editor 278 KB (+2), reasons in build.mjs.
- Tests: unit (finishes 6), npm test 174 + 531, validate, contract, browser suites, pytest 141, ruff; disposable HA
  (emulated desktop): single wall graphite + undo/redo + reload + clear, bathroom navy band, pure white; private
  harness 3D (SwiftShader live): band and single wall visible. Not tested on the owner's HA, iSG or phone.

## OWN-FURN-02 — "Importar móveis" (Claude, 2026-11-02, owner request)

- POST `/api/neonplan3d/aureon_models_upload` (administrators only, 403 otherwise; max 120 MB): a .zip (base names
  of `.glb` members and `catalog.json` are taken from any folder in it; hidden/macOS files and everything else
  skipped; each model checked as binary glTF with a mesh) or one `.glb` with `?name=`. Writes atomically into
  `<config>/aureon_models`; nothing is deleted, same names are replaced, catalog entries are merged.
- Editor "Meus móveis": admin button "Importar móveis" (file picker, .zip/.glb, several files), status line, list reload.
- Also: floor finishes use a constant depth offset (no slope factor), so thin rugs are no longer hidden (324c006).
- Tests: pytest 144 (zip import, traversal names, invalid models, catalog merge, admin-only upload), npm test, validate,
  contract, browser suites; disposable HA: empty folder → import of the owner's private zip → 35 models listed with
  names; invalid upload → 400. Not run on the owner's HA.

## LOOK-01 — Real only; single wall picker in the paint panel (Claude, 2026-11-02, owner request)

- Owner: remove Day/Night/Auto/Neon/Blueprint, keep only Real (which follows day and night by sun.sun).
  AUREON Startseite: look select removed, home plan always `real`, stored `floorLook` other than `real` ignored.
  Floor Studio panel: look buttons removed (`_theme = "real"`; accent picker kept). Card and editor 3D previews pass
  `real`; card editor has no look choice (default `real`). The other looks stay in the renderer (renderer tests keep
  all five); fidelity notes on card render, editor render3d/renderWallView. Theme regression test updated to this decision.
- Owner could not find "paint one wall": the room's paint panel now lists the walls ("1 · 2,13 m" …, a dot shows a
  wall's own colour); tapping one highlights it in the plan and shows "Cor só desta parede" right there.
- Tests: npm test, validate, contract, browser suites (platform test: no look select, older stored looks show Real),
  disposable HA: Startseite without look select, card theme real, panel without look buttons; wall 3 painted via the
  new picker, undo/redo/reload/clear. Stable dist rebuilt (page.mjs). Not run on the owner's HA.

## PETS-01 / CLEAN-01 — Golden Retriever; Halloween and help removed (Claude, 2026-11-02, owner request)

- Golden Retriever: model "Golden Retriever Dog 3D Model (Free)" by iRahulRajput (Sketchfab, CC BY 4.0, AI-generated)
  reduced to 25k triangles / 1024 px, shipped as `frontend/pets/golden-retriever.glb` with THIRD_PARTY_PETS.txt and a
  credit line under the pets. `fun/golden.ts` skins it at run time on the pets' rig (body, legs, head, tail); an own
  `pet-golden-retriever.glb` in `/config/aureon_models` takes precedence (hidden from "Meus móveis"). Breed and coats
  live in `aureon-pets.ts` (model.ts is a protected original file; `npm test` includes test:fidelity — check its exit code).
- Removed on owner decision: Halloween (pack filtered in listPacks, no ghost option), help and feedback links,
  "Help improve" topic and invitation, the extensions teaser under the library. Editor browser test expects no
  backend call at start.
- Pending owner approval: the redesign (Floor Studio "Ajustes" instead of the Extensions tab, packs/modules built in).
## STUDIO-UI-01 / ATELIER-01 - local approval preview (Codex, 2026-11-02)

- Owner explicitly requires visual approval BEFORE publishing. All changes remain local;
  no push, release, HACS package promotion or integration update authorized yet.
- Fetched and fast-forwarded to Claude's PAINT-02 at 8e9b0eeb before editing. Preserved
  wall paint, finishes, native tools, geometry and import/export. Re-fetch before publication.
- Added theme-aware Floor Studio rail, optional furniture library, native inspector,
  visible undo/redo, 2D/3D/split controls and responsive mobile dock/sheet. Native
  complete toolbar remains available under Tools. Editor-only styles remain lazy.
- Dashboard polish: room photo gallery, wrapping names, catalog summaries, camera,
  assistant, calendar and settings layouts; existing service callbacks retained.
- Candidate build/typecheck and npm test/fidelity pass; original editor 8 browser
  checks passed. Local screenshot harness passes desktop/tablet/mobile and theme
  checks. Full browser regression running; see /tmp/aureon-atelier-browser.log.
- Preview PDF contains 17 actual local screenshots with synthetic plan/data. No
  owner's personal models or plan included. Stable dist and integration untouched.
- Editor budget 972 KiB (+20 for responsive workspace), built 963.4 KiB.

## DISCOVERY-01 - local label filters and automatic equipment classification (Codex, 2026-11-02)

- Owner requests Simon42-like metadata discovery plus labels and visual review before publishing.
  All work remains LOCAL, no commit/push/dist promotion/integration update.
- Re-fetched origin/master: unchanged at 8e9b0ee. Read Simon42 Registry.ts reference at
  944ba945a066a2c4ad339ade128d898a3f373a44: explicit category/hidden/label metadata,
  technical section separate. No source copied or modifications to reference repository.
- New platform/discovery.mjs classifies by original domain, device_class, entity_category,
  socket label and explicit presentation overrides. Unspecified switches remain switches.
  Classification never rewrites entity IDs/domains or grants new service capabilities.
- Saved per-user/browser include/exclude label sets (inherited entity/device/area labels
  already supplied by registry). Exclusion wins; no_dboard and no-dboard respected.
  systemgeraete_dashboard denies actions without hiding state. Registry label case preserved.
- Equipment page has function chips, combined type/availability/label/area/search filters,
  collapsed advanced filters on mobile, technical disclosure and per-entity category override.
  Room panel now separates technical rows too. EN/DE/PT labels added.
- Unit checks: 74 dashboard tests; focused discovery browser harness exercises native
  compiled dashboard, classification, combined filters, label hiding/state denial and
  desktop/mobile overflow. See build/discovery-preview logs and synthetic screenshots.
- Broader earlier Atelier browser batch had a contour drag assertion failure (room vs roomedge)
  in test-contour-browser.mjs. Do NOT publish until resolved and regression rerun; original
  editor suite passed before this. Physical HA/iSG/phone not tested.

## BALANCE-01 - approved compact page and Aubergine Balance theme (Codex, 2026-11-02)

- Owner approved the compact, device-image-free composition with people below header,
  realistic condition-driven weather, top-only filters and waste alongside people.
  Requested implementation + theme entry. Still no publication before actual-screen review.
- Fetched and integrated Claude commits 324c006, 918f43b and c66a318 before edits. Preserved
  furniture import, finish fixes and current Real-only UI decision. Remote HEAD c66a318.
  Local preview changes were stashed safely, ff merged, conflicts resolved; stash retained.
- Added platform/balance.mjs + theme-token responsive CSS. Device categories use original
  HA IDs, capabilities, service adapter, sensitivity confirmations and detailed controls.
  Initial groups cap at six rows; more/category tabs expose the remaining entries.
  Climate has setpoint ring and bounded +/- controls; sensors stay read-only; cameras
  load only after explicit click. Scenes retain original actions and confirmations.
- People use visible person entities and their HA picture or initials, presence, and only
  one unambiguous valid battery linked through device-tracker registry metadata. No personal
  portraits or hardcoded owner plan. iSG Display-style person entries excluded.
- Weather sprite (weather-atlas.png) generated specifically for AUREON; original source
  exec-93f85bd7-1d57-4f1d-be33-2347a45f42a6.png. Six transparent condition frames, CSS
  clipping (no renderer dependency). Unknown/unavailable does not invent a temperature.
  Sun metadata selects day/night for clear weather; rain/lightning take precedence.
- Waste uses explicit existing preferences and WCS normalization, no city/calendar defaults.
  Visible no-data fallback; opens Agenda; refreshes on entry and existing polling cadence.
- Added selectable Aubergine · Balance palette, validated import/persistence, EN/DE/PT labels.
- Found prior Studio chrome regression: localPoint selected the first SVG (now a rail
  icon). Scoped it to svg.fp3d-plan, reviewed fidelity extension. Native geometry unchanged.
  Contour browser six checks now pass incl wall drag, corner drag, undo/redo/save/reopen.
- Build/typecheck pass (editor 966.9/972 KiB, main 751.3/752, 3D938.3/944). npm test passed
  after merge; focused dashboard 77 tests pass incl weather, battery and theme. Original
  editor browser passed. Focused Balance harness passes classification/filters/hide/state
  denial/responsive widths; synthetic screenshots in build/balance-preview. Broader
  platform browser rerun underway; log build/balance-platform.log.
- All changes local, stable dist not promoted by Codex, integration not rebuilt/advanced.
  No validation on owner's actual HA, iSG or phone. Actual-screen review still required.
- Final focused evidence: 77 dashboard tests pass; platform browser 26 checks pass;
  native editor browser 8 pass; contour browser 6 pass. Balance screenshot harness
  passes after fixed mobile navigation. Root duplicate header removed via explicit
  route metadata (shadow DOM cannot be traversed by :has). Desktop compact icon rail,
  fixed mobile navigation and safe bottom padding verified in synthetic captures.

## BALANCE-02 - reference fidelity correction (Codex, 2026-11-02)

- Owner rejected BALANCE-01 as visually different from the approved image. Corrected
  panel gradients, grouped unboxed rows, typography, thin custom range tracks,
  inline mobile light controls, open thermostat arcs and compact setpoint buttons.
  Search/area/Labels now share a top toolbar; advanced filters expand from one icon.
  Overview keeps principal categories + scenes; Others opens secondary categories,
  also accessible from the category tabs. No entity IDs or services rewritten.
- Updated Balance preview harness verifies technical categories through the actual
  tab state after overview collapses them. 77 dashboard tests pass; focused Balance
  browser classification/filter/hide/state-denial/no-overflow checks pass after changes.
- Fetched remote at start: origin/master now 49f5921 (pet and editor changes after
  c66a318). Reviewed diff/log; NOT merged into this active presentation pass yet.
  Must integrate those changes and rerun whole-candidate checks BEFORE publication.
  No push or dist promotion. The owner still requires real-screen approval.

## BALANCE-03 — owner approved publication, 2026-11-02 (Codex)

- Owner now explicitly requests publication, all dashboard cards removable/addable/movable/editable,
  and the stronger burgundy/plum/champagne colors of the approved reference.
- Fetched and merged dashboard master through 64448c1 before publication. Preserved Claude's
  Golden Retriever catalogue/licensing, original model.ts, removal of seasonal/help/feedback UI,
  Real-only presentation choice, and late-mount/60-second home plan loader. Integration synchronized
  with 8cdb851; duplicate local recovery commit was already upstream and skipped by rebase.
- Balance compact composition: people, valid linked batteries, generated weather symbols, collection,
  functional category groups, include/exclude Labels, safe automatic classification and manual override.
  New Aubergine Balance palette is more saturated and luminous. Native entity IDs/services unchanged.
- Personal layouts on platform pages: Edit cards, remove/restore, add an eligible equipment card,
  rename, change width/density and reorder among siblings using accessible arrows; undo/reset.
  Saved per HA user/origin/browser, included in settings export/import. Editing calls no HA service.
  Adding/restoring respects entity visibility and the existing system-entity control restrictions.
- Studio original editor tools retained inside new responsive workspace; geometry source and original
  model remain protected by fidelity gate. Chrome budget +2 KiB accommodates merged Golden catalogue.
- Validation: full JS/frontend suite and fidelity passed; Python gate regressions passed (10).
  Focused browser verifies classification/Labels, desktop/mobile, edit/add/remove/restore/title/size,
  navigation persistence and reorder with no HA service calls. Required full browser suite and
  distribution/package checks run before promotion. Synthetic fixture only, no live HA/physical iSG.
- Publication scope: master source + compiled stable dashboard/assets + reproducible integration pinned
  to committed source. No tag or release. Do not overwrite later remote work; fetch again before push.
- Final local validation completed: 186 dashboard/module tests + 535 native frontend tests; fidelity
  2121 original methods / 35 reviewed extensions / 23 protected files; typecheck/build within budgets;
  browser music/platform/renderer/editor/contour/loading checks passed (editor/contour/loading rerun with
  explicit CHROME_BIN after the local browser path was missing); focused Balance layout checks passed.
  Stable dist and matching assets deliberately promoted; HACS/hash/public-source and build evidence passed.
  Backend source unchanged; the isolated local backend test environment lacks pytest/HA dependencies,
  and attempted dependency installation did not complete. Backend CI remains the authoritative harness.

## NAV-01 — accessible navigation on long pages (Codex, 2026-11-02)

- Owner reports having to scroll the entire page to find the menu. Prior bottom sticky navigation
  depended on document flow; the fixed exception covered only Devices and could be trapped by HA
  card ancestors. Replaced with a viewport-bounded shell and independent main-content scrolling.
- Navigation stays outside the scrolling content on every route. Mobile bottom bar retains safe-area
  padding and More; desktop rail scrolls independently on short screens. Shell measures the actual
  visible space below the HA header/card offset and reacts to resize/visual viewport; observers and
  listeners are released on detach. Page navigation resets the content scroll to the top.
- Changed only dashboard shell, browser regression coverage, compiled dist and checksum. Native
  renderer/editor/backend unchanged, so existing integration pin 69857f1 remains compatible.
- Fetched master 69857f1 before editing/publication. Validation passed: 186 + 535 JS/frontend tests,
  fidelity gate, full typecheck/build, platform browser checks including long-page menu visibility
  and More at 1440x900, 1024x600, 820x600, 390x844 and 844x390 with transformed HA-like ancestors.
  Browser fixtures are synthetic; physical iSG/owner HA not accessed. Owner's publication authorization
  remains active; promote tested dist to master/HACS, no tag/release or integration rebuild needed.

## SETTINGS-01 — mobile visual correction, preview pending (Codex, 2026-11-02)

- Owner rejected the shipped settings/mobile More visuals using seven iPhone captures: tall repeated
  checkbox rows, every section expanded, cropped native file control, floating image illustration badge,
  and oversized/poorly positioned More sheet. Review is grounded in those captures, not a generated mock.
- Reworked settings into eight categories and one focused panel; mobile category list + Back, desktop
  settings rail. Existing values/HA registry sources and service/confirmation behavior retained.
- Compact Label matrix (show/hide in one row), equipment category/search with 30-item increments and
  bounded list scrolling, waste source search and bounded checklist, primary energy fields with periods
  disclosed on request, expandable room-picture rows, hidden native import file control with keyboard
  activation, advanced diagnostics/users/backup. Theme/widget changes preserve the open settings panel.
- Mobile navigation uses Home, Devices, Media, More; full Rooms/Floor Studio and every remaining route
  available in More. More is a bounded bottom sheet with compact two-column rows, title/close, current
  destination and expanded-state semantics. Menu stays outside page scrolling; no truncated Floor label.
- Validation: full JS/frontend/fidelity tests passed; typecheck/build passed; platform browser suite passed
  including native bindings, permissions, translations, account isolation and menu/long-page regression.
  New preview-settings harness passed with 140 synthetic technical sensors and 32 calendars: category
  navigation, theme/Label persistence, bounded lists/filtering, disclosures, no overflow at 428/390/1024/844,
  short landscape navigation, and More bounds. Synthetic fixture only, no owner HA or physical phone test.
- Actual implementation captures assembled into AUREON_Configuracoes_Revisao.png for visual review.
  No new commit/push/dist promotion or integration pin change: show owner this revision before another
  visual publication. Stable HACS remains dd5ffae. Continue from these local source changes after review.

## LABELS-02 — Labels only as a view filter (Codex, 2026-11-02)

- Owner requests Labels only as a filter. Removed the settings category and Show/Hide matrix.
  The equipment toolbar has a single Labels dropdown, including mobile, with All labels, label counts,
  and a removable current-filter chip. Filtering affects rendered equipment only, never HA entities.
- Retired legacy include/exclude preference rules during validation so an invisible old rule cannot
  keep equipment missing after choosing All. Reserved no_dboard and system-device control restrictions,
  explicit per-entity hidden settings and HA permissions remain independent of this transient filter.
- Removed duplicate Labels selector from the Devices advanced filters; other pages retain their
  existing local Label filter. Added room selection in mobile advanced filters, since the toolbar's
  room selector is hidden on narrow screens. Balanced filter controls use an explicit wrapper layout.
- Updated unit and synthetic browser coverage for filter/clear without controller state denial,
  removed settings administration, and retained card-editing/category/availability behavior.
  Full JS/frontend/fidelity suite passes; focused desktop/mobile browser pass. Review remains local,
  no commit/push/dist promotion. Continue SETTINGS-01 revision; earlier Labels matrix preview is superseded.

## THEMES-02 — automatic HA language and visual theme gallery (Codex, 2026-11-02)

- Owner requests removal of language setting: language getter now always uses HA locale/language,
  old manual preference imports migrate to auto, selector removed. HA language changes refresh shell
  labels as well as platform content, preserving the open settings category. Scope/storage regression
  tests now use palette/density; added automatic locale precedence and old-language migration coverage.
- Replaced name-only palette select and three placeholder swatches with all 26 theme miniatures,
  drawn as vector dashboard layouts using each real palette's background/surface/accent/text colors.
  Gallery is compact and scrollable, selected card has outline/check, active theme shown above it.
  Picking a theme immediately applies the custom palette without a prerequisite mode selection or
  remounting the page, preserving gallery scroll and keyboard focus. Fixed initial select/option state.
- Full tests/fidelity, typecheck/build, platform browser suite and focused settings preview passed.
  Verified dark/light palette application and gallery scroll preservation, all 26 previews, no language
  selector, HA-driven translated navigation, mobile/short-landscape fit and reserved security behavior.
- Labels remains only the transient equipment filter from LABELS-02. All current revisions LOCAL;
  no dist promotion, commit/push or integration pin update. Await owner's visual review/publication.

## SETTINGS-PUBLISH — owner approved, 2026-11-03 (Codex)

- Owner explicitly approved the settings/theme design and requested publication. SETTINGS-01,
  LABELS-02 and THEMES-02 review holds are superseded by this authorization.
- Fetched and checked remote master dd5ffae; no later Claude changes to integrate. Native compiled
  renderer/editor/backend are byte-unchanged. Existing integration source pin remains compatible;
  this publication changes only the dashboard and its stable dist, no integration update needed.
- Version 0.29.0-test.3, build AUREON-SETTINGS-20261103. README reflects automatic HA language,
  all 26 visual theme previews, compact settings and transient Labels filtering.
- Final checks passed: 187 dashboard/module tests + 535 native frontend tests, original fidelity gate,
  typecheck/build, complete platform browser suite (including locale/navigation, security, native
  bindings, account isolation, long-page menu), focused settings preview with large synthetic inventory,
  and equipment/Labels/card-layout browser regression. No physical iSG/owner HA claimed.
- Deliberately promoted compiled dashboard/assets to dist and updated stable checksum after approval.
  HACS metadata/checksum, public-source privacy and both build-evidence checks pass. Publish directly
  to master through authenticated GitHub connection, preserving expected remote head; no tag/release.

## FLOOR-UI-01 — Floor Studio "Ajustes" and side-panel redesign (Claude, owner-approved 2026-11-02/05)

- Floor Studio tabs are 3D | Editor; the Extensions tab, the "Módulos AUREON" button and the small 3D gear are
  replaced by one "Ajustes" sheet (below HA's top bar): Visual e qualidade (all former 3D view options, labelled),
  Meus móveis (count + Importar móveis), Animais de estimação, Módulos e pacotes (AUREON module approval unchanged:
  explicit, temporary, admin-only; NeonPlan modules; installed packs folded). `fp3d-extensions` gained `section`.
- Editor side panel: rooms list folds behind an arrow (remembered per device), "Ajustar a planta" card with icons,
  delete floor separated. "Meus móveis": 3 columns with real pictures of each own model (3D bundle
  `aureonModelThumb`, one at a time). Shared `aureon-own.ts` for list/import.
- Budgets: main 768, editor 960, card editor 282, 3D 952 KB (reasons in build.mjs).
- Tests: npm test (admin-only approval check moved to the sheet), validate, contract, browser suites, pytest 144;
  disposable HA: tabs, all four Ajustes sections, editor panel, 25 model pictures. Not on the owner's HA.
- Note for Codex: 029eeac bumped the stable dist to 0.29.0-test.3 but the migration contract still pinned
  test.2 (Floor Studio source build red on master since dd5ffae). Pin updated to test.3 in the same push.
- Published 2026-11-05 after rebasing onto 69857f1/dd5ffae/029eeac: dashboard 61f28db, integration 89699d0, all CI
  green. Disposable HA after the merge: Meus móveis shows all 35 pictures + Importar (3 of 3 runs).
- Watch item for Codex: in one run right after an HA restart the embedded `neonplan3d-panel` was replaced
  (editor -> 3D view) about 5 s after opening the editor; not reproduced afterwards. If it shows again, check what
  re-renders the Planta page during startup (registry/identity paths in the hass setter) — a rebuild drops
  unsaved editor work.

## SEP-01 — AUREON Floor Studio separated from the official NeonPlan 3D (Claude, owner decision 2026-11-05)

- Why: an HACS update of the official NeonPlan 3D overwrote the owner's AUREON build (same folder
  `custom_components/neonplan3d`). Owner chose name "AUREON Floor Studio" and to remove the official integration.
- Integration is now `floor-studio/neonplan3d-main/custom_components/aureon_floor`, domain `aureon_floor`: WS
  `aureon_floor/...`, `/aureon_floor_static`, panel `/aureon-floor-studio`, loader `aureon-floor-loader.js`, model
  API `/api/aureon_floor/aureon_models/...` (+ read-only legacy `/api/neonplan3d/aureon_models/...`, saved plans
  carry it), sentences file `aureon_floor.yaml`, locate folder `aureon_floor_locate`.
- Stores: `async_migrate_legacy_stores` copies building/images/history/packs/license/voice/locate once from
  `neonplan3d.*` (else `floorplan_3d.*`); never overwrites an existing aureon_floor store, never deletes/changes the
  old ones. Licence binding string in packs.py unchanged (protected file).
- Unchanged on purpose: browser element names (`neonplan3d-panel`, `neonplan3d-card`, `fp3d-*`), backup/export format
  "neonplan3d", localStorage keys. So the official must not stay installed next to it: a persistent notification
  asks to remove it while `custom_components/neonplan3d` exists; the old dashboard resource is taken over only
  when that folder is absent (own resource otherwise untouched by either side).
- Fidelity: 39 original methods differ only by the WS/URL namespace — recorded as aureon_extension "SEP-01" after a
  scripted proof (reversing the rename gives the reviewed hash). Verifier maps protected py paths to aureon_floor.
- Updated: migration contract (new identity), floor-embedded/local-resource tests, integration repo
  validate_distribution.py, hacs.json name, README; docs NEONPLAN_MIGRATION_AND_ROLLBACK (SEP-01 section),
  DISTRIBUTION_TARGET. dist rebuilt (still 0.29.0-test.3): dashboard WS calls/route/loader use the new names, so the
  dashboard and the integration must be updated together.
- Tests: pytest 149 (new: takeover of all stores + old untouched, own plan never overwritten, notice with/without the
  official folder, legacy model URL), ruff, npm test, typecheck, validate, contract, browser suites. Disposable HA:
  switched a running neonplan3d install (rev 200, 6 rooms, 45 items) to aureon_floor → identical plan/history,
  old store byte-identical, resource taken over, Floor Studio + Ajustes + 35 own pictures + home 3D plan, no 404s;
  official 2.0.7 installed next to it → notice shown, our stores unchanged, its own resource separate; removed →
  notice gone, stale resource cleaned. Not tested on the owner's HA.
- Owner approved publishing on 2026-11-05 ("Sim, pode publicar").

## WALK-EDIT-01 + TOOLS-01 — walk while furnishing; one tool rail (Claude, owner requests 2026-11-05)

- WALK-EDIT-01: the editor's 3D view (3D / Dividida) now offers "Passeio". While walking, a press on furniture grabs
  it (new `Viewer3D.walkGrab/walkDrag/walkDrop`, `WalkCamera` option `furnish`), so pieces (guitars on the wall…)
  are placed and checked at eye height; the 3D bar keeps size, height (↕), rotate, fix, delete; Ctrl+Z undoes.
  Fidelity: render3d, startWalk, WalkCamera.bind recorded as extensions. Unit test in walk.test.ts.
- TOOLS-01: the "Ferramentas" menu is gone. Left rail = every tool (added Divisão, Abertura no piso, Telhado,
  Piscina; Definições at its foot opens the original settings menu); shapes/kinds of the tool in use (room
  rectangle/free, outdoor kinds and shape, pool shapes/pipe) show as chips where the menu was; "Vista de parede" and
  "Planta inteira" sit next to 2D/3D/Dividida ("3D ao lado" = Dividida). Phones: the dock's "Ferramentas" opens the
  same rail as a sheet. Original renderToolBar unchanged (kept, unused). Editor browser test uses the rail.
- Tests: npm test, typecheck, validate, contract, browser suites, pytest 149; disposable HA: walk + grab + drag +
  undo, rail/choices/settings dialog/whole plan, phone sheet; icons fixed size. Not on the owner's HA.
- Owner approved publishing on 2026-11-05 ("Sim, pode publicar").


## Claude batch — 2026-11-06: cards, themes, Cinema pages, AUREON Música

Owner requests (06.11): edit/move/add/remove cards incl. native HA and HACS cards; switch themes; Spotify Plus +
Spotcast inside AUREON. Owner chose: SpotifyPlus + Spotcast copied whole, as a second package "AUREON Música"
(HACS allows one integration per repository); Cinema design first; publish everything together after approval.

Dashboard (floor-studio/dashboard/platform):
- CARDS-01: `native-card.mjs` (HA card helpers; picker = built-in Lovelace cards + `window.customCards` from HACS;
  each card's own visual editor + JSON code; preview), `card-layout.mjs` (drag ⠿ with `placeLayout`, delete added
  cards), `layer.mjs` (overlays on document.body: page containers trap position:fixed and HA pickers open on body).
  Card configs are validated plain JSON (`cleanCardConfig`: type pattern, 20 KB, depth 24, no prototype keys).
  Editing state survives a page rebuild (registry reload / reconnect).
- PREF-SYNC-01: preferences (cards, theme, look) also stored per HA user via `frontend/set_user_data`
  key `aureon_preferences` (newest wins) — same layout on phone, tablet and iSG. Not a service call.
- THEME-01: quick "Tema" panel on every page: AUREON palettes (+ new **Grafite Cinema**), "use Home Assistant
  theme" (incl. HACS themes, = appearance auto), own accent colour (`accent`, applied on top of any theme).
- LOOK-01: preference `look` cinema|classic (default cinema). Cinema: `home-cinema.mjs` (greeting, HA scenes,
  people, waste, illustrated tiles for lights/windows/blinds/robot/energy/security, windows sheet, cameras,
  mini player, rooms), `rooms-cinema.mjs` (room photo, light/climate/blinds), `security-cinema.mjs` (shield, alarm
  modes via existing confirmation + code, locks, motion, hazards, real recent events), `energy-cinema.mjs` (power
  gauge, recorder statistics bars, power sensors per device/room). Classic views stay below (details) and the
  classic start page with the 3D plan is one setting away. Mídia page unchanged (existing full player).
- Fix: scenes/scripts never run (state `unknown`) can now be activated (still confirmed).
- Music controller: uses `aureon_music` services when AUREON Música is installed, originals otherwise.

AUREON Música (new local repo /home/claude/aureon-music, not yet on GitHub): `custom_components/aureon_music`
= SpotifyPlus 1.0.225 (MIT) + Spotcast 6.6.5 (Mincka, Apache-2.0) generated by `scripts/build_from_upstream.py`;
menu config flow switches into the original flow; per-kind dispatch of setup/platforms; own hass.data keys.

Validation actually run: npm test (192 + 536), typecheck, validate, migration contract, all six browser tests
(platform test now also checks the Cinema start page). Disposable HA 2026.2.3: card picker incl. a synthetic
HACS card, HA tile editor + entity picker visible, save, drag, delete; theme switch + accent + cross-device sync via
user data; Cinema home/rooms/security/energy screenshots desktop + phone; AUREON Música: 121 modules import,
both flows reach Spotify authorize URL, fake entries run into network/auth errors (setup_retry / reauth flow) as
the originals would. NOT tested: real Spotify login/playback, owner HA, iSG hardware.

Next: owner approval → create GitHub repo thaianyboas/aureon-music, push dashboard, owner installs AUREON Música,
logs in once, checks playback, then removes originals. Then Mídia in the Cinema look.

## Claude batch — 2026-11-06 (afternoon): Settings, Labels, rooms (owner approved publication)

- SETTINGS-01 `settings-cinema.mjs`: Cinema Settings (category cards with current value; Aparência = look, theme
  gallery, HA theme, accent, density, start-page widgets; Cartões per page; Música status of aureon_music /
  spotifyplus / spotcast + start player; Labels). Quick "Tema" button removed from page bars (theme lives in
  Settings). Existing detail panels kept.
- LABELS-01: owner Label rules reinstated by request: `labelVisibility.include/exclude` + `labelKinds[kind]`
  (validated label ids); applied in controller `reindex` with the equipment kind; music players follow the same rows.
  Tests updated to the requested behaviour (the old "labels retired" tests encoded the previous decision).
- HOME: weather hero with animated condition art and `weather/subscribe_forecast` (read-only subscription), colour
  person photos, less empty space. ROOMS: Dispositivos folded into Cômodos in the Cinema look (nav without Geräte;
  every room lists all its equipment as compact rows, 8 per kind + "show all"; virtual "Sem cômodo"); drawn room art
  fallback; new presets pool/office/hobby (Pexels 261102, 667838, 4050318, graded; see assets/PHOTOS.md).
  Back-to-top button on every page (listens to the AUREON main scroller).
- AUREON Música pushed to thaianyboas/aureon-music (owner created the repo).
Validation: npm test, typecheck, validate, migration contract, platform browser test (Cinema check), disposable HA
screenshots desktop/phone; label filtering 124 → 15 rows with show_dboard. Not tested on the owner's HA/iSG.

## Claude batch 2026-11-06 — start page 3D without changing the design; neutral music names

- HOME3D-01: new preference `home3d` (boolean). The 3D plan (`aureon-home-plan`) now sits inside the Cinema start
  page (`.cine-plan`) instead of switching every page to the classic look. Settings › Aparência offers
  "Cartões ao vivo" / "Com a planta 3D"; the look switch is gone from the UI. A stored `look:'classic'` without
  `home3d` migrates to `look:'cinema', home3d:true` (owner could not get back). `look:'classic'` stays valid for
  the browser test of the classic pages. Phone framing of the start plan tightened (`frame` .78 when taller than wide).
- MUSIC-NAMES: owner does not want the upstream project names in the UI. Dashboard Settings › Música shows
  "Conta do Spotify (Spotify Web API)" and "Caixas Cast / Alexa (Spotify Connect)"; music texts say AUREON Música.
  aureon-music (local commit, not pushed): config-flow menu, translations and device/entity names neutral; the
  builder applies it (`neutral_names`), credits stay in NOTICE.md.
- NeonPlan check: our fork is based on NeonPlan 2.0.7; official 3.0.1 adds 2.0.8–3.0.1 (several plans/property,
  room cards, card templates, room vacuum/everything off, show-if furniture, floor-plan-only, gates, sliding doors,
  pins only while active, camera pop-up, walk from a room, HA 2026.11 channel-room fix, light-through-wall fixes).
  Not ported yet — waiting for owner approval.
Validation: npm test (193+536), typecheck, validate, migration contract, platform browser test, disposable HA
screenshots (start page with 3D desk/phone, Settings appearance and music). Not tested on the owner's HA.

## Claude batch 2026-11-06 (2) — AUREON Floor Studio on NeonPlan 3.0.1

- NP-3.0.1: three-way merge (base 2.0.7 ZIP, AUREON fork, official 3.0.1 ZIP from the owner) after normalising the
  fork's mechanical renames (ws types `aureon_floor/…`, `custom_components.aureon_floor`, `/aureon_floor_static`).
  New: several floor plans + property (site), room-only cards and card templates, room bar, vacuum / everything off
  per room, "only show while …" furniture, floor-plan-only, gates in fences, sliding doors, top-hung windows, pins only
  while active, camera pop-up, walk from a room, duplicate floor, winter pack code, announcements service, open
  screens, HA 2026.11 channel/room fix and all light fixes. Manifest version 3.0.1.
- Kept AUREON: own domain/stores, bindings with revision lock (now per plan, `PlanData`), load deadlines/epochs,
  Ajustes sheet, pets, Real look, own models, paints, no shop/supporter/print/newsletter/gift UI, no Halloween.
- Storage: further plans of a NeonPlan 3.x install (`neonplan3d.plans`, `.building.<id>`, `.history.<id>`) are taken
  over once like the main plan; earlier stores never changed (pytest). Migration contract refined: no removal in the
  take-over code; the only store removal is AUREON's own plan bin after 30 days (upstream behaviour).
- Fidelity guards re-baselined to the 3.0.1 ZIP with the existing scripts (same strictness).
- Portuguese texts added for the new plan/site/room-card keys.
- The owner's 22 bought .fp3dpack files verified with our code: valid for her installation, refused (wrong_instance)
  on the test HA. They are NOT in any repository.
Validation: frontend 622 tests, backend 180 pytest, root 193, typecheck, build budgets, fidelity, migration contract,
validate, browser tests floor/editor/contour/loading/platform/music, disposable HA 2026.2.3 (Floor Studio panel, plan
picker, plans/property settings, card templates). Not tested on the owner's HA.

## Claude batch 2026-11-06 (3) — Floor Studio panel follows the AUREON look

- THEME-FLOOR: the dashboard publishes the resolved editor tokens (--aureon-ui-*, from theme/palette/accent or the
  HA theme) to HA frontend user data `aureon_floor_theme` (frontend/set_user_data, debounced, only on change; retries
  until styled). The standalone sidebar panel subscribes (`frontend/subscribe_user_data`, fallback get) and applies
  only validated colour tokens (aureon-theme-sync.ts + test). Embedded mode unchanged.
- Plan manager / site editor draw again once the editor bundle has its language file (were English first).
- Shared files: aureon-dashboard.js (_floorTheme/_floorTokens/_publishFloorTheme), panel.ts (syncTheme).
- RAIL-02 (owner): refined desktop rail — quieter 38px items, gold marker on the open page, hairline groups
  (house / assistant+agenda+automations+Floor Studio / settings), "Floor Studio" short label, hidden scrollbar,
  smaller logo and footer. Phones unchanged (bottom bar).
- ROOMS-HERO: no empty band above the room title (page no longer stretched to window height).
- ROOM-PHOTOS: presets re-encoded from the 1672×941 design originals (q90) and pool/office/hobby re-cut at
  2560×1440 from the Pexels photos with the earlier grade (assets/PHOTOS.md).

## Claude batch 2026-11-09 — Cômodos as pages, Calendar, Music provider, settings scroll, waste names

- ROOMS-PAGES (owner): Cômodos opens on an overview of large room photo cards; tapping one opens that room as its
  own page (hero, controls, equipment) with a "‹ Cômodos" back pill. The room strip is gone. Home tiles open the
  room directly (`_roomOpenNext`); the rail/"more" entry for Räume returns to the overview (`_roomDetail=false`).
- CALENDAR-CINEMA (owner): new platform/calendar-cinema.mjs for the Cinema look — date hero, "Up next" card,
  period segments (7/14/30/90), per-calendar colour chips (filter), agenda grouped by day (multi-day all-day events
  on each day), month overview with event dots (jumps to the day), waste widget aside. Events load automatically on
  open (read-only GET /api/calendars). Classic look keeps the old page. Shell header hidden for 'Agenda' in Cinema.
- loadCalendars now starts 24 h back so today's pickups/events that already began still show (past days dropped).
- WASTE-NAMES (owner): wasteName() drops the generic word ("Abfuhr blaue Papiertonne" → "Blaue Papiertonne",
  also Abholung/Leerung/Collection/Coleta); colours still match. Test added.
- MUSIC-PROVIDER (owner): the "Integração: Home Assistant/Spotify" select is removed. Spotify is detected from the
  entity (platform spotifyplus or sp_user_id, which covers aureon_music); a stored 'native' choice no longer hides it
  (music-controller test updated to this contract). Spotify accounts are listed first with "· Spotify"; a status
  line says connected / choose your Spotify account / add AUREON Música. (Old select only enabled Spotify when the
  `spotifyplus` domain existed, so aureon_music users could not pick it.)
- SETTINGS (owner): theme gallery in Settings no longer traps the mouse wheel (overflow/overscroll contain on a
  non-scrolling box); smaller theme cards (auto-fill 190px) and start-page choice art (max 150px); back button says
  "‹ Voltar/Back/Zurück" (new key `back`).
Validation: root 194 tests, typecheck, validate, test:browser (all suites pass), disposable HA screenshots (rooms
overview/page, calendar desk+phone, appearance wheel scroll probe, music settings). Not tested on the owner's HA.

## Claude batch 2026-11-09 (2) — sharp HA area pictures, "Voltar", waste names in the calendar

- ROOM-PHOTO-SHARP (owner): HA area pictures (and own uploads) are `/api/image/serve/<id>/512x512` thumbnails; the
  room hero stretched them to ~1000 px and they looked blurry. `fullImage()` (page.mjs) now asks for
  `/api/image/serve/<id>/original`. Verified on the disposable HA with an uploaded 1672×941 picture.
- Room page back pill reads "‹ Voltar" (key `back`).
- Calendar Cinema: events from the selected waste calendars use wasteName() too ("Abfuhr …" dropped).
Validation: root 194 tests, typecheck, validate, test:browser, disposable HA screenshot. Not tested on the owner's HA.

## Claude batch 2026-11-09 (3) — Floor Studio: living sky and garden (not published yet)

- OUTDOOR (owner): new frontend/src/viewer/aureon-outdoor.ts (+test). In the Day and Real looks of the Floor Studio
  panel: a real sky photo (8 CC0 Poly Haven skies, ~0.9 MB, only the one in use loads) picked by sun height and HA
  weather (pickSky), turned so its sun stands at the real sun (skyTurn), blended in ~2 s; a drawn clear night with
  three star layers, a faint milky way and a moon; lawn to the horizon fading into the sky's horizon colour (wet/snow
  tint), light stone base, shrub row with a gap at the hall side, a few trees (sprites of CC0 models, crossed quads:
  a handful of draw calls). Sun arc hidden there unless `aureon_sun_arc`; setting `aureon_outdoor` garden|sky|off
  (schema + view settings select, pt/en/de). Path tracer off under the sky.
- Framing: house view under the sky fits the whole plan from a lower angle (phi 1.3) into the lower part of the
  picture with a shift lens (setViewOffset) so the sky shows above; rooms/floors/walk unchanged. The dashboard's
  embedded presentation (frameScale ≠ 1) is unchanged (mode off).
- Assets in custom_components/aureon_floor/frontend/images/aureon-sky, aureon-nature (credits file there).
Validation: frontend 628 tests, typecheck, build budgets, backend 180 pytest, fidelity re-audit, repo tests 194,
validate, migration contract, test:browser, disposable HA screenshots (day/sunset/night/rain, walk). Not on owner's HA.

## Claude batch 2026-11-09 (4) — Floor Studio: arrange in 3D, swap, column (not published yet)

- ARRANGE (owner): "✎ Arrumar" chip in the 3D view (admins only, not during time travel) turns on the existing furnish
  mode (drag to move, turn ±45°, size, mount height, mirror, delete). New in its bar: "Trocar por …" (swap for any
  built-in kind or installed pack item; keeps place and direction, takes the new kind's size) and "Abrir no editor"
  (editor with that piece selected).
- COLUMN (owner): new furniture type `column` (0.3×0.3×2.6 m, plain, wall-coloured; Real look "architecture"); in the
  work group, the wall view's tall items and the library (deco). pt/en/de names.
Validation: frontend 628, typecheck, build budgets, backend 180, fidelity re-audit, repo tests, validate, test:browser,
disposable HA screenshot (arrange bar with a test column; test item removed again). Not on owner's HA.

## Claude batch 2026-11-10 — sharper room photos

- ROOM-PHOTOS (owner): the nine design-package room pictures (1672×941, soft when stretched over the room hero) are
  upscaled with Real-ESRGAN x2plus to 2560×1440 (same elegant style; the owner rejected Pexels replacements as not
  elegant). Pool, office, hobby were already 2560×1440. Validation: root tests, validate, disposable HA room page.
