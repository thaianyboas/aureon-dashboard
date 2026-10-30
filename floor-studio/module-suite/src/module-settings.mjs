// Optional GUI settings decorators using NeonPlan3D's original ModuleField API.
import windowWatch from './window-watch.mjs';
import announcements from './announcements.mjs';
import heat from './heat-monitor.mjs';
import house from './house-answers.mjs';
const configs={window_watch:windowWatch,announcements,heat_monitor:heat,house_answers:house};
const fields={
 window_watch:[['coldThreshold','Frio abaixo de (°C)',[12,5,10,15,18]],['coldMinutes','Janela aberta (min)',[20,5,10,30,60]],['heatMinutes','Aquecimento ligado (min)',[10,5,15,20,30]]],
 heat_monitor:[['minCop','COP mínimo',[2,1.5,2.5,3,3.5]]]
};
const uiLocale = language => /^pt/i.test(language || 'pt') ? 'pt' : /^de/i.test(language || '') ? 'de' : 'en';
const words = {
 pt: {weather:'Sensor meteorológico', tts:'TTS', defaultSpeaker:'Alto-falante padrão', speaker:'Alto-falante', fallback:'Permitir alto-falante padrão como alternativa', quietStart:'Silêncio começa', quietEnd:'Silêncio termina', lowCop:'Avisar COP baixo', local:'Respostas locais, somente leitura. Não executa automações.', supply:'Temperatura de ida', return:'Temperatura de retorno', outdoor:'Temperatura externa', power:'Potência elétrica', thermalPower:'Potência térmica', cop:'COP', heatToday:'Energia térmica hoje (kWh)', electricityToday:'Eletricidade hoje (kWh)', fault:'Falha', coldThreshold:'Frio abaixo de (°C)', coldMinutes:'Janela aberta (min)', heatMinutes:'Aquecimento ligado (min)', minCop:'COP mínimo', off:'Desativado'},
 de: {weather:'Wetterentität', tts:'TTS-Stimme', defaultSpeaker:'Standardlautsprecher', speaker:'Lautsprecher', fallback:'Standardlautsprecher als Ersatz erlauben', quietStart:'Ruhezeit beginnt', quietEnd:'Ruhezeit endet', lowCop:'Niedrigen COP melden', local:'Lokale Antworten, nur lesend. Keine Automationen.', supply:'Vorlauf', return:'Rücklauf', outdoor:'Außentemperatur', power:'Elektrische Leistung', thermalPower:'Wärmeleistung', cop:'COP', heatToday:'Wärme heute (kWh)', electricityToday:'Strom heute (kWh)', fault:'Störung', coldThreshold:'Kalt unter (°C)', coldMinutes:'Fenster offen (Min.)', heatMinutes:'Heizung an (Min.)', minCop:'COP Minimum', off:'Deaktiviert'},
 en: {weather:'Weather entity', tts:'TTS voice', defaultSpeaker:'Default speaker', speaker:'Speaker', fallback:'Allow default speaker fallback', quietStart:'Quiet hours start', quietEnd:'Quiet hours end', lowCop:'Warn about low COP', local:'Local read-only answers. No automations.', supply:'Supply temperature', return:'Return temperature', outdoor:'Outdoor temperature', power:'Electrical power', thermalPower:'Thermal power', cop:'COP', heatToday:'Heat today (kWh)', electricityToday:'Electricity today (kWh)', fault:'Fault', coldThreshold:'Cold below (°C)', coldMinutes:'Window open (min)', heatMinutes:'Heating on (min)', minCop:'Minimum COP', off:'Disabled'}
};
const hours = (off) => [{id:'off',label:off},...Array.from({length:24},(_,h)=>({id:String(h),label:`${String(h).padStart(2,'0')}:00`}))];
function setConfig(host,id,patch){
 if(typeof host.updateBuilding!=='function')return;
 return host.updateBuilding(next=>{next.settings ||= {};next.settings.mods ||= {};next.settings.mods[id]={...(next.settings.mods[id]||{}),...patch};});
}
export function attachSettings(mod,kind){
 const prior=mod.settings?.bind(mod);
 mod.settings=host=>{
  const cfg=host.building?.()?.settings?.mods?.[mod.id]||{};
  const w=words[uiLocale(host.language?.())];
  const result=[{kind:'heading',text:kind==='window_watch'?'AUREON · Fenster-Wächter':kind==='announcements'?'AUREON · Durchsagen':kind==='heat_monitor'?'AUREON · Heat Monitor':'AUREON · Das Haus antwortet'}];
  if(kind==='house_answers')result.push({kind:'text',text:w.local});
  if(kind==='window_watch'){
   result.push({kind:'entity',label:w.weather,value:cfg.weatherEntity||null,filter:id=>id.startsWith('weather.'),set:v=>setConfig(host,mod.id,{weatherEntity:v})});
  }
  if(kind==='announcements'){
   result.push({kind:'entity',label:w.tts,value:cfg.ttsEntity||null,filter:id=>id.startsWith('tts.'),set:v=>setConfig(host,mod.id,{ttsEntity:v})});
   result.push({kind:'entity',label:w.defaultSpeaker,value:cfg.defaultSpeaker||null,filter:id=>id.startsWith('media_player.'),set:v=>setConfig(host,mod.id,{defaultSpeaker:v})});
  }
  if(kind==='announcements'){
   result.push({kind:'check',label:w.fallback,value:cfg.allowDefaultSpeaker===true,set:v=>setConfig(host,mod.id,{allowDefaultSpeaker:v===true})});
   const rooms=(host.building?.()?.floors||[]).flatMap(f=>f.rooms||[]);
   for(const room of rooms){
    const name=room.name||room.id;
    result.push({kind:'entity',label:`${w.speaker} · ${name}`,value:cfg.roomSpeakers?.[room.id]||null,filter:id=>id.startsWith('media_player.'),set:v=>setConfig(host,mod.id,{roomSpeakers:{...(host.building?.()?.settings?.mods?.[mod.id]?.roomSpeakers||{}),[room.id]:v}})});
    const quiet=cfg.quiet?.[room.id]||{};
    for(const [key,label] of [['from',w.quietStart],['to',w.quietEnd]]){
     const current=Number.isInteger(quiet[key]) ? String(quiet[key]) : 'off';
     result.push({kind:'select',label:`${label} · ${name}`,value:current,options:hours(w.off),set:v=>{
      const existing=host.building?.()?.settings?.mods?.[mod.id]?.quiet||{};
      const updated={...(existing[room.id]||{}),[key]:v==='off'?null:Number(v)};
      setConfig(host,mod.id,{quiet:{...existing,[room.id]:updated}});
     }});
    }
   }
  }
  if(kind==='heat_monitor'){
   for(const [role,label] of [['supply','Vorlauf'],['return','Rücklauf'],['outdoor','Temperatura externa'],['power','Potência elétrica'],['thermalPower','Potência térmica'],['cop','COP'],['heatToday','Energia térmica hoje (kWh)'],['electricityToday','Energia elétrica hoje (kWh)'],['fault','Falha']])result.push({kind:'entity',label:w[role]||label,value:cfg.entities?.[role]||null,filter:id=>/^(sensor|binary_sensor)\./.test(id),set:v=>setConfig(host,mod.id,{entities:{...(host.building?.()?.settings?.mods?.[mod.id]?.entities||{}),[role]:v}})});
   result.push({kind:'check',label:w.lowCop,value:cfg.alertLowCop===true,set:v=>setConfig(host,mod.id,{alertLowCop:v})});
  }
  for(const [key,label,options] of fields[kind]||[])result.push({kind:'select',label:w[key]||label,value:String(cfg[key]??options[0]),options:options.map(n=>({id:String(n),label:String(n)})),set:v=>setConfig(host,mod.id,{[key]:Number(v)})});
  return [...result,...(prior?.(host)||[])];
 };
 return mod;
}
export const aureonModules=[attachSettings(windowWatch,'window_watch'),attachSettings(announcements,'announcements'),attachSettings(heat,'heat_monitor'),attachSettings(house,'house_answers')];
export default aureonModules;
