import {html,svg,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import {isAvailable} from './actions.mjs';
import {artworkUrl} from '../music/controller.mjs';
import {syncLayer} from './layer.mjs';
import {presetForArea,assetUrl} from './assets.mjs';
import {roomArt} from './room-art.mjs';
import {DREAME} from '../integrations/dreame.mjs';
import {agenda,dayKey} from './calendar-cinema.mjs';
// "Cinema" start page (the design approved by the owner): greeting with scenes, people, waste collection, the
// home right now as illustrated tiles (lights, windows, curtains/blinds, robot, energy, security), cameras, music
// and rooms. All data comes from Home Assistant; every action is a tap by the user, sensitive ones still confirm.
const WINDOW_CLASSES=['window','opening'];
const SHADE_SKIP=['garage','gate','door','damper'];
const WASTE_COLOURS=[[/gelb|yellow|amarel|verpack|plast/i,'#e3c03c'],[/bio|organ/i,'#8a6440'],[/papier|paper|papel|blau|blue|azul/i,'#3a72bd'],[/glas|glass|vidro/i,'#4f9d69'],[/rest|residu|schwarz|black|grau|grey|gray/i,'#5a5a5e']];
const wasteColour=type=>(WASTE_COLOURS.find(([re])=>re.test(type))||[0,'#8f897f'])[1];
const SCENE_ICONS=[[/morgen|manh|morning|wake|acord/i,'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],[/kino|cinema|film|movie|tv/i,'M3 6h18v12H3zM8 21h8M10 9.5v5l4-2.5z'],[/essen|jantar|dinner|din/i,'M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9'],[/nacht|noite|night|sleep|schlaf/i,'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z']];
const sceneIcon=name=>(SCENE_ICONS.find(([re])=>re.test(name))||[0,'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z'])[1];


// Weather: an animated illustration of the current condition, temperature and the next days (Home Assistant's
// forecast subscription — read only, no service call).
const WX={sun:/sunny|clear(?!-night)|exceptional/,moon:/clear-night/,rain:/rain|pouring|hail/,snow:/snow/,storm:/lightning/,fog:/fog/,wind:/wind/,partly:/partly/};
function wxKind(state=''){for(const [k,re] of Object.entries(WX))if(re.test(state))return k;return 'cloud';}
function wxArt(kind,small=false){const cloud='M22 46h30a10 10 0 0 0 1-20 14 14 0 0 0-27-3 11 11 0 0 0-4 23z';
 return svg`<svg class=${'wx-art wx-'+kind+(small?' wx-small':'')} viewBox="0 0 76 64" aria-hidden="true">
 ${['sun','partly'].includes(kind)?svg`<g class="wx-sun"><circle cx=${kind==='sun'?38:26} cy=${kind==='sun'?30:22} r=${kind==='sun'?11:8} fill="#f3d38a"/><g class="wx-rays" style=${`transform-origin:${kind==='sun'?38:26}px ${kind==='sun'?30:22}px`} stroke="#f3d38a" stroke-width="2" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180,cx=kind==='sun'?38:26,cy=kind==='sun'?30:22,r1=kind==='sun'?16:12,r2=kind==='sun'?21:15;return svg`<line x1=${cx+r1*Math.cos(r)} y1=${cy+r1*Math.sin(r)} x2=${cx+r2*Math.cos(r)} y2=${cy+r2*Math.sin(r)}/>`;})}</g></g>`:nothing}
 ${kind==='moon'?svg`<path d="M44 14a16 16 0 1 0 14 22 13 13 0 0 1-14-22z" fill="#efe3c4"/><circle cx="20" cy="16" r="1" fill="#efe3c4"/><circle cx="62" cy="12" r=".8" fill="#efe3c4"/><circle cx="14" cy="34" r=".7" fill="#efe3c4"/>`:nothing}
 ${!['sun','moon'].includes(kind)?svg`<g class="wx-cloud"><path d=${cloud} fill=${kind==='storm'||kind==='rain'?'#8d949c':'#d9dde2'} opacity=".95"/><path d=${cloud} transform="translate(-10 6) scale(.7)" fill="#b8bec5" opacity=".7"/></g>`:nothing}
 ${kind==='rain'?svg`<g class="wx-drops" stroke="#8fc3f0" stroke-width="2" stroke-linecap="round"><line x1="28" y1="50" x2="26" y2="56"/><line x1="38" y1="50" x2="36" y2="56"/><line x1="48" y1="50" x2="46" y2="56"/></g>`:nothing}
 ${kind==='snow'?svg`<g class="wx-flakes" fill="#fff"><circle cx="28" cy="53" r="1.8"/><circle cx="38" cy="56" r="1.8"/><circle cx="48" cy="53" r="1.8"/></g>`:nothing}
 ${kind==='storm'?svg`<path class="wx-bolt" d="M40 46l-6 9h5l-3 8 9-11h-5l3-6z" fill="#f3d38a"/>`:nothing}
 ${kind==='fog'?svg`<g class="wx-fog" stroke="#c9ced4" stroke-width="2.4" stroke-linecap="round" opacity=".85"><line x1="16" y1="52" x2="56" y2="52"/><line x1="22" y1="58" x2="62" y2="58"/></g>`:nothing}
 ${kind==='wind'?svg`<g class="wx-fog" stroke="#c9ced4" stroke-width="2" fill="none" stroke-linecap="round"><path d="M14 52h34a5 5 0 1 0-5-5"/><path d="M20 58h26a4 4 0 1 1-4 4"/></g>`:nothing}
 </svg>`;}
