// Original AUREON adapter. Integrations remain external; HA enforces service permissions.
export const FEATURES = { pause:1, seek:2, volume:4, previous:16, next:32, playMedia:512, source:2048, play:16384, shuffle:32768, browse:131072, repeat:262144, search:4194304 };
export const supported = (state, feature) => !!(Number(state?.attributes?.supported_features || 0) & FEATURES[feature]);
export const available = state => !!state && !['unknown','unavailable'].includes(state.state);
export function isSpotifyPlus(hass,id,config={}) {
  if (['native','spotifyplus'].includes(config.providers?.[id])) return config.providers[id] === 'spotifyplus';
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
export function connectDevices(response) {
  const result=resultOf(response); const list=result.Items || result.items || result.devices || [];
  return (Array.isArray(list)?list:[]).map(d=>({id:d.Id || d.id,name:d.Name || d.name,active:!!(d.IsActiveDevice || d.is_active)})).filter(d=>typeof d.id==='string' && typeof d.name==='string');
}
export const BROWSE_SERVICES={podcasts:'get_show_favorites',recent:'get_player_recent_tracks',playlists:'get_playlist_favorites',albums:'get_album_favorites',favorites:'get_track_favorites',search:'search_tracks',searchAlbums:'search_albums',searchPlaylists:'search_playlists',categories:'get_browse_categorys_list',category:'get_category_playlists'};
export function categoryItems(response){const result=resultOf(response),list=Array.isArray(result)?result:result.items || result.categories?.items || [];return (Array.isArray(list)?list:[]).filter(x=>typeof x?.name==='string' && typeof x.id==='string' && /^[A-Za-z0-9_-]{1,200}$/.test(x.id)).slice(0,500).map(x=>({...x,category:true}));}
// Native Home Assistant media browser (media_player/browse_media, media_player/search_media).
export function nativeChildren(result){const list=Array.isArray(result)?result:Array.isArray(result?.children)?result.children:Array.isArray(result?.result)?result.result:[];return list.filter(x=>x&&typeof x.title==='string'&&typeof x.media_content_id==='string'&&typeof x.media_content_type==='string').slice(0,200).map(x=>({title:x.title.slice(0,300),thumbnail:typeof x.thumbnail==='string'?x.thumbnail:'',media_content_id:x.media_content_id,media_content_type:x.media_content_type,media_class:String(x.media_class||''),can_play:!!x.can_play,can_expand:!!x.can_expand,native:true}));}
function pageContainer(response){const r=resultOf(response);return r.tracks || r.albums || r.playlists || r;}
const ADVANCED = new Set(['get_player_recent_tracks','get_featured_playlists','get_show_favorites','playlist_items_add','get_browse_categorys_list','get_category_playlists','get_spotify_connect_devices','player_transfer_playback','search_tracks','search_albums','search_playlists','get_playlist_favorites','get_album_favorites','get_track_favorites','check_track_favorites','save_track_favorites','remove_track_favorites','player_media_play_context','player_media_play_tracks']);
export class MusicController {
  constructor(){ this.listeners=new Set(); this.config={}; this.entityId='';this.hass=null;this.epoch=0;this.pending=new Set();this.error='';this.results=[];this.devices=[];this.favorite=null;this.view='player';this.libraryKind='playlists';this.query='';this._scope=null;this._track='';this.pageIndex=0;this.hasNext=false;this.categoryId='';this._categories=[];this.shelves={};this.shelfSources={};this.native={kind:'',stack:[],items:[],title:''};this.ownPlaylists=null;this.addedTo=''; }
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
    const track=trackId(this.state);if(track!==this._track){this._track=track;this.favorite=null;}
    this.emit();
  }
  get state(){return this.hass?.states?.[this.entityId];}
  get players(){return discoverPlayers(this.hass,this.config);}
  get spotify(){return isSpotifyPlus(this.hass,this.entityId,this.config);}
  get ready(){return available(this.state);}
  service(domain,name){return !!this.hass?.services?.[domain]?.[name];}
  can(feature){const services={play:'media_play',pause:'media_pause',previous:'media_previous_track',next:'media_next_track',volume:'volume_set',seek:'media_seek',shuffle:'shuffle_set',repeat:'repeat_set',source:'select_source',playMedia:'play_media'};return this.ready && supported(this.state,feature) && this.service('media_player',services[feature]);}
  advanced(name){return this.ready && this.spotify && ADVANCED.has(name) && this.service(spotifyPlusDomain(this.hass,this.entityId),name);}
  invalidate(){this.epoch++;this.error='';this.results=[];this.devices=[];this.favorite=null;this.pending.clear();this._track='';this.pageIndex=0;this.hasNext=false;this.categoryId='';this._categories=[];this.shelves={};this.shelfSources={};this.native={kind:'',stack:[],items:[],title:''};this.ownPlaylists=null;this.addedTo='';}
  reset(){this.entityId='';this.view='player';this.query='';this.invalidate();}
  select(id){if(!this.players.some(p=>p.entity_id===id))return false;this.entityId=id;this.invalidate();this.emit();return true;}
  async request(key,fn){
    if(this.pending.has(key))return false;
    const epoch=this.epoch,entity=this.entityId;this.pending.add(key);this.error='';this.emit();
    const current=()=>this.epoch===epoch && this.entityId===entity;
    try {const result=await fn(current);return current()?result:false;}catch(error){if(current())this.error=String(error?.message || error || 'Service error');return false;}
    finally{if(current()){this.pending.delete(key);this.emit();}}
  }
  async callSpotify(name,data={},response=false){
    if(!this.advanced(name))throw new Error('SpotifyPlus service unavailable');
    // Explicit entity_id selects the configured Spotify account; never infer it from an entity name.
    const result=await this.hass.callService(spotifyPlusDomain(this.hass,this.entityId),name,{...data,entity_id:this.entityId},undefined,undefined,response);
    return response ? result : true;
  }
  async command(action,value){
    const specs={play:['play','media_play',{}],pause:['pause','media_pause',{}],previous:['previous','media_previous_track',{}],next:['next','media_next_track',{}],volume:['volume','volume_set',{volume_level:Math.max(0,Math.min(1,Number(value)))}],seek:['seek','media_seek',{seek_position:Math.max(0,Math.min(position(this.state).duration,Number(value)))}],shuffle:['shuffle','shuffle_set',{shuffle:!this.state?.attributes?.shuffle}],repeat:['repeat','repeat_set',{repeat:['off','all','one'][(['off','all','one'].indexOf(this.state?.attributes?.repeat)+1)%3]}]};
    const spec=specs[action];if(!spec || !this.can(spec[0]) || !this.service('media_player',spec[1]))return false;
    if(['volume','seek'].includes(action)&&(!Number.isFinite(Number(value))||(action==='seek'&&!position(this.state).duration)))return false;
    const entity=this.entityId;
    return this.request('transport',async()=>{await this.hass.callService('media_player',spec[1],{entity_id:entity,...spec[2]});return true;});
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
        const container=pageContainer(response),items=mediaItems(response);this.results=items.slice(0,size);
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
  // Overview shelves: read-only library listings, only after an explicit user request.
  async loadShelves(){
    const plan=[['categories',['get_browse_categorys_list']],['recent',['get_player_recent_tracks']],['recommended',['get_featured_playlists','get_playlist_favorites']]].map(([kind,names])=>[kind,names.filter(n=>this.advanced(n))]).filter(([,names])=>names.length);
    if(!plan.length)return false;
    return this.request('shelves',async current=>{const out={},sources={},errors=[];
      for(const [kind,names] of plan){for(const name of names){try{
        const args=name==='get_browse_categorys_list'?{refresh:false}:name==='get_player_recent_tracks'?{limit:24}:{limit:16,offset:0,...(name==='get_playlist_favorites'?{sort_result:false}:{})};
        const response=await this.callSpotify(name,args,true);if(!current())return false;
        const items=kind==='categories'?categoryItems(response).slice(0,16):mediaItems(response).slice(0,16);
        if(items.length){out[kind]=items;sources[kind]=name;break;}
      }catch(error){if(!current())return false;errors.push(name);}}}
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
  async loadDevices(){
    this.view='devices';this.emit();
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
  async toggleFavorite(){
    const id=trackId(this.state);if(!id||!this.advanced('check_track_favorites')||!this.advanced('save_track_favorites')||!this.advanced('remove_track_favorites'))return false;
    return this.request('favorite',async current=>{
      const response=await this.callSpotify('check_track_favorites',{ids:id},true);if(!current()||trackId(this.state)!==id)return false;
      const result=resultOf(response);const saved=typeof result?.[id]==='boolean'?result[id]:null;
      if(saved===null)throw new Error('Favorite status unavailable');
      await this.callSpotify(saved?'remove_track_favorites':'save_track_favorites',{ids:id});
      if(current()&&trackId(this.state)===id)this.favorite=!saved;return true;
    });
  }
  async playItem(item,{spotcastTarget=''}={}){
    if(!item || !/^spotify:(track|album|playlist):[A-Za-z0-9]+$/.test(item.uri || ''))return false;
    const track=item.uri.startsWith('spotify:track:');
    const name=track?'player_media_play_tracks':'player_media_play_context';
    if(this.advanced(name))return this.request('play-item',async()=>{await this.callSpotify(name,track?{uris:item.uri}:{context_uri:item.uri});return true;});
    // Optional Spotcast v6 contract: never auto-fallback after an error, never choose an arbitrary destination.
    if(spotcastTarget && this.config.spotcastTargets?.includes(spotcastTarget) && available(this.hass?.states?.[spotcastTarget]) && this.service(spotcastDomain(this.hass),'play_media'))
      return this.request('play-item',async()=>{await this.hass.callService(spotcastDomain(this.hass),'play_media',{media_player:{entity_id:spotcastTarget},spotify_uri:item.uri});return true;});
    if(!this.can('playMedia')||!this.service('media_player','play_media'))return false;
    return this.request('play-item',async()=>{await this.hass.callService('media_player','play_media',{entity_id:this.entityId,media_content_id:item.uri,media_content_type:track?'music':item.uri.split(':')[1]});return true;});
  }
}

export function relevantMedia(state){return !!(state&&['playing','paused','buffering'].includes(state.state)&&(state.attributes?.media_title||state.attributes?.media_artist||state.attributes?.media_content_id));}
