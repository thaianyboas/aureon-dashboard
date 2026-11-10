import {html,svg,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import {isAvailable} from './actions.mjs';
import {converter,mapRooms,segmentCall,zoneCall,spotCall,gotoCall,selectCall,serviceAvailable,MAX_REPEATS,DREAME} from '../integrations/dreame.mjs';
// Robot vacuum page in the Cinema look. Map functions of the Xiaomi Vacuum Map Card for Dreame robots (rooms, zones,
// spots, go to, repeats, cleaning settings) on top of the live map that the Dreame integration renders. Every command is
// a tap by the user; AUREON never sends anything by itself. Other vacuums get the basic controls.
const ICON={start:'M8 5v14l11-7z',pause:'M7 5h4v14H7zM13 5h4v14h-4z',dock:'M3 11 12 4l9 7M6 10v10h12V10M10 20v-5h4v5',stop:'M6 6h12v12H6z',locate:'M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'};
const MODES=['rooms','zone','spot','goto'];
const CLEANING=new Set(['cleaning','returning']);
const pretty=v=>{v=String(v??'').replaceAll('_',' ');return v.charAt(0).toLocaleUpperCase()+v.slice(1);};
const stateText=(c,s,option)=>{const raw=String(option??s?.state??'');try{if(c.hass?.formatEntityState){const out=option!==undefined?c.hass.formatEntityState(s,option):c.hass.formatEntityState(s);if(out&&out!==raw)return out;}}catch{}return pretty(raw);};
function vacState(ui){return ui._vac||(ui._vac={id:'',mode:'rooms',rooms:new Set(),zones:[],points:[],goto:null,repeats:1,drag:null,img:null,notice:''});}
function clearSel(v){v.rooms=new Set();v.zones=[];v.points=[];v.goto=null;v.drag=null;}
function robotArt(cleaning,docked){return svg`<svg class="vac-art" viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="vacBody" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#3a3b41"/><stop offset="1" stop-color="#141417"/></radialGradient></defs>
 ${cleaning?svg`<circle cx="100" cy="100" r="92" fill="none" stroke="var(--p-accent)" stroke-opacity=".25" stroke-dasharray="3 7" class="vac-orbit"/>`:nothing}
 <circle cx="100" cy="100" r="70" fill="url(#vacBody)" stroke="var(--p-accent)" stroke-width="2"/><circle cx="100" cy="100" r="54" fill="none" stroke="rgba(255,255,255,.08)"/>
 <circle cx="100" cy="72" r="15" fill="#22232a" stroke="#cfc8bc" stroke-opacity=".7" stroke-width="1.4"/><circle cx="100" cy="72" r="5" fill=${cleaning?'var(--p-accent)':docked?'#8fd0a8':'#6d6a64'}/>
 <path d="M64 128a48 48 0 0 0 72 0" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="3" stroke-linecap="round"/></svg>`;}
export function vacuumCinema(ui){const c=ui.c,t=ui.t,v=vacState(ui);
 const dreameIds=new Set(c.dreame().map(r=>r.vacuum.id)),vacuums=[...c.list(['vacuum'])].sort((x,y)=>dreameIds.has(y.id)-dreameIds.has(x.id));if(!vacuums.length)return html`<div class="cine cine-vacuum"><div class="cine-glow" aria-hidden="true"></div><section class="cine-card glass vac-empty"><span class="cine-head">${t.vacPage}</span><strong>${t.vacNone}</strong><small class="cine-sub">${t.vacNoneHint}</small></section></div>`;
 const row=vacuums.find(r=>r.id===v.id)||vacuums[0];if(v.id!==row.id){v.id=row.id;clearSel(v);}
 const s=c.state(row.id),a=s?.attributes||{},robot=c.dreame().find(r=>r.vacuum.id===row.id),busy=c.busy.has('action:'+row.id);
 const acts=c.actions(row.id),act=key=>acts.find(x=>x.key===key),cleaning=CLEANING.has(s?.state),docked=s?.state==='docked';
 const battery=Number(a.battery_level),send=async(call,keep=false)=>{v.notice='';const ok=await c.dreameCall(call);v.notice=ok?t.vacSent:t.vacFailed;if(ok&&!keep)clearSel(v);ui.requestUpdate();};
 const hasDreame=!!robot&&!!c.hass?.services?.[DREAME];
 // ---- map ----
 const mapState=robot?.map&&c.state(robot.map.id),ma=mapState?.attributes||{},conv=converter(ma.calibration_points),rooms=mapRooms(ma);
 const picture=typeof ma.entity_picture==='string'&&ma.entity_picture?(()=>{const u=ma.entity_picture;let url=u;try{url=c.hass?.hassUrl?c.hass.hassUrl(u):u;}catch{}return url+(url.includes('?')?'&':'?')+'v='+encodeURIComponent(mapState.last_updated||'');})():'';
 const img=v.img,W=img?.w||1000,H=img?.h||1000,unit=Math.max(W,H)/100;
 const toMap=(x,y)=>conv.toMap(x,y),poly=pts=>pts.map(p=>p.join(',')).join(' ');
 const boxPoly=([x0,y0,x1,y1])=>poly([[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(p=>toMap(...p)));
 const svgPoint=e=>{const el=e.currentTarget.ownerSVGElement||e.currentTarget,m=el.getScreenCTM?.();if(!m)return null;const p=el.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(m.inverse());return [q.x,q.y];};
 const down=e=>{if(!conv||v.mode==='rooms')return;const p=svgPoint(e);if(!p)return;
  if(v.mode==='zone'){if(v.zones.length>=20)return;e.currentTarget.setPointerCapture?.(e.pointerId);v.drag={from:p,to:p};}
  else{const q=conv.toVacuum(...p);if(v.mode==='goto')v.goto=q;else if(v.points.length<20)v.points=[...v.points,q];}
  ui.requestUpdate();};
 const move=e=>{if(!v.drag)return;const p=svgPoint(e);if(p){v.drag={...v.drag,to:p};ui.requestUpdate();}};
 const up=()=>{const d=v.drag;if(!d)return;v.drag=null;const [a1,b1]=conv.toVacuum(...d.from),[a2,b2]=conv.toVacuum(...d.to);if(Math.abs(a2-a1)>=100&&Math.abs(b2-b1)>=100)v.zones=[...v.zones,[Math.min(a1,a2),Math.min(b1,b2),Math.max(a1,a2),Math.max(b1,b2)]];ui.requestUpdate();};
 const toggleRoom=id=>{const next=new Set(v.rooms);next.has(id)?next.delete(id):next.add(id);v.rooms=next;ui.requestUpdate();};
 const pin=([x,y],cls,label)=>{const [px,py]=toMap(x,y);return svg`<g class=${cls} transform=${`translate(${px} ${py})`}><circle r=${unit*1.6}/><circle r=${unit*.5} class="vac-pin-dot"/>${label?svg`<text y=${-unit*2.4} text-anchor="middle" font-size=${unit*2}>${label}</text>`:nothing}</g>`;};
 const overlay=conv&&img?svg`<svg class=${'vac-overlay mode-'+v.mode} viewBox=${`0 0 ${W} ${H}`} preserveAspectRatio="none" @pointerdown=${down} @pointermove=${move} @pointerup=${up} @pointercancel=${up}>
   ${v.mode==='rooms'?rooms.filter(r=>r.box).map(r=>svg`<polygon class=${'vac-room'+(v.rooms.has(r.id)?' on':'')} points=${boxPoly(r.box)} @click=${()=>toggleRoom(r.id)}/>`):nothing}
   ${v.zones.map((z,i)=>svg`<polygon class="vac-zone" points=${boxPoly(z)}/><text class="vac-zone-n" x=${toMap((z[0]+z[2])/2,(z[1]+z[3])/2)[0]} y=${toMap((z[0]+z[2])/2,(z[1]+z[3])/2)[1]} font-size=${unit*2.6} text-anchor="middle" dominant-baseline="central">${i+1}</text>`)}
   ${v.drag?svg`<rect class="vac-zone drawing" x=${Math.min(v.drag.from[0],v.drag.to[0])} y=${Math.min(v.drag.from[1],v.drag.to[1])} width=${Math.abs(v.drag.to[0]-v.drag.from[0])} height=${Math.abs(v.drag.to[1]-v.drag.from[1])}/>`:nothing}
   ${v.points.map((p,i)=>pin(p,'vac-pin',String(i+1)))}
   ${v.goto?pin(v.goto,'vac-pin goto',''):nothing}
   ${v.mode==='rooms'?rooms.filter(r=>r.center).map(r=>{const [x,y]=toMap(...r.center),on=v.rooms.has(r.id);return svg`<g class=${'vac-badge'+(on?' on':'')} transform=${`translate(${x} ${y})`} @click=${()=>toggleRoom(r.id)}><rect x=${-unit*7} y=${-unit*1.9} width=${unit*14} height=${unit*3.8} rx=${unit*1.9}/><text text-anchor="middle" dominant-baseline="central" font-size=${unit*1.9}>${on?'✓ ':''}${r.name.length>14?r.name.slice(0,13)+'…':r.name}</text></g>`;}):nothing}
  </svg>`:nothing;
 // ---- the command that the big button sends ----
 const call=!hasDreame?null:v.mode==='rooms'?segmentCall(row.id,[...v.rooms],v.repeats,rooms.map(r=>r.id)):v.mode==='zone'?zoneCall(row.id,v.zones,v.repeats):v.mode==='spot'?spotCall(row.id,v.points,v.repeats):gotoCall(row.id,v.goto);
 const count=v.mode==='rooms'?v.rooms.size:v.mode==='zone'?v.zones.length:v.mode==='spot'?v.points.length:v.goto?1:0;
 const callable=serviceAvailable(c.hass?.services,call);
 const goLabel=v.mode==='goto'?t.vacGo:v.mode==='rooms'?(count?`${t.vacCleanRooms} · ${count}`:t.vacPickRooms):v.mode==='zone'?(count?`${t.vacCleanZones} · ${count}`:t.vacDrawZone):(count?`${t.vacCleanSpots} · ${count}`:t.vacTapSpot);
 const hint={rooms:t.vacHintRooms,zone:t.vacHintZone,spot:t.vacHintSpot,goto:t.vacHintGoto}[v.mode];
 const selectedNames=v.mode==='rooms'?rooms.filter(r=>v.rooms.has(r.id)).map(r=>r.name):[];
 // ---- settings, consumables, stats ----
 const settings=robot?Object.entries(robot.settings).map(([k,r])=>({k,r,s:c.state(r.id)})).filter(x=>x.s&&isAvailable(x.s)&&Array.isArray(x.s.attributes?.options)&&x.s.attributes.options.length>1):[];
 const consumables=robot?robot.consumables.map(r=>({r,s:c.state(r.id)})).filter(x=>x.s&&Number.isFinite(Number(x.s.state))):[];
 const stats=[[t.vacArea,a.cleaned_area,'m²'],[t.vacTime,a.cleaning_time,'min'],[t.vacCount,a.cleaning_count,'×'],[t.vacTotalArea,a.total_cleaned_area,'m²']].filter(([,val])=>val!==undefined&&val!==null&&val!=='');
 const robotName=ui.name(row),short=r=>{const n=ui.name(r);return n.toLocaleLowerCase().startsWith(robotName.toLocaleLowerCase()+' ')&&n.length>robotName.length+1?pretty(n.slice(robotName.length+1)):n;};
 const status=stateText(c,s),errorText=a.error&&!['no_error','none','0',0].includes(a.error)?String(a.error).replaceAll('_',' '):'';
 return html`<div class="cine cine-vacuum">
 <div class="cine-glow" aria-hidden="true"></div>
 <div class="cine-sec-hero vac-hero">
  <div class="vac-hero-art">${robotArt(cleaning,docked)}${Number.isFinite(battery)?html`<span class="vac-battery" title=${t.battery}><i style=${'width:'+Math.max(4,Math.min(100,battery))+'%'}></i><b>${battery}%</b></span>`:nothing}</div>
  <section class="cine-sec-text" aria-label=${t.vacPage}>
   <span class="cine-eyebrow">${t.vacPage}${vacuums.length>1?nothing:html` · ${ui.name(row)}`}</span>
   ${vacuums.length>1?html`<div class="vac-pick" role="group" aria-label=${t.vacPage}>${vacuums.map(r=>html`<button type="button" class="cal-chip" aria-pressed=${String(r.id===row.id)} @click=${()=>{v.id=r.id;clearSel(v);ui.requestUpdate();}}>${ui.name(r)}</button>`)}</div>`:nothing}
   <h1>${status}${a.status&&String(a.status)!==String(s?.state)?html`<br><em>${String(a.status).replaceAll('_',' ')}</em>`:nothing}</h1>
   ${errorText?html`<p class="vac-error" role="alert">${errorText}</p>`:nothing}
   <div class="vac-controls">${[['start',cleaning&&s?.state!=='returning'?null:act('start')],['pause',cleaning?act('pause'):null],['dock',docked?null:act('dock')],['stop',act('stop')],['locate',act('locate')]].filter(([,x])=>x).map(([key,x])=>html`<button type="button" class=${'vac-ctl'+(key==='start'?' primary':'')} ?disabled=${busy} @click=${()=>ui.invoke(row,x)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d=${ICON[key]}></path></svg><span>${ui.controlLabel(key)}</span></button>`)}</div>
   ${stats.length?html`<div class="cine-stats vac-stats">${stats.map(([label,val,u])=>html`<div class="glass"><span class="cine-head">${label}</span><span class="cine-big">${typeof val==='number'?ui.format(val,val>=100?0:1):val}<small> ${u}</small></span></div>`)}</div>`:nothing}
  </section>
 </div>
 ${robot?html`<section class="cine-card glass vac-map-card" aria-label=${t.vacMap}>
  <div class="cine-row-head"><span class="cine-head">${t.vacMap}</span>
   <div class="cine-segment" role="group" aria-label=${t.vacMode}>${MODES.map(m=>html`<button type="button" aria-pressed=${String(v.mode===m)} ?disabled=${m==='rooms'&&!rooms.length} @click=${()=>{v.mode=m;v.drag=null;ui.requestUpdate();}}>${t['vacMode_'+m]}</button>`)}</div></div>
  ${!hasDreame?html`<p class="cine-sub">${t.vacNoService}</p>`:nothing}
  ${picture?html`<div class="vac-map" style=${img?`max-width:min(100%,calc(72vh * ${(W/H).toFixed(4)}))`:''}><img src=${picture} alt=${t.vacMap} draggable="false" @load=${e=>{const w=e.target.naturalWidth,h=e.target.naturalHeight;if(w&&h&&(v.img?.w!==w||v.img?.h!==h)){v.img={w,h};ui.requestUpdate();}}}>${overlay}</div>`:html`<div class="cine-empty"><small class="cine-sub">${mapState?t.vacMapWaiting:t.vacNoMap}</small></div>`}
  ${picture&&!conv?html`<p class="cine-sub">${t.vacNoCalibration}</p>`:nothing}
  <p class="vac-hint">${hint}${selectedNames.length?html` <b>${selectedNames.join(', ')}</b>`:nothing}</p>
  ${v.mode==='rooms'&&rooms.length?html`<div class="vac-room-chips">${rooms.map(r=>html`<button type="button" class="cal-chip" aria-pressed=${String(v.rooms.has(r.id))} @click=${()=>toggleRoom(r.id)}>${r.name}</button>`)}</div>`:nothing}
  <div class="vac-go-row">
   ${v.mode!=='goto'?html`<div class="cine-segment vac-repeats" role="group" aria-label=${t.vacRepeats}>${Array.from({length:MAX_REPEATS},(_,i)=>i+1).map(n=>html`<button type="button" aria-pressed=${String(v.repeats===n)} @click=${()=>{v.repeats=n;ui.requestUpdate();}}>${n}×</button>`)}</div>`:nothing}
   ${count?html`<button type="button" class="vac-clear" @click=${()=>{if(v.mode==='zone')v.zones=v.zones.slice(0,-1);else if(v.mode==='spot')v.points=v.points.slice(0,-1);else clearSel(v);ui.requestUpdate();}}>${v.mode==='zone'||v.mode==='spot'?t.vacUndo:t.vacClear}</button>`:nothing}
   <button type="button" class="vac-go" ?disabled=${!callable||busy} @click=${()=>send(call)}>${goLabel}</button>
  </div>
  ${v.notice?html`<p class="cine-sub vac-notice" role="status">${v.notice}</p>`:nothing}
 </section>`:nothing}
 ${settings.length||consumables.length?html`<div class="cine-row">
  ${settings.length?html`<section class="cine-card glass vac-settings" aria-label=${t.vacSettings}><span class="cine-head">${t.vacSettings}</span>${settings.map(({r,s:ss})=>html`<div class="vac-setting"><span>${short(r)}</span><div class="vac-options">${ss.attributes.options.map(o=>html`<button type="button" class="cal-chip" aria-pressed=${String(ss.state===o)} ?disabled=${c.busy.has('action:'+r.id)} @click=${()=>{const x=selectCall(ss,r.id,o);if(x&&ss.state!==o)send(x,true);}}>${stateText(c,ss,o)}</button>`)}</div></div>`)}</section>`:nothing}
  ${consumables.length?html`<section class="cine-card glass cine-list-card vac-consumables" aria-label=${t.vacConsumables}><span class="cine-head">${t.vacConsumables}</span>${consumables.map(({r,s:cs})=>{const p=Math.max(0,Math.min(100,Number(cs.state)));return html`<div class=${'cine-meter'+(p<=10?' low':'')}><span><span>${short(r)}</span><b>${Math.round(p)}%</b></span><i><em style=${'width:'+p+'%'}></em></i></div>`;})}</section>`:nothing}
 </div>`:nothing}
 </div>`;}
