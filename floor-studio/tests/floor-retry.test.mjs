import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
test('viewer failure offers explicit manual retry',()=>{assert.match(code,/retry\.textContent=this\._floorText\('retry'\)/);assert.match(code,/retry\.addEventListener\('click'/)});
test('retry invalidates old mounts and checks active page',()=>{assert.match(code,/token!==this\._floorMountToken \|\| !host\.isConnected \|\| host\.hidden \|\| this\._page!=='Planta'/);assert.match(code,/void this\._mountNeonPlan\(\)/)});
test('error is announced accessibly without HTML injection',()=>{assert.match(code,/note\.setAttribute\('role','status'\)/);assert.match(code,/note\.textContent=message/);assert.match(code,/host\.replaceChildren\(note,retry\)/)});
