// Classification changes presentation only. Commands always use the original HA domain.
export const equipmentKinds=['light','outlet','switch','climate','cover','vacuum','security','media','camera','sensor','automation','technical','other'];
export const labelKey=value=>String(value||'').trim().toLowerCase().replaceAll('-','_');
export function hasSemanticLabel(row,labels,key){return (row.labels||[]).some(id=>labelKey(id)===key||labelKey(labels.find(l=>l.id===id)?.name)===key);}
export function equipmentKind(row,state,preferences={},labels=[]){
 const override=preferences.equipmentOverrides?.[row.id];if(equipmentKinds.includes(override))return override;
 if(row.entityCategory==='config'||row.entityCategory==='diagnostic')return 'technical';
 const d=row.domain,dc=state?.attributes?.device_class||row.deviceClass;
 if(d==='light')return 'light';
 if(d==='switch')return dc==='outlet'||hasSemanticLabel(row,labels,'steckdosen_dashboard')?'outlet':'switch';
 if(['lock','alarm_control_panel'].includes(d)||d==='binary_sensor'&&['door','window','opening','garage_door','motion','occupancy','safety','smoke','gas','moisture'].includes(dc))return 'security';
 if(['sensor','binary_sensor'].includes(d))return 'sensor';
 if(['scene','script','automation'].includes(d))return 'automation';
 if(d==='media_player')return 'media';
 return equipmentKinds.includes(d)?d:'other';
}
// Labels chosen by the owner in Settings decide what AUREON shows:
//  - never shown: any "hide" Label (and the semantic no_dboard Label);
//  - "show only": when set, only equipment with one of those Labels;
//  - per kind (lights, music, …): when set for a kind, only equipment of that kind with one of those Labels.
export function labelVisible(row,preferences,labels=[],kind=''){
 if(hasSemanticLabel(row,labels,'no_dboard'))return false;
 const v=preferences.labelVisibility||{},ids=row.labels||[];
 if((v.exclude||[]).some(id=>ids.includes(id)))return false;
 if((v.include||[]).length&&!(v.include||[]).some(id=>ids.includes(id)))return false;
 const perKind=kind&&preferences.labelKinds?.[kind];
 return !perKind?.length||perKind.some(id=>ids.includes(id));
}
export function equipmentMatches(row,state,{kind='',availability='',label=''}={},preferences={},labels=[]){
 return (!kind||equipmentKind(row,state,preferences,labels)===kind)&&(!label||(row.labels||[]).includes(label))&&(!availability||(availability==='available'?!['unknown','unavailable'].includes(state?.state):['unknown','unavailable'].includes(state?.state)));
}
