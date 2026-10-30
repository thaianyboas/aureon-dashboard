import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
test('async floor mounts have a generation token',()=>{
  assert.match(source,/const token=\+\+this\._floorMountToken/);
  assert.match(source,/token!==this\._floorMountToken/);
});
test('editor invalidates outstanding viewer loads',()=>assert.match(source,/Invalidate any pending async viewer mount[\s\S]*?\+\+this\._floorMountToken/));
test('re-render invalidates outstanding viewer loads',()=>assert.match(source,/A page re-render removes the previous viewer[\s\S]*?\+\+this\._floorMountToken/));
test('disconnected floor card is removed from hass update list',()=>{
  assert.match(source,/this\._studioRendered=this\._studioRendered\.filter\(item=>item!==this\._floorCard\)/);
  assert.match(source,/this\._floorCard=null/);
});
