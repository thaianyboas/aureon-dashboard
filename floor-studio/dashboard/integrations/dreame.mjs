// Dreame robot vacuums (Tasshack/dreame-vacuum, MIT) in AUREON.
// AUREON never talks to the robot itself. The Dreame integration stays installed from HACS and owns the cloud/LAN
// protocol; AUREON only reads its Home Assistant entities and, after a tap, asks Home Assistant for the same services the
// Xiaomi Vacuum Map Card (PiotrMachowski, MIT) uses for this platform: dreame_vacuum.vacuum_clean_segment / _clean_zone /
// _clean_spot / _goto and select.select_option. Coordinates follow that card: map pixels ↔ vacuum millimetres through
// the camera's calibration_points (affine, three points), rounded to whole millimetres.
export const DREAME='dreame_vacuum';
export const MAX_REPEATS=3,MAX_ZONES=20,MAX_ROOMS=60,MAX_POINTS=20;
// Settings shown as choices (select entities, keyed by the Dreame entity key = unique_id after the MAC).
export const SETTING_KEYS=['cleangenius','cleaning_mode','suction_level','water_volume','mop_pad_humidity','wetness_level','cleaning_route','mop_wash_level','auto_empty_mode','selected_map'];
// Consumables in %, best first.
export const CONSUMABLE_KEYS=['main_brush_left','side_brush_left','filter_left','sensor_dirty_left','mop_pad_left','tank_filter_left','silver_ion_left','squeegee_left','detergent_left','onboard_dirty_water_tank_left','dirty_water_tank_left','deodorizer_left','wheel_dirty_left','scale_inhibitor_left'];
export const STAT_KEYS=['cleaned_area','cleaning_time','cleaning_count','total_cleaned_area','total_cleaning_time','first_cleaning_date','current_room','task_status','charging_status','state','error'];
// The Dreame entity key from the registry unique_id ("<mac>_<key>"; a MAC has no "_"), else from the entity id.
export function dreameKey(row,deviceSlug=''){
 const uid=typeof row?.uniqueId==='string'?row.uniqueId:'';
 if(uid.includes('_'))return uid.slice(uid.indexOf('_')+1);
 const tail=String(row?.id||'').split('.')[1]||'';
 return deviceSlug&&tail.startsWith(deviceSlug+'_')?tail.slice(deviceSlug.length+1):tail;
}
// One robot per Dreame vacuum entity, with the entities of the same device grouped by role.
export function dreameRobots(rows,states={}){
 return rows.filter(r=>r.domain==='vacuum'&&r.source===DREAME).map(v=>{
  const slug=String(v.id).split('.')[1]||'',same=rows.filter(r=>r!==v&&r.source===DREAME&&(v.deviceId?r.deviceId===v.deviceId:false));
  const key=r=>dreameKey(r,slug),settings={},consumables=[],stats={},maps=[],cameras=[];
  for(const r of same){const k=key(r);
   if(r.domain==='camera'){if(/^map_\d+$/.test(k))maps.push(r);else cameras.push(r);continue;}
   if(r.domain==='select'&&SETTING_KEYS.includes(k)){settings[k]=r;continue;}
   if(r.domain==='sensor'&&CONSUMABLE_KEYS.includes(k)){consumables.push(r);continue;}
   if(r.domain==='sensor'&&STAT_KEYS.includes(k))stats[k]=r;
  }
  // live map: unique key "map_map" ("map" on older versions); else a camera with calibration points that is not the
  // json data, a wifi map or a saved map
  const map=cameras.find(r=>/^map(_map)?$/.test(key(r)))||cameras.find(r=>{const a=states[r.id]?.attributes||{};return Array.isArray(a.calibration_points)&&!a.map_index&&!/data|wifi/.test(key(r));})||null;
  consumables.sort((a,b)=>CONSUMABLE_KEYS.indexOf(key(a))-CONSUMABLE_KEYS.indexOf(key(b)));
  return {vacuum:v,map,maps,settings,consumables,stats,key};
 });
}
// ---- coordinates ----
function solve3(m,v){ // 3×3 linear system, Cramer
 const det=a=>a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);
 const d=det(m);if(!Number.isFinite(d)||Math.abs(d)<1e-12)return null;
 return [0,1,2].map(i=>det(m.map((row,r)=>row.map((x,c)=>c===i?v[r]:x)))/d);
}
// Affine transform from three point pairs: returns [a,b,c,d,e,f] with x'=a·x+c·y+e, y'=b·x+d·y+f.
export function affineFrom(src,dst){
 if(!Array.isArray(src)||!Array.isArray(dst)||src.length<3||dst.length<3)return null;
 const m=src.slice(0,3).map(p=>[Number(p.x),Number(p.y),1]);if(!m.flat().every(Number.isFinite))return null;
 const X=solve3(m,dst.slice(0,3).map(p=>Number(p.x))),Y=solve3(m,dst.slice(0,3).map(p=>Number(p.y)));
 if(!X||!Y||![...X,...Y].every(Number.isFinite))return null;
 return [X[0],Y[0],X[1],Y[1],X[2],Y[2]];
}
export const apply=(t,x,y)=>[t[0]*x+t[2]*y+t[4],t[1]*x+t[3]*y+t[5]];
export function converter(calibration){
 const pts=Array.isArray(calibration)?calibration.filter(p=>p?.vacuum&&p?.map):[];
 const toMap=affineFrom(pts.map(p=>p.vacuum),pts.map(p=>p.map)),toVacuum=affineFrom(pts.map(p=>p.map),pts.map(p=>p.vacuum));
 if(!toMap||!toVacuum)return null;
 return {toMap:(x,y)=>apply(toMap,x,y),toVacuum:(x,y)=>apply(toVacuum,x,y)};
}
// Rooms of the current map (camera attribute "rooms": {id:{room_id,name,x0,y0,x1,y1,x,y,...}}).
export function mapRooms(attributes){
 const rooms=attributes?.rooms;if(!rooms||typeof rooms!=='object')return [];
 const list=Array.isArray(rooms)?rooms:Object.entries(rooms).map(([id,r])=>({...r,room_id:r?.room_id??Number(id)}));
 return list.map(r=>{const id=Number(r.room_id??r.id),b=[r.x0,r.y0,r.x1,r.y1].map(Number);
  return Number.isInteger(id)&&id>0?{id,name:String(r.custom_name||r.name||`#${id}`),box:b.every(Number.isFinite)?b:null,center:Number.isFinite(Number(r.x))&&Number.isFinite(Number(r.y))?[Number(r.x),Number(r.y)]:b.every(Number.isFinite)?[(b[0]+b[2])/2,(b[1]+b[3])/2]:null,order:Number(r.order)||0}:null;
 }).filter(Boolean).sort((a,b)=>(a.order||1e9)-(b.order||1e9)||a.id-b.id);
}
export const vacuumPoint=p=>Array.isArray(p)?p.map(Number):p&&typeof p==='object'?[Number(p.x),Number(p.y),Number(p.a)]:null;
// ---- service calls (built only from a user's explicit choice; validated like the Map Card) ----
const reps=n=>Math.min(MAX_REPEATS,Math.max(1,Math.round(Number(n)||1)));
const mm=v=>Math.round(Number(v));
export function segmentCall(entityId,roomIds,repeats=1,known=[]){
 const ids=[...new Set((roomIds||[]).map(Number))].filter(id=>Number.isInteger(id)&&id>0&&(!known.length||known.includes(id))).slice(0,MAX_ROOMS);
 return ids.length?{domain:DREAME,service:'vacuum_clean_segment',data:{entity_id:entityId,segments:ids,repeats:reps(repeats)}}:null;
}
// zones in vacuum mm: [[x1,y1,x2,y2], …] with x1<x2, y1<y2
export function zoneCall(entityId,zones,repeats=1){
 const list=(zones||[]).map(z=>{const [a,b,c,d]=z.map(mm);return [Math.min(a,c),Math.min(b,d),Math.max(a,c),Math.max(b,d)];}).filter(z=>z.every(Number.isFinite)&&z[2]-z[0]>=100&&z[3]-z[1]>=100).slice(0,MAX_ZONES);
 return list.length?{domain:DREAME,service:'vacuum_clean_zone',data:{entity_id:entityId,zone:list,repeats:reps(repeats)}}:null;
}
export function spotCall(entityId,points,repeats=1){
 const list=(points||[]).map(p=>p.map(mm)).filter(p=>p.length===2&&p.every(Number.isFinite)).slice(0,MAX_POINTS);
 return list.length?{domain:DREAME,service:'vacuum_clean_spot',data:{entity_id:entityId,points:list,repeats:reps(repeats)}}:null;
}
export function gotoCall(entityId,point){
 const [x,y]=(point||[]).map(mm);return Number.isFinite(x)&&Number.isFinite(y)?{domain:DREAME,service:'vacuum_goto',data:{entity_id:entityId,x,y}}:null;
}
export function selectCall(state,entityId,option){
 const options=state?.attributes?.options;return Array.isArray(options)&&options.includes(option)?{domain:'select',service:'select_option',data:{entity_id:entityId,option}}:null;
}
// A call is only sent when Home Assistant actually offers that service.
export const serviceAvailable=(services,call)=>!!call&&!!services?.[call.domain]?.[call.service];
