# AUREON development rules

- Home Assistant is the primary platform; install and update frontend through HACS.
- Preserve existing features and compatibility; inspect dependencies before modifying.
- Never put tokens, passwords, API keys, personal location or private Home Assistant data in the public repository.
- Never perform HA service calls without explicit user interaction and proper permissions.
- Use native HA registries and hass data rather than guessing entity IDs.
- Respect HA locale and theme as functionality is added.
- Do not modify Simon42 or legacy ControlRoom repositories.
- Release workflow is GitHub master -> HACS update -> Home Assistant visual test. No DEV branches or releases by default.
- Provide full replacement files and beginner-friendly steps.
- Test JS syntax, build, and behavior before pushing; do not claim a HA test without running one.
