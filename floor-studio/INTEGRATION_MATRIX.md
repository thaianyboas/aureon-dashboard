# AUREON integration matrix — verified source review, 2026-10-30

Historical catalogue recovered from commit **057c515dcace73453143783d407652a1c858c6d9**, tree entry `floor-studio/AUREON_ZIP_ANALYSIS.md`. It is still present on master and has not been overwritten. The ninth project is **SpotifyPlus Card**, distinct from SpotifyPlus and Spotcast. All nine original archives were recovered locally; all SHA-256 prefixes match the historical catalogue. Full digests, archive CRC checks and member counts are in `ZIP_INVENTORY_VERIFIED.json`. Archives and reference images are not redistributed here.

Review scope: complete archive integrity/member inventory; root license texts, manifests/packages, primary README documentation and relevant architecture/service/state interfaces were read. This is **not** a claim to have line-reviewed every third-party implementation, installed any of these projects, or run their complete test suites. Source tests and AUREON adapter/browser checks are distinguished below.

| Project / supplied version | Code available | License verified | Already integrated | Remaining functionality | Tests / limits |
| --- | --- | --- | --- | --- | --- |
| NeonPlan3D 2.0.7 | Full ZIP, 615 members; source vendored in Floor Studio | MIT, Mastershort; free source only | Engine/editor; five looks; four supplied AUREON modules; signed local imports; commerce removed | Final editor/function/visual acceptance; Real/PBR; final HACS migration and rollback | Existing frontend/backend/module tests, build and migration-contract checks. No runtime acceptance |
| Simon42 strategy 1.4.2 | Full ZIP, inventory verified; text/code extracted for study | CC BY-NC-SA 4.0, root LICENSE | Independent AUREON areas/registry/control implementation already exists; no Simon code/assets copied in this work | Room popups, consistent page navigation, click-first configuration, energy/security/camera/calendar completion | Architecture and existing tests inspected as reference; upstream suite not run |
| JARVIS 0.0.0 | Full ZIP, 75 members | MIT, Aditya Dewaskar | No bridge, paid account dependency or JARVIS code incorporated | AUREON-owned optional voice/conversation adapter; native HA conversation; contextual controls; explicit sensitive-action confirmations | Server permission gate and architecture reviewed; no bridge started and no Claude session connected |
| Bubble Card v3.4.2 | Full ZIP, 543 members | MIT, Cloos | No Bubble Card backend or complete card embedded | Independent compact room/control/popup components and accessible touch interactions | Source/config/version reviewed; upstream suite not run |
| SpotifyPlus 1.0.225 | Full ZIP, 96 members | MIT, Todd Lucas | AUREON Music controller consumes published HA media_player capabilities and SpotifyPlus services | Live installed-service verification, account/device differences, paging/categories beyond first 20, final acceptance | New adapter tests cover exact account payloads, response wrappers, unsupported services, permission failures, stale responses and favorites |
| Spotcast 6.6.5 | Full ZIP, 585 members | Apache-2.0, root license | Explicit optional `spotcast.play_media` adapter using v6 `media_player` target and `spotify_uri` contract | Validate destination discovery and playback with configured v6 installation; older `start` API is not assumed | Optional-target payload and no automatic error fallback tested |
| Dreame Vacuum v2.0.2 | Full ZIP, 89 members | MIT, root license | No Dreame backend copied; core Floor Studio has its own vacuum behavior | AUREON vacuum status/control UI; calibrated cross-provider position adapter; room mapping, station/modes/alerts only from actual capabilities | Services/camera/map interfaces inspected; no robot connected and no tracking claimed |
| Waste Collection Schedule 2.36.0 | Full ZIP, 2,609 members | Root MIT, Steffen Zimmerman; separate archive license also inventoried; provider-specific material not blanket-cleared | No backend copied; existing Floor Studio household features are separate | Main dashboard widget: explicit calendar/sensor selection, today/tomorrow, next pickup, dates, notifications | Sensor attribute formats reviewed; no collection data or city configuration bundled |
| SpotifyPlus Card 1.0.77 | Full ZIP, 247 members | MIT, Todd Lucas | Service contracts studied; no complete card vendored | Optional browser/category/favorite parity beyond implemented subset; final visual/function acceptance | Original UI/service/types inspected; upstream suite not run |

## Per-project architecture and compatibility findings

### NeonPlan3D

Python `custom_components/neonplan3d` plus Lit/TypeScript/Three.js frontend; no Python requirements in the supplied manifest. Frontend uses locked npm dependencies, HA websocket storage/state and separately loaded engine/editor bundles. Current AUREON changes preserve domain, stores and binding checks, not storefront activation. No proprietary pack content is included. The source-built candidate remains separate from the stable HACS dashboard.

### Simon42

