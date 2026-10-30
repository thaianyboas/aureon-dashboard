// Narrow native associations. Null permits native automatic discovery; 'none' explicitly detaches an entity.
export const bindingFields={
 room:{area_id:null,'climate.temperature':['sensor'],'climate.humidity':['sensor'],'climate.co2':['sensor']},
 furniture:{entity:['light','switch','fan','climate','media_player','vacuum','camera','alarm_control_panel','binary_sensor','sensor','input_boolean','lock','cover','water_heater','plant'],power:['sensor'],state_entity:['binary_sensor','input_boolean','person','device_tracker','switch','sensor'],room_sensor:['sensor'],status:['sensor','binary_sensor']},
 opening:{contact:['binary_sensor','sensor','input_boolean'],contact2:['binary_sensor','sensor','input_boolean'],tilt:['binary_sensor','sensor'],cover:['cover'],lock:['lock'],position:['sensor']}
};
export function bindingTargets(building){
 return (building?.floors||[]).filter(f=>typeof f.id==='string'&&typeof f.name==='string').map(f=>({
  id:f.id,name:f.name,
  targets:Object.entries({room:'rooms',furniture:'furniture',opening:'openings'}).flatMap(([kind,key])=>
   (f[key]||[]).filter(x=>typeof x.id==='string').map(x=>({
    id:x.id,kind,name:x.name||x.type||x.id,type:x.type||'',
    bindings:Object.fromEntries(Object.keys(bindingFields[kind]).map(field=>[
     field,field.startsWith('climate.')?x.climate?.[field.split('.')[1]]??null:x[field]??null
    ]))
   }))
  )
 }));
}
