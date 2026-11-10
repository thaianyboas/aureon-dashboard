import {html,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import {isAvailable,parameterAction} from './actions.mjs';
import {roomArt} from './room-art.mjs';
import {equipmentKinds,equipmentKind} from './discovery.mjs';
// "Ambientes" in the Cinema look: the chosen room fills the page with its photo; light, climate and blinds of that
// room are at hand, the other rooms below. Every change is a tap or slide by the user; the full room panel stays
// one tap away for everything else.
const SHADE_SKIP=['garage','gate','door','damper'];
const NO_AREA='__no_area';
const inArea=(r,area)=>area.id===NO_AREA?!r.areaId:r.areaId===area.id;
export function roomData(ui,area){const c=ui.c,st=id=>c.state(id),rows=c.rows.filter(r=>inArea(r,area));
 const lights=rows.filter(r=>r.domain==='light'&&isAvailable(st(r.id))),on=lights.filter(r=>st(r.id)?.state==='on');
 const level=on.length?Math.round(on.reduce((a,r)=>{const b=st(r.id)?.attributes?.brightness;return a+(Number.isFinite(Number(b))?Number(b)/2.55:100);},0)/on.length):0;
 const climate=rows.find(r=>r.domain==='climate'&&isAvailable(st(r.id)));
 const covers=rows.filter(r=>r.domain==='cover'&&!SHADE_SKIP.includes(st(r.id)?.attributes?.device_class)&&isAvailable(st(r.id)));
 const coverPos=covers.length?Math.round(covers.reduce((a,r)=>{const s=st(r.id),p=Number(s?.attributes?.current_position);return a+(Number.isFinite(p)?p:s?.state==='open'?100:0);},0)/covers.length):null;
 const scenes=c.list(['scene']).filter(r=>inArea(r,area)).slice(0,4);
 return {rows,lights,on,level,climate,covers,coverPos,scenes};}
async function setLights(ui,d,value){const c=ui.c;for(const r of d.lights){const s=c.state(r.id);if(value<=0){if(s?.state==='on')await c.act(r.id,'off');continue;}if(parameterAction(s,c.hass?.services,'brightness',value))await c.act(r.id,'brightness',{value});else if(s?.state!=='on')await c.act(r.id,'on');}}
async function setCovers(ui,d,mode){const c=ui.c;for(const r of d.covers){const s=c.state(r.id);if(mode==='half'){if(parameterAction(s,c.hass?.services,'position',50))await c.act(r.id,'position',{value:50});continue;}if(c.actions(r.id).some(a=>a.key===mode))await c.act(r.id,mode);}}

// Compact equipment row: name, state and the one control that matters; the full controls open with a tap on the name.
function deviceRow(ui,r){const c=ui.c,t=ui.t,s=c.state(r.id),acts=c.actions(r.id),on=s?.state==='on'||s?.state==='open'||s?.state==='playing'||s?.state==='cleaning';
 const toggle=acts.find(a=>a.key==='on'||a.key==='off');const bri=r.domain==='light'&&on&&Number.isFinite(Number(s?.attributes?.brightness))?Math.round(Number(s.attributes.brightness)/2.55):null;
 const cover=r.domain==='cover'?['open','stop','close'].map(k=>acts.find(a=>a.key===k)).filter(Boolean):[];
 const cs=r.domain==='climate'?s?.attributes:null,target=Number(cs?.temperature),step=Number(cs?.target_temp_step)||.5;
 const icons={open:'M6 15l6-6 6 6',close:'M6 9l6 6 6-6',stop:'M7 7h10v10H7z'};
 return html`<div class=${'cine-dev glass '+(on?'on':'')}>
  <button type="button" class="cine-dev-main" @click=${()=>{ui._modal={kind:'equipment',row:r};ui.requestUpdate();}}><span class="cine-dev-icon">${ui.roomIcon(r)}</span><span class="cine-dev-text"><strong>${ui.name(r)}</strong><small>${ui.stateText(s)}${bri!=null?` · ${bri}%`:''}${cs&&Number.isFinite(Number(cs.current_temperature))?` · ${ui.format(Number(cs.current_temperature),1)}°`:''}</small></span></button>
  ${toggle?html`<button type="button" class="cine-dev-switch" role="switch" aria-checked=${String(s?.state==='on')} aria-label=${ui.name(r)} @click=${()=>ui.invoke(r,toggle)}><i></i></button>`:nothing}
  ${cover.length?html`<span class="cine-dev-btns">${cover.map(a=>html`<button type="button" aria-label=${ui.controlLabel(a.key)} @click=${()=>ui.invoke(r,a)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d=${icons[a.key]}></path></svg></button>`)}</span>`:nothing}
  ${Number.isFinite(target)?html`<span class="cine-dev-btns"><button type="button" aria-label=${t.cineCooler} @click=${()=>c.act(r.id,'temperature',{value:target-step})}>−</button><b>${ui.format(target,1)}°</b><button type="button" aria-label=${t.cineWarmer} @click=${()=>c.act(r.id,'temperature',{value:target+step})}>+</button></span>`:nothing}
 </div>`;}
export function roomsCinema(ui){const c=ui.c,t=ui.t;
 // Every piece of equipment has a place: rooms, plus one for equipment without a room.
 const areas=[...c.rooms,...(c.showNoRoom&&c.rows.some(r=>!r.areaId)?[{id:NO_AREA,name:t.cineNoRoom}]:[])];if(!areas.length)return ui.empty();
 // Owner 2026-11-09: Cômodos first shows all rooms; a room opens as its own page (photo, controls, equipment) with
 // a way back. The start page's room tiles open a room directly.
 if(c._roomOpenNext){c._roomDetail=true;c._roomOpenNext=false;}
 if(!c._roomDetail||!areas.some(a=>a.id===c._cineRoom))return roomsOverview(ui,areas);
 const area=areas.find(a=>a.id===ui.c._cineRoom)||ui.homeArea()||areas[0],d=roomData(ui,area),img=area.id===NO_AREA?{url:''}:ui.roomImage(area),sum=area.id===NO_AREA?{temp:null,lights:d.lights,on:d.on.length}:ui.areaSummary(area);
 const cs=d.climate&&c.state(d.climate.id),target=Number(cs?.attributes?.temperature),current=Number(cs?.attributes?.current_temperature??sum.temp),step=Number(cs?.attributes?.target_temp_step)||.5;
 const litRooms=areas.filter(a=>c.rows.some(r=>r.areaId===a.id&&r.domain==='light'&&c.state(r.id)?.state==='on')).length;
 const blindText=d.coverPos===null?'':d.coverPos>=95?t.cineBlindsOpen:d.coverPos<=5?t.cineBlindsClosed:`${t.covers} ${d.coverPos}%`;
 const story=[Number.isFinite(current)?`${ui.format(current,1)}° ${t.cineNowLower}`:'',d.lights.length?(d.on.length?`${t.cineLightAt} ${d.level}%`:t.lightsOff):'',blindText].filter(Boolean).join(' · ');
 const blindMode=d.coverPos===null?'':d.coverPos>=95?'open':d.coverPos<=5?'close':'half';
 const canHalf=d.covers.some(r=>parameterAction(c.state(r.id),c.hass?.services,'position',50));
 return html`<div class="cine cine-rooms-page">
 <div class="cine-hero-photo" aria-hidden="true">${!img.url?roomArt(area.name):nothing}${img.url?(()=>{const look='filter:brightness('+(d.lights.length?(.45+.55*(d.on.length?d.level/100:0)):.8).toFixed(2)+')',ready=ui._heroReady===img.url;
   // the small picture (already loaded for the card) shows at once, softly blurred; the large one fades in when complete
   return html`${img.small&&img.small!==img.url?html`<img class="cine-hero-ph" src=${img.small} alt="" referrerpolicy="no-referrer" style=${look+' blur(14px)'} @error=${e=>e.target.remove()}>`:nothing}<img class=${'cine-hero-full'+(ready?' ready':'')} src=${img.url} srcset=${img.md?`${img.md} 1280w, ${img.url} 2560w`:nothing} sizes="100vw" decoding="async" alt="" referrerpolicy="no-referrer" style=${look} @load=${()=>{if(ui._heroReady!==img.url){ui._heroReady=img.url;ui.requestUpdate();}}} @error=${e=>e.target.remove()}>`;})():nothing}<span></span></div>
 <div class="cine-room-stage">
  <section class="cine-room-intro" aria-label=${area.name}>
   <button type="button" class="cine-room-back" @click=${()=>{c._roomDetail=false;ui.requestUpdate();ui.scrollToTop?.();}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>${t.back}</button>
   <span class="cine-eyebrow">${litRooms?`${litRooms} ${t.cineRoomsLit}`:t.cineHouseDark}</span>
   <h1>${area.name}</h1>
   ${story?html`<p>${story}.</p>`:nothing}
   ${d.scenes.length?html`<div class="cine-room-scenes" role="group" aria-label=${t.scenes}>${d.scenes.map(r=>{const action=c.actions(r.id).find(a=>a.key==='activate');return html`<button type="button" class="glass" data-layout-key=${'scene:'+r.id} ?disabled=${!action} @click=${()=>action&&ui.invoke(r,action)}>${ui.name(r)}</button>`;})}</div>`:nothing}
   
  </section>
  <aside class="cine-room-controls" aria-label=${t.cineRoomControls}>
   ${d.lights.length?html`<div class="cine-control glass" data-layout-key=${'cine-room:light'}><span class="cine-control-head"><label for="cine-dimmer" class="cine-head">${t.cineLight}</label><span class="cine-big">${d.on.length?d.level+'%':t.cineOff}</span></span><input id="cine-dimmer" type="range" min="0" max="100" step="5" .value=${String(d.on.length?d.level:0)} aria-valuetext=${d.on.length?d.level+'%':t.cineOff} @change=${e=>setLights(ui,d,Number(e.target.value))}><small class="cine-sub">${d.on.length} ${t.cineOf} ${d.lights.length} ${t.cineOnLower}</small></div>`:nothing}
   ${d.climate?html`<div class="cine-control glass cine-climate" data-layout-key=${'cine-room:climate'}><span class="cine-climate-text"><span class="cine-head">${t.cineClimate}</span><span class="cine-big">${Number.isFinite(target)?ui.format(target,1)+'°':Number.isFinite(Number(cs?.attributes?.target_temp_low))&&Number.isFinite(Number(cs?.attributes?.target_temp_high))?`${ui.format(Number(cs.attributes.target_temp_low),0)}–${ui.format(Number(cs.attributes.target_temp_high),0)}°`:ui.stateText(cs)}</span><small class="cine-sub">${Number.isFinite(current)?`${t.cineNowLower} ${ui.format(current,1)}°`:''}</small></span>${Number.isFinite(target)?html`<span class="cine-steppers"><button type="button" aria-label=${t.cineCooler} @click=${()=>c.act(d.climate.id,'temperature',{value:target-step})}>−</button><button type="button" aria-label=${t.cineWarmer} @click=${()=>c.act(d.climate.id,'temperature',{value:target+step})}>+</button></span>`:nothing}</div>`:nothing}
   ${d.covers.length?html`<div class="cine-control glass" data-layout-key=${'cine-room:covers'}><span class="cine-head">${t.cineShades}</span><div class="cine-segment" role="group" aria-label=${t.covers}>${[['open',t.cineOpenTitle],...(canHalf?[['half',t.cineHalf]]:[]),['close',t.cineClosedTitle]].map(([mode,label])=>html`<button type="button" aria-pressed=${String(blindMode===mode)} @click=${()=>setCovers(ui,d,mode)}>${label}</button>`)}</div></div>`:nothing}
   ${!d.lights.length&&!d.climate&&!d.covers.length?html`<div class="cine-control glass"><small class="cine-sub">${t.cineNoControls}</small></div>`:nothing}
  </aside>
 </div>
 <section class="cine-room-devices" aria-label=${t.cineAllDevices}><div class="cine-row-head"><span class="cine-head">${area.name} · ${d.rows.length} ${t.cineDevicesLower}</span></div>
 ${equipmentKinds.map(k=>[k,d.rows.filter(r=>equipmentKind(r,c.state(r.id),c.preferences,c.labels)===k)]).filter(([,rows])=>rows.length).map(([k,rows])=>{const open=ui._roomOpenKinds?.has(k),shown=open?rows:rows.slice(0,8);return html`<div class="cine-dev-group"><div class="cine-dev-head"><h3>${t['equipment_'+k]||k}</h3><span class="cine-sub">${rows.length}</span></div><div class="cine-dev-grid">${shown.map(r=>deviceRow(ui,r))}</div>${rows.length>8?html`<button type="button" class="cine-link cine-dev-more" @click=${()=>{ui._roomOpenKinds??=new Set();open?ui._roomOpenKinds.delete(k):ui._roomOpenKinds.add(k);ui.requestUpdate();}}>${open?t.cineShowLess:`${t.cineShowAll} (${rows.length})`}</button>`:nothing}</div>`;})}
 ${!d.rows.length?html`<small class="cine-sub">${t.empty}</small>`:nothing}</section>
 </div>`;}

// All rooms as large photo cards; one tap opens the room.
function roomsOverview(ui,areas){const c=ui.c,t=ui.t;
 const lit=areas.filter(a=>c.rows.some(r=>r.areaId===a.id&&r.domain==='light'&&c.state(r.id)?.state==='on')).length;
 const open=a=>{c._cineRoom=a.id;c._roomDetail=true;ui.requestUpdate();ui.scrollToTop?.();};
 return html`<div class="cine cine-rooms-overview">
 <header class="cine-overview-head"><span class="cine-eyebrow">${areas.length} ${t.rooms} · ${lit?`${lit} ${t.cineRoomsLit}`:t.cineHouseDark}</span><h1>${t.rooms}</h1></header>
 <div class="cine-room-grid">${areas.map(a=>{const s=a.id===NO_AREA?{temp:null,lights:[],on:0}:ui.areaSummary(a),im=a.id===NO_AREA?{url:''}:ui.roomImage(a),n=c.rows.filter(r=>a.id===NO_AREA?!r.areaId:r.areaId===a.id).length;
  const status=[s.temp!=null?ui.format(s.temp,1)+'°':'',s.lights.length?(s.on?`${s.on} ${t.lightsOn}`:t.lightsOff):'',n?`${n} ${t.cineDevicesLower}`:''].filter(Boolean);
  return html`<button type="button" class=${'cine-room-card'+(s.on?' lit':'')} data-room=${a.id} aria-label=${a.name} @pointerenter=${()=>ui.preloadRoom(im)} @pointerdown=${()=>ui.preloadRoom(im)} @click=${()=>open(a)}>${!im.url?roomArt(a.name):nothing}${im.url?html`<img src=${im.small||im.url} srcset=${ui.cardSrcset(im)||nothing} sizes="(max-width:700px) 92vw, 26vw" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error=${e=>e.target.remove()}>`:nothing}<span class="cine-room-card-text"><strong>${a.name}</strong><small>${status.join(' · ')}</small></span><span class="cine-room-card-go" aria-hidden="true">›</span></button>`;})}</div>
 </div>`;}