HA strategy with TypeScript/Lit, `js-yaml`, view/section generation and domain-oriented navigation; the archive includes area, overview, climate, security, CCTV, lights and other view tests. Study concepts, but implement AUREON UI independently. Its noncommercial/share-alike license is not treated as MIT and its photos/styles/code are not copied. Its very large archive contains visual resources; availability does not authorize reuse in AUREON's public distribution.

### JARVIS

React 19, Vite 8, Three.js/R3F and Zustand UI; Node >=20 bridge; Claude Agent SDK/Anthropic SDK; browser speech with optional ElevenLabs, Kokoro TTS, Porcupine wake word and MediaPipe vision packages. `bridge/server.mjs` gates built-in/shell/file/device writes with `JARVIS_ALLOW_WRITES=1`, uses SDK `permissionMode: 'default'` and a `canUseTool` decision. The browser/proxy and tool surfaces need separate security review; a global write flag is **not** an HA entity authorization model. A filler hint mentioning Home Assistant does not establish a working HA adapter. Its actual brain requires Claude Code login/subscription. Do not make it mandatory for AUREON basic operations. Start with native HA conversation/Assist capabilities, typed read queries, scoped entity controls and confirmation for sensitive commands; external LLM providers remain optional. No arbitrary shell bridge belongs in the public dashboard.

### Bubble Card

JS custom cards with Lit and YAML handling, compact buttons, subbuttons, popup/navigation and editor modules. Use native HA entity services and independent AUREON components instead of bundling the complete card. Main compatibility concerns: custom-element naming, theme variables, nested popup focus, touch controls, capability bits and update subscriptions. Its own configuration/editor system is not a requirement imposed on AUREON users.

### SpotifyPlus and SpotifyPlus Card

SpotifyPlus remains installed separately. It exposes `media_player` entities plus account-scoped `spotifyplus` services. The supplied manifest requires `spotifywebapipython`, OAuth/client libraries, numpy and SmartInspect; none are duplicated in AUREON. `services.yaml`, `__init__.py`, `media_player.py` and `const.py` establish the fields and state attributes. `sp_user_id`/registry metadata identify the integration; an entity name is not proof. `callService(..., undefined, undefined, true)` returns HA response data, whose SpotifyPlus payload uses `result`. Saved tracks/albums can wrap their objects; Connect devices use `Items`, `Id`, `Name`, `IsActiveDevice`. AUREON validates these formats and disables capabilities absent from the current account/entity/service registry. Spotify account/device limitations still apply.

### Spotcast

Supplied v6 code uses `spotcast.play_media`, with `media_player` target selector, required `spotify_uri`, optional account and data modifiers. Its manifest lists Spotipy/RapidFuzz. Do not assume older `spotcast.start` examples apply. AUREON does not install Spotcast, duplicate discovery or automatically retry a failed SpotifyPlus command via another device/account. Optional targets must be selected explicitly and still pass server permissions.

### Dreame

Python custom integration, with vacuum, camera/map and other HA entity surfaces; dependencies include numpy, crypto, python-miio, mini-racer and MQTT. `camera.py` exposes map proxy handling and renderer calibration metadata. Camera pixels or image calibration points alone do **not** establish a live robot position in Floor Studio coordinates. A future position provider must supply current position, coordinate units/map identity/timestamp and explicit map-to-floor calibration. No invented coordinates or forced dependency on Dreame. Standard vacuum controls can cover other brands when their capability flags support them. Cloud credentials and camera tokens remain local.

### Waste Collection Schedule

Python integration with provider modules/coordinator/aggregator, calendar and sensors. Source-specific dependencies include iCalendar, HTML/PDF parsers and HTTP tooling. `sensor.py` supports different `details_format` values: date-keyed attributes, collection-type-to-date attributes, or `types` plus `upcoming`; optional `daysTo` is not always present. Default sensor text may be templated. Therefore do not infer every numeric sensor or arbitrary calendar as household waste. Prefer verified integration metadata and allow explicit source/type mapping. Use HA timezone/calendar semantics for today/tomorrow and avoid 24-hour arithmetic across DST. No city, street, collection account or private calendar is a public default.

## ControlRoom Music Card reference

`thaianyboas/controlroom-music-card` was cloned **read-only**; its source player, device browser, service wrapper/types and root MIT license were inspected. The root notice attributes Todd Lucas (2019–2025). No writes, commits or publication were made to that repository. New AUREON controller/UI code is independently implemented; the official supplied image controls the Full layout, not the previous card's composition. Functional study includes floating navigation, explicit response handling, favorites, device choice and empty/error states. The fictional person/cover and commercial button are not used as defaults.

## Public/private and integration boundaries

Independent backends: SpotifyPlus, Spotcast, Dreame and Waste Collection Schedule. Optional absence never prevents the core dashboard from loading. No ZIP, private plan, paid pack, credential, license key or reference screenshot is copied into public code. Existing signed local resource imports and entitlement checks remain intact. No third-party installer or paid AI is added as a required AUREON dependency.
