# AUREON ZIP ANALYSIS — external reference inventory

Received 2026-10-30. This is a **catalogue of user-supplied upstream source archives**, not a copy of the archives or an assertion that their contents have been integrated.

The authoritative AUREON source remains in this repository. Avoid uploading full third-party archives (some are very large), paid content, private apartment plans, secrets, or duplicate vendored source. Revisit upstream code under its original license before copying any portion.

| User-supplied archive | Purpose for AUREON | SHA-256 prefix | Licensing observation |
| --- | --- | --- | --- |
| `homeassistantcomponent_spotifyplus-master(2).zip` | Spotify integration API reference | `c20082c93e800d01` | MIT |
| `spotcast-main(2).zip` | Spotify playback/casting integration reference | `090924033d826247` | Apache-2.0 |
| `spotifyplus_card-master(2).zip` | Music card UI/browse reference | `eb7463067c335a3a` | MIT |
| `Bubble-Card-main(2).zip` | HA frontend/card interaction reference | `efe4004229f0cf07` | MIT |
| `dreame-vacuum-master(2).zip` | Vacuum entity and map reference | `a37bcdad01b5a8aa` | MIT |
| `hacs_waste_collection_schedule-master(2).zip` | Waste pickup calendar integration reference | `da0b325020fd2009` | Root LICENSE begins with MIT License (copyright Steffen Zimmerman); verify any separately licensed bundled material before reuse |
| `jarvis-main(2).zip` | Agent architecture reference, not a verified HA integration | `326bc3ec58ca4ea3` | MIT |
| `simon42-dashboard-strategy-main(1).zip` | Dashboard design/interaction inspiration only | `8986ce5c716054e6` | CC BY-NC-SA 4.0: noncommercial/share-alike restrictions; do not copy into AUREON without review |
| `neonplan3d-main(2).zip` | Original 3D engine/editor reference | `917dfc2b78eb37d3` | MIT; preserve attribution |

## Working rules

1. Inspect and compare upstream reference implementations before planning any reuse; never assume an archive's features already exist in AUREON.
2. Prefer APIs, integration contracts, original AUREON implementations, and independently written UI over vendoring whole third-party projects.
3. Preserve third-party notices where licensed code is actually incorporated. Do not copy proprietary or paid packs.
4. This inventory intentionally contains **no** private Home Assistant settings, apartment floorplans, credentials, licensed assets or binary ZIP copies.
5. The user-provided ZIPs are session attachments, not guaranteed to be available in future sessions. This catalogue preserves names and fingerprints, **not their full source contents**. Future comparison may use the public upstream repositories or require a new attachment.
6. The integration distribution repository `thaianyboas/aureon-integration` should contain only release-ready generated integration files, not these analysis archives.

## Next comparison priorities

- NeonPlan3D original versus current AUREON Floor Studio candidate (compatibility and attribution)
- HA media/Spotify contracts versus AUREON music module
- Waste pickup and Dreame/vacuum entity behavior
- Bubble Card UI patterns and Simon42 visual inspiration (without restricted code reuse)
- JARVIS reference security and architectural relevance

No Home Assistant runtime tests are claimed.
