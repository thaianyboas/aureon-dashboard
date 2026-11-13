// Original AUREON adapter. Integrations remain external; HA enforces service permissions.
/** Spotify's "no active device" answer (HTTP 404 / NO_ACTIVE_DEVICE), as SpotifyPlus and HA pass it on. */
export const noActiveDevice = error => /404|no active device|NO_ACTIVE_DEVICE|device or item unavailable|Player command failed: No active device/i.test(String(error?.message||error?.body?.message||error||''));
export const FEATURES = { pause:1, seek:2, volume:4, previous:16, next:32, playMedia:512, source:2048, play:16384, shuffle:32768, browse:131072, repeat:262144, search:4194304 };
export const supported = (state, feature) => !!(Number(state?.attributes?.supported_features || 0) & FEATURES[feature]);
export const available = state => !!state && !['unknown','unavailable'].includes(state.state);
export function isSpotifyPlus(hass,id,config={}) {
  // Detected from the entity itself; an old stored provider choice no longer hides Spotify.
  return hass?.entities?.[id]?.platform === 'spotifyplus' || Object.hasOwn(hass?.states?.[id]?.attributes || {},'sp_user_id');
}
// SpotifyPlus and Spotcast may be the originals or their copies inside AUREON Música (domain aureon_music).
export const AUREON_MUSIC='aureon_music';
export function spotifyPlusDomain(hass,id){return hass?.entities?.[id]?.platform===AUREON_MUSIC?AUREON_MUSIC:'spotifyplus';}
export function spotcastDomain(hass){return hass?.services?.[AUREON_MUSIC]?.play_media?AUREON_MUSIC:'spotcast';}
export function discoverPlayers(hass,config={}) {
  return Object.values(hass?.states || {}).filter(s => s.entity_id?.startsWith('media_player.') &&
    (!Array.isArray(config.allowedEntities) || config.allowedEntities.includes(s.entity_id)) &&
    !config.excluded?.includes(s.entity_id) && !hass?.entities?.[s.entity_id]?.hidden && !hass?.entities?.[s.entity_id]?.disabled)
    .sort((a,b) => Number(isSpotifyPlus(hass,b.entity_id,config))-Number(isSpotifyPlus(hass,a.entity_id,config)) || a.entity_id.localeCompare(b.entity_id));
}
export function artworkUrl(value,hass) {
  if (typeof value !== 'string' || value.length>4096) return '';
  // Never attach the HA access token to a remote URL or embed raw markup/data URLs.
  if (value.startsWith('/') && !value.startsWith('//')) return hass?.hassUrl ? hass.hassUrl(value) : value;
  try { const url=new URL(value); return ['https:','http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function trackId(state) {
  const uri=state?.attributes?.media_content_id || state?.attributes?.sp_track_uri_origin;
  return /^spotify:track:([A-Za-z0-9]+)$/.exec(uri || '')?.[1] || /^https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]+)/.exec(uri || '')?.[1] || null;
}
export function position(state,now=Date.now()) {
  const a=state?.attributes || {}, duration=Number(a.media_duration);
  if (!Number.isFinite(duration) || duration<=0) return {value:0,duration:0};
  let value=Number(a.media_position); if (!Number.isFinite(value)) value=0;
  const since=Date.parse(a.media_position_updated_at);
  if (state?.state==='playing' && Number.isFinite(since)) value+=Math.max(0,(now-since)/1000);
  return {value:Math.min(duration,Math.max(0,value)),duration};
}
export function resultOf(response) { const body=response?.response ?? response; return body?.result ?? body ?? {}; }
export function mediaItems(response) {
  const result=resultOf(response); const list=Array.isArray(result)?result:result.items || result.tracks?.items || result.albums?.items || result.playlists?.items || [];
  const seen=new Set();return (Array.isArray(list)?list:[]).map(x=>x.track || x.album || x.show || x).filter(x=>x && typeof x.name==='string' && /^spotify:(track|album|playlist|show):[A-Za-z0-9]+$/.test(x.uri || '') && !seen.has(x.uri) && seen.add(x.uri)).slice(0,50);
}
// Spotify Connect devices: one entry per name (the same speaker is often reported twice), restricted and nameless ones
// dropped. "ready" = Spotify can play there now (in the account's device list, active, or a Cast/Sonos device that
// AUREON Música/SpotifyPlus can wake). Others (e.g. a sleeping Alexa) usually need Spotify opened on them once.
export function connectDevices(response) {
  const result=resultOf(response); const list=result.Items || result.items || result.devices || [],best=new Map();
  for(const d of Array.isArray(list)?list:[]){
    const id=d?.Id ?? d?.id,name=String(d?.Name ?? d?.name ?? '').trim();
    if(typeof id!=='string'||!id||!name||d.IsRestricted===true||d.is_restricted===true)continue;
    const active=!!(d.IsActiveDevice || d.is_active),ready=active||d.IsInDeviceList===true||d.IsChromeCast===true||d.IsSonos===true||!Object.hasOwn(d,'IsInDeviceList');
    const item={id,name,active,ready},key=name.toLocaleLowerCase(),old=best.get(key),score=x=>(x.active?2:0)+(x.ready?1:0);
    if(!old||score(item)>score(old))best.set(key,item);
  }
  return [...best.values()].sort((a,b)=>Number(b.active)-Number(a.active)||Number(b.ready)-Number(a.ready)||a.name.localeCompare(b.name));
}
export const BROWSE_SERVICES={podcasts:'get_show_favorites',recent:'get_player_recent_tracks',playlists:'get_playlist_favorites',albums:'get_album_favorites',favorites:'get_track_favorites',search:'search_tracks',searchAlbums:'search_albums',searchPlaylists:'search_playlists',categories:'get_browse_categorys_list',category:'get_category_playlists'};
export function categoryItems(response){const result=resultOf(response),list=Array.isArray(result)?result:result.items || result.categories?.items || [];return (Array.isArray(list)?list:[]).filter(x=>typeof x?.name==='string' && typeof x.id==='string' && /^[A-Za-z0-9_-]{1,200}$/.test(x.id)).slice(0,500).map(x=>({...x,category:true}));}
// Native Home Assistant media browser (media_player/browse_media, media_player/search_media).
export function nativeChildren(result){const list=Array.isArray(result)?result:Array.isArray(result?.children)?result.children:Array.isArray(result?.result)?result.result:[];return list.filter(x=>x&&typeof x.title==='string'&&typeof x.media_content_id==='string'&&typeof x.media_content_type==='string').slice(0,200).map(x=>({title:x.title.slice(0,300),thumbnail:typeof x.thumbnail==='string'?x.thumbnail:'',media_content_id:x.media_content_id,media_content_type:x.media_content_type,media_class:String(x.media_class||''),can_play:!!x.can_play,can_expand:!!x.can_expand,native:true}));}
function pageContainer(response){const r=resultOf(response);return r.tracks || r.albums || r.playlists || r;}
const ADVANCED = new Set(['get_player_recent_tracks','get_featured_playlists','get_show_favorites','playlist_items_add','get_browse_categorys_list','get_category_playlists','get_spotify_connect_devices','player_transfer_playback','search_tracks','search_albums','search_playlists','get_playlist_favorites','get_album_favorites','get_track_favorites','check_track_favorites','save_track_favorites','remove_track_favorites','player_media_play_context','player_media_play_tracks','set_default_speaker']);
const NATIVE_READ = new Set(['get_show_favorites','get_player_recent_tracks','get_playlist_favorites','get_album_favorites','get_track_favorites','search_tracks','search_albums','search_playlists','check_track_favorites','get_spotify_connect_devices']);
const NATIVE_WRITE = new Set(['playlist_items_add','save_track_favorites','remove_track_favorites','player_transfer_playback','player_media_play_tracks','player_media_play_context','set_default_speaker']);
export class MusicController {
  constructor(){ this.listeners=new Set(); this.config={}; this.entityId='';this.hass=null;this.epoch=0;this.pending=new Set();this.error='';this.results=[];this.devices=[];this.favorite=null;this.view='player';this.libraryKind='playlists';this.query='';this._scope=null;this._track='';this.pageIndex=0;this.hasNext=false;this.categoryId='';this._categories=[];this.shelves={};this.shelfSources={};this.shelvesRequested=false;this.native={kind:'',stack:[],items:[],title:''};this.ownPlaylists=null;this.addedTo=''; }
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  emit(){for(const fn of this.listeners)fn();}
  configure(config={}) {this.config={...config}; if(this.hass)this.setHass(this.hass);}
  setHass(hass){
    const scope=[hass?.user?.id,hass?.connection];
    if(this._scope && (scope[0]!==this._scope[0] || scope[1]!==this._scope[1])) this.reset();
    this._scope=scope;this.hass=hass;
    const players=discoverPlayers(hass,this.config);
    if(!players.some(p=>p.entity_id===this.entityId)){
      this.entityId=players.find(p=>p.entity_id===this.config.entity)?.entity_id || players[0]?.entity_id || ''; this.invalidate();
    }
    const track=trackId(this.state);if(track!==this._track){this._track=track;this.favorite=null;this.favoriteUnknown=false;clearTimeout(this._favoriteTimer);if(track&&this.spotify&&this.advanced('check_track_favorites'))this._favoriteTimer=setTimeout(()=>this.checkFavorite(),700);}
    this.emit();
  }
  get state(){return this.hass?.states?.[this.entityId];}
  get players(){return discoverPlayers(this.hass,this.config);}
  // Spotify accounts (SpotifyPlus / AUREON Música) are accounts, not speakers: they are chosen under Player / conta and
  // play on Spotify Connect speakers; the speaker lists only show real players.
  get speakers(){return this.players.filter(p=>!isSpotifyPlus(this.hass,p.entity_id,this.config));}
  get spotify(){return isSpotifyPlus(this.hass,this.entityId,this.config);}
  get ready(){return available(this.state);}
  service(domain,name){return !!this.hass?.services?.[domain]?.[name];}
  can(feature){const services={play:'media_play',pause:'media_pause',previous:'media_previous_track',next:'media_next_track',volume:'volume_set',seek:'media_seek',shuffle:'shuffle_set',repeat:'repeat_set',source:'select_source',playMedia:'play_media'};return this.ready && supported(this.state,feature) && this.service('media_player',services[feature]);}
  get nativeSpotify(){return this.state?.attributes?.aureon_music_native === true;}
  advanced(name){
    if(!this.ready || !this.spotify || !ADVANCED.has(name) || this.blocked(name))return false;
    if(this.nativeSpotify)return (NATIVE_READ.has(name)&&this.service(AUREON_MUSIC,'native_read')) || (NATIVE_WRITE.has(name)&&this.service(AUREON_MUSIC,'native_write'));
    return this.service(spotifyPlusDomain(this.hass,this.entityId),name);
  }
  // Spotify refuses some Web API features for newer apps (403 "Forbidden", e.g. featured playlists, browse categories).
  // Such a service is remembered per account (this browser) and not asked again, so no error keeps popping up.
  _blockedKey(){return 'aureon.music.blocked:'+this.entityId;}
  blocked(name){if(!this._blocked||this._blockedFor!==this.entityId){this._blockedFor=this.entityId;try{this._blocked=new Set(JSON.parse(globalThis.localStorage?.getItem(this._blockedKey())||'[]'));}catch{this._blocked=new Set();}}return this._blocked.has(name);}
  _markBlocked(name,error){if(!/forbidden|\b403\b/i.test(String(error?.message||error||'')))return false;this.blocked(name);this._blocked.add(name);try{globalThis.localStorage?.setItem(this._blockedKey(),JSON.stringify([...this._blocked]));}catch{}return true;}
  invalidate(){this.epoch++;this.error='';this.results=[];this.devices=[];this.favorite=null;this.pending.clear();this._track='';this.pageIndex=0;this.hasNext=false;this.categoryId='';this._categories=[];this.shelves={};this.shelfSources={};this.shelvesRequested=false;this.native={kind:'',stack:[],items:[],title:''};this.ownPlaylists=null;this.addedTo='';}
  reset(){this.entityId='';this.view='player';this.query='';this.invalidate();}
  select(id){if(!this.players.some(p=>p.entity_id===id))return false;this.entityId=id;this.invalidate();this.emit();return true;}
  /** Playing as the buttons should show it: what was just pressed, until Home Assistant reports it (or 10 s). */
  get isPlaying(){
    const o=this.optimistic,actual=this.state?.state==='playing';
    if(!o||o.entity!==this.entityId||Date.now()>o.until||o.playing===actual){this.optimistic=null;return actual;}
    return o.playing;
  }
  async request(key,fn){
    if(this.pending.has(key))return false;
    const epoch=this.epoch,entity=this.entityId;this.pending.add(key);this.error='';this.emit();
    const current=()=>this.epoch===epoch && this.entityId===entity;
    try {const result=await fn(current);return current()?result:false;}catch(error){if(key==='playpause')this.optimistic=null;if(current())this.error=String(error?.message || error || 'Service error');return false;}
    finally{if(current()){this.pending.delete(key);this.emit();}}
  }
  async callSpotify(name,data={},response=false){
    if(!this.advanced(name))throw new Error('Spotify service unavailable');
    // Explicit entity_id selects the configured Spotify account; never infer it from an entity name.
    // notifyOnError=false: AUREON shows its own notice; Home Assistant's error toast stays away.
    const entity_id=this.entityId;
    try{
      if(this.nativeSpotify){
        const service=NATIVE_READ.has(name)?'native_read':'native_write';
        const result=await this.hass.callService(AUREON_MUSIC,service,{action:name,arguments:data,entity_id},undefined,false,response);
        return response ? (result?.response ?? result)?.[entity_id] : true;
      }
      const result=await this.hass.callService(spotifyPlusDomain(this.hass,entity_id),name,{...data,entity_id},undefined,false,response);
      return response ? result : true;
    }
    catch(error){this._markBlocked(name,error);throw error;}
  }
  async command(action,value){
    const specs={play:['play','media_play',{}],pause:['pause','media_pause',{}],previous:['previous','media_previous_track',{}],next:['next','media_next_track',{}],volume:['volume','volume_set',{volume_level:Math.max(0,Math.min(1,Number(value)))}],seek:['seek','media_seek',{seek_position:Math.max(0,Math.min(position(this.state).duration,Number(value)))}],shuffle:['shuffle','shuffle_set',{shuffle:!this.state?.attributes?.shuffle}],repeat:['repeat','repeat_set',{repeat:['off','all','one'][(['off','all','one'].indexOf(this.state?.attributes?.repeat)+1)%3]}]};
    const spec=specs[action];if(!spec || !this.can(spec[0]) || !this.service('media_player',spec[1]))return false;
    if(['volume','seek'].includes(action)&&(!Number.isFinite(Number(value))||(action==='seek'&&!position(this.state).duration)))return false;
    const entity=this.entityId;
    // Owner 2026-11-13 ("fica carregando por um bom tempo"): play and pause change the button at once and run
    // without the busy spinner; Amazon speakers can keep Spotify's answer waiting for seconds.
    const toggle=action==='play'||action==='pause';
    // Owner 2026-11-13 ("ainda nao responde instantaneamente"): a press while the previous one is still on its way
    // changes the button at once too; the last wish is sent as soon as the speaker has answered the first.
    if(toggle){this.optimistic={playing:action==='play',entity,until:Date.now()+10000};this.emit();if(this.pending.has('playpause')){this._nextToggle=action;return true;}this._nextToggle=null;}
    const result=await this.request(toggle?'playpause':'transport',async()=>{
      try{await this.hass.callService('media_player',spec[1],{entity_id:entity,...spec[2]});}
      catch(error){
        // Owner 2026-11-12: "eu aperto play ou pausa e sempre dá esse erro" – Spotify answers 404 when no speaker is
        // active. Pausing then has nothing to do; playing wakes the chosen speaker and resumes there.
        if(!noActiveDevice(error))throw error;
        if(action==='pause')return true;
        if(action!=='play'||!(await this.resumeOnSpeaker(entity)))throw error;
      }
      return true;});
    const next=toggle?this._nextToggle:null;this._nextToggle=null;
    if(next&&next!==action&&result!==false&&this.entityId===entity)return this.command(next);
    return result;
  }
  /** The standard speaker of a native AUREON Música account (owner 2026-11-13): Play goes there when nothing plays. */
  get defaultSpeaker(){const name=this.state?.attributes?.aureon_default_speaker;return typeof name==='string'?name:'';}
  get canSetDefaultSpeaker(){return this.nativeSpotify&&this.advanced('set_default_speaker');}
  async setDefaultSpeaker(name){
    if(!this.canSetDefaultSpeaker||typeof name!=='string'||(name&&!this.devices.some(d=>d.name===name)&&name!==this.defaultSpeaker))return false;
    return this.request('default-speaker',async()=>{await this.callSpotify('set_default_speaker',{name});return true;});
  }
  /** Resumes Spotify on the speaker shown on the player card (its source), or the last one used, when none is active. */
  async resumeOnSpeaker(entity){
    const source=this.hass?.states?.[entity]?.attributes?.source;
    if(this.advanced('player_transfer_playback')&&this.advanced('get_spotify_connect_devices')){
      let devices=this.devices;
      if(!devices.some(d=>d.name===source)){try{devices=connectDevices(await this.callSpotify('get_spotify_connect_devices',{refresh:true,sort_result:true},true));this.devices=devices;}catch{devices=[];}}
      const target=devices.find(d=>d.name===source)||devices.find(d=>d.active)||devices[0];
      if(target){await this.callSpotify('player_transfer_playback',{device_id:target.id,play:true});return true;}
    }
    const list=this.hass?.states?.[entity]?.attributes?.source_list||[];
    if(source&&list.includes(source)&&this.service('media_player','select_source')){
      await this.hass.callService('media_player','select_source',{entity_id:entity,source});
      await this.hass.callService('media_player','media_play',{entity_id:entity});return true;
    }
    return false;
  }
  async browse(kind='playlists',query='',page=0,categoryId=''){
    if(this.pending.has('browse'))return false;
    const name=BROWSE_SERVICES[kind],search=kind.startsWith('search'),size=search?10:20;
    if(!name || !Number.isInteger(page) || page<0 || page*size>10000 || (search&&!query.trim()) || (kind==='category'&&!/^[A-Za-z0-9_-]{1,200}$/.test(categoryId)))return false;
    this.view=search?'search':'library';this.libraryKind=kind;this.query=query.trim().slice(0,200);this.pageIndex=page;this.categoryId=kind==='category'?categoryId:'';this.results=[];this.hasNext=false;this.emit();
    if(!this.advanced(name))return false;
    return this.request('browse',async current=>{
      // Categories use a non-paged service; page its bounded response locally. Never fetch provider next URLs.
      const response=kind==='categories'&&page>0?null:await this.callSpotify(name,kind==='categories'?{refresh:false}:kind==='recent'?{limit:size}:{limit:size,offset:page*size,...(search?{criteria:this.query}:{}),...(kind==='category'?{category_id:categoryId}:{sort_result:false})},true);
      if(!current())return false;
      if(kind==='categories'){
        if(response)this._categories=categoryItems(response);
        this.results=this._categories.slice(page*size,(page+1)*size);this.hasNext=this._categories.length>(page+1)*size;
      }else{
        const container=pageContainer(response),items=mediaItems(response);this.results=items.slice(0,size);if(name==='get_track_favorites')this._rememberLiked(items);
        const total=Number(container.total);this.hasNext=kind!=='recent'&&items.length>0&&(typeof container.next==='string'&&container.next.length>0 || Number.isFinite(total)&&total>(page+1)*size);
      }
      return true;
    });
  }
  async changePage(delta){
    if(![-1,1].includes(delta) || delta===1&&!this.hasNext || delta===-1&&!this.pageIndex)return false;
    return this.browse(this.libraryKind,this.query,this.pageIndex+delta,this.categoryId);
  }
  async openCategory(item){if(!item?.category || !(this.results.some(x=>x.category&&x.id===item.id)||this.shelves.categories?.some(x=>x.id===item.id)))return false;return this.browse('category','',0,item.id);}
  get canLoadShelves(){return ['get_browse_categorys_list','get_player_recent_tracks','get_playlist_favorites','get_featured_playlists'].some(name=>this.advanced(name));}
  ensureShelves(){if(!this.shelvesRequested&&this.canLoadShelves)return this.loadShelves();}
  // Load the overview once per selected account; allow a manual retry on failure.
  async loadShelves(){
    const plan=[['categories',['get_browse_categorys_list']],['recent',['get_player_recent_tracks']],['recommended',['get_playlist_favorites','get_featured_playlists']]].map(([kind,names])=>[kind,names.filter(n=>this.advanced(n))]).filter(([,names])=>names.length);
    if(!plan.length)return false;
    this.shelvesRequested=true;
    return this.request('shelves',async current=>{const out={},sources={},errors=[];
      for(const [kind,names] of plan){for(const name of names){try{
        const args=name==='get_browse_categorys_list'?{refresh:false}:name==='get_player_recent_tracks'?{limit:24}:{limit:16,offset:0,...(name==='get_playlist_favorites'?{sort_result:false}:{})};
        const response=await this.callSpotify(name,args,true);if(!current())return false;
        const items=kind==='categories'?categoryItems(response).slice(0,16):mediaItems(response).slice(0,16);
        if(items.length){out[kind]=items;sources[kind]=name;break;}
      }catch(error){if(!current())return false;if(!this.blocked(name))errors.push(name);}}}
      this.shelves=out;this.shelfSources=sources;if(!Object.keys(out).length&&errors.length)throw new Error(errors.join(', '));return true;});
  }
  // Native HA media browser for players with BROWSE_MEDIA; read-only until the user starts an item.
  get canBrowse(){return this.ready&&supported(this.state,'browse');}
  get radioAvailable(){return this.canBrowse&&!!this.hass?.config?.components?.includes?.('radio_browser');}
  async nativeBrowse(kind='library',node=null){
    if(!this.canBrowse||(kind==='radio'&&!this.radioAvailable))return false;
    const target=node||(kind==='radio'?{media_content_id:'media-source://radio_browser',media_content_type:'app',title:''}:null);
    const stack=node?[...this.native.stack,node]:target?[target]:[];
    this.view='native';this.native={kind,stack,items:[],title:node?.title||''};this.emit();
    return this.request('browse',async current=>{
      const msg={type:'media_player/browse_media',entity_id:this.entityId,...(target?{media_content_id:target.media_content_id,media_content_type:target.media_content_type}:{})};
      const result=await this.hass.callWS(msg);if(!current())return false;
      this.native={kind,stack,items:nativeChildren(result),title:typeof result?.title==='string'?result.title:''};return true;});
  }
  async nativeBack(){const stack=this.native.stack.slice(0,-1);if(!stack.length)return this.nativeBrowse(this.native.kind);const parent=stack.at(-1);this.native={...this.native,stack:stack.slice(0,-1)};return this.nativeBrowse(this.native.kind,parent);}
  async nativeSearch(query){
    const q=String(query||'').trim().slice(0,200);if(!q||!this.ready||!supported(this.state,'search'))return false;
    this.view='native';this.native={kind:'search',stack:[],items:[],title:q};this.emit();
    return this.request('browse',async current=>{const result=await this.hass.callWS({type:'media_player/search_media',entity_id:this.entityId,search_query:q});if(!current())return false;this.native={kind:'search',stack:[],items:nativeChildren(result),title:q};return true;});
  }
  async nativePlay(item){
    if(!item?.native||!item.can_play||!this.can('playMedia')||!this.service('media_player','play_media'))return false;
    if(!this.native.items.includes(item))return false;
    return this.request('play-item',async()=>{await this.hass.callService('media_player','play_media',{entity_id:this.entityId,media_content_id:item.media_content_id,media_content_type:item.media_content_type});return true;});
  }
  // "Add to playlist": only playlists owned by this Spotify account (or collaborative) are offered.
  async loadOwnPlaylists(){
    if(!this.advanced('get_playlist_favorites')||!this.advanced('playlist_items_add'))return false;
    this.view='add-to-playlist';this.addedTo='';this.emit();
    return this.request('playlists',async current=>{const response=await this.callSpotify('get_playlist_favorites',{limit:50,offset:0,sort_result:true},true);if(!current())return false;
      const user=this.state?.attributes?.sp_user_id;this.ownPlaylists=mediaItems(response).filter(p=>p.uri.startsWith('spotify:playlist:')&&(p.collaborative===true||(user&&p.owner?.id===user)));return true;});
  }
  async addCurrentToPlaylist(playlist){
    const id=trackId(this.state),pid=/^spotify:playlist:([A-Za-z0-9]+)$/.exec(playlist?.uri||'')?.[1];
    if(!id||!pid||!this.ownPlaylists?.includes(playlist)||!this.advanced('playlist_items_add'))return false;
    return this.request('add',async current=>{await this.callSpotify('playlist_items_add',{playlist_id:pid,uris:'spotify:track:'+id});if(current())this.addedTo=playlist.uri;return true;});
  }
  playerVolume(entity){const s=this.hass?.states?.[entity];return available(s)&&supported(s,'volume')&&this.service('media_player','volume_set');}
  async setVolume(entity,value){
    const v=Number(value);if(!this.players.some(p=>p.entity_id===entity)||!this.playerVolume(entity)||!Number.isFinite(v))return false;
    return this.request('volume:'+entity,async()=>{await this.hass.callService('media_player','volume_set',{entity_id:entity,volume_level:Math.max(0,Math.min(1,v))});return true;});
  }
  async pauseAll(){
    const ids=this.players.filter(p=>p.state==='playing'&&supported(p,'pause')).map(p=>p.entity_id);
    if(!ids.length||!this.service('media_player','media_pause'))return false;
    return this.request('pause-all',async()=>{await this.hass.callService('media_player','media_pause',{entity_id:ids});return true;});
  }
  async loadDevices(open=true){
    if(open){this.view='devices';this.emit();}
    if(!this.advanced('get_spotify_connect_devices'))return false;
    return this.request('devices',async current=>{const response=await this.callSpotify('get_spotify_connect_devices',{refresh:false,sort_result:true},true);if(current())this.devices=connectDevices(response);return true;});
  }
  async transfer(id){
    if(!this.devices.some(d=>d.id===id)||!this.advanced('player_transfer_playback'))return false;
    return this.request('transfer',async()=>{await this.callSpotify('player_transfer_playback',{device_id:id,play:this.state?.state==='playing'});return true;});
  }
  async selectSource(source){
    if(!this.can('source')||!this.service('media_player','select_source')||typeof source!=='string'||!this.state?.attributes?.source_list?.includes(source))return false;
    return this.request('source',async()=>{await this.hass.callService('media_player','select_source',{entity_id:this.entityId,source});return true;});
  }
  // Owner 2026-11-10: the heart shows whether the playing song is one of the liked songs. One read-only lookup
  // (check_track_favorites) per new song on a Spotify account; saving or removing still needs a tap.
  _rememberLiked(items){this._liked??=new Set();for(const x of items||[]){const m=/^spotify:track:([A-Za-z0-9]+)$/.exec(x?.uri||'');if(m)this._liked.add(m[1]);}const id=trackId(this.state);if(id&&this._liked.has(id)&&this.favorite!==true){this.favorite=true;this.emit();}}
  async checkFavorite(retry=true){
    const id=trackId(this.state),epoch=this.epoch;if(!id||!this.spotify||this.pending.has('favorite'))return false;
    if(this._liked?.has(id)){this.favorite=true;this.emit();}
    if(!this.advanced('check_track_favorites')){this.favoriteUnknown=!this._liked?.has(id);this.emit();return false;}
    try{const response=await this.callSpotify('check_track_favorites',{ids:id},true);if(epoch!==this.epoch||trackId(this.state)!==id||this.pending.has('favorite'))return false;
      const saved=resultOf(response)?.[id];if(typeof saved!=='boolean')throw new Error('no status');this.favorite=saved||!!this._liked?.has(id);this.favoriteUnknown=false;if(saved)this._rememberLiked([{uri:'spotify:track:'+id}]);this.emit();return true;}
    catch{if(epoch!==this.epoch||trackId(this.state)!==id)return false;this.favoriteUnknown=!this._liked?.has(id);this.emit();
      if(retry&&!this.blocked('check_track_favorites')){clearTimeout(this._favoriteTimer);this._favoriteTimer=setTimeout(()=>this.checkFavorite(false),12000);}return false;}
  }
  async toggleFavorite(){
    const id=trackId(this.state);if(!id||!this.advanced('check_track_favorites')||!this.advanced('save_track_favorites')||!this.advanced('remove_track_favorites'))return false;
    return this.request('favorite',async current=>{
      const response=await this.callSpotify('check_track_favorites',{ids:id},true);if(!current()||trackId(this.state)!==id)return false;
      const result=resultOf(response);const saved=typeof result?.[id]==='boolean'?result[id]:null;
      if(saved===null)throw new Error('Favorite status unavailable');
      await this.callSpotify(saved?'remove_track_favorites':'save_track_favorites',{ids:id});
      if(current()&&trackId(this.state)===id){this.favorite=!saved;this._liked??=new Set();saved?this._liked.delete(id):this._liked.add(id);}return true;
    });
  }
  async playItem(item,{spotcastTarget=''}={}){
    if(!item || !/^spotify:(track|album|playlist):[A-Za-z0-9]+$/.test(item.uri || ''))return false;
    const track=item.uri.startsWith('spotify:track:');
    const name=track?'player_media_play_tracks':'player_media_play_context';
    if(this.advanced(name))return this.request('play-item',async()=>{await this.callSpotify(name,track?{uris:item.uri}:{context_uri:item.uri});return true;});
    // Optional Spotcast v6 contract: never auto-fallback after an error, never choose an arbitrary destination.
    if(!this.nativeSpotify && spotcastTarget && this.config.spotcastTargets?.includes(spotcastTarget) && available(this.hass?.states?.[spotcastTarget]) && this.service(spotcastDomain(this.hass),'play_media'))
      return this.request('play-item',async()=>{await this.hass.callService(spotcastDomain(this.hass),'play_media',{media_player:{entity_id:spotcastTarget},spotify_uri:item.uri});return true;});
    if(!this.can('playMedia')||!this.service('media_player','play_media'))return false;
    return this.request('play-item',async()=>{await this.hass.callService('media_player','play_media',{entity_id:this.entityId,media_content_id:item.uri,media_content_type:track?'music':item.uri.split(':')[1]});return true;});
  }
}

export function relevantMedia(state){return !!(state&&['playing','paused','buffering'].includes(state.state)&&(state.attributes?.media_title||state.attributes?.media_artist||state.attributes?.media_content_id));}
