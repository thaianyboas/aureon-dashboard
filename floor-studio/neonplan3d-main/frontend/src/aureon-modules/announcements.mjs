// AUREON original announcements adapter. No automatic broadcasts.
export const id = 'aureon.announcements';
const STRINGS = {
 pt: {empty:'Nenhum alto-falante disponível.', sent:'Anúncio enviado.', error:'Não foi possível enviar o anúncio.'},
 de: {empty:'Kein Lautsprecher verfügbar.', sent:'Durchsage gesendet.', error:'Durchsage fehlgeschlagen.'},
 en: {empty:'No speaker available.', sent:'Announcement sent.', error:'Announcement failed.'}
};
export const locale = value => /^pt/i.test(value || '') ? 'pt' : /^de/i.test(value || '') ? 'de' : 'en';
export function areaOf(hass, entityId) {
 const item = hass?.entities?.[entityId];
 return item?.area_id || hass?.devices?.[item?.device_id]?.area_id || null;
}
export function speakersForRoom(hass, room, config = {}) {
 const explicit = config.roomSpeakers?.[room.id];
 if (typeof explicit === 'string' && /^media_player\.[a-z0-9_]+$/.test(explicit) && hass?.states?.[explicit] && !['unavailable','unknown'].includes(hass.states[explicit].state)) return [explicit];
 const candidates = Object.keys(hass?.states || {}).filter(id => id.startsWith('media_player.') && areaOf(hass,id) === room.area_id && !['unavailable','unknown'].includes(hass.states[id].state) && hass.states[id].attributes?.device_class !== 'tv');
 return candidates.sort();
}
export function resolveTargets(host, roomIds, config) {
 config = config ?? host.building?.()?.settings?.mods?.[id] ?? {};
 const hass = host.hass?.(); const building = host.building?.();
 if (!hass || !building) return [];
 const rooms = building.floors.flatMap(f => f.rooms || []).filter(r => roomIds.includes(r.id));
 const ids = rooms.flatMap(room => speakersForRoom(hass,room,config));
 // A global fallback must be explicitly enabled: a missing room mapping must not broadcast elsewhere.
 if (!ids.length && config.allowDefaultSpeaker === true && typeof config.defaultSpeaker === 'string' && /^media_player\.[a-z0-9_]+$/.test(config.defaultSpeaker) && hass.states[config.defaultSpeaker] && !['unavailable','unknown'].includes(hass.states[config.defaultSpeaker].state)) ids.push(config.defaultSpeaker);
 return [...new Set(ids)];
}
export function quietAt(date, from, to) {
 if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from > 23 || to < 0 || to > 23 || from === to) return false;
 const h = date.getHours() + date.getMinutes()/60;
 return from < to ? h >= from && h < to : h >= from || h < to;
}
export async function sendAnnouncement(host, {message, roomIds, config, now = new Date(), confirmed = false}) {
 config = config ?? host.building?.()?.settings?.mods?.[id] ?? {};
 // Never initiate an HA service call without explicit user confirmation.
 if (confirmed !== true) return {ok:false, reason:'confirmation_required', targets:[]};
 if (typeof message !== 'string' || !message.trim() || message.length > 500) return {ok:false, reason:'invalid_message', targets:[]};
 if (!Array.isArray(roomIds) || !roomIds.length) return {ok:false, reason:'no_rooms', targets:[]};
 const knownRooms = new Set((host.building?.()?.floors || []).flatMap(f => f.rooms || []).map(r => r.id));
 if (roomIds.some(roomId => typeof roomId !== 'string' || !knownRooms.has(roomId))) return {ok:false,reason:'invalid_rooms',targets:[]};
 const building = host.building?.();
 const quietRooms = new Set((building?.floors || []).flatMap(f => f.rooms || []).filter(r => quietAt(now,config.quiet?.[r.id]?.from,config.quiet?.[r.id]?.to)).map(r => r.id));
 const allowed = roomIds.filter(id => !quietRooms.has(id));
 if (!allowed.length) return {ok:false,reason:'quiet_hours',targets:[]};
 const targets = resolveTargets(host, allowed, config);
 if (!targets.length) return {ok:false, reason:'no_speaker', targets};
 if (typeof host.callService !== 'function') return {ok:false, reason:'service_unavailable', targets};
 // HA TTS is deliberately opt-in; no Alexa/notify or unverified service assumptions.
 const tts = config.ttsEntity;
 if (!tts || !/^tts\.[a-z0-9_]+$/.test(tts) || !host.hass?.()?.states?.[tts]) return {ok:false,reason:'tts_not_configured',targets};
 const results = await Promise.allSettled(targets.map(player => Promise.resolve().then(() => host.callService('tts','speak',{entity_id:tts,media_player_entity_id:player,message:message.trim(),cache:true}))));
 const failed = results.filter(r=>r.status==='rejected').length;
 return {ok:failed===0,reason:failed?'service_error':undefined,targets,failed};
}
export function announcementSheet(host, place, confirmSend = (message, roomName) => globalThis.confirm?.(`Enviar anúncio para ${roomName}?\n\n${message}`) === true) {
 const lang = locale(host.language?.());
 const room = host.building?.()?.floors?.find(f => f.id === place.floorId)?.rooms?.find(r => r.id === place.roomId);
 if (!room || host.canEdit?.() === false) return null;
 const title = lang === 'pt' ? 'Anunciar' : lang === 'de' ? 'Durchsage' : 'Announce';
 const prompt = lang === 'pt' ? 'Escreva sua mensagem' : lang === 'de' ? 'Nachricht eingeben' : 'Enter your message';
 const send = lang === 'pt' ? 'Revisar e enviar' : lang === 'de' ? 'Prüfen und senden' : 'Review and send';
 return {
  id:'aureon.announcements.room',icon:'📢',title,
  lines:[lang === 'pt' ? `Destino: ${room.name}. O envio requer confirmação.` : lang === 'de' ? `Ziel: ${room.name}. Bestätigung erforderlich.` : `Destination: ${room.name}. Confirmation required.`],
  input:{placeholder:prompt,button:send,async onSubmit(message){
   if(typeof message !== 'string' || !message.trim() || message.length > 500) return;
   if(!confirmSend(message.trim(),room.name)) return;
   const result=await sendAnnouncement(host,{message,roomIds:[room.id],confirmed:true});
   const feedback=result.ok ? STRINGS[lang].sent : `${STRINGS[lang].error} (${result.reason || 'service_error'})`;
   host.notify?.(feedback);
   return result;
  }}
 };
}
export const module = {api:1,id,roomSheets(host,place){const sheet=announcementSheet(host,place);return sheet?[sheet]:[];},help(language){const l=locale(language);return l==='pt'?['Enviar anúncio para um cômodo']:l==='de'?['Durchsage an einen Raum senden']:['Send an announcement to a room'];}};
export default module;
