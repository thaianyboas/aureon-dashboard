# Startseite and shared Medien continuation — 2026-10-31

Source candidate only. Stable v0.28.0 remains frozen. No intermediate Home Assistant installation, release or development branch. Final visual approval is pending.

## Implemented in this continuation

- Startseite composition: dominant original native interactive Floor Studio card; five presentation modes; narrow existing icon navigation; right room/device/weather/security/energy/waste panel; real HA persons and associated phone batteries underneath. No synthetic plan, photo or private person is a product default.
- `AureonHomePlan` loads the registered native card and its existing backend plan. It handles absent native resources, disconnect and account/connection changes. `NeonPlan3dCard.setViewOptions` updates height/theme without calling the original `setConfig` again, preserving floor selection and native view. No original editor/render method is replaced or simplified.
- Internal route navigation preserves the dashboard shell and shared music controller. It neither reloads the document nor issues a playback/transfer request. Entity/account/destination are HA-owned and remain selected.
- Secondary Compact player: actual cover/title/artist/state/destination; previous, play/pause, next and volume according to capabilities. Cover/title/expand open Medien in player view. Irrelevant idle/off/unavailable media hides Compact. Full browsing/search/categories/favorites/library/devices remain the existing implementation.
- Existing 22 palette tokens remain authoritative. No fixed gold palette, reference artwork, artist image or branded architectural asset is redistributed.

## Evidence and explicit limits

`npm test`, `npm run validate`, `npm run build` and `npm run test:browser` are required before publication. Browser fixtures use native model constructors and compiled native card/renderer, synthetic HA state/services and no actual HA installation. Checks assert one native card/view and unchanged floor selection across all five looks, shared controller/selected entity and stable shell without playback calls across navigation, idle hiding, and responsive pages at 1440/820/390.

The existing fidelity gate still protects 2,156 original named methods/handlers and 23 critical geometry/model/import/license files. The newly added presentation method is an extension. It does not prove every advanced original workflow or licensed extension works in production.

Captures show a synthetic, deliberately generic three-room apartment. Its furniture/materials are original native free models, not a photorealistic reference replica. Actual HA person photos/provider artwork are shown only when supplied by HA. Fixture initials and synthetic artwork are explicitly test data.

## Reference comparison: NOT visually approved

| Requirement | Current evidence | Remaining work |
| --- | --- | --- |
| Central interactive isometric plan | Actual original native card and WebGL renderer | Richer Real/PBR material authoring, lighting/fidelity and user acceptance |
| Narrow left navigation | Existing own SVG icon rail retained | Final touch/contrast/composition review |
| Premium right room cards | Actual area/device controls and status summaries | Premium images, crop configuration, room selection and final finishing |
| People at bottom | HA person and device battery discovery retained | Greeting avatar and final photograph/location presentation |
| Secondary Mini / Full continuity | Browser checks of shared controller, destination and route shell | Live provider/device acceptance and reference-level visual finishing |
| Room image system | Not implemented in this continuation | Seven redistribution-cleared original presets; private user uploads; real native room capture; crop/source configuration; all-theme screenshot coverage |

Do not mark development A complete or production B validated. Module configuration, calibrated tracking presentation, native notification scheduling, broader original editor regression coverage, imported PBR asset fidelity and accessibility/performance review remain on the roadmap. The room image system must distinguish presets from actual plan-derived thumbnails and must not include paid packs, reference screenshots, private uploaded images or personal plans in public distribution.

## Local verification result

- 712 JavaScript/TypeScript tests passed (197 dashboard/module/contract, 515 native frontend).
- Stable checksum/privacy/license/module validation, typecheck and build passed.
- Full browser regression passed: 22 music + 25 platform + 9 renderer + 8 editor checks (64 total). Final CSS adjustments are rerun in the music/platform suites.
- Original ZIP and candidate rerun produced all ten side-by-side comparisons with matching visible controls; editor drawing creates the same third room in both.
- Separate integration candidate layout/hash check passed for 80 files. No installation acceptance is implied.
