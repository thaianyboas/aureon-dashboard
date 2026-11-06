import {html,svg,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import {isAvailable} from './actions.mjs';
import {artworkUrl} from '../music/controller.mjs';
import {homeData} from './home-cinema.mjs';
// Security in the Cinema look. Alarm modes, locks and unlocking keep Home Assistant's own rules and AUREON's
// confirmation step (with the alarm code field) — nothing here arms, disarms or unlocks without that confirmation.
const MODE_ICONS={disarm:'M7 11V8a5 5 0 0 1 9.6-2M5 11h14v10H5z','arm:home':'M3 11 12 4l9 7M5 10v10h14V10','arm:away':'M13 4h6v16h-6M3 12h11M10 8l4 4-4 4','arm:night':'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z','arm:vacation':'M3 20h18M6 20V9l6-5 6 5v11','arm:custom_bypass':'M4 12h16M12 4v16'};
function rel(ui,iso){const t=Date.parse(iso);if(!Number.isFinite(t))return '';const m=Math.round((ui.c.now()-t)/60000);try{const f=new Intl.RelativeTimeFormat(ui.c.language,{numeric:'auto'});return m<60?f.format(-m,'minute'):m<1440?f.format(-Math.round(m/60),'hour'):f.format(-Math.round(m/1440),'day');}catch{return '';}}
function shield(armed,alert){return svg`<svg class="cine-shield" viewBox="0 0 200 220" aria-hidden="true"><defs><linearGradient id="cineShieldFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${alert?'#5a2620':armed?'#5a4626':'#25262a'}/><stop offset="1" stop-color="#121214"/></linearGradient></defs><path d="M100 8 182 38v66c0 56-36 92-82 108-46-16-82-52-82-108V38Z" fill="url(#cineShieldFill)" stroke="var(--p-accent)" stroke-width="2.4"/><path d="M100 26 166 50v54c0 46-29 76-66 90-37-14-66-44-66-90V50Z" fill="none" stroke="var(--p-accent)" stroke-opacity=".35" stroke-width="1.2"/><path d=${alert?'M100 70v50M100 140v4':armed?'M68 108 92 132 136 86':'M80 96V82a20 20 0 0 1 40 0M74 96h52v40H74z'} fill="none" stroke="#f3dfb8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
export function securityCinema(ui,classic){const c=ui.c,t=ui.t,st=id=>c.state(id),d=homeData(ui);
 const alarm=d.alarm,as=alarm&&st(alarm.id),mode=as?.state||'',armed=!!mode&&!['disarmed','unavailable','unknown'].includes(mode),alert=['triggered','pending'].includes(mode);
 const modes=alarm?c.actions(alarm.id).filter(a=>a.key==='disarm'||a.key.startsWith('arm:')):[];
 const current={disarmed:'disarm',armed_home:'arm:home',armed_away:'arm:away',armed_night:'arm:night',armed_vacation:'arm:vacation',armed_custom_bypass:'arm:custom_bypass'}[mode];
 const bs=dc=>c.list(['binary_sensor']).filter(r=>dc.includes(st(r.id)?.attributes?.device_class));
 const motion=bs(['motion','occupancy','presence']),lastMotion=[...motion].sort((a,b)=>Date.parse(st(b.id)?.last_changed||0)-Date.parse(st(a.id)?.last_changed||0))[0];
 const hazards=bs(['smoke','gas','moisture','safety','carbon_monoxide']),hazardOn=hazards.filter(r=>st(r.id)?.state==='on');
 const doors=bs(['door','garage_door']);
 const events=[...d.locks,...(alarm?[alarm]:[]),...d.windows,...doors,...motion,...hazards].map(r=>({r,s:st(r.id)})).filter(x=>x.s?.last_changed&&isAvailable(x.s)).sort((a,b)=>Date.parse(b.s.last_changed)-Date.parse(a.s.last_changed)).slice(0,6);
 const timeOf=iso=>{try{return new Intl.DateTimeFormat(c.language,{hour:'2-digit',minute:'2-digit',timeZone:c.hass?.config?.time_zone||'UTC'}).format(new Date(iso));}catch{return '';}};
 const unlocked=d.locks.filter(r=>st(r.id)?.state!=='locked');
 return html`<div class="cine cine-security">
 <div class="cine-glow" aria-hidden="true" style=${'opacity:'+(armed?1:.6)}></div>
 <div class="cine-sec-hero">
  <div class=${'cine-shield-wrap '+(armed?'armed':'')}><span class="cine-radar" aria-hidden="true"></span><span class="cine-radar r2" aria-hidden="true"></span>${shield(armed,alert)}</div>
  <section class="cine-sec-text" aria-label=${t.security}>
   <span class="cine-eyebrow">${t.security}${alarm?' · '+ui.name(alarm):''}</span>
   <h1>${alarm?ui.stateText(as):d.locks.length?(unlocked.length?t.cineUnlocked:t.cineLocked):t.noData}</h1>
   <span class="cine-sub">${[d.locks.length?(unlocked.length?`${unlocked.length} ${t.cineOf} ${d.locks.length} ${t.cineLocksOpen}`:t.cineAllLocked):'',d.windows.length?`${d.openWindows.length} ${t.cineOf} ${d.windows.length} ${t.cineWindowsOpen}`:''].filter(Boolean).join(' · ')}</span>
   ${modes.length?html`<div class="cine-modes" role="group" aria-label=${t.cineAlarmMode}>${modes.map(a=>html`<button type="button" class="glass" aria-pressed=${String(current===a.key)} @click=${()=>ui.invoke(alarm,a)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d=${MODE_ICONS[a.key]||MODE_ICONS['arm:custom_bypass']}></path></svg><span>${ui.controlLabel(a.key)}</span></button>`)}</div><small class="cine-sub">${t.cineConfirmNote}</small>`:nothing}
  </section>
 </div>
 <section class="cine-now" aria-label=${t.cineNow}>
  ${d.locks.map(r=>{const s=st(r.id),locked=s?.state==='locked',action=c.actions(r.id).find(a=>a.key===(locked?'unlock':'lock'));return html`<button type="button" class=${'cine-tile glass '+(locked?'':'on')} data-layout-key=${'cine-lock:'+r.id} ?disabled=${!action} @click=${()=>action&&ui.invoke(r,action)}><span class="cine-art-slot">${svg`<svg class="cine-art" viewBox="0 0 52 56" aria-hidden="true"><path d=${locked?'M16 24v-8a10 10 0 0 1 20 0v8':'M16 24v-8a10 10 0 0 1 19.5-3'} fill="none" stroke="var(--p-accent)" stroke-width="3" stroke-linecap="round"/><rect x="9" y="24" width="34" height="26" rx="6" fill="#1e1f23" stroke="var(--p-accent)" stroke-width="1.4"/><circle cx="26" cy="35" r="3.2" fill="var(--p-accent)"/></svg>`}</span><span class="cine-head">${ui.name(r)}</span><span class="cine-big">${ui.stateText(s)}</span><span class="cine-hint">${action?(locked?t.cineTapUnlock:t.cineTapLock):''}</span></button>`;})}
  ${d.windows.length?html`<button type="button" class=${'cine-tile glass '+(d.openWindows.length?'on':'')} data-layout-key="cine-sec:windows" @click=${()=>{ui._cineSheet=true;ui.requestUpdate();}}><span class="cine-head">${t.cineWindows}</span><span class="cine-count"><b>${d.openWindows.length}</b><small>${t.cineOf} ${d.windows.length} ${t.cineOpenLower}</small></span><span class="cine-sub">${d.openWindows.slice(0,2).map(r=>ui.name(r)).join(', ')}</span><span class="cine-hint">${t.cineDetails}</span></button>`:nothing}
  ${motion.length?html`<div class="cine-tile glass" data-layout-key="cine-sec:motion"><span class="cine-art-slot"><span class=${'cine-motion '+(st(lastMotion.id)?.state==='on'?'on':'')}><i></i></span></span><span class="cine-head">${t.cineMotion}</span><span class="cine-big">${ui.name(lastMotion)}</span><span class="cine-sub">${rel(ui,st(lastMotion.id)?.last_changed)}</span></div>`:nothing}
  ${hazards.length?html`<div class=${'cine-tile glass '+(hazardOn.length?'alert':'')} data-layout-key="cine-sec:hazards"><span class="cine-head">${t.cineSmokeWater}</span><span class="cine-big">${hazardOn.length?hazardOn.map(r=>ui.name(r)).join(', '):t.cineAllGood}</span><span class="cine-sub">${hazards.length} ${t.cineDetectors}</span></div>`:nothing}
 </section>
 <div class="cine-row">
  ${d.cameras.length?html`<section class="cine-card glass cine-cameras" aria-label=${t.cameras}><span class="cine-row-head"><span class="cine-head">${t.cameras}</span><button type="button" class="cine-link" @click=${()=>ui.nav('Kameras')}>${t.cineSeeAll} ›</button></span><div class="cine-cam-grid">${d.cameras.slice(0,2).map(r=>{const pic=artworkUrl(st(r.id)?.attributes?.entity_picture,c.hass);return html`<button type="button" class="cine-cam" aria-label=${ui.name(r)} @click=${()=>ui.native(r.id)}>${pic?html`<img src=${pic} alt="" referrerpolicy="no-referrer" @error=${e=>e.target.remove()}>`:nothing}<span class="cine-live"><i></i>${t.cineLive}</span><strong>${ui.name(r)}</strong></button>`;})}</div></section>`:nothing}
  <section class="cine-card glass cine-events" aria-label=${t.cineRecent}><span class="cine-head">${t.cineRecent}</span>${events.length?events.map(x=>html`<button type="button" class="cine-event" @click=${()=>{ui._modal={kind:'equipment',row:x.r};}}><span class="cine-event-time">${timeOf(x.s.last_changed)}</span><i aria-hidden="true"></i><span><span>${ui.name(x.r)} · ${ui.stateText(x.s)}</span><small>${x.r.areaName||''}</small></span></button>`):html`<small class="cine-sub">${t.noData}</small>`}</section>
 </div>
 <details class="cine-classic"><summary>${t.cineAllSecurity}</summary>${classic}</details>
 </div>`;}
