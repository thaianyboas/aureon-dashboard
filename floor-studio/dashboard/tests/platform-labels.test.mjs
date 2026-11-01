import test from 'node:test';
import assert from 'node:assert/strict';
import {platformLabels} from '../platform/locales.mjs';

test('theme appearance and room light have independent localized labels',()=>{
 for(const [locale,theme,room] of [['de','Hell','Licht'],['pt','Claro','Luz'],['en','Light','Light']]){
  const labels=platformLabels(locale);
  assert.equal(labels.light,theme);
  assert.equal(labels.roomLight,room);
 }
});
