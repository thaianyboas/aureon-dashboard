import { LitElement, html, svg, nothing, unsafeCSS } from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
import { MusicController, relevantMedia, artworkUrl, position, trackId } from './controller.mjs';
import { labels } from './locales.mjs';
import { styles } from './styles.mjs';
const paths={home:'M3 10 12 3l9 7v11h-6v-7H9v7H3z',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',library:'M4 3v18M9 3v18M15 4l5 16M14 4l4-1 5 16-4 1z',heart:'M20.5 4.5C17 1 13 4 12 6c-1-2-5-5-8.5-1.5C-1 9 4 15 12 21c8-6 13-12 8.5-16.5z',play:'m8 4 13 8L8 20z',pause:'M7 5h3v14H7zM14 5h3v14h-3z',previous:'M5 4v16M20 4 7 12l13 8z',next:'M19 4v16M4 4l13 8L4 20z',shuffle:'M3 6h3c6 0 6 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m-4-4 4 4-4 4',repeat:'m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-3v4a3 3 0 0 1-3 3H3',volume:'M3 9h4l5-5v16l-5-5H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',settings:'M3 6h7m4 0h7M3 12h12m4 0h2M3 18h3m4 0h11M10 3v6m5 0v6M6 15v6',devices:'M14 21H4V3h16v8M8 17h1m7-3h6v9h-6zm2 6h1',expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',close:'m5 5 14 14M19 5 5 19',speaker:'M6 3h12v18H6zM12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6M12 7v.01',chevron:'m9 5 7 7-7 7',grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',album:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4'};
const icon=name=>svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${paths[name] || paths.play}></path></svg>`;
const BROWSE={categories:'get_browse_categorys_list',playlists:'get_playlist_favorites',favorites:'get_track_favorites',albums:'get_album_favorites'};
const time=value=>{const v=Math.max(0,Math.floor(value || 0)),h=Math.floor(v/3600),m=Math.floor(v%3600/60),s=String(v%60).padStart(2,'0');return h?`${h}:${String(m).padStart(2,'0')}:${s}`:`${m}:${s}`;};
export class AureonMusicPlayer extends LitElement {
  static properties={compact:{type:Boolean,reflect:true},appearance:{type:String}};
  static styles=unsafeCSS(styles);
  static createController(){return new MusicController();}
  constructor(){super();this.compact=false;this.appearance='auto';this._controller=null;this._unsubscribe=null;this._timer=null;this._search='';this._searchKind='search';this._spotcastTarget='';}
  set controller(value){
    if(value===this._controller)return;
    this._unsubscribe?.();this._controller=value;this._spotcastTarget=value?.config?.spotcastTargets?.[0]||'';
    this._unsubscribe=this.isConnected?value?.subscribe(()=>this.requestUpdate()):null;this.requestUpdate();
  }
  get controller(){return this._controller;}
  set hass(value){if(!this._controller)this.controller=new MusicController();this._controller.setHass(value);}
  connectedCallback(){super.connectedCallback();if(this._controller&&!this._unsubscribe)this._unsubscribe=this._controller.subscribe(()=>this.requestUpdate());this._timer=setInterval(()=>{if(!document.hidden&&this._controller?.state?.state==='playing')this.requestUpdate();},1000);}
  disconnectedCallback(){super.disconnectedCallback();this._unsubscribe?.();this._unsubscribe=null;clearInterval(this._timer);this._timer=null;}
  get t(){return labels(this._controller?.config?.language?{language:this._controller.config.language}:this._controller?.hass);}
  commitPreferences(){const c=this.controller;this.dispatchEvent(new CustomEvent('aureon-music-preferences',{detail:{entity:c.entityId,appearance:this.appearance,providers:c.config.providers||{},spotcastTargets:c.config.spotcastTargets||[]},bubbles:true,composed:true}));}
  selectPlayer(id){this.controller.select(id);this.commitPreferences();}
  navigate(view){if(!this._controller)return;this._controller.view=view;this.requestUpdate();}
  control(name,handler,{disabled=false,active=false,primary=false,extra=false}={}){
    return html`<button type="button" data-action=${name} aria-label=${this.t[name] || name} title=${this.t[name] || name} class=${`${active?'active ':''}${primary?'primary ':''}${extra?'extra':''}`} ?disabled=${disabled} aria-pressed=${['shuffle','repeat'].includes(name)?String(active):nothing} @click=${handler}>${icon(name)}</button>`;
  }
  onExpand(){if(this.compact){this.controller.view='player';this.controller.emit();this.dispatchEvent(new CustomEvent('aureon-music-open',{bubbles:true,composed:true}));return;}if(document.fullscreenElement===this)this.ownerDocument.exitFullscreen?.().catch(()=>{});else this.requestFullscreen?.().catch(()=>{});}
  player(){
    const c=this.controller,t=this.t,state=c.state,a=state?.attributes || {},p=position(state),art=artworkUrl(a.entity_picture_local || a.entity_picture || a.sp_nowplaying_image_url,c.hass);
    const playing=state?.state==='playing',busy=c.pending.has('transport'),live=c.ready;
    const title=!state?t.none:!live?t.unavailable:a.media_title || t.idle;
    const favorite=c.advanced('check_track_favorites')&&c.advanced('save_track_favorites')&&c.advanced('remove_track_favorites')&&!!trackId(state);
    return html`<section class="stage" aria-label=${t.player}>
      <div class="cover">${this.compact?html`<button class="cover-open" aria-label=${t.expand} @click=${()=>this.onExpand()}></button>`:nothing}${art?html`<img src=${art} alt=${t.artwork} referrerpolicy="no-referrer" @load=${e=>{e.target.hidden=false;}} @error=${e=>{e.target.hidden=true;}}>`:html`<span class="placeholder" aria-hidden="true">◇</span>`}</div>
      <div class="panel">
        <div class="meta"><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${a.media_album_name?`${t.playingFrom} · ${a.media_album_name}`:t.player}</span></div>
        <div class="title-row"><div class="details"><h2 class="title">${this.compact?html`<button class="track-open" @click=${()=>this.onExpand()}>${title}</button>`:title}</h2><p class="artist">${a.media_artist || (live?(a.source || a.friendly_name || ''):t.choose)}</p>${this.compact?html`<p class="destination">${a.source||a.sp_device_name||a.friendly_name||c.entityId} · ${t["state_"+state?.state]||state?.state||""}</p>`:nothing}</div><button type="button" class=${`circle favorite ${c.favorite===true?'liked':''}`} data-action="favorite" title=${t.favoriteUnknown} aria-label=${t.favoriteUnknown} aria-pressed=${c.favorite===null?'mixed':String(c.favorite)} ?disabled=${!favorite || c.pending.has('favorite')} @click=${()=>c.toggleFavorite()}>${icon('heart')}</button></div>
        <div class="progress"><input type="range" aria-label=${t.seek} min="0" max=${p.duration || 1} step="1" .value=${String(p.value)} style=${`--progress:${p.duration?p.value/p.duration*100:0}%`} ?disabled=${!c.can('seek') || !p.duration || busy} @change=${e=>c.command('seek',e.target.value)}><div class="times"><span>${time(p.value)}</span><span>${time(p.duration)}</span></div></div>
        <div class="transport">
          ${this.control('shuffle',()=>c.command('shuffle'),{disabled:!c.can('shuffle')||busy,active:!!a.shuffle,extra:true})}
          ${this.control('previous',()=>c.command('previous'),{disabled:!c.can('previous')||busy})}
          ${this.control(playing?'pause':'play',()=>c.command(playing?'pause':'play'),{disabled:!c.can(playing?'pause':'play')||busy,primary:true})}
          ${this.control('next',()=>c.command('next'),{disabled:!c.can('next')||busy})}
          ${this.control('repeat',()=>c.command('repeat'),{disabled:!c.can('repeat')||busy,active:['all','one'].includes(a.repeat),extra:true})}
        </div>
        ${this.compact?html`<label class="mini-volume">${icon("volume")}<input type="range" aria-label=${t.volume} min="0" max="1" step=".01" .value=${String(Number(a.volume_level)||0)} ?disabled=${!c.can("volume")||busy} @change=${e=>c.command("volume",e.target.value)}></label>`:nothing}
        <div class="dock">${icon('volume')}<input type="range" aria-label=${t.volume} min="0" max="1" step=".01" .value=${String(Number(a.volume_level)||0)} ?disabled=${!c.can('volume')||busy} @change=${e=>c.command('volume',e.target.value)}>${this.control('settings',()=>this.navigate('settings'))}${this.control('devices',()=>c.loadDevices())}${this.control('expand',()=>this.onExpand())}</div>
      </div>
      ${this.compact?html`<button class="open-full" type="button" aria-label=${t.expand} @click=${()=>this.onExpand()}>${icon('expand')}</button>`:nothing}
    </section>`;
  }
  options(){return this.controller.players.map(p=>html`<option value=${p.entity_id}>${p.attributes?.friendly_name || p.entity_id}</option>`);}
  settings(){const c=this.controller,t=this.t;return html`<section class="pane"><h2>${t.settings}</h2>
    <label>${t.account}<select aria-label=${t.account} .value=${c.entityId} @change=${e=>this.selectPlayer(e.target.value)}>${this.options()}</select></label>
    <label>${t.provider}<select aria-label=${t.provider} .value=${c.spotify?'spotifyplus':'native'} @change=${e=>{c.configure({...c.config,providers:{...c.config.providers,[c.entityId]:e.target.value}});this.commitPreferences();}}><option value="native">${t.native}</option><option value="spotifyplus" ?disabled=${!c.hass?.services?.spotifyplus}>SpotifyPlus</option></select></label>
    <label>${t.appearance}<select aria-label=${t.appearance} .value=${this.appearance} @change=${e=>{this.appearance=e.target.value;this.commitPreferences();}}>${['auto','dark','light','custom'].map(mode=>html`<option value=${mode}>${t[mode]}</option>`)}</select></label>
    ${c.service('spotcast','play_media')?html`<label>${t.spotcast}<select aria-label=${t.spotcast} .value=${this._spotcastTarget} @change=${e=>{this._spotcastTarget=e.target.value;c.configure({...c.config,spotcastTargets:this._spotcastTarget?[this._spotcastTarget]:[]});this.commitPreferences();this.requestUpdate();}}><option value="">${t.disabled}</option>${c.players.filter(p=>['cast','spotcast'].includes(c.hass?.entities?.[p.entity_id]?.platform)).map(p=>html`<option value=${p.entity_id}>${p.attributes.friendly_name || p.entity_id}</option>`)}</select></label>`:nothing}
    <p class="hint">${t.configure}</p><button class="chip" @click=${()=>this.navigate('player')}>${t.close}</button></section>`;}
  devices(){const c=this.controller,t=this.t;return html`<section class="pane"><h2>${t.devices}</h2><label>${t.account}<select aria-label=${t.account} .value=${c.entityId} @change=${e=>{this.selectPlayer(e.target.value);c.loadDevices();}}>${this.options()}</select></label>
    ${c.advanced('get_spotify_connect_devices')?html`<button class="chip" ?disabled=${c.pending.has('devices')} @click=${()=>c.loadDevices()}>${t.refresh}</button>${c.devices.map(d=>html`<button class=${`device ${d.active?'active':''}`} ?disabled=${!c.advanced('player_transfer_playback')||c.pending.has('transfer')} @click=${()=>c.transfer(d.id)}>${icon('devices')}${d.name}${d.active?' ✓':''}</button>`)}`:nothing}
    ${(Array.isArray(c.state?.attributes?.source_list)?c.state.attributes.source_list:[]).map(source=>html`<button class="device" ?disabled=${!c.can('source')||c.pending.has('source')} @click=${()=>c.selectSource(source)}>${icon('devices')}${source}</button>`)}
    ${!c.spotify && !c.state?.attributes?.source_list?.length?html`<p class="hint">${t.unsupported}</p>`:nothing}<button class="chip" @click=${()=>this.navigate('player')}>${t.close}</button></section>`;}
  browser(){
    const c=this.controller,t=this.t,search=c.view==='search',service=search?({search:'search_tracks',searchAlbums:'search_albums',searchPlaylists:'search_playlists'}[this._searchKind]):({albums:'get_album_favorites',favorites:'get_track_favorites',playlists:'get_playlist_favorites',categories:'get_browse_categorys_list',category:'get_category_playlists'}[c.libraryKind]);
    const enabled=c.advanced(service),loading=c.pending.has('browse');
    return html`<section class="pane"><h2>${search?t.search:t.library}</h2>
      ${search?html`<form @submit=${e=>{e.preventDefault();c.browse(this._searchKind,this._search);}}><select aria-label=${t.library} .value=${this._searchKind} @change=${e=>{this._searchKind=e.target.value;this.requestUpdate();}}>${[['search','tracks'],['searchAlbums','albums'],['searchPlaylists','playlists']].map(([key,label])=>html`<option value=${key}>${t[label]}</option>`)}</select><input type="search" maxlength="200" aria-label=${t.searchHint} placeholder=${t.searchHint} .value=${this._search} @input=${e=>{this._search=e.target.value;}}><button class="chip" type="submit" ?disabled=${!enabled||loading}>${t.search}</button></form>`:html`<div class="tabs">${['playlists','albums','favorites','categories'].map(kind=>html`<button class=${`chip ${c.libraryKind===kind?'active':''}`} ?disabled=${loading||!c.advanced({playlists:'get_playlist_favorites',albums:'get_album_favorites',favorites:'get_track_favorites',categories:'get_browse_categorys_list'}[kind])} @click=${()=>c.browse(kind)}>${t[kind]}</button>`)}</div>`}
      ${!enabled?html`<p class="hint">${t.browseUnavailable}</p>`:loading?html`<p class="hint" role="status">${t.loading}</p>`:!c.results.length?html`<p class="hint">${t.noResults}</p>`:nothing}
      <div class="items">${c.results.map(item=>this.tile(item))}</div><div class="tabs" aria-label=${t.pages}><button class="chip" ?disabled=${loading||c.pageIndex===0} @click=${()=>c.changePage(-1)}>${t.previousPage}</button><span>${t.page} ${c.pageIndex+1}</span><button class="chip" ?disabled=${loading||!c.hasNext} @click=${()=>c.changePage(1)}>${t.nextPage}</button></div>
    </section>`;
  }
  art(item){return artworkUrl((item.images || item.icons || item.album?.images)?.[0]?.url || item.image_url,this.controller.hass);}
  tile(item){const c=this.controller,art=this.art(item);return html`<button class="item" ?disabled=${c.pending.has('play-item')||c.pending.has('browse')} @click=${()=>item.category?c.openCategory(item):c.playItem(item,{spotcastTarget:this._spotcastTarget})}>${art?html`<img loading="lazy" src=${art} alt="" referrerpolicy="no-referrer">`:html`<span class="item-ph">${icon(item.category?'grid':'album')}</span>`}<strong>${item.name}</strong><small>${item.artists?.map(a=>a.name).join(', ') || item.owner?.display_name || ''}</small></button>`;}
  overview(){const c=this.controller,t=this.t,sh=c.shelves||{},rows=[['categories',t.categories],['playlists',t.playlists],['favorites',t.favorites],['albums',t.albums]].filter(([k])=>sh[k]?.length);const any=['get_browse_categorys_list','get_playlist_favorites','get_track_favorites','get_album_favorites'].some(n=>c.advanced(n));
    if(!rows.length)return html`<section class="shelves empty-shelves"><h2>${t.overview}</h2>${any?html`<p class="hint">${t.libraryHint}</p><button class="chip primary-chip" data-action="load-library" ?disabled=${c.pending.has('shelves')} @click=${()=>c.loadShelves()}>${c.pending.has('shelves')?t.loading:t.loadLibrary}</button>`:html`<p class="hint">${c.players.length?t.browseUnavailable:t.configure}</p>`}</section>`;
    return html`<section class="shelves">${rows.map(([k,label])=>html`<div class="shelf"><div class="shelf-head"><h3>${label}</h3>${c.advanced(BROWSE[k])?html`<button class="link" ?disabled=${c.pending.has('browse')} @click=${()=>c.browse(k)}>${t.showAll}${icon('chevron')}</button>`:nothing}</div><div class=${`shelf-row ${k==='categories'?'cats':''}`}>${sh[k].map(item=>this.tile(item))}</div></div>`)}</section>`;}
  nowPlaying(){const c=this.controller,t=this.t,state=c.state,a=state?.attributes || {},p=position(state),art=artworkUrl(a.entity_picture_local || a.entity_picture || a.sp_nowplaying_image_url,c.hass);
    const playing=state?.state==='playing',busy=c.pending.has('transport'),live=c.ready,title=!state?t.none:!live?t.unavailable:a.media_title || t.idle;
    const favorite=c.advanced('check_track_favorites')&&c.advanced('save_track_favorites')&&c.advanced('remove_track_favorites')&&!!trackId(state);
    const dest=a.source||a.sp_device_name||a.friendly_name||c.entityId;
    return html`<section class="now" aria-label=${t.player}>
      <div class="cover">${art?html`<img src=${art} alt=${t.artwork} referrerpolicy="no-referrer" @load=${e=>{e.target.hidden=false;}} @error=${e=>{e.target.hidden=true;}}>`:html`<span class="placeholder" aria-hidden="true">◇</span>`}
        <button type="button" class=${`circle favorite ${c.favorite===true?'liked':''}`} data-action="favorite" title=${t.favoriteUnknown} aria-label=${t.favoriteUnknown} aria-pressed=${c.favorite===null?'mixed':String(c.favorite)} ?disabled=${!favorite || c.pending.has('favorite')} @click=${()=>c.toggleFavorite()}>${icon('heart')}</button>
        ${dest?html`<button type="button" class="dest-chip" data-action="devices" aria-label=${t.devices} @click=${()=>c.loadDevices()}>${icon('speaker')}<span>${dest}</span></button>`:nothing}</div>
      <div class="now-meta"><h2 class="title">${title}</h2><p class="artist">${[a.media_artist || (live?'':t.choose),a.media_album_name].filter(Boolean).join(' · ')}</p></div>
      <div class="progress"><input type="range" aria-label=${t.seek} min="0" max=${p.duration || 1} step="1" .value=${String(p.value)} style=${`--progress:${p.duration?p.value/p.duration*100:0}%`} ?disabled=${!c.can('seek') || !p.duration || busy} @change=${e=>c.command('seek',e.target.value)}><div class="times"><span>${time(p.value)}</span><span>${p.duration?'-'+time(p.duration-p.value):time(0)}</span></div></div>
      <div class="transport">
        ${this.control('shuffle',()=>c.command('shuffle'),{disabled:!c.can('shuffle')||busy,active:!!a.shuffle,extra:true})}
        ${this.control('previous',()=>c.command('previous'),{disabled:!c.can('previous')||busy})}
        ${this.control(playing?'pause':'play',()=>c.command(playing?'pause':'play'),{disabled:!c.can(playing?'pause':'play')||busy,primary:true})}
        ${this.control('next',()=>c.command('next'),{disabled:!c.can('next')||busy})}
        ${this.control('repeat',()=>c.command('repeat'),{disabled:!c.can('repeat')||busy,active:['all','one'].includes(a.repeat),extra:true})}
      </div>
      <label class="now-volume">${icon('volume')}<input type="range" aria-label=${t.volume} min="0" max="1" step=".01" .value=${String(Number(a.volume_level)||0)} style=${`--progress:${(Number(a.volume_level)||0)*100}%`} ?disabled=${!c.can('volume')||busy} @change=${e=>c.command('volume',e.target.value)}><span>${Math.round((Number(a.volume_level)||0)*100)}</span></label>
      <div class="now-dock"><select aria-label=${t.account} @change=${e=>this.selectPlayer(e.target.value)} ?disabled=${!c.players.length}>${c.players.map(pl=>html`<option value=${pl.entity_id} ?selected=${pl.entity_id===c.entityId}>${pl.attributes?.friendly_name || pl.entity_id}</option>`)}</select>${this.control('expand',()=>this.onExpand())}</div>
    </section>`;}
  outputs(){const c=this.controller,t=this.t;return html`<section class="box"><h3>${t.playOn}</h3><div class="outputs">${c.players.slice(0,8).map(pl=>{const on=pl.entity_id===c.entityId,st=pl.attributes||{};return html`<button type="button" class=${`output ${on?'active':''}`} aria-pressed=${String(on)} @click=${()=>this.selectPlayer(pl.entity_id)}>${icon('speaker')}<span><strong>${st.friendly_name||pl.entity_id}</strong><small>${st.source||t['state_'+pl.state]||pl.state}</small></span>${on?icon('volume'):html`<i class="radio" aria-hidden="true"></i>`}</button>`;})}${!c.players.length?html`<p class="hint">${t.noPlayers}</p>`:nothing}</div></section>`;}
  volumes(){const c=this.controller,t=this.t,list=c.players.filter(pl=>c.playerVolume(pl.entity_id)).slice(0,6);return html`<section class="box"><h3>${t.volumes}</h3>${list.length?list.map(pl=>{const v=Number(pl.attributes?.volume_level)||0;return html`<label class="vol-row">${icon('speaker')}<span>${pl.attributes?.friendly_name||pl.entity_id}</span><input type="range" min="0" max="1" step=".01" aria-label=${t.volume+': '+(pl.attributes?.friendly_name||pl.entity_id)} .value=${String(v)} style=${`--progress:${v*100}%`} ?disabled=${c.pending.has('volume:'+pl.entity_id)} @change=${e=>c.setVolume(pl.entity_id,e.target.value)}><b>${Math.round(v*100)}</b></label>`;}):html`<p class="hint">${t.unsupported}</p>`}</section>`;}
  quick(){const c=this.controller,t=this.t,a=c.state?.attributes||{},busy=c.pending.has('transport'),fav=c.advanced('check_track_favorites')&&c.advanced('save_track_favorites')&&c.advanced('remove_track_favorites')&&!!trackId(c.state);return html`<section class="box"><h3>${t.quick}</h3><div class="quick">
    <button type="button" data-action="pause-all" ?disabled=${!c.players.some(pl=>pl.state==='playing')||c.pending.has('pause-all')} @click=${()=>c.pauseAll()}>${icon('pause')}<span>${t.pauseAll}</span></button>
    <button type="button" aria-pressed=${String(!!a.shuffle)} ?disabled=${!c.can('shuffle')||busy} @click=${()=>c.command('shuffle')}>${icon('shuffle')}<span>${t.shuffle}</span></button>
    <button type="button" aria-pressed=${String(['all','one'].includes(a.repeat))} ?disabled=${!c.can('repeat')||busy} @click=${()=>c.command('repeat')}>${icon('repeat')}<span>${t.repeat}</span></button>
    <button type="button" class=${c.favorite===true?'liked':''} ?disabled=${!fav||c.pending.has('favorite')} @click=${()=>c.toggleFavorite()}>${icon('heart')}<span>${t.favorites}</span></button>
    <button type="button" ?disabled=${c.pending.has('devices')} @click=${()=>c.loadDevices()}>${icon('devices')}<span>${t.devices}</span></button>
    <button type="button" @click=${()=>this.navigate('settings')}>${icon('settings')}<span>${t.settings}</span></button></div></section>`;}
  render(){const c=this.controller,t=this.t;this.hidden=!!(this.compact&&!relevantMedia(c?.state));if(this.hidden)return nothing;if(!c)return html`<p>${t.loading}</p>`;const art=artworkUrl(c.state?.attributes?.entity_picture_local || c.state?.attributes?.entity_picture || c.state?.attributes?.sp_nowplaying_image_url,c.hass);
    const mode=this.appearance==='auto'?(c.hass?.themes?.darkMode===false?'light':'dark'):this.appearance;
    const notices=html`${c.error?html`<p class="notice error" role="alert">${t.error}: ${c.error}</p>`:nothing}${c.pending.size?html`<p class="notice busy" role="status">${t.loading}</p>`:nothing}${!c.players.length?html`<p class="notice">${t.configure}</p>`:nothing}`;
    if(this.compact)return html`<div class=${`shell compact ${mode}`}><div class="ambient" style=${art?`background-image:url(${JSON.stringify(art)})`:''}></div><div class="wash"></div><div class="body">${this.player()}</div>${notices}</div>`;
    const view=c.view,tabs=[['player','home',t.overview,null],['favorites','heart',t.favorites,'get_track_favorites'],['library','library',t.library,'get_playlist_favorites'],['albums','album',t.albums,'get_album_favorites'],['categories','grid',t.categories,'get_browse_categorys_list']];
    const activeTab=view==='player'?'player':view==='library'?({playlists:'library',category:'categories'}[c.libraryKind]||c.libraryKind):'';
    return html`<div class=${`shell full ${mode}`}><div class="ambient" style=${art?`background-image:url(${JSON.stringify(art)})`:''}></div><div class="wash"></div>
      <header class="top"><form class="search" role="search" @submit=${e=>{e.preventDefault();c.browse(this._searchKind,this._search);}}><button type="submit" aria-label=${t.search} title=${t.search} ?disabled=${!c.advanced('search_tracks')||c.pending.has('browse')}>${icon('search')}</button><input type="search" maxlength="200" aria-label=${t.searchHint} placeholder=${t.searchHint} .value=${this._search} @input=${e=>{this._search=e.target.value;}}></form>
        <nav class="sources" aria-label=${t.provider}>${tabs.map(([key,ic,label,service])=>html`<button type="button" class=${activeTab===key?'active':''} aria-label=${label} aria-current=${activeTab===key?'page':nothing} ?disabled=${(service&&!c.advanced(service))||c.pending.has('browse')} @click=${()=>key==='player'?this.navigate('player'):c.browse(key==='library'?'playlists':key)}>${icon(ic)}<span>${label}</span></button>`)}</nav>
        <button type="button" class="circle settings-btn" data-action="settings" aria-label=${t.settings} title=${t.settings} @click=${()=>this.navigate(view==='settings'?'player':'settings')}>${icon('settings')}</button></header>
      <div class="main">${this.nowPlaying()}<div class="browse">${view==='settings'?this.settings():view==='devices'?this.devices():view==='player'?this.overview():this.browser()}</div></div>
      <div class="lower">${this.outputs()}${this.volumes()}${this.quick()}</div>
      ${notices}</div>`;
  }
}
if(!customElements.get('aureon-music-player'))customElements.define('aureon-music-player',AureonMusicPlayer);
