import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, sep, join } from 'node:path';
const root=resolve('.'),record=JSON.parse(readFileSync('build/dashboard/DASHBOARD_BUILD.json','utf8'));
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(join(p,x.name)):[join(p,x.name)]);
const inputs=[...walk('floor-studio/dashboard'),'floor-studio/aureon-dashboard.js','package.json','scripts/build-dashboard-candidate.mjs','floor-studio/neonplan3d-main/frontend/package.json','floor-studio/neonplan3d-main/frontend/package-lock.json'];
assert.equal(record.installation_approved,false);
assert.deepEqual(Object.keys(record.sources).sort(),inputs.sort(),'Dashboard input inventory changed; rebuild');
for(const [name,digest] of Object.entries(record.sources)){
 const path=resolve(name);assert.ok(!relative(root,path).startsWith('..'+sep));
 assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),digest,'Stale dashboard source: '+name);
}
assert.equal(createHash('sha256').update(readFileSync('build/dashboard/aureon-dashboard.js')).digest('hex'),record.bundle,'Stale dashboard bundle');
console.log('PASS: candidate dashboard bundle and all source/build inputs match compilation evidence.');
