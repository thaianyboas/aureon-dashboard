export const defaults=()=>({schema:1,language:'auto',appearance:'auto',palette:'forest',density:'compact',hidden:[],widgets:{music:true,weather:true,people:true,energy:true,waste:true,security:true},energy:{power:'',total:'',daily:'',weekly:'',monthly:'',yearly:'',tariff:null,currency:'EUR'},waste:[],roomFloor:{},music:{entity:'',appearance:'auto',providers:{},spotcastTargets:[]}});
const id=value=>typeof value==='string'&&/^[a-z_]+\.[a-z0-9_]+$/.test(value)?value:'';
export function validatePreferences(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schema!==1)throw new Error('Invalid configuration');
 const out=defaults();
 for(const [key,allowed] of Object.entries({language:['auto','en','de','pt'],appearance:['auto','dark','light','custom'],density:['compact','comfortable']}))if(allowed.includes(raw[key]))out[key]=raw[key];
 if(['black-gold-royal','black-bordeaux-royal','purple','blue','emerald','burgundy','rose-noir','gold','pearl','obsidian','sapphire','forest','terracotta','sand','ocean','amethyst','copper','sage','arctic','ruby','lavender','graphite'].includes(raw.palette))out.palette=raw.palette;
 if(Array.isArray(raw.hidden))out.hidden=[...new Set(raw.hidden.map(id).filter(Boolean))].slice(0,3000);
 if(raw.widgets)for(const key of Object.keys(out.widgets))if(typeof raw.widgets[key]==='boolean')out.widgets[key]=raw.widgets[key];
 if(raw.energy){for(const key of ['power','total','daily','weekly','monthly','yearly'])out.energy[key]=id(raw.energy[key]);const rate=Number(raw.energy.tariff);if(raw.energy.tariff!==null&&String(raw.energy.tariff??'').trim()!==''&&Number.isFinite(rate)&&rate>=0&&rate<=10000)out.energy.tariff=rate;if(/^[A-Z]{3}$/.test(raw.energy.currency||''))out.energy.currency=raw.energy.currency;}
 if(Array.isArray(raw.waste))out.waste=[...new Set(raw.waste.map(id).filter(x=>x.startsWith('sensor.')||x.startsWith('calendar.')))].slice(0,30);
 if(raw.roomFloor&&typeof raw.roomFloor==='object')for(const [area,floor] of Object.entries(raw.roomFloor).slice(0,200))if(/^[a-zA-Z0-9_-]{1,100}$/.test(area)&&typeof floor==='string'&&floor.length<=100)out.roomFloor[area]=floor;
 if(raw.music){out.music.entity=id(raw.music.entity);if(['auto','dark','light','custom'].includes(raw.music.appearance))out.music.appearance=raw.music.appearance;
  if(Array.isArray(raw.music.spotcastTargets))out.music.spotcastTargets=raw.music.spotcastTargets.map(id).filter(x=>x.startsWith('media_player.')).slice(0,30);
  if(raw.music.providers&&typeof raw.music.providers==='object')for(const [entity,provider] of Object.entries(raw.music.providers))if(id(entity)&&['native','spotifyplus'].includes(provider))out.music.providers[entity]=provider;
 }
 return out;
}
export function scopeKey(hass){
 if(!hass?.user?.id)return null;
 let origin='local';try{origin=new URL(hass.hassUrl?.('/')||globalThis.location?.origin||'http://local').origin;}catch{}
 return 'aureon.preferences.v1:'+encodeURIComponent(origin)+':'+encodeURIComponent(hass.user.id);
}
export function loadPreferences(storage,key){if(!key)return defaults();try{return validatePreferences(JSON.parse(storage?.getItem(key)||'null'));}catch{return defaults();}}
export function savePreferences(storage,key,value){const clean=validatePreferences(value);if(key)storage?.setItem(key,JSON.stringify(clean));return clean;}
export function importPreferences(text){if(typeof text!=='string'||text.length>100000)throw new Error('Configuration too large');return validatePreferences(JSON.parse(text));}
