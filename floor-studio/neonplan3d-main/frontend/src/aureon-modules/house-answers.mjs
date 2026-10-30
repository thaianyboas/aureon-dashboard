// AUREON House Answers: read-only, deterministic home status responses.
// No remote API, service calls, microphones, or private data transmission.
export const id = 'aureon.house_answers';
const locale = l => /^pt/i.test(l||'')?'pt':/^de/i.test(l||'')?'de':'en';
const words = {
 pt:{none:'Não tenho informações suficientes para responder.',lights:'Luzes acesas',windows:'Janelas abertas',people:'Pessoas em casa',temperature:'Temperatura externa',count:'{n}',yes:'sim',no:'não'},
 de:{none:'Dafür habe ich nicht genug Informationen.',lights:'Lichter an',windows:'Offene Fenster',people:'Personen zuhause',temperature:'Außentemperatur',count:'{n}',yes:'ja',no:'nein'},
 en:{none:'I do not have enough information to answer.',lights:'Lights on',windows:'Open windows',people:'People at home',temperature:'Outside temperature',count:'{n}',yes:'yes',no:'no'}
};
export function intent(sentence){
 const s=String(sentence||'').toLowerCase();
 if(/(quantas? luzes|luzes? acesas?|wie viele lichter|lichter an|how many lights|lights on)/i.test(s))return 'lights';
 if(/(janelas? abertas?|fenster offen|fenster sind offen|offene fenster|windows? open|open windows?)/i.test(s))return 'windows';
 if(/(quem est[aá] em casa|quantas? pessoas? em casa|wer ist zu hause|personen zuhause|who is home|people at home)/i.test(s))return 'people';
 if(/(temperatura (l[aá] fora|externa)|außentemperatur|temperatur draußen|outside temperature|temperature outside)/i.test(s))return 'temperature';
 return null;
}
export function summary(host, what){
 const hass=host.hass?.(); if(!hass)return null;
 const states=hass.states||{};
 if(what==='lights')return Object.entries(states).filter(([id,s])=>id.startsWith('light.')&&s.state==='on').length;
 if(what==='windows'){
  if(typeof host.openings!=='function')return null;
  return host.openings().filter(o=>(o.kind==='window'||o.kind==='roof_window')&&(o.open||o.tilted)).length;
 }
 if(what==='people')return Object.entries(states).filter(([id,s])=>id.startsWith('person.')&&s.state==='home').length;
 if(what==='temperature'){
  const weather=host.weather?.()||Object.keys(states).find(id=>id.startsWith('weather.'));
  const st=states[weather],v=st?.attributes?.temperature;
  if(typeof v!=='number'||!Number.isFinite(v))return null;
  return /f/i.test(String(st.attributes.temperature_unit||'°C'))?(v-32)*5/9:v;
 }
 return null;
}
export const module={api:1,id,
 voice(sentence,host){const what=intent(sentence);if(!what)return null;const l=locale(host.language?.()),t=words[l],n=summary(host,what);
  if(n===null)return {text:t.none,highlight:[]};
  const val=what==='temperature'?`${n.toFixed(1)} °C`:String(n);
  return {text:`${t[what]}: ${val}.`,highlight:[]};
 },
 watched(host){return [...Object.keys(host.hass?.()?.states||{}).filter(id=>/^(light|person|weather)\./.test(id)),...(host.openings?.()||[]).map(o=>o.entity)].filter(Boolean)},
 help(l){return locale(l)==='pt'?['Quantas luzes estão acesas?','Quais janelas estão abertas?','Quem está em casa?','Qual é a temperatura lá fora?']:locale(l)==='de'?['Wie viele Lichter sind an?','Welche Fenster sind offen?','Wer ist zu Hause?','Wie ist die Außentemperatur?']:['How many lights are on?','Are any windows open?','Who is home?','What is the outside temperature?']}
};
export default module;
