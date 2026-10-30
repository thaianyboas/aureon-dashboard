# Floor Studio development validation — 2026-10-30

Status: source and candidate packaging verified; **not ready for a HACS update**. Stable dashboard v0.28.0 remains unchanged. No Home Assistant instance was installed, updated or used for runtime acceptance.

## Changes

- Removed commerce UI code, catalog/offers/newsletter/supporter flows, sign-up and purchase links, promotional editor cards, frontend commerce requests and backend commerce websocket commands.
- Removed remote activation, catalog/download and background license-refresh implementation. The remaining `license.py` provides installation identity for local signed packs and the user agent for opt-in diagnostics only.
- Preserved local imports, backup restoration, signature checking, installation binding, module code review and explicit approval. No existing storage keys or private resource stores are rewritten. Existing licensed resources remain subject to their original license and installation restrictions; no entitlement bypass was added.
- Retained the original model import formats (including GLB/glTF, OBJ and STL), five visual modes and four AUREON modules. Removed purchase instructions from visible unavailable-feature/import text.
- Regenerated frontend bundles from source and restored CI failure on nonreproducible committed bundles.
- Candidate packages exclude Python bytecode/caches, include the upstream MIT license, source commit provenance and file checksums, and explicitly record `installation_approved: false`. Packaging rejects stale build evidence.
- The separate integration repository builds the exact source revision in `SOURCE_COMMIT`; it does not publish an installable intermediate integration.

## Local checks

| Check | Result |
| --- | --- |
| JavaScript and TypeScript unit/regression tests | 638 passed (131 AUREON/module tests + 507 upstream/frontend tests) |
| Python backend unit/integration-fixture tests | 121 passed on Python 3.13; isolated mocks, not runtime acceptance |
| Publication gate regression tests | 10 passed, both before and after a local build |
| TypeScript and frontend build | Passed, all bundle budgets respected |
| HACS stable metadata/checksum and public distribution scan | Passed |
| Separate integration layout, 79 file checksums, upstream license and removed commerce routes | Passed |
| Integration identity, storage keys and legacy migration contract | Passed |
| Home Assistant runtime readiness | Blocked as expected; no evidence fabricated |

Two existing frontend tests now explicitly use UTC for UTC-based fixtures. The missing-build-marker test runs in an isolated temporary directory; release-gate tests remain blocked by missing runtime evidence even after a successful build. Obsolete remote-commerce tests were replaced with tests proving commerce commands are unknown, while retaining pack-binding/refusal coverage.

## Remaining work and limits

1. Final visual acceptance of the editor, all five modes and four modules has not been performed. Real remains procedural shading, not a complete PBR material implementation. Existing mode/shader tests are code-level checks, not a visual sign-off.
2. Final Home Assistant acceptance remains pending: integration load, editor authorization, persistence, live devices, all modules, five modes, migration and rollback. Per user instruction, do not install or test intermediate versions.
3. The separate integration repository remains a candidate builder, with no `custom_components` distribution on the branch. HACS installation/update behavior has not been validated. Do not update the stable dashboard or recommend installation yet.
4. Private paid packs and the personal apartment are not present in public source or candidate assets. Compatibility checks preserve signature and installation restrictions; this session did not load or test the user's private assets.

GitHub Actions results must be checked against the exact published commits; local success alone does not establish remote CI success.
