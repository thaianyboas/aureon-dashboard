import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
test('editor iframe timeout has a visible recovery message',()=>{
  assert.match(src,/editorLoadTimer=setTimeout\([\s\S]*?this\._floorText\('frameError'\)/);
});
test('editor load and error both cancel pending timeout',()=>{
  assert.match(src,/frame\.addEventListener\('load',\(\)=>\{\s*clearEditorTimer\(\)/);
  assert.match(src,/frame\.addEventListener\('error',\(\)=>\{\s*clearEditorTimer\(\)/);
});
test('changing mode cancels timeout',()=>assert.match(src,/if\(!editor\)\{\s*clearEditorTimer\(\)/));
test('reloading editor cancels previous timeout',()=>assert.match(src,/clearEditorTimer\(\);\s*editorHost\.replaceChildren\(\);\s*notice\.textContent=this\._floorText\('reopening'\)/));
