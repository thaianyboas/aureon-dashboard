import {cleanLayouts} from './card-layout-model.mjs';
import {equipmentKinds} from './discovery.mjs';
export const defaults=()=>({schema:1,floorLook:'real',language:'auto',appearance:'auto',palette:'forest',accent:'',look:'cinema',density:'compact',hidden:[],labelVisibility:{include:[],exclude:[]},labelKinds:{},equipmentOverrides:{},cardLayouts:{},widgets:{music:true,weather:true,people:true,energy:true,waste:true,security:true},energy:{power:'',total:'',daily:'',weekly:'',monthly:'',yearly:'',tariff:null,currency:'EUR'},waste:[],roomFloor:{},roomImages:{},music:{entity:'',appearance:'auto',providers:{},spotcastTargets:[]}});
// Room pictures: the owner's own files in Home Assistant (/local/…, media/image proxy) or an https address. Never embedded data.
export function roomImageUrl(value){if(typeof value!=='string'||value.length>2048)return '';const v=value.trim();if(v==='none'||/^preset:(living|kitchen|dining|bedroom|bathroom|hallway|balcony|entrance|controlroom)$/.test(v))return v;if(/^\/(local|media|api\/image\/serve)\/[^\s"'<>\\]+$/.test(v)&&!v.includes('..'))return v;try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
const id=value=>typeof value==='string'&&/^[a-z_]+\.[a-z0-9_]+$/.test(value)?value:'';
export function validatePreferences(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schema!==1)throw new Error('Invalid configuration');
 const out=defaults();out.cardLayouts=cleanLayouts(raw.cardLayouts);
 for(const [key,allowed] of Object.entries({floorLook:['real'],appearance:['auto','dark','light','custom'],density:['compact','comfortable'],look:['cinema','classic']}))if(allowed.includes(raw[key]))out[key]=raw[key];
 if(typeof raw.accent==='string'&&/^#[0-9a-fA-F]{6}$/.test(raw.accent))out.accent=raw.accent.toLowerCase();
 if(['cinema','aubergine-balance','black-gold-royal','black-bordeaux-royal','purple','blue','emerald','burgundy','rose-noir','gold','pearl','obsidian','sapphire','forest','forest-botanical','terracotta','sand','ocean','amethyst','copper','sage','arctic','ruby','lavender','graphite','silver-penthouse','amethyst-lounge'].includes(raw.palette))out.palette=raw.palette;
 if(Array.isArray(raw.hidden))out.hidden=[...new Set(raw.hidden.map(id).filter(Boolean))].slice(0,3000);
 // Labels chosen in Settings (Home Assistant label ids).
 const labelIds=list=>Array.isArray(list)?[...new Set(list.filter(x=>typeof x==='string'&&/^[a-z0-9_]{1,100}$/.test(x)))].slice(0,100):[];
 if(raw.labelVisibility&&typeof raw.labelVisibility==='object'){out.labelVisibility={include:labelIds(raw.labelVisibility.include),exclude:labelIds(raw.labelVisibility.exclude)};}
 if(raw.labelKinds&&typeof raw.labelKinds==='object'&&!Array.isArray(raw.labelKinds))for(const kind of equipmentKinds){const ids=labelIds(raw.labelKinds[kind]);if(ids.length)out.labelKinds[kind]=ids;}
 if(raw.equipmentOverrides&&typeof raw.equipmentOverrides==='object')for(const [entity,kind] of Object.entries(raw.equipmentOverrides).slice(0,3000))if(id(entity)&&equipmentKinds.includes(kind))out.equipmentOverrides[entity]=kind;
 if(raw.widgets)for(const key of Object.keys(out.widgets))if(typeof raw.widgets[key]==='boolean')out.widgets[key]=raw.widgets[key];
 if(raw.energy){for(const key of ['power','total','daily','weekly','monthly','yearly'])out.energy[key]=id(raw.energy[key]);const rate=Number(raw.energy.tariff);if(raw.energy.tariff!==null&&String(raw.energy.tariff??'').trim()!==''&&Number.isFinite(rate)&&rate>=0&&rate<=10000)out.energy.tariff=rate;if(/^[A-Z]{3}$/.test(raw.energy.currency||''))out.energy.currency=raw.energy.currency;}
 if(Array.isArray(raw.waste))out.waste=[...new Set(raw.waste.map(id).filter(x=>x.startsWith('sensor.')||x.startsWith('calendar.')))].slice(0,30);
 if(raw.roomFloor&&typeof raw.roomFloor==='object')for(const [area,floor] of Object.entries(raw.roomFloor).slice(0,200))if(/^[a-zA-Z0-9_-]{1,100}$/.test(area)&&typeof floor==='string'&&floor.length<=100)out.roomFloor[area]=floor;
 if(raw.roomImages&&typeof raw.roomImages==='object'&&!Array.isArray(raw.roomImages))for(const [area,url] of Object.entries(raw.roomImages).slice(0,200)){const clean=roomImageUrl(url);if(/^[a-zA-Z0-9_-]{1,100}$/.test(area)&&clean)out.roomImages[area]=clean;}
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
