export const isAvailable=s=>!!s&&!['unavailable','unknown'].includes(s.state);
const bit=(s,n)=>!!(Number(s.attributes?.supported_features||0)&n);
export function actionsFor(s,services={}){
 if(!isAvailable(s))return [];
 const d=s.entity_id.split('.')[0],result=[];
 const add=(key,service,data={},sensitive=false,condition=true)=>{if(condition&&services[d]?.[service])result.push({key,domain:d,service,data,sensitive,entityId:s.entity_id});};
 if(['light','switch','input_boolean','fan'].includes(d)){add(s.state==='on'?'off':'on',s.state==='on'?'turn_off':'turn_on');}
 if(d==='cover'){add('open','open_cover',{},false,bit(s,1));add('close','close_cover',{},false,bit(s,2));add('stop','stop_cover',{},false,bit(s,8));}
 if(d==='climate'){for(const mode of s.attributes?.hvac_modes||[])add('hvac:'+mode,'set_hvac_mode',{hvac_mode:mode});}
 if(d==='lock'){add('lock','lock',{},true);add('unlock','unlock',{},true);}
 if(d==='alarm_control_panel'){add('disarm','alarm_disarm',{},true);for(const [mode,n] of [['home',1],['away',2],['night',4],['vacation',32],['custom_bypass',16]])add('arm:'+mode,'alarm_arm_'+mode,{},true,bit(s,n));}
 if(d==='automation'){add(s.state==='on'?'off':'on',s.state==='on'?'turn_off':'turn_on',{},true);add('run','trigger',{skip_condition:false},true);}
 if(d==='script')add('run','turn_on',{},true);
 if(d==='scene')add('activate','turn_on',{},true);
 if(d==='vacuum'){add('start','start',{},false,bit(s,8192));add('pause','pause',{},false,bit(s,4));add('dock','return_to_base',{},false,bit(s,16));add('stop','stop',{},false,bit(s,8));add('locate','locate',{},false,bit(s,512));}
 return result;
}
export function parameterAction(s,services,key,value){
 if(!isAvailable(s)||(typeof value==='string'&&!value.trim())||!Number.isFinite(Number(value)))return null;
 const number=Number(value),domain=s.entity_id.split('.')[0];let service,data;
 if(key==='brightness'&&domain==='light'&&(s.attributes.supported_color_modes||[]).some(x=>!['onoff','unknown'].includes(x))){service='turn_on';data={brightness_pct:Math.min(100,Math.max(0,number))};}
 if(key==='position'&&domain==='cover'&&bit(s,4)){service='set_cover_position';data={position:Math.min(100,Math.max(0,number))};}
 if(key==='temperature'&&domain==='climate'&&bit(s,1)){const min=Number(s.attributes.min_temp),max=Number(s.attributes.max_temp);if(!Number.isFinite(min)||!Number.isFinite(max)||min>max)return null;service='set_temperature';data={temperature:Math.min(max,Math.max(min,number))};}
 if(!service||!services[domain]?.[service])return null;
 return {key,domain,service,data,sensitive:false,entityId:s.entity_id};
}
