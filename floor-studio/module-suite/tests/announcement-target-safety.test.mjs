import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTargets, sendAnnouncement } from '../src/announcements.mjs';

function host() {
  const calls = [];
  const hass = {states: {
    'light.kitchen': {state:'on'},
    'media_player.kitchen': {state:'idle'},
    'tts.local': {state:'idle'},
  },entities:{},devices:{}};
  return {
    calls, hass:()=>hass,
    building:()=>({floors:[{rooms:[{id:'kitchen',area_id:'kitchen',name:'Kitchen'}]}]}),
    callService:async (...args)=>{calls.push(args);}
  };
}
test('configured room target must be a media_player entity', async () => {
  const h=host();
  const config={roomSpeakers:{kitchen:'light.kitchen'},ttsEntity:'tts.local'};
  assert.deepEqual(resolveTargets(h,['kitchen'],config),[]);
  const result=await sendAnnouncement(h,{message:'hello',roomIds:['kitchen'],config,confirmed:true});
  assert.equal(result.reason,'no_speaker');
  assert.equal(h.calls.length,0);
});
test('explicit default fallback cannot target a light', () => {
  const h=host();
  assert.deepEqual(resolveTargets(h,['kitchen'],{allowDefaultSpeaker:true,defaultSpeaker:'light.kitchen'}),[]);
});
test('valid configured media_player still receives confirmed TTS', async () => {
  const h=host();
  const result=await sendAnnouncement(h,{message:'hello',roomIds:['kitchen'],config:{roomSpeakers:{kitchen:'media_player.kitchen'},ttsEntity:'tts.local'},confirmed:true});
  assert.equal(result.ok,true);
  assert.equal(h.calls.length,1);
  assert.equal(h.calls[0][0],'tts');
  assert.equal(h.calls[0][1],'speak');
  assert.equal(h.calls[0][2].media_player_entity_id,'media_player.kitchen');
});
