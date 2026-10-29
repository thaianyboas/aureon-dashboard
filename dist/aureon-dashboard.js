/* AUREON v0.2 — original dashboard strategy foundation; no external requests. */
(() => {
  'use strict';
  const VERSION = '0.2.0';
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
    }
    setConfig(config) {
      if (config && config.type && config.type !== 'custom:aureon-dashboard') {
        throw new Error('Tipo de cartão AUREON inválido');
      }
      this._configured = true;
      this._render();
    }
    set hass(value) { this._hass = value; }
    getCardSize() { return 9; }
    static getStubConfig() { return { type: 'custom:aureon-dashboard' }; }
    _render() {
      if (!this._configured) return;
      const root = this.shadowRoot;
      root.replaceChildren();
      const style = document.createElement('style');
      style.textContent = `:host{display:block;color:#f3f1e7;font-family:Inter,system-ui,sans-serif}*{box-sizing:border-box}.wrap{background:radial-gradient(ellipse at top,#253d32,#0b1512 70%);border:1px solid #526f5b66;border-radius:22px;overflow:hidden;min-height:600px;display:grid;grid-template-columns:76px minmax(0,1fr)}nav{padding:18px 9px;background:#0a1513;border-right:1px solid #ffffff16;display:flex;flex-direction:column;gap:6px}.logo{color:#e3c995;font-size:29px;text-align:center;font-weight:800;margin:6px 0 22px}button{background:transparent;color:#9fb4a5;border:0;border-radius:12px;cursor:pointer;padding:11px 3px;font:inherit;font-size:20px}button:hover,button.active{background:#294a38;color:#e4cb9b}main{min-width:0;padding:30px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #ffffff18;padding-bottom:22px}h1{font-size:29px;margin:4px 0;letter-spacing:-1px}.small{color:#bca67e;font-size:10px;letter-spacing:2px;font-weight:700}.muted{color:#99b0a2;font-size:12px;line-height:1.6}.demo{color:#d5c394;font-size:10px;border:1px solid #947b4a88;border-radius:20px;padding:9px 12px;white-space:nowrap}.hero{border:1px solid #6d8c6b55;border-radius:18px;padding:35px;margin-top:24px;background:linear-gradient(120deg,#294435,#182b23);min-height:180px}.hero h2{font-size:clamp(22px,3vw,38px);margin:10px 0;letter-spacing:-1px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:22px}.card{background:#182921;border:1px solid #ffffff15;border-radius:16px;padding:18px;min-height:152px}.symbol{color:#d9c496;font-size:27px}.card h3{font-size:14px;margin:13px 0 5px}.state{color:#c5ab7b;font-size:9px;letter-spacing:1px;margin-top:15px}.foot{color:#728b7b;font-size:10px;margin-top:25px}@media(max-width:650px){.wrap{grid-template-columns:54px minmax(0,1fr)}nav{padding:10px 4px}.logo{font-size:23px}button{font-size:18px}main{padding:15px}h1{font-size:23px}.demo{display:none}.hero{padding:22px}}`;
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
        button.addEventListener('click', () => { this._page = name; this._render(); });
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
      const cards = make('div','cards');
      const filtered = MODULES.filter(x => this._page === 'Início' || x[2] === this._page);
      for (const [icon, name, , description] of filtered) {
        const card = make('article','card');
        card.append(make('div','symbol',icon),make('h3','',name),make('p','muted',description),make('div','state','EM PREPARAÇÃO'));
        cards.append(card);
      }
      if (!filtered.length) cards.append(make('p','muted','Módulo em preparação.'));
      main.append(cards, make('div','foot',`AUREON v${VERSION} · Nenhuma ação enviada ao Home Assistant`));
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
