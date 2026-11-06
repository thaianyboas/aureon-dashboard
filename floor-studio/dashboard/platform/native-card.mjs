// Home Assistant cards inside AUREON pages: built-in Lovelace cards and cards installed through HACS
// (they register themselves in window.customCards). Cards are created with Home Assistant's own card
// helpers and edited with each card's own visual editor; nothing here calls a service by itself.
import {cleanCardConfig} from './card-layout-model.mjs';

// Built-in Lovelace cards offered in the picker. Names come from Home Assistant's own translations.
export const BUILTIN_CARDS=['tile','entities','entity','button','glance','gauge','sensor','history-graph','statistics-graph','statistic','thermostat','humidifier','light','media-control','weather-forecast','alarm-panel','area','calendar','todo-list','map','picture','picture-entity','picture-glance','logbook','markdown','iframe','plant-status','grid','vertical-stack','horizontal-stack'];

export function cardName(hass,type){if(type.startsWith('custom:')){const found=customCardList().find(c=>'custom:'+c.type===type);return found?.name||type.slice(7);}try{const n=hass?.localize?.(`ui.panel.lovelace.editor.card.${type.replace(/-/g,'_')}.name`)||hass?.localize?.(`ui.panel.lovelace.editor.card.${type}.name`);if(n)return n;}catch{}return type.replace(/-/g,' ').replace(/^./,x=>x.toUpperCase());}
export function cardDescription(hass,type){if(type.startsWith('custom:'))return customCardList().find(c=>'custom:'+c.type===type)?.description||'';try{return hass?.localize?.(`ui.panel.lovelace.editor.card.${type.replace(/-/g,'_')}.description`)||'';}catch{return '';}}
// Cards from HACS (or any custom resource). Entries are untrusted data: only the declared type, name and description are read.
export function customCardList(){const list=Array.isArray(globalThis.customCards)?globalThis.customCards:[];const seen=new Set(),out=[];for(const c of list){if(!c||typeof c.type!=='string')continue;const type=c.type.replace(/^custom:/,'');if(!/^[a-zA-Z0-9_.-]{1,100}$/.test(type)||seen.has(type)||type==='aureon-dashboard')continue;seen.add(type);out.push({type,name:typeof c.name==='string'?c.name.slice(0,80):type,description:typeof c.description==='string'?c.description.slice(0,200):''});}return out;}
export function cardCatalog(hass,query=''){const q=query.trim().toLowerCase();const all=[...customCardList().map(c=>({type:'custom:'+c.type,name:c.name,description:c.description,source:'hacs'})),...BUILTIN_CARDS.map(type=>({type,name:cardName(hass,type),description:cardDescription(hass,type),source:'ha'}))];return q?all.filter(c=>(c.name+' '+c.type+' '+c.description).toLowerCase().includes(q)):all;}

let helpersPromise=null;
export function cardHelpers(){if(!globalThis.loadCardHelpers)return Promise.reject(new Error('Home Assistant card helpers are not available'));helpersPromise??=globalThis.loadCardHelpers();return helpersPromise;}
const tagFor=type=>type.startsWith('custom:')?type.slice(7):`hui-${type}-card`;
async function cardClass(type){const tag=tagFor(type);if(!customElements.get(tag)){const helpers=await cardHelpers();try{helpers.createCardElement({type});}catch{}await Promise.race([customElements.whenDefined(tag),new Promise(r=>setTimeout(r,4000))]);}return customElements.get(tag);}
// A starting configuration, from the card itself when it offers one (the same as Home Assistant's own picker).
export async function stubConfig(type,hass){const fallback={type};try{const cls=await cardClass(type);if(cls?.getStubConfig){const ids=Object.keys(hass?.states||{});const stub=await cls.getStubConfig(hass,ids,ids);const clean=cleanCardConfig({...stub,type});if(clean)return clean;}}catch{}if(['tile','entity','button','gauge','sensor','light','thermostat','media-control','weather-forecast','alarm-panel','humidifier','picture-entity'].includes(type)){const domain={gauge:'sensor',sensor:'sensor',light:'light',thermostat:'climate','media-control':'media_player','weather-forecast':'weather','alarm-panel':'alarm_control_panel',humidifier:'humidifier','picture-entity':'camera'}[type];const id=Object.keys(hass?.states||{}).find(x=>!domain||x.startsWith(domain+'.'));if(id)fallback.entity=id;}if(type==='entities'||type==='glance'||type==='history-graph')fallback.entities=Object.keys(hass?.states||{}).filter(x=>/^(light|switch|sensor)\./.test(x)).slice(0,3);if(type==='markdown')fallback.content='AUREON';if(['grid','vertical-stack','horizontal-stack'].includes(type))fallback.cards=[];return fallback;}
export async function configEditor(type){try{const cls=await cardClass(type);if(!cls?.getConfigElement)return null;return await cls.getConfigElement();}catch{return null;}}

