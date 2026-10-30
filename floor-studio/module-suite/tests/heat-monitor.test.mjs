import test from 'node:test';
import assert from 'node:assert/strict';
import module, {reading,heatState,heatAlerts} from '../src/heat-monitor.mjs';
const hass={states:{'sensor.supply':{state:'104',attributes:{unit_of_measurement:'°F'}},'sensor.return':{state:'30',attributes:{unit_of_measurement:'°C'}},'sensor.power':{state:'1.5',attributes:{unit_of_measurement:'kW'}},'sensor.thermal':{state:'4.5',attributes:{unit_of_measurement:'kW'}},'sensor.heat_today':{state:'12000',attributes:{unit_of_measurement:'Wh'}},'sensor.el_today':{state:'4',attributes:{unit_of_measurement:'kWh'}},'binary_sensor.fault':{state:'off',attributes:{}}}};
const entities={supply:'sensor.supply',return:'sensor.return',power:'sensor.power',thermalPower:'sensor.thermal',heatToday:'sensor.heat_today',electricityToday:'sensor.el_today',fault:'binary_sensor.fault'};
test('fahrenheit temperature conversion',()=>assert.equal(reading(hass,'sensor.supply','temperature'),40));
test('power and energy conversions',()=>{assert.equal(reading(hass,'sensor.power','power'),1500);assert.equal(reading(hass,'sensor.heat_today','energy'),12)});
test('unavailable and missing readings are null',()=>{assert.equal(reading(hass,'sensor.missing'),null);assert.equal(reading({states:{x:{state:'unknown'}}},'x'),null)});
test('COP and temperature spread',()=>{const s=heatState(hass,{entities});assert.equal(s.cop,3);assert.equal(s.dailyCop,3);assert.equal(s.spread,10)});
test('no false alarm on healthy state',()=>assert.deepEqual(heatAlerts(hass,{entities},'pt'),[]));
test('fault triggers localized alert',()=>{const copy=structuredClone(hass);copy.states['binary_sensor.fault'].state='on';assert.match(heatAlerts(copy,{entities},'pt')[0].text,/Falha/)});
test('low COP alerts require opt-in',()=>{const copy=structuredClone(hass);copy.states['sensor.thermal'].state='1.5';assert.equal(heatAlerts(copy,{entities},'en').length,0);assert.equal(heatAlerts(copy,{entities,alertLowCop:true},'en').length,1)});
test('module exposes read-only api',()=>{assert.equal(module.api,1);assert.equal(module.id,'aureon.heat_monitor');assert.equal(typeof module.watched,'function')});
test('module watches configured entities',()=>{const host={building:()=>({settings:{mods:{'aureon.heat_monitor':{entities}}}})};assert.equal(module.watched(host).length,7)});

test('voice heating readings use original requested language',()=>{
 const host=(language)=>({language:()=>language,hass:()=>hass,building:()=>({settings:{mods:{'aureon.heat_monitor':{entities}}}})});
 assert.match(module.voice('como está o aquecimento',host('pt-BR')).text,/Ida 40\.0 °C, Retorno 30\.0 °C/);
 assert.match(module.voice('wie ist der status heizung',host('de-DE')).text,/Vorlauf 40\.0 °C, Rücklauf 30\.0 °C/);
 assert.match(module.voice('how is the heating',host('en-US')).text,/Supply 40\.0 °C, Return 30\.0 °C/);
});
