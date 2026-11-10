import {test} from 'node:test';import assert from 'node:assert/strict';
import {dreameRobots,dreameKey,converter,affineFrom,apply,mapRooms,segmentCall,zoneCall,spotCall,gotoCall,selectCall,serviceAvailable} from '../integrations/dreame.mjs';
import {PlatformController} from '../platform/controller.mjs';
import {dictionaries} from '../platform/locales.mjs';

// Calibration as the Dreame camera publishes it: vacuum millimetres ↔ map pixels (here 1 px = 50 mm, y flipped).
const calibration=[{vacuum:{x:0,y:0},map:{x:400,y:300}},{vacuum:{x:1000,y:0},map:{x:420,y:300}},{vacuum:{x:0,y:1000},map:{x:400,y:280}}];
const rows=[
 {id:'vacuum.robi',domain:'vacuum',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_vacuum'},
 {id:'camera.robi_map',domain:'camera',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_map_map'},
 {id:'camera.robi_map_data',domain:'camera',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_map_map_data'},
 {id:'camera.robi_map_1',domain:'camera',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_map_1'},
 {id:'select.robi_suction_level',domain:'select',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_suction_level'},
 {id:'select.robi_saugstufe',domain:'select',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_water_volume'},
 {id:'select.robi_voice',domain:'select',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_voice_assistant_language'},
 {id:'sensor.robi_filter_left',domain:'sensor',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_filter_left'},
 {id:'sensor.robi_main_brush_left',domain:'sensor',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_main_brush_left'},
 {id:'sensor.robi_main_brush_time_left',domain:'sensor',source:'dreame_vacuum',deviceId:'dev',uniqueId:'aa:bb:cc_main_brush_time_left'},
 {id:'vacuum.other',domain:'vacuum',source:'roborock',deviceId:'x'},
 {id:'select.foreign',domain:'select',source:'template',deviceId:'dev',uniqueId:'u_suction_level'}
];

test('Dreame robot: entities are grouped by the Dreame key from the registry, never guessed from names',()=>{
 const [robot,...more]=dreameRobots(rows,{});
 assert.equal(more.length,0);
 assert.equal(robot.vacuum.id,'vacuum.robi');
 assert.equal(robot.map.id,'camera.robi_map');
 assert.deepEqual(robot.maps.map(r=>r.id),['camera.robi_map_1']);
 assert.deepEqual(Object.keys(robot.settings).sort(),['suction_level','water_volume']);
 assert.equal(robot.settings.water_volume.id,'select.robi_saugstufe');
 assert.deepEqual(robot.consumables.map(r=>r.id),['sensor.robi_main_brush_left','sensor.robi_filter_left']);
 assert.equal(dreameKey({id:'sensor.robi_filter_left'},'robi'),'filter_left');
});

test('map ↔ vacuum coordinates follow the camera calibration (affine) both ways',()=>{
 const conv=converter(calibration);
 assert.deepEqual(conv.toMap(2000,-1000).map(Math.round),[440,320]);
 const [x,y]=conv.toVacuum(440,320);assert.ok(Math.abs(x-2000)<1e-6&&Math.abs(y+1000)<1e-6);
 assert.equal(converter([]),null);assert.equal(converter([calibration[0],calibration[0],calibration[1]]),null);
 const t=affineFrom([{x:0,y:0},{x:1,y:0},{x:0,y:1}],[{x:5,y:5},{x:5,y:7},{x:3,y:5}]);
 assert.deepEqual(apply(t,1,1),[3,7]);
});

test('rooms come from the camera attribute with names, boxes and centres',()=>{
 const rooms=mapRooms({rooms:{'3':{room_id:3,name:'Küche',x0:0,y0:0,x1:2000,y1:1000,x:1000,y:500,order:2},'1':{room_id:1,name:'Bad',custom_name:'Badezimmer',x0:-500,y0:0,x1:0,y1:800,order:1},'0':{name:'invalid'}}});
 assert.deepEqual(rooms.map(r=>[r.id,r.name]),[[1,'Badezimmer'],[3,'Küche']]);
 assert.deepEqual(rooms[0].center,[-250,400]);
 assert.deepEqual(mapRooms({}),[]);
});

test('service calls match the Map Card contract for Dreame and are validated',()=>{
 assert.deepEqual(segmentCall('vacuum.robi',[3,1,3,'x',-2],5,[1,3]),{domain:'dreame_vacuum',service:'vacuum_clean_segment',data:{entity_id:'vacuum.robi',segments:[3,1],repeats:3}});
 assert.equal(segmentCall('vacuum.robi',[9],1,[1,3]),null);
 assert.deepEqual(zoneCall('vacuum.robi',[[1000.4,2000,-500.6,800]],2).data,{entity_id:'vacuum.robi',zone:[[-501,800,1000,2000]],repeats:2});
 assert.equal(zoneCall('vacuum.robi',[[0,0,50,50]]),null);
 assert.deepEqual(spotCall('vacuum.robi',[[10.2,-20.7]]).data,{entity_id:'vacuum.robi',points:[[10,-21]],repeats:1});
 assert.deepEqual(gotoCall('vacuum.robi',[1234.5,-99.4]),{domain:'dreame_vacuum',service:'vacuum_goto',data:{entity_id:'vacuum.robi',x:1235,y:-99}});
 const s={attributes:{options:['quiet','standard','strong']}};
 assert.deepEqual(selectCall(s,'select.robi_suction_level','strong'),{domain:'select',service:'select_option',data:{entity_id:'select.robi_suction_level',option:'strong'}});
 assert.equal(selectCall(s,'select.robi_suction_level','turbo'),null);
 assert.equal(serviceAvailable({dreame_vacuum:{vacuum_goto:{}}},gotoCall('v',[0,0])),true);
 assert.equal(serviceAvailable({},gotoCall('v',[0,0])),false);
});

test('controller sends Dreame calls only for visible Dreame entities and offered services',async()=>{
 const calls=[],states=Object.fromEntries(rows.map(r=>[r.id,{entity_id:r.id,state:'on',attributes:{}}]));
 const hass={user:{id:'one'},connection:{},hassUrl:p=>'https://ha.example'+p,language:'pt',states,services:{dreame_vacuum:{vacuum_clean_segment:{}},select:{select_option:{}}},callService:async(...a)=>{calls.push(a);}};
 const c=new PlatformController({storage:null});c.update(hass,{rows:[],entityRows:rows,allLabels:[]});
 assert.equal(c.dreame().length,1);
 assert.equal(await c.dreameCall(segmentCall('vacuum.robi',[1])),true);
 assert.deepEqual(calls[0],['dreame_vacuum','vacuum_clean_segment',{entity_id:'vacuum.robi',segments:[1],repeats:1}]);
 assert.equal(await c.dreameCall(gotoCall('vacuum.robi',[0,0])),false); // service not offered
 assert.equal(await c.dreameCall(segmentCall('vacuum.other',[1])),false); // not a Dreame entity
 assert.equal(await c.dreameCall(selectCall({attributes:{options:['a','b']}},'select.foreign','b')),false);
 assert.equal(await c.dreameCall({domain:'dreame_vacuum',service:'vacuum_clean_segment',data:{entity_id:'vacuum.ghost',segments:[1]}}),false);
 c.save({...c.preferences,hidden:['vacuum.robi']});
 assert.equal(await c.dreameCall(segmentCall('vacuum.robi',[1])),false); // hidden by the owner
 assert.equal(calls.length,1);
});

test('vacuum page texts exist in every language',()=>{for(const d of Object.values(dictionaries))for(const k of ['robot','vacPage','vacMode_rooms','vacMode_zone','vacMode_spot','vacMode_goto','vacGo','vacSent','vacFailed','vacNoService','vacSettings','vacConsumables'])assert.ok(d[k],k);});
