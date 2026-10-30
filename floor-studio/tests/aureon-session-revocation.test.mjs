import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../neonplan3d-main/frontend/src/panel.ts',import.meta.url),'utf8');
test('revokes approved modules when HA admin privileges disappear',()=>{
 assert.match(panel,/changed\.has\("hass"\) && !this\.isAdmin && this\._aureonApprovedIds\.length/);
 assert.match(panel,/for \(const id of this\._aureonApprovedIds\) setAureonModuleApproval\(id, false\)/);
 assert.match(panel,/this\._aureonApprovedIds = \[\]/);
});
