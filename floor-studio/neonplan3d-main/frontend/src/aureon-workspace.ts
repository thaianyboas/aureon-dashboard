import {css,svg} from 'lit';
/** Product chrome only. Geometry, commands, catalogues and renderer stay in the native editor. */
export const studioIcon=(path:string)=>svg`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${path}/></svg>`;
export const studioEditorStyles=css`
:host{--studio-edge:var(--fp3d-line);--studio-glass:color-mix(in srgb,var(--fp3d-chrome-solid) 94%,transparent)}
.fp3d-editor{--studio-library:0px;--studio-inspector:var(--fp3d-side-w,300px);grid-template-columns:76px var(--studio-library) minmax(0,1fr) var(--studio-inspector);grid-template-rows:64px minmax(0,1fr);gap:0;background:var(--fp3d-bg);border:1px solid var(--studio-edge);border-radius:18px;overflow:hidden;isolation:isolate}
.fp3d-editor.studio-has-library{--studio-library:270px}
.fp3d-editor:has(.fp3d-side-strip){--studio-inspector:52px}
.studio-header{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 20px;border-bottom:1px solid var(--studio-edge);background:var(--studio-glass);min-width:0}
.studio-name{display:flex;align-items:center;gap:12px;min-width:0}.studio-monogram{font:30px Georgia,serif;color:var(--fp3d-accent)}.studio-name strong{display:block;font:20px Georgia,serif;letter-spacing:.2px}.studio-name small{display:block;margin-top:3px;font-size:11px;color:var(--fp3d-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px}
.studio-look{font:12px var(--fp3d-font);color:var(--fp3d-text);background:var(--fp3d-bg);border:1px solid var(--studio-edge);border-radius:10px;min-height:38px;padding:7px 10px;max-width:135px}.studio-history{display:flex;gap:4px}.studio-history button{width:38px;min-height:38px;font-size:20px;padding:4px}.studio-views{display:flex;gap:4px;background:var(--fp3d-bg);border:1px solid var(--studio-edge);border-radius:12px;padding:4px}.studio-views button{min-width:54px;min-height:36px;border:0;border-radius:9px;background:transparent;color:var(--fp3d-text);cursor:pointer;font:12px var(--fp3d-font)}.studio-views button[aria-pressed=true]{background:var(--fp3d-accent);color:var(--fp3d-accent-text);box-shadow:0 3px 12px #0002}
.studio-rail{grid-column:1;grid-row:2;display:flex;flex-direction:column;align-items:stretch;gap:5px;padding:12px 7px;overflow:auto;border-right:1px solid var(--studio-edge);background:var(--studio-glass);z-index:5}.studio-rail button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:60px;border:1px solid transparent;border-radius:12px;color:var(--fp3d-muted);background:none;cursor:pointer;font:10px/1.25 var(--fp3d-font);padding:7px 2px;overflow-wrap:anywhere}.studio-rail button[aria-pressed=true],.studio-rail button:hover{color:var(--fp3d-accent);background:color-mix(in srgb,var(--fp3d-accent) 10%,transparent);border-color:var(--studio-edge)}.studio-rail button:disabled{opacity:.45;cursor:default}
.studio-library{grid-column:2;grid-row:2;min-width:0;overflow:auto;background:var(--studio-glass)}.studio-has-library .studio-library{padding:16px;border-right:1px solid var(--studio-edge)}.studio-library-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}.studio-library h2{font:21px Georgia,serif;margin:0}.studio-library .fp3d-furn-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.studio-library section{margin:0 0 18px}.studio-library input,.studio-library select{max-width:100%;box-sizing:border-box}
.fp3d-main{grid-column:3;grid-row:2;min-width:0;min-height:0}.fp3d-toolbar{padding:10px 14px;gap:10px;background:var(--studio-glass);border-bottom:1px solid var(--studio-edge);min-height:48px;z-index:15}.studio-menu{margin-left:auto;position:relative}.studio-menu>summary{list-style:none;cursor:pointer;min-height:36px;display:flex;align-items:center;gap:8px;border:1px solid var(--studio-edge);border-radius:10px;padding:0 14px;font:12px var(--fp3d-font)}.studio-menu>summary::-webkit-details-marker{display:none}.studio-menu[open] .studio-originaltools{position:absolute;right:0;top:44px;width:min(520px,75vw);display:flex;flex-wrap:wrap;gap:12px;padding:18px;border:1px solid var(--studio-edge);border-radius:16px;background:var(--fp3d-chrome-solid);box-shadow:0 18px 70px #0005;z-index:40}
.studio-inspector{grid-column:4;grid-row:2;min-width:0;min-height:0;position:relative;border-left:1px solid var(--studio-edge);background:var(--fp3d-chrome-solid);overflow:hidden}.studio-inspector-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--studio-edge);font:17px Georgia,serif}.studio-inspector>.fp3d-side{width:100%;height:calc(100% - 55px);box-sizing:border-box;background:none;border:0}.studio-inspector .fp3d-side-overlay{position:absolute;top:55px;right:0;bottom:0;width:100%;height:auto}.studio-inspector:has(.fp3d-side-strip) .studio-inspector-head{display:none}.studio-inspector:has(.fp3d-side-strip)>.fp3d-side{height:100%}
.fp3d-side h3{font-family:Georgia,serif;font-weight:400;font-size:19px}.fp3d-side section{border-radius:14px}.fp3d-editor button:focus-visible,.studio-menu>summary:focus-visible{outline:2px solid var(--fp3d-accent);outline-offset:2px}.fp3d-stage-pair{background:radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--fp3d-accent) 4%,var(--fp3d-bg)),var(--fp3d-bg))}.fp3d-canvas-wrap{background:transparent}.fp3d-hint{font-size:11px;line-height:1.5;background:var(--studio-glass);border-top:1px solid var(--studio-edge);padding:10px 14px}.studio-mobile-dock{display:none}.studio-view3d .fp3d-stage-pair{display:flex}.studio-view3d .fp3d-canvas-wrap,.studio-view3d .fp3d-split-handle{display:none}.studio-view3d .fp3d-editor-3d{flex:1;width:100%}
@media(max-width:1200px){.fp3d-editor{--studio-inspector:280px}.fp3d-editor.studio-has-library{--studio-library:0px}.studio-has-library .studio-library{position:absolute;left:76px;top:64px;bottom:0;width:260px;z-index:30;box-shadow:12px 0 40px #0004}.studio-name small{max-width:140px}.studio-name strong{font-size:18px}}
@media(max-width:700px){.fp3d-editor,.fp3d-editor.fp3d-narrow{--studio-sheet-height:clamp(180px,32vh,280px);display:flex;flex-direction:column;min-height:430px;height:100%;border-radius:14px;padding-bottom:66px;box-sizing:border-box}.studio-header{padding:9px 12px;min-height:54px;gap:8px;flex-wrap:wrap}.studio-name strong{font-size:17px}.studio-monogram{font-size:25px}.studio-name small{font-size:10px;max-width:150px}.studio-header>.fp3d-btn{font-size:11px;min-height:34px}.studio-views{margin-left:auto}.studio-views button{min-width:40px;font-size:11px}.studio-rail{display:none}.fp3d-main{flex:1;min-height:190px;display:flex;flex-direction:column;width:100%}.fp3d-stage-pair{flex:1;min-height:180px}.fp3d-toolbar{padding:6px 10px;min-height:42px;flex-wrap:nowrap}.fp3d-toolbar>.fp3d-seg{max-width:52%;min-width:0}.fp3d-toolbar>.fp3d-seg .fp3d-menu-wrap{min-width:0;max-width:100%}.fp3d-toolbar>.fp3d-seg .fp3d-menu-wrap>button{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.studio-header [data-studio-properties]{font-size:0;min-width:38px}.studio-header [data-studio-properties]:before{content:"☷";font-size:20px}.studio-history{margin-left:auto}.studio-history button{width:34px;min-height:36px}.studio-name{max-width:155px}.studio-name small{max-width:125px}.studio-menu>summary{padding:0 9px;font-size:11px}.studio-menu[open] .studio-originaltools{position:fixed;top:auto;bottom:90px;left:16px;right:16px;width:auto;max-height:60vh;overflow:auto}.studio-inspector{display:none}.studio-details-open .fp3d-main{padding-bottom:var(--studio-sheet-height);box-sizing:border-box}.studio-details-open .studio-inspector{display:block;position:absolute;left:8px;right:8px;bottom:72px;max-height:none;height:var(--studio-sheet-height);z-index:25;border:1px solid var(--studio-edge);border-radius:18px;box-shadow:0 -8px 50px #0004}.studio-inspector>.fp3d-side{padding:12px;height:calc(100% - 52px);overflow:auto}.studio-inspector-head{font-size:16px;padding:10px 14px}.studio-has-library .studio-library{position:absolute;top:auto;left:8px;right:8px;bottom:72px;width:auto;height:58%;border:1px solid var(--studio-edge);border-radius:18px;z-index:35}.studio-mobile-dock{display:flex;position:absolute;bottom:0;left:0;right:0;align-items:center;justify-content:space-around;padding:7px 6px calc(7px + env(safe-area-inset-bottom,0px));background:var(--fp3d-chrome-solid);border-top:1px solid var(--studio-edge);z-index:45}.studio-mobile-dock button{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;border-radius:10px;background:none;color:var(--fp3d-text);min-height:44px;min-width:64px;font-size:10px;cursor:pointer}.studio-mobile-dock button[aria-pressed=true]{color:var(--fp3d-accent);background:color-mix(in srgb,var(--fp3d-accent) 10%,transparent)}.studio-view3d .fp3d-editor-3d{min-height:180px}.fp3d-narrow .fp3d-stage-pair.fp3d-split{flex-direction:column}.fp3d-narrow .fp3d-stage-pair.fp3d-split>.fp3d-canvas-wrap{min-height:150px}.fp3d-narrow .fp3d-editor-3d{min-height:150px;flex:1}.fp3d-phone-hint{display:none}}
.studio-rail{gap:2px;padding:10px 7px 0}.studio-rail button{min-height:48px;gap:3px;padding:5px 2px}.studio-rail button svg{width:20px;height:20px;flex:0 0 auto}.studio-rail .aureon-rail-settings-btn{margin-top:auto;position:sticky;bottom:0;background:var(--fp3d-chrome-solid);border-top:1px solid var(--studio-edge);border-radius:12px 12px 0 0;padding-bottom:10px}
.aureon-rail-settings{position:absolute;left:84px;bottom:14px;z-index:60}.aureon-rail-settings .fp3d-menu-wrap>button{display:none}.aureon-rail-settings .fp3d-seg{background:none;border:0;padding:0;box-shadow:none}.aureon-rail-settings .fp3d-menu{position:relative;top:auto;right:auto;left:auto;bottom:auto;min-width:230px;max-height:70vh;overflow:auto;z-index:61}
/* AUREON: tool choices in their own bar, not over the 3D buttons */.aureon-optbar{display:flex;align-items:center;gap:16px;min-height:52px;padding:0 18px;box-sizing:border-box;background:var(--fp3d-chrome-solid);border-bottom:1px solid var(--studio-edge);position:relative;z-index:16}.aureon-tool-choices{display:flex;align-items:center;gap:22px;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent);padding-right:28px}.aureon-opt-group{display:flex;align-items:center;gap:6px;flex:0 0 auto}.aureon-opt-group+.aureon-opt-group{padding-left:22px;border-left:1px solid var(--studio-edge)}.aureon-opt-label{font-size:11.5px;color:var(--fp3d-muted);margin-right:6px;white-space:nowrap}.aureon-opt-sep{width:1px;height:18px;background:var(--studio-edge);margin:0 6px}.aureon-tool-choices .fp3d-chip{flex:0 0 auto;white-space:nowrap;height:32px;padding:0 13px;border-radius:999px;border:1px solid var(--studio-edge);background:transparent;color:var(--fp3d-text);font:500 12.5px var(--fp3d-font);cursor:pointer}.aureon-tool-choices .fp3d-chip[aria-pressed=true]{background:var(--fp3d-accent);color:var(--fp3d-accent-text);border-color:var(--fp3d-accent)}.aureon-optbar .fp3d-warn{flex:0 0 auto;margin-left:auto}
.aureon-view-extra button{min-width:0;padding:0 12px;white-space:nowrap}
@media(max-width:1200px){.aureon-view-extra button{padding:0 8px;font-size:11px}}
@media(max-width:700px){.aureon-view-extra{display:none}.aureon-more-open .studio-rail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));position:absolute;left:8px;right:8px;bottom:72px;max-height:62%;overflow:auto;z-index:46;border:1px solid var(--studio-edge);border-radius:18px;box-shadow:0 -8px 50px #0004;background:var(--fp3d-chrome-solid);padding:10px}.aureon-more-open .studio-rail .aureon-rail-settings-btn{position:static;margin:0;border:0;border-radius:12px;padding:7px 2px}.aureon-rail-settings{left:16px;right:16px;bottom:90px}.aureon-rail-settings .fp3d-menu{min-width:0;width:100%}.aureon-optbar{padding:0 10px;min-height:46px}}
@supports(height:100dvh){@media(max-width:700px){.studio-menu[open] .studio-originaltools{max-height:60dvh}}}

/* AUREON editor 2026-11-11: areas, drawer, quiet header; brass only for what is active or measured */
.fp3d-editor.studio-has-library{--studio-library:296px}
.aureon-head{gap:22px;padding:0 14px 0 18px;min-height:60px}
.aureon-head .studio-name{gap:10px;align-items:baseline}.aureon-head .studio-monogram{font-size:28px;align-self:center}.aureon-head .studio-name strong{font-size:21px}.aureon-head .studio-name small{margin:0 0 0 6px;font-size:12px}
.aureon-tabs{background:none;border:0;padding:0;gap:26px;align-self:stretch;margin-left:26px}
.aureon-tabs button,.aureon-tabs button[aria-pressed=true]{background:none;box-shadow:none;border-radius:0;min-width:0;padding:0 2px;color:var(--fp3d-muted);font:14px var(--fp3d-font);position:relative;height:100%}
.aureon-tabs button[aria-pressed=true]{color:var(--fp3d-text)}.aureon-tabs button[aria-pressed=true]:after{content:"";position:absolute;left:-3px;right:-3px;bottom:-1px;height:2px;border-radius:2px;background:var(--fp3d-accent)}
.aureon-tabs button:hover{color:var(--fp3d-text)}
.aureon-head-tools{margin-left:auto;display:flex;align-items:center;gap:2px}
.aureon-ghost{display:flex;align-items:center;gap:7px;height:36px;padding:0 10px;border:0;border-radius:10px;background:none;color:var(--fp3d-muted);font:13px var(--fp3d-font);cursor:pointer}
.aureon-ghost svg{width:19px;height:19px}.aureon-ghost:hover:not(:disabled),.aureon-ghost[aria-pressed=true]{color:var(--fp3d-text);background:color-mix(in srgb,var(--fp3d-text) 6%,transparent)}.aureon-ghost:disabled{opacity:.35;cursor:default}
.aureon-icon{width:36px;padding:0;justify-content:center}
.aureon-sep{width:1px;height:22px;background:var(--studio-edge);margin:0 8px}
.aureon-details{height:36px;margin-left:8px;padding:0 14px;border-radius:10px;border:1px solid var(--studio-edge);background:none;color:var(--fp3d-text);font:13px var(--fp3d-font);cursor:pointer}
.aureon-details[aria-pressed=true]{border-color:color-mix(in srgb,var(--fp3d-accent) 55%,transparent);background:color-mix(in srgb,var(--fp3d-accent) 12%,transparent)}
.aureon-areas{gap:4px;padding:14px 6px 0}
.aureon-areas button{min-height:66px;gap:6px;font-size:10.5px;line-height:1.2;position:relative;border:0;overflow-wrap:normal;word-break:normal;letter-spacing:-.1px}
.aureon-areas button svg{width:23px;height:23px}
.aureon-areas button[aria-pressed=true]{color:var(--fp3d-text);background:color-mix(in srgb,var(--fp3d-accent) 13%,transparent)}
.aureon-areas button[aria-pressed=true] svg{color:var(--fp3d-accent)}
.aureon-areas button[aria-pressed=true]:before{content:"";position:absolute;left:-6px;top:14px;bottom:14px;width:2px;border-radius:2px;background:var(--fp3d-accent)}
.aureon-areas button:hover:not([aria-pressed=true]){color:var(--fp3d-text);background:color-mix(in srgb,var(--fp3d-text) 5%,transparent);border-color:transparent}
.studio-has-library .aureon-drawer{padding:22px 16px 18px;display:flex;flex-direction:column}
.aureon-drawer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:0 4px}
.aureon-drawer-head h2{font:600 27px/1.05 Georgia,serif;margin:0;letter-spacing:.005em}
.aureon-drawer-close{border:0;background:none;color:var(--fp3d-muted);font-size:15px;width:30px;height:30px;border-radius:8px;cursor:pointer}.aureon-drawer-close:hover{color:var(--fp3d-text);background:color-mix(in srgb,var(--fp3d-text) 6%,transparent)}
.aureon-drawer-lead{color:var(--fp3d-muted);font-size:13px;line-height:1.45;margin:6px 4px 16px;max-width:32ch}
.aureon-drawer-group{color:var(--fp3d-muted);font-size:12px;margin:16px 6px 4px}
.aureon-row{display:flex;align-items:center;gap:12px;width:100%;min-height:42px;padding:8px 10px;border:0;border-radius:10px;background:none;color:var(--fp3d-text);font:14px var(--fp3d-font);text-align:left;cursor:pointer}
.aureon-row svg{width:20px;height:20px;color:var(--fp3d-muted);flex:none}.aureon-row span{flex:1}
.aureon-row:hover{background:color-mix(in srgb,var(--fp3d-text) 5%,transparent)}
.aureon-row[aria-pressed=true]{background:color-mix(in srgb,var(--fp3d-accent) 13%,transparent)}.aureon-row[aria-pressed=true] svg{color:var(--fp3d-accent)}
.aureon-row kbd{font:500 11px var(--fp3d-font);color:var(--fp3d-muted);border:1px solid var(--studio-edge);border-radius:6px;padding:1px 6px}
.aureon-drawer-body{min-height:0;overflow:auto;margin:0 -4px;padding:0 4px}
.aureon-drawer-body .fp3d-aureon-paint h3:first-child{display:none}
.aureon-drawer .fp3d-aureon-own-list{grid-template-columns:repeat(2,minmax(0,1fr))}
.aureon-drawer-empty{color:var(--fp3d-muted);font-size:13px;margin:8px 4px;padding:18px 14px;border:1px dashed var(--studio-edge);border-radius:12px}
.studio-inspector-head{font:600 20px Georgia,serif}
@media(max-width:1200px){.aureon-head-tools .aureon-ghost span{display:none}.aureon-tabs{margin-left:8px;gap:18px}.studio-has-library .aureon-drawer{left:76px;width:280px}}
@media(max-width:700px){.aureon-head{padding:8px 12px}.aureon-tabs{margin-left:auto;gap:14px;height:40px}.aureon-head-tools .aureon-ghost:not(.aureon-icon),.aureon-sep{display:none}.aureon-head .studio-name small{display:none}}

.aureon-tabs-sm{display:flex;gap:22px;margin:2px 4px 14px;border-bottom:1px solid var(--studio-edge)}
.aureon-tabs-sm button{position:relative;border:0;background:none;padding:0 0 10px;color:var(--fp3d-muted);font:14px var(--fp3d-font);cursor:pointer}
.aureon-tabs-sm button small{font-size:11px;color:var(--fp3d-muted);margin-left:3px}
.aureon-tabs-sm button[aria-selected=true]{color:var(--fp3d-text)}.aureon-tabs-sm button[aria-selected=true]:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:2px;background:var(--fp3d-accent)}
.aureon-apply{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--studio-edge);border-radius:10px;overflow:hidden;margin:0 4px 10px}
.aureon-apply button{border:0;background:none;color:var(--fp3d-muted);font:13px var(--fp3d-font);padding:9px 6px;cursor:pointer}
.aureon-apply button[aria-checked=true]{background:color-mix(in srgb,var(--fp3d-accent) 15%,transparent);color:var(--fp3d-text)}
.aureon-finish-for{color:var(--fp3d-muted);font-size:12.5px;line-height:1.4;margin:0 4px 12px}
.aureon-drawer .fp3d-aureon-wall-map{max-height:150px;margin:0 0 12px}
.aureon-fan{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 2px}
.aureon-fan[aria-disabled=true]{opacity:.45;pointer-events:none}
.aureon-chip{display:flex;flex-direction:column;border:1px solid var(--studio-edge);border-radius:9px;overflow:hidden;background:color-mix(in srgb,var(--fp3d-text) 3%,transparent);padding:0;cursor:pointer;color:var(--fp3d-text);text-align:left;position:relative}
.aureon-chip i{display:block;height:42px;border-bottom:1px solid var(--studio-edge)}
.aureon-chip span{font:11.5px/1.25 var(--fp3d-font);padding:6px 8px 7px}
.aureon-chip[aria-pressed=true]{outline:2px solid var(--fp3d-accent);outline-offset:2px}
.aureon-chip:hover{border-color:color-mix(in srgb,var(--fp3d-accent) 45%,transparent)}
.aureon-chip-free i{background:conic-gradient(#e7c8a0,#c5cdb9,#b9c4cc,#d9b29a,#8d5c16,#e7c8a0)}
.aureon-chip-free input{position:absolute;inset:0;opacity:0;cursor:pointer}
.aureon-tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 2px 8px}
.aureon-tile{height:64px;border:1px solid var(--studio-edge);border-radius:9px;position:relative;cursor:pointer;padding:0}
.aureon-tile span{position:absolute;left:6px;bottom:6px;font:11px var(--fp3d-font);color:#f3ede3;background:rgba(18,15,12,.82);padding:2px 7px;border-radius:6px}
.aureon-tile[aria-pressed=true]{outline:2px solid var(--fp3d-accent);outline-offset:2px}
.aureon-tile-oak_planks{background:repeating-linear-gradient(90deg,#b98a5b 0 17px,#9f7449 17px 18px,#c69a6a 18px 35px,#a47a4e 35px 36px)}
.aureon-tile-oak_herringbone{background:repeating-linear-gradient(45deg,#c39465 0 9px,#a97c4f 9px 10px),#c39465;background-blend-mode:multiply}
.aureon-tile-white_tiles_floor,.aureon-tile-white_tiles_wall{background:repeating-linear-gradient(0deg,#eeedea 0 15px,#cfccc6 15px 16px),repeating-linear-gradient(90deg,#eeedea 0 15px,#cfccc6 15px 16px);background-blend-mode:darken}
.aureon-tile-white_tiles_navy_band{background:linear-gradient(0deg,#eeedea 0 40%,#24345c 40% 49%,#eeedea 49%)}
.aureon-tile-deck_tiles{background:repeating-linear-gradient(0deg,#8f6d4b 0 9px,#6e5137 9px 10px)}
.aureon-tile-light_brick{background:repeating-linear-gradient(0deg,#c48c6c 0 11px,#e9ddd2 11px 13px)}
.aureon-finish-actions{display:flex;flex-wrap:wrap;gap:4px 16px;margin:12px 4px 0}
.aureon-link{border:0;background:none;padding:6px 0;color:var(--fp3d-accent);font:13px var(--fp3d-font);cursor:pointer;text-align:left}
.aureon-link:hover{text-decoration:underline}
.aureon-search{display:flex;align-items:center;gap:8px;border:1px solid var(--studio-edge);border-radius:10px;padding:0 10px;margin:0 2px 12px;color:var(--fp3d-muted)}
.aureon-search svg{width:17px;height:17px}.aureon-search input{flex:1;border:0;background:none;color:var(--fp3d-text);font:13px var(--fp3d-font);padding:9px 0;outline:none;min-width:0}
.aureon-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 2px}
.aureon-card{display:flex;flex-direction:column;align-items:stretch;border:0;border-radius:10px;overflow:hidden;background:color-mix(in srgb,var(--fp3d-text) 4%,transparent);padding:0;cursor:pointer;color:var(--fp3d-text);text-align:left}
.aureon-card img,.aureon-card i{display:block;height:84px;width:100%;object-fit:contain;background:radial-gradient(circle at 50% 40%,#2c2620,#1a1714)}
.aureon-card b{font:500 12.5px/1.25 var(--fp3d-font);padding:8px 9px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.aureon-card small{font-size:11px;color:var(--fp3d-muted);padding:3px 9px 9px}
.aureon-card:hover{background:color-mix(in srgb,var(--fp3d-accent) 10%,transparent)}
.aureon-pager{display:flex;align-items:center;justify-content:space-between;margin:12px 4px 0;color:var(--fp3d-muted);font-size:12px}
.aureon-pager button{border:0;background:none;color:var(--fp3d-text);font:12px var(--fp3d-font);cursor:pointer;padding:6px 2px}.aureon-pager button:disabled{opacity:.3;cursor:default}
.aureon-import{margin:14px 4px 0;display:inline-block}
@media(min-width:701px){.fp3d-editor:not(.studio-details-open){--studio-inspector:0px}.fp3d-editor:not(.studio-details-open) .studio-inspector{display:none}}

/* AUREON editor 2026-11-11 (2): one top bar, floating details card, quiet hint */
.aureon-floor .fp3d-seg{background:none;border:0;padding:0;box-shadow:none}.aureon-floor .fp3d-menu-wrap>button{border:0;background:none;color:var(--fp3d-muted);font:13px var(--fp3d-font);padding:6px 8px;border-radius:8px;min-height:0}.aureon-floor .fp3d-menu-wrap>button:hover{color:var(--fp3d-text);background:color-mix(in srgb,var(--fp3d-text) 6%,transparent)}
.aureon-done{height:36px;margin-left:8px;padding:0 18px;border:0;border-radius:10px;background:var(--fp3d-accent);color:var(--fp3d-accent-text,#1a140b);font:600 13px var(--fp3d-font);cursor:pointer}
@media(min-width:701px){
.fp3d-editor,.fp3d-editor:not(.studio-details-open){--studio-inspector:0px}
.fp3d-editor .studio-inspector{grid-column:1/-1;grid-row:2;position:absolute;right:18px;top:14px;width:min(360px,calc(100% - 140px));max-height:calc(100% - 28px);border:1px solid var(--studio-edge);border-radius:16px;box-shadow:0 24px 60px #0007;background:color-mix(in srgb,var(--fp3d-chrome-solid) 97%,transparent);z-index:30;display:flex;flex-direction:column}
.fp3d-editor .studio-inspector>.fp3d-side{height:auto;width:auto;flex:1;min-height:0;overflow:auto}
.fp3d-editor .studio-inspector .fp3d-side-overlay{position:static;height:auto}
.fp3d-editor .studio-inspector-head{border-bottom:1px solid var(--studio-edge);padding:12px 14px 12px 18px}
.fp3d-editor .studio-inspector-head .fp3d-btn{border:0;background:none;color:var(--fp3d-muted)}
.fp3d-editor:not(.studio-details-open) .studio-inspector{display:none}
.fp3d-main{position:relative;display:flex;flex-direction:column}.fp3d-main>.fp3d-stage-pair{flex:1;min-height:0}
.fp3d-toolbar{position:absolute;left:14px;top:12px;right:14px;z-index:20;background:none;border:0;padding:0;min-height:0;pointer-events:none;flex-wrap:wrap}
.fp3d-toolbar>*{pointer-events:auto}
.aureon-optbar .fp3d-warn,.fp3d-toolbar .fp3d-warn{font-size:12px;padding:6px 12px;border-radius:999px;background:color-mix(in srgb,var(--fp3d-chrome-solid) 92%,transparent);border:1px solid color-mix(in srgb,#e0a24a 40%,transparent)}
.fp3d-toolbar:empty{display:none}
.aureon-warn-fix{padding:0 0 0 8px;font-size:12px;font-weight:600}
.fp3d-hint{position:absolute;left:16px;bottom:14px;max-width:min(560px,60%);border:1px solid var(--studio-edge);border-radius:10px;background:color-mix(in srgb,var(--fp3d-chrome-solid) 90%,transparent);color:var(--fp3d-muted);padding:7px 12px;z-index:12;font-size:11.5px}
.fp3d-stage-pair{background-color:var(--fp3d-bg);background-image:radial-gradient(color-mix(in srgb,var(--fp3d-text) 9%,transparent) 1px,transparent 1.3px);background-size:24px 24px}
}

.studio-inspector .fp3d-pin-row{display:none}
.aureon-room-card{padding:4px 18px 18px;overflow:auto;min-height:0}
.aureon-card-sub{color:var(--fp3d-muted);font-size:12.5px;margin:0 0 14px}
.aureon-card-name{display:block;margin-bottom:6px}.aureon-card-name span{display:block;font-size:11.5px;color:var(--fp3d-muted);margin-bottom:5px}
.aureon-card-name input{width:100%;box-sizing:border-box;border:1px solid var(--studio-edge);border-radius:10px;background:color-mix(in srgb,var(--fp3d-text) 4%,transparent);color:var(--fp3d-text);font:14px var(--fp3d-font);padding:9px 12px}
.aureon-card-dl{display:grid;grid-template-columns:1fr auto;margin:6px 0 14px}
.aureon-card-dl dt,.aureon-card-dl dd{margin:0;padding:11px 0;border-bottom:1px solid var(--studio-edge);font-size:13px}
.aureon-card-dl dt{color:var(--fp3d-muted)}.aureon-card-dl dd{text-align:right;font-variant-numeric:tabular-nums}
.aureon-card-dl dd input{width:62px;border:1px solid var(--studio-edge);border-radius:8px;background:none;color:var(--fp3d-text);font:13px var(--fp3d-font);padding:4px 6px;text-align:right}
.aureon-card-acts{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--studio-edge);border-radius:12px;overflow:hidden}
.aureon-card-act{display:flex;align-items:center;gap:9px;border:0;background:none;color:var(--fp3d-text);font:13px var(--fp3d-font);padding:12px;text-align:left;cursor:pointer}
.aureon-card-act:nth-child(even){border-left:1px solid var(--studio-edge)}.aureon-card-act:nth-child(n+3){border-top:1px solid var(--studio-edge)}
.aureon-card-act svg{width:18px;height:18px;color:var(--fp3d-accent);flex:none}.aureon-card-act:hover{background:color-mix(in srgb,var(--fp3d-accent) 9%,transparent)}
.aureon-more{margin-top:14px}.aureon-more>summary{text-transform:none;letter-spacing:0;font-weight:400;cursor:pointer;color:var(--fp3d-muted);font-size:13px;padding:8px 2px;list-style:none}.aureon-more>summary::-webkit-details-marker{display:none}.aureon-more>summary:before{content:"›";display:inline-block;margin-right:8px;transition:transform .15s}.aureon-more[open]>summary:before{transform:rotate(90deg)}
.aureon-more>.fp3d-side{width:auto;height:auto;border:0;background:none;padding:0;overflow:visible}
.studio-inspector-head strong{font:600 22px Georgia,serif}
.studio-inspector .fp3d-side .fp3d-sub{font-size:11.5px;line-height:1.45}
`;
