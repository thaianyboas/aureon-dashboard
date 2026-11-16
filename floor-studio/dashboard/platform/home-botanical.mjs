import {html,svg,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import {isAvailable} from './actions.mjs';
import {artworkUrl} from '../music/controller.mjs';
import {presetForArea,assetUrl} from './assets.mjs';
import {roomArt} from './room-art.mjs';
import {dayKey} from './calendar-cinema.mjs';

// Forest Luxe · Botanical start page (owner 2026-11-16: "A referência aprovada é a especificação visual").
// One renderer for both approved layouts: A shows the saved Floor Studio plan, B shows the four summary tiles.
// Layout: greeting and actions on top, the main column (plan or tiles, music, rooms) beside the right rail (weather,
// waste collection, agenda), and a footer with every resident and the robot vacuum. All values come from Home
// Assistant; nothing is invented. Every command is a tap, sensitive ones still ask first (ui.invoke / c.act).

const WX_FRAME=state=>{const k=String(state||'');if(/lightning/.test(k))return 4;if(/rain|pouring|hail/.test(k))return 3;if(/snow/.test(k))return 5;if(k==='clear-night')return 0;if(/sunny|clear|exceptional/.test(k))return 1;return 2;};
// The illustrated weather atlas (6 frames: moon, sun, cloud, rain, storm, snow); "partly cloudy" puts the sun behind a cloud.
function wxIcon(state,cls=''){const k=String(state||''),url=assetUrl('weather-atlas.png'),frame=f=>html`<i class="bh-wx-frame" style=${`background-image:url("${url}");background-position:${f*20}% 50%`}></i>`;
 return html`<span class=${'bh-wx-icon '+cls} aria-hidden="true">${k==='partlycloudy'?html`<span class="bh-wx-sun">${frame(1)}</span><span class="bh-wx-cloud">${frame(2)}</span>`:frame(WX_FRAME(k))}</span>`;}

const ICON={pin:'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z',
 search:'m20 20-4.6-4.6M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z',bell:'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
 pencil:'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',chevron:'m9 5 7 7-7 7',home:'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5',
 briefcase:'M3 8h18v12H3zM8 8V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V8M3 13h18',away:'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z',
 bolt:'M13 2 4 14h7l-1 8 9-12h-7z',calendar:'M4 5h16v16H4zM8 3v4M16 3v4M4 10h16M8 14h2M12 14h2M16 14h2M8 17.5h2M12 17.5h2',
 play:'M9 7.5v9l7.5-4.5z',pause:'M9.5 7.5v9M14.5 7.5v9',trash:'M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13M10 11v6M14 11v6',
 bars:'M5 20v-5M9.5 20V9M14 20v-8M18.5 20V5',plan:'M3 5h18v14H3zM10 5v8h11M10 13v6'};
const icon=(name,cls='bh-i')=>svg`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true"><path d=${ICON[name]}></path></svg>`;

// Rendered artwork (assets/robot-vacuum.webp, assets/waste-bin-<colour>.webp; scenes in scripts/art/).
const BINS=[[/gelb|yellow|amarel|verpack|plast|wertstoff/i,'yellow'],[/bio|organ/i,'brown'],[/papier|paper|papel|blau|blue|azul|karton/i,'blue'],[/glas|glass|vidro/i,'green'],[/rest|residu|schwarz|black|grau|grey|gray|haus/i,'grey']];
const wasteBin=type=>html`<img class="bh-bin" src=${assetUrl('waste-bin-'+((BINS.find(([re])=>re.test(type))||[0,'grey'])[1])+'.webp')} alt="" loading="lazy" decoding="async">`;
// The robot vacuum portrait; a soft light pulses under it while it cleans.
export function robotArt(cleaning,cls='bh-robot-art'){return html`<span class=${cls+(cleaning?' cleaning':'')} aria-hidden="true"><img src=${assetUrl('robot-vacuum.webp')} alt="" decoding="async"></span>`;}

// What the owner wants to see about the robot without choosing anything (2026-11-16: "automaticamente"): read from
// the Dreame entities of the same device, only the ones that exist and have a value right now.
export function robotFacts(ui,row){const c=ui.c,t=ui.t,robot=row&&c.dreame().find(r=>r.vacuum.id===row.id);if(!robot)return [];
 const live=r=>{const s=r&&c.state(r.id);return s&&isAvailable(s)&&String(s.state).trim()!==''?s:null;},num=s=>`${ui.format(Number(s.state),Number(s.state)>=100?0:1)} ${s.attributes?.unit_of_measurement||''}`.trim();
 const vac=c.state(row.id),cleaning=['cleaning','returning'].includes(vac?.state),facts=[];
 const error=live(robot.stats.error);if(error&&!/^(no_?error|none|0|ok)$/i.test(String(error.state)))facts.push({kind:'alert',text:ui.stateText(error)});
 if(cleaning){const room=live(robot.stats.current_room);if(room)facts.push({kind:'room',text:ui.stateText(room)});
  const area=live(robot.stats.cleaned_area);if(area&&Number.isFinite(Number(area.state)))facts.push({kind:'area',text:num(area)});
  const time=live(robot.stats.cleaning_time);if(time&&Number.isFinite(Number(time.state)))facts.push({kind:'time',text:num(time)});}
 else{const charging=live(robot.stats.charging_status);if(charging&&vac?.state==='docked'&&!/not|nicht|^no/i.test(String(charging.state)))facts.push({kind:'charge',text:ui.stateText(charging)});}
 const genius=live(robot.settings.cleangenius),mode=genius&&!/off|aus|deslig/i.test(String(genius.state))?genius:live(robot.settings.cleaning_mode)||live(robot.settings.suction_level);if(mode)facts.push({kind:'mode',text:ui.stateText(mode)});
 const worn=robot.consumables.map(r=>({r,s:live(r)})).filter(x=>x.s&&Number.isFinite(Number(x.s.state))).sort((a,b)=>Number(a.s.state)-Number(b.s.state))[0];
 if(worn&&Number(worn.s.state)<=10){const name=ui.name(worn.r),base=ui.name(row);facts.push({kind:'alert',text:`${name.toLocaleLowerCase().startsWith(base.toLocaleLowerCase()+' ')?name.slice(base.length+1):name} ${Math.round(Number(worn.s.state))} %`});}
 return facts.slice(0,4);}
export const robotFactChips=(facts)=>facts.length?html`<span class="bh-facts">${facts.map(f=>html`<span class=${'bh-fact '+f.kind}>${f.text}</span>`)}</span>`:nothing;

const cap=text=>text?text.charAt(0).toLocaleUpperCase()+text.slice(1):'';
const devicesText=(t,n)=>`${n} ${n===1?t.bhDevice:t.bhDevices}`;

function batteryOf(c,row,st){if(!row)return null;const direct=Number(st(row.id)?.attributes?.battery_level);if(Number.isFinite(direct))return direct;
 const devices=new Set();if(row.deviceId)devices.add(row.deviceId);for(const id of st(row.id)?.attributes?.device_trackers||[]){const tracker=c.allRows.find(r=>r.id===id);if(tracker?.deviceId)devices.add(tracker.deviceId);}
 if(!devices.size)return null;const battery=c.allRows.find(r=>r.deviceId&&devices.has(r.deviceId)&&r.domain==='sensor'&&st(r.id)?.attributes?.device_class==='battery'&&isAvailable(st(r.id)));const level=battery?Number(st(battery.id)?.state):NaN;return Number.isFinite(level)?level:null;}
// The robot's next scheduled cleaning: an attribute of the vacuum, or a timestamp sensor of the same device whose
// name says it (Dreame: "next schedule"/"nächste Reinigung"). Only future times are shown.
function nextCleaning(c,row,st){if(!row)return NaN;const own=Date.parse(st(row.id)?.attributes?.next_scheduled_cleaning||'');if(Number.isFinite(own))return own;if(!row.deviceId)return NaN;
 for(const r of c.allRows){if(r.deviceId!==row.deviceId||r.domain!=='sensor')continue;const s=st(r.id);if(s?.attributes?.device_class!=='timestamp'||!/next|schedul|plan|nächst|proxim/i.test(r.id+' '+(r.name||'')))continue;const ms=Date.parse(s.state);if(Number.isFinite(ms))return ms;}return NaN;}

export function homeBotanical(ui,x){const c=ui.c,t=ui.t,p=c.preferences,st=x.st,d=x.d,zone=x.zone;
 const lit=d.lightsOn.length>0,openW=d.openWindows.length;
 const tile=(key,cls,head,ic,sub,end,click,label)=>html`<button type="button" class=${'bh-tile '+cls} data-layout-key=${'cine:'+key} aria-label=${label||head} @click=${click}><span class="bh-tile-icon">${ui.homeIcon(ic)}</span><span class="bh-tile-text"><strong>${head}</strong><small>${sub}</small></span>${end}</button>`;
 const securityText=x.alarmState?ui.stateText(x.alarmState):x.locked===null?t.noData:x.locked?t.cineLocked:t.cineUnlocked;
 const securityCalm=x.alarmState?['disarmed'].includes(x.alarmState.state)||/^armed/.test(x.alarmState.state):x.locked===true;
 const energySub=x.daily!=null?`${t.today}: ${ui.format(x.daily,1)} kWh`:x.pw.value!=='—'&&x.pw.value!=null?`${x.pw.value} ${x.pw.unit}`:t.noData;
 const tiles=html`<section class="bh-tiles" aria-label=${t.cineNow}>
  ${d.lights.length?tile('lights',lit?'on':'',t.bhLights,'bulb',`${d.lightsOn.length} ${t.cineOnLower}`,html`<span class=${'bh-switch '+(lit?'on':'')} aria-hidden="true"><i></i></span>`,()=>lit?x.allLightsOff():ui.nav('Geräte'),lit?t.cineTapAllOff:t.cineTapLights):nothing}
  ${d.windows.length?tile('windows',openW?'on':'',t.bhWindows,'window',`${openW} ${t.cineOpenLower}`,icon('chevron','bh-chev'),()=>{ui._cineSheet=true;ui.requestUpdate();}):nothing}
  ${p.widgets.security?tile('security',securityCalm?'calm':'alert',t.security,'lock',securityText,icon('chevron','bh-chev'),()=>ui.nav('Sicherheit')):nothing}
  ${p.widgets.energy?tile('energy','',t.energy,'bolt',energySub,icon('bars','bh-chev bh-bars'),()=>ui.nav('Energie')):nothing}
 </section>`;
 const plan=html`<section class="bh-plan" data-layout-key="cine:plan" aria-label=${t.floor}><aureon-home-plan .hass=${c.hass} .plan=${p.homePlan} .look=${'real'} .labels=${t}></aureon-home-plan><button type="button" class="bh-plan-open" @click=${()=>ui.nav('Planta')}>${icon('plan')}<span>${t.floor}</span></button></section>`;
 const rooms=c.rooms.length?html`<section class="bh-rooms"><button type="button" class="bh-title" @click=${()=>ui.nav('Räume')}>${ui.homeIcon('layers')}<span>${t.rooms}</span>${icon('chevron','bh-chev')}</button>
  <nav class="bh-room-grid" aria-label=${t.rooms}>${c.rooms.map(area=>{const sum=ui.areaSummary(area),img=ui.roomImage(area),count=new Set(sum.rows.filter(row=>c.kind(row)!=='technical').map(row=>row.deviceId||row.id)).size;
   return html`<button type="button" class="bh-room" data-room=${area.id} aria-label=${area.name} @click=${()=>{c._cineRoom=area.id;c._roomOpenNext=true;ui.nav('Räume');}}>${img.url?html`<img src=${img.small||img.url} srcset=${ui.cardSrcset(img)||nothing} sizes="(max-width:700px) 45vw, 14vw" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error=${ev=>ev.target.remove()}>`:roomArt(area.name)}
    <span class="bh-room-text"><span class="bh-room-icon">${ui.homeIcon(({bedroom:'bed',kitchen:'dining',bathroom:'bath',balcony:'leaf',hallway:'door'})[presetForArea(area)]||'sofa')}</span><span><strong>${area.name}</strong><small>${devicesText(t,count)}</small></span></span></button>`;})}</nav></section>`:nothing;

 // weather
 const weather=x.weather,ws=x.ws,a=ws?.attributes||{},unit=String(a.temperature_unit||'°C').replace(/^°?/,'°');
 const temp=v=>v==null||!Number.isFinite(Number(v))?'—':ui.format(Number(v),0);
 const hourly=ui._homeForecast?.id===weather?.id&&ui._homeForecast.epoch===c.epoch?ui._homeForecast.rows:[];
 const daily=ui._homeDaily?.id===weather?.id&&ui._homeDaily.epoch===c.epoch?ui._homeDaily.rows:[];
 const today=daily.find(f=>dayKey(new Date(f.datetime),zone)===dayKey(new Date(c.now()),zone))||null;
 const hourFmt=iso=>{try{return new Intl.DateTimeFormat(c.language,{hour:'2-digit',minute:'2-digit',timeZone:zone}).format(new Date(iso));}catch{return '';}};
 const location=c.hass?.config?.location_name||(weather?ui.name(weather):'');
 const weatherCard=weather?html`<button type="button" class="bh-card bh-wx" data-layout-key="cine:weather" style=${`--bh-wx-art:url("${assetUrl('botanical-canopy.webp')}")`} @click=${()=>ui.native(weather.id,'weather-forecast')}>
   <span class="bh-wx-loc">${icon('pin')}<span>${location}</span></span>
   <span class="bh-wx-now">${wxIcon(ws?.state,'big')}<span class="bh-wx-temp"><b>${isAvailable(ws)?html`${temp(a.temperature)} <small>${unit}</small>`:t.unavailable}</b><span>${ui.stateText(ws)}</span></span>
    ${today?html`<span class="bh-wx-hilo"><span>↑ ${temp(today.temperature)} ${unit}</span>${today.templow!=null?html`<span>↓ ${temp(today.templow)} ${unit}</span>`:nothing}</span>`:nothing}</span>
   ${hourly.length?html`<span class="bh-wx-hours">${hourly.slice(0,4).map((f,i)=>html`<span><small>${i===0?t.bhNow:hourFmt(f.datetime)}</small>${wxIcon(f.condition,'small')}<b>${temp(f.temperature)} ${unit}</b></span>`)}</span>`:nothing}
  </button>`:p.widgets.weather?html`<section class="bh-card bh-wx bh-wx-empty" data-layout-key="cine:weather"><span class="bh-wx-loc">${icon('pin')}<span>${t.weather}</span></span><p>${t.bhWeatherNone}</p></section>`:nothing;

 // waste
 const wasteCard=p.widgets.waste?html`<section class="bh-card bh-waste" data-layout-key="cine:waste"><button type="button" class="bh-title" @click=${()=>ui.nav('Agenda')}>${icon('trash')}<span>${t.waste}</span>${icon('chevron','bh-chev')}</button>
  ${x.waste.length?html`<div class="bh-bins">${x.waste.slice(0,3).map(row=>{const name=x.wasteName(row.type);return html`<div class="bh-bin-tile" title=${row.type}>${wasteBin(row.type)}<strong>${name}</strong><small class=${row.today?'soon':''}>${x.when(row)}</small></div>`;})}</div>`
  :html`<p class="bh-empty" role="status">${p.waste.some(id=>c.busy.has('calendar:'+id))?t.loading:p.waste.some(id=>c.errors['calendar:'+id])?t.unavailable:p.waste.length?t.bhWasteNone:t.bhWasteSetup}</p>`}</section>`:nothing;

 // No agenda card: the owner keeps the calendar in the side navigation (2026-11-16).
 const todayKey=dayKey(new Date(c.now()),zone),clock=new Intl.DateTimeFormat(c.language,{timeZone:zone,hour:'2-digit',minute:'2-digit'});
 // residents
 const people=x.people.map(row=>{const s=st(row.id),photo=artworkUrl(s?.attributes?.entity_picture,c.hass),home=s?.state==='home',level=batteryOf(c,row,st);
  const where=!s||!isAvailable(s)?ui.stateText(s):home?t.cineHome:s.state==='not_home'?t.bhAway:s.state;
  return html`<div class="bh-card bh-person" data-person=${row.id} data-layout-key=${'person:'+row.id}><span class=${'bh-avatar '+(home?'home':'')}>${photo?html`<img src=${photo} alt="" referrerpolicy="no-referrer">`:html`<span>${ui.name(row).slice(0,1)}</span>`}</span>
   <span class="bh-person-text"><strong>${ui.name(row)}</strong><span class="bh-person-meta"><span>${icon(home?'home':/arbeit|work|trabalho|büro|office/i.test(where)?'briefcase':'away')}${where}</span>${level!=null?html`<span class="bh-battery"><i style=${'--level:'+Math.max(0,Math.min(100,level))+'%'} class=${level<20?'low':''}></i>${Math.round(level)} %</span>`:nothing}</span></span></div>`;});

 // robot vacuum
 const robot=d.robot,rs=robot&&st(robot.id),cleaning=['cleaning','returning'].includes(rs?.state),robotLevel=batteryOf(c,robot,st);
 const next=nextCleaning(c,robot,st),nextText=Number.isFinite(next)&&next>=c.now()?(()=>{const day=dayKey(new Date(next),zone),when=day===todayKey?t.today:day===dayKey(new Date(c.now()+86400000),zone)?t.tomorrow:new Intl.DateTimeFormat(c.language,{timeZone:zone,weekday:'short',day:'numeric',month:'short'}).format(next);return `${when} · ${clock.format(next)}`;})():'';
 const actions=robot?c.actions(robot.id):[],go=actions.find(a=>a.key===(cleaning?'pause':'start'));
 const robotCard=robot?html`<div class="bh-card bh-robot" data-layout-key="cine:robot"><button type="button" class="bh-robot-main" @click=${()=>ui.nav('Staubsauger')}>${robotArt(cleaning)}<span class="bh-robot-text"><strong>${ui.name(robot)}</strong><small>${icon('bolt')}<span>${ui.stateText(rs)}${robotLevel!=null?` · ${Math.round(robotLevel)} %`:''}</span></small>${robotFactChips(robotFacts(ui,robot).slice(0,3))}</span></button>
   <div class="bh-robot-plan">${icon('calendar','bh-i bh-cal')}<span><small>${t.homeNextClean}</small><b>${nextText||'—'}</b></span>${go?html`<button type="button" class="bh-round" aria-label=${cleaning?t.bhPauseClean:t.bhStartClean} title=${cleaning?t.bhPauseClean:t.bhStartClean} ?disabled=${c.busy.has('action:'+robot.id)} @click=${()=>ui.invoke(robot,go)}>${icon(cleaning?'pause':'play')}</button>`:nothing}</div></div>`
  :html`<div class="bh-card bh-robot bh-robot-empty" data-layout-key="cine:robot">${robotArt(false)}<span class="bh-robot-text"><strong>${t.robot}</strong><small>${t.bhRobotNone}</small></span></div>`;

 const notifications=ui._bhNotifications||0;
 return html`<div class=${'bh '+(p.home3d?'bh-with-plan':'bh-tiles-mode')}>
  <div class="bh-grid">
   <header class="bh-head" aria-label=${t.cineWelcome}>
    <span class=${'bh-avatar big '+(x.own&&st(x.own.id)?.state==='home'?'home':'')}>${x.photo?html`<img src=${x.photo} alt="" referrerpolicy="no-referrer">`:html`<span>${x.first.slice(0,1)}</span>`}</span>
    <div><h1>${t[x.hour<12?'morning':x.hour<18?'afternoon':'evening']}${x.first?html`, <em>${x.first}</em>`:nothing}</h1><p>${cap(x.date)}${x.clock?html`<i aria-hidden="true">·</i>${x.clock}`:nothing}</p></div>
   </header>
   <div class="bh-tools">
    <button type="button" class="bh-round" aria-label=${t.search} title=${t.search} @click=${()=>ui.nav('Geräte')}>${icon('search')}</button>
    <button type="button" class="bh-round" aria-label=${t.bhNotifications} title=${t.bhNotifications} @click=${e=>e.target.dispatchEvent(new CustomEvent('hass-show-notifications',{bubbles:true,composed:true}))}>${icon('bell')}${notifications?html`<i class="bh-dot" aria-label=${String(notifications)}></i>`:nothing}</button>
    <button type="button" class="bh-round bh-edit" aria-pressed=${String(!!ui._layoutEditing)} aria-label=${t.layoutEditAll} title=${t.layoutEditAll} @click=${()=>{ui._layoutEditing=!ui._layoutEditing;ui._layoutDialog='';ui._layoutAdding=false;ui.requestUpdate();}}>${icon('pencil')}</button>
   </div>
   <div class="bh-main">
    ${p.home3d?plan:tiles}
    ${p.widgets.music?html`<section class="bh-music" data-layout-key="cine:music"><slot name="mini-player"></slot></section>`:nothing}
    ${rooms}
   </div>
   <aside class="bh-rail">${weatherCard}${wasteCard}</aside>
   <footer class="bh-foot">${p.widgets.people?people:nothing}${robotCard}</footer>
  </div>
 </div>`;}

// Read only, after each render of the start page: today's high/low (daily forecast) and the number of open
// Home Assistant notifications (for the bell). Unsubscribed when the page, weather entity or connection change.
export function syncBotanical(ui,weatherId){const c=ui.c,conn=c?.hass?.connection,on=ui.page==='home'&&ui._botanicalHome;
 const state=weatherId&&(c.state(weatherId)||c.hass?.states?.[weatherId]),daily=on&&Number(state?.attributes?.supported_features||0)&1;
 const key=daily&&conn?.subscribeMessage?`${c.epoch}:${weatherId}`:'';
 if(ui._bhDailyKey!==key){ui._bhDailyUnsub?.then(u=>u?.()).catch(()=>{});ui._bhDailyUnsub=null;ui._bhDailyKey=key;ui._homeDaily=null;
  if(key)ui._bhDailyUnsub=conn.subscribeMessage(m=>{if(ui._bhDailyKey!==key)return;ui._homeDaily={id:weatherId,epoch:c.epoch,rows:(m?.forecast||[]).slice(0,3)};ui.requestUpdate();},{type:'weather/subscribe_forecast',entity_id:weatherId,forecast_type:'daily'}).catch(()=>null);}
 const nkey=on&&conn?.subscribeMessage?String(c.epoch):'';
 if(ui._bhNoteKey!==nkey){ui._bhNoteUnsub?.then(u=>u?.()).catch(()=>{});ui._bhNoteUnsub=null;ui._bhNoteKey=nkey;
  if(nkey){const seen=new Map();ui._bhNoteUnsub=conn.subscribeMessage(m=>{if(ui._bhNoteKey!==nkey)return;if(m?.type==='removed')for(const id of Object.keys(m.notifications||{}))seen.delete(id);else for(const [id,n] of Object.entries(m?.notifications||{}))seen.set(id,n);const n=seen.size;if(n!==ui._bhNotifications){ui._bhNotifications=n;ui.requestUpdate();}},{type:'persistent_notification/subscribe'}).catch(()=>null);}}
}
