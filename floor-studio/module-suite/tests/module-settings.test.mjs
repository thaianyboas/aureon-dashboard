import test from 'node:test';import assert from 'node:assert/strict';import {aureonModules} from '../src/module-settings.mjs';
test('four distinct modules',()=>assert.equal(new Set(aureonModules.map(m=>m.id)).size,4));
test('all modules expose GUI settings',()=>assert.ok(aureonModules.every(m=>typeof m.settings==='function')));
test('all modules expose API 1',()=>assert.ok(aureonModules.every(m=>m.api===1)));
test('heat has configurable sensor mappings',()=>assert.ok(aureonModules[2].settings({building:()=>({settings:{mods:{}}})}).some(f=>f.kind==='entity')));
