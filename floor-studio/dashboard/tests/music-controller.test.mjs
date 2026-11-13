import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relevantMedia, MusicController, discoverPlayers, isSpotifyPlus, position, artworkUrl, connectDevices, mediaItems } from '../music/controller.mjs';
import { labels } from '../music/locales.mjs';
const features=1|2|4|16|32|512|2048|16384|32768|262144;
function fixture(){
 const calls=[];const entity='media_player.music';
 const state={entity_id:entity,state:'playing',attributes:{friendly_name:'Music',sp_user_id:'fixture',media_content_id:'spotify:track:abc',supported_features:features,media_duration:240,media_position:60,volume_level:.5,source_list:['Speaker'],shuffle:false,repeat:'off'}};
 const names=['get_browse_categorys_list','get_category_playlists','get_spotify_connect_devices','player_transfer_playback','get_playlist_favorites','get_album_favorites','get_track_favorites','search_tracks','search_albums','search_playlists','check_track_favorites','save_track_favorites','remove_track_favorites','player_media_play_context','player_media_play_tracks'];
 const hass={user:{id:'fixture'},connection:{},states:{[entity]:state},services:{media_player:Object.fromEntries(['media_play','media_pause','media_next_track','media_previous_track','media_seek','volume_set','shuffle_set','repeat_set','select_source','play_media'].map(x=>[x,{}])),spotifyplus:Object.fromEntries(names.map(x=>[x,{}]))},callService:async(...args)=>{calls.push(args);return {response:{result:{abc:false}}};}};
 const c=new MusicController();c.setHass(hass);return {c,hass,state,calls,entity};
}
test('discovery uses actual metadata, prioritizes SpotifyPlus, and never guesses by entity name',()=>{
 const {hass,state}=fixture();hass.states['media_player.spotifyplus_fake']={...state,entity_id:'media_player.spotifyplus_fake',attributes:{}};
 assert.equal(isSpotifyPlus(hass,'media_player.spotifyplus_fake'),false);assert.equal(discoverPlayers(hass)[0].entity_id,'media_player.music');assert.equal(discoverPlayers(hass,{allowedEntities:[]}).length,0);
 assert.equal(discoverPlayers(hass,{excluded:['media_player.music']}).length,1);// The Integration selector was removed: an old stored 'native' choice must not hide a real Spotify account.
 assert.equal(isSpotifyPlus(hass,'media_player.music',{providers:{'media_player.music':'native'}}),isSpotifyPlus(hass,'media_player.music'));
});
test('hass updates and two subscribers synchronize without any service calls',()=>{
 const {c,hass,calls}=fixture();let full=0,compact=0;const a=c.subscribe(()=>full++),b=c.subscribe(()=>compact++);c.setHass(hass);assert.equal(full,1);assert.equal(compact,1);assert.equal(calls.length,0);a();b();assert.equal(c.listeners.size,0);
});
test('transport emits the exact HA service payload and feature flags gate unsupported calls',async()=>{
 const {c,calls,state}=fixture();assert.equal(await c.command('pause'),true);assert.deepEqual(calls[0].slice(0,3),['media_player','media_pause',{entity_id:'media_player.music'}]);
 state.attributes.supported_features=0;assert.equal(await c.command('next'),false);state.state='unavailable';assert.equal(await c.command('play'),false);assert.equal(calls.length,1);
});
test('volume and seek clamp values and reject non-finite inputs',async()=>{
 const {c,calls}=fixture();await c.command('volume',2);await c.command('seek',999);assert.equal(calls[0][2].volume_level,1);assert.equal(calls[1][2].seek_position,240);await c.command('seek','NaN');await c.command('volume',Infinity);assert.equal(calls.length,2);
});
test('shuffle and repeat follow backend state, not local invented state',async()=>{
 const {c,calls,state}=fixture();await c.command('shuffle');assert.equal(calls[0][2].shuffle,true);assert.equal(state.attributes.shuffle,false);await c.command('repeat');assert.equal(calls[1][2].repeat,'all');
});
test('missing services do not trigger speculative calls',async()=>{const {c,hass,calls}=fixture();hass.services={};assert.equal(await c.command('play'),false);assert.equal(await c.browse(),false);assert.equal(calls.length,0);});
test('favorite checks current account and track, then writes confirmed opposite state',async()=>{
 const {c,calls}=fixture();assert.equal(await c.toggleFavorite(),true);assert.equal(c.favorite,true);assert.deepEqual(calls.map(x=>x[1]),['check_track_favorites','save_track_favorites']);assert.equal(calls[0][5],true);assert.equal(calls[1][2].ids,'abc');assert.equal(calls[1][2].entity_id,'media_player.music');
});
test('an unknown favorite response never causes a write',async()=>{const {c,hass,calls}=fixture();hass.callService=async(...args)=>{calls.push(args);return {};};assert.equal(await c.toggleFavorite(),false);assert.equal(calls.length,1);assert.equal(c.favorite,null);assert.match(c.error,/Favorite status/);});
test('favorite read is discarded if track changes before it resolves',async()=>{
 const {c,hass,state,calls}=fixture();let finish;hass.callService=async(...args)=>{calls.push(args);return new Promise(r=>finish=r);};const action=c.toggleFavorite();state.attributes.media_content_id='spotify:track:def';c.setHass(hass);finish({response:{result:{abc:false}}});assert.equal(await action,false);assert.equal(calls.length,1);
});
test('switching account discards stale library results',async()=>{
 const {c,hass,state}=fixture();let finish;hass.callService=()=>new Promise(r=>finish=r);const request=c.browse();hass.states['media_player.other']={...state,entity_id:'media_player.other'};c.select('media_player.other');finish({response:{result:{items:[{name:'Old private playlist',uri:'spotify:playlist:old'}]}}});assert.equal(await request,false);assert.deepEqual(c.results,[]);
});
test('changing user clears results, selected account, pending state and errors',()=>{
 const {c,hass}=fixture();c.results=[{name:'Private'}];c.error='Old error';c.setHass({...hass,user:{id:'other'},states:{}});assert.equal(c.entityId,'');assert.deepEqual(c.results,[]);assert.equal(c.error,'');
});
test('service errors are caught, surfaced and never trigger fallback writes',async()=>{
 const {c,hass,calls}=fixture();hass.callService=async(...args)=>{calls.push(args);throw new Error('Not permitted');};assert.equal(await c.command('next'),false);assert.equal(c.error,'Not permitted');assert.equal(c.pending.size,0);assert.equal(calls.length,1);
});
test('duplicate transport clicks are coalesced while a service is pending',async()=>{
 const {c,hass,calls}=fixture();let finish;hass.callService=async(...args)=>{calls.push(args);return new Promise(r=>finish=r);};const first=c.command('next');assert.equal(await c.command('next'),false);finish();assert.equal(await first,true);assert.equal(calls.length,1);
});
test('SpotifyPlus response wrappers, saved tracks and capitalized Connect devices normalize',()=>{
 assert.equal(mediaItems({response:{result:{items:[{track:{uri:'spotify:track:abc',name:'Track'}}]}}})[0].name,'Track');assert.deepEqual(connectDevices({response:{result:{Items:[{Id:'speaker',Name:'Speaker',IsActiveDevice:true}]}}}),[{id:'speaker',name:'Speaker',active:true,ready:true}]);assert.deepEqual(mediaItems({items:[{name:'Invalid',uri:'javascript:evil'}]}),[]);
});
test('device transfer can only target devices actually returned by backend',async()=>{
 const {c,calls}=fixture();assert.equal(await c.transfer('guessed'),false);c.devices=[{id:'real',name:'Real'}];await c.transfer('real');assert.deepEqual(calls[0].slice(0,3),['spotifyplus','player_transfer_playback',{device_id:'real',play:true,entity_id:'media_player.music'}]);
});
test('source selection rejects sources absent from current entity source_list',async()=>{const {c,calls}=fixture();await c.selectSource('guessed');assert.equal(calls.length,0);await c.selectSource('Speaker');assert.equal(calls[0][2].source,'Speaker');});
test('browse binds account, requests response and accepts empty libraries',async()=>{const {c,hass,calls}=fixture();hass.callService=async(...args)=>{calls.push(args);return {response:{result:{items:[]}}};};assert.equal(await c.browse('albums'),true);assert.deepEqual(c.results,[]);assert.equal(calls[0][1],'get_album_favorites');assert.equal(calls[0][5],true);});
test('SpotifyPlus playback maps track and context URIs to their correct services',async()=>{const {c,calls}=fixture();await c.playItem({uri:'spotify:track:abc'});await c.playItem({uri:'spotify:album:abc'});assert.equal(calls[0][1],'player_media_play_tracks');assert.equal(calls[0][2].uris,'spotify:track:abc');assert.equal(calls[1][2].context_uri,'spotify:album:abc');await c.playItem({uri:'https://evil'});assert.equal(calls.length,2);});
test('Spotcast is optional and requires explicitly configured available destination',async()=>{
 const {c,hass,state,calls}=fixture();delete hass.services.spotifyplus;hass.services.spotcast={play_media:{}};hass.states['media_player.cast']={...state,entity_id:'media_player.cast'};c.configure({spotcastTargets:['media_player.cast']});await c.playItem({uri:'spotify:playlist:abc'},{spotcastTarget:'media_player.cast'});assert.deepEqual(calls[0].slice(0,3),['spotcast','play_media',{media_player:{entity_id:'media_player.cast'},spotify_uri:'spotify:playlist:abc'}]);
});
test('progress advances only for playing state and clamps invalid values',()=>{
 const state={state:'playing',attributes:{media_duration:100,media_position:50,media_position_updated_at:'2026-01-01T00:00:00Z'}};assert.equal(position(state,Date.parse('2026-01-01T00:00:10Z')).value,60);state.state='paused';assert.equal(position(state,Date.now()).value,50);state.attributes.media_duration=0;assert.equal(position(state).duration,0);
});
test('artwork rejects executable, data, protocol-relative and credential-bearing URLs',()=>{for(const uri of ['javascript:alert(1)','data:image/svg+xml,x','//evil/image','https://user:password@evil/image'])assert.equal(artworkUrl(uri), '');assert.equal(artworkUrl('/api/media_player_proxy/media_player.music'),'/api/media_player_proxy/media_player.music');});
test('DE/PT/EN follow HA locale and unsupported languages use English',()=>{assert.equal(labels({language:'de-DE'}).play,'Abspielen');assert.equal(labels({locale:{language:'pt-BR'}}).play,'Reproduzir');assert.equal(labels({language:'fr'}).play,'Play');});

