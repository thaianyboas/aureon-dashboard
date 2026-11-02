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
