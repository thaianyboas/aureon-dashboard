"""Local installation identity for signed packs and opt-in diagnostics.

No catalog, purchase, activation, download or remote license refresh is provided.
Previously stored resources are not modified; import still verifies signatures and binding.
"""
from __future__ import annotations
from homeassistant.core import HomeAssistant
from homeassistant.helpers import instance_id
from homeassistant.loader import async_get_integration
from .const import DOMAIN
from .packs import fingerprint

RETRY_WAITS = (5.0, 15.0)
_user_agent: str | None = None
_version = "dev"


async def async_instance_fingerprint(hass: HomeAssistant) -> str:
    """This installation's fingerprint: what a bound pack carries."""
    return fingerprint(await instance_id.async_get(hass))


async def _user_agent_of(hass: HomeAssistant) -> str:
    """User-Agent for optional diagnostics; no licensing or commerce requests."""
    global _user_agent, _version
    if _user_agent is None:
        try:
            version = (await async_get_integration(hass, DOMAIN)).version
        except Exception:
            version = None
        _version = str(version) if version else "dev"
        _user_agent = f"NeonPlan3D/{_version} (Home Assistant; +https://github.com/Mastershort/neonplan3d)"
    return _user_agent


async def user_agent(hass: HomeAssistant) -> str:
    """The User-Agent used by opt-in diagnostics."""
    return await _user_agent_of(hass)
