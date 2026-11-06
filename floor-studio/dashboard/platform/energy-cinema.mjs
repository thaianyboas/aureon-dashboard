import {html,svg,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import {energyValue} from './controller.mjs';
// Energy in the Cinema look. Only real values: the energy sources chosen in Settings, recorder statistics for the
// bars and current power sensors for "who uses most" and "per room". Missing data says so instead of inventing it.
export function energyCinema(ui,classic){const c=ui.c,t=ui.t,e=c.energy(),pw=ui.power(),series=c.series,period=ui._period||14;
 const sensors=c.list(['sensor']).map(r=>({r,w:energyValue(c.state(r.id),'power')})).filter(x=>x.w!==null&&x.w>=0&&x.r.id!==e.power.entityId);
 const consumers=[...sensors].sort((a,b)=>b.w-a.w).slice(0,5),cmax=Math.max(1,...consumers.map(x=>x.w));
 const rooms=[...sensors.reduce((m,x)=>{if(x.r.areaId)m.set(x.r.areaName||x.r.areaId,(m.get(x.r.areaName||x.r.areaId)||0)+x.w);return m;},new Map())].sort((a,b)=>b[1]-a[1]).slice(0,6),rmax=Math.max(1,...rooms.map(x=>x[1]));
 const watts=Number.isFinite(e.power.value)?e.power.value:null,peak=Math.max(1000,watts||0)*1.25,share=watts===null?0:Math.min(1,watts/peak);
 const mood=watts===null?'':watts<300?t.cineCalm:watts<1500?t.cineModerate:t.cineHigh;
 const fmtW=w=>w>=1000?`${ui.format(w/1000,1)} kW`:`${ui.format(w,0)} W`;
 const bars=series.slice(-period),bmax=Math.max(.001,...bars.map(x=>x.value));
 const dayLabel=time=>{try{return new Intl.DateTimeFormat(c.language,period<=7?{weekday:'short'}:{day:'numeric'}).format(new Date(time));}catch{return '';}};
 const ring=Math.round(2*Math.PI*130);
 return html`<div class="cine cine-energy">
 <div class="cine-glow" aria-hidden="true"></div>
 <div class="cine-sec-hero">
  <div class="cine-gauge">${svg`<svg viewBox="0 0 320 320" aria-hidden="true"><circle cx="160" cy="160" r="130" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14"/><circle class="cine-gauge-arc" cx="160" cy="160" r="130" fill="none" stroke="var(--p-accent)" stroke-width="14" stroke-linecap="round" stroke-dasharray=${Math.max(4,Math.round(ring*share))+' '+ring} transform="rotate(-90 160 160)"/><circle cx="160" cy="160" r="104" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="1"/></svg>`}<div class="cine-gauge-text"><span class="cine-head">${t.cineNowCaps}</span><span class="cine-gauge-value">${watts===null?'—':pw.value}</span><span class="cine-sub">${watts===null?t.noData:pw.unit}</span></div></div>
  <section class="cine-sec-text" aria-label=${t.energy}>
   <span class="cine-eyebrow">${t.energy}</span>
   <h1>${t.consumption}${mood?html`<br><em>${mood}</em>`:nothing}</h1>
   <div class="cine-stats">${[[t.today,e.daily.value,'kWh'],[t.cineCostToday,e.daily.cost,'€'],[t.cineThisMonth,e.monthly.value,'kWh']].map(([label,v,unit])=>html`<div class="glass"><span class="cine-head">${label}</span><span class="cine-big">${unit==='€'?(v===null||v===undefined?'—':ui.cost(v)):html`${v===null||v===undefined?'—':ui.format(v,v>=100?0:1)}<small> ${unit}</small>`}</span></div>`)}</div>
   ${e.power.entityId||e.daily.entityId?nothing:html`<button type="button" class="cine-link" @click=${()=>ui.nav('Einstellungen')}>${t.configure} · ${t.sources} ›</button>`}
  </section>
 </div>
 <section class="cine-card glass cine-bars-card" aria-label=${t.history}>
  <div class="cine-row-head"><span class="cine-head">${t.history}</span><div class="cine-segment" role="group" aria-label=${t.calendarPeriod}>${[7,14,30].map(n=>html`<button type="button" aria-pressed=${String(period===n)} @click=${()=>{ui._period=n;c.loadEnergy(n);ui.requestUpdate();}}>${n} ${t.days}</button>`)}</div></div>
  ${bars.length?html`<div class="cine-bars" role="img" aria-label=${t.consumption}>${bars.map(x=>html`<span class="cine-bar-col" title=${`${dayLabel(x.time)} · ${ui.format(x.value,1)} kWh`}><i style=${'height:'+Math.max(2,Math.round(100*x.value/bmax))+'%'}></i><small>${dayLabel(x.time)}</small></span>`)}</div>`:html`<div class="cine-empty"><small class="cine-sub">${c.busy.has('energy')?t.loading:t.cineNoHistory}</small>${e.total.entityId?html`<button type="button" class="cine-link" @click=${()=>c.loadEnergy(period)}>${t.refresh}</button>`:nothing}</div>`}
 </section>
 <div class="cine-row">
  <section class="cine-card glass cine-list-card" aria-label=${t.cineTopUsers}><span class="cine-head">${t.cineTopUsers}</span>${consumers.length?consumers.map(x=>html`<button type="button" class="cine-meter" @click=${()=>{ui._modal={kind:'equipment',row:x.r};}}><span><span>${ui.name(x.r)}</span><b>${fmtW(x.w)}</b></span><i><em style=${'width:'+Math.round(100*x.w/cmax)+'%'}></em></i></button>`):html`<small class="cine-sub">${t.cineNoPowerSensors}</small>`}</section>
  <section class="cine-card glass cine-list-card" aria-label=${t.cinePerRoom}><span class="cine-head">${t.cinePerRoom}</span>${rooms.length?html`<div class="cine-room-meters">${rooms.map(([name,w])=>html`<div class="cine-meter"><span><span>${name}</span><b>${fmtW(w)}</b></span><i><em style=${'width:'+Math.round(100*w/rmax)+'%'}></em></i></div>`)}</div>`:html`<small class="cine-sub">${t.cineNoPowerSensors}</small>`}</section>
 </div>
 <details class="cine-classic"><summary>${t.cineAllEnergy}</summary>${classic}</details>
 </div>`;}
