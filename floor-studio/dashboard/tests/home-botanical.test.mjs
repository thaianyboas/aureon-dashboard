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
