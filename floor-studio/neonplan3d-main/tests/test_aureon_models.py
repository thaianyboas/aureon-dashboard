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
