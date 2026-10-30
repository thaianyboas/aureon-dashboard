"""Local pack binding and removal of remote commerce endpoints."""

from __future__ import annotations

import base64
import json

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.neonplan3d import license as lic
from custom_components.neonplan3d import packs
from custom_components.neonplan3d.const import DOMAIN

PAYLOAD = {
    "format": "fp3dpack",
    "version": 1,
    "id": "shop.living",
    "name": "Wohnzimmer",
    "publisher": "Shop",
    "items": [
        {
            "id": "cube",
            "name": {"de": "Würfel", "en": "Cube"},
            "size": [0.5, 0.5, 0.5],
            "parts": [{"shape": "box", "x": 0, "z": 0, "w": 1, "d": 1, "y": 0, "h": 1, "color": "body"}],
        }
    ],
}


def _key() -> tuple[Ed25519PrivateKey, dict[str, str]]:
    private = Ed25519PrivateKey.generate()
    raw = private.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return private, {packs.key_id(raw): base64.b64encode(raw).decode()}


def _sign(private: Ed25519PrivateKey, keys: dict[str, str], payload: dict) -> str:
    sig = base64.b64encode(private.sign(packs.canonical(payload))).decode()
    return json.dumps({"payload": payload, "signature": {"key": next(iter(keys)), "sig": sig}})


def test_bound_packs_are_only_accepted_by_their_installation() -> None:
    private, keys = _key()
    fp = packs.fingerprint("some-instance-id")
    assert len(fp) == 16
    bound = _sign(private, keys, {**PAYLOAD, "instance": fp, "release": 3})
    assert packs.verify_pack(bound, keys, instance=fp)["release"] == 3
    # no binding check without an instance (tools), refused on another installation
    assert packs.verify_pack(bound, keys)["instance"] == fp
    with pytest.raises(packs.PackError) as err:
        packs.verify_pack(bound, keys, instance=packs.fingerprint("other"))
    assert err.value.code == "wrong_instance"
    # an unbound pack is fine anywhere, and defaults to release 1
    free = packs.verify_pack(_sign(private, keys, PAYLOAD), keys, instance=fp)
    assert free["instance"] is None and free["release"] == 1


async def _setup(hass: HomeAssistant) -> None:
    await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


async def test_a_pack_bound_elsewhere_is_refused_on_import(hass: HomeAssistant, hass_ws_client, monkeypatch) -> None:
    private, keys = _key()
    monkeypatch.setattr(packs, "PACK_PUBLIC_KEYS", keys)
    await _setup(hass)
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {
            "type": "neonplan3d/packs/import",
            "pack": _sign(private, keys, {**PAYLOAD, "instance": packs.fingerprint("x")}),
        }
    )
    result = await client.receive_json()
    assert not result["success"] and result["error"]["code"] == "wrong_instance"


async def test_commerce_routes_are_not_registered(hass: HomeAssistant, hass_ws_client) -> None:
    await _setup(hass)
    client = await hass_ws_client(hass)
    for index, route in enumerate(("license/get", "license/activate", "license/refresh", "license/remove", "packs/install"), 1):
        await client.send_json({"id": index, "type": "neonplan3d/" + route})
        response = await client.receive_json()
        assert response["success"] is False
        assert response["error"]["code"] == "unknown_command"
