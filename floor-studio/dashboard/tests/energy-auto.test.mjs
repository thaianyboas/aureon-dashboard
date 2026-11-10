import {test} from 'node:test';import assert from 'node:assert/strict';
import {consumerLabelIds,autoConsumers,autoTotals} from '../platform/energy-auto.mjs';
import {PlatformController} from '../platform/controller.mjs';
import {dictionaries} from '../platform/locales.mjs';

const labels=[{id:'verbraucht',name:'Verbraucht'},{id:'lab_2',name:'Verbraucher'},{id:'other',name:'Licht'}];
const state=(value,unit,stateClass,extra={})=>({state:String(value),attributes:{unit_of_measurement:unit,state_class:stateClass,...extra}});
const states={
 'switch.washer':{state:'on',attributes:{}},
 'sensor.washer_energy':state(120.5,'kWh','total_increasing'),
 'sensor.washer_power':state(800,'W','measurement'),
 'sensor.washer_returned':state(3,'kWh','total_increasing'),
 'sensor.tv_power':state(0.1,'kW','measurement'),
 'sensor.lamp_power':state(9,'W','measurement'),
 'sensor.fridge_energy':state(3,'kWh','total'),
 'sensor.temp':state(21,'°C','measurement')
};
const rows=[
 {id:'switch.washer',name:'Washer',domain:'switch',deviceId:'d1',device:'Waschmaschine',areaId:'bath',areaName:'Bad',labels:['verbraucht']},
 {id:'sensor.washer_energy',name:'Washer energy',domain:'sensor',deviceId:'d1',device:'Waschmaschine',areaId:'bath',areaName:'Bad',labels:[]},
 {id:'sensor.washer_power',name:'Washer power',domain:'sensor',deviceId:'d1',device:'Waschmaschine',areaId:'bath',areaName:'Bad',labels:[]},
 {id:'sensor.washer_returned',name:'Washer returned',domain:'sensor',deviceId:'d1',device:'Waschmaschine',areaId:'bath',areaName:'Bad',labels:[]},
 {id:'sensor.tv_power',name:'TV power',domain:'sensor',deviceId:'d2',device:'TV',areaId:'living',areaName:'Wohnzimmer',labels:['lab_2']},
 {id:'sensor.lamp_power',name:'Lamp power',domain:'sensor',deviceId:'d3',device:'Lampe',areaId:'living',areaName:'Wohnzimmer',labels:[]},
 {id:'sensor.fridge_energy',name:'Fridge',domain:'sensor',deviceId:'',device:'Sem dispositivo',areaId:'',areaName:'Sem ambiente',labels:['verbraucht']},
 {id:'sensor.temp',name:'Temp',domain:'sensor',deviceId:'d2',device:'TV',areaId:'living',areaName:'Wohnzimmer',labels:['lab_2']}
];

test('the Label "Verbraucht" (and Verbraucher) marks consumers; a labelled device brings its meters along',()=>{
 assert.deepEqual(consumerLabelIds(labels),['verbraucht','lab_2']);
 const list=autoConsumers(rows,states,consumerLabelIds(labels));
 assert.deepEqual(list.map(x=>[x.key,x.name,x.energyId,x.powerId]),[
  ['d1','Waschmaschine','sensor.washer_energy','sensor.washer_power'],
  ['d2','TV','','sensor.tv_power'],
  ['sensor.fridge_energy','Fridge','sensor.fridge_energy','']]);
 assert.deepEqual(autoConsumers(rows,states,[]),[]);
});

test('kWh per day come from energy meters, or from hourly mean power when a device has no meter',()=>{
 const tz='Europe/Berlin',now=Date.parse('2026-11-10T10:30:00Z');
 const consumers=autoConsumers(rows,states,consumerLabelIds(labels));
 const day=d=>Date.parse(d)/1000; // HA may send seconds
 const stats={energy:{
  'sensor.washer_energy':[{start:day('2026-10-30T23:00:00Z'),change:5},{start:day('2026-11-08T23:00:00Z'),change:1.5},{start:day('2026-11-09T23:00:00Z'),change:0.8}],
  'sensor.fridge_energy':[{start:Date.parse('2026-11-09T23:00:00Z'),change:0.4},{start:Date.parse('2026-11-08T23:00:00Z'),change:-2}]},
  power:{'sensor.tv_power':[{start:Date.parse('2026-11-10T06:00:00Z'),mean:100},{start:Date.parse('2026-11-10T07:00:00Z'),mean:200},{start:Date.parse('2026-11-09T20:00:00Z'),mean:500}]}};
 const r=autoTotals(consumers,stats,{timeZone:tz,now,states});
 const by=Object.fromEntries(r.consumers.map(x=>[x.key,x]));
 assert.equal(by.d1.today,0.8);assert.equal(by.d1.month,2.3);assert.equal(by.d1.watts,800);
 assert.ok(Math.abs(by.d2.today-0.3)<1e-9);assert.ok(Math.abs(by.d2.month-0.8)<1e-9);assert.equal(by.d2.watts,100);
 assert.equal(by['sensor.fridge_energy'].today,0.4);
 assert.ok(Math.abs(r.today-1.5)<1e-9);
 assert.ok(Math.abs(r.month-(2.3+0.8+0.4))<1e-9);
 assert.equal(r.watts,900);
 assert.deepEqual(r.series.map(x=>x.key),['2026-10-31','2026-11-09','2026-11-10']);
 const none=autoTotals(consumers,null,{timeZone:tz,now,states});
 assert.equal(none.today,null);assert.equal(none.month,null);
});