export function syncForecast(ui){
 const c=ui.c,conn=c?.hass?.connection;
 const weather=ui.page==='home'&&c?.preferences.widgets.weather?c.list(['weather'])[0]:null;
 const id=weather?.id,state=id&&c.state(id),features=Number(state?.attributes?.supported_features||0);
 const type=features&2?'hourly':features&1?'daily':features&4?'twice_daily':'';
 const key=id&&type&&conn?.subscribeMessage?`${c.epoch}:${id}:${type}`:'';
 if(ui._wxKey===key)return;
 ui._wxUnsub?.then(unsubscribe=>unsubscribe?.()).catch(()=>{});
 ui._wxUnsub=null;ui._wxKey=key;ui._homeForecast=null;
 if(!key)return;
 ui._wxUnsub=conn.subscribeMessage(message=>{
  if(ui._wxKey!==key)return;
  ui._homeForecast={id,epoch:c.epoch,rows:(message?.forecast||[]).slice(0,4)};
  ui.requestUpdate();
 },{type:'weather/subscribe_forecast',entity_id:id,forecast_type:type}).catch(()=>null);
}
function weatherHero(ui,weather,ws){const c=ui.c,t=ui.t,a=ws?.attributes||{},kind=wxKind(String(ws?.state||'')),unit=a.temperature_unit||'°',fc=ui._homeForecast?.id===weather.id&&ui._homeForecast.epoch===c.epoch?ui._homeForecast.rows:[];
 const day=iso=>{try{return new Intl.DateTimeFormat(c.language,{...(a.supported_features&2?{hour:'2-digit',minute:'2-digit'}:{weekday:'short'}),timeZone:c.hass?.config?.time_zone||'UTC'}).format(new Date(iso));}catch{return '';}};
 const temp=v=>v==null||!Number.isFinite(Number(v))?'—':ui.format(Number(v),Math.abs(Number(v))<10?1:0);
 return html`<button type="button" class="cine-wx glass" data-layout-key="cine:weather" @click=${()=>ui.native(weather.id,'weather-forecast')}>
  <span class="cine-wx-now">${wxArt(kind)}<span class="cine-wx-text"><span class="cine-wx-temp">${isAvailable(ws)?html`${temp(a.temperature)}<small>${unit.replace(/^°?/,'°').replace('°°','°')}</small>`:t.unavailable}</span><strong>${ui.name(weather)}</strong><small>${ui.stateText(ws)}${a.humidity!=null?` · ${a.humidity}%`:''}${a.wind_speed!=null?` · ${ui.format(Number(a.wind_speed),0)} ${a.wind_speed_unit||''}`:''}</small></span></span>
  ${fc.length?html`<span class="cine-wx-days">${fc.slice(0,4).map(f=>html`<span class="cine-wx-day"><small>${day(f.datetime)}</small>${wxArt(wxKind(f.condition),true)}<b>${temp(f.temperature)}°</b><small>${f.templow!=null?temp(f.templow)+'°':''}</small></span>`)}</span>`:nothing}
 </button>`;}

