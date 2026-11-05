# AUREON Floor Studio distribution

Confirmed by the user on 2026-10-30:

- `thaianyboas/aureon-dashboard/master` is the authoritative source and existing HACS Dashboard repository. Update 2026-10-31 (owner): `dist/` may carry the current build for testing in the owner's own Home Assistant (0.29.0-test.1); v0.28.0 is kept in `rollback/v0.28.0/`. This is not final acceptance.
- `thaianyboas/aureon-integration/master` builds the separate Home Assistant integration candidate from the exact dashboard commit in `SOURCE_COMMIT`. Update 2026-10-31 (owner): the generated integration package (`custom_components/aureon_floor` since SEP-01) is published there for the owner's test installation through HACS; nothing is installed automatically.
- The temporary `thaianyboas/neonplan3d` fork is not a distribution destination. Production Home Assistant is not changed by these source publications.

Since SEP-01 (owner decision 2026-11-05) the integration has its own domain `aureon_floor` (folder, stores, `/aureon_floor_static`, panel `/aureon-floor-studio`) and copies the `neonplan3d.*` stores once; see `NEONPLAN_MIGRATION_AND_ROLLBACK.md`. Browser element names stay NeonPlan's, so the official integration should not be installed next to it. Storage compatibility checks are not runtime migration or rollback acceptance.

The public candidate contains free upstream source and the supplied AUREON modules. There is no commerce connection. Existing valid local licensed packs retain signature and installation restrictions. Personal apartment data, private license keys and paid packs are not redistributed.

## Remaining blockers

1. Final editor, five-mode and four-module visual/function acceptance. Real now has a physical-material renderer; final visual, imported-asset and device acceptance remains pending.
2. Final Home Assistant runtime validation, migration and rollback. Do not install or test intermediate versions.
3. HACS integration installation/update validation and final promotion after acceptance. An Actions artifact alone is not an installed HACS distribution.

See `SESSION_VALIDATION_2026-10-30.md` and `HA_ACCEPTANCE_CHECKLIST.md`. No runtime evidence or installation approval may be inferred from a passing build.

Atualização de fidelidade: `NEONPLAN_FIDELITY_AUDIT.md` documenta a restauração das APIs oficiais privadas de licença, sem loja pública ou atualização comercial automática. As verificações de assinatura/instância permanecem intactas.
