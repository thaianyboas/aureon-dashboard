/* AUREON v0.2 — original dashboard strategy foundation; no external requests. */
(() => {
  'use strict';
  const VERSION = '0.4.1';
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
        const deviceById = new Map(devices.map(d => [d.id, d]));
        const areaById = new Map(areas.map(a => [a.area_id, a]));
        const getArea = entity => {
          if (entity.area_id) return entity.area_id;
          let device = deviceById.get(entity.device_id);
          const visited = new Set();
          while (device && !visited.has(device.id)) {
            visited.add(device.id);
            if (device.area_id) return device.area_id;
            device = deviceById.get(device.via_device_id);
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
        return {rows, areaCount:areas.length, deviceCount:devices.length, entityCount:entities.length, visibleCount:entities.filter(visible).length};
      })();
      try { this._registry = await this._registryPromise; }
      catch (err) { this._registryError = String(err?.message || err); }
      finally { this._registryLoading = false; this._registryPromise = null; if (this._configured) this._render(); }
    }
    getCardSize() { return 9; }
    static getStubConfig() { return { type: 'custom:aureon-dashboard' }; }
    _render() {
      if (!this._configured) return;
      const root = this.shadowRoot;
      root.replaceChildren();
      const style = document.createElement('style');
      style.textContent = `:host{display:block;color:var(--au-text);font-family:var(--paper-font-body1_-_font-family,Inter,system-ui,sans-serif)}*{box-sizing:border-box}.wrap{background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border);border-radius:22px;overflow:hidden;min-height:max(600px, calc(100vh - 64px));min-height:max(600px, calc(100dvh - 64px));display:grid;grid-template-columns:76px minmax(0,1fr)}nav{padding:18px 9px;background:var(--au-nav);border-right:1px solid var(--au-border);display:flex;flex-direction:column;gap:6px}.logo{color:var(--au-accent);font-size:29px;text-align:center;font-weight:800;margin:6px 0 22px}button{background:transparent;color:var(--au-text);border:0;border-radius:12px;cursor:pointer;padding:11px 3px;font:inherit;font-size:20px}button:hover,button.active{background:var(--au-hover);color:var(--au-accent)}button:focus-visible,select:focus-visible{outline:2px solid var(--au-accent);outline-offset:2px}main{min-width:0;padding:30px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--au-border);padding-bottom:22px}h1{font-size:29px;margin:4px 0;letter-spacing:-1px}.small{color:var(--au-accent);font-size:10px;letter-spacing:2px;font-weight:700}.muted{color:var(--au-muted);font-size:12px;line-height:1.6}.demo{color:var(--au-accent);font-size:10px;border:1px solid var(--au-border);border-radius:20px;padding:9px 12px;white-space:nowrap}.hero{border:1px solid var(--au-border);border-radius:18px;padding:35px;margin-top:24px;background:var(--au-surface);color:var(--au-surface-text);min-height:180px}.hero h2{font-size:clamp(22px,3vw,38px);margin:10px 0;letter-spacing:-1px}.hero .muted{color:inherit;opacity:.8}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:22px}.card{background:var(--au-card);color:var(--au-surface-text);border:1px solid var(--au-border);border-radius:16px;padding:18px;min-height:152px}.card .muted{color:inherit;opacity:.8}.symbol{color:var(--au-accent);font-size:27px}.card h3{font-size:14px;margin:13px 0 5px}.state{color:var(--au-accent);font-size:9px;letter-spacing:1px;margin-top:15px}.foot{color:var(--au-muted);font-size:10px;margin-top:25px}.theme-settings{margin-top:24px;padding:22px;border:1px solid var(--au-border);border-radius:16px;background:var(--au-surface);color:var(--au-surface-text)}.theme-settings h2{margin:0 0 12px;font-size:20px}.theme-settings label{display:block;font-size:13px;margin:12px 0 5px}.theme-settings select{width:100%;max-width:360px;padding:10px;border-radius:10px;background:var(--au-bg);color:var(--au-text);border:1px solid var(--au-border)}.theme-settings p{font-size:12px;opacity:.85}.area-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:22px}.area-tile{border:1px solid var(--au-border);border-radius:16px;padding:18px;background:var(--au-surface);color:var(--au-surface-text)}.area-tile h3{font-size:16px;margin:0 0 12px}.area-tile p{font-size:12px;opacity:.85}.registry-note{margin-top:18px;font-size:12px;color:var(--au-muted)}@media(max-width:650px){.wrap{grid-template-columns:54px minmax(0,1fr)}nav{padding:10px 4px}.logo{font-size:23px}button{font-size:18px}main{padding:15px}h1{font-size:23px}.demo{display:none}.hero{padding:22px}}`;
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
        button.addEventListener('click', () => { this._page = name; this._render(); if (name === 'Räume') this._loadRegistry(true); });
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
        main.append(settings);
      }
      main.append(cards, make('div','foot',`AUREON v${VERSION} · Design tokens centralizados · Nenhuma ação enviada ao Home Assistant`));
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
  console.info(`AUREON Dashboard v${VERSION} registered`);
})();