export function homeData(ui){const c=ui.c,st=id=>c.state(id);
 const lights=c.list(['light']).filter(r=>isAvailable(st(r.id))),lightsOn=lights.filter(r=>st(r.id)?.state==='on');
 const windows=c.list(['binary_sensor']).filter(r=>WINDOW_CLASSES.includes(st(r.id)?.attributes?.device_class)),openWindows=windows.filter(r=>st(r.id)?.state==='on');
 const shades=c.list(['cover']).filter(r=>!SHADE_SKIP.includes(st(r.id)?.attributes?.device_class)&&isAvailable(st(r.id))),openShades=shades.filter(r=>{const s=st(r.id);return s?.state==='open'||Number(s?.attributes?.current_position)>0;});
 const robot=c.list(['vacuum']).find(row=>row.source===DREAME)||c.list(['vacuum'])[0],cameras=c.list(['camera']).filter(r=>isAvailable(st(r.id))),scenes=c.list(['scene']).slice(0,4);
 const locks=c.list(['lock']),alarm=c.list(['alarm_control_panel'])[0];
 return {lights,lightsOn,windows,openWindows,shades,openShades,robot,cameras,scenes,locks,alarm};}

function shadeArt(open){const t='transition:transform 1.2s cubic-bezier(.6,.05,.3,1);';return svg`<svg class="cine-art" viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="cineWin"><rect x="12" y="10" width="40" height="44"/></clipPath></defs><rect x="12" y="10" width="40" height="44" fill="rgba(10,16,26,.85)" stroke="#a9a296" stroke-width="1.2"/><circle cx="40" cy="22" r="3.5" fill="#f3dfb8" opacity=".85"/><g clip-path="url(#cineWin)"><g style=${t+'transform-box:view-box;transform-origin:32px 10px;transform:scaleY('+(open?.12:1)+')'}><rect x="12" y="10" width="40" height="44" fill="#d9cfbd"/><path d="M12 15h40M12 20h40M12 25h40M12 30h40M12 35h40M12 40h40M12 45h40M12 50h40" stroke="#a99f8b" stroke-width=".8"/></g></g><rect x="9" y="6" width="46" height="5" rx="1.5" fill="var(--p-accent)"/><path d="M6 6c2 14-2 28 2 52h6c-2-18 1-36-1-52Z" fill="#e7dcc6" style=${t+'transform-box:fill-box;transform-origin:0 0;transform:translateX('+(open?0:14)+'px) scaleX('+(open?1:1.6)+')'}/><path d="M58 6c-2 14 2 28-2 52h-6c2-18-1-36 1-52Z" fill="#e7dcc6" style=${t+'transform-box:fill-box;transform-origin:100% 0;transform:translateX('+(open?0:-14)+'px) scaleX('+(open?1:1.6)+')'}/></svg>`;}
function robotArt(cleaning){return cleaning?svg`<svg class="cine-art" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="24" fill="none" stroke="var(--p-accent)" stroke-opacity=".35" stroke-dasharray="2 4"/><g class="cine-orbit"><g transform="translate(38 14)"><circle r="11" fill="#1c1d21" stroke="var(--p-accent)" stroke-width="1.4"/><circle r="3.6" fill="#2c2d33" stroke="#cfc8bc" stroke-width=".8"/></g></g></svg>`:svg`<svg class="cine-art" viewBox="0 0 76 76" aria-hidden="true"><rect x="20" y="10" width="36" height="40" rx="5" fill="#1a1b1f" stroke="#5d5a54" stroke-width="1.2"/><rect x="26" y="16" width="24" height="6" rx="2" fill="#2a2b30"/><circle class="cine-charge" cx="38" cy="30" r="2.2" fill="#7fd4a0"/><rect x="16" y="50" width="44" height="6" rx="2" fill="#24252a"/><circle cx="38" cy="56" r="13" fill="#1c1d21" stroke="var(--p-accent)" stroke-width="1.4"/><circle cx="38" cy="56" r="4" fill="#2c2d33" stroke="#cfc8bc" stroke-width=".8"/></svg>`;}

