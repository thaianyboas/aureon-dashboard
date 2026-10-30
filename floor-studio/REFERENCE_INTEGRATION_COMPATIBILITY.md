# AUREON — integration reference compatibility review

**Source:** the user-provided ZIP archives catalogued in [AUREON ZIP ANALYSIS](AUREON_ZIP_ANALYSIS.md). Versions and requirements below are **as packaged in those ZIPs**, not live installed Home Assistant versions.

| Reference | HA domain in its manifest | Version in archive | Config flow | Key implications |
| --- | --- | --- | --- | --- |
| Dreame Vacuum | `dreame_vacuum` | `v2.0.2` | yes | Depends on HA HTTP; third-party Python libraries; AUREON should consume existing HA vacuum entities rather than bundle this integration |
| Waste Collection Schedule | `waste_collection_schedule` | `2.36.0` | yes | No HA manifest dependencies; includes many parsing/network libraries; use its resulting HA calendar/sensor entities, not embedded source |
| SpotifyPlus | `spotifyplus` | `1.0.225` | yes | Requires application_credentials and zeroconf; media controls should use HA services/entities exposed by the installed integration |
| Spotcast | `spotcast` | `6.6.5` | yes | Depends on Spotify, Cast and application_credentials; treat as an optional service integration, not a hard dependency |

## Architecture decision

AUREON is a frontend/dashboard and a dedicated NeonPlan3D backend distribution. It must **not** vendor Dreame, Waste Collection Schedule, SpotifyPlus, Spotcast, Bubble Card, or Simon42 into its Python backend. These are independent HA/HACS integrations or UI references and can be optional providers. Implement capability detection via HA entities/services, feature availability states and explicit user configuration.

For example:
- Vacuum: detect available `vacuum.*` entities and check supported commands/capabilities before offering controls; map availability must be explicitly supported, not assumed from all vacuum integrations.
- Waste: configure a calendar/sensor source rather than scraping municipal websites from the dashboard.
- Media: use supported HA media_player and integration-specific services when present; do not assume SpotifyPlus or Spotcast is installed.
- UI: write original AUREON components and respect third-party licenses. Simon42 is a visual reference, not a code source to copy.

## Safety

No integration installation, authentication, network connectivity, live HA entity discovery or runtime interoperability has been tested. This is a static archive/manifest review only. Do not copy credentials, apartment layouts, paid packs or third-party integration source into public AUREON repositories.