test('controller: automatic energy reads statistics only, prices kWh and can be switched off',async()=>{
 const calls=[],now=Date.parse('2026-11-10T10:30:00Z');
 const hass={user:{id:'one'},connection:{},hassUrl:p=>'https://ha.example'+p,language:'pt',config:{time_zone:'Europe/Berlin'},states,services:{},
  callService:async(...a)=>{calls.push(['service',...a]);},
  callWS:async msg=>{calls.push(msg);if(msg.period==='day')return {'sensor.washer_energy':[{start:Date.parse('2026-11-09T23:00:00Z'),change:2}],'sensor.fridge_energy':[{start:Date.parse('2026-11-09T23:00:00Z'),change:1}]};return {'sensor.tv_power':[{start:Date.parse('2026-11-10T06:00:00Z'),mean:1000}]};}};
 const registry={rows:[{id:'bath',name:'Bad'},{id:'living',name:'Wohnzimmer'}],entityRows:rows,allLabels:labels};
 const c=new PlatformController({storage:null,now:()=>now});c.update(hass,registry);
 c.save({...c.preferences,energy:{...c.preferences.energy,tariff:0.325}});
 assert.equal(c.energyAuto,true);
 assert.equal(await c.loadEnergy(14),true);
 assert.ok(calls.every(x=>x.type==='recorder/statistics_during_period'));
 assert.deepEqual(calls.map(x=>[x.period,x.statistic_ids]),[['day',['sensor.washer_energy','sensor.fridge_energy']],['hour',['sensor.tv_power']]]);
 const e=c.energy();
 assert.equal(e.auto,true);assert.equal(e.daily.value,4);assert.ok(Math.abs(e.daily.cost-1.3)<1e-9);assert.equal(e.power.value,900);
 assert.equal(c.series.length,1);
 c.save({...c.preferences,energy:{...c.preferences.energy,auto:false}});
 assert.equal(c.energyAuto,false);assert.equal(c.energy().auto,undefined);
});

test('rooms without equipment are left out; technical entities alone do not count',()=>{
 const st={'light.a':{state:'on',attributes:{}},'sensor.diag':{state:'1',attributes:{}}};
 const hass={user:{id:'one'},connection:{},hassUrl:p=>'https://ha.example'+p,language:'pt',states:st,services:{}};
 const registry={rows:[{id:'kitchen',name:'Küche'},{id:'empty',name:'Leer'},{id:'tech',name:'Technik'}],entityRows:[
  {id:'light.a',name:'A',domain:'light',areaId:'kitchen',labels:[]},
  {id:'sensor.diag',name:'Diag',domain:'sensor',areaId:'tech',entityCategory:'diagnostic',labels:[]}],allLabels:[]};
 const c=new PlatformController({storage:null});c.update(hass,registry);
 assert.deepEqual(c.rooms.map(a=>a.id),['kitchen']);
 assert.equal(c.areas.length,3);
 c.save({...c.preferences,hidden:['light.a']});
 assert.deepEqual(c.rooms.map(a=>a.id),[]);
});

test('new energy texts exist in every language',()=>{for(const d of Object.values(dictionaries))for(const k of ['tariffCents','tariffHint','energyAuto','energyAutoHint','energyAutoOne','energyAutoMany','energyAutoNone','cineTopToday','cinePerRoomToday','cineCostMonth'])assert.ok(d[k],k);});

test('rooms and "without a room" can be hidden by the owner; ids are validated',()=>{
 const st={'light.a':{state:'on',attributes:{}},'light.b':{state:'on',attributes:{}},'light.c':{state:'off',attributes:{}}};
 const hass={user:{id:'one'},connection:{},hassUrl:p=>'https://ha.example'+p,language:'pt',states:st,services:{}};
 const registry={rows:[{id:'kitchen',name:'Küche'},{id:'bath',name:'Bad'}],entityRows:[
  {id:'light.a',name:'A',domain:'light',areaId:'kitchen',labels:[]},{id:'light.b',name:'B',domain:'light',areaId:'bath',labels:[]},{id:'light.c',name:'C',domain:'light',areaId:'',labels:[]}],allLabels:[]};
 const c=new PlatformController({storage:null});c.update(hass,registry);
 assert.deepEqual(c.rooms.map(a=>a.id),['kitchen','bath']);assert.equal(c.showNoRoom,true);
 c.save({...c.preferences,hiddenRooms:['bath','__no_area','../x',5]});
 assert.deepEqual(c.preferences.hiddenRooms,['bath','__no_area']);
 assert.deepEqual(c.rooms.map(a=>a.id),['kitchen']);assert.equal(c.showNoRoom,false);
 assert.ok(c.state('light.c')); // the equipment itself stays available (start page widgets, energy)
 for(const d of Object.values(dictionaries))for(const k of ['roomsSettings','roomsSettingsHint','roomsShown','roomsShownHint','roomsEquipment','roomsEmpty','roomsHiddenShort','energyManual'])assert.ok(d[k],k);
});
