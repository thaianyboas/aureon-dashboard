# AUREON Dashboard v0.2

Home Assistant custom dashboard strategy foundation. Includes a Community-Dashboards strategy registration and a panel-view preview card.

## Installation

Install through HACS as a Dashboard custom repository. Update HACS after pushing changes to master. Create a new dashboard via Settings > Dashboards > Add dashboard > Community-Dashboards > AUREON Dashboard.

## Status

The UI is a preview. No device control, 3D floor map, JARVIS backend, or Spotify integration is active yet. This code does not send external requests or Home Assistant service calls.

## Credits

The strategy registration approach was studied from Simon42 Dashboard Strategy. This implementation is independently written and does not copy its source code.


## v0.3 — Design System Foundation

22 paletas visuais de referência, CSS custom properties `--au-*`, contraste automático para texto, seleção em Einstellungen, modo Auto seguindo `hass.themes.darkMode`. Preferências temporariamente locais ao navegador. Ainda não integra temas com Music Card/NeonPlan, nem sincroniza seleção entre usuários/dispositivos.
