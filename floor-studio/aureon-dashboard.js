/* AUREON v0.2 — original dashboard strategy foundation; no external requests. */
(() => {
  'use strict';
  const VERSION = '0.29.0-test.3';
  const BUILD_ID = 'AUREON-SETTINGS-20261103';
  // AUREON design tokens: single source of truth. Palettes are visual references, not copied logic.
  const PALETTES = {"cinema":{"name":"Grafite Cinema","accent":"#e6cc9a","background":"#0e0d0c","surface":"#1b1a18","text":"#f4efe6","muted":"#a9a296","border":"#ffffff1f","sage":"#cfc8bc","ambient":true},"aubergine-balance":{"name":"Aubergine · Balance","accent":"#f2cba5","background":"#240f1e","surface":"#422236","text":"#fff3e6","muted":"#debfcd","border":"#d7a0b760","ambient":false},"black-gold-royal": {"name": "Black & Gold · Imperial", "accent": "#D9B76E", "background": "#050505", "surface": "#18140D", "text": "#E8C77D"}, "black-bordeaux-royal": {"name": "Black & Bordeaux · Prestige", "accent": "#C35B76", "background": "#050505", "surface": "#1B0D13", "text": "#E3A0B1"}, "purple": {"name": "Royal Purple", "accent": "#a477f5", "background": "#111019", "surface": "#282037", "text": "#f6f3fb"}, "blue": {"name": "Midnight Blue", "accent": "#559cff", "background": "#0c1628", "surface": "#1c304b", "text": "#f5f8ff"}, "emerald": {"name": "Emerald", "accent": "#43c6a0", "background": "#0c1b19", "surface": "#1c3530", "text": "#f2fff9"}, "burgundy": {"name": "Burgundy", "accent": "#ce6c90", "background": "#221219", "surface": "#3a222d", "text": "#fff4f7"}, "rose-noir": {"name": "Rose Noir", "accent": "#e3a04b", "background": "#190d17", "surface": "#301823", "text": "#fff1f4"}, "gold": {"name": "Champagne Gold", "accent": "#b8ab92", "background": "#1b1b1a", "surface": "#2c2b29", "text": "#fff9ed"}, "pearl": {"name": "Pearl White", "accent": "#7664a9", "background": "#f5f3f8", "surface": "#ffffff", "text": "#30283a"}, "obsidian": {"name": "Obsidian", "accent": "#b6b9c2", "background": "#101114", "surface": "#25272c", "text": "#f6f6f8"}, "sapphire": {"name": "Sapphire Night", "accent": "#70a9ed", "background": "#081425", "surface": "#162b43", "text": "#f1f7ff"}, "forest": {"name": "Forest Luxe", "accent": "#b2c79a", "background": "#101c18", "surface": "#24382d", "text": "#f5f7ef"}, "forest-botanical": {"name": "Forest Luxe · Botanical", "accent": "#d5bd8c", "background": "#0b1511", "surface": "#162419", "text": "#f4f0e6", "muted": "#b9c0ae", "border": "#e2dbb738", "sage": "#b6cba0", "ambient": true}, "terracotta": {"name": "Terracotta Atelier", "accent": "#b85e48", "background": "#faf1e8", "surface": "#fffaf5", "text": "#322820"}, "sand": {"name": "Desert Sand", "accent": "#96734b", "background": "#f4e9d7", "surface": "#fff9ed", "text": "#312b22"}, "ocean": {"name": "Ocean Mist", "accent": "#277c8c", "background": "#e8f4f4", "surface": "#f9ffff", "text": "#18323b"}, "amethyst": {"name": "Amethyst Velvet", "accent": "#c2a1eb", "background": "#1b1429", "surface": "#322440", "text": "#faf3ff"}, "copper": {"name": "Copper Noir", "accent": "#d59a72", "background": "#171513", "surface": "#30251f", "text": "#fff4e9"}, "sage": {"name": "Sage Residence", "accent": "#657b57", "background": "#f0f2e9", "surface": "#fcfdf8", "text": "#283229"}, "arctic": {"name": "Arctic Silver", "accent": "#53778e", "background": "#edf2f6", "surface": "#ffffff", "text": "#1b2a36"}, "ruby": {"name": "Ruby Eclipse", "accent": "#ed8794", "background": "#200e18", "surface": "#3a202d", "text": "#fff4f7"}, "lavender": {"name": "Lavender Cloud", "accent": "#8068b0", "background": "#f3effa", "surface": "#ffffff", "text": "#2b2341"}, "graphite": {"name": "Graphite Studio", "accent": "#c6d0d9", "background": "#171b20", "surface": "#2b3038", "text": "#f6f8fb"}, "silver-penthouse": {"name": "Silver Penthouse", "accent": "#A8C9E2", "background": "#10171C", "surface": "#242D35", "text": "#F0F2F4", "muted": "#BBC6CE", "border": "#BDD5E340", "sage": "#CDD8DF", "ambient": true}, "amethyst-lounge": {"name": "Amethyst Lounge", "accent": "#EDB5A3", "background": "#1B111D", "surface": "#302231", "text": "#FFF0EA", "muted": "#D4BCCA", "border": "#EDB5A345", "sage": "#C3A1CD", "ambient": true}};
  const DEFAULT_THEME = 'forest';
  const THEME_KEY = 'aureon.theme.v1';
  const clampHex = value => /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : null;
  function luminance(hex) {
    const rgb = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4);
    return rgb[0]*0.2126 + rgb[1]*0.7152 + rgb[2]*0.0722;
  }
  function contrast(a,b) { const x=luminance(a), y=luminance(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
  function readableOn(bg, preferred) {
    if (contrast(bg,preferred) >= 4.5) return preferred;
    const options=['#ffffff','#101412'];
    return options.sort((a,b)=>contrast(bg,b)-contrast(bg,a))[0];
  }
  function getSavedTheme() {
    try { const data=JSON.parse(localStorage.getItem(THEME_KEY)||'{}'); return data && typeof data==='object' ? data : {}; }
    catch (_) { return {}; }
  }
  function storeTheme(data) { try { localStorage.setItem(THEME_KEY,JSON.stringify(data)); } catch (_) {} }
  // Own accent colour chosen by the owner: applied on top of any theme (also Home Assistant's own theme).
  function themeTokens(selection, hass) {
    const tokens=baseThemeTokens(selection, hass), accent=clampHex(selection?.accent);
    if (accent) { tokens['--au-accent']=accent; tokens['--au-accent-text']=readableOn(accent,'#ffffff'); tokens['--au-sage']=accent; }
    return tokens;
  }
  function baseThemeTokens(selection, hass) {
    const mode=['auto','dark','light','custom'].includes(selection.mode) ? selection.mode : 'auto';
    // Native Home Assistant theme variables are inherited by this custom card.
    // Do not replace the user's selected HA theme with an AUREON palette.
    if (mode === 'auto') {
      return {
        '--au-bg':'var(--primary-background-color, #101c18)',
        '--au-surface':'var(--card-background-color, var(--ha-card-background, #24382d))',
        '--au-text':'var(--primary-text-color, #f5f7ef)',
        '--au-surface-text':'var(--primary-text-color, #f5f7ef)',
        '--au-accent':'var(--accent-color, var(--primary-color, #b2c79a))',
        '--au-accent-text':'var(--text-primary-color, #ffffff)',
        '--au-muted':'var(--secondary-text-color, #c4d0c9)',
        '--au-border':'var(--divider-color, #ffffff25)',
        '--au-nav':'var(--primary-background-color, #101c18)',
        '--au-card':'var(--card-background-color, var(--ha-card-background, #24382d))',
        '--au-hover':'var(--secondary-background-color, #ffffff17)',
        '--au-sage':'var(--accent-color, var(--primary-color, #b2c79a))', '--au-ambient-opacity':'0'
      };
    }
    // Fixed modes must not retain a previously chosen custom palette.
    let colors = { ...PALETTES[mode === 'dark' ? 'forest-botanical' : mode === 'light' ? 'sage' : (PALETTES[selection.palette] ? selection.palette : DEFAULT_THEME)] };
    if (mode === 'custom') {
      const custom=selection.custom||{};
      for (const key of ['accent','background','surface','text']) {
        if (clampHex(custom[key])) colors[key]=custom[key];
      }
    }
    const fg = readableOn(colors.background, colors.text);
    const surfaceFg = readableOn(colors.surface, fg);
    const accentFg = readableOn(colors.accent, fg);
    const isDark=luminance(colors.background)<0.25;
    return {
      '--au-bg':colors.background, '--au-surface':colors.surface,
      '--au-text':fg, '--au-surface-text':surfaceFg, '--au-accent':colors.accent,
      '--au-accent-text':accentFg, '--au-muted':colors.muted||(isDark?'#c4d0c9':'#4b5751'),
      '--au-border':colors.border||(isDark?'#ffffff25':'#00000022'),
      '--au-sage':colors.sage||colors.accent,
      '--au-ambient-opacity':colors.ambient?(isDark?'.54':'.13'):'0',
      '--au-nav':colors.background, '--au-card':colors.surface,
      '--au-hover':isDark?'#ffffff17':'#00000012'
    };
  }
  // Local vector icons: no CDN, no external card or HA icon registry dependency.
  const NAV_PATHS = {"Início": ["M3 10.5 12 3l9 7.5", "M5 9.5V21h14V9.5", "M9 21v-7h6v7"], "Räume": ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"], "Geräte": ["M4 7h16", "M7 4v6", "M4 17h16", "M17 14v6", "M12 4v16"], "Energie": ["M13 2 3 14h8l-1 8 11-12h-8z"], "Sicherheit": ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "m9 12 2 2 4-4"], "Kameras": ["M4 6h16v12H4z", "M8 6V4h8v2", "M8 18v2h8v-2", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"], "Medien": ["M9 18V5l12-2v13", "M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0z", "M21 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0z"], "JARVIS": ["M12 3a4 4 0 0 0-4 4 4 4 0 0 0-3 6 4 4 0 0 0 3 6 4 4 0 0 0 4 2", "M12 3a4 4 0 0 1 4 4 4 4 0 0 1 3 6 4 4 0 0 1-3 6 4 4 0 0 1-4 2", "M12 3v18", "M8 9l4 3 4-3", "M8 16l4-3 4 3"], "Agenda": ["M3 5h18v16H3z", "M7 3v4", "M17 3v4", "M3 10h18", "M7 14h3", "M14 14h3", "M7 18h3"], "Automationen": ["M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M5 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M19 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M10.5 8.5 6.5 15.5", "M13.5 8.5l4 7", "M8 18h8"], "Planta": ["M3 4h18v16H3z", "M3 11h8", "M11 4v12", "M15 11h6", "M15 11v9"], "Einstellungen": ["M12 3v2", "M12 19v2", "M3 12h2", "M19 12h2", "m5.6 5.6 1.4 1.4", "m17 17 1.4 1.4", "m18.4 5.6-1.4 1.4", "m7 17-1.4 1.4", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]};
  function aureonNavIcon(page) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '21');
    svg.setAttribute('height', '21');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.65');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    for (const d of NAV_PATHS[page] || []) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.append(path);
    }
    return svg;
  }
  const PAGES = [
    ['⌂','Início'],['▦','Räume'],['◉','Geräte'],['ϟ','Energie'],
    ['◇','Sicherheit'],['▣','Kameras'],['♫','Medien'],['✧','JARVIS'],
    ['▤','Agenda'],['↻','Automationen'],['▱','Planta'],['⚙','Einstellungen']
  ];
  const MODULES = [
    ['▱','AUREON Floor Studio','Planta','Editor de planta integrado'],
    ['✧','JARVIS AI','JARVIS','IA e ferramentas protegidas em preparação'],
    ['◇','Segurança','Sicherheit','Controles e permissões em preparação'],
    ['ϟ','Energia','Energie','Consumo e custos em preparação'],
    ['▤','Müll & Agenda','Agenda','Coleta e calendário em preparação'],
    ['◉','Dispositivos','Geräte','Descoberta de entidades em preparação'],
    ['▣','Câmeras','Kameras','Visualização protegida em preparação']
  ];
  class AureonDashboard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._page = 'Início';
      this._configured = false;
      this._theme = getSavedTheme();
      this._registry = null;
      this._registryError = '';
      this._registryLoading = false;
      this._registryPromise = null;
      this._registryHass = null;
      this._deviceArea = 'all';
      this._deviceSearch = '';
      this._deviceDomain = 'all';
      this._deviceAvailability = 'all';
      this._deviceGroup = 'device';
      this._deviceShowOnly = false;
      this._deviceLimit = 80;
      this._deviceClass = 'all';
      this._deviceLabel = 'all';
      this._lastRegistrySignature = '';
      this._lastRuntimeEntitySignature = '';
      this._registryUpdatedAt = null;
      this._registryRefreshTimer = null;
      this._expandedDevices = new Set();
      this._controlBusy = new Set();
      this._controlError = '';
      this._homeStateSignature = '';
      this._studioCards = this._studioRead();
      this._studioEdit = null;
      this._studioRendered = [];
      this._studioRenderToken = 0;
      this._floorMountToken = 0;
      this._floorCard = null;
    }
    connectedCallback() {
      this._shellResize=()=>{cancelAnimationFrame(this._shellFrame);this._shellFrame=requestAnimationFrame(()=>this._fitShell());};
      window.addEventListener('resize',this._shellResize,{passive:true});
      window.visualViewport?.addEventListener('resize',this._shellResize,{passive:true});
      this._shellObserver=new ResizeObserver(this._shellResize);this._shellObserver.observe(this);
      if(this.parentElement)this._shellObserver.observe(this.parentElement);
      this._shellResize();
    }
    disconnectedCallback() {
      window.removeEventListener('resize',this._shellResize);window.visualViewport?.removeEventListener('resize',this._shellResize);
      this._shellObserver?.disconnect();cancelAnimationFrame(this._shellFrame);
    }
    _fitShell() {
      if(!this.isConnected)return;
      const viewport=window.visualViewport,bottom=viewport?viewport.offsetTop+viewport.height:window.innerHeight;
      const height=Math.max(200,Math.floor(bottom-Math.max(viewport?.offsetTop||0,this.getBoundingClientRect().top)-12))+'px';
      if(this.style.getPropertyValue('--aureon-available-height')!==height)this.style.setProperty('--aureon-available-height',height);
    }
    setConfig(config) {
      if (config && config.type && config.type !== 'custom:aureon-dashboard') {
        throw new Error('Tipo de cartão AUREON inválido');
      }
      this._musicConfig = config?.music || {};
      this._configured = true;
      try { this._render(); }
      catch (error) {
        console.error('[AUREON] Dashboard initialization failed',error);
        const fallback=document.createElement('div');
        fallback.style.cssText='padding:20px;color:var(--primary-text-color);background:var(--card-background-color)';
        fallback.textContent='AUREON v'+VERSION+' — falha ao iniciar um módulo. Veja o console para detalhes.';
        this.shadowRoot.replaceChildren(fallback);
      }
      if (this._hass?.callWS && !this._registry && !this._registryPromise) this._loadRegistry();
    }
    set hass(value) {
      const oldMode=this._hass?.themes?.darkMode;
      const identityChanged=!!this._hass&&(this._hass.user?.id!==value?.user?.id||this._hass.connection!==value?.connection);
      if(identityChanged){this._registryEpoch=(this._registryEpoch||0)+1;this._registry=null;this._registryPromise=null;this._registryError='';this._musicController?.configure({allowedEntities:[]});}
      this._hass=value;
      this._musicController?.setHass(value);
      this._platformController?.update(value,this._registry);
      const language=value?.locale?.language||value?.language||'en',languageChanged=this._shellLanguage&&this._shellLanguage!==language;this._shellLanguage=language;
      if(languageChanged&&this._configured&&!identityChanged){const current=this.shadowRoot.querySelector('aureon-platform'),tab=current?._settingsTab;this._render();const next=this.shadowRoot.querySelector('aureon-platform');if(next&&next.page==='settings')next._settingsTab=tab||'';}

      if(identityChanged&&this._configured)this._render();
      const studioKey=this._studioStorageKey();
      if(this._studioLoadedKey!==studioKey){this._studioLoadedKey=studioKey;this._studioCards=this._studioRead();if(this._configured&&this._page==='Início')this._render();}
      for (const card of this._studioRendered) { try { card.hass=value; } catch(error) { console.warn('[AUREON] Card state update failed',error); } }
      if (this._configured && oldMode !== value?.themes?.darkMode) { if(this._page==='Planta'&&this._floorCard)requestAnimationFrame(()=>this._applyThemeTokens()); else this._render(); }
      // Registry references are exposed by newer HA frontends; older versions use the WS fallback.
      // Debounce registry refreshes, never refetch on every sensor state update.
      const signature = [value?.entities, value?.devices, value?.areas].map(x => x && typeof x==='object' ? Object.keys(x).length : '-').join(':');
      if (this._registry && signature !== this._lastRegistrySignature && signature !== '-:-:-') {
        this._lastRegistrySignature=signature;
        if(this._registryRefreshTimer) clearTimeout(this._registryRefreshTimer);
        this._registryRefreshTimer=setTimeout(()=>{this._registryRefreshTimer=null;this._loadRegistry(true);},1200);
      }
      // Runtime entities can appear/disappear without a registry change. Reconcile the
      // small runtime-only subset without issuing a WebSocket registry request.
      if (this._registry && value?.states) {
        // speed: only when entities appear or disappear (count), not a sorted join of all ids on every state change
        const currentIds=Object.keys(value.states);
        const signature=currentIds.length;
        if(signature!==this._lastRuntimeEntitySignature){
          this._lastRuntimeEntitySignature=signature;
          const registered=new Set(this._registry.registeredEntityIds||[]);
          const runtimeIds=new Set(currentIds.filter(id=>!registered.has(id)));
          this._registry.entityRows=this._registry.entityRows.filter(r=>r.source!=='runtime'||runtimeIds.has(r.id));
          const existing=new Set(this._registry.entityRows.map(r=>r.id));
          for(const id of runtimeIds){
            if(existing.has(id))continue;
            const state=value.states[id];
            this._registry.entityRows.push({id,name:state.attributes?.friendly_name||id,domain:id.split('.')[0],deviceId:'',areaId:'',areaName:'Sem ambiente',device:'Sem dispositivo',state:state.state,unit:state.attributes?.unit_of_measurement||'',shown:false,available:!['unknown','unavailable'].includes(state.state),disabled:false,hidden:false,deviceClass:state.attributes?.device_class||'',labels:[],entityCategory:'',icon:state.attributes?.icon||'',source:'runtime'});
          }
          this._registry.visibleCount=this._registry.entityRows.length;
          if(this._configured&&this._page==='Geräte')this._render();
        }
      }
      // HA state changes are frequent; update entity state snapshots without reloading registries.
      if (this._registry && value?.states) {
        for (const row of this._registry.entityRows) {
          const state=value.states[row.id];
          row.state=state?.state ?? 'Sem estado';
          row.unit=state?.attributes?.unit_of_measurement || '';
          row.available=!!state && !['unavailable','unknown'].includes(state.state);
        }
        if (this._configured && this._page === 'Geräte') this._refreshDeviceStates();
        if (this._configured && this._page === 'Räume') {
          try { this._refreshRoomCounts(); }
          catch (error) { console.error('[AUREON] Room counts update failed',error); }
        }
      }
      if (this._configured && this._page === 'Início' && this._registry && value?.states) {
        // speed: the tracked rows are filtered once per registry, not on every state change
        if(this._homeTrackedFor!==this._registry.entityRows){this._homeTrackedFor=this._registry.entityRows;this._homeTracked=this._registry.entityRows.filter(r=>r.domain==='person'||r.domain==='weather');this._homeBatteries=this._registry.entityRows.filter(r=>r.domain==='sensor'&&r.deviceClass==='battery');}
        const signature = this._homeTracked.map(r=>{
          const st=value.states[r.id];
          return [r.id,st?.state,st?.attributes?.temperature,st?.attributes?.humidity,st?.attributes?.entity_picture].join(':');
        }).join('|')+'|'+this._homeBatteries.map(r=>r.id+':'+value.states[r.id]?.state).join('|');
        if (signature !== this._homeStateSignature) {
          this._homeStateSignature=signature;
          try { this._updateHomeOverview(); }
          catch(error) { console.error('[AUREON] Home overview refresh failed',error); }
        }
      }
      if (this._configured && value?.callWS && !this._registry && !this._registryPromise) this._loadRegistry();
    }
    _navigate(name) {
      if (!PAGES.some(([,page])=>page===name)) return;
      this._page=name;
      const main=this.shadowRoot.querySelector('main'),wrap=this.shadowRoot.querySelector('.wrap');
      if (!main||!wrap) { this._render();return; }
      main.scrollTop=0;
      ++this._floorMountToken;this._floorCard=null;this._studioRendered=[];
      // The home page (with its 3D plan) is kept alive while other pages are open: going back to Início shows it at
      // once instead of rebuilding the WebGL view, reloading the furniture models and recompiling shaders.
      const header=main.querySelector(':scope>header'),keep=this._homeKeep?.parentNode===main?this._homeKeep:null;
      if(keep&&name!=='Início')keep.style.display='none';
      // remove the other children one by one: moving the kept page would disconnect it (and dispose its 3D view)
      for(const child of [...main.childNodes])if(child!==header&&child!==keep)child.remove();
      wrap.classList.toggle('au-home',name==='Início'||name==='Medien');wrap.classList.toggle('au-media',name==='Medien');
      const Page=customElements.get('aureon-platform'),labels=Page?.labels(this._platformController?.language||this._hass?.language||'en');
      main.dataset.auPage=Page?.routeNames?.[name]||'';if(header)header.hidden=['Geräte','Planta'].includes(name);
      if(header&&labels){header.querySelector('h1').textContent=labels[Page.routeNames[name]]||name;const eyebrow=header.querySelector('.small');if(eyebrow)eyebrow.textContent='AUREON / '+(name==='Einstellungen'?labels.settings.toUpperCase():'CONTROL CENTER');}
      [...this.shadowRoot.querySelectorAll('nav .au-nav-button')].forEach((button,i)=>{const active=PAGES[i]?.[1]===name;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
      this.shadowRoot.querySelector('.au-nav-more')?.classList.toggle('active',!['Início','Geräte','Medien'].includes(name));
      this.shadowRoot.querySelectorAll('.au-more-item').forEach(item=>{if(item.dataset.route===name)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});
      const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
      if(keep&&name==='Início'){keep.style.display='';keep.requestUpdate?.();return;}
      if(!this._platformSection(main,make)){if(name==='Medien')this._musicSection(main,make,false);else if(name==='Planta')this._floorSection(main,make);}
      // the active page comes before the hidden home page in the document (focus order, first match)
      if(keep)for(const child of [...main.childNodes])if(child!==header&&child!==keep&&keep.compareDocumentPosition(child)&Node.DOCUMENT_POSITION_FOLLOWING)main.insertBefore(child,keep);
    }
    _platformSection(target, make) {
      const Page=customElements.get('aureon-platform');
      const route=Page?.routeNames?.[this._page];
      if(!Page?.createController||!route||['media','floor'].includes(route))return false;
      if(!this._platformController)this._platformController=Page.createController();
      this._platformController.update(this._hass,this._registry);
      const page=make('aureon-platform');page.page=route;page.controller=this._platformController;page.palettes=Object.entries(PALETTES).map(([id,p])=>({id,...p}));
      page.addEventListener('aureon-platform-navigate',e=>this._navigate(e.detail));
      page.addEventListener('aureon-preferences-changed',e=>{this._theme={...this._theme,mode:e.detail.appearance,palette:e.detail.palette,accent:e.detail.accent||''};if(['density','widgets'].includes(e.detail.changedKey)){const state={_settingsTab:page._settingsTab,_settingsKind:page._settingsKind,_settingsLimit:page._settingsLimit,_search:page._search,_wasteSearch:page._wasteSearch};this._render();const next=this.shadowRoot.querySelector('aureon-platform');if(next&&next.page===page.page)Object.assign(next,state);}});
      target.append(page);if(route==='home')this._homeKeep=page;if(route==='home'&&this._platformController.preferences.widgets.music)this._musicSection(page,make,true);return true;
    }
    _musicSection(target, make, compact = false) {
      const Player = customElements.get('aureon-music-player');
      if (!Player?.createController) return;
      if (!this._musicController) this._musicController = Player.createController();
      const allowed = this._registry?.entityRows?.map(row => row.id);
      this._musicController.configure({ language:this._platformController?.language, ...this._musicConfig, ...this._platformController?.preferences?.music, ...(allowed ? { allowedEntities: allowed } : {}) });
      this._musicController.setHass(this._hass);
      const player = make('aureon-music-player');
      player.compact = compact;
      const musicLook=this._platformController?.preferences?.music?.appearance || 'auto',shellLook=this._platformController?.preferences?.appearance||'auto';
      // Inside AUREON an automatic player follows the dashboard palette, not only HA's dark/light flag.
      player.appearance=musicLook==='auto'&&shellLook!=='auto'?'custom':musicLook;
      player.addEventListener('aureon-music-preferences',e=>{if(this._platformController)this._platformController.patch('music',e.detail);});
      player.controller = this._musicController;
      player.style.marginTop = compact||this._page==='Medien'?'0':'24px';if(compact&&target.tagName==='AUREON-PLATFORM')player.slot='mini-player';
      player.addEventListener('aureon-music-open', () => this._navigate('Medien'));
      target.append(player);
    }
    async _loadRegistry(force = false) {
      if (!this._hass?.callWS || this._registryPromise) return;
      if (this._registry && !force) return;
      const hass = this._hass;
      const epoch=this._registryEpoch||0;
      this._registryLoading = true;
      this._registryError = '';
      this._render();
      this._registryPromise = (async () => {
        const [areas, devices, entities, labels] = await Promise.all([
          hass.callWS({type:'config/area_registry/list'}),
          hass.callWS({type:'config/device_registry/list'}),
          hass.callWS({type:'config/entity_registry/list'}),
          hass.callWS({type:'config/label_registry/list'}).catch(() => [])
        ]);
        if (!Array.isArray(areas) || !Array.isArray(devices) || !Array.isArray(entities)) throw new Error('Resposta inesperada dos registros do Home Assistant');
        const labelNames = new Map((Array.isArray(labels) ? labels : []).map(l => [l.label_id, String(l.name || '').toLowerCase()]));
        const allLabels=(Array.isArray(labels)?labels:[]).map(l=>({id:l.label_id,name:String(l.name||l.label_id)})).sort((a,b)=>a.name.localeCompare(b.name));
        const deviceById = new Map(devices.map(d => [d.id, d]));
        const areaById = new Map(areas.map(a => [a.area_id, a]));
        const getArea = entity => {
          if (entity.area_id) return entity.area_id;
          let device = deviceById.get(entity.device_id);
          const visited = new Set();
          while (device && !visited.has(device.id)) {
            visited.add(device.id);
            if (device.area_id) return device.area_id;
            device = deviceById.get(device.parent_device_id); // via_device_id is a connection, not an area parent
          }
          return null;
        };
        const hasLabel = (item, name) => (item?.labels || []).some(id => id === name || labelNames.get(id) === name);
        const visible = entity => {
          if (entity.disabled_by || entity.hidden_by) return false;
          const device = deviceById.get(entity.device_id);
          const area = areaById.get(getArea(entity));
          if ([entity,device,area].some(item => hasLabel(item,'no_dboard')||hasLabel(item,'no-dboard'))) return false;
          return true;
        };
        const rows = areas.map(area => {
          const areaDevices = devices.filter(d => d.area_id === area.area_id);
          const areaEntities = entities.filter(e => getArea(e) === area.area_id && visible(e));
          return {id:area.area_id, name:area.name || area.area_id, icon:area.icon || '⌂', picture:typeof area.picture==='string'?area.picture:'', devices:areaDevices.length, entities:areaEntities.length, active:areaEntities.filter(e => hass.states?.[e.entity_id] && !['unavailable','unknown'].includes(hass.states[e.entity_id].state)).length};
        }).sort((a,b)=>a.name.localeCompare(b.name,hass.locale?.language || 'de'));
        const entityRows = entities.filter(visible).map(e => {
          const device = deviceById.get(e.device_id);
          const areaId = getArea(e);
          const state = hass.states?.[e.entity_id];
          return {
            id: e.entity_id,
            name: e.name || state?.attributes?.friendly_name || e.original_name || e.entity_id,
            domain: e.entity_id.split('.')[0],
            deviceId: e.device_id || '',
            areaId: areaId || '',
            areaName: areaById.get(areaId)?.name || 'Sem ambiente',
            device: device?.name_by_user || device?.name || 'Sem dispositivo',
            state: state?.state ?? 'Sem estado',
            unit: state?.attributes?.unit_of_measurement || '',
            shown: hasLabel(e, 'show_dboard') || hasLabel(device, 'show_dboard') || hasLabel(areaById.get(areaId), 'show_dboard'),
            available: !!state && !['unavailable','unknown'].includes(state.state),
            disabled: !!e.disabled_by,
            hidden: !!e.hidden_by,
            deviceClass: String(state?.attributes?.device_class||''),
            labels: [...new Set([...(e.labels||[]),...(device?.labels||[]),...(areaById.get(areaId)?.labels||[])])],
            entityCategory: e.entity_category||'',
            icon: e.icon || state?.attributes?.icon || '',
            source: e.platform || ''
          };
        }).sort((a,b) => a.areaName.localeCompare(b.areaName, hass.locale?.language || 'de') || a.name.localeCompare(b.name, hass.locale?.language || 'de'));
        // Some integrations create runtime entities without a registry entry; show these as unassigned read-only discoveries.
        const known=new Set(entities.map(e=>e.entity_id));
        for(const [id,state] of Object.entries(hass.states||{})) {
          if(known.has(id)) continue;
          entityRows.push({id,name:state.attributes?.friendly_name||id,domain:id.split('.')[0],deviceId:'',areaId:'',areaName:'Sem ambiente',device:'Sem dispositivo',state:state.state,unit:state.attributes?.unit_of_measurement||'',shown:false,available:!['unknown','unavailable'].includes(state.state),disabled:false,hidden:false,deviceClass:state.attributes?.device_class||'',labels:[],entityCategory:'',icon:state.attributes?.icon||'',source:'runtime'});
        }
        entityRows.sort((a,b)=>a.areaName.localeCompare(b.areaName,hass.locale?.language||'de')||a.name.localeCompare(b.name,hass.locale?.language||'de'));
        return {rows,entityRows,allLabels,registeredEntityIds:entities.map(e=>e.entity_id),areaCount:areas.length,deviceCount:devices.length,entityCount:entities.length,visibleCount:entityRows.length};
      })();
      try { const registry=await this._registryPromise;if(epoch===(this._registryEpoch||0)){this._registry=registry;this._registryUpdatedAt=new Date().toLocaleTimeString();this._lastRuntimeEntitySignature=Object.keys(this._hass?.states||{}).sort().join('\n');} }
      catch (err) { if(epoch===(this._registryEpoch||0))this._registryError = String(err?.message || err); }
      finally { if(epoch===(this._registryEpoch||0)){this._registryLoading = false;this._registryPromise = null;if (this._configured) this._render();} }
    }
    _roomIntelligence(areaId) {
      const rows=this._registry?.entityRows?.filter(r=>r.areaId===areaId)||[];
      const states=this._hass?.states||{};
      const valid=rows.filter(r=>states[r.id]&&!['unavailable','unknown'].includes(states[r.id].state));
      const dc=r=>String(states[r.id]?.attributes?.device_class||r.deviceClass||'').toLowerCase();
      const lights=valid.filter(r=>r.domain==='light');
      const binary=valid.filter(r=>r.domain==='binary_sensor');
      const countOn=classes=>binary.filter(r=>classes.includes(dc(r))&&states[r.id].state==='on').length;
      const numberSensor=classes=>valid.filter(r=>r.domain==='sensor'&&classes.includes(dc(r)))
        .map(r=>({name:r.name,value:Number(states[r.id].state),unit:states[r.id].attributes?.unit_of_measurement||''}))
        .filter(r=>Number.isFinite(r.value));
      const temperature=numberSensor(['temperature'])[0]||null;
      const humidity=numberSensor(['humidity'])[0]||null;
      const power=numberSensor(['power']);
      const batteries=numberSensor(['battery']).filter(x=>x.value>=0&&x.value<=100);
      const climate=valid.filter(r=>r.domain==='climate').map(r=>states[r.id]);
      const climateTemp=climate.map(st=>st.attributes?.current_temperature).filter(v=>v!==null&&v!==undefined&&v!=='').map(Number).find(Number.isFinite);
      const unavailable=rows.filter(r=>!states[r.id]||['unknown','unavailable'].includes(states[r.id].state)).length;
      return {
        on:lights.filter(r=>states[r.id].state==='on').length,lights:lights.length,
        opened:countOn(['door','window','opening','garage_door']),
        motion:countOn(['motion','occupancy','presence']),
        moisture:countOn(['moisture']),smoke:countOn(['smoke']),gas:countOn(['gas']),
        problem:countOn(['problem','safety']),
        locks:valid.filter(r=>r.domain==='lock'&&states[r.id].state==='unlocked').length,
        covers:valid.filter(r=>r.domain==='cover'&&states[r.id].state==='open').length,
        temperature:temperature|| (Number.isFinite(climateTemp)?{value:climateTemp,unit:'°C'}:null),
        humidity, power, batteries, unavailable
      };
    }
    _updateRoomIntelligence(areaId,tile) {
      const target=tile?.querySelector('[data-au-room-intelligence]');
      if(!target)return;
      const d=this._roomIntelligence(areaId);
      const parts=[];
      if(d.lights)parts.push(`Luzes: ${d.on}/${d.lights} ligadas`);
      if(d.opened)parts.push(`Aberturas: ${d.opened} abertas`);
      if(d.motion)parts.push(`Movimento/presença: ${d.motion}`);
      if(d.covers)parts.push(`Persianas abertas: ${d.covers}`);
      if(d.locks)parts.push(`Fechaduras destrancadas: ${d.locks}`);
      if(d.temperature)parts.push(`Temperatura: ${d.temperature.value} ${d.temperature.unit||'°C'}`);
      if(d.humidity)parts.push(`Umidade: ${d.humidity.value} ${d.humidity.unit||'%'}`);
      if(d.power.length)parts.push(`Sensores de potência: ${d.power.length}`);
      if(d.batteries.length)parts.push(`Baterias: ${d.batteries.length} sensores`);
      if(d.moisture||d.smoke||d.gas||d.problem)parts.push(`Alertas ativos: ${d.moisture+d.smoke+d.gas+d.problem}`);
      if(d.unavailable)parts.push(`Indisponíveis/sem estado: ${d.unavailable}`);
      target.textContent=parts.join(' · ')||'Sem sensores ativos reconhecidos';
    }
    _refreshRoomCounts() {
      const root=this.shadowRoot;
      if(!root || !this._registry) return;
      const states=this._hass?.states||{};
      for(const area of this._registry.rows){
        const tile=[...root.querySelectorAll('[data-au-area]')].find(el=>el.getAttribute('data-au-area')===area.id);
        if(!tile) continue;
        const available=this._registry.entityRows.filter(e=>e.areaId===area.id&&states[e.id]
          &&!['unknown','unavailable'].includes(states[e.id].state)).length;
        const status=tile.querySelector('[data-au-area-available]');
        if(status)status.textContent=`${available} entidades com estado disponível`;
        try { this._updateRoomIntelligence(area.id,tile); }
        catch(error) { console.warn('[AUREON] Room intelligence refresh failed',area.id,error); }
      }
    }
    _openAreaDevices(areaId) {
      if(!this._registry) return;
      this._deviceArea=areaId;
      this._deviceDomain='all';
      this._deviceClass='all';
      this._deviceLabel='all';
      this._deviceAvailability='all';
      this._deviceSearch='';
      this._deviceLimit=80;
      this._page='Geräte';
      try { this._render(); }
      catch(error) { console.error('[AUREON] Room navigation failed',error); }
    }
    _homeOverviewData() {
      const rows=this._registry?.entityRows||[];
      const states=this._hass?.states||{};
      const known=new Set(rows.map(r=>r.id));
      const personRows=rows.concat(Object.keys(states).filter(id=>id.startsWith('person.')&&!known.has(id))
        .map(id=>({id,name:states[id]?.attributes?.friendly_name||id,domain:'person',hidden:false,disabled:false})));
      const persons=personRows.filter(r=>r.domain==='person'&&states[r.id]&&!r.hidden&&!r.disabled)
        .map(r=>{
          const st=states[r.id];
          const trackers=Array.isArray(st.attributes?.device_trackers)?st.attributes.device_trackers:[];
          // A person explicitly names its device_tracker entities. Only pair
          // battery sensors via the SAME registered HA device_id; never infer
          // ownership from names, labels, or substring matching.
          const trackerDevices=new Set(trackers.map(id=>rows.find(e=>e.id===id)?.deviceId).filter(Boolean));
          const batteries=rows.filter(e=>e.domain==='sensor'&&e.deviceId&&trackerDevices.has(e.deviceId)
            &&(e.deviceClass==='battery'||states[e.id]?.attributes?.device_class==='battery'))
            .map(e=>({id:e.id,value:states[e.id]?.state,unit:states[e.id]?.attributes?.unit_of_measurement||'%',
              name:e.name,available:states[e.id]&&!['unknown','unavailable'].includes(states[e.id].state)}));
          const valid=batteries.filter(b=>b.available&&Number.isFinite(Number(b.value))&&Number(b.value)>=0&&Number(b.value)<=100);
          return {id:r.id,name:st.attributes?.friendly_name||r.name,state:st.state,
            picture:st.attributes?.entity_picture||'',trackers,batteries:valid,source:r.source};
        }).sort((a,b)=>a.name.localeCompare(b.name));
      const weather=rows.filter(r=>r.domain==='weather'&&states[r.id]&&!r.hidden&&!r.disabled)
        .map(r=>({id:r.id,name:r.name,state:states[r.id].state,
          temperature:states[r.id].attributes?.temperature,
          humidity:states[r.id].attributes?.humidity,
          temperatureUnit:states[r.id].attributes?.temperature_unit||this._hass?.config?.unit_system?.temperature||'°C'}));
      return {persons,weather};
    }
    _updateHomeOverview() {
      const target=this.shadowRoot?.querySelector('[data-au-home-overview]');
      if (!target || !this._registry) return;
      // Own element factory: _render() has a separate lexical scope.
      // Keep overview failures isolated so they cannot crash the whole card.
      const make = (tag, className = '', text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = String(text);
        return element;
      };
      target.replaceChildren();
      let persons, weather;
      try {
        ({persons,weather}=this._homeOverviewData());
      } catch (error) {
        console.error('[AUREON] Home overview data failed',error);
        target.append(make('p','registry-note','Pessoas e clima temporariamente indisponíveis. Outros controles continuam disponíveis.'));
        return;
      }
      const title=make('h2','','Pessoas e clima · Home Assistant');
      target.append(title);
      const note=make('p','muted','Dados lidos das entidades reais person.* e weather.*. Nenhuma localização é estimada.');
      target.append(note);
      const grid=make('div','area-grid');
      for(const person of persons){
        const card=make('article','area-tile');
        const heading=make('h3','',person.name);
        const status=person.state==='home'?'Zuhause':person.state==='not_home'?'Abwesend':
          person.state==='unknown'?'Desconhecido':person.state==='unavailable'?'Indisponível':person.state;
        card.append(heading,make('p','',status));
        if(person.batteries.length) {
          for(const battery of person.batteries)
            card.append(make('p','',`Bateria · ${battery.name}: ${battery.value}${battery.unit}`));
        } else {
          card.append(make('p','muted','Bateria não vinculada ao dispositivo da pessoa'));
        }
        const avatar=make('div','',person.name.trim().charAt(0).toUpperCase()||'?');
        avatar.style.cssText='width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:var(--au-hover);color:var(--au-accent);font-weight:700';
        if(person.picture && (person.picture.startsWith('/') || person.picture.startsWith('https://') || person.picture.startsWith('http://'))){
          const img=make('img');img.src=person.picture;img.alt=person.name;img.loading='lazy';
          img.style.cssText='width:48px;height:48px;border-radius:50%;object-fit:cover';
          img.onerror=()=>img.replaceWith(avatar);
          card.prepend(img);
        } else card.prepend(avatar);
        grid.append(card);
      }
      for(const w of weather){
        const card=make('article','area-tile');
        card.append(make('h3','',w.name),make('p','',w.state));
        if(w.temperature!==undefined && w.temperature!==null)
          card.append(make('p','',`Temperatura: ${w.temperature} ${w.temperatureUnit}`));
        if(w.humidity!==undefined && w.humidity!==null)
          card.append(make('p','',`Umidade: ${w.humidity}%`));
        grid.append(card);
      }
      if(!persons.length && !weather.length) grid.append(make('p','muted','Nenhuma entidade person ou weather disponível nos registros.'));
      target.append(grid);
    }
    _refreshDeviceStates() {
      const container=this.shadowRoot?.querySelector('.device-results');
      if (!container || !this._registry) return;
      for (const el of container.querySelectorAll('[data-aureon-entity]')) {
        const id=el.getAttribute('data-aureon-entity');
        const row=this._registry.entityRows.find(e=>e.id===id);
        if (!row) continue;
        el.textContent=`${row.state}${row.unit ? ' '+row.unit : ''}`;
      }
      for(const el of container.querySelectorAll('[data-au-generic]')) {
        const id=el.getAttribute('data-au-generic');
        const state=this._hass?.states?.[id];
        const val=el.querySelector('.au-generic-value');
        if(val) val.textContent=state?.state??'Sem estado';
        const summary=el.querySelector('[data-au-generic-summary]');
        if(summary) summary.textContent=this._entitySummary(state);
      }
      for (const control of container.querySelectorAll('[data-au-sensor]')) this._updateSensorControl(control,control.getAttribute('data-au-sensor'));
      for (const control of container.querySelectorAll('[data-au-control]')) {
        const id=control.getAttribute('data-au-control');
        const state=this._hass?.states?.[id];
        if (!state) {
          this._setControlAvailability(control,id);
          continue;
        }
        const busy=this._controlBusy.has(id);
        this._setControlAvailability(control,id);
        if(id.startsWith('climate.')) {
          const attrs=state.attributes||{};
          const unavailable=['unavailable','unknown'].includes(state.state);
          const mode=control.querySelector('[data-au-hvac-mode]');
          if(mode && !mode.matches(':focus')) mode.value=state.state;
          const current=control.querySelector('[data-au-current-temperature]');
          if(current) current.textContent=typeof attrs.current_temperature==='number'?`${attrs.current_temperature} °C`:'—';
          const target=control.querySelector('[data-au-target-temperature]');
          const targetValue=control.querySelector('[data-au-target-value]');
          if(target && !target.matches(':active') && document.activeElement!==target && typeof attrs.temperature==='number') {
            target.value=String(attrs.temperature);
            if(targetValue) targetValue.textContent=`${attrs.temperature} °C`;
          }
          const low=control.querySelector('[data-au-target-low]');
          const high=control.querySelector('[data-au-target-high]');
          if(low && document.activeElement!==low && typeof attrs.target_temp_low==='number') low.value=String(attrs.target_temp_low);
          if(high && document.activeElement!==high && typeof attrs.target_temp_high==='number') high.value=String(attrs.target_temp_high);
          const action=control.querySelector('[data-au-hvac-action]');
          if(action) action.textContent=attrs.hvac_action?`Atividade: ${attrs.hvac_action}`:'';
          control.querySelectorAll('button,input,select').forEach(el=>{el.disabled=busy||unavailable;});
          continue;
        }
        if(id.startsWith('cover.')) {
          const status=control.querySelector('[data-au-status]');
          const labels={open:'Aberta',closed:'Fechada',opening:'Abrindo',closing:'Fechando',unavailable:'Indisponível',unknown:'Estado desconhecido'};
          if(status) status.textContent=labels[state.state]||state.state;
          const pos=control.querySelector('[data-au-position]');
          const value=control.querySelector('[data-au-position-value]');
          if(pos && !pos.matches(':active')) {
            const current=state.attributes?.current_position;
            if(typeof current==='number') {pos.value=String(current);if(value)value.textContent=`${current}%`;}
          }
          control.querySelectorAll('button,input').forEach(el=>{el.disabled=busy||!this._isEntityControllable(id);});
          continue;
        }
        const valid=['on','off'].includes(state.state);
        const toggle=control.querySelector('[data-au-toggle]');
        if (toggle) {
          toggle.textContent=state.state==='on'?'Desligar':'Ligar';
          toggle.disabled=busy||!valid;
          toggle.setAttribute('aria-pressed',String(state.state==='on'));
        }
        const status=control.querySelector('[data-au-status]');
        if (status) status.textContent=valid?(state.state==='on'?'Ligada':'Desligada'):'Indisponível';
        const brightness=control.querySelector('[data-au-brightness]');
        const brightValue=control.querySelector('[data-au-brightness-value]');
        if (brightness && document.activeElement!==brightness && !brightness.matches(':active')) {
          const pct=Math.round((Number(state.attributes?.brightness)||0)*100/255);
          brightness.value=String(pct);
          if(brightValue) brightValue.textContent=`${pct}%`;
        }
        const color=control.querySelector('[data-au-color]');
        if(color && !color.matches(':focus')) {
          const rgb=state.attributes?.rgb_color;
          if(Array.isArray(rgb)&&rgb.length===3) color.value='#'+rgb.map(v=>Math.max(0,Math.min(255,Number(v)||0)).toString(16).padStart(2,'0')).join('');
        }
        control.querySelectorAll('input').forEach(input=>{input.disabled=busy||!valid;});
      }
    }
    _lightCapabilities(entityId) {
      const a=this._hass?.states?.[entityId]?.attributes||{};
      const modes=Array.isArray(a.supported_color_modes)?a.supported_color_modes:[];
      return {
        brightness:modes.some(m=>['brightness','color_temp','hs','xy','rgb','rgbw','rgbww','white'].includes(m))||(!modes.length&&Boolean((Number(a.supported_features)||0)&1)),
        color:modes.some(m=>['hs','xy','rgb','rgbw','rgbww'].includes(m)),
        temperature:modes.includes('color_temp')
      };
    }
    _isEntityControllable(entityId) {
      const state=this._hass?.states?.[entityId];
      return Boolean(state && state.state !== 'unknown' && state.state !== 'unavailable');
    }
    _setControlAvailability(control,entityId) {
      if(!control) return;
      const usable=this._isEntityControllable(entityId);
      const busy=this._controlBusy.has(entityId);
      control.setAttribute('data-au-available',String(usable));
      control.querySelectorAll('button,input,select').forEach(el=>{el.disabled=!usable||busy;});
      if(!usable)control.setAttribute('title','Entidade indisponível no Home Assistant');
      else control.removeAttribute('title');
    }
    _aureonControlFailure(error, entityId) {
      const raw=String(error?.message||error||'Erro desconhecido');
      const normalized=raw.toLowerCase();
      if(/sign invalid|\(-999999\)/i.test(raw)) {
        return `Falha de autenticação da ligação iSG/Home Assistant ao controlar ${entityId} (sign invalid). Verifique a sessão e a integração do dispositivo no Home Assistant; não repita comandos automaticamente. Detalhe: ${raw.slice(0,180)}`;
      }
      if(/unauthorized|forbidden|\b401\b|\b403\b|not authorized|permission denied/.test(normalized)) {
        return `Sem autorização para controlar ${entityId}. Verifique o utilizador e as permissões no Home Assistant. Detalhe: ${raw.slice(0,180)}`;
      }
      if(/timeout|timed out|network|failed to fetch|connection/.test(normalized)) {
        return `Falha de comunicação ao controlar ${entityId}. Confirme a ligação do Home Assistant e o estado do dispositivo. Detalhe: ${raw.slice(0,180)}`;
      }
      return `Não foi possível controlar ${entityId}: ${raw.slice(0,240)}`;
    }
    async _aureonService(entityId, service, data={}) {
      if(this._controlBusy.has(entityId)) return;
      if(!this._isEntityControllable(entityId)) {
        this._controlError=`${entityId} está indisponível ou sem estado válido no Home Assistant.`;
        this._showControlError();
        this._refreshDeviceStates();
        return;
      }
      if(!this._hass?.callService) {
        this._controlError='Home Assistant não disponibilizou o serviço de controle.';
        this._showControlError();
        return;
      }
      this._controlBusy.add(entityId);
      this._refreshDeviceStates();
      try {
        await this._hass.callService(entityId.split('.')[0],service,{entity_id:entityId,...data});
        this._controlError='';
      } catch(err) {
        this._controlError=this._aureonControlFailure(err,entityId);
        console.error('[AUREON Controls]',err);
      } finally {
        this._controlBusy.delete(entityId);
        this._showControlError();
        this._refreshDeviceStates();
      }
    }
    _showControlError() {
      const el=this.shadowRoot?.querySelector('[data-control-error]');
      if(el) el.textContent=this._controlError;
    }
    _entitySummary(state) {
      if(!state) return 'Sem leitura disponível';
      const a=state.attributes||{};
      const keys=['battery_level','percentage','current_position','current_temperature','temperature','humidity','volume_level','media_title','source','device_class','unit_of_measurement'];
      return keys.filter(k=>a[k]!==undefined&&a[k]!==null).slice(0,4).map(k=>`${k}: ${String(a[k]).slice(0,80)}`).join(' · ')||'Estado disponibilizado pelo Home Assistant';
    }
    _sensorSnapshot(row) {
      const state=this._hass?.states?.[row.id];
      if(!state || ['unknown','unavailable'].includes(state.state)) return {value:'Indisponível',detail:'Sem leitura confiável',kind:'unavailable'};
      const a=state.attributes||{};
      const cls=String(a.device_class||'').toLowerCase();
      if(row.domain==='binary_sensor') {
        const active=state.state==='on';
        const pairs={door:['Aberta','Fechada'],window:['Aberta','Fechada'],garage_door:['Aberta','Fechada'],opening:['Aberta','Fechada'],motion:['Movimento detectado','Sem movimento'],occupancy:['Presença detectada','Sem presença'],presence:['Presença detectada','Sem presença'],moisture:['Umidade detectada','Seco'],smoke:['Fumaça detectada','Sem fumaça'],gas:['Gás detectado','Sem gás'],problem:['Problema detectado','Sem problema'],battery:['Bateria baixa','Bateria normal'],connectivity:['Conectado','Desconectado'],lock:['Destrancada','Trancada'],plug:['Conectado','Desconectado']};
        const pair=pairs[cls];
        return {value:pair?(active?pair[0]:pair[1]):(active?'Ativo':'Inativo'),detail:cls?`Classe: ${cls}`:'Sensor binário',kind:active?'active':'inactive'};
      }
      const unit=a.unit_of_measurement||'';
      const value=`${state.state}${unit?' '+unit:''}`;
      const detail=[cls?`Classe: ${cls}`:'',a.state_class?`Tipo: ${a.state_class}`:''].filter(Boolean).join(' · ');
      return {value,detail:detail||'Leitura do Home Assistant',kind:'measurement'};
    }
    // Capability-gated controls. Never expose sensitive domains through generic services.
    _makeAureonUniversalControl(row) {
      const state=this._hass?.states?.[row.id];
      if(!state || ['unknown','unavailable'].includes(state.state)) return null;
      const a=state.attributes||{};
      const f=Number(a.supported_features)||0;
      const root=document.createElement('div');root.className='au-control au-universal';
      root.setAttribute('data-au-universal',row.id);
      const mk=(tag,txt)=>{const el=document.createElement(tag);if(txt!==undefined)el.textContent=txt;return el;};
      const add=(label,service,data={},domain=row.domain)=>{
        const b=mk('button',label);b.type='button';b.className='au-toggle';
        b.disabled=this._controlBusy.has(row.id);
        b.addEventListener('click',()=>this._aureonServiceFor(row.id,domain,service,data));root.append(b);return b;
      };
      const slider=(label,value,min,max,step,service,field,domain=row.domain)=>{
        if(!Number.isFinite(Number(min))||!Number.isFinite(Number(max))||Number(max)<=Number(min))return;
        const box=mk('label',label+' ');box.className='au-control-label';
        const out=mk('span',String(value));box.append(out);
        const input=mk('input');input.type='range';input.min=String(min);input.max=String(max);input.step=String(step||1);
        input.value=String(Math.min(Number(max),Math.max(Number(min),Number(value)||Number(min))));
        input.addEventListener('input',()=>out.textContent=input.value);
        input.addEventListener('change',()=>this._aureonServiceFor(row.id,domain,service,{[field]:Number(input.value)}));
        root.append(box,input);
      };
      const choose=(label,options,selected,service,field,domain=row.domain)=>{
        if(!Array.isArray(options)||!options.length)return;
        const wrap=mk('label',label+' ');wrap.className='au-control-label';
        const select=mk('select');select.className='au-climate-select';
        for(const opt of options){const o=mk('option',String(opt));o.value=String(opt);select.append(o);}
        select.value=String(selected??'');
        select.addEventListener('change',()=>this._aureonServiceFor(row.id,domain,service,{[field]:select.value}));
        wrap.append(select);root.append(wrap);
      };
      switch(row.domain){
        case 'input_boolean':add(state.state==='on'?'Desligar':'Ligar',state.state==='on'?'turn_off':'turn_on');break;
        case 'fan':
          add(state.state==='on'?'Desligar':'Ligar',state.state==='on'?'turn_off':'turn_on');
          if(f&1)slider('Velocidade (%)',a.percentage??0,0,100,a.percentage_step||1,'set_percentage','percentage');
          if(f&8)choose('Modo',a.preset_modes,a.preset_mode,'set_preset_mode','preset_mode');
          if(f&2)add('Oscilação '+(a.oscillating?'off':'on'),'oscillate',{oscillating:!a.oscillating});
          if(f&4)choose('Direção',['forward','reverse'],a.direction,'set_direction','direction');
          break;
        case 'vacuum':
          // HA VacuumEntityFeature: TURN_ON=1 TURN_OFF=2 PAUSE=4 STOP=8 RETURN_HOME=16 FAN_SPEED=32 START=8192
          if(f&8192)add('Iniciar limpeza','start');
          if(f&4)add('Pausar','pause');
          if(f&8)add('Parar','stop');
          if(f&16)add('Voltar à base','return_to_base');
          if(f&32)choose('Potência',a.fan_speed_list,a.fan_speed,'set_fan_speed','fan_speed');
          break;
        case 'media_player':
          // HA MediaPlayerEntityFeature: PAUSE=1 SEEK=2 VOLUME_SET=4 VOLUME_MUTE=8 PREVIOUS=16 NEXT=32 TURN_ON=128 TURN_OFF=256 PLAY=16384
          if(f&128 && state.state==='off')add('Ligar','turn_on');
          if(f&256 && state.state!=='off')add('Desligar','turn_off');
          if(f&16384)add('Reproduzir','media_play');
          if(f&1)add('Pausar','media_pause');
          if(f&16)add('Anterior','media_previous_track');
          if(f&32)add('Próxima','media_next_track');
          if(f&4)slider('Volume (%)',Math.round((Number(a.volume_level)||0)*100),0,100,1,'volume_set','volume_level_pct_INTERNAL');
          if(f&8)add(a.is_volume_muted?'Ativar som':'Silenciar','volume_mute',{is_volume_muted:!a.is_volume_muted});
          if(f&2048)choose('Fonte',a.source_list,a.source,'select_source','source');
          break;
        case 'scene':add('Ativar cena','turn_on');break;
        case 'script':add('Executar script','turn_on');break;
        case 'automation':add('Executar agora','trigger',{skip_condition:false});break;
        case 'button':add('Pressionar','press');break;
        case 'input_button':add('Pressionar','press');break;
        case 'number':case 'input_number':
          slider('Valor',Number(state.state),a.min,a.max,a.step||1,'set_value','value');break;
        case 'select':case 'input_select':
          choose('Opção',a.options,state.state,'select_option','option');break;
        case 'siren':
          // Safety: no universal siren activation; read-only until dedicated security workflow.
          break;
        default:break;
      }
      return root.children.length?root:null;
    }
    async _aureonServiceFor(entityId,domain,service,data={}) {
      // Validate domain against entity id; never allow a cross-domain call from UI data.
      if(entityId.split('.')[0]!==domain)return;
      if(domain==='media_player'&&service==='volume_set'&&Object.hasOwn(data,'volume_level_pct_INTERNAL')){
        data={volume_level:Math.min(1,Math.max(0,data.volume_level_pct_INTERNAL/100))};
      }
      return this._aureonService(entityId,service,data);
    }
    _makeAureonSensorControl(row) {
      const root=document.createElement('div');root.className='au-control au-sensor';root.setAttribute('data-au-sensor',row.id);
      const label=document.createElement('div');label.className='au-sensor-value';label.setAttribute('data-au-sensor-value','');
      const detail=document.createElement('small');detail.setAttribute('data-au-sensor-detail','');
      const updated=document.createElement('small');updated.setAttribute('data-au-sensor-updated','');
      root.append(label,detail,updated);
      this._updateSensorControl(root,row.id);
      return root;
    }
    _updateSensorControl(control,id) {
      const row=this._registry?.entityRows.find(e=>e.id===id);
      if(!row)return;
      const info=this._sensorSnapshot(row);
      control.setAttribute('data-au-sensor-kind',info.kind);
      const value=control.querySelector('[data-au-sensor-value]');if(value)value.textContent=info.value;
      const detail=control.querySelector('[data-au-sensor-detail]');if(detail)detail.textContent=info.detail;
      const updated=control.querySelector('[data-au-sensor-updated]');
      const state=this._hass?.states?.[id];
      if(updated) {
        const time=state?.last_updated;
        const date=time?new Date(time):null;
        updated.textContent=date&&!Number.isNaN(date.getTime())?`Atualizado: ${date.toLocaleString(this._hass?.locale?.language||'de-DE')}`:'';
      }
    }
    _makeAureonClimateControl(row) {
      const root=document.createElement('div');
      root.className='au-control';root.setAttribute('data-au-control',row.id);
      const state=this._hass?.states?.[row.id];
      const attrs=state?.attributes||{};
      const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
      const top=make('div');top.className='au-control-top';
      const current=make('span',typeof attrs.current_temperature==='number'?`${attrs.current_temperature} °C`:'—');
      current.setAttribute('data-au-current-temperature','');
      top.append(make('span','Temperatura atual'),current);root.append(top);
      const action=make('small',attrs.hvac_action?`Atividade: ${attrs.hvac_action}`:'');
      action.setAttribute('data-au-hvac-action','');root.append(action);
      const modes=Array.isArray(attrs.hvac_modes)?attrs.hvac_modes:[];
      if(modes.length){
        const label=make('label','Modo de operação');label.className='au-control-label';
        const select=make('select');select.className='au-climate-select';select.setAttribute('data-au-hvac-mode','');
        for(const m of modes){const option=make('option',m);option.value=m;select.append(option);}
        select.value=state?.state||'';
        select.addEventListener('change',()=>this._aureonService(row.id,'set_hvac_mode',{hvac_mode:select.value}));
        root.append(label,select);
      }
      const features=Number(attrs.supported_features)||0;
      const min=Number.isFinite(Number(attrs.min_temp))?Number(attrs.min_temp):7;
      const max=Number.isFinite(Number(attrs.max_temp))?Number(attrs.max_temp):35;
      const step=Number(attrs.target_temp_step)>0?Number(attrs.target_temp_step):0.5;
      if(max>min && (features&1)){
        const label=make('label','Temperatura desejada ');label.className='au-control-label';
        const value=make('span',typeof attrs.temperature==='number'?`${attrs.temperature} °C`:'—');
        value.setAttribute('data-au-target-value','');label.append(value);
        const slider=make('input');slider.type='range';slider.min=String(min);slider.max=String(max);slider.step=String(step);
        slider.value=String(typeof attrs.temperature==='number'?attrs.temperature:min);
        slider.setAttribute('data-au-target-temperature','');slider.setAttribute('aria-label',`Temperatura desejada de ${row.name}`);
        slider.addEventListener('input',()=>value.textContent=`${slider.value} °C`);
        slider.addEventListener('change',()=>this._aureonService(row.id,'set_temperature',{temperature:Number(slider.value)}));
        root.append(label,slider);
      } else if((features&2) && max>min) {
        const label=make('label','Faixa de temperatura');label.className='au-control-label';root.append(label);
        const low=make('input');low.type='number';low.min=String(min);low.max=String(max);low.step=String(step);
        low.value=String(typeof attrs.target_temp_low==='number'?attrs.target_temp_low:min);
        low.setAttribute('data-au-target-low','');low.setAttribute('aria-label','Temperatura mínima');
        const high=make('input');high.type='number';high.min=String(min);high.max=String(max);high.step=String(step);
        high.value=String(typeof attrs.target_temp_high==='number'?attrs.target_temp_high:max);
        high.setAttribute('data-au-target-high','');high.setAttribute('aria-label','Temperatura máxima');
        const apply=make('button','Aplicar faixa');apply.type='button';apply.className='au-toggle';
        apply.addEventListener('click',()=>{
          const lo=Number(low.value),hi=Number(high.value);
          if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo>hi||lo<min||hi>max){
            this._controlError='Faixa de temperatura inválida.';this._showControlError();return;
          }
          this._aureonService(row.id,'set_temperature',{target_temp_low:lo,target_temp_high:hi});
        });
        root.append(low,high,apply);
      }
      if(!(features&3)&&!modes.length)root.append(make('small','Este termostato não anuncia comandos compatíveis.'));
      return root;
    }
    _makeAureonCoverControl(row) {
      // CoverEntityFeature values and action gating follow the Simon42 cover-controls pattern.
      const root=document.createElement('div');
      root.className='au-control';root.setAttribute('data-au-control',row.id);
      const state=this._hass?.states?.[row.id];
      const features=Number(state?.attributes?.supported_features)||0;
      const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
      const top=make('div');top.className='au-control-top';
      const status=make('span',state?.state||'Sem estado');status.setAttribute('data-au-status','');top.append(status);root.append(top);
      const actions=make('div');actions.className='au-cover-actions';
      for(const [bit,service,label] of [[1,'open_cover','Abrir'],[8,'stop_cover','Parar'],[2,'close_cover','Fechar']]) {
        if(!(features&bit))continue;
        const button=make('button',label);button.type='button';button.className='au-toggle';
        button.addEventListener('click',()=>this._aureonService(row.id,service));
        actions.append(button);
      }
      if(actions.children.length)root.append(actions);
      if(features&4){
        const label=make('label','Abertura ');label.className='au-control-label';
        const value=make('span','—');value.setAttribute('data-au-position-value','');label.append(value);
        const slider=make('input');slider.type='range';slider.min='0';slider.max='100';slider.step='1';
        slider.setAttribute('data-au-position','');slider.setAttribute('aria-label',`Posição de ${row.name}`);
        slider.value=String(typeof state?.attributes?.current_position==='number'?state.attributes.current_position:0);
        value.textContent=typeof state?.attributes?.current_position==='number'?`${state.attributes.current_position}%`:'Posição desconhecida';
        slider.addEventListener('input',()=>value.textContent=`${slider.value}%`);
        slider.addEventListener('change',()=>this._aureonService(row.id,'set_cover_position',{position:Number(slider.value)}));
        root.append(label,slider);
      }
      if(!actions.children.length&&!(features&4))root.append(make('small','Esta persiana não anuncia comandos de abertura suportados.'));
      return root;
    }
    _makeAureonControl(row) {
      const state=this._hass?.states?.[row.id];
      const capabilities=this._lightCapabilities(row.id);
      const root=document.createElement('div');
      root.className='au-control';
      root.setAttribute('data-au-control',row.id);
      const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
      const top=make('div');top.className='au-control-top';
      const status=make('span');status.setAttribute('data-au-status','');
      const toggle=make('button');toggle.type='button';toggle.className='au-toggle';
      toggle.setAttribute('data-au-toggle','');
      toggle.addEventListener('click',()=>{
        const current=this._hass?.states?.[row.id]?.state;
        if(current==='on'||current==='off') this._aureonService(row.id,current==='on'?'turn_off':'turn_on');
      });
      top.append(status,toggle);root.append(top);
      if(row.domain==='light'&&capabilities.brightness){
        const label=make('label','Brilho ');label.className='au-control-label';
        const output=make('span');output.setAttribute('data-au-brightness-value','');
        const slider=make('input');slider.type='range';slider.min='1';slider.max='100';slider.step='1';
        slider.setAttribute('data-au-brightness','');slider.setAttribute('aria-label',`Brilho de ${row.name}`);
        slider.addEventListener('input',()=>{output.textContent=`${slider.value}%`;});
        slider.addEventListener('change',()=>this._aureonService(row.id,'turn_on',{brightness_pct:Number(slider.value)}));
        label.append(output);root.append(label,slider);
      }
      if(row.domain==='light'&&capabilities.color){
        const label=make('label','Cor da luz ');label.className='au-control-label';
        const picker=make('input');picker.type='color';picker.value='#ffffff';picker.setAttribute('data-au-color','');
        picker.setAttribute('aria-label',`Cor de ${row.name}`);
        picker.addEventListener('change',()=>{
          const h=picker.value;
          const rgb=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
          this._aureonService(row.id,'turn_on',{rgb_color:rgb});
        });
        label.append(picker);root.append(label);
      }
      if(row.domain==='light'&&capabilities.temperature){
        const a=state?.attributes||{};
        const min=Number(a.min_color_temp_kelvin)||2000;
        const max=Number(a.max_color_temp_kelvin)||6500;
        if(max>min){
          const label=make('label','Temperatura (K) ');label.className='au-control-label';
          const out=make('span',String(a.color_temp_kelvin||Math.round((min+max)/2)));
          const slider=make('input');slider.type='range';slider.min=String(min);slider.max=String(max);slider.step='100';
          slider.value=String(a.color_temp_kelvin||Math.round((min+max)/2));
          slider.setAttribute('aria-label',`Temperatura de cor de ${row.name}`);
          slider.addEventListener('input',()=>out.textContent=slider.value);
          slider.addEventListener('change',()=>this._aureonService(row.id,'turn_on',{color_temp_kelvin:Number(slider.value)}));
          label.append(out);root.append(label,slider);
        }
      }
      return root;
    }
    // Card Studio v0.24: local, browser-specific storage. No HA backend writes.
    _studioStorageKey() {
      // Scope to HA URL + authenticated user; no credentials or state stored.
      const user=this._hass?.user?.id || 'local';
      return `aureon.card-studio.v1.${location.pathname.split('/')[1] || 'dashboard'}.${user}`;
    }
    _studioRead() {
      try {
        const raw=localStorage.getItem(this._studioStorageKey());
        const parsed=raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(c=>c&&typeof c.id==='string'&&c.config&&typeof c.config.type==='string').slice(0,40) : [];
      } catch(error) { console.warn('[AUREON] Card Studio storage unavailable',error); return []; }
    }
    _studioWrite() {
      try { localStorage.setItem(this._studioStorageKey(),JSON.stringify(this._studioCards)); return true; }
      catch(error) { console.error('[AUREON] Card Studio save failed',error); return false; }
    }
    // Optional shared storage via AUREON Sync integration. Explicit transfer avoids
    // silently replacing local edits and never exposes credentials in the browser.
    async _studioSyncRead() {
      if(!this._hass?.callWS) throw new Error('Conexão Home Assistant indisponível.');
      const response=await this._hass.callWS({type:'aureon_sync/cards/get'});
      if(!response || !Array.isArray(response.cards))throw new Error('Resposta de sincronização inválida.');
      if(!Number.isSafeInteger(response.revision)||response.revision<0)throw new Error('Revisão de sincronização inválida.');
      return {cards:this._studioValidateBackup({format:'aureon-card-studio',schema:1,cards:response.cards}),revision:response.revision};
    }
    async _studioSyncStatus() {
      try {
        const {cards:remote,revision}=await this._studioSyncRead();
        const local=this._studioValidateBackup({format:'aureon-card-studio',schema:1,cards:this._studioCards});
        // Compare canonical content by card ID, regardless of card ordering.
        const normalize=cards=>JSON.stringify([...cards].sort((a,b)=>a.id.localeCompare(b.id)));
        const identical=normalize(local)===normalize(remote);
        const localIds=new Set(local.map(c=>c.id));
        const remoteIds=new Set(remote.map(c=>c.id));
        const onlyLocal=local.filter(c=>!remoteIds.has(c.id)).length;
        const onlyRemote=remote.filter(c=>!localIds.has(c.id)).length;
        alert(`Card Studio — Home Assistant\nRevisão compartilhada: ${revision}\nNeste navegador: ${local.length} cartões\nNo Home Assistant: ${remote.length} cartões\nSomente neste navegador: ${onlyLocal}\nSomente no Home Assistant: ${onlyRemote}\nConfigurações ${identical?'idênticas':'diferentes'}.\n\nEsta consulta não altera nada.`);
      }catch(error){alert('Não foi possível consultar a sincronização: '+(error.message||String(error)));}
    }
    async _studioSyncDownload() {
      try {
        const {cards:remote}=await this._studioSyncRead();
        if(!confirm(`Carregar ${remote.length} cartões do Home Assistant? Os ${this._studioCards.length} cartões deste navegador serão substituídos após exportar um backup.`))return;
        this._studioExport('aureon-backup-antes-sincronizacao.json');
        const previous=this._studioCards;
        this._studioCards=remote;
        if(!this._studioWrite()){this._studioCards=previous;throw new Error('Falha ao salvar localmente.');}
        this._studioEdit=null;this._render();
      }catch(error){alert('Falha ao carregar do Home Assistant: '+(error.message||String(error))+'. Instale e reinicie a integração AUREON Sync.');}
    }
    async _studioSyncUpload() {
      try {
        if(!this._hass?.callWS)throw new Error('Conexão Home Assistant indisponível.');
        const {cards:remote,revision}=await this._studioSyncRead();
        if(!confirm(`Enviar ${this._studioCards.length} cartões deste navegador para o Home Assistant e substituir os ${remote.length} cartões compartilhados? Esta ação afeta todos os dispositivos.`))return;
        await this._hass.callWS({type:'aureon_sync/cards/set',cards:this._studioCards,expected_revision:revision});
        alert('Cartões salvos no Home Assistant. Em outro dispositivo, use "Carregar do HA".');
      }catch(error){alert('Falha ao enviar para Home Assistant: '+(error.message||String(error))+'. Se houve conflito, carregue os cartões atuais antes de tentar novamente.');}
    }
    // Portable Card Studio backup: only card configs, never HA tokens or credentials.
    _studioBackupData() {
      return {format:'aureon-card-studio',schema:1,exportedAt:new Date().toISOString(),cards:JSON.parse(JSON.stringify(this._studioCards))};
    }
    _studioValidateBackup(data) {
      if(!data||typeof data!=='object'||Array.isArray(data)||data.format!=='aureon-card-studio'||data.schema!==1||!Array.isArray(data.cards))throw new Error('Arquivo não é um backup compatível do Card Studio.');
      if(data.cards.length>40)throw new Error('Limite de 40 cartões excedido.');
      const ids=new Set();
      return data.cards.map((item,index)=>{
        if(!item||typeof item!=='object'||Array.isArray(item)||typeof item.id!=='string'||!/^card-[a-zA-Z0-9-]{1,80}$/.test(item.id)||ids.has(item.id))throw new Error(`ID inválido ou duplicado no cartão ${index+1}.`);
        if(!item.config||typeof item.config!=='object'||Array.isArray(item.config)||typeof item.config.type!=='string'||!/^([a-z][a-z0-9-]*|custom:[a-z0-9_-]+)$/.test(item.config.type))throw new Error(`Configuração inválida no cartão ${index+1}.`);
        ids.add(item.id);
        return {id:item.id,config:item.config};
      });
    }
    _studioExport(filename='aureon-card-studio-backup.json') {
      try {
        const payload=JSON.stringify(this._studioBackupData(),null,2);
        const blob=new Blob([payload],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
      }catch(error){alert('Não foi possível exportar: '+(error.message||String(error)));}
    }
    async _studioImport(file, mode='replace') {
      if(!file)return;
      try {
        if(file.size>512*1024)throw new Error('Arquivo muito grande (máximo 512 KB).');
        const imported=this._studioValidateBackup(JSON.parse(await file.text()));
        const previous=this._studioCards;
        const existingIds=new Set(previous.map(card=>card.id));
        const incoming=mode==='merge' ? imported.map(card=>{
          if(!existingIds.has(card.id)){existingIds.add(card.id);return card;}
          // Do not overwrite an existing card when merging.
          let id;
          do { id=this._studioNewId(); } while(existingIds.has(id));
          existingIds.add(id);
          return {...card,id};
        }) : imported;
        const next=mode==='merge' ? [...previous,...incoming] : incoming;
        if(next.length>40)throw new Error('A importação ultrapassaria o limite de 40 cartões.');
        const operation=mode==='merge'?'Adicionar':'Substituir';
        if(!confirm(`${operation} ${imported.length} cartões? Atualmente existem ${previous.length}. Será baixado um backup de segurança antes da alteração.`))return;
        // Safety snapshot: export before any destructive mutation.
        this._studioExport('aureon-card-studio-antes-importacao.json');
        this._studioCards=next;
        if(!this._studioWrite()){this._studioCards=previous;throw new Error('Falha ao salvar no armazenamento local.');}
        this._studioEdit=null;this._render();
      }catch(error){alert('Importação cancelada: '+(error.message||String(error)));}
    }
    _studioNewId() { return `card-${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }
    _studioConfig(type,entity,title) {
      const config={type};
      if (['tile','gauge','history-graph','entities'].includes(type)) {
        if(!entity) throw new Error('Escolha uma entidade do Home Assistant.');
        if(type==='entities'||type==='history-graph') config.entities=[entity];
        else config.entity=entity;
      }
      if(type.startsWith('custom:') && entity) config.entity=entity;
      if(['thermostat','humidifier','weather-forecast','media-control','alarm-panel','calendar','todo-list','plant-status','entity','button','picture-entity','sensor'].includes(type) && entity) config.entity=entity;
      if(type==='markdown') config.content=title||'Meu cartão AUREON';
      else if(title) config.name=title;
      return config;
    }
    _studioCatalog() {
      // Public Lovelace card types, with dynamic custom card metadata registered by integrations.
      // HACS is an installer, not a universal registry: unregistered custom cards cannot be enumerated reliably.
      const native=[
        ['tile','Kachel / Tile','Dispositivos'],['entities','Entitäten','Dispositivos'],['entity','Entidade','Dispositivos'],
        ['button','Botão','Dispositivos'],['glance','Visão rápida','Dispositivos'],['area','Ambiente','Ambientes'],
        ['thermostat','Termostato','Clima'],['humidifier','Umidificador','Clima'],['weather-forecast','Previsão do tempo','Clima'],
        ['gauge','Medidor','Dados'],['sensor','Sensor','Dados'],['statistic','Estatística','Dados'],
        ['statistics-graph','Gráfico estatístico','Dados'],['history-graph','Histórico','Dados'],['energy-date-selection','Seleção de energia','Energia'],
        ['energy-usage-graph','Consumo de energia','Energia'],['energy-sources-table','Fontes de energia','Energia'],
        ['energy-distribution','Distribuição de energia','Energia'],['energy-grid-neutrality-gauge','Neutralidade da rede','Energia'],
        ['energy-carbon-consumed-gauge','Carbono consumido','Energia'],['energy-solar-consumed-gauge','Energia solar','Energia'],
        ['media-control','Controle de mídia','Mídia'],['picture','Imagem','Mídia'],['picture-entity','Imagem da entidade','Mídia'],
        ['picture-glance','Imagem e entidades','Mídia'],['picture-elements','Elementos sobre imagem','Mídia'],
        ['map','Mapa','Localização'],['calendar','Calendário','Agenda'],['logbook','Registro de atividades','Dados'],
        ['markdown','Texto / Markdown','Layout'],['heading','Cabeçalho','Layout'],['horizontal-stack','Linha de cartões','Layout'],
        ['vertical-stack','Coluna de cartões','Layout'],['grid','Grade de cartões','Layout'],
        ['conditional','Condicional','Layout'],['entity-filter','Filtro de entidades','Layout'],
        ['iframe','Página web','Layout'],['todo-list','Lista de tarefas','Agenda'],
        ['alarm-panel','Alarme','Segurança'],['plant-status','Planta','Outros']
      ];
      const entries=native.map(([type,name,category])=>({type,name,category,source:'HA'}));
      for(const card of (Array.isArray(window.customCards)?window.customCards:[])) {
        if(!card || typeof card.type!=='string' || !card.type.trim())continue;
        const type=card.type.startsWith('custom:')?card.type:'custom:'+card.type;
        if(type==='custom:aureon-dashboard')continue;
        entries.push({type,name:String(card.name||card.type),category:'Personalizados',source:'HACS / Custom',description:String(card.description||'')});
      }
      // Explicit AUREON component catalog: expand only as independent cards are implemented.
      const unique=new Map();for(const item of entries)if(!unique.has(item.type))unique.set(item.type,item);
      return [...unique.values()].sort((x,y)=>x.name.localeCompare(y.name,'pt'));
    }
    _studioAllowedDomains(type) {
      // Compatibility rules are explicit. Do not guess support for unknown HACS cards.
      const known={
        'thermostat':['climate'],'humidifier':['humidifier'],'weather-forecast':['weather'],
        'media-control':['media_player'],'alarm-panel':['alarm_control_panel'],
        'calendar':['calendar'],'todo-list':['todo'],'plant-status':['plant'],
        'custom:mushroom-light-card':['light'],
        'custom:mushroom-climate-card':['climate'],
        'custom:mushroom-cover-card':['cover'],
        'custom:mushroom-fan-card':['fan'],
        'custom:mushroom-humidifier-card':['humidifier'],
        'custom:mushroom-lock-card':['lock'],
        'custom:mushroom-media-player-card':['media_player'],
        'custom:mushroom-person-card':['person'],
        'custom:mushroom-vacuum-card':['vacuum'],
        'custom:mushroom-update-card':['update'],
        'custom:mushroom-alarm-control-panel-card':['alarm_control_panel'],
        'custom:mushroom-entity-card':null,
        'custom:mushroom-template-card':null,
        'custom:mushroom-chips-card':null
      };
      if(Object.prototype.hasOwnProperty.call(known,type))return known[type];
      // Native multi-domain cards intentionally accept any entity.
      return null;
    }
    _studioEditor(container,existing) {
      const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
      const panel=make('section');panel.className='au-studio-editor au-studio-editor-v27';
      panel.append(make('h3',existing?'Editar cartão':'Adicionar cartão'));
      const initial=existing?.config||{};
      let selected=initial.type||'';
      let currentConfig=JSON.parse(JSON.stringify(initial));
      let editorElement=null,previewElement=null,sequence=0;
      const search=make('input');search.type='search';search.placeholder='Pesquisar cartões nativos, HACS ou AUREON…';
      const category=make('select');
      for(const [value,name] of [['all','Todos'],['HA','Nativos Home Assistant'],['HACS / Custom','Personalizados / HACS']]){
        const opt=make('option',name);opt.value=value;category.append(opt);
      }
      const catalog=make('div');catalog.className='au-studio-catalog';
      const typeLabel=make('p',selected?`Selecionado: ${selected}`:'Selecione um cartão acima');
      const entity=make('select');
      const entityLabel=make('label','Entidade do Home Assistant');entityLabel.append(entity);
      const compatibilityHint=make('p');compatibilityHint.className='au-studio-compatibility';
      const title=make('input');title.type='text';title.maxLength=100;title.placeholder='Título (opcional)';title.value=initial.name||(initial.type==='markdown'?initial.content:'')||'';
      const titleLabel=make('label','Título ou texto');titleLabel.append(title);
      const advanced=make('details');advanced.append(make('summary','Código JSON (avançado)'));
      const json=make('textarea');json.rows=8;json.spellcheck=false;json.placeholder='Configuração do cartão em JSON';
      advanced.append(json);
      const workspace=make('div');workspace.className='au-studio-workspace';
      const formColumn=make('div');formColumn.className='au-studio-form-column';
      const nativeTitle=make('h4','Configurações visuais do cartão');
      const nativeStatus=make('p','Selecione um cartão para carregar o editor visual disponível.');
      const nativeHost=make('div');nativeHost.className='au-studio-native-editor';
      const fallback=make('div');fallback.append(entityLabel,compatibilityHint,titleLabel);
      formColumn.append(nativeTitle,nativeStatus,nativeHost,fallback,advanced);
      const previewColumn=make('div');previewColumn.className='au-studio-preview-column';
      previewColumn.append(make('h4','Prévia ao vivo'));
      const previewHost=make('div');previewHost.className='au-studio-preview-host';
      previewHost.textContent='Selecione um cartão para visualizar.';
      previewColumn.append(previewHost);
      workspace.append(formColumn,previewColumn);
      const error=make('p');error.className='au-studio-error';
      const actions=make('div');actions.className='au-studio-actions';
      const cancel=make('button','Cancelar');cancel.type='button';cancel.addEventListener('click',()=>{this._studioEdit=null;this._render();});
      const save=make('button','Adicionar / Salvar cartão');save.type='button';
      const catalogItems=this._studioCatalog();
      const draw=()=>{
        catalog.replaceChildren();const q=search.value.trim().toLocaleLowerCase();let count=0;
        for(const item of catalogItems){
          if(category.value!=='all'&&category.value!==item.source)continue;
          if(q&&!`${item.name} ${item.type} ${item.category} ${item.description||''}`.toLocaleLowerCase().includes(q))continue;
          const button=make('button');button.type='button';button.className='au-studio-catalog-item'+(selected===item.type?' selected':'');
          button.append(make('strong',item.name),make('small',`${item.source} · ${item.type}`));
          button.addEventListener('click',()=>{
            selected=item.type;currentConfig={type:selected};json.value='';title.value='';
            typeLabel.textContent=`Selecionado: ${item.name} (${item.type})`;
            draw();updateEntityOptions();mountVisualEditor();
          });catalog.append(button);count++;
        }
        if(!count)catalog.append(make('p','Nenhum cartão registrado corresponde à pesquisa.'));
      };
      const updateEntityOptions=()=>{
        const previous=currentConfig.entity||currentConfig.entities?.[0]||entity.value||'';
        const domains=this._studioAllowedDomains(selected);
        const ids=Object.keys(this._hass?.states||{}).filter(id=>!domains||domains.includes(id.split('.')[0])).sort((a,b)=>a.localeCompare(b));
        entity.replaceChildren();const placeholder=make('option',ids.length?'Selecione uma entidade':'Nenhuma entidade compatível');placeholder.value='';entity.append(placeholder);
        for(const id of ids){const state=this._hass.states[id];const option=make('option',`${state?.attributes?.friendly_name||id} (${id})`);option.value=id;entity.append(option);}
        entity.value=ids.includes(previous)?previous:'';entity.disabled=!ids.length;
        compatibilityHint.textContent=domains?`Compatibilidade: ${domains.map(d=>d+'.*').join(', ')} · ${ids.length} entidades encontradas.`:'Entidades disponíveis. O editor do cartão pode aplicar regras adicionais.';
        entityLabel.style.display=selected==='markdown'?'none':'';
      };
      const getFallbackConfig=()=>{
        const generated=this._studioConfig(selected,entity.value,title.value.trim());
        const result={...currentConfig,...generated,type:selected};
        if(entity.value){if(Array.isArray(result.entities))result.entities=[entity.value];else result.entity=entity.value;}
        return result;
      };
      const renderPreview=async(config)=>{
        const request=++sequence;
        previewHost.textContent='Carregando prévia…';previewElement=null;
        try{
          const helpers=await window.loadCardHelpers?.();
          if(request!==sequence||!panel.isConnected)return;
          if(!helpers?.createCardElement)throw new Error('Prévia indisponível nesta versão do Home Assistant.');
          const card=helpers.createCardElement(config);
          previewHost.replaceChildren(card);card.hass=this._hass;previewElement=card;
        }catch(ex){if(request===sequence)previewHost.textContent=`Prévia: ${ex.message||String(ex)}`;}
      };
      const syncJson=()=>{json.value=JSON.stringify(currentConfig,null,2);};
      const mountVisualEditor=async()=>{
        const requested=selected;
        nativeHost.replaceChildren();nativeStatus.textContent='Procurando editor visual…';editorElement=null;
        fallback.hidden=false;
        if(!selected){nativeStatus.textContent='Selecione um cartão.';previewHost.textContent='Selecione um cartão.';return;}
        if(!currentConfig.type)currentConfig={type:selected};
        syncJson();renderPreview(currentConfig);
        try{
          const helpers=await window.loadCardHelpers?.();
          if(!panel.isConnected||requested!==selected)return;
          if(!helpers?.createCardElement)throw new Error('API de cartões indisponível');
          const card=helpers.createCardElement(currentConfig);
          const tag=card.tagName.toLowerCase();
          // Cards with a native editor expose getConfigElement(). Not every custom card does.
          let editor=null;
          if(typeof card.constructor?.getConfigElement==='function')editor=await card.constructor.getConfigElement();
          else if(typeof card.getConfigElement==='function')editor=await card.getConfigElement();
          if(!panel.isConnected||requested!==selected)return;
          if(!editor||typeof editor.setConfig!=='function')throw new Error('Este cartão não disponibiliza um editor visual compatível.');
          editorElement=editor;
          editor.addEventListener('config-changed',ev=>{
            const next=ev.detail?.config;
            if(!next||typeof next!=='object'||Array.isArray(next))return;
            currentConfig={...next,type:selected};syncJson();renderPreview(currentConfig);
          });
          nativeHost.replaceChildren(editor);
          editor.hass=this._hass;
          editor.setConfig(currentConfig);
          fallback.hidden=true;
          nativeStatus.textContent='Editor visual original do cartão · alterações refletidas na prévia.';
        }catch(ex){
          if(requested!==selected||!panel.isConnected)return;
          nativeStatus.textContent=`Editor assistido: ${ex.message||String(ex)}`;
          fallback.hidden=false;
        }
      };
      entity.addEventListener('change',()=>{currentConfig=getFallbackConfig();syncJson();renderPreview(currentConfig);});
      title.addEventListener('input',()=>{currentConfig=getFallbackConfig();syncJson();renderPreview(currentConfig);});
      json.addEventListener('change',()=>{
        try{const next=JSON.parse(json.value);if(!next||typeof next!=='object'||Array.isArray(next)||next.type!==selected)throw new Error('O tipo do cartão não pode ser alterado neste campo.');currentConfig=next;error.textContent='';renderPreview(currentConfig);if(editorElement){editorElement.setConfig(currentConfig);}else{updateEntityOptions();}}
        catch(ex){error.textContent='JSON inválido: '+ex.message;}
      });
      save.addEventListener('click',()=>{
        try{
          if(!selected)throw new Error('Escolha um cartão no catálogo.');
          if(advanced.open&&json.value.trim()){
            const parsed=JSON.parse(json.value);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||parsed.type!==selected)throw new Error('JSON inválido ou tipo diferente do cartão selecionado.');
            currentConfig=parsed;
          }
          const config=editorElement?{...currentConfig,type:selected}:getFallbackConfig();
          const allowed=this._studioAllowedDomains(config.type);
          if(allowed?.length&&!config.entity&&!config.entities?.length)throw new Error('Escolha uma entidade compatível antes de salvar.');
          if(allowed&&config.entity&&!allowed.includes(String(config.entity).split('.')[0]))throw new Error('Entidade incompatível com este cartão.');
          if(config.type==='custom:aureon-dashboard')throw new Error('Não é permitido adicionar a AUREON dentro dela mesma.');
          const before=this._studioCards.slice();const item={id:existing?.id||this._studioNewId(),config};
          const index=this._studioCards.findIndex(c=>c.id===item.id);
          if(index<0){if(this._studioCards.length>=40)throw new Error('Limite de 40 cartões.');this._studioCards.push(item);}else this._studioCards[index]=item;
          if(!this._studioWrite()){this._studioCards=before;throw new Error('Não foi possível salvar neste navegador.');}
          this._studioEdit=null;this._render();
        }catch(ex){error.textContent=ex.message||String(ex);}
      });
      actions.append(cancel,save);
      search.addEventListener('input',draw);category.addEventListener('change',draw);
      panel.append(search,category,catalog,typeLabel,workspace,error,actions);container.append(panel);
      draw();updateEntityOptions();if(selected)mountVisualEditor();
    }
    _studioSection(main) {
      const make=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
      const section=make('section');section.className='au-studio';
      const bar=make('div');bar.className='au-studio-header';bar.append(make('h2','Meus cartões'));
      const add=make('button','+ Adicionar cartão');add.type='button';add.addEventListener('click',()=>{this._studioEdit='new';this._render();});bar.append(add);
      const backup=make('button','Exportar backup');backup.type='button';backup.addEventListener('click',()=>this._studioExport());bar.append(backup);
      const restore=make('button','Importar backup');restore.type='button';
      const fileInput=make('input');fileInput.type='file';fileInput.accept='.json,application/json';fileInput.hidden=true;
      fileInput.addEventListener('change',async()=>{const file=fileInput.files?.[0];fileInput.value='';await this._studioImport(file,this._studioImportMode||'replace');});
      restore.addEventListener('click',()=>{this._studioImportMode='replace';fileInput.click();});
      const merge=make('button','Adicionar do backup');merge.type='button';
      merge.addEventListener('click',()=>{this._studioImportMode='merge';fileInput.click();});
      bar.append(restore,merge,fileInput);
      const upload=make('button','Salvar no HA');upload.type='button';upload.addEventListener('click',()=>this._studioSyncUpload());
      const download=make('button','Carregar do HA');download.type='button';download.addEventListener('click',()=>this._studioSyncDownload());
      const status=make('button','Comparar com HA');status.type='button';status.addEventListener('click',()=>this._studioSyncStatus());
      bar.append(upload,download,status);section.append(bar);
      section.append(make('p','Catálogo dinâmico: cartões nativos + personalizados registrados no HA. Configurações salvas neste navegador e usuário. Para compartilhar entre dispositivos, instale a integração opcional AUREON Sync e use Salvar no HA / Carregar do HA. A transferência é manual e exige confirmação. Comparar com HA não altera cartões. Importar substitui; Adicionar preserva os cartões atuais. Um backup é baixado antes de importar.'));
      if(this._studioEdit){const existing=this._studioCards.find(c=>c.id===this._studioEdit);this._studioEditor(section,existing);}
      const grid=make('div');grid.className='au-studio-grid';section.append(grid);
      for(const [index,item] of this._studioCards.entries()){
        const slot=make('article');slot.className='au-studio-slot';
        const controls=make('div');controls.className='au-studio-actions';
        const label=make('span',item.config.name||item.config.type);controls.append(label);
        const action=(name,fn)=>{const b=make('button',name);b.type='button';b.addEventListener('click',fn);controls.append(b);};
        action('Editar',()=>{this._studioEdit=item.id;this._render();});
        action('↑',()=>this._studioMove(index,-1));action('↓',()=>this._studioMove(index,1));
        action('Excluir',()=>{if(!confirm('Excluir este cartão da AUREON?'))return;const before=this._studioCards.slice();this._studioCards=this._studioCards.filter(c=>c.id!==item.id);if(!this._studioWrite()){this._studioCards=before;return;}this._render();});
        slot.append(controls);
        const host=make('div');host.className='au-studio-card-host';host.setAttribute('data-studio-id',item.id);host.textContent='Carregando cartão…';slot.append(host);grid.append(slot);
      }
      main.append(section);
    }
    _studioMove(index,offset){
      const next=index+offset;if(next<0||next>=this._studioCards.length)return;
      const before=this._studioCards.slice();
      [this._studioCards[index],this._studioCards[next]]=[this._studioCards[next],this._studioCards[index]];
      if(!this._studioWrite()){this._studioCards=before;return;}this._render();
    }
    async _studioMount() {
      const token=++this._studioRenderToken;
      this._studioRendered=[];
      if(this._page!=='Início')return;
      const hosts=[...this.shadowRoot.querySelectorAll('[data-studio-id]')];
      if(!hosts.length)return;
      let helpers;
      try {helpers=await window.loadCardHelpers?.();if(!helpers?.createCardElement)throw new Error('API de cartões do HA indisponível');}
      catch(error){for(const host of hosts)host.textContent='Não foi possível carregar os cartões do Home Assistant: '+error.message;return;}
      if(token!==this._studioRenderToken)return;
      for(const host of hosts){
        const item=this._studioCards.find(c=>c.id===host.getAttribute('data-studio-id'));
        if(!item)continue;
        try{
          const config=item.config;
          const allowed=this._studioAllowedDomains(config.type);
          if(allowed?.length && !config.entity && !config.entities?.length) {
            host.textContent='Cartão sem entidade. Clique em Editar e selecione uma entidade compatível.';
            continue;
          }
          const card=helpers.createCardElement(config);
          host.replaceChildren(card);
          // Some custom cards need to be connected to the DOM before hass is assigned.
          card.hass=this._hass;
          this._studioRendered.push(card);
          if(card.tagName==='HUI-ERROR-CARD') console.warn('[AUREON] Card reported a configuration error',config);
        }catch(error){host.textContent='Erro neste cartão: '+(error.message||String(error));console.warn('[AUREON] Card Studio render error',item.config.type,error);}
      }
    }
    getCardSize() { return 9; }
    static getStubConfig() { return { type: 'custom:aureon-dashboard' }; }
    // The editor follows the AUREON theme: the resolved --au-* tokens (fixed palette, custom colours or the HA theme
    // in automatic mode) are handed to the editor as --aureon-ui-* tokens, light or dark. Re-applied whenever the
    // AUREON appearance, the palette or HA's dark mode change — no reload and no editor rebuild.
    _floorTheme(){
      const host=this.shadowRoot?.querySelector('[data-aureon-floor-studio]');
      if(!host)return;
      const probe=document.createElement('span');probe.style.display='none';this.shadowRoot.append(probe);
      const rgb=token=>{probe.style.color='';probe.style.color=`var(${token})`;const m=(getComputedStyle(probe).color.match(/[\d.]+/g)||['0','0','0']).map(Number);return m.slice(0,3);};
      const bg=rgb('--au-bg'),surface=rgb('--au-surface'),text=rgb('--au-surface-text'),muted=rgb('--au-muted'),accent=rgb('--au-accent'),accentText=rgb('--au-accent-text'),sage=rgb('--au-sage');
      probe.remove();
      const lum=c=>{const v=c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
      const mix=(a,b,t)=>a.map((x,i)=>Math.round(x+(b[i]-x)*t));
      const hex=c=>'#'+c.map(x=>x.toString(16).padStart(2,'0')).join('');
      const trip=c=>c.join(', ');
      const dark=lum(bg)<.35;
      // keep the accent readable on the editor surfaces (a pale accent on a light theme gets darker, and vice versa)
      let ui=accent;for(let i=0;i<8&&Math.abs(lum(ui)-lum(surface))<.18;i++)ui=mix(ui,dark?[255,255,255]:[0,0,0],.18);
      const tokens={
        '--aureon-ui-bg':hex(dark?mix(bg,surface,.25):mix(bg,surface,.4)),'--aureon-ui-bg2':hex(dark?surface:mix(surface,bg,.25)),
        '--aureon-ui-chrome':`rgba(${trip(surface)}, ${dark?.86:.9})`,'--aureon-ui-chrome-solid':hex(mix(surface,bg,dark?.35:.15)),
        '--aureon-ui-line':`rgba(${trip(text)}, ${dark?.14:.16})`,'--aureon-ui-text':hex(text),'--aureon-ui-muted':hex(muted),
        '--aureon-ui-accent':hex(ui),'--aureon-ui-accent-text':hex(lum(ui)>.4?mix(bg,[0,0,0],.6):accentText),'--aureon-ui-soft':hex(sage),
        '--aureon-ui-accent-rgb':trip(ui),'--aureon-ui-soft-rgb':trip(sage),'--aureon-ui-line-rgb':trip(text),'--aureon-ui-muted-rgb':trip(muted),'--aureon-ui-panel-rgb':trip(bg),
        '--aureon-ui-wall':hex(mix(surface,text,dark?.24:.5)),'--aureon-ui-wall-ext':hex(mix(surface,text,dark?.34:.62)),
        '--aureon-ui-shadow':dark?'0 8px 30px rgba(0, 0, 0, 0.45)':'0 6px 22px rgba(20, 30, 20, 0.14)','--aureon-ui-scheme':dark?'dark':'light'
      };
      for(const [key,value] of Object.entries(tokens))host.style.setProperty(key,value);
      host.dataset.aureonScheme=dark?'dark':'light';
    }
    _applyThemeTokens(){
      for (const [key,value] of Object.entries(themeTokens(this._theme,this._hass))) this.style.setProperty(key,value);
      this._floorTheme();
    }
    // AUREON Floor Studio translations follow the Home Assistant UI language.
    _floorText(key){
      const language=String(this._hass?.language||'en').toLowerCase().split('-')[0];
      const labels={
        pt:{loading:'Carregando o AUREON Floor Studio…',retry:'Tentar novamente',missing:'O AUREON Floor Studio não foi encontrado. Verifique se a integração AUREON Floor Studio está instalada (HACS → AUREON Floor Studio) e reinicie o Home Assistant.',mountError:'Não foi possível abrir o AUREON Floor Studio',title:'AUREON Floor Studio',region:'Editor e visualização da planta',foreign:'Atenção: o editor carregado não é a versão AUREON (provavelmente o NeonPlan 3D oficial também está instalado e carregou antes). Remova o NeonPlan 3D oficial no HACS e reinicie o Home Assistant. Siga as instruções de atualização antes de editar.'},
        de:{loading:'AUREON Floor Studio wird geladen…',retry:'Erneut versuchen',missing:'AUREON Floor Studio wurde nicht gefunden. Prüfe, ob die Integration AUREON Floor Studio installiert ist (HACS → AUREON Floor Studio), und starte Home Assistant neu.',mountError:'AUREON Floor Studio konnte nicht geöffnet werden',title:'AUREON Floor Studio',region:'Grundriss-Editor und -Ansicht',foreign:'Achtung: Der geladene Editor ist nicht die AUREON-Version (vermutlich ist die offizielle NeonPlan-3D-Integration zusätzlich installiert und wurde zuerst geladen). Entferne das offizielle NeonPlan 3D in HACS und starte Home Assistant neu. Vor dem Bearbeiten die Update-Anleitung befolgen.'},
        en:{loading:'Loading AUREON Floor Studio…',retry:'Try again',missing:'AUREON Floor Studio was not found. Check that the AUREON Floor Studio integration is installed (HACS → AUREON Floor Studio) and restart Home Assistant.',mountError:'Could not open AUREON Floor Studio',title:'AUREON Floor Studio',region:'Floor plan editor and view',foreign:'Warning: the loaded editor is not the AUREON build (the official NeonPlan 3D integration is probably installed as well and loaded first). Remove the official NeonPlan 3D in HACS and restart Home Assistant. Follow the update steps before editing.'}
      };
      return (labels[language]||labels.en)[key]||key;
    }
    // AUREON Floor Studio: the complete original editor (view, editor, extensions; import/export, undo/redo,
    // furniture, materials, looks) placed directly in this page — no iframe, so Home Assistant's header and
    // sidebar appear only once. It is the same element and the same backend store as /aureon-floor-studio and the
    // Startseite. Permissions stay with the editor and the backend (non-admins only get the view).
    async _mountFloorStudio(){
      const host=this.shadowRoot?.querySelector('[data-aureon-floor-studio]');
      const status=this.shadowRoot?.querySelector('[data-aureon-floor-status]');
      const token=++this._floorMountToken;
      const alive=()=>token===this._floorMountToken && host?.isConnected && this._page==='Planta';
      if(!alive())return;
      const explain=(message)=>{
        if(!alive())return;
        const note=document.createElement('p');
        note.className='muted';
        note.setAttribute('role','status');
        note.textContent=message;
        const retry=document.createElement('button');
        retry.type='button';
        retry.className='au-floor-retry';
        retry.textContent=this._floorText('retry');
        retry.addEventListener('click',()=>{if(!alive())return;host.textContent=this._floorText('loading');void this._mountFloorStudio();});
        host.replaceChildren(note,retry);
      };
      if(!customElements.get('neonplan3d-panel')){
        // The integration adds its bundle to every HA page; it may arrive after the dashboard.
        await Promise.race([customElements.whenDefined('neonplan3d-panel'),new Promise(resolve=>setTimeout(resolve,8000))]);
        if(!alive())return;
        if(!customElements.get('neonplan3d-panel')){explain(this._floorText('missing'));return;}
      }
      try{
        const Panel=customElements.get('neonplan3d-panel');
        const panel=document.createElement('neonplan3d-panel');
        panel.setAttribute('aureon-embedded','');
        panel.aureonEmbedded=true;
        panel.narrow=window.matchMedia?.('(max-width: 870px)')?.matches||false;
        panel.route={prefix:'/aureon-floor-studio',path:''};
        panel.panel={config:{}};
        panel.hass=this._hass;
        this._floorTheme();
        host.replaceChildren(panel);
        // Fill the visible height below the AUREON header (HA header, sidebar and safe areas are already outside).
        const fit=()=>{
          if(!host.isConnected){window.removeEventListener('resize',fit);return;}
          const top=host.getBoundingClientRect().top,height=window.visualViewport?.height||window.innerHeight;
          host.style.setProperty('--aureon-floor-height',Math.max(360,Math.round(height-Math.max(0,top)-12))+'px');
        };
        fit();window.addEventListener('resize',fit);
        this._floorCard=panel;
        this._studioRendered.push(panel);
        // Never hide a version problem: a panel without the AUREON marker is a foreign (official) bundle.
        if(status){status.hidden=!!Panel.aureonEmbed;status.textContent=Panel.aureonEmbed?'':this._floorText('foreign');}
      }catch(error){
        console.warn('[AUREON] Floor Studio mount failed',error);
        explain(this._floorText('mountError')+': '+(error?.message||String(error)));
      }
    }
    _floorSection(main,make){
      const section=make('section','au-floor au-floor-studio');
      section.setAttribute('aria-label',this._floorText('region'));
      const status=make('p','au-floor-warning');
      status.setAttribute('role','alert');
      status.setAttribute('data-aureon-floor-status','');
      status.hidden=true;
      const host=make('div','au-floor-studio-host',this._floorText('loading'));
      host.setAttribute('data-aureon-floor-studio','');
      section.append(status,host);main.append(section);
      // Leaving the page removes the element: the editor and the 3D view free their WebGL resources on disconnect.
      queueMicrotask(()=>this._mountFloorStudio());
    }
    _render() {
      this._shellResize?.();
      const Platform=customElements.get('aureon-platform');
      if(Platform?.createController){if(!this._platformController){this._platformController=Platform.createController();this._platformController.subscribe?.(()=>{const p=this._platformController.preferences;if(p.appearance!==this._theme.mode||p.palette!==this._theme.palette||(p.accent||'')!==(this._theme.accent||'')){this._theme={...this._theme,mode:p.appearance,palette:p.palette,accent:p.accent||''};this._applyThemeTokens();}});}this._platformController.update(this._hass,this._registry);this._theme={...this._theme,mode:this._platformController.preferences.appearance,palette:this._platformController.preferences.palette,accent:this._platformController.preferences.accent||''};}

      if (!this._configured) return;
      const root = this.shadowRoot;
      // A page re-render removes the previous viewer: invalidate pending loads
      // and stop forwarding HA state updates to disconnected WebGL cards.
      ++this._floorMountToken;
      if(this._floorCard){
        this._studioRendered=this._studioRendered.filter(item=>item!==this._floorCard);
        this._floorCard=null;
      }
      root.replaceChildren();
      const style = document.createElement('style');
      style.textContent = `nav .au-nav-button{display:flex;align-items:center;justify-content:center;width:100%;min-height:45px;padding:10px;border:1px solid transparent;border-radius:12px;transition:background-color .18s ease,color .18s ease,border-color .18s ease}nav .au-nav-button svg{display:block;flex:none}nav .au-nav-button.active{background:var(--au-hover);border-color:var(--au-border);color:var(--au-accent)}nav .au-nav-button:hover{background:var(--au-hover)}@media(prefers-reduced-motion:reduce){nav .au-nav-button{transition:none}}:host{display:block;color:var(--au-text);font-family:var(--paper-font-body1_-_font-family,Inter,system-ui,sans-serif)}*{box-sizing:border-box}.wrap{background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border);border-radius:22px;overflow:hidden;min-height:max(600px, calc(100vh - 64px));min-height:max(600px, calc(100dvh - 64px));display:grid;grid-template-columns:76px minmax(0,1fr)}nav{padding:18px 9px;background:var(--au-nav);border-right:1px solid var(--au-border);display:flex;flex-direction:column;gap:6px}.logo{color:var(--au-accent);font-size:29px;text-align:center;font-weight:800;margin:6px 0 22px}button{background:transparent;color:var(--au-text);border:0;border-radius:12px;cursor:pointer;padding:11px 3px;font:inherit;font-size:20px}button:hover,button.active{background:var(--au-hover);color:var(--au-accent)}button:focus-visible,select:focus-visible{outline:2px solid var(--au-accent);outline-offset:2px}main{min-width:0;padding:30px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--au-border);padding-bottom:22px}h1{font:400 clamp(28px,3vw,43px)/1.15 Georgia,serif;margin:5px 0 10px;letter-spacing:-.8px;overflow-wrap:anywhere}.small{color:var(--au-accent);font-size:10px;letter-spacing:2px;font-weight:700}.muted{color:var(--au-muted);font-size:12px;line-height:1.6}.demo{color:var(--au-accent);font-size:10px;border:1px solid var(--au-border);border-radius:20px;padding:9px 12px;white-space:nowrap}.hero{border:1px solid var(--au-border);border-radius:18px;padding:35px;margin-top:24px;background:var(--au-surface);color:var(--au-surface-text);min-height:180px}.hero h2{font-size:clamp(22px,3vw,38px);margin:10px 0;letter-spacing:-1px}.hero .muted{color:inherit;opacity:.8}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:22px}.card{background:var(--au-card);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:16px;padding:18px;min-height:152px}.card .muted{color:inherit;opacity:.8}.symbol{color:var(--au-accent);font-size:27px}.card h3{font-size:14px;margin:13px 0 5px}.state{color:var(--au-accent);font-size:9px;letter-spacing:1px;margin-top:15px}.foot{color:var(--au-muted);font-size:10px;margin-top:25px}.theme-settings{margin-top:24px;padding:22px;border:1px solid var(--au-border);border-radius:16px;background:var(--au-surface);color:var(--au-surface-text)}.theme-settings h2{margin:0 0 12px;font-size:20px}.theme-settings label{display:block;font-size:13px;margin:12px 0 5px}.theme-settings select{width:100%;max-width:360px;padding:10px;border-radius:10px;background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border)}.theme-settings p{font-size:12px;opacity:.85}.area-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:22px}.area-tile{border:1px solid var(--au-border);border-radius:16px;padding:18px;background:var(--au-surface);color:var(--au-surface-text)}.area-tile h3{font-size:16px;margin:0 0 12px}.area-tile p{font-size:12px;opacity:.85}.registry-note{margin-top:18px;font-size:12px;color:var(--au-muted)}.device-tools{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.device-tools input,.device-tools select{background:var(--au-surface);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:10px;padding:11px;min-width:180px;max-width:100%}.device-tools input{flex:1}.device-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:16px}.device-item{padding:14px;border:1px solid var(--au-border);background:var(--au-surface);color:var(--au-surface-text);border-radius:12px;min-width:0}.device-item strong{display:block;font-size:13px;overflow-wrap:anywhere}.device-item small{display:block;opacity:.75;margin-top:5px;overflow-wrap:anywhere}.device-state{color:var(--au-accent);margin-top:9px;font-size:12px;overflow-wrap:anywhere}@media(max-width:650px){.wrap{grid-template-columns:54px minmax(0,1fr)}nav{padding:10px 4px}.logo{font-size:23px}button{font-size:18px}main{padding:15px}h1{font-size:23px}.demo{display:none}.hero{padding:22px}}`;
      const filterStyle=document.createElement('style');
      filterStyle.textContent=`.filter-bar{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.filter-bar select,.filter-bar input{flex:1 1 170px;min-width:0;max-width:none}.device-results{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin-top:12px}.device-group{border:1px solid var(--au-border);border-radius:14px;background:var(--au-card);color:var(--au-surface-text);padding:14px;min-width:0}.device-group summary{cursor:pointer;font-weight:650;line-height:1.5;overflow-wrap:anywhere}.device-group small{display:block;font-size:11px;opacity:.75;margin:5px 0}.device-entities{display:grid;gap:8px;margin-top:12px}.device-entity{border-top:1px solid var(--au-border);padding-top:8px;overflow-wrap:anywhere}.device-entity strong{display:block;font-size:12px}.device-entity small{font-size:10px}.device-entity .device-state{margin-top:4px}.filter-check{display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap}.filter-check input{flex:none}.filter-action{font-size:12px;padding:10px 12px;border:1px solid var(--au-border);background:var(--au-card);color:var(--au-surface-text)}.filter-action:hover{color:var(--au-accent)}.au-universal{display:flex;flex-wrap:wrap;gap:6px}.au-universal .au-control-label{width:100%}.au-universal input[type=range]{width:100%}.au-generic{margin-top:8px;padding:9px;border:1px solid var(--au-border);border-radius:9px;display:grid;gap:4px}.au-generic-value{font-size:13px;color:var(--au-accent)}.device-empty{grid-column:1/-1}.au-control{margin-top:10px;padding:10px;border:1px solid var(--au-border);border-radius:10px}.au-control-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.au-toggle{font-size:12px;padding:8px 12px;background:var(--au-hover);border:1px solid var(--au-border)}.au-toggle:disabled{opacity:.5;cursor:not-allowed}.au-control-label{display:flex;justify-content:space-between;align-items:center;font-size:12px;margin:10px 0 5px}.au-control input[type=range]{width:100%;accent-color:var(--au-accent)}.au-cover-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.au-climate-select,.au-control input[type=number]{background:var(--au-surface);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:8px;padding:8px;max-width:100%;margin:5px 6px 5px 0}.au-control input[type=color]{height:30px;width:52px;border:1px solid var(--au-border);background:transparent;border-radius:6px}`;
      filterStyle.textContent += `.au-home nav{background:linear-gradient(180deg,color-mix(in srgb,var(--au-nav) 82%,transparent),color-mix(in srgb,var(--au-card) 40%,var(--au-nav)));gap:8px}.au-home nav .au-nav-button{min-height:48px;border-radius:15px}.au-home nav .au-nav-button.active{box-shadow:0 0 22px color-mix(in srgb,var(--au-accent) 40%,transparent)}@media(max-width:650px){.wrap.wrap{grid-template-columns:minmax(0,1fr);grid-template-rows:1fr auto}.wrap>nav>*{margin-top:0!important;margin-bottom:0!important}.wrap>nav{align-items:center}.wrap>main{order:1}.wrap>nav{order:2;position:sticky;bottom:0;z-index:5;flex-direction:row;overflow-x:auto;gap:4px;padding:7px 8px calc(7px + env(safe-area-inset-bottom));border-right:0;border-top:1px solid var(--au-border);background:color-mix(in srgb,var(--au-nav) 86%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);scrollbar-width:none}.wrap>nav .logo{display:none}.wrap>nav{overflow:visible;justify-content:space-around;padding:6px 6px calc(8px + env(safe-area-inset-bottom))}.wrap>nav .au-nav-button.au-nav-secondary{display:none}.wrap>nav .au-nav-button,.wrap>nav .au-nav-more{flex:1 1 0;min-width:0;min-height:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px 2px}.wrap>nav .au-nav-label{display:block;font-size:10px;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}.au-nav-label{display:none}.au-nav-more{display:none;background:transparent;color:var(--au-text);border:1px solid transparent;border-radius:12px;cursor:pointer;font:inherit}@media(max-width:650px){.wrap>nav .au-nav-more{display:flex}}.au-more-sheet{margin:auto 0 0;width:100vw;max-width:none;border:1px solid var(--au-border);border-radius:24px 24px 0 0;background:var(--au-card);color:var(--au-text);padding:18px 16px calc(18px + env(safe-area-inset-bottom))}.au-more-sheet::backdrop{background:#0008;backdrop-filter:blur(6px)}.au-more-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.au-more-item{display:grid;justify-items:center;gap:8px;padding:14px 6px;border:1px solid var(--au-border);border-radius:16px;background:var(--au-surface);color:var(--au-text);font-size:12px;cursor:pointer;min-height:74px}.au-more-item span{overflow-wrap:anywhere;text-align:center}.au-more-close{display:block;width:100%;margin-top:14px;padding:12px;border-radius:14px;border:1px solid var(--au-border);background:transparent;color:var(--au-text);font-size:13px;cursor:pointer}`;
      filterStyle.textContent += `:host{container:aureon/inline-size}.wrap{position:relative;isolation:isolate;font-family:Arial,Helvetica,sans-serif}.wrap:before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,var(--au-bg),transparent 55%,var(--au-bg)),var(--au-ambient-image,none) center/cover no-repeat;opacity:var(--au-ambient-opacity,0)}nav{background:linear-gradient(180deg,color-mix(in srgb,var(--au-nav) 62%,transparent),color-mix(in srgb,var(--au-nav) 88%,transparent))!important;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}.logo{display:grid;justify-items:center;gap:8px}.au-logo-mark{width:44px;height:50px;display:block}.au-wordmark{display:none;font:15px Georgia,'Times New Roman',serif;letter-spacing:5px;color:var(--au-accent)}.au-rail-foot{display:none}@container aureon (min-width:1240px){.wrap.wrap{grid-template-columns:204px minmax(0,1fr)}.wrap>nav{padding:28px 13px}.au-logo-mark{width:58px;height:65px}.au-wordmark{display:block}.logo{margin:0 0 30px}.wrap>nav .au-nav-button{justify-content:flex-start;gap:17px;padding:12px 17px;border-radius:13px;opacity:.85;font-size:14px}.wrap>nav .au-nav-button.active{opacity:1;background:color-mix(in srgb,var(--au-surface) 60%,transparent)!important;color:var(--au-accent)!important;border-color:var(--au-border)!important;box-shadow:none!important}.wrap>nav .au-nav-label{display:block;color:var(--au-text);font-size:14px}.wrap>nav .au-nav-button.active .au-nav-label{color:var(--au-accent)}.au-rail-foot{display:grid;gap:8px;margin-top:auto;padding-top:24px;text-align:center;font:15px Georgia,'Times New Roman',serif;letter-spacing:4px;color:var(--au-accent)}.au-rail-foot small{font-size:12px;letter-spacing:0;color:var(--au-accent);opacity:.85}}`;
      filterStyle.textContent += `.au-rail-person{display:none}.au-media .au-rail-person{display:grid;justify-items:center;gap:3px;margin-top:auto;padding-top:16px;text-align:center;font-size:11px;position:relative}.au-media .au-rail-person img,.au-media .au-rail-initial{width:38px;height:38px;border-radius:50%;object-fit:cover;display:grid;place-items:center;background:var(--au-surface);border:1px solid var(--au-border);color:var(--au-accent);font:15px Georgia,serif}.au-media .au-rail-person.home:after{content:'';position:absolute;top:44px;left:calc(50% + 10px);width:9px;height:9px;border-radius:50%;background:#5bd28a;border:2px solid var(--au-nav)}.au-media .au-rail-person strong{font-weight:500;color:var(--au-text);max-width:84px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.au-media .au-rail-person small{color:var(--au-muted);font-size:10px}.au-media .au-rail-foot{display:none!important}@media(min-width:651px){.au-media.wrap.wrap{grid-template-columns:92px minmax(0,1fr)}.au-media.wrap>nav{padding:20px 8px 18px!important;gap:4px}.au-media .au-wordmark{display:block!important;font-size:10px;letter-spacing:3px}.au-media .au-logo-mark{width:34px!important;height:38px!important}.au-media .logo{margin:0 0 14px!important}.au-media.wrap>nav .au-nav-button{flex-direction:column;justify-content:center!important;gap:6px!important;padding:8px 2px!important;min-height:58px;font-size:10.5px!important;opacity:.9}.au-media.wrap>nav .au-nav-label{display:block!important;font-size:10.5px!important;line-height:1.15;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:inherit}.au-media.wrap>nav .au-nav-button.active{background:color-mix(in srgb,var(--au-accent) 16%,transparent)!important;border-color:color-mix(in srgb,var(--au-accent) 55%,transparent)!important;color:var(--au-accent)!important;box-shadow:0 0 18px color-mix(in srgb,var(--au-accent) 22%,transparent)!important}}`;
      filterStyle.textContent += `.au-home main{padding:22px}.au-home main>header{display:none}.au-home{background:radial-gradient(ellipse at 32% 32%,color-mix(in srgb,var(--au-accent) 7%,transparent),transparent 65%),var(--au-bg)}.au-home nav .active{background:var(--au-accent);color:var(--au-bg)}@media(max-width:650px){.au-home main{padding:10px}}`;
      filterStyle.textContent += `.au-floor-retry{font:inherit;font-size:12px;padding:9px 14px;margin:8px 0;border:1px solid var(--au-accent);border-radius:9px;background:var(--au-surface);color:var(--au-accent);cursor:pointer}.au-floor-retry:focus-visible{outline:2px solid var(--au-accent);outline-offset:2px}`;
      filterStyle.textContent += `.au-floor-controls{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.au-floor-controls button,.au-floor-controls a{font:inherit;font-size:12px;line-height:1.4;padding:10px 14px;border-radius:10px;border:1px solid var(--au-border);background:var(--au-surface);color:var(--au-surface-text);text-decoration:none;cursor:pointer}.au-floor-controls button[aria-pressed=true]{background:var(--au-hover);border-color:var(--au-accent);color:var(--au-accent)}.au-neonplan-editor-host{min-height:600px}.au-neonplan-editor-frame{width:100%;height:max(650px,80vh);border:1px solid var(--au-border);border-radius:14px;background:var(--au-surface)}.au-floor [hidden]{display:none!important}.au-floor-controls button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:650px){.au-neonplan-editor-frame{height:75vh;min-height:500px}}`;
      filterStyle.textContent += `.au-sensor{display:grid;gap:5px}.au-sensor-value{font-size:15px;font-weight:650;overflow-wrap:anywhere}.au-sensor small{font-size:10px;opacity:.75}.au-sensor[data-au-sensor-kind=active] .au-sensor-value{color:var(--au-accent)}`;
      filterStyle.textContent += `.au-studio{margin-top:24px}.au-studio-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.au-studio-header h2{font-size:19px}.au-studio p{font-size:12px;color:var(--au-muted)}.au-studio button{font-size:12px;padding:8px 10px;border:1px solid var(--au-border);border-radius:9px;background:var(--au-surface);color:var(--au-surface-text)}.au-studio-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:15px}.au-studio-slot,.au-studio-editor{padding:14px;border:1px solid var(--au-border);border-radius:14px;background:var(--au-card);color:var(--au-surface-text);min-width:0}.au-studio-actions{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:12px}.au-studio-actions span{font-size:12px;font-weight:600;margin-right:auto;overflow-wrap:anywhere}.au-studio-editor{max-width:650px;margin:12px 0}.au-studio-editor label{display:grid;gap:6px;font-size:12px;margin:12px 0}.au-studio-editor select,.au-studio-editor input,.au-studio-editor textarea{width:100%;padding:10px;background:var(--au-surface);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:8px;font:inherit}.au-studio-editor summary{font-size:12px;cursor:pointer}.au-studio-error{color:#c94d4d!important}.au-studio-card-host{min-height:80px;overflow:hidden}.au-studio-catalog{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;max-height:340px;overflow:auto;margin:12px 0}.au-studio .au-studio-catalog-item{display:grid;gap:5px;text-align:left;min-height:68px;padding:12px;border-radius:12px}.au-studio-catalog-item strong{font-size:12px}.au-studio-catalog-item small{font-size:10px;opacity:.7;overflow-wrap:anywhere}.au-studio .au-studio-catalog-item.selected{outline:2px solid var(--au-accent);background:var(--au-hover)}`;
      filterStyle.textContent += `.au-studio-editor-v27{max-width:none;width:100%;margin:16px 0;padding:20px}.au-studio-workspace{display:grid;grid-template-columns:minmax(260px,1fr) minmax(260px,1fr);gap:18px;margin:16px 0}.au-studio-form-column,.au-studio-preview-column{min-width:0;border:1px solid var(--au-border);border-radius:14px;padding:16px;background:var(--au-surface)}.au-studio-form-column h4,.au-studio-preview-column h4{margin:0 0 12px;font-size:14px}.au-studio-native-editor{min-width:0;overflow:auto;max-height:640px}.au-studio-preview-host{padding:12px;border-radius:12px;background:var(--au-bg);min-height:150px;overflow:hidden}.au-studio-preview-host>*{display:block;max-width:100%}.au-studio-editor-v27 .au-studio-catalog{max-height:220px}.au-studio-editor-v27 .au-studio-actions{justify-content:flex-end}@media(max-width:850px){.au-studio-workspace{grid-template-columns:minmax(0,1fr)}}`;

      // Responsive visual-editor bridge: layout depends on actual AUREON width,
      // not on browser viewport (Home Assistant may have a sidebar open).
      filterStyle.textContent += `
      .au-studio-editor-v27{container-type:inline-size;max-width:100%;min-width:0;overflow:visible}
      .au-studio-editor-v27 .au-studio-workspace{grid-template-columns:minmax(0,1fr);align-items:start;gap:16px}
      .au-studio-editor-v27 .au-studio-form-column,.au-studio-editor-v27 .au-studio-preview-column{min-width:0;width:100%;overflow:hidden}
      .au-studio-editor-v27 .au-studio-form-column{padding:clamp(12px,2vw,22px)}
      .au-studio-editor-v27 .au-studio-native-editor{max-height:none;overflow-x:hidden;overflow-y:visible;min-width:0;width:100%;padding:16px;border-radius:12px;background:#202124;color:#f5f5f5;color-scheme:dark;--primary-text-color:#f5f5f5;--secondary-text-color:#c4c6c9;--primary-background-color:#202124;--secondary-background-color:#303134;--card-background-color:#202124;--ha-card-background:#202124;--divider-color:#505155;--mdc-theme-surface:#202124;--mdc-theme-on-surface:#f5f5f5;--mdc-theme-primary:#d7b584;--mdc-text-field-fill-color:#303134;--mdc-text-field-ink-color:#f5f5f5}
      .au-studio-editor-v27 .au-studio-native-editor>*{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
      .au-studio-editor-v27 .au-studio-preview-host{min-height:110px;overflow-x:hidden}
      .au-studio-editor-v27 .au-studio-preview-host>*{max-width:100%;min-width:0}
      .au-studio-editor-v27 .au-studio-catalog{grid-template-columns:repeat(auto-fit,minmax(min(100%,165px),1fr))}
      .au-studio-editor-v27 .au-studio-actions{position:sticky;bottom:0;z-index:3;padding:12px 0 4px;background:var(--au-card);justify-content:flex-end}
      .au-studio-editor-v27 .au-studio-actions button{white-space:normal;line-height:1.4;min-height:42px}
      .au-studio-editor-v27 label,.au-studio-editor-v27 p,.au-studio-editor-v27 h4{overflow-wrap:anywhere;line-height:1.5}
      @container (min-width:1150px){.au-studio-editor-v27 .au-studio-workspace{grid-template-columns:minmax(540px,1.15fr) minmax(340px,.85fr)}}
      @container (max-width:600px){.au-studio-editor-v27 .au-studio-form-column,.au-studio-editor-v27 .au-studio-preview-column{padding:10px}.au-studio-editor-v27 .au-studio-native-editor{padding:10px}.au-studio-editor-v27 .au-studio-catalog{grid-template-columns:repeat(auto-fit,minmax(min(100%,135px),1fr))}}
      @container (max-width:380px){.au-studio-editor-v27 .au-studio-catalog{grid-template-columns:repeat(2,minmax(0,1fr))}.au-studio-editor-v27 .au-studio-actions{position:static}}
      `;
      filterStyle.textContent += `.au-floor-native-editor{display:inline-flex;align-items:center;justify-content:center;margin:12px 0 18px;padding:11px 16px;border-radius:10px;background:var(--au-accent);color:var(--au-bg);font-weight:700;text-decoration:none}.au-floor-native-editor:focus-visible{outline:3px solid var(--au-text);outline-offset:3px}`;
      filterStyle.textContent += `main>header[hidden]{display:none}@media(max-width:650px){.wrap:has(main[data-au-page="devices"])>nav{position:fixed;bottom:0;left:0;width:100%;z-index:30;background:var(--au-nav)}.wrap:has(main[data-au-page="devices"])>main{padding-bottom:90px}.wrap:has(main[data-au-page="devices"])>nav .au-nav-button.active{display:flex}}@media(min-width:701px){.wrap:has(main[data-au-page="devices"]){grid-template-columns:84px minmax(0,1fr)}.wrap:has(main[data-au-page="devices"])>nav .au-nav-label,.wrap:has(main[data-au-page="devices"])>nav .au-wordmark,.wrap:has(main[data-au-page="devices"])>nav .au-rail-foot,.wrap:has(main[data-au-page="devices"])>nav .au-rail-person{display:none}.wrap:has(main[data-au-page="devices"])>nav{padding:18px 10px}.wrap:has(main[data-au-page="devices"])>nav .au-logo-mark{width:45px}.wrap:has(main[data-au-page="devices"])>nav .au-nav-button{justify-content:center}}.au-floor.au-floor-studio{margin-top:0}.au-floor-studio-host{position:relative;min-width:0;height:var(--aureon-floor-height);min-height:360px;border:1px solid var(--au-border);border-radius:16px;overflow:hidden;background:var(--au-surface)}.au-floor-studio-host>neonplan3d-panel{display:block;width:100%;--aureon-floor-height:100%;--aureon-floor-radius:16px}.au-floor-studio{--aureon-floor-height:max(440px,calc(100vh - var(--header-height,56px) - var(--aureon-floor-chrome,128px)))}@supports(height:100dvh){.au-floor-studio{--aureon-floor-height:max(440px,calc(100dvh - var(--header-height,56px) - var(--aureon-floor-chrome,128px)))}}.au-floor-warning{margin:0 0 10px;padding:10px 14px;border-radius:12px;border:1px solid #d9a441;background:rgba(217,164,65,.14);color:var(--au-text);font-size:13px;line-height:1.45}.au-floor [hidden]{display:none!important}`;
      filterStyle.textContent += `.au-neonplan-host{min-height:420px;min-width:0;overflow:hidden}.au-neonplan-host>*{display:block;width:100%;max-width:100%}.au-floor{margin-top:24px}.au-floor-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr);gap:16px;margin-top:16px}.au-floor-map{position:relative;aspect-ratio:1.3;background:var(--au-surface);border:2px solid var(--au-accent);border-radius:12px;overflow:hidden;min-height:280px}.au-floor-room{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;overflow:hidden;padding:4px;border:1px solid var(--au-border);border-radius:6px;background:var(--au-card);font-size:clamp(9px,1.2vw,13px)}.au-floor-room strong,.au-floor-room span{max-width:100%;overflow:hidden;text-overflow:ellipsis}.au-floor-room span{font-size:10px;opacity:.75}.au-floor-room.is-on{border-color:var(--au-accent);box-shadow:inset 0 0 16px var(--au-hover)}.au-floor-form{display:grid;align-content:start;gap:12px;padding:16px;background:var(--au-surface);border:1px solid var(--au-border);border-radius:12px}.au-floor-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.au-floor-form label{display:grid;gap:5px;font-size:12px}.au-floor-form input,.au-floor-form select{width:100%;min-width:0;padding:9px;border-radius:7px;background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border)}@media(max-width:850px){.au-floor-layout{grid-template-columns:minmax(0,1fr)}}`;
      root.append(filterStyle);
      for (const [key,value] of Object.entries(themeTokens(this._theme,this._hass))) this.style.setProperty(key,value);
      if(globalThis.aureonAssetUrl)this.style.setProperty('--au-ambient-image',`url("${globalThis.aureonAssetUrl('botanical-background.webp')}")`);
      root.append(style);
      const make = (tag, className, text) => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
      };
      // Keep navigation outside the page's scrolling region, including HA cards whose ancestors
      // establish a containing block for position:fixed. The shell itself fits below the HA header.
      filterStyle.textContent += `.wrap.wrap{height:var(--aureon-shell-height,var(--aureon-available-height,calc(100dvh - var(--header-height,56px) - 16px)));min-height:0;grid-template-rows:minmax(0,1fr);overflow:hidden}.wrap>main{min-height:0;overflow:auto;overscroll-behavior-y:contain;scrollbar-gutter:stable}.wrap>nav{min-height:0;max-height:100%;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin}.wrap>nav>*{flex-shrink:0}@supports not(height:100dvh){.wrap.wrap{height:var(--aureon-shell-height,var(--aureon-available-height,calc(100vh - var(--header-height,56px) - 16px)))}}@media(max-width:650px){.wrap.wrap{grid-template-rows:minmax(0,1fr) auto}.wrap.wrap>nav{position:relative!important;bottom:auto!important;left:auto!important;width:auto!important;height:auto;max-height:none;overflow:visible;z-index:30;background:var(--au-nav)}.wrap.wrap>main{padding-bottom:18px!important}.wrap>nav .au-rail-foot,.wrap>nav .au-rail-person{display:none!important}}@media(min-width:651px) and (max-height:750px){.wrap>nav{padding-top:10px!important;padding-bottom:10px!important;gap:3px!important}.wrap>nav .logo{margin:0 0 8px!important}.wrap>nav .au-logo-mark{height:34px!important;width:32px!important}.wrap>nav .au-wordmark,.wrap>nav .au-rail-foot{display:none!important}.wrap>nav .au-nav-button{min-height:38px!important;padding-top:6px!important;padding-bottom:6px!important}}`;
      filterStyle.textContent += `@media(max-width:650px){.wrap.wrap>nav .au-nav-secondary{display:none!important}.wrap.wrap>nav .au-nav-button,.wrap.wrap>nav .au-nav-more{min-height:48px;padding:5px 3px;gap:4px}.wrap>nav .au-nav-label{font-size:10px}.wrap>nav .au-nav-button svg,.wrap>nav .au-nav-more svg{width:20px;height:20px}.au-more-sheet{position:fixed;inset:auto 10px max(10px,env(safe-area-inset-bottom));margin:0;width:calc(100% - 20px);max-height:calc(100dvh - 84px);height:fit-content;overflow:auto;padding:18px;border-radius:24px;background:linear-gradient(145deg,var(--au-card),var(--au-bg));box-shadow:0 20px 80px #0007}.au-more-sheet::backdrop{background:#10091099;backdrop-filter:blur(10px)}.au-more-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.au-more-heading h2{font:26px Georgia,serif;margin:0}.au-more-close{display:grid;place-items:center;width:34px;height:34px;min-height:34px;margin:0;padding:0;border-radius:50%;font:24px system-ui;background:var(--au-hover)}.au-more-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.au-more-item{display:flex;align-items:center;justify-items:start;gap:10px;min-height:54px;padding:12px;border-radius:12px;font-size:12px;text-align:left;background:color-mix(in srgb,var(--au-card) 72%,transparent)}.au-more-item svg{width:20px;height:20px;flex:none;color:var(--au-accent)}.au-more-item span{text-align:left;font-size:12px;line-height:1.35}.au-more-item:focus-visible{outline-width:2px;outline-offset:1px}}`;
      filterStyle.textContent += `.wrap>main[data-au-page="settings"]>header .muted{display:none}.wrap>main[data-au-page="settings"]>header{padding-bottom:16px}.wrap>main[data-au-page="settings"]>header h1{font-size:30px;margin:4px 0}@media(max-width:650px){.wrap>main[data-au-page="settings"]{padding:20px 14px 18px}.wrap>main[data-au-page="settings"]>header h1{font-size:28px}}`;
      filterStyle.textContent += `.au-more-item[aria-current="page"]{border-color:var(--au-accent);background:color-mix(in srgb,var(--au-accent) 9%,var(--au-card))}`;
      const wrap = make('div', 'wrap'+(this._page==='Início'||this._page==='Medien'?' au-home':'')+(this._page==='Medien'?' au-media':''));
      const nav = make('nav');
      nav.setAttribute('aria-label', 'AUREON navigation');
      {const logo=make('div','logo');const asset=globalThis.aureonAssetUrl;if(asset){const img=make('img','au-logo-mark');img.src=asset('logo.svg');img.alt='';logo.append(img);}else logo.textContent='A✦';logo.append(make('span','au-wordmark','AUREON'));nav.append(logo);}
      for (const [icon, name] of PAGES) {
        const primary=['Início','Geräte','Medien'].includes(name);
        const button = make('button', 'au-nav-button' + (name === this._page ? ' active' : '') + (primary ? ' au-nav-primary' : ' au-nav-secondary'));
        button.append(aureonNavIcon(name));
        button.type = 'button';
        const Page=customElements.get('aureon-platform');
        const pageLabel=Page?.labels?.(this._platformController?.language||this._hass?.locale?.language||this._hass?.language||'en')?.[Page?.routeNames?.[name]]||name;
        button.title = pageLabel;
        button.setAttribute('aria-label', pageLabel);
        if (name === this._page) button.setAttribute('aria-current', 'page');
        button.append(make('span','au-nav-label',pageLabel));
        button.addEventListener('click', () => this._navigate(name));
        nav.append(button);
      }
      // Phones: four primary destinations plus "More" for the rest (sheet with every remaining page).
      {
        const Page=customElements.get('aureon-platform'),lang=this._platformController?.language||this._hass?.locale?.language||this._hass?.language||'en',labels=Page?.labels?.(lang)||{};
        const more=make('button','au-nav-more');more.type='button';more.classList.toggle('active',!['Início','Geräte','Medien'].includes(this._page));more.setAttribute('aria-expanded','false');more.setAttribute('aria-haspopup','dialog');more.setAttribute('aria-label',labels.navMore||'More');
        const dots=document.createElementNS('http://www.w3.org/2000/svg','svg');dots.setAttribute('viewBox','0 0 24 24');dots.setAttribute('width','21');dots.setAttribute('height','21');dots.setAttribute('aria-hidden','true');dots.innerHTML='<path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/>';
        more.append(dots,make('span','au-nav-label',labels.navMore||'More'));
        const sheet=make('dialog','au-more-sheet');sheet.setAttribute('aria-label',labels.navMore||'More');
        const grid=make('div','au-more-grid');
        for(const [,name] of PAGES){if(['Início','Geräte','Medien'].includes(name))continue;const label=labels[Page?.routeNames?.[name]]||name;const item=make('button','au-more-item');item.type='button';item.dataset.route=name;if(name===this._page)item.setAttribute('aria-current','page');item.append(aureonNavIcon(name),make('span','',label));item.addEventListener('click',()=>{sheet.close();this._navigate(name);});grid.append(item);}
        const close=make('button','au-more-close','×');close.setAttribute('aria-label',labels.close||'Close');close.type='button';close.addEventListener('click',()=>sheet.close());
        const heading=make('div','au-more-heading');heading.append(make('h2','',labels.navMore||'More'),close);sheet.append(heading,grid);sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.close();});
        more.addEventListener('click',()=>{sheet.showModal();more.setAttribute('aria-expanded','true');});sheet.addEventListener('close',()=>more.setAttribute('aria-expanded','false'));
        nav.append(more,sheet);
      }
      {const Page=customElements.get('aureon-platform'),labels=Page?.labels?.(this._platformController?.language||this._hass?.locale?.language||this._hass?.language||'en')||{};const foot=make('div','au-rail-foot');foot.append(make('span','','AUREON'),make('small','',labels.tagline2||''));nav.append(foot);}
      // Medien rail footer: the signed-in HA user's own person (never a fictitious one); omitted when no person is linked.
      {const h=this._hass,uid=h?.user?.id,person=uid?Object.values(h?.states||{}).find(st=>st.entity_id.startsWith('person.')&&st.attributes?.user_id===uid):null;
       if(person){const Page=customElements.get('aureon-platform'),labels=Page?.labels?.(this._platformController?.language||h?.locale?.language||h?.language||'en')||{};const box=make('div','au-rail-person');const pic=person.attributes.entity_picture;
        if(typeof pic==='string'&&pic.startsWith('/')&&!pic.startsWith('//')){const img=make('img');img.src=h.hassUrl?h.hassUrl(pic):pic;img.alt='';box.append(img);}else box.append(make('span','au-rail-initial',(person.attributes.friendly_name||'?').trim().charAt(0).toUpperCase()));
        const home=person.state==='home';box.classList.toggle('home',home);box.append(make('strong','',person.attributes.friendly_name||person.entity_id),make('small','',home?(labels.homeState||'Home'):(labels.away||person.state)));nav.append(box);}}
      const main = make('main');main.dataset.auPage=customElements.get('aureon-platform')?.routeNames?.[this._page]||'';
      const header = make('header');header.hidden=['Geräte','Planta'].includes(this._page);
      const heading = make('div');
      heading.append(make('div','small','AUREON / '+(this._page==='Einstellungen'?(customElements.get('aureon-platform')?.labels(this._platformController?.language)?.settings||'Settings').toUpperCase():'CONTROL CENTER')));
      const Page=customElements.get('aureon-platform');
      heading.append(make('h1','',Page?.labels?.(this._platformController?.language||this._hass?.locale?.language||this._hass?.language||'en')?.[Page?.routeNames?.[this._page]]||this._page));
      heading.append(make('div','muted',Page?.labels?.(this._platformController?.language||this._hass?.language||'en')?.tagline||''));
      header.append(heading);
      main.append(header);
      if(this._platformSection(main,make)){

        wrap.append(nav,main);root.append(wrap);return;
      }
      if (this._page === 'Início') {
        const hero = make('section','hero');
        hero.append(make('div','small','AUREON · SMART LIVING'));
        hero.append(make('h2','','Sua casa. Seu universo.'));
        hero.append(make('p','muted','Estratégia de dashboard instalada. Integrações reais serão adicionadas depois dos testes.'));
        main.append(hero);
        const overview=make('section','');
        overview.setAttribute('data-au-home-overview','');
        main.append(overview);
        overview.append(make('p','registry-note','Carregando pessoas e clima do Home Assistant…')); 
      }
      if (this._page === 'Início') this._musicSection(main,make,true);
      if (this._page === 'Medien') this._musicSection(main,make,false);
      if (this._page === 'Planta') this._floorSection(main,make);
      if (this._page === 'Räume') {
        const section = make('section','');
        if (this._registryLoading && !this._registry) section.append(make('p','registry-note','Carregando ambientes do Home Assistant…'));
        if (this._registryError) section.append(make('p','registry-note','Não foi possível ler os registros: ' + this._registryError));
        if (this._registry) {
          const info = this._registry;
          section.append(make('p','registry-note',`${info.areaCount} ambientes · ${info.deviceCount} dispositivos · ${info.visibleCount} entidades visíveis de ${info.entityCount} cadastradas · Somente leitura`));
          const grid = make('div','area-grid');
          for (const area of info.rows) {
            const tile = make('article','area-tile');
            tile.setAttribute('data-au-area',area.id);
            const live=make('p','',`${area.active} entidades com estado disponível`);
            live.setAttribute('data-au-area-available','');
            const open=make('button','filter-action','Ver dispositivos deste ambiente');
            open.type='button';
            open.setAttribute('aria-label',`Ver dispositivos de ${area.name}`);
            open.addEventListener('click',()=>this._openAreaDevices(area.id));
            const intelligence=make('p','', '');
            intelligence.setAttribute('data-au-room-intelligence','');
            tile.append(make('h3','',area.name),make('p','',`${area.devices} dispositivos · ${area.entities} entidades visíveis`),live,intelligence,open);
            try { this._updateRoomIntelligence(area.id,tile); }
            catch(error) { console.warn('[AUREON] Room intelligence failed',area.id,error); }
            grid.append(tile);
          }
          if (!info.rows.length) grid.append(make('p','registry-note','Nenhum ambiente cadastrado no Home Assistant.'));
          section.append(grid);
        }
        main.append(section);
      }
      if (this._page === 'Geräte') {
        const section=make('section');
        if (this._registryLoading && !this._registry) section.append(make('p','registry-note','Carregando entidades do Home Assistant…'));
        if (this._registryError) section.append(make('p','registry-note','Erro de leitura: '+this._registryError));
        if (this._registry) {
          const info=this._registry;
          section.append(make('p','registry-note',`${info.visibleCount} entidades visíveis de ${info.entityCount} cadastradas · ${info.areaCount} ambientes · ${info.deviceCount} dispositivos · Registro atualizado: ${this._registryUpdatedAt||'—'} · no_dboard tem prioridade`));
          const refresh=make('button','filter-action','↻ Atualizar registros');
          refresh.type='button';refresh.disabled=this._registryLoading;
          refresh.addEventListener('click',()=>this._loadRegistry(true));section.append(refresh);
          const controlNotice=make('p','registry-note',this._controlError);controlNotice.setAttribute('data-control-error','');section.append(controlNotice);
          const bar=make('div','filter-bar');
          const dropdown=(label,options,current,callback)=>{
            const select=make('select');select.setAttribute('aria-label',label);
            for(const [value,title] of options){const option=make('option','',title);option.value=value;select.append(option);}
            select.value=current;
            select.addEventListener('change',()=>callback(select.value));
            return select;
          };
          const change=(field,value)=>{this[field]=value;this._deviceLimit=80;this._render();};
          const areas=[['all','Todos os ambientes'],...info.rows.map(a=>[a.id,a.name]),['unassigned','Sem ambiente']];
          bar.append(dropdown('Ambiente',areas,this._deviceArea,v=>change('_deviceArea',v)));
          const domains=[...new Set(info.entityRows.map(e=>e.domain))].sort();
          bar.append(dropdown('Domínio',[['all','Todos os tipos'],...domains.map(d=>[d,d])],this._deviceDomain,v=>change('_deviceDomain',v)));
          const classes=[...new Set(info.entityRows.map(e=>e.deviceClass).filter(Boolean))].sort();
          bar.append(dropdown('Classe de dispositivo',[['all','Todas as classes'],...classes.map(c=>[c,c])],this._deviceClass,v=>change('_deviceClass',v)));
          bar.append(dropdown('Label',[['all','Todas as labels'],...(info.allLabels||[]).map(l=>[l.id,l.name])],this._deviceLabel,v=>change('_deviceLabel',v)));
          bar.append(dropdown('Disponibilidade',[['all','Todos os estados'],['available','Disponíveis'],['unavailable','Indisponíveis ou sem estado']],this._deviceAvailability,v=>change('_deviceAvailability',v)));
          bar.append(dropdown('Organização',[['device','Agrupar por dispositivo'],['entity','Listar entidades']],this._deviceGroup,v=>change('_deviceGroup',v)));
          const search=make('input');search.type='search';search.placeholder='Buscar nome, ID ou dispositivo';
          search.value=this._deviceSearch;search.setAttribute('aria-label','Buscar dispositivos e entidades');
          search.addEventListener('change',()=>change('_deviceSearch',search.value.trim()));bar.append(search);
          const checkLabel=make('label','filter-check');const checkbox=make('input');checkbox.type='checkbox';checkbox.checked=this._deviceShowOnly;
          checkbox.addEventListener('change',()=>change('_deviceShowOnly',checkbox.checked));
          checkLabel.append(checkbox,document.createTextNode('Somente show_dboard'));bar.append(checkLabel);
          section.append(bar);
          const query=this._deviceSearch.toLocaleLowerCase();
          const filtered=info.entityRows.filter(e=>
            (this._deviceArea==='all'||(this._deviceArea==='unassigned'?!e.areaId:e.areaId===this._deviceArea))&&
            (this._deviceDomain==='all'||e.domain===this._deviceDomain)&&
            (this._deviceClass==='all'||e.deviceClass===this._deviceClass)&&
            (this._deviceLabel==='all'||e.labels.includes(this._deviceLabel))&&
            (this._deviceAvailability==='all'||(this._deviceAvailability==='available'?e.available:!e.available))&&
            (!this._deviceShowOnly||e.shown)&&
            (!query||[e.id,e.name,e.device,e.domain,e.areaName,e.deviceClass,e.source].some(v=>String(v).toLocaleLowerCase().includes(query)))
          );
          const results=make('div','device-results');
          const renderEntity=e=>{
            const el=make('div','device-entity');
            el.append(make('strong','',e.name),make('small','',e.id));
            const state=make('div','device-state',`${e.state}${e.unit?' '+e.unit:''}`);
            state.setAttribute('data-aureon-entity',e.id);el.append(state);
            if (e.domain === 'light' || e.domain === 'switch') {
              const control=this._makeAureonControl(e);this._setControlAvailability(control,e.id);el.append(control);
            } else if(e.domain === 'climate') {
              const control=this._makeAureonClimateControl(e);this._setControlAvailability(control,e.id);el.append(control);
            } else if(e.domain === 'cover') {
              const control=this._makeAureonCoverControl(e);this._setControlAvailability(control,e.id);el.append(control);
            } else if(e.domain === 'sensor' || e.domain === 'binary_sensor') {
              el.append(this._makeAureonSensorControl(e));
            } else {
              const generic=make('div','au-generic');
              generic.setAttribute('data-au-generic',e.id);
              const current=this._hass?.states?.[e.id];
              const details=[e.domain,e.deviceClass,e.source].filter(Boolean).join(' · ');
              generic.append(make('small','',details),make('div','au-generic-value',current?.state??'Sem estado'));
              const attributes=make('small','',this._entitySummary(current));attributes.setAttribute('data-au-generic-summary','');generic.append(attributes);
              el.append(generic);
              const universal=this._makeAureonUniversalControl(e);
              if(universal)el.append(universal);
            }
            return el;
          };
          if(this._deviceGroup==='device'){
            const groups=new Map();
            for(const e of filtered){const key=e.deviceId||'entity:'+e.id;
              if(!groups.has(key))groups.set(key,{key,name:e.deviceId?e.device:e.name,area:e.areaName,entities:[]});
              groups.get(key).entities.push(e);
            }
            const ordered=[...groups.values()].sort((a,b)=>a.area.localeCompare(b.area)||a.name.localeCompare(b.name));
            section.append(make('p','registry-note',`${ordered.length} dispositivos/grupos · ${filtered.length} entidades · Exibindo até ${this._deviceLimit} grupos`));
            for(const g of ordered.slice(0,this._deviceLimit)){
              const details=make('details','device-group');details.open=this._expandedDevices.has(g.key);
              const summary=make('summary','',g.name);summary.append(make('small','',`${g.area} · ${g.entities.length} entidades`));details.append(summary);
              const items=make('div','device-entities');for(const e of g.entities)items.append(renderEntity(e));details.append(items);
              details.addEventListener('toggle',()=>{if(details.open)this._expandedDevices.add(g.key);else this._expandedDevices.delete(g.key);});
              results.append(details);
            }
            if(ordered.length>this._deviceLimit){const more=make('button','filter-action','Mostrar mais grupos');more.addEventListener('click',()=>{this._deviceLimit+=80;this._render();});section.append(more);}
          }else{
            section.append(make('p','registry-note',`${filtered.length} entidades · Exibindo até ${this._deviceLimit}`));
            for(const e of filtered.slice(0,this._deviceLimit)){
              const item=make('article','device-group');item.append(renderEntity(e),make('small','',`${e.areaName} · ${e.device}${e.shown?' · show_dboard':''}`));results.append(item);
            }
            if(filtered.length>this._deviceLimit){const more=make('button','filter-action','Mostrar mais entidades');more.addEventListener('click',()=>{this._deviceLimit+=80;this._render();});section.append(more);}
          }
          if(!filtered.length)results.append(make('p','device-empty registry-note','Nenhum resultado para estes filtros.'));
          section.append(results);
        }
        main.append(section);
      }
      if(this._page==='Início') this._studioSection(main);
      const cards = make('div','cards');
      const filtered = MODULES.filter(x => this._page === 'Início' || (!['Räume','Medien'].includes(this._page) && x[2] === this._page));
      for (const [icon, name, , description] of filtered) {
        const card = make('article','card');
        card.append(make('div','symbol',icon),make('h3','',name),make('p','muted',description),make('div','state','EM PREPARAÇÃO'));
        cards.append(card);
      }
      if (!filtered.length && !['Räume','Einstellungen','Medien'].includes(this._page)) cards.append(make('p','muted','Módulo em preparação.'));
      if (this._page === 'Einstellungen') {
        const settings=make('section','theme-settings');
        settings.append(make('h2','','AUREON · Design System'));
        const modeLabel=make('label','','Modo de aparência');
        const modeSelect=make('select');
        for (const [value,label] of [['auto','Automático · Home Assistant'],['dark','Escuro'],['light','Claro'],['custom','Personalizado']]) {
          const opt=make('option','',label); opt.value=value; opt.selected=(this._theme.mode||'auto')===value; modeSelect.append(opt);
        }
        modeSelect.addEventListener('change',()=>{this._theme.mode=modeSelect.value;storeTheme(this._theme);this._render();});
        const paletteLabel=make('label','','Paleta de cores');
        const paletteSelect=make('select');
        for (const [value,palette] of Object.entries(PALETTES)) {
          const opt=make('option','',palette.name);opt.value=value;opt.selected=(this._theme.palette||DEFAULT_THEME)===value;paletteSelect.append(opt);
        }
        paletteSelect.addEventListener('change',()=>{this._theme.palette=paletteSelect.value;storeTheme(this._theme);this._render();});
        settings.append(modeLabel,modeSelect,paletteLabel,paletteSelect,make('p','','Automático usa as cores do tema ativo do Home Assistant. Escuro aplica Forest Luxe · Botanical; Claro aplica Sage Residence. Personalizado aplica a paleta escolhida. As preferências ficam salvas apenas neste navegador.'));
        settings.append(make('p','',`Diagnóstico de atualização: versão ${VERSION} | build ${BUILD_ID}. Este código confirma qual arquivo foi realmente carregado pelo navegador; não altera o cache do HACS.`));
        main.append(settings);
      }
      main.append(cards, make('div','foot',`AUREON v${VERSION} · Build ${BUILD_ID} · descoberta e filtros · ações por capacidades`));
      wrap.append(nav, main);
      root.append(wrap);
      this._studioMount().catch(error=>console.warn('[AUREON] Card Studio mount failed',error));
      // Render only AFTER mounting. Otherwise querySelector cannot find the overview.
      if (this._page === 'Início' && this._registry) {
        try { this._updateHomeOverview(); }
        catch(error) { console.error('[AUREON] Home overview render failed',error); }
      }
    }
  }
  if (!customElements.get('aureon-dashboard')) customElements.define('aureon-dashboard', AureonDashboard);
  class AureonDashboardStrategy extends HTMLElement {
    static getCreateSuggestions() { return { title: 'AUREON', icon: 'mdi:home-assistant' }; }
    static async generate(_config, _hass) {
      return {
        title: 'AUREON',
        views: [{
          title: 'AUREON', path: 'home', icon: 'mdi:home-assistant',
          type: 'panel', cards: [{ type: 'custom:aureon-dashboard' }]
        }]
      };
    }
  }
  if (!customElements.get('ll-strategy-aureon-dashboard')) {
    customElements.define('ll-strategy-aureon-dashboard', AureonDashboardStrategy);
  }
  window.customStrategies = window.customStrategies || [];
  if (!window.customStrategies.some(x => x.type === 'aureon-dashboard' && x.strategyType === 'dashboard')) {
    window.customStrategies.push({
      type: 'aureon-dashboard', strategyType: 'dashboard',
      name: 'AUREON Dashboard',
      description: 'Premium Smart Home Dashboard mit 3D Floor Studio, JARVIS und intelligenter Steuerung.',
      documentationURL: 'https://github.com/thaianyboas/aureon-dashboard'
    });
  }
  window.customCards = window.customCards || [];
  if (!window.customCards.some(x => x.type === 'aureon-dashboard')) {
    window.customCards.push({ type: 'aureon-dashboard', name: 'AUREON Dashboard', description: 'AUREON foundation preview' });
  }
  window.AUREON_BUILD_INFO = Object.freeze({version: VERSION, build: BUILD_ID, file: 'aureon-dashboard.js'});
  console.info(`[AUREON] v${VERSION} | ${BUILD_ID} | arquivo carregado`);
})();
