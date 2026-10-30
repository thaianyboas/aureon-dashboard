/* AUREON v0.2 — original dashboard strategy foundation; no external requests. */
(() => {
  'use strict';
  const VERSION = '0.17.0';
  const BUILD_ID = 'AUREON-017-20261030-HOME-PERSONS-WEATHER';
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
    }
    setConfig(config) {
      if (config && config.type && config.type !== 'custom:aureon-dashboard') {
        throw new Error('Tipo de cartão AUREON inválido');
      }
      this._configured = true;
      this._render();
      if (this._hass?.callWS && !this._registry && !this._registryPromise) this._loadRegistry();
    }
    set hass(value) {
      const oldMode=this._hass?.themes?.darkMode;
      this._hass=value;
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
      }
      if (this._configured && this._page === 'Início' && this._registry && value?.states) {
        const tracked = this._registry.entityRows.filter(r=>r.domain==='person'||r.domain==='weather');
        const signature = tracked.map(r=>{
          const st=value.states[r.id];
          return [r.id,st?.state,st?.attributes?.temperature,st?.attributes?.humidity].join(':');
        }).join('|');
        if (signature !== this._homeStateSignature) {
          this._homeStateSignature=signature;
          this._updateHomeOverview();
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
    _homeOverviewData() {
      const rows=this._registry?.entityRows||[];
      const states=this._hass?.states||{};
      const persons=rows.filter(r=>r.domain==='person'&&states[r.id])
        .map(r=>({id:r.id,name:states[r.id].attributes?.friendly_name||r.name,state:states[r.id].state,
          picture:states[r.id].attributes?.entity_picture||'',source:r.source}))
        .sort((a,b)=>a.name.localeCompare(b.name));
      const weather=rows.filter(r=>r.domain==='weather'&&states[r.id])
        .map(r=>({id:r.id,name:r.name,state:states[r.id].state,
          temperature:states[r.id].attributes?.temperature,
          humidity:states[r.id].attributes?.humidity,
          temperatureUnit:states[r.id].attributes?.temperature_unit||this._hass?.config?.unit_system?.temperature||'°C'}));
      return {persons,weather};
    }
    _updateHomeOverview() {
      const target=this.shadowRoot?.querySelector('[data-au-home-overview]');
      if (!target || !this._registry) return;
      target.replaceChildren();
      const {persons,weather}=this._homeOverviewData();
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
        if(person.picture && (person.picture.startsWith("/") || person.picture.startsWith("https://") || person.picture.startsWith("http://"))){
          const img=make('img');img.src=person.picture;img.alt='';img.loading='lazy';
          img.style.cssText='width:48px;height:48px;border-radius:50%;object-fit:cover';
          card.prepend(img);
        }
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
        if (!state) continue;
        const busy=this._controlBusy.has(id);
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
          control.querySelectorAll('button,input').forEach(el=>{el.disabled=busy||state.state==='unavailable';});
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
    async _aureonService(entityId, service, data={}) {
      if(this._controlBusy.has(entityId)) return;
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
    getCardSize() { return 9; }
    static getStubConfig() { return { type: 'custom:aureon-dashboard' }; }
    _render() {
      if (!this._configured) return;
      const root = this.shadowRoot;
      root.replaceChildren();
      const style = document.createElement('style');
      style.textContent = `:host{display:block;color:var(--au-text);font-family:var(--paper-font-body1_-_font-family,Inter,system-ui,sans-serif)}*{box-sizing:border-box}.wrap{background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border);border-radius:22px;overflow:hidden;min-height:max(600px, calc(100vh - 64px));min-height:max(600px, calc(100dvh - 64px));display:grid;grid-template-columns:76px minmax(0,1fr)}nav{padding:18px 9px;background:var(--au-nav);border-right:1px solid var(--au-border);display:flex;flex-direction:column;gap:6px}.logo{color:var(--au-accent);font-size:29px;text-align:center;font-weight:800;margin:6px 0 22px}button{background:transparent;color:var(--au-text);border:0;border-radius:12px;cursor:pointer;padding:11px 3px;font:inherit;font-size:20px}button:hover,button.active{background:var(--au-hover);color:var(--au-accent)}button:focus-visible,select:focus-visible{outline:2px solid var(--au-accent);outline-offset:2px}main{min-width:0;padding:30px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--au-border);padding-bottom:22px}h1{font-size:29px;margin:4px 0;letter-spacing:-1px}.small{color:var(--au-accent);font-size:10px;letter-spacing:2px;font-weight:700}.muted{color:var(--au-muted);font-size:12px;line-height:1.6}.demo{color:var(--au-accent);font-size:10px;border:1px solid var(--au-border);border-radius:20px;padding:9px 12px;white-space:nowrap}.hero{border:1px solid var(--au-border);border-radius:18px;padding:35px;margin-top:24px;background:var(--au-surface);color:var(--au-surface-text);min-height:180px}.hero h2{font-size:clamp(22px,3vw,38px);margin:10px 0;letter-spacing:-1px}.hero .muted{color:inherit;opacity:.8}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:22px}.card{background:var(--au-card);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:16px;padding:18px;min-height:152px}.card .muted{color:inherit;opacity:.8}.symbol{color:var(--au-accent);font-size:27px}.card h3{font-size:14px;margin:13px 0 5px}.state{color:var(--au-accent);font-size:9px;letter-spacing:1px;margin-top:15px}.foot{color:var(--au-muted);font-size:10px;margin-top:25px}.theme-settings{margin-top:24px;padding:22px;border:1px solid var(--au-border);border-radius:16px;background:var(--au-surface);color:var(--au-surface-text)}.theme-settings h2{margin:0 0 12px;font-size:20px}.theme-settings label{display:block;font-size:13px;margin:12px 0 5px}.theme-settings select{width:100%;max-width:360px;padding:10px;border-radius:10px;background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border)}.theme-settings p{font-size:12px;opacity:.85}.area-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:22px}.area-tile{border:1px solid var(--au-border);border-radius:16px;padding:18px;background:var(--au-surface);color:var(--au-surface-text)}.area-tile h3{font-size:16px;margin:0 0 12px}.area-tile p{font-size:12px;opacity:.85}.registry-note{margin-top:18px;font-size:12px;color:var(--au-muted)}.device-tools{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.device-tools input,.device-tools select{background:var(--au-surface);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:10px;padding:11px;min-width:180px;max-width:100%}.device-tools input{flex:1}.device-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:16px}.device-item{padding:14px;border:1px solid var(--au-border);background:var(--au-surface);color:var(--au-surface-text);border-radius:12px;min-width:0}.device-item strong{display:block;font-size:13px;overflow-wrap:anywhere}.device-item small{display:block;opacity:.75;margin-top:5px;overflow-wrap:anywhere}.device-state{color:var(--au-accent);margin-top:9px;font-size:12px;overflow-wrap:anywhere}@media(max-width:650px){.wrap{grid-template-columns:54px minmax(0,1fr)}nav{padding:10px 4px}.logo{font-size:23px}button{font-size:18px}main{padding:15px}h1{font-size:23px}.demo{display:none}.hero{padding:22px}}`;
      const filterStyle=document.createElement('style');
      filterStyle.textContent=`.filter-bar{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.filter-bar select,.filter-bar input{flex:1 1 170px;min-width:0;max-width:none}.device-results{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin-top:12px}.device-group{border:1px solid var(--au-border);border-radius:14px;background:var(--au-card);color:var(--au-surface-text);padding:14px;min-width:0}.device-group summary{cursor:pointer;font-weight:650;line-height:1.5;overflow-wrap:anywhere}.device-group small{display:block;font-size:11px;opacity:.75;margin:5px 0}.device-entities{display:grid;gap:8px;margin-top:12px}.device-entity{border-top:1px solid var(--au-border);padding-top:8px;overflow-wrap:anywhere}.device-entity strong{display:block;font-size:12px}.device-entity small{font-size:10px}.device-entity .device-state{margin-top:4px}.filter-check{display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap}.filter-check input{flex:none}.filter-action{font-size:12px;padding:10px 12px;border:1px solid var(--au-border);background:var(--au-card);color:var(--au-surface-text)}.filter-action:hover{color:var(--au-accent)}.au-universal{display:flex;flex-wrap:wrap;gap:6px}.au-universal .au-control-label{width:100%}.au-universal input[type=range]{width:100%}.au-generic{margin-top:8px;padding:9px;border:1px solid var(--au-border);border-radius:9px;display:grid;gap:4px}.au-generic-value{font-size:13px;color:var(--au-accent)}.device-empty{grid-column:1/-1}.au-control{margin-top:10px;padding:10px;border:1px solid var(--au-border);border-radius:10px}.au-control-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.au-toggle{font-size:12px;padding:8px 12px;background:var(--au-hover);border:1px solid var(--au-border)}.au-toggle:disabled{opacity:.5;cursor:not-allowed}.au-control-label{display:flex;justify-content:space-between;align-items:center;font-size:12px;margin:10px 0 5px}.au-control input[type=range]{width:100%;accent-color:var(--au-accent)}.au-cover-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.au-climate-select,.au-control input[type=number]{background:var(--au-surface);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:8px;padding:8px;max-width:100%;margin:5px 6px 5px 0}.au-control input[type=color]{height:30px;width:52px;border:1px solid var(--au-border);background:transparent;border-radius:6px}`;
      filterStyle.textContent += `.au-sensor{display:grid;gap:5px}.au-sensor-value{font-size:15px;font-weight:650;overflow-wrap:anywhere}.au-sensor small{font-size:10px;opacity:.75}.au-sensor[data-au-sensor-kind=active] .au-sensor-value{color:var(--au-accent)}`;
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
        const button = make('button', name === this._page ? 'active' : '', icon);
        button.type = 'button';
        button.title = name;
        button.setAttribute('aria-label', name);
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
        if(this._registry)this._updateHomeOverview();
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
            tile.append(make('h3','',area.name),make('p','',`${area.devices} dispositivos · ${area.entities} entidades visíveis`),make('p','',`${area.active} entidades com estado disponível`));
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
              el.append(this._makeAureonControl(e));
            } else if(e.domain === 'climate') {
              el.append(this._makeAureonClimateControl(e));
            } else if(e.domain === 'cover') {
              el.append(this._makeAureonCoverControl(e));
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
