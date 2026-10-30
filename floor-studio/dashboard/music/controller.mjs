// Original AUREON adapter. Integrations remain external; HA enforces service permissions.
export const FEATURES = { pause:1, seek:2, volume:4, previous:16, next:32, playMedia:512, source:2048, play:16384, shuffle:32768, repeat:262144 };
export const supported = (state, feature) => !!(Number(state?.attributes?.supported_features || 0) & FEATURES[feature]);
export const available = state => !!state && !['unknown','unavailable'].includes(state.state);
export function isSpotifyPlus(hass,id,config={}) {
  if (['native','spotifyplus'].includes(config.providers?.[id])) return config.providers[id] === 'spotifyplus';
  return hass?.entities?.[id]?.platform === 'spotifyplus' || Object.hasOwn(hass?.states?.[id]?.attributes || {},'sp_user_id');
}
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
  return (Array.isArray(list)?list:[]).map(x=>x.track || x.album || x).filter(x=>x && typeof x.name==='string' && /^spotify:(track|album|playlist):[A-Za-z0-9]+$/.test(x.uri || '')).slice(0,50);
}
export function connectDevices(response) {
  const result=resultOf(response); const list=result.Items || result.items || result.devices || [];
  return (Array.isArray(list)?list:[]).map(d=>({id:d.Id || d.id,name:d.Name || d.name,active:!!(d.IsActiveDevice || d.is_active)})).filter(d=>typeof d.id==='string' && typeof d.name==='string');
}
const ADVANCED = new Set(['get_spotify_connect_devices','player_transfer_playback','search_tracks','search_albums','search_playlists','get_playlist_favorites','get_album_favorites','get_track_favorites','check_track_favorites','save_track_favorites','remove_track_favorites','player_media_play_context','player_media_play_tracks']);
export class MusicController {
  constructor(){ this.listeners=new Set(); this.config={}; this.entityId='';this.hass=null;this.epoch=0;this.pending=new Set();this.error='';this.results=[];this.devices=[];this.favorite=null;this.view='player';this.libraryKind='playlists';this.query='';this._scope=null;this._track=''; }
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
  advanced(name){return this.ready && this.spotify && ADVANCED.has(name) && this.service('spotifyplus',name);}
  invalidate(){this.epoch++;this.error='';this.results=[];this.devices=[];this.favorite=null;this.pending.clear();this._track='';}
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
    const result=await this.hass.callService('spotifyplus',name,{...data,entity_id:this.entityId},undefined,undefined,response);
    return response ? result : true;
  }
  async command(action,value){
    const specs={play:['play','media_play',{}],pause:['pause','media_pause',{}],previous:['previous','media_previous_track',{}],next:['next','media_next_track',{}],volume:['volume','volume_set',{volume_level:Math.max(0,Math.min(1,Number(value)))}],seek:['seek','media_seek',{seek_position:Math.max(0,Math.min(position(this.state).duration,Number(value)))}],shuffle:['shuffle','shuffle_set',{shuffle:!this.state?.attributes?.shuffle}],repeat:['repeat','repeat_set',{repeat:['off','all','one'][(['off','all','one'].indexOf(this.state?.attributes?.repeat)+1)%3]}]};
    const spec=specs[action];if(!spec || !this.can(spec[0]) || !this.service('media_player',spec[1]))return false;
    if(['volume','seek'].includes(action)&&(!Number.isFinite(Number(value))||(action==='seek'&&!position(this.state).duration)))return false;
    const entity=this.entityId;
    return this.request('transport',async()=>{await this.hass.callService('media_player',spec[1],{entity_id:entity,...spec[2]});return true;});
  }
  async browse(kind='playlists',query=''){
    if(this.pending.has('browse'))return false;
    const services={playlists:'get_playlist_favorites',albums:'get_album_favorites',favorites:'get_track_favorites',search:'search_tracks',searchAlbums:'search_albums',searchPlaylists:'search_playlists'};
    const name=services[kind];if(!name || (kind.startsWith('search')&&!query.trim()))return false;
    this.view=kind.startsWith('search')?'search':'library';this.libraryKind=kind;this.query=query.trim().slice(0,200);this.results=[];this.emit();
    if(!this.advanced(name))return false;
    return this.request('browse',async current=>{const response=await this.callSpotify(name,{limit_total:20,...(kind.startsWith('search')?{criteria:this.query}:{})},true);if(current())this.results=mediaItems(response);return true;});
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
    if(spotcastTarget && this.config.spotcastTargets?.includes(spotcastTarget) && available(this.hass?.states?.[spotcastTarget]) && this.service('spotcast','play_media'))
      return this.request('play-item',async()=>{await this.hass.callService('spotcast','play_media',{media_player:{entity_id:spotcastTarget},spotify_uri:item.uri});return true;});
    if(!this.can('playMedia')||!this.service('media_player','play_media'))return false;
    return this.request('play-item',async()=>{await this.hass.callService('media_player','play_media',{entity_id:this.entityId,media_content_id:item.uri,media_content_type:track?'music':item.uri.split(':')[1]});return true;});
  }
}
