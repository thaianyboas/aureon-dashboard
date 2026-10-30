import {test} from 'node:test';import assert from 'node:assert/strict';
import {wasteCollections,fetchWasteCalendar} from '../integrations/waste.mjs';
import {floorPosition} from '../integrations/vacuum-position.mjs';
test('waste today/tomorrow respect HA timezone and DST civil dates',()=>{
 const state={entity_id:'sensor.waste',state:'available',attributes:{'2026-10-25':'Paper','2026-10-26':'Organic'}};
 const rows=wasteCollections(state,{now:'2026-10-24T22:30:00Z',timeZone:'Europe/Berlin'});assert.equal(rows[0].today,true);assert.equal(rows[1].tomorrow,true);assert.equal(rows[1].days,1);
});
test('WCS collection-type and generic upcoming formats normalize without guessing numeric states',()=>{
 const state={entity_id:'sensor.waste',state:'2',attributes:{Paper:'2026-10-31',upcoming:[{date:'2026-11-01',types:['Organic','General']}],daysTo:2}};
 const rows=wasteCollections(state,{now:'2026-10-30T10:00:00Z'});assert.equal(rows.length,2);assert.equal(rows[0].type,'Paper');assert.equal(rows[1].type,'Organic, General');assert.deepEqual(wasteCollections({...state,attributes:{}},{now:'2026-10-30T10:00:00Z'}),[]);
});
test('calendar adapter accepts actual all-day/timed events and deduplicates',()=>{
 const state={entity_id:'calendar.pickup',state:'off',attributes:{}};
 const events=[{start:{date:'2026-10-31'},summary:'Paper'},{start:{dateTime:'2026-10-31T10:00:00Z'},summary:'Paper'}];const rows=wasteCollections(state,{events,now:'2026-10-30T10:00:00Z'});assert.equal(rows.length,1);assert.equal(rows[0].tomorrow,true);
});
test('past, invalid, unavailable and unlabeled waste data are excluded',()=>{const state={entity_id:'sensor.waste',state:'on',attributes:{'2026-02-30':'Invalid','2026-01-01':'Old','2026-11-01':null}};assert.deepEqual(wasteCollections(state,{now:'2026-10-30T10:00:00Z'}),[]);assert.deepEqual(wasteCollections({...state,state:'unavailable'}),[]);});
test('calendar reads only a selected visible calendar through HA, never arbitrary URLs',async()=>{const calls=[];const hass={states:{'calendar.pickup':{}},callApi:async(...args)=>{calls.push(args);return [];}};await fetchWasteCalendar(hass,'calendar.pickup',{start:'2026-10-30T00:00Z',end:'2026-11-10T00:00Z'});assert.equal(calls[0][0],'GET');assert.match(calls[0][1],/^calendars\/calendar.pickup\?/);await assert.rejects(fetchWasteCalendar(hass,'calendar.other',{start:'2026-10-30',end:'2026-11-10'}));});
const stamp='2026-10-30T10:00:00Z',now=Date.parse(stamp),sample={x:1000,y:2000,mapId:'map',units:'mm',updatedAt:stamp},calibration={mapId:'map',units:'mm',floorId:'floor',matrix:[.001,0,0,.001,3,4]};
test('vacuum coordinates require explicit map calibration and units',()=>{assert.deepEqual(floorPosition(sample,calibration,{now}),{x:4,z:6,floorId:'floor',mapId:'map',updatedAt:stamp});assert.equal(floorPosition(sample,{...calibration,units:'pixels'},{now}),null);assert.equal(floorPosition(sample,{...calibration,mapId:'other'},{now}),null);});
test('stale, future, missing, singular and non-finite vacuum positions are never displayed',()=>{for(const [s,c,n] of [[sample,calibration,now+16000],[{...sample,updatedAt:'2026-10-31'},calibration,now],[sample,{...calibration,matrix:[0,0,0,0,0,0]},now],[{...sample,x:NaN},calibration,now],[null,calibration,now]])assert.equal(floorPosition(s,c,{now:n}),null);});
