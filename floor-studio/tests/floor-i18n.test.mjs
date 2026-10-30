import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../aureon-dashboard.js',import.meta.url),'utf8');
for(const language of ['pt','de','en']) test(`Floor Studio ${language} has all essential UI labels`,()=>{
 const section=source.match(new RegExp('\\b'+language+':\\{([^}]+)\\}'));
 assert.ok(section,`${language} translations missing`);
 for(const key of ['loading','retry','missing','helpers','mountError','title','description','view','editor','reload','fullscreen','note','adminOnly','viewerOnly','frameError','reopening']) assert.match(section[1],new RegExp('\\b'+key+':'));
});
test('HA language chooses translation and unknown languages fall back to English',()=>{
 assert.match(source,/this\._hass\?\.language/);
 assert.match(source,/labels\[language\]\|\|labels\.en/);
});
