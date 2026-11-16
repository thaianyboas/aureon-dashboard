import {test} from 'node:test';import assert from 'node:assert/strict';
import {homeEntities} from '../platform/home-cinema.mjs';
// Owner 2026-11-16: Met.no "Wetter", Thaiany and Marvin and the Dreame X60 Pro must appear even when the entity registry
// rows are missing, filtered by Labels or still loading. Only real states are used; hidden entities stay hidden.
const controller=(states,rows=[],prefs={})=>({preferences:{hidden:[],...prefs},hass:{states},list:domains=>rows.filter(r=>domains.includes(r.domain))});
const states={'weather.forecast_zuhause':{state:'partlycloudy',attributes:{friendly_name:'Wetter'}},'weather.other':{state:'sunny',attributes:{friendly_name:'Other'}},
 'person.thaiany':{state:'home',attributes:{friendly_name:'Thaiany'}},'person.marvin':{state:'Arbeit',attributes:{friendly_name:'Marvin'}},'vacuum.x60_pro':{state:'docked',attributes:{friendly_name:'Dreame X60 Pro'}}};
test('home entities come from the live states when the registry has none',()=>{
 const c=controller(states);
 assert.deepEqual(homeEntities(c,'person').map(r=>r.name),['Thaiany','Marvin']);
 assert.equal(homeEntities(c,'vacuum')[0].id,'vacuum.x60_pro');
 assert.equal(homeEntities(c,'weather')[0].name,'Wetter');
});
test('registry rows come first, hidden entities stay hidden, a chosen weather entity wins',()=>{
 const c=controller(states,[{id:'person.marvin',domain:'person',name:'Marvin (registry)'}],{hidden:['person.thaiany']});
 assert.deepEqual(homeEntities(c,'person').map(r=>r.name),['Marvin (registry)']);
 const chosen=controller(states,[],{weatherEntity:'weather.other'});
 assert.deepEqual(homeEntities(chosen,'weather').map(r=>r.id),['weather.other']);
 const gone=controller(states,[],{weatherEntity:'weather.removed'});
 assert.equal(homeEntities(gone,'weather')[0].id,'weather.forecast_zuhause');
 assert.deepEqual(homeEntities(controller({}),'weather'),[]);
});
import {robotFacts} from '../platform/home-botanical.mjs';
// Owner 2026-11-16: the robot shows what matters by itself, from the Dreame entities of the same device.
test('robot facts are read from the Dreame entities that exist',()=>{
 const states={'vacuum.x60':{state:'cleaning',attributes:{}},'sensor.x60_current_room':{state:'Sala',attributes:{}},'sensor.x60_cleaned_area':{state:'12',attributes:{unit_of_measurement:'m²'}},
  'sensor.x60_error':{state:'no_error',attributes:{}},'select.x60_cleangenius':{state:'off',attributes:{}},'select.x60_suction_level':{state:'strong',attributes:{}},
  'sensor.x60_side_brush_left':{state:'7',attributes:{}},'sensor.x60_filter_left':{state:'60',attributes:{}}};
 const r=id=>({id,name:'X60 '+id.split('_').slice(1).join(' ')});
 const robot={vacuum:{id:'vacuum.x60'},stats:{current_room:r('sensor.x60_current_room'),cleaned_area:r('sensor.x60_cleaned_area'),error:r('sensor.x60_error')},settings:{cleangenius:r('select.x60_cleangenius'),suction_level:r('select.x60_suction_level')},consumables:[r('sensor.x60_side_brush_left'),r('sensor.x60_filter_left')]};
 const ui={t:{},c:{dreame:()=>[robot],state:id=>states[id]},name:row=>row.name,stateText:s=>s.state,format:(v,d)=>v.toFixed(d)};
 assert.deepEqual(robotFacts(ui,{id:'vacuum.x60',name:'X60'}),[{kind:'room',text:'Sala'},{kind:'area',text:'12.0 m²'},{kind:'mode',text:'strong'},{kind:'alert',text:'side brush left 7 %'}]);
 states['vacuum.x60'].state='docked';states['sensor.x60_error'].state='mop_pad_missing';
 assert.deepEqual(robotFacts(ui,{id:'vacuum.x60',name:'X60'}).map(f=>f.kind),['alert','mode','alert']);
 assert.deepEqual(robotFacts(ui,{id:'vacuum.other',name:'Other'}),[]);
});
