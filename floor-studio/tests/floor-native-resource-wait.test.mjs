import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
test('waits for native NeonPlan card resource to register',()=>assert.match(source,/customElements\.whenDefined\('neonplan3d-card'\)/));
test('resource wait is bounded',()=>assert.match(source,/new Promise\(resolve=>setTimeout\(resolve,6000\)\)/));
test('late registration cannot mount into inactive floor page',()=>assert.match(source,/if\(token!==this\._floorMountToken \|\| !host\.isConnected \|\| host\.hidden \|\| this\._page!=='Planta'\)return;\s*if\(!customElements\.get\('neonplan3d-card'\)\)/));
test('missing resource still shows retry',()=>assert.match(source,/explain\(this\._floorText\('missing'\)\)/));