test('search albums and playlists use their published SpotifyPlus services',async()=>{const {c,calls}=fixture();await c.browse('searchAlbums','ambient');await c.browse('searchPlaylists','focus');assert.deepEqual(calls.map(x=>x[1]),['search_albums','search_playlists']);assert.equal(calls[0][2].criteria,'ambient');});

test('manual library and search pagination use bounded offsets, never next URLs or limit_total',async()=>{
 const {c,hass,calls}=fixture();hass.callService=async(...a)=>{calls.push(a);return {response:{result:{tracks:{items:[{name:'Track',uri:'spotify:track:abc'}],total:25,next:'https://untrusted.invalid/page'}}}};};
 await c.browse('search','focus');assert.equal(c.hasNext,true);await c.changePage(1);assert.equal(c.pageIndex,1);assert.equal(calls[1][2].offset,10);assert.equal(calls[1][2].limit,10);assert.equal(calls[1][2].criteria,'focus');assert.equal('limit_total' in calls[1][2],false);await c.changePage(-1);assert.equal(c.pageIndex,0);assert.equal(await c.changePage(-1),false);
 await c.browse('albums');assert.equal(calls.at(-1)[2].limit,20);assert.equal(calls.at(-1)[2].sort_result,false);assert.equal(await c.browse('albums','',501),false);
});
test('categories page a bounded response locally and open category playlists through the correct service',async()=>{
 const {c,hass,calls}=fixture();hass.callService=async(...a)=>{calls.push(a);return {response:{result:a[1]==='get_browse_categorys_list'?Array.from({length:23},(_,i)=>({id:'category'+i,name:'Category '+i,icons:[]})):{items:[],total:0,next:null}}};};
 await c.browse('categories');assert.equal(c.results.length,20);assert.equal(c.hasNext,true);await c.changePage(1);assert.equal(c.results.length,3);assert.equal(calls.length,1);const item=c.results[0];assert.equal(await c.openCategory({...item,id:'forged'}),false);await c.openCategory(item);assert.equal(calls.at(-1)[1],'get_category_playlists');assert.equal(calls.at(-1)[2].category_id,'category20');assert.equal(c.hasNext,false);
});
test('account changes clear pagination and category caches; invalid page/category payloads send nothing',async()=>{
 const {c,hass,calls}=fixture();assert.equal(await c.browse('category','',0,'invalid/id'),false);assert.equal(await c.browse('albums','',NaN),false);assert.equal(calls.length,0);c._categories=[{name:'Private'}];c.pageIndex=4;c.hasNext=true;c.categoryId='private';c.setHass({...hass,user:{id:'next'}});assert.deepEqual(c._categories,[]);assert.equal(c.pageIndex,0);assert.equal(c.hasNext,false);assert.equal(c.categoryId,'');
});

