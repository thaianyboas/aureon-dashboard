import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
const panel=readFileSync(new URL('../neonplan3d-main/frontend/src/panel.ts',import.meta.url),'utf8');
const mount=source.slice(source.indexOf('async _mountFloorStudio'),source.indexOf('_render() {'));
test('Floor Studio embeds the original panel directly, without an iframe',()=>{
  assert.doesNotMatch(mount,/iframe/);
  assert.match(mount,/document\.createElement\('neonplan3d-panel'\)/);
  assert.match(mount,/setAttribute\('aureon-embedded',''\)/);
  assert.match(mount,/panel\.hass=this\._hass/);
});
test('embedded panel receives hass updates and is dropped from them when replaced',()=>{
  assert.match(mount,/this\._studioRendered\.push\(panel\)/);
  assert.match(source,/for \(const card of this\._studioRendered\) \{ try \{ card\.hass=value;/);
  assert.match(source,/\+\+this\._floorMountToken;this\._floorCard=null;this\._studioRendered=\[\]/);
});
test('late bundle registration is awaited with a bound and cannot mount into an inactive page',()=>{
  assert.match(mount,/customElements\.whenDefined\('neonplan3d-panel'\)/);
  assert.match(mount,/setTimeout\(resolve,8000\)/);
  assert.match(mount,/const alive=\(\)=>token===this\._floorMountToken && host\?\.isConnected && this\._page==='Planta'/);
  assert.match(mount,/explain\(this\._floorText\('missing'\)\)/);
});
test('failures are announced accessibly with a manual retry',()=>{
  assert.match(mount,/note\.setAttribute\('role','status'\)/);
  assert.match(mount,/note\.textContent=message/);
  assert.match(mount,/host\.replaceChildren\(note,retry\)/);
  assert.match(mount,/void this\._mountFloorStudio\(\)/);
});
test('a foreign (non-AUREON) bundle is reported, never hidden',()=>{
  assert.match(mount,/Panel\.aureonEmbed/);
  assert.match(mount,/this\._floorText\('foreign'\)/);
  assert.match(panel,/static readonly aureonEmbed = 1/);
});
test('the panel hides only the duplicated HA chrome when embedded; editor stays admin-only',()=>{
  assert.match(panel,/aureonEmbedded: \{ type: Boolean, attribute: "aureon-embedded", reflect: true \}/);
  assert.match(panel,/this\.aureonEmbedded \? nothing : html`<ha-menu-button/);
  assert.match(panel,/:host\(\[aureon-embedded\]\) \{\s*height: var\(--aureon-floor-height, 100%\)/);
  assert.match(panel,/\$\{this\.isAdmin\s*\? html`<div class="fp3d-seg" role="tablist">/);
  assert.match(panel,/this\._mode === "editor" && this\.isAdmin/);
  // the version notice stays visible in the embedded panel
  assert.match(panel,/\$\{this\._clean && this\._mode === "view" \? nothing : this\.renderNotices\(\)\}/);
});
test('visible product name is AUREON Floor Studio; technical ids stay neonplan3d',()=>{
  assert.match(panel,/<h1>AUREON Floor Studio<\/h1>/);
  const constPy=readFileSync(new URL('../neonplan3d-main/custom_components/neonplan3d/const.py',import.meta.url),'utf8');
  assert.match(constPy,/PANEL_TITLE = "AUREON Floor Studio"/);
  assert.match(constPy,/PANEL_URL_PATH = "neonplan3d"/);
  assert.match(constPy,/PANEL_COMPONENT = "neonplan3d-panel"/);
});
