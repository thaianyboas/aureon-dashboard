/* AUREON v0.1 - Home Assistant custom card foundation. No external requests. */
const PAGES = [
  ['⌂','Início'],['▦','Räume'],['◉','Geräte'],['ϟ','Energie'],
  ['◇','Sicherheit'],['▣','Kameras'],['♫','Medien'],['✧','JARVIS'],['▤','Agenda'],['⚙','Einstellungen']
];
const MODULES = [
  ['▱','Floor Studio 2D/3D','Räume','Integração NeonPlan planejada'],
  ['✧','JARVIS AI','JARVIS','Voz, IA e ferramentas protegidas'],
  ['♫','Music & SpotifyPlus','Medien','Player premium e temas compartilhados'],
  ['◇','Segurança','Sicherheit','Permissões e proteção residencial'],
  ['ϟ','Energia','Energie','Consumo e custos por período'],
  ['▤','Müll & Agenda','Agenda','Coleta de resíduos e calendário'],
  ['◉','Dispositivos','Geräte','Entidades e controles do Home Assistant'],
  ['▣','Câmeras','Kameras','Visualização com controle de acesso']
];
class AureonDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._page='Início';
    this._configured=false;
  }
  setConfig(config) {
    if (config && config.type && config.type !== 'custom:aureon-dashboard') throw new Error('Tipo de card inválido');
    this._configured=true;
    this._render();
  }
  set hass(value) { this._hass=value; }
  getCardSize() { return 9; }
  static getStubConfig() { return {type:'custom:aureon-dashboard'}; }
  _render() {
    if(!this._configured)return;
    const s=this.shadowRoot;
    s.replaceChildren();
    const style=document.createElement('style');
    style.textContent=`:host{display:block;color:#f3f1e7;font-family:Inter,system-ui,sans-serif}*{box-sizing:border-box}.wrap{background:radial-gradient(ellipse at top,#253d32,#0b1512 70%);border:1px solid #526f5b66;border-radius:22px;overflow:hidden;min-height:600px;display:grid;grid-template-columns:76px minmax(0,1fr)}nav{padding:18px 9px;background:#0a1513;border-right:1px solid #ffffff16;display:flex;flex-direction:column;gap:6px}.logo{color:#e3c995;font-size:29px;text-align:center;font-weight:800;margin:6px 0 22px}button{background:transparent;color:#9fb4a5;border:0;border-radius:12px;cursor:pointer;padding:11px 3px;font:inherit;font-size:20px}button:hover,button.active{background:#294a38;color:#e4cb9b}main{min-width:0;padding:30px}header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #ffffff18;padding-bottom:22px}h1{font-size:29px;margin:4px 0;letter-spacing:-1px}.small{color:#bca67e;font-size:10px;letter-spacing:2px;font-weight:700}.muted{color:#99b0a2;font-size:12px;line-height:1.6}.demo{color:#d5c394;font-size:10px;border:1px solid #947b4a88;border-radius:20px;padding:9px 12px;white-space:nowrap}.hero{border:1px solid #6d8c6b55;border-radius:18px;padding:35px;margin-top:24px;background:linear-gradient(120deg,#294435,#182b23);min-height:180px}.hero h2{font-size:clamp(22px,3vw,38px);margin:10px 0;letter-spacing:-1px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:22px}.card{background:#182921;border:1px solid #ffffff15;border-radius:16px;padding:18px;min-height:152px}.symbol{color:#d9c496;font-size:27px}.card h3{font-size:14px;margin:13px 0 5px}.state{color:#c5ab7b;font-size:9px;letter-spacing:1px;margin-top:15px}.foot{color:#728b7b;font-size:10px;margin-top:25px}@media(max-width:650px){.wrap{grid-template-columns:54px minmax(0,1fr)}nav{padding:10px 4px}.logo{font-size:23px}button{font-size:18px}main{padding:15px}h1{font-size:23px}.demo{display:none}.hero{padding:22px}}`;
    s.append(style);
    const wrap=document.createElement('div');wrap.className='wrap';
    const nav=document.createElement('nav');nav.setAttribute('aria-label','AUREON navigation');
    const logo=document.createElement('div');logo.className='logo';logo.textContent='A✦';nav.append(logo);
    for(const [icon,name] of PAGES){const b=document.createElement('button');b.type='button';b.textContent=icon;b.title=name;b.setAttribute('aria-label',name);if(name===this._page)b.className='active';b.addEventListener('click',()=>{this._page=name;this._render()});nav.append(b)}
    const main=document.createElement('main');
    const header=document.createElement('header');const h=document.createElement('div');const small=document.createElement('div');small.className='small';small.textContent='AUREON / CONTROL CENTER';const h1=document.createElement('h1');h1.textContent=this._page==='Início'?'Visão geral':this._page;const sub=document.createElement('div');sub.className='muted';sub.textContent='Seu ambiente, em perfeita harmonia.';h.append(small,h1,sub);const demo=document.createElement('div');demo.className='demo';demo.textContent='● DEMONSTRAÇÃO';header.append(h,demo);main.append(header);
    if(this._page==='Início'){const hero=document.createElement('section');hero.className='hero';const tag=document.createElement('div');tag.className='small';tag.textContent='AUREON · SMART LIVING';const title=document.createElement('h2');title.textContent='Sua casa. Seu universo.';const desc=document.createElement('p');desc.className='muted';desc.textContent='Primeira versão HACS: identidade visual e estrutura modular. Integrações reais serão adicionadas após testes.';hero.append(tag,title,desc);main.append(hero)}
    const cards=document.createElement('div');cards.className='cards';const filtered=MODULES.filter(x=>this._page==='Início'||x[2]===this._page);
    for(const [icon,name,,description] of filtered){const c=document.createElement('article');c.className='card';const sym=document.createElement('div');sym.className='symbol';sym.textContent=icon;const t=document.createElement('h3');t.textContent=name;const p=document.createElement('p');p.className='muted';p.textContent=description;const st=document.createElement('div');st.className='state';st.textContent='EM PREPARAÇÃO';c.append(sym,t,p,st);cards.append(c)}
    if(!filtered.length){const p=document.createElement('p');p.className='muted';p.textContent='Módulo em preparação.';cards.append(p)}
    main.append(cards);const foot=document.createElement('div');foot.className='foot';foot.textContent='AUREON v0.1 · Nenhuma ação enviada ao Home Assistant';main.append(foot);wrap.append(nav,main);s.append(wrap);
  }
}
if(!customElements.get('aureon-dashboard'))customElements.define('aureon-dashboard',AureonDashboard);
window.customCards=window.customCards||[];
if(!window.customCards.some(x=>x.type==='aureon-dashboard'))window.customCards.push({type:'aureon-dashboard',name:'AUREON Dashboard',description:'Premium Smart Home Dashboard — foundation preview'});
