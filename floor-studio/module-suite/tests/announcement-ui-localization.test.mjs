import test from 'node:test';
import assert from 'node:assert/strict';
import {aureonModules} from '../src/module-settings.mjs';
import {sendAnnouncement} from '../src/announcements.mjs';
const mod=aureonModules.find(m=>m.id==='aureon.announcements');
function fixture(language='pt'){
 const building={floors:[{rooms:[{id:'bed',name:'Bedroom',area_id:'bedroom'}]}],settings:{mods:{}}};
 const hass={states:{'media_player.bed':{state:'idle'},'tts.demo':{state:'idle'}},entities:{'media_player.bed':{area_id:'bedroom'}}};
 let calls=0;
 return {building,host:{language:()=>language,building:()=>building,hass:()=>hass,updateBuilding:fn=>fn(building),callService:async()=>{calls++}},calls:()=>calls};
}
test('PT DE EN settings have localized speaker labels',()=>{
 for(const [lang,label] of [['pt','Alto-falante · Bedroom'],['de','Lautsprecher · Bedroom'],['en','Speaker · Bedroom']])assert.ok(mod.settings(fixture(lang).host).some(f=>f.label===label));
});
test('quiet hours can be saved in editor, including overnight',async()=>{
 const f=fixture();let fields=mod.settings(f.host);
 fields.find(x=>x.label==='Silêncio começa · Bedroom').set('22');
 fields=mod.settings(f.host);fields.find(x=>x.label==='Silêncio termina · Bedroom').set('7');
 assert.deepEqual(f.building.settings.mods[mod.id].quiet.bed,{from:22,to:7});
 const result=await sendAnnouncement(f.host,{message:'Hello',roomIds:['bed'],confirmed:true,now:new Date(2026,0,1,23)});
 assert.equal(result.reason,'quiet_hours');assert.equal(f.calls(),0);
});
test('fallback stays disabled by default and can be explicitly enabled',()=>{
 const f=fixture('en');const check=mod.settings(f.host).find(x=>x.label==='Allow default speaker fallback');
 assert.equal(check.value,false);check.set(true);
 assert.equal(f.building.settings.mods[mod.id].allowDefaultSpeaker,true);
});
test('quiet hours can be disabled without leaving stale active limits',()=>{
 const f=fixture();let fields=mod.settings(f.host);
 fields.find(x=>x.label==='Silêncio começa · Bedroom').set('22');
 fields=mod.settings(f.host);fields.find(x=>x.label==='Silêncio começa · Bedroom').set('off');
 assert.equal(f.building.settings.mods[mod.id].quiet.bed.from,null);
});
