import test from 'node:test';
import assert from 'node:assert/strict';
import {aureonModules} from '../neonplan3d-main/frontend/src/aureon-modules/module-settings.mjs';
for (const [lang, expected] of [['pt-BR','Eletricidade hoje (kWh)'],['de-DE','Strom heute (kWh)'],['en-US','Electricity today (kWh)']]) {
 test(`Heat Monitor exposes daily sensors and ${lang} labels`, () => {
  const host={language:()=>lang,building:()=>({settings:{mods:{}}})};
  const heat=aureonModules.find(m=>m.id==='aureon.heat_monitor');
  const fields=heat.settings(host);
  assert.ok(fields.some(f=>f.label===expected && f.kind==='entity'));
  assert.ok(fields.some(f=>f.label==='COP'));
 });
}