test('home mini visibility requires meaningful active media and never treats unavailable or idle as playback',()=>{
 for(const state of ['playing','paused','buffering'])assert.equal(relevantMedia({state,attributes:{media_title:'Track'}}),true);
 for(const state of ['idle','off','unavailable','unknown'])assert.equal(relevantMedia({state,attributes:{media_title:'Stale track'}}),false);
 assert.equal(relevantMedia(null),false);assert.equal(relevantMedia({state:'playing',attributes:{}}),false);
});
import {spotifyPlusDomain,spotcastDomain} from '../music/controller.mjs';
test('AUREON Música (aureon_music) is used when installed, the originals otherwise',()=>{const hass={entities:{'media_player.a':{platform:'aureon_music'},'media_player.b':{platform:'spotifyplus'}},services:{aureon_music:{play_media:{}},spotcast:{play_media:{}}}};assert.equal(spotifyPlusDomain(hass,'media_player.a'),'aureon_music');assert.equal(spotifyPlusDomain(hass,'media_player.b'),'spotifyplus');assert.equal(spotcastDomain(hass),'aureon_music');assert.equal(spotcastDomain({services:{spotcast:{play_media:{}}}}),'spotcast');});

test('Spotify Connect devices: duplicates merged by name, restricted/nameless dropped, ready ones first',()=>{
 const list=connectDevices({response:{result:{Items:[
  {Id:'a1',Name:'Alexa - Küche',IsInDeviceList:false},{Id:'a2',Name:'Alexa - Küche ',IsInDeviceList:true},
  {Id:'tv',Name:'[LG] webOS TV',IsInDeviceList:false,IsChromeCast:true},{Id:'x',Name:'',IsInDeviceList:true},
  {Id:'r',Name:'Locked',IsInDeviceList:true,IsRestricted:true},{Id:'s',Name:'Sala de estar',IsInDeviceList:false},
  {Id:'s2',Name:'sala de estar',IsInDeviceList:false},{Id:'w',Name:'Wohnzimmer',IsActiveDevice:true,IsInDeviceList:true}]}}});
 assert.deepEqual(list.map(d=>[d.id,d.ready,d.active]),[['w',true,true],['tv',true,false],['a2',true,false],['s',false,false]]);
});

