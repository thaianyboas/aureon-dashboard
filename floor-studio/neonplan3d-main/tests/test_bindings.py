"""Narrow association API, optimistic persistence and native format compatibility."""

from __future__ import annotations

import asyncio
import copy
from unittest.mock import AsyncMock

from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry
import pytest

from custom_components.neonplan3d.bindings import bind_plan
from custom_components.neonplan3d.const import DOMAIN
from custom_components.neonplan3d.storage import FloorplanData
from tests.test_init import BUILDING, _setup


def test_binding_preserves_geometry_and_original() -> None:
    original = copy.deepcopy(BUILDING)
    changed = bind_plan(original, "f1", "room", "r1", "area_id", "room")
    assert original == BUILDING
    assert changed["floors"][0]["rooms"][0]["points"] == BUILDING["floors"][0]["rooms"][0]["points"]
    assert changed["floors"][0]["rooms"][0]["area_id"] == "room"
    changed = bind_plan(changed, "f1", "room", "r1", "climate.temperature", "sensor.room")
    assert changed["floors"][0]["rooms"][0]["climate"]["temperature"] == "sensor.room"


@pytest.mark.parametrize(
    ("kind", "field", "value"),
    [
        ("room", "points", "sensor.room"),
        ("room", "climate.temperature", "light.room"),
        ("unknown", "entity", "light.room"),
        ("room", "climate.temperature", "javascript:bad"),
    ],
)
def test_invalid_binding(kind, field, value) -> None:
    with pytest.raises(ValueError):
        bind_plan(BUILDING, "f1", kind, "r1", field, value)


async def test_binding_ws_save_reload_remove_and_stale(hass: HomeAssistant, hass_ws_client) -> None:
    await _setup(hass)
    client = await hass_ws_client(hass)
    data = hass.data[DOMAIN]
    await data.async_save_building(copy.deepcopy(BUILDING))
    area = area_registry.async_get(hass).async_create("Synthetic area")
    command = {
        "type": "neonplan3d/building/bind",
        "revision": data.revision,
        "floor_id": "f1",
        "kind": "room",
        "target_id": "r1",
        "field": "area_id",
        "value": area.id,
    }
    await client.send_json_auto_id(command)
    assert (await client.receive_json())["success"]
    await client.send_json_auto_id(command)
    result = await client.receive_json()
    assert not result["success"] and result["error"]["code"] == "binding_conflict"
    restored = FloorplanData(hass)
    await restored.async_load()
    assert restored.building["floors"][0]["rooms"][0]["area_id"] == area.id
    assert restored.building["floors"][0]["rooms"][0]["points"] == BUILDING["floors"][0]["rooms"][0]["points"]
    await client.send_json_auto_id({**command, "revision": data.revision, "value": None})
    assert (await client.receive_json())["success"]
    assert data.building["floors"][0]["rooms"][0]["area_id"] is None
    await client.send_json_auto_id({**command, "revision": data.revision, "value": "removed_area"})
    assert not (await client.receive_json())["success"]


async def test_concurrent_saves_reject_stale_binding(hass: HomeAssistant) -> None:
    data = FloorplanData(hass)
    data._building_store.async_save = AsyncMock()
    first, second = copy.deepcopy(BUILDING), copy.deepcopy(BUILDING)
    results = await asyncio.gather(
        data.async_save_building(first, expected_revision=0),
        data.async_save_building(second, expected_revision=0),
        return_exceptions=True,
    )
    assert results[0] == 1
    assert isinstance(results[1], ValueError)
    assert data.revision == 1


async def test_reader_cannot_bind_plan(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token) -> None:
    await _setup(hass)
    data = hass.data[DOMAIN]
    await data.async_save_building(copy.deepcopy(BUILDING))
    client = await hass_ws_client(hass, access_token=hass_read_only_access_token)
    await client.send_json_auto_id(
        {
            "type": "neonplan3d/building/bind",
            "revision": data.revision,
            "floor_id": "f1",
            "kind": "room",
            "target_id": "r1",
            "field": "area_id",
            "value": None,
        }
    )
    result = await client.receive_json()
    assert not result["success"] and result["error"]["code"] == "unauthorized"
    assert data.revision == 1


async def test_failed_store_preserves_last_successful_plan(hass: HomeAssistant) -> None:
    data = FloorplanData(hass)
    original = copy.deepcopy(data.building)
    data._building_store.async_save = AsyncMock(side_effect=OSError("Synthetic disk error"))
    with pytest.raises(OSError):
        await data.async_save_building(copy.deepcopy(BUILDING), expected_revision=0)
    assert data.building == original
    assert data.revision == 0