// Renders one Lovelace card. Errors stay inside the card with Home Assistant's own error card.
export class AureonLovelaceCard extends HTMLElement{
 constructor(){super();this._config=null;this._hass=null;this._card=null;this._epoch=0;}
 set hass(h){this._hass=h;if(this._card)this._card.hass=h;}
 get hass(){return this._hass;}
 set config(c){const clean=cleanCardConfig(c);if(JSON.stringify(clean)===JSON.stringify(this._config))return;this._config=clean;this._build();}
 get config(){return this._config;}
 connectedCallback(){if(!this._card&&this._config)this._build();}
 async _build(){const epoch=++this._epoch,config=this._config;if(!config){this.replaceChildren();this._card=null;return;}try{const helpers=await cardHelpers();if(epoch!==this._epoch)return;const card=helpers.createCardElement(config);card.hass=this._hass;card.addEventListener('ll-rebuild',e=>{e.stopPropagation();this._build();},{once:true});this._card=card;this.replaceChildren(card);}catch(e){if(epoch!==this._epoch)return;const p=document.createElement('p');p.className='native-card-error';p.textContent=String(e?.message||e);this._card=null;this.replaceChildren(p);}}
}
if(!customElements.get('aureon-lovelace-card'))customElements.define('aureon-lovelace-card',AureonLovelaceCard);

// The card's own visual editor (when it has one) plus a code field. Emits 'aureon-config' with a validated config.
export class AureonCardEditor extends HTMLElement{
 constructor(){super();this._config=null;this._hass=null;this._editor=null;this._type='';this._labels={};}
 set labels(l){this._labels=l||{};}
 set hass(h){this._hass=h;if(this._editor)this._editor.hass=h;}
 set config(c){const clean=cleanCardConfig(c);if(!clean||JSON.stringify(clean)===JSON.stringify(this._config))return;const typeChanged=clean.type!==this._type;this._config=clean;if(typeChanged){this._type=clean.type;this._mount();}else{this._editor?.setConfig?.(clean);this._syncCode();}}
 get config(){return this._config;}
 _emit(){this.dispatchEvent(new CustomEvent('aureon-config',{detail:{config:this._config},bubbles:true,composed:true}));}
 _syncCode(){if(this._code&&document.activeElement!==this._code&&this.getRootNode().activeElement!==this._code)this._code.value=JSON.stringify(this._config,null,2);}
 async _mount(){const l=this._labels,type=this._type;this.replaceChildren();const visual=document.createElement('div');visual.className='native-editor-visual';const code=document.createElement('textarea');code.className='native-editor-code';code.spellcheck=false;code.rows=10;code.setAttribute('aria-label',l.cardCode||'Code');this._code=code;const status=document.createElement('small');status.className='native-editor-status';status.setAttribute('role','status');const codeLabel=document.createElement('details');const summary=document.createElement('summary');summary.textContent=l.cardCode||'Code';codeLabel.append(summary,code,status);this.append(visual,codeLabel);this._syncCode();
  code.addEventListener('input',()=>{let parsed;try{parsed=JSON.parse(code.value);}catch{status.textContent=l.cardCodeInvalid||'Invalid code';return;}const clean=cleanCardConfig(parsed);if(!clean){status.textContent=l.cardCodeInvalid||'Invalid code';return;}status.textContent='';this._config=clean;if(clean.type!==this._type){this._type=clean.type;this._mount();}else this._editor?.setConfig?.(clean);this._emit();});
  const wait=document.createElement('p');wait.className='hint';wait.textContent=l.loading||'…';visual.append(wait);const editor=await configEditor(type);if(type!==this._type)return;visual.replaceChildren();if(!editor){const p=document.createElement('p');p.className='hint';p.textContent=l.cardNoVisualEditor||'';visual.append(p);codeLabel.open=true;return;}
  this._editor=editor;editor.hass=this._hass;try{editor.lovelace={config:{views:[]},editMode:true};}catch{}try{editor.setConfig(this._config);}catch(e){const p=document.createElement('p');p.className='hint';p.textContent=String(e?.message||e);visual.append(p);codeLabel.open=true;}
  editor.addEventListener('config-changed',e=>{e.stopPropagation();const clean=cleanCardConfig(e.detail?.config);if(!clean)return;this._config=clean;this._syncCode();this._emit();});visual.append(editor);}
}
if(!customElements.get('aureon-card-editor'))customElements.define('aureon-card-editor',AureonCardEditor);
