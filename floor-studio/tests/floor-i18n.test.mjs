import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf('_floorText(key){'),source.indexOf('async _mountFloorStudio'));
for(const language of ['pt','de','en']) test(`AUREON Floor Studio ${language} has all essential UI labels`,()=>{
 const section=block.match(new RegExp('\\b'+language+':\\{([^}]+)\\}'));
 assert.ok(section,`${language} translations missing`);
 for(const key of ['loading','retry','missing','mountError','title','region','foreign']) assert.match(section[1],new RegExp('\\b'+key+':'));
 assert.match(section[1],/title:'AUREON Floor Studio'/);
 assert.doesNotMatch(section[1],/Floor Studio · NeonPlan|NeonPlan3D original/);
});
test('HA language chooses translation and unknown languages fall back to English',()=>{
 assert.match(source,/this\._hass\?\.language/);
 assert.match(source,/labels\[language\]\|\|labels\.en/);
});
