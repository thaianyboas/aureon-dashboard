import test from 'node:test';
import assert from 'node:assert/strict';
import {aureonModules} from '../src/module-settings.mjs';
import {sendAnnouncement,resolveTargets} from '../src/announcements.mjs';
const mod=aureonModules.find(m=>m.id==='aureon.announcements');
function fixture(){
 const building={floors:[{rooms:[{id:'k',name:'Küche',area_id:'kitchen'},{id:'l',name:'Wohnzimmer',area_id:'living'}]}],settings:{mods:{}}};
 const hass={states:{'media_player.kitchen':{state:'idle'},'media_player.living':{state:'idle'},'tts.google_translate':{state:'unknown'}},entities:{'media_player.kitchen':{area_id:'kitchen'},'media_player.living':{area_id:'living'}}};
 const calls=[];
 const host={building:()=>building,hass:()=>hass,updateBuilding:fn=>fn(building),callService:async(...args)=>{calls.push(args)}};
 return {host,building,calls};
}
test('announcement GUI persists selected TTS and room speaker',()=>{
 const {host,building}=fixture();const fields=mod.settings(host);
 fields.find(f=>f.label==='TTS').set('tts.google_translate');
 fields.find(f=>f.label==='Alto-falante · Küche').set('media_player.kitchen');
 assert.equal(building.settings.mods[mod.id].ttsEntity,'tts.google_translate');
 assert.equal(building.settings.mods[mod.id].roomSpeakers.k,'media_player.kitchen');
});
test('announcement dispatch reads saved GUI config without explicit config argument',async()=>{
 const {host,calls}=fixture();const fields=mod.settings(host);
 fields.find(f=>f.label==='TTS').set('tts.google_translate');
 fields.find(f=>f.label==='Alto-falante · Küche').set('media_player.kitchen');
 const result=await sendAnnouncement(host,{message:'Olá',roomIds:['k'],confirmed:true});
 assert.equal(result.ok,true);assert.deepEqual(result.targets,['media_player.kitchen']);assert.equal(calls.length,1);
});
test('room speaker selection uses persisted configuration',()=>{
 const {host}=fixture();mod.settings(host).find(f=>f.label==='Alto-falante · Küche').set('media_player.living');
 assert.deepEqual(resolveTargets(host,['k']),['media_player.living']);
});
test('no announcement without explicit confirmation even with saved settings',async()=>{
 const {host,calls}=fixture();mod.settings(host).find(f=>f.label==='TTS').set('tts.google_translate');
 const result=await sendAnnouncement(host,{message:'Olá',roomIds:['k']});
 assert.equal(result.reason,'confirmation_required');assert.equal(calls.length,0);
});
test('heat monitor GUI exposes both daily energy sensors',()=>{
 const {host}=fixture();const heat=aureonModules.find(m=>m.id==='aureon.heat_monitor');
 const fields=heat.settings(host);
 fields.find(f=>f.label==='Energia térmica hoje (kWh)').set('sensor.thermal_energy');
 fields.find(f=>f.label==='Eletricidade hoje (kWh)').set('sensor.electric_energy');
 assert.equal(host.building().settings.mods[heat.id].entities.heatToday,'sensor.thermal_energy');
 assert.equal(host.building().settings.mods[heat.id].entities.electricityToday,'sensor.electric_energy');
});
