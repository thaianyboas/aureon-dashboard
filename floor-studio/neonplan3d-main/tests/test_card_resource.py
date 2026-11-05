"""The card bundle is kept in the dashboard resources (#252)."""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
from typing import Any

from custom_components.aureon_floor.card_resource import (
    LOADER_URL,
    async_ensure_card_resource,
    async_remove_card_resource,
    loader_source,
    remove_loader,
)


class FakeResources:
    """The parts of Lovelace's ResourceStorageCollection we use."""

    def __init__(self, items: list[dict[str, Any]]) -> None:
        self.items = items

    async def async_get_info(self) -> dict[str, int]:
        return {"resources": len(self.items)}

    def async_items(self) -> list[dict[str, Any]]:
        return self.items

    async def async_create_item(self, data: dict[str, Any]) -> dict[str, Any]:
        item = {"id": f"r{len(self.items)}", "type": data["res_type"], "url": data["url"]}
        self.items.append(item)
        return item

    async def async_update_item(self, item_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        item = next(i for i in self.items if i["id"] == item_id)
        item.update({"type": updates["res_type"], "url": updates["url"]})
        return item

    async def async_delete_item(self, item_id: str) -> None:
        self.items = [i for i in self.items if i["id"] != item_id]


URL = "/aureon_floor_static/neonplan3d.js?v=1.12.4-abc"


def _hass(lovelace: Any, config_dir: Any = None) -> SimpleNamespace:
    """A hass with Lovelace's data and a config folder (where custom_components/neonplan3d may exist)."""

    async def run(func: Any, *args: Any) -> Any:
        return func(*args)

    base = config_dir or "/nonexistent-config"
    return SimpleNamespace(
        data={"lovelace": lovelace},
        config=SimpleNamespace(path=lambda *parts: str(Path(base, *parts))),
        async_add_executor_job=run,
    )


async def test_added_updated_and_removed() -> None:
    """Added once, older copies lead to one current resource, other resources stay, removal takes only ours."""
    other = {"id": "x", "type": "module", "url": "/hacsfiles/button-card/button-card.js"}
    res = FakeResources([dict(other)])
    hass = _hass(SimpleNamespace(resources=res))
    await async_ensure_card_resource(hass, URL)
    assert [i["url"] for i in res.items] == [other["url"], URL]
    # an update and an old hand-installed copy (the official NeonPlan 3D is not installed): one current resource
    res.items[1]["url"] = "/aureon_floor_static/neonplan3d.js?v=1.12.3-old"
    res.items.append({"id": "old", "type": "module", "url": "/local/neonplan3d.js"})
    await async_ensure_card_resource(hass, URL)
    assert [i["url"] for i in res.items] == [other["url"], URL]
    await async_remove_card_resource(hass)
    assert res.items == [other]


async def test_the_earlier_name_is_taken_over_only_without_the_official(tmp_path) -> None:
    """AUREON's own name: the resource the installation under the name neonplan3d left is taken over; while the
    official NeonPlan 3D is installed its resource is never touched (nor removed with ours)."""
    official = {"id": "o", "type": "module", "url": "/neonplan3d_static/neonplan3d-loader.js?v=2.1.0-x"}
    loader = f"{LOADER_URL}?v=2.0.7-abc"
    res = FakeResources([dict(official)])
    (tmp_path / "custom_components" / "neonplan3d").mkdir(parents=True)
    hass = _hass(SimpleNamespace(resources=res), tmp_path)
    await async_ensure_card_resource(hass, loader)
    assert [i["url"] for i in res.items] == [official["url"], loader]
    await async_remove_card_resource(hass)
    assert res.items == [official]
    # the official one removed: its left-over resource now leads to ours
    (tmp_path / "custom_components" / "neonplan3d").rmdir()
    await async_ensure_card_resource(hass, loader)
    assert [i["url"] for i in res.items] == [loader]


async def test_yaml_mode_and_old_layout() -> None:
    """YAML resources are left alone; the dict layout before HA 2025.2 works too."""
    yaml = SimpleNamespace(loaded=True, async_items=lambda: [])
    await async_ensure_card_resource(_hass(SimpleNamespace(resources=yaml)), URL)
    res = FakeResources([])
    await async_ensure_card_resource(_hass({"resources": res}), URL)
    assert [i["url"] for i in res.items] == [URL]


async def test_loader_resource_replaces_the_bundle_and_goes_on_removal() -> None:
    """The loader takes the bundle's place in the resources (#461) and is removed with the integration."""
    res = FakeResources([{"id": "a", "type": "module", "url": URL}])
    hass = _hass(SimpleNamespace(resources=res))
    loader = f"{LOADER_URL}?v=1.16.0-abc"
    await async_ensure_card_resource(hass, loader)
    assert [i["url"] for i in res.items] == [loader]
    await async_remove_card_resource(hass)
    assert res.items == []


def test_loader_file(tmp_path) -> None:
    """The loader imports the bundle, tries again while the card is missing, and is written and removed cleanly."""
    text = loader_source(URL)
    assert f'const url = "{URL}";' in text
    assert "customElements.get(tag)" in text
    # a loader that an older version left in www is removed, with its folder
    old = tmp_path / "neonplan3d" / "neonplan3d-loader.js"
    old.parent.mkdir()
    old.write_text(text, encoding="utf-8")
    remove_loader(tmp_path)
    assert not (tmp_path / "neonplan3d").exists()
    remove_loader(tmp_path)  # nothing there: no error