test('the heart shows the liked status of a new song with one read-only lookup',async()=>{
 const calls=[],id='media_player.account';
 const state=track=>({entity_id:id,state:'playing',attributes:{friendly_name:'Account',sp_user_id:'me',media_content_id:'spotify:track:'+track}});
 const hass={user:{id:'u'},connection:{},entities:{[id]:{platform:'aureon_music'}},states:{[id]:state('liked1')},services:{aureon_music:{check_track_favorites:{},save_track_favorites:{},remove_track_favorites:{}}},
  callService:async(...a)=>{calls.push(a);const ids=a[2]?.ids;return {response:{result:{[ids]:ids==='liked1'}}};}};
 const c=new MusicController();c.setHass(hass);
 assert.equal(c.favorite,null);
 await new Promise(r=>setTimeout(r,900));
 assert.equal(c.favorite,true);
 assert.deepEqual(calls.map(x=>[x[0],x[1],x[2].ids]),[['aureon_music','check_track_favorites','liked1']]);
 hass.states[id]=state('other2');c.setHass({...hass});
 assert.equal(c.favorite,null);
 await new Promise(r=>setTimeout(r,900));
 assert.equal(c.favorite,false);
 assert.ok(calls.every(x=>x[1]==='check_track_favorites'));// never saves or removes by itself
});

test('Spotify "Forbidden" features are remembered and not asked again; no Home Assistant error toast',async()=>{
 const calls=[],id='media_player.acc2',mem=new Map();globalThis.localStorage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
 const hass={user:{id:'u'},connection:{},entities:{[id]:{platform:'aureon_music'}},states:{[id]:{entity_id:id,state:'idle',attributes:{sp_user_id:'me'}}},services:{aureon_music:{get_browse_categorys_list:{},get_featured_playlists:{},get_playlist_favorites:{},get_player_recent_tracks:{}}},
  callService:async(...a)=>{calls.push(a);if(['get_browse_categorys_list','get_featured_playlists'].includes(a[1]))throw new Error('Validation error: Forbidden');return {response:{result:{items:a[1]==='get_playlist_favorites'?[]:[{name:'P',uri:'spotify:playlist:abc'}]}}};}};
 const c=new MusicController();c.setHass(hass);
 await c.loadShelves();
 assert.ok(calls.every(x=>x[4]===false),'notifyOnError must be false');
 assert.equal(c.error,'');
 assert.equal(c.advanced('get_featured_playlists'),false);assert.equal(c.advanced('get_browse_categorys_list'),false);
 calls.length=0;await c.loadShelves();
 assert.ok(!calls.some(x=>['get_browse_categorys_list','get_featured_playlists'].includes(x[1])));
 const again=new MusicController();again.setHass(hass);assert.equal(again.advanced('get_featured_playlists'),false); // remembered
 delete globalThis.localStorage;
});

