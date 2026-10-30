import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dashboard=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
const upstream=readFileSync(new URL('../neonplan3d-main/frontend/src/card-editor.ts',import.meta.url),'utf8');
test('native NeonPlan3D controls explicitly enabled in AUREON',()=>{
  assert.match(dashboard,/createCardElement\(\{type:'custom:neonplan3d-card'[^}]*controls:true[^}]*fullscreen_button:true[^}]*room_panel:true/);
});
test('AUREON preserves native editor and does not implement its own floor storage',()=>{
  assert.match(dashboard,/frame\.src='\/neonplan3d'/);
  assert.match(dashboard,/this\._hass\?\.user\?\.is_admin/);
});
test('upstream native card exposes controls and fullscreen configuration',()=>{
  assert.match(upstream,/controls/);
  assert.match(upstream,/fullscreen_button/);
});
