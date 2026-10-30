/* AUREON v0.2 — original dashboard strategy foundation; no external requests. */
(() => {
  'use strict';
  const VERSION = '0.27.0';
  const BUILD_ID = 'AUREON-0280-20261030-VISUAL-EDITOR-BRIDGE';
  // AUREON design tokens: single source of truth. Palettes are visual references, not copied logic.
  const PALETTES = {"black-gold-royal": {"name": "Black & Gold · Imperial", "accent": "#D9B76E", "background": "#050505", "surface": "#18140D", "text": "#E8C77D"}, "black-bordeaux-royal": {"name": "Black & Bordeaux · Prestige", "accent": "#C35B76", "background": "#050505", "surface": "#1B0D13", "text": "#E3A0B1"}, "purple": {"name": "Royal Purple", "accent": "#a477f5", "background": "#111019", "surface": "#282037", "text": "#f6f3fb"}, "blue": {"name": "Midnight Blue", "accent": "#559cff", "background": "#0c1628", "surface": "#1c304b", "text": "#f5f8ff"}, "emerald": {"name": "Emerald", "accent": "#43c6a0", "background": "#0c1b19", "surface": "#1c3530", "text": "#f2fff9"}, "burgundy": {"name": "Burgundy", "accent": "#ce6c90", "background": "#221219", "surface": "#3a222d", "text": "#fff4f7"}, "rose-noir": {"name": "Rose Noir", "accent": "#e3a04b", "background": "#190d17", "surface": "#301823", "text": "#fff1f4"}, "gold": {"name": "Champagne Gold", "accent": "#b8ab92", "background": "#1b1b1a", "surface": "#2c2b29", "text": "#fff9ed"}, "pearl": {"name": "Pearl White", "accent": "#7664a9", "background": "#f5f3f8", "surface": "#ffffff", "text": "#30283a"}, "obsidian": {"name": "Obsidian", "accent": "#b6b9c2", "background": "#101114", "surface": "#25272c", "text": "#f6f6f8"}, "sapphire": {"name": "Sapphire Night", "accent": "#70a9ed", "background": "#081425", "surface": "#162b43", "text": "#f1f7ff"}, "forest": {"name": "Forest Luxe", "accent": "#b2c79a", "background": "#101c18", "surface": "#24382d", "text": "#f5f7ef"}, "terracotta": {"name": "Terracotta Atelier", "accent": "#b85e48", "background": "#faf1e8", "surface": "#fffaf5", "text": "#322820"}, "sand": {"name": "Desert Sand", "accent": "#96734b", "background": "#f4e9d7", "surface": "#fff9ed", "text": "#312b22"}, "ocean": {"name": "Ocean Mist", "accent": "#277c8c", "background": "#e8f4f4", "surface": "#f9ffff", "text": "#18323b"}, "amethyst": {"name": "Amethyst Velvet", "accent": "#c2a1eb", "background": "#1b1429", "surface": "#322440", "text": "#faf3ff"}, "copper": {"name": "Copper Noir", "accent": "#d59a72", "background": "#171513", "surface": "#30251f", "text": "#fff4e9"}, "sage": {"name": "Sage Residence", "accent": "#657b57", "background": "#f0f2e9", "surface": "#fcfdf8", "text": "#283229"}, "arctic": {"name": "Arctic Silver", "accent": "#53778e", "background": "#edf2f6", "surface": "#ffffff", "text": "#1b2a36"}, "ruby": {"name": "Ruby Eclipse", "accent": "#ed8794", "background": "#200e18", "surface": "#3a202d", "text": "#fff4f7"}, "lavender": {"name": "Lavender Cloud", "accent": "#8068b0", "background": "#f3effa", "surface": "#ffffff", "text": "#2b2341"}, "graphite": {"name": "Graphite Studio", "accent": "#c6d0d9", "background": "#171b20", "surface": "#2b3038", "text": "#f6f8fb"}};
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
  function themeTokens(selection, hass) {
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
        '--au-hover':'var(--secondary-background-color, #ffffff17)'
      };
    }
    // Fixed modes must not retain a previously chosen custom palette.
    let colors = { ...PALETTES[mode === 'dark' ? 'forest' : mode === 'light' ? 'sage' : (PALETTES[selection.palette] ? selection.palette : DEFAULT_THEME)] };
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
      '--au-accent-text':accentFg, '--au-muted':isDark?'#c4d0c9':'#4b5751',
      '--au-border':isDark?'#ffffff25':'#00000022',
      '--au-nav':colors.background, '--au-card':colors.surface,
      '--au-hover':isDark?'#ffffff17':'#00000012'
    };
  }
  // Local vector icons: no CDN, no external card or HA icon registry dependency.
  const NAV_PATHS = {"Início": ["M3 10.5 12 3l9 7.5", "M5 9.5V21h14V9.5", "M9 21v-7h6v7"], "Räume": ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"], "Geräte": ["M4 7h16", "M7 4v6", "M4 17h16", "M17 14v6", "M12 4v16"], "Energie": ["M13 2 3 14h8l-1 8 11-12h-8z"], "Sicherheit": ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "m9 12 2 2 4-4"], "Kameras": ["M4 6h16v12H4z", "M8 6V4h8v2", "M8 18v2h8v-2", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"], "Medien": ["M9 18V5l12-2v13", "M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0z", "M21 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0z"], "JARVIS": ["M12 3a4 4 0 0 0-4 4 4 4 0 0 0-3 6 4 4 0 0 0 3 6 4 4 0 0 0 4 2", "M12 3a4 4 0 0 1 4 4 4 4 0 0 1 3 6 4 4 0 0 1-3 6 4 4 0 0 1-4 2", "M12 3v18", "M8 9l4 3 4-3", "M8 16l4-3 4 3"], "Agenda": ["M3 5h18v16H3z", "M7 3v4", "M17 3v4", "M3 10h18", "M7 14h3", "M14 14h3", "M7 18h3"], "Einstellungen": ["M12 3v2", "M12 19v2", "M3 12h2", "M19 12h2", "m5.6 5.6 1.4 1.4", "m17 17 1.4 1.4", "m18.4 5.6-1.4 1.4", "m7 17-1.4 1.4", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]};
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
    ['▤','Agenda'],['⚙','Einstellungen']
  ];
  const MODULES = [
    ['▱','Floor Studio 2D/3D','Räume','Integração 3D em preparação'],
    ['✧','JARVIS AI','JARVIS','IA e ferramentas protegidas em preparação'],
    ['♫','Music & SpotifyPlus','Medien','Player e temas compartilhados em preparação'],
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
    }
    setConfig(config) {
      if (config && config.type && config.type !== 'custom:aureon-dashboard') {
        throw new Error('Tipo de cartão AUREON inválido');
      }
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
      this._hass=value;
      const studioKey=this._studioStorageKey();
      if(this._studioLoadedKey!==studioKey){this._studioLoadedKey=studioKey;this._studioCards=this._studioRead();if(this._configured&&this._page==='Início')this._render();}
      for (const card of this._studioRendered) { try { card.hass=value; } catch(error) { console.warn('[AUREON] Card state update failed',error); } }
      if (this._configured && oldMode !== value?.themes?.darkMode) this._render();
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
        const currentIds=Object.keys(value.states);
        const signature=currentIds.slice().sort().join('\n');
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
        const tracked = this._registry.entityRows.filter(r=>r.domain==='person'||r.domain==='weather');
        const signature = tracked.map(r=>{
          const st=value.states[r.id];
          return [r.id,st?.state,st?.attributes?.temperature,st?.attributes?.humidity,st?.attributes?.entity_picture].join(':');
        }).join('|')+'|'+this._registry.entityRows.filter(r=>r.domain==='sensor'&&r.deviceClass==='battery')
          .map(r=>r.id+':'+value.states[r.id]?.state).join('|');
        if (signature !== this._homeStateSignature) {
          this._homeStateSignature=signature;
          try { this._updateHomeOverview(); }
          catch(error) { console.error('[AUREON] Home overview refresh failed',error); }
        }
      }
      if (this._configured && value?.callWS && !this._registry && !this._registryPromise) this._loadRegistry();
    }
    async _loadRegistry(force = false) {
      if (!this._hass?.callWS || this._registryPromise) return;
      if (this._registry && !force) return;
      const hass = this._hass;
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
        const allLabels=[...labelNames.entries()].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name));
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
          if ([entity,device,area].some(item => hasLabel(item,'no_dboard'))) return false;
          return true;
        };
        const rows = areas.map(area => {
          const areaDevices = devices.filter(d => d.area_id === area.area_id);
          const areaEntities = entities.filter(e => getArea(e) === area.area_id && visible(e));
          return {id:area.area_id, name:area.name || area.area_id, icon:area.icon || '⌂', devices:areaDevices.length, entities:areaEntities.length, active:areaEntities.filter(e => hass.states?.[e.entity_id] && !['unavailable','unknown'].includes(hass.states[e.entity_id].state)).length};
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
      try { this._registry = await this._registryPromise; this._registryUpdatedAt=new Date().toLocaleTimeString(); this._lastRuntimeEntitySignature=Object.keys(this._hass?.states||{}).sort().join('\n'); }
      catch (err) { this._registryError = String(err?.message || err); }
      finally { this._registryLoading = false; this._registryPromise = null; if (this._configured) this._render(); }
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
        this._controlError=`Não foi possível controlar ${entityId}: ${String(err?.message||err)}`;
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
      const add=make('button','+ Adicionar cartão');add.type='button';add.addEventListener('click',()=>{this._studioEdit='new';this._render();});bar.append(add);section.append(bar);
      section.append(make('p','Catálogo dinâmico: cartões nativos + personalizados registrados no HA. Configurações ainda salvas apenas neste navegador e usuário.'));
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
    _render() {
      if (!this._configured) return;
      const root = this.shadowRoot;
      root.replaceChildren();
      const style = document.createElement('style');
      style.textContent = `nav .au-nav-button{display:flex;align-items:center;justify-content:center;width:100%;min-height:45px;padding:10px;border:1px solid transparent;border-radius:12px;transition:background-color .18s ease,color .18s ease,border-color .18s ease}nav .au-nav-button svg{display:block;flex:none}nav .au-nav-button.active{background:var(--au-hover);border-color:var(--au-border);color:var(--au-accent)}nav .au-nav-button:hover{background:var(--au-hover)}@media(prefers-reduced-motion:reduce){nav .au-nav-button{transition:none}}:host{display:block;color:var(--au-text);font-family:var(--paper-font-body1_-_font-family,Inter,system-ui,sans-serif)}*{box-sizing:border-box}.wrap{background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border);border-radius:22px;overflow:hidden;min-height:max(600px, calc(100vh - 64px));min-height:max(600px, calc(100dvh - 64px));display:grid;grid-template-columns:76px minmax(0,1fr)}nav{padding:18px 9px;background:var(--au-nav);border-right:1px solid var(--au-border);display:flex;flex-direction:column;gap:6px}.logo{color:var(--au-accent);font-size:29px;text-align:center;font-weight:800;margin:6px 0 22px}button{background:transparent;color:var(--au-text);border:0;border-radius:12px;cursor:pointer;padding:11px 3px;font:inherit;font-size:20px}button:hover,button.active{background:var(--au-hover);color:var(--au-accent)}button:focus-visible,select:focus-visible{outline:2px solid var(--au-accent);outline-offset:2px}main{min-width:0;padding:30px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--au-border);padding-bottom:22px}h1{font-size:29px;margin:4px 0;letter-spacing:-1px}.small{color:var(--au-accent);font-size:10px;letter-spacing:2px;font-weight:700}.muted{color:var(--au-muted);font-size:12px;line-height:1.6}.demo{color:var(--au-accent);font-size:10px;border:1px solid var(--au-border);border-radius:20px;padding:9px 12px;white-space:nowrap}.hero{border:1px solid var(--au-border);border-radius:18px;padding:35px;margin-top:24px;background:var(--au-surface);color:var(--au-surface-text);min-height:180px}.hero h2{font-size:clamp(22px,3vw,38px);margin:10px 0;letter-spacing:-1px}.hero .muted{color:inherit;opacity:.8}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:22px}.card{background:var(--au-card);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:16px;padding:18px;min-height:152px}.card .muted{color:inherit;opacity:.8}.symbol{color:var(--au-accent);font-size:27px}.card h3{font-size:14px;margin:13px 0 5px}.state{color:var(--au-accent);font-size:9px;letter-spacing:1px;margin-top:15px}.foot{color:var(--au-muted);font-size:10px;margin-top:25px}.theme-settings{margin-top:24px;padding:22px;border:1px solid var(--au-border);border-radius:16px;background:var(--au-surface);color:var(--au-surface-text)}.theme-settings h2{margin:0 0 12px;font-size:20px}.theme-settings label{display:block;font-size:13px;margin:12px 0 5px}.theme-settings select{width:100%;max-width:360px;padding:10px;border-radius:10px;background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border)}.theme-settings p{font-size:12px;opacity:.85}.area-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:22px}.area-tile{border:1px solid var(--au-border);border-radius:16px;padding:18px;background:var(--au-surface);color:var(--au-surface-text)}.area-tile h3{font-size:16px;margin:0 0 12px}.area-tile p{font-size:12px;opacity:.85}.registry-note{margin-top:18px;font-size:12px;color:var(--au-muted)}.device-tools{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.device-tools input,.device-tools select{background:var(--au-surface);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:10px;padding:11px;min-width:180px;max-width:100%}.device-tools input{flex:1}.device-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:16px}.device-item{padding:14px;border:1px solid var(--au-border);background:var(--au-surface);color:var(--au-surface-text);border-radius:12px;min-width:0}.device-item strong{display:block;font-size:13px;overflow-wrap:anywhere}.device-item small{display:block;opacity:.75;margin-top:5px;overflow-wrap:anywhere}.device-state{color:var(--au-accent);margin-top:9px;font-size:12px;overflow-wrap:anywhere}@media(max-width:650px){.wrap{grid-template-columns:54px minmax(0,1fr)}nav{padding:10px 4px}.logo{font-size:23px}button{font-size:18px}main{padding:15px}h1{font-size:23px}.demo{display:none}.hero{padding:22px}}`;
      const filterStyle=document.createElement('style');
      filterStyle.textContent=`.filter-bar{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.filter-bar select,.filter-bar input{flex:1 1 170px;min-width:0;max-width:none}.device-results{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin-top:12px}.device-group{border:1px solid var(--au-border);border-radius:14px;background:var(--au-card);color:var(--au-surface-text);padding:14px;min-width:0}.device-group summary{cursor:pointer;font-weight:650;line-height:1.5;overflow-wrap:anywhere}.device-group small{display:block;font-size:11px;opacity:.75;margin:5px 0}.device-entities{display:grid;gap:8px;margin-top:12px}.device-entity{border-top:1px solid var(--au-border);padding-top:8px;overflow-wrap:anywhere}.device-entity strong{display:block;font-size:12px}.device-entity small{font-size:10px}.device-entity .device-state{margin-top:4px}.filter-check{display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap}.filter-check input{flex:none}.filter-action{font-size:12px;padding:10px 12px;border:1px solid var(--au-border);background:var(--au-card);color:var(--au-surface-text)}.filter-action:hover{color:var(--au-accent)}.au-universal{display:flex;flex-wrap:wrap;gap:6px}.au-universal .au-control-label{width:100%}.au-universal input[type=range]{width:100%}.au-generic{margin-top:8px;padding:9px;border:1px solid var(--au-border);border-radius:9px;display:grid;gap:4px}.au-generic-value{font-size:13px;color:var(--au-accent)}.device-empty{grid-column:1/-1}.au-control{margin-top:10px;padding:10px;border:1px solid var(--au-border);border-radius:10px}.au-control-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.au-toggle{font-size:12px;padding:8px 12px;background:var(--au-hover);border:1px solid var(--au-border)}.au-toggle:disabled{opacity:.5;cursor:not-allowed}.au-control-label{display:flex;justify-content:space-between;align-items:center;font-size:12px;margin:10px 0 5px}.au-control input[type=range]{width:100%;accent-color:var(--au-accent)}.au-cover-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.au-climate-select,.au-control input[type=number]{background:var(--au-surface);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:8px;padding:8px;max-width:100%;margin:5px 6px 5px 0}.au-control input[type=color]{height:30px;width:52px;border:1px solid var(--au-border);background:transparent;border-radius:6px}`;
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
      root.append(filterStyle);
      for (const [key,value] of Object.entries(themeTokens(this._theme,this._hass))) this.style.setProperty(key,value);
      root.append(style);
      const make = (tag, className, text) => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
      };
      const wrap = make('div', 'wrap');
      const nav = make('nav');
      nav.setAttribute('aria-label', 'AUREON navigation');
      nav.append(make('div', 'logo', 'A✦'));
      for (const [icon, name] of PAGES) {
        const button = make('button', 'au-nav-button' + (name === this._page ? ' active' : ''));
        button.append(aureonNavIcon(name));
        button.type = 'button';
        button.title = name;
        button.setAttribute('aria-label', name);
        if (name === this._page) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => { this._page = name; this._render(); if (name === 'Räume' || name === 'Geräte') this._loadRegistry(true); });
        nav.append(button);
      }
      const main = make('main');
      const header = make('header');
      const heading = make('div');
      heading.append(make('div','small','AUREON / CONTROL CENTER'));
      heading.append(make('h1','',this._page === 'Início' ? 'Visão geral' : this._page));
      heading.append(make('div','muted','Seu ambiente, em perfeita harmonia.'));
      header.append(heading, make('div','demo','● DEMONSTRAÇÃO'));
      main.append(header);
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
      const filtered = MODULES.filter(x => this._page === 'Início' || (this._page !== 'Räume' && x[2] === this._page));
      for (const [icon, name, , description] of filtered) {
        const card = make('article','card');
        card.append(make('div','symbol',icon),make('h3','',name),make('p','muted',description),make('div','state','EM PREPARAÇÃO'));
        cards.append(card);
      }
      if (!filtered.length && this._page !== 'Räume' && this._page !== 'Einstellungen') cards.append(make('p','muted','Módulo em preparação.'));
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
        settings.append(modeLabel,modeSelect,paletteLabel,paletteSelect,make('p','','Automático usa as cores do tema ativo do Home Assistant. Escuro aplica Forest Luxe; Claro aplica Sage Residence. Personalizado aplica a paleta escolhida. As preferências ficam salvas apenas neste navegador.'));
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
