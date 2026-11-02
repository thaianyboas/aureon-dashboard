"""AUREON own furniture models: served only to signed-in users, only .glb files from <config>/aureon_models."""

from __future__ import annotations

from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.neonplan3d.aureon_models import model_file
from custom_components.neonplan3d.const import DOMAIN


async def _setup(hass: HomeAssistant) -> None:
    await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


def _write_model(hass: HomeAssistant, name: str = "sofa.glb") -> Path:
    folder = Path(hass.config.config_dir) / "aureon_models"
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / name
    path.write_bytes(b"glTF\x02\x00\x00\x00" + b"\x00" * 16)
    return path


def test_model_file_accepts_only_plain_glb_names(tmp_path: Path) -> None:
    folder = tmp_path / "aureon_models"
    folder.mkdir()
    (folder / "a.glb").write_bytes(b"x")
    (tmp_path / "secret.glb").write_bytes(b"x")
    (folder / "notes.txt").write_bytes(b"x")
    assert model_file(str(tmp_path), "a.glb") == (folder / "a.glb").resolve()
    for name in [
        "../secret.glb",
        "..%2Fsecret.glb",
        "notes.txt",
        ".hidden.glb",
        "a.glb/../../secret.glb",
        "missing.glb",
        "",
    ]:
        assert model_file(str(tmp_path), name) is None, name


async def test_models_need_a_signed_in_user(hass: HomeAssistant, hass_client, hass_client_no_auth) -> None:
    await hass.async_add_executor_job(_write_model, hass)
    await _setup(hass)
    anonymous = await hass_client_no_auth()
    response = await anonymous.get("/api/neonplan3d/aureon_models/sofa.glb")
    assert response.status == 401
    client = await hass_client()
    response = await client.get("/api/neonplan3d/aureon_models/sofa.glb")
    assert response.status == 200
    assert response.headers["Content-Type"] == "model/gltf-binary"
    assert "private" in response.headers["Cache-Control"]
    assert (await response.read()).startswith(b"glTF")
    for bad in ["missing.glb", "notes.txt", "..%2Fconfiguration.yaml"]:
        # traversal is stopped by HA's security filter (400) or by the name check (404)
        assert (await client.get(f"/api/neonplan3d/aureon_models/{bad}")).status in (400, 404)


async def test_models_are_not_served_from_local(hass: HomeAssistant, hass_client_no_auth) -> None:
    await hass.async_add_executor_job(_write_model, hass)
    await _setup(hass)
    anonymous = await hass_client_no_auth()
    assert (await anonymous.get("/local/aureon_models/sofa.glb")).status in (401, 404)


def _glb(path: Path, mins: list[float], maxs: list[float], translation: list[float] | None = None) -> None:
    import json as _json
    import struct as _struct

    node = {"mesh": 0, **({"translation": translation} if translation else {})}
    doc = {
        "asset": {"version": "2.0"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [node],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0}}]}],
        "accessors": [{"componentType": 5126, "count": 3, "type": "VEC3", "min": mins, "max": maxs}],
    }
    chunk = _json.dumps(doc).encode()
    chunk += b" " * (-len(chunk) % 4)
    path.write_bytes(
        b"glTF" + _struct.pack("<II", 2, 12 + 8 + len(chunk)) + _struct.pack("<II", len(chunk), 0x4E4F534A) + chunk
    )


def test_list_models_gives_real_sizes_and_catalog_names(tmp_path: Path) -> None:
    import json as _json

    from custom_components.neonplan3d.aureon_models import glb_bounds, list_models

    folder = tmp_path / "aureon_models"
    folder.mkdir()
    _glb(folder / "sofa.glb", [-1.5, 0, -0.5], [1.5, 0.8, 0.5])
    _glb(folder / "lamp.glb", [0, 0, 0], [0.25, 0.44, 0.25], translation=[5, 0, 0])
    (folder / "broken.glb").write_bytes(b"glTF\x02\x00\x00\x00" + b"\x00" * 16)
    (folder / "notes.txt").write_text("x")
    (folder / "catalog.json").write_text(
        _json.dumps(
            {
                "files": {
                    "sofa.glb": {"name": "Sofá", "type": "sofa_l", "mirror": True, "mount_y": 99},
                    "../x.glb": {"name": "evil"},
                    "lamp.glb": {"type": "Bad Type!"},
                }
            }
        )
    )
    assert glb_bounds(folder / "sofa.glb") == [3.0, 0.8, 1.0]
    models = {m["file"]: m for m in list_models(str(tmp_path))}
    assert set(models) == {"sofa.glb", "lamp.glb"}  # unreadable files and other types are left out
    sofa = models["sofa.glb"]
    assert sofa["url"] == "/api/neonplan3d/aureon_models/sofa.glb"
    assert (
        sofa["size"] == [3.0, 0.8, 1.0]
        and sofa["name"] == "Sofá"
        and sofa["type"] == "sofa_l"
        and sofa["mirror"] is True
    )
    assert "mount_y" not in sofa  # out of range values are dropped
    assert models["lamp.glb"]["size"] == [0.25, 0.44, 0.25] and "type" not in models["lamp.glb"]
    assert list_models(str(tmp_path / "missing")) == []


async def test_list_command_for_signed_in_users(hass: HomeAssistant, hass_ws_client) -> None:
    folder = Path(hass.config.config_dir) / "aureon_models"
    await hass.async_add_executor_job(lambda: folder.mkdir(parents=True, exist_ok=True))
    await hass.async_add_executor_job(_glb, folder / "chair.glb", [-0.3, 0, -0.25], [0.3, 0.8, 0.25])
    await _setup(hass)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "neonplan3d/aureon_models/list"})
    result = await client.receive_json()
    assert result["success"]
    assert [m["file"] for m in result["result"]["models"]] == ["chair.glb"]
    assert result["result"]["models"][0]["size"] == [0.6, 0.8, 0.5]
