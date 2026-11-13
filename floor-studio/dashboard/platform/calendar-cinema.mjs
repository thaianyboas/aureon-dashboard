import {html,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import {wasteName} from '../integrations/waste.mjs';
// Calendar in the Cinema look: one agenda across all visible Home Assistant calendars, grouped by day, with a
// month overview and the waste pickups. Events are only read (GET /api/calendars/...); nothing is changed here.
const HUES=['var(--p-accent)','#7fb4e6','#e59a8c','#8fd0a8','#c39be8','#e8c26a','#6fcfcf','#e88fb8'];
const PERIODS=[7,14,30,90];
export function dayKey(date,timeZone){try{return new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}catch{return date.toISOString().slice(0,10);}}
function addDays(key,n){const d=new Date(key+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function fmt(lang,opts,date,timeZone){try{return new Intl.DateTimeFormat(lang,{timeZone,...opts}).format(date);}catch{return '';}}
const cap=s=>s?s.charAt(0).toLocaleUpperCase()+s.slice(1):s;
// One row per event and day; all-day events that span several days appear on each day (end date is exclusive).
export function agenda(events,{timeZone='UTC',todayKey,days=14}={}){
 const lastKey=addDays(todayKey,days),rows=[];
 for(const [calendar,list] of events)for(const e of list||[]){
  const start=e?.start,end=e?.end,allDay=!!(start&&typeof start==='object'&&start.date&&!start.dateTime);
  if(allDay){let k=start.date;const stop=end?.date&&end.date>k?end.date:addDays(k,1);for(let i=0;k<stop&&i<92;i++,k=addDays(k,1))if(k>=todayKey&&k<lastKey)rows.push({calendar,e,allDay:true,key:k,first:k===start.date,multi:stop>addDays(start.date,1)});continue;}
  const iso=typeof start==='string'?start:start?.dateTime,ms=Date.parse(iso);if(!Number.isFinite(ms))continue;
  const endMs=Date.parse(typeof end==='string'?end:end?.dateTime),key=dayKey(new Date(ms),timeZone);
  if(key<lastKey&&(key>=todayKey||(Number.isFinite(endMs)&&dayKey(new Date(endMs),timeZone)>=todayKey)))rows.push({calendar,e,allDay:false,key:key<todayKey?todayKey:key,ms,endMs:Number.isFinite(endMs)?endMs:null});
 }
 rows.sort((a,b)=>a.key.localeCompare(b.key)||(b.allDay-a.allDay)||((a.ms||0)-(b.ms||0))||String(a.e.summary||'').localeCompare(String(b.e.summary||'')));
 const groups=new Map();for(const r of rows){if(!groups.has(r.key))groups.set(r.key,[]);groups.get(r.key).push(r);}
 return groups;
}
export function calendarCinema(ui){
 const c=ui.c,t=ui.t,lang=c.language,timeZone=c.hass?.config?.time_zone||'UTC',now=new Date(c.now()),todayKey=dayKey(now,timeZone);
 const rows=c.list(['calendar']),ids=rows.map(r=>r.id),period=PERIODS.includes(ui._period)?ui._period:14;
 const hidden=ui._calHidden||(ui._calHidden=new Set());
 const want=period+'|'+ids.join(',')+'|'+c.epoch;
 if(ids.length&&ui._calLoaded!==want&&c.hass){ui._calLoaded=want;Promise.resolve(c.loadCalendars(period,ids)).then(()=>ui.requestUpdate());}
 const loading=ids.some(id=>c.busy?.has?.('calendar:'+id));
 const color=new Map(rows.map((r,i)=>[r.id,HUES[i%HUES.length]]));
 const groups=agenda(rows.filter(r=>!hidden.has(r.id)).map(r=>[r.id,c.events[r.id]]),{timeZone,todayKey,days:period});
 const total=[...groups.values()].reduce((n,g)=>n+g.length,0);
 const next=[...groups.values()].flat().find(r=>!r.allDay&&(r.endMs??r.ms)>=now.getTime())||[...groups.values()].flat()[0];
 const wasteIds=new Set(c.preferences.waste||[]),title=r=>{const raw=r.e.summary||r.e.message||'—';return wasteIds.has(r.calendar)?wasteName(raw):raw;};
 const nameOf=id=>{const r=rows.find(x=>x.id===id);return r?ui.name(r):id;};
 const time=ms=>fmt(lang,{hour:'2-digit',minute:'2-digit'},new Date(ms),timeZone);
 const dayTitle=key=>key===todayKey?t.today:key===addDays(todayKey,1)?t.tomorrow:cap(fmt(lang,{weekday:'long'},new Date(key+'T12:00:00Z'),'UTC'));
 const dayDate=key=>fmt(lang,{day:'numeric',month:'long'},new Date(key+'T12:00:00Z'),'UTC');
 const until=r=>{const m=Math.round((r.ms-now.getTime())/60000);if(r.allDay||!Number.isFinite(m))return '';if(m<=0)return t.calNow;try{const f=new Intl.RelativeTimeFormat(lang,{numeric:'auto'});return m<60?f.format(m,'minute'):m<1440?f.format(Math.round(m/60),'hour'):f.format(Math.round(m/1440),'day');}catch{return '';}};
 const jump=key=>{ui.renderRoot?.querySelector(`[data-day="${key}"]`)?.scrollIntoView({behavior:'smooth',block:'start'});};
 // Month overview (Monday first) for the current month, dots on days with events.
 const [y,mo]=todayKey.split('-').map(Number),first=new Date(Date.UTC(y,mo-1,1)),lead=(first.getUTCDay()+6)%7,len=new Date(Date.UTC(y,mo,0)).getUTCDate();
 const weekdays=[...Array(7)].map((_,i)=>fmt(lang,{weekday:'narrow'},new Date(Date.UTC(2024,0,1+i)),'UTC'));
 const cells=[...Array(lead).fill(null),...Array.from({length:len},(_,i)=>`${y}-${String(mo).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`)];
 const event=r=>html`<li class="cal-event" style=${'--cal:'+color.get(r.calendar)}>
   <span class="cal-time">${r.allDay?html`<b>${t.calAllDay}</b>`:html`<b>${time(r.ms)}</b>${r.endMs?html`<small>${time(r.endMs)}</small>`:nothing}`}</span>
   <span class="cal-bar" aria-hidden="true"></span>
   <span class="cal-text"><strong>${title(r)}</strong>${r.e.location?html`<small class="cal-loc">${r.e.location}</small>`:nothing}<small class="cal-src">${nameOf(r.calendar)}</small></span>
  </li>`;
 return html`<div class="cine cine-calendar">
 <div class="cine-glow" aria-hidden="true"></div>
 <header class="cal-hero">
  <div class="cal-hero-text"><span class="cine-eyebrow">AUREON · ${t.calendar}</span>
   <h1>${cap(fmt(lang,{weekday:'long'},now,timeZone))}<em>${fmt(lang,{day:'numeric',month:'long'},now,timeZone)}</em></h1>
   <p class="cal-summary">${loading&&!total?t.loading:total?`${total} ${total===1?t.calEvent:t.calEvents} · ${period} ${t.days}`:t.calFree}</p></div>
  ${next?html`<section class="cal-next glass" style=${'--cal:'+color.get(next.calendar)} aria-label=${t.calNext}><span class="cine-head">${t.calNext}</span><strong>${title(next)}</strong><span class="cal-next-when">${next.allDay?`${dayTitle(next.key)} · ${t.calAllDay}`:`${dayTitle(next.key)} · ${time(next.ms)}`}${until(next)?html` <i>${until(next)}</i>`:nothing}</span>${next.e.location?html`<small>${next.e.location}</small>`:nothing}</section>`:nothing}
 </header>
 <div class="cal-controls">
  <div class="cal-seg" role="group" aria-label=${t.calendarPeriod}>${PERIODS.map(d=>html`<button type="button" aria-pressed=${String(period===d)} @click=${()=>{ui._period=d;ui.requestUpdate();}}>${d} ${t.days}</button>`)}</div>
  <div class="cal-filters">${rows.map(r=>html`<button type="button" class="cal-chip" style=${'--cal:'+color.get(r.id)} aria-pressed=${String(!hidden.has(r.id))} @click=${()=>{hidden.has(r.id)?hidden.delete(r.id):hidden.add(r.id);ui.requestUpdate();}}><i aria-hidden="true"></i>${ui.name(r)}</button>`)}
   <button type="button" class="cal-refresh" ?disabled=${loading} title=${t.refresh} aria-label=${t.refresh} @click=${()=>{ui._calLoaded='';ui.requestUpdate();}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"></path></svg></button></div>
 </div>
 <div class="cal-layout">
  <section class="cal-agenda" aria-label=${t.calAgenda}>
   ${rows.map(r=>ui.error('calendar:'+r.id))}
   ${!rows.length?html`<div class="cal-empty glass"><strong>${t.calNoCalendars}</strong><small>${t.calNoCalendarsHint}</small></div>`
   :!groups.size?html`<div class="cal-empty glass"><strong>${loading?t.loading:t.calFree}</strong><small>${loading?'':t.calFreeHint}</small></div>`
   :[...groups].map(([key,list])=>html`<div class="cal-day" data-day=${key}><div class=${'cal-day-head '+(key===todayKey?'today':'')}><span class="cal-day-name">${dayTitle(key)}</span><span class="cal-day-date">${dayDate(key)}</span><span class="cal-day-count">${list.length}</span></div><ul>${list.map(event)}</ul></div>`)}
  </section>
  <aside class="cal-side">
   <section class="cal-month glass" aria-label=${fmt(lang,{month:'long',year:'numeric'},now,timeZone)}>
    <h2>${cap(fmt(lang,{month:'long'},now,timeZone))} <span>${y}</span></h2>
    <div class="cal-grid">${weekdays.map(w=>html`<span class="cal-wd">${w}</span>`)}${cells.map(k=>k?html`<button type="button" class=${'cal-cell'+(k===todayKey?' today':'')+(groups.has(k)?' has':'')+(k<todayKey?' past':'')} ?disabled=${!groups.has(k)} @click=${()=>jump(k)} aria-label=${dayDate(k)}>${Number(k.slice(8))}${groups.has(k)?html`<i aria-hidden="true">${groups.get(k).slice(0,3).map(r=>html`<b style=${'background:'+color.get(r.calendar)}></b>`)}</i>`:nothing}</button>`:html`<span></span>`)}</div>
   </section>
   ${c.preferences.waste?.length?html`<div class="cal-waste">${ui.wasteWidget()}</div>`:nothing}
  </aside>
 </div>
 </div>`;
}
