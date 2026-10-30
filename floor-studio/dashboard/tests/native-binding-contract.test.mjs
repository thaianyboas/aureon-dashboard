import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {bindingFields,bindingTargets} from '../platform/bindings.mjs';
test('frontend selector domains exactly match the server binding allowlist',()=>{
 const path=fileURLToPath(new URL('../../neonplan3d-main/custom_components/neonplan3d/bindings.py',import.meta.url));
 const result=spawnSync('python3',['-c',"import runpy,json,sys; d=runpy.run_path(sys.argv[1])['BINDING_FIELDS']; print(json.dumps({k:{f:sorted(v) if v is not None else None for f,v in fields.items()} for k,fields in d.items()}))",path],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);const js=Object.fromEntries(Object.entries(bindingFields).map(([k,fields])=>[k,Object.fromEntries(Object.entries(fields).map(([f,v])=>[f,v?[...v].sort():null]))]));assert.deepEqual(JSON.parse(result.stdout),js);
});
test('binding read model retains only native target fields, never geometry, actions or arbitrary metadata',()=>{
 const result=bindingTargets({floors:[{id:'f',name:'Floor',private:'not retained',rooms:[{id:'r',name:'Room',area_id:'area',points:[[1,2]],actions:{secret:'not retained'},climate:{temperature:'sensor.t'}}]}]});
 assert.equal(result[0].private,undefined);const target=result[0].targets[0];assert.equal(target.points,undefined);assert.equal(target.actions,undefined);assert.equal(target.bindings['climate.temperature'],'sensor.t');assert.equal(target.bindings.area_id,'area');
});
