import {render,nothing} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
// Overlays drawn on document.body: AUREON pages use CSS containers, which trap position:fixed, and Home Assistant's
// pickers open their lists on document.body, where a modal <dialog> would cover them. One layer per name and page.
const AUREON_VARS=['--au-bg','--au-surface','--au-text','--au-surface-text','--au-accent','--au-accent-text','--au-muted','--au-border','--au-card','--au-hover','--p-surface','--p-border','--p-accent','--p-accent-text','--p-muted','--p-text'];
const ACCENT_VARS=['--au-accent','--au-accent-text','--p-accent','--p-accent-text'];
const HA_VARS='--au-surface:var(--card-background-color,#fff);--au-text:var(--primary-text-color,#212121);--au-surface-text:var(--primary-text-color,#212121);--au-muted:var(--secondary-text-color,#727272);--au-border:var(--divider-color,#0000001f);--p-surface:var(--card-background-color,#fff);--p-text:var(--primary-text-color,#212121);--p-muted:var(--secondary-text-color,#727272);--p-border:var(--divider-color,#0000001f);';
// theme 'aureon': the page's own colours; theme 'ha': Home Assistant's theme (for HA card editors) with the AUREON accent.
export function syncLayer(ui,name,template,{theme='aureon'}={}){ui._layers??={};let host=ui._layers[name];
 if(!template||template===nothing){if(host){render(nothing,host.shadowRoot);host.remove();delete ui._layers[name];}return;}
 if(!host){host=document.createElement('aureon-layer');host.attachShadow({mode:'open'});try{host.shadowRoot.adoptedStyleSheets=[ui.constructor.styles.styleSheet];}catch{}document.body.append(host);ui._layers[name]=host;}
 const cs=getComputedStyle(ui),copy=v=>{const x=cs.getPropertyValue(v);return x?`${v}:${x};`:'';};
 host.style.cssText='position:fixed;inset:0;z-index:7;display:block;container-type:normal;contain:none;'+(theme==='ha'?HA_VARS+ACCENT_VARS.map(copy).join('')+'color:var(--primary-text-color,#212121);':AUREON_VARS.map(copy).join('')+`color:${cs.color};`)+`font-family:${cs.fontFamily}`;
 render(template,host.shadowRoot);}
export function disposeLayers(ui){for(const name of Object.keys(ui._layers||{}))syncLayer(ui,name,null);}
