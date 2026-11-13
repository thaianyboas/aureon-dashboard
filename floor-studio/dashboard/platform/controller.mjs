import {labelVisible,equipmentKind,hasSemanticLabel} from './discovery.mjs';
import {bindingFields,bindingTargets} from './bindings.mjs';
import {defaults,scopeKey,loadPreferences,savePreferences,validatePreferences,importPreferences} from './preferences.mjs';
import {actionsFor,parameterAction,isAvailable} from './actions.mjs';
import {wasteCollections,fetchWasteCalendar} from '../integrations/waste.mjs';
import {consumerLabelIds,autoConsumers,autoTotals} from './energy-auto.mjs';
import {dreameRobots,serviceAvailable,DREAME} from '../integrations/dreame.mjs';
const safeStorage=()=>{try{return globalThis.localStorage;}catch{return null;}};
const ENERGY={Wh:.001,kWh:1,MWh:1000},POWER={W:1,kW:1000,MW:1000000};
export function energyValue(state,kind='energy'){if(!isAvailable(state)||!String(state.state).trim())return null;const map=kind==='power'?POWER:ENERGY,unit=state.attributes?.unit_of_measurement,v=Number(state.state);return Number.isFinite(v)&&Object.hasOwn(map,unit)?v*map[unit]:null;}
export function statisticSeries(response,id){const list=response?.[id];return (Array.isArray(list)?list:[]).filter(x=>Number.isFinite(Number(x.start))&&x.change!==null&&Number.isFinite(Number(x.change))).map(x=>({time:Number(x.start)<1e11?Number(x.start)*1000:Number(x.start),value:Number(x.change)})).sort((a,b)=>a.time-b.time);}
export class PlatformController{
 constructor({storage=safeStorage(),now=()=>Date.now()}={}){this.storage=storage;this.now=now;this.hass=null;this.registry=null;this.preferences=defaults();this.scope=null;this.connection=null;this.epoch=0;this.listeners=new Set();this.busy=new Set();this.errors={};this.events={};this.series=[];this.history={};this.floors=[];this.nativeRevision=null;this.answer='';this.conversationId=null;this._confirmation=null;this.storageError=false;this._autoStats=null;this._autoTried=0;this._rows=[];this._allRows=[];this._byId=new Map();this._visibility='';this.floors=[];this.nativeRevision=null;}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 emit(){for(const fn of this.listeners)fn();}
 update(hass,registry){const key=scopeKey(hass);if(key!==this.scope||hass?.connection!==this.connection){const changed=key!==this.scope;this.scope=key;this._autoStats=null;this._autoTried=0;this.connection=hass?.connection;this.epoch++;this.events={};this.series=[];this.history={};this.floors=[];this.nativeRevision=null;this.answer='';this.conversationId=null;this._confirmation=null;this.busy.clear();this.errors={};if(changed)this.preferences=loadPreferences(this.storage,key);this._syncFromAccount(hass,key);}
 this.hass=hass;this.registry=registry;
 // speed: the row index only depends on the registry, the hidden list and which entities exist — not on every
 // state change (HA sends one hass object per change, often several per second)
 const states=hass?.states,count=states?Object.keys(states).length:0,ik=this._indexKey;
 if(!ik||ik[0]!==registry||ik[1]!==registry?.entityRows||ik[2]!==registry?.entityRows?.length||ik[3]!==this.preferences.hidden||ik[4]!==count||ik[5]!==this.scope){this._indexKey=[registry,registry?.entityRows,registry?.entityRows?.length,this.preferences.hidden,count,this.scope];this.reindex();}
 this.emit();}
 get language(){return this.hass?.locale?.language||this.hass?.language||'en';}
 reindex(){const hidden=new Set(this.preferences.hidden);this._allRows=this.registry?.entityRows?.filter(r=>this.hass?.states?.[r.id]&&!r.disabled&&!r.hidden)||[];this._rows=this._allRows.filter(r=>!hidden.has(r.id)&&labelVisible(r,this.preferences,this.labels,equipmentKind(r,this.hass?.states?.[r.id],this.preferences,this.labels)));this._byId=new Map(this._rows.map(r=>[r.id,r]));const signature=this._rows.map(r=>r.id).sort().join('\n');if(signature!==this._visibility){this._visibility=signature;this.epoch++;this._autoTried=0;this.answer='';this.conversationId=null;this.events={};this.history={};this.series=[];this._confirmation=null;this.busy.clear();this.errors={};}}
 get labels(){return this.registry?.allLabels||[];}
 kind(row){return equipmentKind(row,this.hass?.states?.[row.id],this.preferences,this.labels);}
 get rows(){return this._rows;}
 get allRows(){return this._allRows;}
 state(id){return this._byId.has(id)?this.hass?.states?.[id]:null;}
 list(domains){return this.rows.filter(r=>domains.includes(r.domain));}
 get areas(){return this.registry?.rows||[];}
 // Owner 2026-11-10: a room without any equipment is left out of the dashboard (rooms page, start page, filters).
 // Technical/diagnostic entities alone do not count. Settings still list every Home Assistant area.
 get rooms(){const off=this.preferences.hiddenRooms;if(this._roomsFor!==this._rows||this._roomsAreas!==this.areas||this._roomsOff!==off||this._roomNames!==this.preferences.roomNames){this._roomsFor=this._rows;this._roomsAreas=this.areas;this._roomsOff=off;this._roomNames=this.preferences.roomNames;const used=new Set(this._rows.filter(r=>r.areaId&&this.kind(r)!=='technical').map(r=>r.areaId)),hide=new Set(off||[]);this._roomList=this.areas.filter(a=>used.has(a.id)&&!hide.has(a.id)).map(a=>this._roomNames[a.id]?{...a,name:this._roomNames[a.id]}:a);}return this._roomList;}
 // Owner 2026-11-10: rooms (and "without a room") can be hidden in Settings → Cômodos.
 get showNoRoom(){return !(this.preferences.hiddenRooms||[]).includes('__no_area');}
 // Dreame robots (integrations/dreame.mjs): only visible entities; a call is sent only after a tap, only to a Dreame entity
 // and only when Home Assistant offers that service.
 dreame(){if(this._dreameFor!==this._rows){this._dreameFor=this._rows;this._dreame=dreameRobots(this._rows,this.hass?.states||{});}return this._dreame;}
 async dreameCall(call){const id=call?.data?.entity_id,row=typeof id==='string'&&this._byId.get(id);if(!row||!this.state(id)||row.source!==DREAME||!serviceAvailable(this.hass?.services,call)||hasSemanticLabel(row,this.labels,'systemgeraete_dashboard'))return false;
  return this.request('action:'+id,async()=>{await this.hass.callService(call.domain,call.service,call.data);return true;});}
 // Automatic energy: devices with the Label "Verbraucht" (see energy-auto.mjs). Owner can switch it off in Settings.
 consumers(){const rows=this._allRows,labels=this.labels,hidden=this.preferences.hidden,k=this._consKey;if(!k||k[0]!==rows||k[1]!==labels||k[2]!==hidden){this._consKey=[rows,labels,hidden];const h=new Set(hidden);this._consumers=autoConsumers(rows.filter(r=>!h.has(r.id)),this.hass?.states,consumerLabelIds(labels));}return this._consumers;}
 get energyAuto(){return this.preferences.energy.auto!==false&&this.consumers().length>0;}
 autoEnergy(){if(!this.energyAuto)return null;if(this.hass?.callWS&&!this.busy.has('energy')&&this.now()-this._autoTried>900000){this._autoTried=this.now();Promise.resolve().then(()=>this.loadEnergy(30));}
  return autoTotals(this.consumers(),this._autoStats,{timeZone:this.hass?.config?.time_zone||'UTC',now:this.now(),states:this.hass?.states||{}});}
 // Preferences follow the Home Assistant user to every device (tablet, phone, iSG): a copy is kept in that user's own
 // frontend data (frontend/set_user_data, a per-user store; not a service call). The newest copy wins.
 _stamp(key){try{return Number(this.storage?.getItem(key+':at'))||0;}catch{return 0;}}
 _setStamp(key,at){try{this.storage?.setItem(key+':at',String(at));}catch{}}
 async _syncFromAccount(hass,key){const conn=hass?.connection;if(!key||!conn?.sendMessagePromise)return;try{const res=await conn.sendMessagePromise({type:'frontend/get_user_data',key:'aureon_preferences'});if(key!==this.scope)return;const remote=res?.value,local=this._stamp(key);if(remote&&Number(remote.at)>local&&remote.preferences){const clean=validatePreferences(remote.preferences);this._indexKey=null;this.preferences=savePreferences(this.storage,key,clean);this._setStamp(key,Number(remote.at));this.reindex();this.emit();}else if(local>Number(remote?.at||0))this._pushToAccount();}catch{}}
 _pushToAccount(){const key=this.scope,conn=this.hass?.connection;if(!key||!conn?.sendMessagePromise)return;clearTimeout(this._pushTimer);this._pushTimer=setTimeout(()=>{if(key!==this.scope)return;conn.sendMessagePromise({type:'frontend/set_user_data',key:'aureon_preferences',value:{at:this._stamp(key)||Date.now(),preferences:this.preferences}}).catch(()=>{});},800);}
 save(value){this._indexKey=null;const before=this.preferences.energy.total,beforeAuto=this.preferences.energy.auto;try{this.preferences=savePreferences(this.storage,this.scope,value);this.storageError=false;if(this.scope){this._setStamp(this.scope,this.now());this._pushToAccount();}}catch{this.preferences=validatePreferences(value);this.storageError=true;}this.reindex();if(before!==this.preferences.energy.total||beforeAuto!==this.preferences.energy.auto){this.series=[];this._autoStats=null;this._autoTried=0;}this.emit();}
 patch(key,value){this.save({...this.preferences,[key]:value});}
 import(text){this.save(importPreferences(text));}
 export(){return JSON.stringify(validatePreferences(this.preferences),null,2);}
 async request(key,fn){if(this.busy.has(key))return false;const epoch=this.epoch;this.busy.add(key);delete this.errors[key];this.emit();const current=()=>epoch===this.epoch;try{const result=await fn(current);return current()?result:false;}catch(e){if(current())this.errors[key]=String(e?.message||e);return false;}finally{if(current()){this.busy.delete(key);this.emit();}}}
 canControl(id){return !!this.state(id)&&!hasSemanticLabel(this._byId.get(id),this.labels,'systemgeraete_dashboard');}
 actions(id){const row=this._byId.get(id),s=this.state(id);return s&&!hasSemanticLabel(row,this.labels,'systemgeraete_dashboard')?actionsFor(s,this.hass?.services):[];}
 confirm(action){if(!action)return null;this._confirmation={entityId:action.entityId,key:action.key,epoch:this.epoch,expires:this.now()+60000,token:Symbol()};return this._confirmation.token;}
 async act(id,key,{value,token,code}={}){const state=this.state(id);if(!state||hasSemanticLabel(this._byId.get(id),this.labels,'systemgeraete_dashboard'))return false;
 const action=value===undefined?this.actions(id).find(a=>a.key===key):parameterAction(state,this.hass?.services,key,value);if(!action)return false;
 if(action.sensitive){const proof=this._confirmation;if(!proof||proof.token!==token||proof.entityId!==id||proof.key!==key||proof.epoch!==this.epoch||proof.expires<this.now())return false;this._confirmation=null;}
 const data={...action.data,entity_id:id};if(code!==undefined&&code!=='')data.code=String(code).slice(0,100);
 return this.request('action:'+id,async()=>{await this.hass.callService(action.domain,action.service,data);return true;});}
 energy(){const config=this.preferences.energy,result={tariff:config.tariff,currency:config.currency};
 const auto=this.autoEnergy();if(auto){const cost=v=>v===null||config.tariff===null?null:v*config.tariff,blank={value:null,cost:null,entityId:''},manual=energyValue(this.state(config.power),'power');
  return {...result,auto:true,consumers:auto.consumers,power:{value:auto.watts??manual,cost:null,entityId:auto.watts===null?config.power:''},total:blank,daily:{value:auto.today,cost:cost(auto.today),entityId:''},weekly:blank,monthly:{value:auto.month,cost:cost(auto.month),entityId:''},yearly:blank};}
for(const key of ['power','total','daily','weekly','monthly','yearly']){const value=energyValue(this.state(config[key]),key==='power'?'power':'energy');result[key]={value,cost:key==='power'||value===null||config.tariff===null?null:value*config.tariff,entityId:config[key]};}return result;}
 async loadEnergy(days=14){
 if(this.energyAuto){if(![7,14,30,90].includes(days)||!this.hass?.callWS)return false;this._autoTried=this.now();
  const list=this.consumers(),energyIds=list.map(x=>x.energyId).filter(Boolean),powerIds=list.filter(x=>!x.energyId&&x.powerId).map(x=>x.powerId);
  const start=new Date(this.now()-(Math.max(days,32)+1)*86400000).toISOString(),end=new Date(this.now()).toISOString(),ask=(ids,period,type,units)=>ids.length?this.hass.callWS({type:'recorder/statistics_during_period',start_time:start,end_time:end,statistic_ids:ids,period,types:[type],units}):{};
  return this.request('energy',async current=>{const [energy,power]=await Promise.all([ask(energyIds,'day','change',{energy:'kWh'}),ask(powerIds,'hour','mean',{power:'W'})]);if(current()){this._autoStats={energy,power};this.series=autoTotals(list,this._autoStats,{timeZone:this.hass?.config?.time_zone||'UTC',now:this.now()}).series;}return true;});}
 const id=this.preferences.energy.total;if(energyValue(this.state(id))===null||!this.hass?.callWS||![7,14,30,90].includes(days))return false;const start=new Date(this.now()-days*86400000).toISOString(),end=new Date(this.now()).toISOString();return this.request('energy',async current=>{const response=await this.hass.callWS({type:'recorder/statistics_during_period',start_time:start,end_time:end,statistic_ids:[id],period:'day',types:['change'],units:{energy:'kWh'}});if(current())this.series=statisticSeries(response,id);return true;});}
 get waste(){const now=new Date(this.now()).toISOString(),timeZone=this.hass?.config?.time_zone||'UTC';return this.preferences.waste.flatMap(id=>wasteCollections(this.state(id),{events:this.events[id]||[],now,timeZone})).sort((a,b)=>a.days-b.days||a.type.localeCompare(b.type));}
 async loadCalendars(days=14,ids=null){if(![7,14,30,90].includes(days))return false;const selected=(ids||this.preferences.waste).filter(id=>this.state(id)&&id.startsWith('calendar.'));return Promise.all(selected.map(id=>this.request('calendar:'+id,async current=>{const events=await fetchWasteCalendar(this.hass,id,{start:new Date(this.now()-86400000).toISOString(),end:new Date(this.now()+days*86400000).toISOString()});if(current())this.events[id]=events;return true;})));}
 async loadFloors(){if(!this.hass?.callWS)return false;return this.request('floors',async current=>{const response=await this.hass.callWS({type:'aureon_floor/building/get'});if(!Array.isArray(response?.building?.floors))throw new Error('Invalid Floor Studio response');if(current()){this.floors=bindingTargets(response.building);this.nativeRevision=Number.isInteger(response.revision)?response.revision:null;}return true;});}
 async bind(floorId,kind,targetId,field,value){
 if(!this.hass?.user?.is_admin||!Number.isInteger(this.nativeRevision)||!Object.hasOwn(bindingFields[kind]||{},field))return false;
 const floor=this.floors.find(f=>f.id===floorId),target=floor?.targets.find(t=>t.id===targetId&&t.kind===kind);if(!target)return false;
 if(value!==null&&(typeof value!=='string'||value.length>255))return false;
 if(value!==null&&value!=='none'){
  if(field==='area_id'){if(!this.areas.some(a=>a.id===value))return false;}
  else if(!this.state(value)||!bindingFields[kind][field].includes(value.split('.')[0]))return false;
 }
 return this.request('binding',async current=>{const result=await this.hass.callWS({type:'aureon_floor/building/bind',revision:this.nativeRevision,floor_id:floorId,kind,target_id:targetId,field,value});if(!current())return false;this.nativeRevision=result.revision;await this.loadFloors();return true;});
 }
 async loadHistory(id){if(!this.state(id)||!this.hass?.callApi)return false;const start=new Date(this.now()-86400000).toISOString();return this.request('history:'+id,async current=>{const result=await this.hass.callApi('GET',`history/period/${encodeURIComponent(start)}?filter_entity_id=${encodeURIComponent(id)}&minimal_response&no_attributes`);if(current())this.history[id]=Array.isArray(result?.[0])?result[0].slice(-40):[];return true;});}
 query(text){const words=String(text||'').trim().toLocaleLowerCase();if(!words)return '';const list=this.rows.filter(r=>r.name.toLocaleLowerCase().includes(words)||r.id.toLocaleLowerCase().includes(words));this.answer=list.length?list.slice(0,30).map(r=>`${r.name}: ${this.state(r.id)?.state}${this.state(r.id)?.attributes?.unit_of_measurement?' '+this.state(r.id).attributes.unit_of_measurement:''}`).join('\n'):'';this.emit();return this.answer;}
 async converse(text,{confirmed=false,agentId=''}={}){if(!confirmed||typeof text!=='string'||!text.trim()||text.length>2000||!this.hass?.services?.conversation?.process)return false;if(agentId&&!this.state(agentId))return false;const data={text,language:this.language.split('-')[0]};if(agentId)data.agent_id=agentId;if(this.conversationId)data.conversation_id=this.conversationId;return this.request('conversation',async current=>{const result=await this.hass.callService('conversation','process',data,undefined,undefined,true);if(current()){const response=result?.response||result;this.answer=String(response?.response?.speech?.plain?.speech||response?.speech?.plain?.speech||'');this.conversationId=response?.conversation_id||null;}return true;});}
}
