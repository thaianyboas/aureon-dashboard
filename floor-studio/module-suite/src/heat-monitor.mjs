// AUREON Heat Monitor: original read-only Home Assistant telemetry adapter.
// Does not bundle or execute any paid NeonPlan3D extension.
export const id = 'aureon.heat_monitor';
export const locale = s => /^pt/i.test(s || '') ? 'pt' : /^de/i.test(s || '') ? 'de' : 'en';
const text = {
 pt:{fault:'Falha no sistema de aquecimento: {value}',low:'Eficiência baixa (COP {value})',none:'Nenhuma leitura de aquecimento configurada.',supply:'Ida',return:'Retorno'},
 de:{fault:'Heizungsstörung: {value}',low:'Niedrige Effizienz (COP {value})',none:'Keine Heizungswerte konfiguriert.',supply:'Vorlauf',return:'Rücklauf'},
 en:{fault:'Heating system fault: {value}',low:'Low efficiency (COP {value})',none:'No heating measurements configured.',supply:'Supply',return:'Return'}
};
const format = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
const invalid = new Set(['unknown','unavailable','none','']);
export function reading(hass, entityId, quantity = 'number') {
 if (!entityId || !hass?.states?.[entityId]) return null;
 const st = hass.states[entityId], raw = String(st.state).trim();
 if (invalid.has(raw.toLowerCase())) return null;
 const v = Number(raw.replace(',','.'));
 if (!Number.isFinite(v)) return null;
 const unit = String(st.attributes?.unit_of_measurement || '').toLowerCase().replace(/\s/g,'');
 if (quantity === 'temperature') return unit === '°f' || unit === 'f' ? (v-32)*5/9 : unit === 'k' ? v-273.15 : v;
 if (quantity === 'power') return unit === 'kw' ? v*1000 : unit === 'mw' ? v*1000000 : v;
 if (quantity === 'energy') return unit === 'wh' ? v/1000 : unit === 'mwh' ? v*1000 : v;
 return v;
}
export function heatState(hass, config = {}) {
 const e = config.entities || {};
 const supply = reading(hass,e.supply,'temperature'), returnTemp = reading(hass,e.return,'temperature');
 const power = reading(hass,e.power,'power'), thermalPower = reading(hass,e.thermalPower,'power');
 const heatToday = reading(hass,e.heatToday,'energy'), electricityToday = reading(hass,e.electricityToday,'energy');
 const explicitCop = reading(hass,e.cop);
 const computedCop = thermalPower !== null && power !== null && power > 50 ? thermalPower/power : null;
 const cop = explicitCop !== null ? explicitCop : computedCop;
 const faultRaw = e.fault ? hass?.states?.[e.fault]?.state : null;
 const fault = faultRaw && !['off','ok','false','0','unknown','unavailable','none'].includes(String(faultRaw).toLowerCase()) ? String(faultRaw).slice(0,100) : null;
 const dailyCop = heatToday !== null && electricityToday !== null && electricityToday > .3 ? heatToday/electricityToday : null;
 return {supply,returnTemp,outdoor:reading(hass,e.outdoor,'temperature'),power,thermalPower,heatToday,electricityToday,
  cop:cop !== null && cop > 0 && cop <= 12 ? cop : null,
  dailyCop:dailyCop !== null && dailyCop > 0 && dailyCop <= 12 ? dailyCop : null,
  spread:supply !== null && returnTemp !== null ? supply-returnTemp : null,
  fault,configured:Object.values(e).some(Boolean)};
}
export function heatAlerts(hass, config = {}, language = 'en') {
 const s = heatState(hass,config), l = locale(language), result = [];
 if (s.fault) result.push({kind:'aureon_heat_fault',text:format(text[l].fault,{value:s.fault}),color:[1,.3,.2]});
 // A low COP alone is not diagnostic. Opt-in threshold avoids unsolicited warnings.
 if (config.alertLowCop === true && s.cop !== null && s.cop < (config.minCop ?? 2) && s.thermalPower !== null && s.thermalPower > 0)
  result.push({kind:'aureon_heat_low_cop',text:format(text[l].low,{value:s.cop.toFixed(1)}),color:[1,.7,.25]});
 return result;
}
export const module = {api:1,id,
 watched(host) {const e=host.building?.()?.settings?.mods?.[id]?.entities || {};return [...new Set(Object.values(e).filter(v=>typeof v==='string' && v))];},
 alerts(host) {const cfg=host.building?.()?.settings?.mods?.[id] || {};return heatAlerts(host.hass?.(),cfg,host.language?.());},
 voice(sentence,host) {
  if (!/(aquecimento|calor|heizung|wärme|heating|heat pump)/i.test(sentence) || !/(como|status|estado|wie|status|how)/i.test(sentence)) return null;
  const cfg=host.building?.()?.settings?.mods?.[id] || {}, s=heatState(host.hass?.(),cfg),l=locale(host.language?.());
  if (!s.configured) return {text:text[l].none,highlight:[]};
  const chunks=[];
  if(s.supply!==null)chunks.push(`${text[l].supply} ${s.supply.toFixed(1)} °C`);
  if(s.returnTemp!==null)chunks.push(`${text[l].return} ${s.returnTemp.toFixed(1)} °C`);
  if(s.cop!==null)chunks.push(`COP ${s.cop.toFixed(1)}`);
  if(s.fault)chunks.push(format(text[l].fault,{value:s.fault}));
  return {text:chunks.join(', ') || text[l].none,highlight:[]};
 },
 help(language) {return locale(language)==='pt'?['Como está o aquecimento?']:locale(language)==='de'?['Wie läuft die Heizung?']:['How is the heating?'];}
};
export default module;