async function allLightsOff(ui,rows){for(const r of rows)await ui.c.act(r.id,'off');}
async function allShades(ui,rows,key){for(const r of rows)if(ui.c.actions(r.id).some(a=>a.key===key))await ui.c.act(r.id,key);}

function windowSheet(ui,d){const c=ui.c,t=ui.t,st=id=>c.state(id);const groups=new Map();for(const r of [...d.windows,...d.shades]){const k=r.areaName||t.noArea||'—';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
 const isOpen=r=>r.domain==='binary_sensor'?st(r.id)?.state==='on':false;
 const list=[...groups.entries()].map(([room,rows])=>({room,rows:rows.sort((a,b)=>isOpen(b)-isOpen(a)),n:rows.filter(isOpen).length})).sort((a,b)=>b.n-a.n||a.room.localeCompare(b.room));
 return html`<div class="cine-sheet-wrap" @click=${e=>{if(e.target===e.currentTarget){ui._cineSheet=false;ui.requestUpdate();}}}><aside class="cine-sheet" role="dialog" aria-modal="true" aria-labelledby="cine-sheet-title" @keydown=${e=>{if(e.key==='Escape'){ui._cineSheet=false;ui.requestUpdate();}}}>
 <div class="cine-sheet-head"><span><small class="cine-eyebrow">${t.cineOpenings}</small><h2 id="cine-sheet-title">${t.cineWindowsBlinds}</h2><small>${d.openWindows.length} ${t.cineOf} ${d.windows.length} ${t.cineWindowsOpen} · ${t.covers} ${d.openShades.length} ${t.cineOf} ${d.shades.length} ${t.cineOpenLower}</small></span><button type="button" class="cine-close" aria-label=${t.close} @click=${()=>{ui._cineSheet=false;ui.requestUpdate();}}>✕</button></div>
 ${list.map(g=>html`<section class="cine-sheet-group"><div class="cine-sheet-room"><strong>${g.room}</strong><small class=${g.n?'on':''}>${g.n?`${g.n} ${g.n===1?t.cineWindowOpen:t.cineWindowsOpen}`:t.cineAllClosed}</small></div>${g.rows.map(r=>{const s=st(r.id),open=isOpen(r);return html`<button type="button" class="cine-sheet-item" @click=${()=>{ui._cineSheet=false;ui._modal={kind:'equipment',row:r};}}><span><span>${ui.name(r)}</span><small>${r.domain==='cover'?t.cineBlind:t.cineWindow}</small></span><span class=${'cine-pill '+(open?'on':'')}>${r.domain==='binary_sensor'?(!s||['unavailable','unknown'].includes(s.state)?ui.stateText(s):open?t.cineOpenOne:t.cineClosedOne):ui.stateText(s)}</span></button>`;})}</section>`)}
 ${!list.length?html`<p class="hint">${t.noData}</p>`:nothing}</aside></div>`;}

// Called after each render (also on other pages, which closes it).
export function syncCinemaSheet(ui){const show=ui._cineSheet&&['home','security'].includes(ui.page)&&ui.c?.preferences.look!=='classic';syncLayer(ui,'cine-sheet',show?windowSheet(ui,homeData(ui)):null);}
// Read only visible calendars through HA, refreshing the two-day overview as time passes.
export function syncHomeAgenda(ui){
 const c=ui.c;
 if(ui.page!=='home'||!c?.registry)return;
 const ids=c.list(['calendar']).map(row=>row.id);
 if(!ids.length)return;
 const key=[c.epoch,Math.floor(c.now()/300000),...ids].join('|');
 if(ui._homeAgendaKey===key)return;
 ui._homeAgendaKey=key;
 void c.loadCalendars(7,ids);
}
function homeAgenda(ui,zone){
 const c=ui.c,t=ui.t,today=dayKey(new Date(c.now()),zone);
 const ids=c.list(['calendar']).filter(row=>!c.preferences.waste.includes(row.id)).map(row=>row.id);
 const groups=agenda(ids.map(id=>[id,c.events[id]]),{timeZone:zone,todayKey:today,days:2});
 const clock=new Intl.DateTimeFormat(c.language,{timeZone:zone,hour:'2-digit',minute:'2-digit'});
 const status=ids.some(id=>c.busy.has('calendar:'+id))?t.loading:ids.some(id=>c.errors['calendar:'+id])?t.unavailable:t.calFree;
 return html`<section class="cine-card glass home-agenda" data-layout-key="cine:agenda">
  <button type="button" class="home-widget-link" @click=${()=>ui.nav('Agenda')}>${ui.homeIcon('calendar')}<strong>${t.calendar}</strong><span aria-hidden="true">›</span></button>
  ${groups.size?[...groups].map(([key,rows])=>html`<div class="home-agenda-day"><b>${key===today?t.today:t.tomorrow}</b>
   <ul>${rows.slice(0,3).map(row=>html`<li><span>${row.e.summary||row.e.message||'—'}</span>${row.allDay?nothing:html`<time>${clock.format(row.ms)}</time>`}</li>`)}</ul></div>`):html`<small class="cine-sub" role="status">${ids.length?status:t.noData}</small>`}
 </section>`;
}
export function homeCinema(ui){const c=ui.c,t=ui.t,p=c.preferences,zone=c.hass?.config?.time_zone||'UTC',d=homeData(ui),st=id=>c.state(id);
 let clock='',date='',hour=12;try{clock=new Intl.DateTimeFormat(c.language,{timeZone:zone,hour:'2-digit',minute:'2-digit'}).format(c.now());date=new Intl.DateTimeFormat(c.language,{timeZone:zone,weekday:'long',day:'numeric',month:'long'}).format(c.now());hour=Number(new Intl.DateTimeFormat('en',{timeZone:zone,hour:'2-digit',hourCycle:'h23'}).format(c.now()));}catch{}
 const first=c.hass?.user?.name?.trim().split(/\s+/)[0]||'';
 const weather=p.widgets.weather?c.list(['weather'])[0]:null,ws=weather&&st(weather.id);
 const persons=c.list(['person']);
 const own=persons.find(row=>st(row.id)?.attributes?.user_id===c.hass?.user?.id&&c.hass?.user?.id);
 const people=p.widgets.people?persons.filter(row=>!/^isg[ _-]+display(?:[ _-]+max)?$/i.test(ui.name(row).trim())):[];
 const photo=artworkUrl((own&&st(own.id)?.attributes?.entity_picture)||c.hass?.user?.picture,c.hass);
 const botanical=p.appearance==='dark'||(p.appearance==='custom'&&p.palette==='forest-botanical');
 const waste=p.widgets.waste?[...new Map(c.waste.map(x=>[x.type+':'+x.date,x])).values()]:[];
 const when=x=>x.today?t.today:x.tomorrow?t.tomorrow:(()=>{try{return new Intl.DateTimeFormat(c.language,{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(x.date+'T12:00:00Z'));}catch{return x.date;}})();
 const pw=ui.power(),e=c.energy(),daily=e.daily.value;
 const lit=d.lightsOn.length>0,openW=d.openWindows.length,shadesOpen=d.openShades.length>0;
 const rs=d.robot&&st(d.robot.id),cleaning=['cleaning','returning'].includes(rs?.state);
 const nextCleaning=rs?.attributes?.next_scheduled_cleaning;
 const nextMs=typeof nextCleaning==='string'?Date.parse(nextCleaning):NaN;
 const schedule=Number.isFinite(nextMs)&&nextMs>=c.now()?new Intl.DateTimeFormat(c.language,{timeZone:zone,dateStyle:'short',timeStyle:'short'}).format(nextMs):'';
 const locked=d.locks.length?d.locks.every(r=>st(r.id)?.state==='locked'):null,alarmState=d.alarm?st(d.alarm.id):null;
 const glow=Math.min(1,.35+d.lightsOn.length/Math.max(1,d.lights.length)*.65);
 const tile=(key,on,head,art,main,sub,hint,click,label)=>html`<button type="button" class=${'cine-tile glass '+(on?'on':'')} data-layout-key=${'cine:'+key} aria-label=${label||head} @click=${click}><span class="cine-art-slot">${art}</span><span class="cine-head">${head}</span>${main}<span class="cine-sub">${sub}</span>${hint?html`<span class="cine-hint">${hint}</span>`:nothing}</button>`;
 const summaryTiles=html`<section class="cine-now" aria-label=${t.cineNow}>
  ${d.lights.length?tile('lights',lit,t.cineLights,ui.homeIcon('bulb'),html`<span class="cine-count"><b>${d.lightsOn.length}</b><small>${t.cineOf} ${d.lights.length} ${t.cineOnLower}</small></span>`,'',lit?t.cineTapAllOff:t.cineTapLights,()=>lit?allLightsOff(ui,d.lightsOn):ui.nav('Geräte'),lit?t.cineTapAllOff:t.cineTapLights):nothing}
  ${d.windows.length?tile('windows',openW>0,t.cineWindows,ui.homeIcon('window'),html`<span class="cine-count"><b>${openW}</b><small>${t.cineOf} ${d.windows.length} ${t.cineOpenLower}</small></span><span class="cine-bar"><i style=${'width:'+Math.round(100*openW/d.windows.length)+'%'}></i></span>`,'',t.cineDetails,()=>{ui._cineSheet=true;ui.requestUpdate();}):nothing}


  ${p.widgets.security?tile('security',false,t.security,ui.homeIcon('lock'),html`<span class="cine-big">${locked===null?(alarmState?ui.stateText(alarmState):t.noData):locked?t.cineLocked:t.cineUnlocked}</span>`,alarmState?ui.stateText(alarmState):'','',()=>ui.nav('Sicherheit')):nothing}
  ${p.widgets.energy?tile('energy',false,t.energy,ui.homeIcon('bolt'),html`<span class="cine-big">${pw.value}<small> ${pw.unit}</small></span>`,daily!=null?`${t.today} ${ui.format(daily,1)} kWh`:t.noData,'',()=>ui.nav('Energie')):nothing}
 </section>`;
 return html`<div class=${'cine aureon-home '+(p.home3d?'with-plan':'without-plan')+(botanical?' botanical':'')} style=${'--cine-glow:'+glow.toFixed(2)+';--botanical-bg:url("'+assetUrl('botanical-background.webp')+'");--botanical-canopy:url("'+assetUrl('botanical-canopy.webp')+'")'}>
 <div class="cine-glow" aria-hidden="true"></div>
 <header class="cine-welcome home-greeting" aria-label=${t.cineWelcome}>
   <span class="cine-avatar">${photo?html`<img src=${photo} alt="" referrerpolicy="no-referrer">`:html`<span>${first.slice(0,1)}</span>`}${own&&st(own.id)?.state==='home'?html`<i aria-hidden="true"></i>`:nothing}</span>
   <div><h1>${t[hour<12?'morning':hour<18?'afternoon':'evening']}${first?html`, <em>${first}</em>`:nothing}</h1>
   <span class="home-date">${date}${clock?' · '+clock:''}</span></div>
 </header>
 <div class="home-composition">
 <div class="home-primary">

 ${p.home3d?html`<section class="cine-plan glass" data-layout-key="cine:plan" aria-label=${t.floor}><aureon-home-plan .hass=${c.hass} .plan=${p.homePlan} .look=${'real'} .labels=${t}></aureon-home-plan><button type="button" class="cine-plan-open" @click=${()=>ui.nav('Planta')}>${t.floor} ↗</button></section>`:nothing}
 ${!p.home3d?summaryTiles:nothing}
 ${p.widgets.music?html`<section class="cine-card cine-music" data-layout-key="cine:music"><slot name="mini-player"></slot></section>`:nothing}
 ${c.rooms.length?html`<section class="home-rooms"><button type="button" class="home-widget-link" @click=${()=>ui.nav('Räume')}>${ui.homeIcon('layers')}<strong>${t.rooms}</strong><span aria-hidden="true">›</span></button><nav class="cine-rooms" aria-label=${t.rooms}>${c.rooms.map(area=>{const sum=ui.areaSummary(area),img=ui.roomImage(area),lightShare=sum.lights.length?sum.on/sum.lights.length:0;return html`<button type="button" class="cine-room" data-room=${area.id} aria-label=${area.name} @click=${()=>{ui.c._cineRoom=area.id;ui.c._roomOpenNext=true;ui.nav('Räume');}}>${!img.url?roomArt(area.name):nothing}${img.url?html`<img src=${img.small||img.url} srcset=${ui.cardSrcset(img)||nothing} sizes="(max-width:700px) 90vw, 30vw" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" style=${'filter:brightness('+(.38+.62*(sum.lights.length?lightShare:.8)).toFixed(2)+')'} @error=${ev=>ev.target.remove()}>`:nothing}<span class="cine-room-text"><span class="home-room-icon">${ui.homeIcon(({bedroom:'bed',kitchen:'dining',bathroom:'bath',balcony:'leaf',hallway:'door'})[presetForArea(area)]||'sofa')}</span><span><strong>${area.name}</strong><small>${new Set(sum.rows.filter(row=>c.kind(row)!=='technical').map(row=>row.deviceId||row.id)).size} ${t.devices}</small></span></span></button>`;})}</nav></section>`:nothing}
 </div>
 <aside class="cine-side home-rail">
  ${weather?weatherHero(ui,weather,ws):p.widgets.weather?html`<section class="cine-card glass" data-layout-key="cine:weather"><button type="button" class="home-widget-link" @click=${()=>ui.nav('Einstellungen')}>${ui.homeIcon('cloud')}<strong>${t.weather}</strong></button><small class="cine-sub">${t.homeWeatherSetup}</small></section>`:nothing}
  ${p.widgets.waste?html`<section class="cine-card glass cine-waste" data-layout-key="cine:waste">
   <button type="button" class="home-widget-link" @click=${()=>ui.nav('Agenda')}>${ui.homeIcon('calendar')}<strong>${t.waste}</strong><span aria-hidden="true">›</span></button>
   ${waste.length?html`<div class="home-waste-grid">${waste.slice(0,3).map(row=>html`<div class="home-waste-item">
    <svg viewBox="0 0 24 24" style=${'--waste-color:'+wasteColour(row.type)} aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M4 7h16M9 7V4h6v3M10 11v6M14 11v6"/></svg>
    <strong title=${row.type}>${/gelb|yellow|amarel|verpack/i.test(row.type)?'Gelbe Tonne':/papier|paper|papel|blau/i.test(row.type)?'Papier':/rest|schwarz|black|grau/i.test(row.type)?'Restmüll':row.type}</strong><small>${when(row)}</small>
   </div>`)}</div>`:html`<small class="cine-sub" role="status">${p.waste.some(id=>c.busy.has('calendar:'+id))?t.loading:p.waste.some(id=>c.errors['calendar:'+id])?t.unavailable:t.noData}</small>`}
  </section>`:nothing}
  ${homeAgenda(ui,zone)}
 </aside>
 </div>
 <div class="home-bottom">
  ${people.length?html`<section class="cine-card glass cine-people" data-layout-key="cine:people" aria-label=${t.people}><span class="cine-head">${t.cineAtHome}</span><div class="cine-people-grid">${people.map(row=>{const s=st(row.id),photo=artworkUrl(s?.attributes?.entity_picture,c.hass),home=s?.state==='home',trackers=s?.attributes?.device_trackers||[],devs=new Set(c.rows.filter(r=>trackers.includes(r.id)&&r.deviceId).map(r=>r.deviceId));if(row.deviceId)devs.add(row.deviceId);const battery=c.rows.find(r=>r.deviceId&&devs.has(r.deviceId)&&st(r.id)?.attributes?.device_class==='battery'),level=battery?Number(st(battery.id)?.state):NaN;return html`<div class=${'cine-person '+(home?'home':'')} data-person=${row.id}><span class="cine-avatar">${photo?html`<img src=${photo} alt="" referrerpolicy="no-referrer">`:html`<span>${ui.name(row).slice(0,1)}</span>`}<i aria-hidden="true"></i></span><span><strong>${ui.name(row)}</strong><small>${home?t.cineHome:s?.state==='not_home'?t.away:ui.stateText(s)}${Number.isFinite(level)?` · ${Math.round(level)}%`:''}</small></span></div>`;})}</div></section>`:nothing}
  ${d.robot?html`<button type="button" class="cine-card glass home-robot" data-layout-key="cine:robot" @click=${()=>ui.nav('Staubsauger')}>
   ${robotArt(cleaning)}<span><strong>${ui.name(d.robot)}</strong><small>${ui.stateText(rs)}${rs?.attributes?.battery_level!=null?` · ${rs.attributes.battery_level}%`:''}</small>${schedule?html`<small>${t.homeNextClean} · ${schedule}</small>`:nothing}</span><span aria-hidden="true">›</span>
  </button>`:nothing}
 </div>
 ${p.home3d?summaryTiles:nothing}
 <div class="cine-row home-extra">
  ${d.scenes.length?html`<div class="cine-scenes" role="group" aria-label=${t.scenes||'Cenas'}>${d.scenes.map(r=>{const action=c.actions(r.id).find(a=>a.key==='activate');return html`<button type="button" class="cine-scene glass" data-layout-key=${'scene:'+r.id} ?disabled=${!action} title=${ui.name(r)} @click=${()=>action&&ui.invoke(r,action)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d=${sceneIcon(ui.name(r))}></path></svg><span><strong>${ui.name(r)}</strong>${r.areaId&&r.areaName?html`<small>${r.areaName}</small>`:nothing}</span></button>`;})}</div>`:nothing}
  ${d.shades.length?tile('shades',!shadesOpen,t.cineShades,shadeArt(shadesOpen),html`<span class="cine-big">${shadesOpen?t.cineOpenTitle:t.cineClosedTitle}</span>`,`${d.openShades.length} ${t.cineOf} ${d.shades.length} ${t.cineOpenLower}`,shadesOpen?t.cineTapCloseAll:t.cineTapOpenAll,()=>allShades(ui,d.shades,shadesOpen?'close':'open')):nothing}
  ${d.cameras.length?html`<section class="cine-card glass cine-cameras" data-layout-key="cine:cameras" aria-label=${t.cameras}><span class="cine-row-head"><span class="cine-head">${t.cameras}</span><button type="button" class="cine-link" @click=${()=>ui.nav('Kameras')}>${t.cineSeeAll} ›</button></span><div class="cine-cam-grid">${d.cameras.slice(0,2).map(r=>{const s=st(r.id),pic=artworkUrl(s?.attributes?.entity_picture,c.hass);return html`<button type="button" class="cine-cam" aria-label=${ui.name(r)} @click=${()=>ui.native(r.id)}>${pic?html`<img src=${pic} alt="" referrerpolicy="no-referrer" @error=${ev=>ev.target.remove()}>`:nothing}<span class="cine-live"><i></i>${t.cineLive}</span><strong>${ui.name(r)}</strong></button>`;})}</div></section>`:nothing}
 </div>
 </div>`;}
