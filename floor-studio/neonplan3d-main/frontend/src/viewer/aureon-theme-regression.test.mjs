import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const themes = readFileSync(new URL('../themes.ts', import.meta.url), 'utf8');
const shader = readFileSync(new URL('./theme.ts', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../panel.ts', import.meta.url), 'utf8');
test('five looks registered in stable shader index order', () => {
 assert.match(themes, /THEMES: Theme\[\] = \["neon", "blueprint", "day", "night", "real"\]/);
 for (const i of [0,1,3,4]) assert.match(shader, new RegExp('uTheme == ' + i));
});
test('night and real have distinct palettes', () => {
 assert.match(themes, /night: \{ night: \[\[8, 13, 25\]/);
 assert.match(themes, /real: \{ night: \[\[39, 43, 52\]/);
});
test('real keeps part of original furniture colour', () => {
 assert.match(shader, /mix\(tinted, c, 0\.18\)/);
});
test('active device colours remain unmodified before look conversion', () => {
 assert.match(shader, /if \(!line && mx > 0\.45 && sat > 0\.45\) return c;/);
});
test('AUREON shows only the Real look: no look choice in the panel, the card and the editor pass "real"', () => {
 // owner decision 2026-11-02: Real only, day and night by the sun (the other looks stay in the renderer)
 assert.match(panel, /this\._theme = "real";/);
 assert.doesNotMatch(panel, /theme_\$\{t\}/);
 const card = readFileSync(new URL('../card.ts', import.meta.url), 'utf8');
 assert.match(card, /\.theme=\$\{"real"/);
 const editor = readFileSync(new URL('../components/editor.ts', import.meta.url), 'utf8');
 assert.doesNotMatch(editor, /\.theme=\$\{"neon"\}/);
});
test('real mode does not claim PBR or photorealism', () => {
 assert.match(shader, /not PBR textures or photorealism/);
});

test('night and real structural edges do not use additive neon blending', () => {
 assert.match(shader, /theme === "day" \|\| theme === "night" \|\| theme === "real" \? NormalBlending : AdditiveBlending/);
});

test('switching looks also updates roof-window outline blending', () => {
 const viewer = readFileSync(new URL('./viewer3d.ts', import.meta.url), 'utf8');
 assert.match(viewer, /const lineMats = \[\.\.\.this\.floors\.map\(\(f\) => f\.materials\.lines\), \.\.\.\(this\.roof \? \[this\.roof\.lines, this\.roof\.winLines\] : \[\]\)\]/);
 assert.match(viewer, /for \(const m of lineMats\) \{\s*m\.blending = blending;\s*m\.needsUpdate = true;/);
});
