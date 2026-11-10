import {labelKey} from './discovery.mjs';
// Automatic energy (owner wish 2026-11-10): every device carrying the Home Assistant Label "Verbraucht" (or
// "Verbraucher"/"Verbrauch") is a consumer. Its kWh come from Home Assistant's own long-term statistics (recorder):
// the daily change of an energy meter, or — when the device only reports power — the hourly mean power (W × 1 h).
// Only reads data; nothing is switched or changed.
const NAMES=new Set(['verbraucht','verbraucher','verbrauch']);
const ENERGY_UNITS={Wh:.001,kWh:1,MWh:1000},POWER_UNITS={W:1,kW:1000,MW:1000000};
// Sensors that measure what flows back into the grid or is produced must not count as consumption.
const NOT_CONSUMPTION=/export|return|einspeis|r[üu]ckspeis|produ[ck]|erzeug|generat|injection|feed[_ -]?in/i;
export function consumerLabelIds(labels=[]){return labels.filter(l=>NAMES.has(labelKey(l.name))||NAMES.has(labelKey(l.id))).map(l=>l.id);}
export function meterKind(state){const a=state?.attributes||{},unit=a.unit_of_measurement;
 if(Object.hasOwn(ENERGY_UNITS,unit)&&['total','total_increasing'].includes(a.state_class))return 'energy';
 if(Object.hasOwn(POWER_UNITS,unit)&&a.state_class==='measurement')return 'power';
 return null;}
// One consumer per device (a labelled plug's switch brings along its meter sensors); entities without a device stand
// alone. The first matching energy meter and power sensor of each device are used.
export function autoConsumers(rows,states,labelIds){
 if(!labelIds?.length)return [];
 const tagged=r=>(r.labels||[]).some(id=>labelIds.includes(id));
 const devices=new Set(rows.filter(tagged).map(r=>r.deviceId).filter(Boolean)),groups=new Map();
 for(const r of rows){
  if(r.domain!=='sensor'||!(tagged(r)||(r.deviceId&&devices.has(r.deviceId))))continue;
  const kind=meterKind(states?.[r.id]);if(!kind||NOT_CONSUMPTION.test(r.id+' '+r.name))continue;
  const key=r.deviceId||r.id;
  if(!groups.has(key))groups.set(key,{key,name:r.deviceId&&r.device&&r.device!=='Sem dispositivo'?r.device:r.name,areaId:r.areaId||'',areaName:r.areaId?r.areaName:'',energyId:'',powerId:''});
  const g=groups.get(key);if(kind==='energy'&&!g.energyId)g.energyId=r.id;if(kind==='power'&&!g.powerId)g.powerId=r.id;
 }
 return [...groups.values()];
}
export function dayKey(ms,timeZone){try{return new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ms));}catch{return new Date(ms).toISOString().slice(0,10);}}
const ms=v=>{const n=Number(v);return Number.isFinite(n)?(n<1e11?n*1000:n):Date.parse(v);};
// kWh per consumer and day from the statistics responses ({id:[{start,change}]} daily, {id:[{start,mean}]} hourly).
export function autoTotals(consumers,stats,{timeZone='UTC',now=Date.now(),states={}}={}){
 const today=dayKey(now,timeZone),month=today.slice(0,7),all=new Map(),list=[];
 for(const c of consumers){const days=new Map(),add=(t,v)=>{if(!Number.isFinite(t)||!Number.isFinite(v)||v<0)return;const k=dayKey(t,timeZone);days.set(k,(days.get(k)||0)+v);};
  const energy=c.energyId&&stats?.energy?.[c.energyId];
  if(Array.isArray(energy))for(const x of energy)add(ms(x.start),Number(x.change));
  else if(c.powerId&&Array.isArray(stats?.power?.[c.powerId]))for(const x of stats.power[c.powerId])add(ms(x.start),Number(x.mean)/1000);
  for(const [k,v] of days)all.set(k,(all.get(k)||0)+v);
  const p=states[c.powerId],watts=p&&Number.isFinite(Number(p.state))&&Object.hasOwn(POWER_UNITS,p.attributes?.unit_of_measurement)?Math.max(0,Number(p.state)*POWER_UNITS[p.attributes.unit_of_measurement]):null;
  list.push({...c,today:days.get(today)??(days.size?0:null),month:days.size?[...days].filter(([k])=>k.startsWith(month)).reduce((s,[,v])=>s+v,0):null,watts});
 }
 const series=[...all].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,value])=>({time:Date.parse(k+'T12:00:00Z'),key:k,value}));
 const known=list.some(x=>x.today!==null);
 const watts=list.filter(x=>x.watts!==null);
 return {consumers:list,series,today:known?all.get(today)||0:null,month:known?series.filter(x=>x.key.startsWith(month)).reduce((s,x)=>s+x.value,0):null,watts:watts.length?watts.reduce((s,x)=>s+x.watts,0):null};
}
