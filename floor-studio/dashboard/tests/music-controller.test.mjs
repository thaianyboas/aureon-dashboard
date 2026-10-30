import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicController, discoverPlayers, isSpotifyPlus, position, artworkUrl, connectDevices, mediaItems } from '../music/controller.mjs';
import { labels } from '../music/locales.mjs';
const features=1|2|4|16|32|512|2048|16384|32768|262144;
function fixture(){
 const calls=[];const entity='media_player.music';
 const state={entity_id:entity,state:'playing',attributes:{friendly_name:'Music',sp_user_id:'fixture',media_content_id:'spotify:track:abc',supported_features:features,media_duration:240,media_position:60,volume_level:.5,source_list:['Speaker'],shuffle:false,repeat:'off'}};
 const names=['get_spotify_connect_devices','player_transfer_playback','get_playlist_favorites','get_album_favorites','get_track_favorites','search_tracks','search_albums','search_playlists','check_track_favorites','save_track_favorites','remove_track_favorites','player_media_play_context','player_media_play_tracks'];
 const hass={user:{id:'fixture'},connection:{},states:{[entity]:state},services:{media_player:Object.fromEntries(['media_play','media_pause','media_next_track','media_previous_track','media_seek','volume_set','shuffle_set','repeat_set','select_source','play_media'].map(x=>[x,{}])),spotifyplus:Object.fromEntries(names.map(x=>[x,{}]))},callService:async(...args)=>{calls.push(args);return {response:{result:{abc:false}}};}};
 const c=new MusicController();c.setHass(hass);return {c,hass,state,calls,entity};
}
test('discovery uses actual metadata, prioritizes SpotifyPlus, and never guesses by entity name',()=>{
 const {hass,state}=fixture();hass.states['media_player.spotifyplus_fake']={...state,entity_id:'media_player.spotifyplus_fake',attributes:{}};
 assert.equal(isSpotifyPlus(hass,'media_player.spotifyplus_fake'),false);assert.equal(discoverPlayers(hass)[0].entity_id,'media_player.music');assert.equal(discoverPlayers(hass,{allowedEntities:[]}).length,0);
 assert.equal(discoverPlayers(hass,{excluded:['media_player.music']}).length,1);assert.equal(isSpotifyPlus(hass,'media_player.music',{providers:{'media_player.music':'native'}}),false);
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
 assert.equal(mediaItems({response:{result:{items:[{track:{uri:'spotify:track:abc',name:'Track'}}]}}})[0].name,'Track');assert.deepEqual(connectDevices({response:{result:{Items:[{Id:'speaker',Name:'Speaker',IsActiveDevice:true}]}}}),[{id:'speaker',name:'Speaker',active:true}]);assert.deepEqual(mediaItems({items:[{name:'Invalid',uri:'javascript:evil'}]}),[]);
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