test('liked songs from the Favoritos list fill the heart when the check is not available',async()=>{
 const id='media_player.acc3';
 const hass={user:{id:'u'},connection:{},entities:{[id]:{platform:'aureon_music'}},states:{[id]:{entity_id:id,state:'playing',attributes:{sp_user_id:'me',media_content_id:'spotify:track:fav1'}}},services:{aureon_music:{get_track_favorites:{}}},
  callService:async()=>({response:{result:{items:[{track:{name:'Fav',uri:'spotify:track:fav1'}}]}}})};
 const c=new MusicController();c.setHass(hass);
 await c.browse('favorites');
 assert.equal(c.favorite,true);
});

test('hidden speakers are validated and kept in the music preferences',async()=>{
 const {validatePreferences,defaults}=await import('../platform/preferences.mjs');
 const out=validatePreferences({...defaults(),music:{...defaults().music,hiddenSpeakers:['sc:alexa - küche','media_player.tv','sc:alexa - küche','<script>',' ',42]}});
 assert.deepEqual(out.music.hiddenSpeakers,['sc:alexa - küche','media_player.tv']);
});

test('native Spotify uses the chosen account and unwraps HA entity service responses',async()=>{
 const {c,hass,calls}=fixture();
 const entity=c.entityId;
 hass.states[entity].attributes.aureon_music_native=true;
 hass.services.aureon_music={native_read:{},native_write:{}};
 hass.callService=async(...args)=>{
   calls.push(args);
   return {response:{[entity]:{result:{devices:[{id:'native-device',name:'Native speaker'}]}}}};
 };
 assert.equal(c.advanced('get_browse_categorys_list'),false);
 assert.equal(await c.loadDevices(),true);
 assert.deepEqual(c.devices.map(device=>device.id),['native-device']);
 assert.deepEqual(calls[0].slice(0,3),['aureon_music','native_read',{
   entity_id:entity,action:'get_spotify_connect_devices',arguments:{refresh:false,sort_result:true},
 }]);
 assert.equal(await c.transfer('native-device'),true);
 assert.deepEqual(calls[1].slice(0,3),['aureon_music','native_write',{
   entity_id:entity,action:'player_transfer_playback',arguments:{device_id:'native-device',play:true},
 }]);
});
test('play with no active Spotify speaker wakes the chosen speaker; pause then does nothing (owner 2026-11-12)',async()=>{
 const {c,hass,state,calls}=fixture();state.attributes.source='Wohnung Musik';
 const noDevice=new Error('Validation error: Spotify device or item unavailable (404)');
 hass.callService=async(...args)=>{calls.push(args);if(args[0]==='media_player')throw noDevice;if(args[1]==='get_spotify_connect_devices')return {response:{result:{Items:[{Id:'d1',Name:'Alexa - Küche'},{Id:'d2',Name:'Wohnung Musik'}]}}};return {};};
 assert.equal(await c.command('play'),true);
 const transfer=calls.find(x=>x[1]==='player_transfer_playback');
 assert.ok(transfer,'playback moves to a speaker');assert.equal(transfer[2].device_id,'d2');assert.equal(transfer[2].play,true);
 calls.length=0;assert.equal(await c.command('pause'),true);assert.equal(c.error,'');
 hass.callService=async()=>{throw new Error('Not permitted');};assert.equal(await c.command('play'),false);
});
test('play and pause show at once and do not hold the busy spinner (owner 2026-11-13)',async()=>{
 const {c,hass,state}=fixture();state.state='playing';
 let finish;hass.callService=()=>new Promise(r=>{finish=r;});
 const job=c.command('pause');
 assert.equal(c.isPlaying,false,'the button shows paused at once');
 assert.equal(c.pending.has('transport'),false,'no spinner on the transport buttons');
 assert.equal(await c.command('play'),false,'a second press while the first is on its way is ignored');
 assert.equal(c.isPlaying,false);
 finish();assert.equal(await job,true);
 state.state='paused';assert.equal(c.isPlaying,false);assert.equal(c.optimistic,null);
 hass.callService=async()=>{throw new Error('Spotify denied this action');};
 assert.equal(await c.command('play'),false);assert.equal(c.isPlaying,false,'a failed press shows the real state again');
});
