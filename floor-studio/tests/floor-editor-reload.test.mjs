import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
test('editor can be reloaded without reloading Home Assistant',()=>{
  assert.match(code,/editorRetry\.addEventListener\('click'/);
  assert.match(code,/editorHost\.replaceChildren\(\);\s*notice\.textContent=this\._floorText\('reopening'\)/);
  assert.match(code,/show\('editor'\)/);
});
test('editor reload remains administrator-only and active-page-only',()=>{
  assert.match(code,/if\(!canEdit \|\| editorHost\.hidden \|\| this\._page!=='Planta'\)return/);
  assert.match(code,/editorRetry\.hidden=!editor/);
});
test('editor iframe failure offers recovery and full-screen fallback',()=>{
  assert.match(code,/frame\.addEventListener\('error'/);
  assert.match(code,/editorHost\.contains\(frame\)/);
  assert.match(code,/this\._floorText\('frameError'\)/);
});
