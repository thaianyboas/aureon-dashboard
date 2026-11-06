import {html,svg,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import {accentControls} from './theme-picker.mjs';
import {layoutDefault} from './card-layout-model.mjs';
import {equipmentKinds,equipmentKind} from './discovery.mjs';
// Settings in the Cinema look: one elegant place for theme, look, start page, cards, music and every other setting.
// The detailed panels (equipment, energy, waste, room images, plan, advanced) are the existing ones.
const ICONS={labels:'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',appearance:'M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.7 4.7 0 0 0 22 9.7C22 5.9 17.5 3 12 3zM7 12a1.3 1.3 0 1 1 0-2.6A1.3 1.3 0 0 1 7 12zm3-4a1.3 1.3 0 1 1 0-2.6A1.3 1.3 0 0 1 10 8zm5 0a1.3 1.3 0 1 1 0-2.6A1.3 1.3 0 0 1 15 8z',start:'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-7h6v7',cards:'M3 4h8v7H3zM13 4h8v4h-8zM13 10h8v10h-8zM3 13h8v7H3z',music:'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',visibility:'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z',energy:'M13 2 4 14h7l-1 8 9-12h-7z',waste:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',images:'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6M15.5 8.5h.01',bindings:'m12 3 9 5-9 5-9-5zM3 13l9 5 9-5',advanced:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'};
const icon=name=>svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${ICONS[name]||ICONS.advanced}></path></svg>`;
const PAGES=[['home','Início'],['rooms','Räume'],['devices','Geräte'],['energy','Energie'],['security','Sicherheit'],['cameras','Kameras'],['calendar','Agenda'],['automation','Automationen']];
function lookCard(ui,value,title,hint,art){const on=(ui.c.preferences.look||'cinema')===value;return html`<button type="button" class="set-choice" aria-pressed=${String(on)} @click=${()=>ui.save('look',value)}><span class="set-choice-art">${art}</span><strong>${title}</strong><small>${hint}</small></button>`;}
const cinemaArt=svg`<svg viewBox="0 0 120 72" aria-hidden="true"><rect width="120" height="72" rx="8" fill="#0e0d0c"/><circle cx="34" cy="20" r="30" fill="var(--p-accent)" opacity=".14"/><text x="10" y="30" font-family="Georgia,serif" font-size="15" fill="#f4efe6">Bom dia</text><rect x="10" y="42" width="22" height="20" rx="5" fill="#ffffff14"/><rect x="36" y="42" width="22" height="20" rx="5" fill="#ffffff14"/><rect x="62" y="42" width="22" height="20" rx="5" fill="var(--p-accent)" opacity=".35"/><rect x="88" y="42" width="22" height="20" rx="5" fill="#ffffff14"/><rect x="88" y="10" width="22" height="26" rx="5" fill="#ffffff14"/></svg>`;
const classicArt=svg`<svg viewBox="0 0 120 72" aria-hidden="true"><rect width="120" height="72" rx="8" fill="#141414"/><path d="M18 50 48 34l30 12-30 16z" fill="#e9e1d2" opacity=".85"/><path d="M48 34v-8l30 12v8M18 50v-8l30-16" fill="none" stroke="#bfb6a6" stroke-width="1.2"/><rect x="88" y="10" width="22" height="22" rx="5" fill="#ffffff14"/><rect x="88" y="36" width="22" height="12" rx="4" fill="#ffffff14"/><rect x="88" y="52" width="22" height="12" rx="4" fill="#ffffff14"/></svg>`;
function appearancePanel(ui){const c=ui.c,t=ui.t,p=c.preferences,ha=p.appearance==='auto';
 return html`<section class="set-panel glass">
  <h2>${t.setLook}</h2><p class="set-hint">${t.setLookHint}</p>
  <div class="set-choices">${lookCard(ui,'cinema',t.look_cinema,t.setCinemaHint,cinemaArt)}${lookCard(ui,'classic',t.look_classic,t.setClassicHint,classicArt)}</div>
 </section>
 <section class="set-panel glass">
  <h2>${t.setTheme}</h2><p class="set-hint">${t.setThemeHint}</p>
  <button type="button" class="set-ha-theme" aria-pressed=${String(ha)} @click=${()=>ui.save('appearance','auto')}><span class="set-ha-dot" aria-hidden="true"></span><span><strong>${t.themeFollowHa}</strong><small>${t.themeFollowHaHint}</small></span></button>
  <div class="theme-gallery set-gallery" aria-label=${t.setTheme}>${(ui.palettes||[]).map(r=>{const on=p.appearance==='custom'&&p.palette===r.id;return html`<button class="theme-visual" data-theme=${r.id} aria-pressed=${String(on)} @click=${()=>{c.patch('appearance','custom');ui.save('palette',r.id);}}>${ui.themeMiniature(r)}<span class="theme-visual-name"><strong>${r.name}</strong><span aria-hidden="true">${on?'✓':''}</span></span></button>`;})}</div>
  ${accentControls(ui)}
 </section>
 <section class="set-panel glass">
  <h2>${t.setLayout}</h2>
  <div class="set-row"><span><strong>${t.density}</strong><small>${t.setDensityHint}</small></span><div class="cine-segment set-segment" role="group" aria-label=${t.density}>${['compact','comfortable'].map(v=>html`<button type="button" aria-pressed=${String(p.density===v)} @click=${()=>ui.save('density',v)}>${t[v]}</button>`)}</div></div>
  <h3 class="set-sub">${t.setStartWidgets}</h3>
  <div class="set-switches">${Object.entries(p.widgets).map(([key,value])=>html`<label class="set-switch"><span>${t[key]||key}</span><input type="checkbox" role="switch" .checked=${value} @change=${e=>ui.save('widgets',{...p.widgets,[key]:e.target.checked})}><i aria-hidden="true"></i></label>`)}</div>
 </section>`;}
function cardsPanel(ui){const c=ui.c,t=ui.t,layouts=c.preferences.cardLayouts||{};
 return html`<section class="set-panel glass"><h2>${t.setCards}</h2><p class="set-hint">${t.setCardsHint}</p>
  <div class="set-list">${PAGES.map(([id,route])=>{const l=layouts[id]||layoutDefault(),n=l.added.length,h=l.hidden.length;return html`<div class="set-list-row"><span><strong>${t[id]||route}</strong><small>${n||h?[n?`${n} ${t.setCardsAdded}`:'',h?`${h} ${t.setCardsHidden}`:''].filter(Boolean).join(' · '):t.setCardsDefault}</small></span><span class="set-actions"><button type="button" @click=${()=>{ui.nav(route);}}>${t.layoutEditAll} ›</button>${n||h||l.order.length?html`<button type="button" class="ghost" @click=${()=>{ui.save('cardLayouts',{...layouts,[id]:layoutDefault()});}}>${t.layoutReset}</button>`:nothing}</span></div>`;})}</div></section>`;}
function musicPanel(ui){const c=ui.c,t=ui.t,s=c.hass?.services||{},has=d=>!!s[d];
 const parts=[['aureon_music',t.setAureonMusic,t.setAureonMusicHint],['spotifyplus','SpotifyPlus',t.setOriginalHint],['spotcast','Spotcast',t.setOriginalHint]];
 const players=Object.keys(c.hass?.states||{}).filter(id=>id.startsWith('media_player.'));
 return html`<section class="set-panel glass"><h2>${t.music}</h2><p class="set-hint">${t.setMusicHint}</p>
  <div class="set-list">${parts.map(([d,name,hint])=>html`<div class="set-list-row"><span><strong>${name}</strong><small>${hint}</small></span><span class=${'set-status '+(has(d)?'on':'')}>${has(d)?t.setInstalled:t.setNotInstalled}</span></div>`)}</div>
  ${has('aureon_music')&&(has('spotifyplus')||has('spotcast'))?html`<p class="set-note">${t.setRemoveOriginals}</p>`:nothing}
  ${c.hass?.user?.is_admin?html`<div class="set-actions"><a class="set-button" href="/config/integrations/integration/aureon_music">${t.setOpenIntegration} ›</a><a class="set-button ghost" href="/config/application_credentials">${t.setSpotifyCredentials} ›</a></div>`:nothing}
  <label class="field set-field">${t.setDefaultPlayer}<select @change=${e=>ui.save('music',{...c.preferences.music,entity:e.target.value})}><option value="">${t.setAutomatic}</option>${players.map(id=>html`<option value=${id} ?selected=${c.preferences.music.entity===id}>${c.hass.states[id]?.attributes?.friendly_name||id}</option>`)}</select></label>
 </section>`;}
function labelChips(ui,selected,onToggle,label){const labels=ui.c.labels||[];if(!labels.length)return html`<p class="set-hint">${ui.t.setNoLabels}</p>`;
 return html`<div class="set-chips" role="group" aria-label=${label}>${labels.map(l=>{const on=selected.includes(l.id);return html`<button type="button" class="set-chip" aria-pressed=${String(on)} style=${l.color&&/^[a-z_]+$|^#[0-9a-f]{3,8}$/i.test(l.color)?'--chip:'+(l.color.startsWith('#')?l.color:'var(--'+l.color.replaceAll('_','-')+'-color, var(--p-accent))'):''} @click=${()=>onToggle(l.id,!on)}><i aria-hidden="true"></i>${l.name}</button>`;})}</div>`;}
function labelsPanel(ui){const c=ui.c,t=ui.t,p=c.preferences,v=p.labelVisibility||{include:[],exclude:[]},kinds=p.labelKinds||{};
 const setVis=(key,id,on)=>{const list=new Set(v[key]||[]);on?list.add(id):list.delete(id);ui.save('labelVisibility',{...v,[key]:[...list]});};
 const setKind=(kind,id,on)=>{const list=new Set(kinds[kind]||[]);on?list.add(id):list.delete(id);const next={...kinds,[kind]:[...list]};if(!next[kind].length)delete next[kind];ui.save('labelKinds',next);};
 const all=c.allRows||[],count=kind=>c.rows.filter(r=>equipmentKind(r,c.state(r.id),p,c.labels)===kind).length,total=kind=>all.filter(r=>equipmentKind(r,c.hass?.states?.[r.id],p,c.labels)===kind).length;
 const kindList=equipmentKinds.filter(k=>!['technical','other'].includes(k));
 return html`<section class="set-panel glass"><h2>${t.setLabelsTitle}</h2><p class="set-hint">${t.setLabelsHint}</p>
  <div class="set-label-summary"><span><b>${c.rows.length}</b> ${t.setShownOf} ${all.length}</span>${c.hass?.user?.is_admin?html`<a class="set-button ghost" href="/config/labels">${t.setManageLabels} ›</a>`:nothing}</div>
 </section>
 <section class="set-panel glass"><h3 class="set-sub">${t.setShowOnly}</h3><p class="set-hint">${t.setShowOnlyHint}</p>${labelChips(ui,v.include||[],(id,on)=>setVis('include',id,on),t.setShowOnly)}
  <h3 class="set-sub">${t.setNeverShow}</h3><p class="set-hint">${t.setNeverShowHint}</p>${labelChips(ui,v.exclude||[],(id,on)=>setVis('exclude',id,on),t.setNeverShow)}</section>
 <section class="set-panel glass"><h3 class="set-sub">${t.setPerArea}</h3><p class="set-hint">${t.setPerAreaHint}</p>
  <div class="set-kinds">${kindList.map(k=>{const sel=kinds[k]||[];return html`<details class="set-kind" ?open=${sel.length>0}><summary><span><strong>${t['equipment_'+k]||k}</strong><small>${sel.length?sel.map(id=>c.labels.find(l=>l.id===id)?.name||id).join(', '):t.setAllOfKind}</small></span><span class="set-kind-count">${count(k)}/${total(k)}</span></summary>${labelChips(ui,sel,(id,on)=>setKind(k,id,on),t['equipment_'+k]||k)}</details>`;})}</div></section>`;}
function summary(ui,id){const c=ui.c,t=ui.t,p=c.preferences;const pal=(ui.palettes||[]).find(r=>r.id===p.palette);
 switch(id){case'appearance':return [p.appearance==='auto'?t.setHaThemeShort:p.appearance==='custom'?pal?.name:t[p.appearance],t['look_'+(p.look||'cinema')]?.split(' (')[0]].filter(Boolean).join(' · ');
  case'cards':{const n=Object.values(p.cardLayouts||{}).reduce((a,l)=>a+(l.added?.length||0),0);return n?`${n} ${t.setCardsAdded}`:t.setCardsDefault;}
  case'music':return c.hass?.services?.aureon_music?t.setAureonMusic:c.hass?.services?.spotifyplus?'SpotifyPlus':t.setNotInstalled;
  case'energy':return p.energy.power||p.energy.total?[p.energy.power&&t.power,p.energy.total&&'kWh'].filter(Boolean).join(' · '):t.setNotConfigured;
  case'waste':return p.waste.length?`${p.waste.length} ${t.setSources}`:t.setNotConfigured;
  case'images':{const n=Object.keys(p.roomImages||{}).length;return n?`${n} ${t.rooms}`:t.setAutomatic;}
  case'labels':{const v=p.labelVisibility||{},n=(v.include||[]).length+(v.exclude||[]).length+Object.keys(p.labelKinds||{}).length;return n?`${c.rows.length} ${t.setShownShort}`:t.setAllVisible;}
  case'visibility':return p.hidden.length?`${p.hidden.length} ${t.setHiddenDevices}`:t.setAllVisible;
  default:return '';}}
export function settingsCinema(ui,items,content){const c=ui.c,t=ui.t,tab=ui._settingsTab;
 const cats=[['appearance','appearance',t.appearance,t.setAppearanceHint],['cards','cards',t.setCards,t.setCardsShort],['music','music',t.music,t.setMusicShort],['labels','labels',t.setLabelsTitle,t.setLabelsShort],...items.filter(([id])=>id!=='appearance').map(([id,,label,hint])=>[id,id,t[label],t[hint]])];
 const panels={...content,appearance:appearancePanel(ui),cards:cardsPanel(ui),music:musicPanel(ui),labels:labelsPanel(ui)};
 const go=id=>{ui._settingsTab=id;ui._search='';ui._settingsLimit=30;ui.getRootNode().querySelector('main')?.scrollTo({top:0});ui.requestUpdate();};
 const current=cats.find(x=>x[0]===tab);
 return html`<div class="cine cine-settings">
 <div class="cine-glow" aria-hidden="true"></div>
 <header class="set-hero"><span class="cine-eyebrow">AUREON · ${t.settings}</span><h1>${current?current[2]:html`${t.settings}<br><em>${t.setSubtitle}</em>`}</h1><span class=${'set-saved '+(c.storageError?'warn':'')}><i aria-hidden="true"></i>${c.storageError?t.storageError:t.setSavedEverywhere}</span></header>
 ${current?html`<button type="button" class="set-back" @click=${()=>go('')}>‹ ${t.settings}</button><div class="set-detail">${panels[tab]||nothing}</div>`
 :html`<div class="set-grid">${cats.map(([id,ic,label,hint])=>html`<button type="button" class="set-cat glass" data-settings-tab=${id} @click=${()=>go(id)}><span class="set-cat-icon">${icon(ic)}</span><span class="set-cat-text"><strong>${label}</strong><small>${hint}</small></span><span class="set-cat-now">${summary(ui,id)}</span><span class="set-cat-arrow" aria-hidden="true">›</span></button>`)}</div>`}
 </div>`;}
