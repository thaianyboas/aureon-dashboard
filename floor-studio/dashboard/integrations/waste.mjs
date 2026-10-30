// Read-only normalization of explicitly chosen sources; no city or personal calendar defaults.
function dayKey(value,zone){
  if(typeof value!=='string')return null;
  const raw=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if(raw){const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?value:null;}
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
  try {const parts=new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(key=>parts.find(p=>p.type===key)?.value).join('-');} catch{return null;}
}
const dayNumber=key=>Date.parse(key+'T12:00:00Z')/86400000;
export function wasteCollections(state,{events=[],now=new Date().toISOString(),timeZone='UTC'}={}){
  const today=dayKey(now,timeZone);if(!today||!state||['unknown','unavailable'].includes(state.state))return [];
  const rows=[],a=state.attributes || {};
  const add=(date,type)=>{const key=dayKey(date,timeZone);if(!key || typeof type!=='string' || !type.trim())return;const days=Math.round(dayNumber(key)-dayNumber(today));if(days>=0)rows.push({entityId:state.entity_id,date:key,type:type.trim(),days,today:days===0,tomorrow:days===1});};
  if(state.entity_id?.startsWith('calendar.')){
    if(events.length)for(const e of events)add(e.start?.date || e.start?.dateTime || e.start,e.summary || e.message);
    else add(a.start_time,a.message);
  }else{
    // WCS date-keyed format and collection-type-to-date format; custom text is not guessed.
    for(const [key,value] of Object.entries(a)){
      if(/^\d{4}-\d{2}-\d{2}$/.test(key))add(key,value);
      else if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !['last_update'].includes(key))add(value,key);
    }
    if(Array.isArray(a.upcoming))for(const e of a.upcoming)add(e.date,Array.isArray(e.types)?e.types.join(', '):e.type);
  }
  const unique=new Map(rows.map(row=>[row.date+'\0'+row.type,row]));return [...unique.values()].sort((x,y)=>x.days-y.days||x.type.localeCompare(y.type));
}
export async function fetchWasteCalendar(hass,entityId,{start,end}={}){
  if(!entityId?.startsWith('calendar.') || !hass?.states?.[entityId] || !hass?.callApi || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end)<=Date.parse(start))throw new Error('Invalid calendar request');
  const result=await hass.callApi('GET',`calendars/${encodeURIComponent(entityId)}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
  if(!Array.isArray(result))throw new Error('Invalid calendar response');return result;
}
