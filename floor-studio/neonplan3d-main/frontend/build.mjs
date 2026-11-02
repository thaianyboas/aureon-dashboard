// Builds the two bundles into custom_components/neonplan3d/frontend and checks the size budgets.

import { build, context } from "esbuild";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";

const out = "../custom_components/neonplan3d/frontend";
const watch = process.argv.includes("--watch");

const common = {
  bundle: true,
  format: "esm",
  // older iPads stay on iOS 15/16: Safari 15 is the oldest with WebGL 2 (three.js needs it); newer syntax such as
  // static class blocks (Safari 16.4) is turned into older code, otherwise the 3D view fails to load there
  target: ["safari15", "chrome94", "firefox93", "edge94"],
  minify: !watch,
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
};

const viewerConfig = { ...common, entryPoints: ["src/viewer/viewer3d.ts"], outfile: `${out}/neonplan3d-3d.js`, define: { __FP3D_PATHTRACE_HASH__: JSON.stringify("dev") } };
// AUREON: the Real look's photo refinement (path tracing) loads only on "High" when the view rests. It borrows
// three.js from the 3D bundle (src/viewer/aureon-three-lend.ts): "three" resolves to the lent classes.
const LEND_FILE = "src/viewer/aureon-three-lend.ts";
const lentNames = () => [...readFileSync(LEND_FILE, "utf8").split("export const")[0].matchAll(/^\s+([A-Za-z0-9_]+),$/gm)].map((m) => m[1]);
const threeLent = {
  name: "aureon-three-lent",
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: "three", namespace: "aureon-three-lent" }));
    b.onLoad({ filter: /.*/, namespace: "aureon-three-lent" }, () => ({
      loader: "js",
      // every name three.js has may be imported by some module; only the lent ones are used (checkLent proves it)
      contents: `const T=globalThis.__AUREON_THREE__;if(!T)throw new Error("AUREON: three.js is not lent");\n${THREE_NAMES.map((n) => `export const ${n}=T.${n};`).join("\n")}`,
    }));
  },
};
const THREE_NAMES = Object.keys(await import("three")).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n) && n !== "default");
const pathtraceConfig = { ...common, entryPoints: ["src/pathtrace/entry.ts"], outfile: `${out}/neonplan3d-pathtrace.js`, plugins: [threeLent] };
/** The three.js names the path tracer imports must all be lent (else it would fail only on a device, at runtime). */
async function checkLent() {
  const external = { name: "three-external", setup: (b) => b.onResolve({ filter: /^three$/ }, () => ({ path: "three", external: true })) };
  const r = await build({ ...common, entryPoints: ["src/pathtrace/entry.ts"], write: false, minify: false, logLevel: "warning", plugins: [external] });
  const text = r.outputFiles[0].text, need = new Set();
  for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*"three"/g)) for (const p of m[1].split(",")) if (p.trim()) need.add(p.trim().split(/\s+as\s+/)[0]);
  const lent = new Set(lentNames()), missing = [...need].filter((n) => !lent.has(n));
  if (missing.length) throw new Error(`${LEND_FILE} lacks what the path tracer needs: ${missing.join(", ")}`);
}
// the card's visual editor only loads in the dashboard's card dialog
// the language files (lang/*.json) are fetched with a hash of their content, so a new text is never stale
const LANGS = ["fr", "es", "nl", "it", "hu", "da", "sv", "nb", "nn", "fi", "cs", "pl", "ro", "sl", "zh", "pt"];
const langHash = createHash("sha256")
  .update(LANGS.map((l) => (existsSync(`lang/${l}.json`) ? readFileSync(`lang/${l}.json`) : "")).join("\n"))
  .digest("hex")
  .slice(0, 12);
const cardEditorConfig = { ...common, entryPoints: ["src/card-editor.ts"], outfile: `${out}/neonplan3d-card-editor.js`, define: { __FP3D_LANG_HASH__: JSON.stringify(langHash) } };
// the editor is only needed by admins who open it, so it is a bundle of its own as well
// (it draws furniture previews with the 3D bundle, so it knows that bundle's hash too)
const editorConfig = (viewerHash, locateHash) => ({
  ...common,
  entryPoints: ["src/components/editor.ts"],
  outfile: `${out}/neonplan3d-editor.js`,
  define: { __FP3D_VIEWER_HASH__: JSON.stringify(viewerHash), __FP3D_LANG_HASH__: JSON.stringify(langHash), __FP3D_LOCATE_HASH__: JSON.stringify(locateHash) },
});
// the time travel (Pro) only loads when it starts; its texts come from the main bundle
const timeTravelConfig = { ...common, entryPoints: ["src/timetravel/entry.ts"], outfile: `${out}/neonplan3d-timetravel.js` };
// the fun packs (pets …) only load when one is unlocked and switched on; three.js is lent by the 3D bundle
const funConfig = { ...common, entryPoints: ["src/fun/entry.ts"], outfile: `${out}/neonplan3d-fun.js` };
// voice (the microphone probe for now) only loads when it is asked for
const voiceConfig = { ...common, entryPoints: ["src/voice/entry.ts"], outfile: `${out}/neonplan3d-voice.js` };
// the locating setup assistant only loads when an admin opens it
const locateConfig = { ...common, entryPoints: ["src/locate/entry.ts"], outfile: `${out}/neonplan3d-locate.js` };
// the import page of the website (other programs' plans to NeonPlan, in the browser): not part of the integration
const importConfig = { ...common, entryPoints: ["src/import/app.ts"], outfile: "../site/import/neonplan-import.js" };
// The main bundle loads the 3D bundle with a hash of its content in the URL, so a new 3D bundle is
// never taken from the browser cache (the integration version only changes after a restart).
// the frontend knows its own version, to notice a backend that still runs an older one
const version = JSON.parse(readFileSync("../custom_components/neonplan3d/manifest.json", "utf8")).version;
const mainConfig = (viewerHash, editorHash, cardEditorHash, timeTravelHash, funHash, voiceHash, locateHash) => ({
  ...common,
  entryPoints: ["src/main.ts"],
  outfile: `${out}/neonplan3d.js`,
  define: {
    __FP3D_VIEWER_HASH__: JSON.stringify(viewerHash),
    __FP3D_EDITOR_HASH__: JSON.stringify(editorHash),
    __FP3D_CARD_EDITOR_HASH__: JSON.stringify(cardEditorHash),
    __FP3D_TIMETRAVEL_HASH__: JSON.stringify(timeTravelHash),
    __FP3D_FUN_HASH__: JSON.stringify(funHash),
    __FP3D_VOICE_HASH__: JSON.stringify(voiceHash),
    __FP3D_LOCATE_HASH__: JSON.stringify(locateHash),
    __FP3D_VERSION__: JSON.stringify(version),
    __FP3D_LANG_HASH__: JSON.stringify(langHash),
  },
});
const hashOf = (file) => createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12);

// Self-hosted fonts (SIL OFL): latin subset of the variable weight axis, shipped with their licences.
const FONTS = [
  ["figtree", "figtree-latin-wght-normal.woff2", "figtree.woff2"],
  ["bricolage-grotesque", "bricolage-grotesque-latin-wght-normal.woff2", "bricolage-grotesque.woff2"],
];
function copyFonts() {
  mkdirSync(`${out}/fonts`, { recursive: true });
  // pictures shown in the app (a preview of a coming Pro add-on)
  mkdirSync(`${out}/images`, { recursive: true });
  copyFileSync("assets/solar-pro.jpg", `${out}/images/solar-pro.jpg`);
  // further languages, fetched by the bundles only when Home Assistant runs in them
  mkdirSync(`${out}/lang`, { recursive: true });
  for (const l of LANGS) if (existsSync(`lang/${l}.json`)) copyFileSync(`lang/${l}.json`, `${out}/lang/${l}.json`);
  for (const [pkg, file, name] of FONTS) {
    const dir = `node_modules/@fontsource-variable/${pkg}`;
    copyFileSync(`${dir}/files/${file}`, `${out}/fonts/${name}`);
    copyFileSync(`${dir}/LICENSE`, `${out}/fonts/${pkg}-LICENSE.txt`);
  }
}

// main 674 KB and 3D 812 KB on 2026-10-22 for richer module cards (a state line, a second value, a chain, cells, a hint), module markers and solid module pipes
// main 668 KB and 3D 808 KB on 2026-10-22 for what modules may draw: lines in the flow layer, surfaces over floors and lawns, labels, layered light on an item, a card curve, fields on furniture and module settings
// 3D 796 KB and editor 916 KB on 2026-10-21 for roof sections that cut each other, wings meeting a roof in valleys (#466, #605) and the ends per section
// editor 860 KB on 2026-10-19 for sloping walls, the background section and the 1.21 texts
// main 632 KB and 3D 792 KB on 2026-10-19 for wall switches and sockets (gangs with their own entities, #593) and their texts
// card editor 256 KB on 2026-10-19 for the 1.21 texts (3D lock, full screen, ceiling fan)
// main 640 KB on 2026-10-19 for the access point and the water heater (D582) and their texts
// main 648 KB on 2026-10-19 for the settings menu and the module loader texts
// editor 872 KB on 2026-10-19 for the settings menu, the side bar grip and the extra value
// main 620 KB and card editor 250 KB on 2026-10-17 for the live director (Kamera-Cockpit) and its texts; the microphone probe has its own bundle
// raised 2026-10-06 for the 1.12 round (outdoor round, hip-end solar, marker names): still small enough for old wall tablets;
// main raised to 440 KB on 2026-10-08 for the time travel's switch, texts and read-only guards (its own code loads lazily), to 450 KB the same day for room to fix things;; card editor 180 KB the same day (it carries the German and English texts)
// the time travel bundle raised to 120 KB on 2026-10-08 for phases 2/3 (the week, live edge, events sheet, summaries – loaded only when travelling)
// main 480 KB, editor 570 KB, card editor 185 KB on 2026-10-09 for Pool Pro (pool state, glass card, alerts and its texts in German and English);
// main 495 KB, editor 600 KB, card editor 190 KB the same day for the pool tool, its pipes, devices and texts
// editor 620 KB on 2026-10-10 for the wall view (furniture on a wall from the front; later pipes and cables on walls)
// editor 640 KB on 2026-10-10: the wall view grew (3D in the room, lift, turn, lock, tap into a room); the next wall update (doors, windows, runs) needs room too
// main 510 KB, 3D 760 KB, editor 680 KB, card editor 196 KB on 2026-10-10 for pipes on walls (Pool Pro: runs with a height per point,
// T-pieces, ball valves, real tubes in 3D) and their texts – the doors and windows of the wall view come next
// editor 730 KB, card editor 205 KB on 2026-10-10 for the parts' cards (connections, drawings, joining) and their texts
// editor 760 KB, card editor 210 KB on 2026-10-12 for furniture blocks, the wall view side bar and "Technik zeichnen"
// main 530 KB on 2026-10-11 for the walk through the house (its controls and texts; the walking itself lives in the 3D bundle)
// editor 770 KB on 2026-10-12 for the fun packs on the extensions page (the pets: kinds, breeds, furs, floors)
// card editor 215 KB on 2026-10-12 (it carries the German and English texts, now with the pets)
// main 540 KB on 2026-10-12 for the fun packs' switch (pets: the loader, settings and texts; the animals live in their own bundle)
// main 550 KB and editor 780 KB on 2026-10-13 for the customer wishes (air conditioner, cooktop states, one-colour lamps, watt threshold) and roof windows in the room card
// card editor 220 KB on 2026-10-13 for the cellar and ground texts (the card editor shares the language table)
// card editor 225 KB on 2026-10-13 for the floor menu texts
// main 560 KB on 2026-10-13 for the Halloween gift notice, the extension badge and the cellar texts
// editor 790 KB on 2026-10-13 for the tidied toolbar (tool and view menus)
// editor 800 KB on 2026-10-14 for the awning (form, sensors) and the 1.18.2 fixes
// main 570 KB, 3D 770 KB and card editor 230 KB on 2026-10-14 for the awnings (five kinds) and their texts
// main 590 KB, editor 820 KB, card editor 235 KB on 2026-10-15 for the household (bins, mailboxes, Haushalt Pro) and its texts
// editor 930 KB on 2026-10-23 for the locating section and the people setting in ⚙ House
// main 692 KB on 2026-10-24 (was 688): the panel microphone asks locating first and flies into the rooms of the answer; presence zones place people at furniture and doors
// locate 160 KB on 2026-10-24 (was 140): the locating setup carries its texts in 18 languages, the key helper, the Android transmitter hints and the fly switch (it only loads when an admin opens it)
// main 694 KB on 2026-10-25 (was 692): people without a tracker in Home Assistant still show where they are located (#744)
// main 696 KB on 2026-10-26 (was 694): roof windows find their room, the card checks the current floor (2.0.5)
// main 698 KB, editor 932 KB on 2026-10-26: turning roof parts (#634, #724) and its texts
// editor 934 KB, card editor 269 KB on 2026-10-26: the door's own opening angle and its texts
// main 700 KB, card editor 270 KB on 2026-10-26: the warning for unavailable contacts and its texts
// card editor 268 KB on 2026-10-25 (was 267): the texts of the invitation to the usage reports
// main 702 KB, 3D 836 KB, editor 936 KB, card editor 271 KB on 2026-10-27: sun arc, house shadow and windows glowing out at night
// 3D 816 KB on 2026-10-25 (was 812): free walls drawn as outer walls find their outside (blinds, glass), pets walk on at their own pace on tablets, door glass on both faces
// editor 941 KB on 2026-10-28: a camera's look as furniture follows the camera (#779)
// main 718 KB, editor 940 KB, card editor 272 KB on 2026-10-28: the ⚙ settings over the 3D view, modules' sheets in rooms and the ⭐ menu (announcements), detection sensors chosen per camera, and their texts
// main 722 KB, editor 944 KB, card editor 273 KB on 2026-10-28: a module's list edited entry by entry, module markers standing in rooms, the backup import's reason
// AUREON: explicit four-module approval UI and five visual themes add code.
// Main: 754 KiB. Viewer: 880 KiB allows bounded headroom over the 859.9 KiB
// physically based renderer (physical material shaders, maps and PMREM environment).
const BUDGET = { "neonplan3d-pathtrace.js": 240 * 1024 /* AUREON: photo refinement of the Real look, loaded only on "High" */, "neonplan3d.js": 754 * 1024 /* +2 KiB for merged Golden Retriever catalogue and Studio panel chrome */, "neonplan3d-fun.js": 40 * 1024, "neonplan3d-voice.js": 60 * 1024, "neonplan3d-locate.js": 160 * 1024, "neonplan3d-timetravel.js": 120 * 1024, "neonplan3d-3d.js": 944 * 1024 /* AUREON: +16 KB for own .glb furniture and room finishes (was 880); +8 KB for the Real look photo refinement (lent three.js classes, its loader); +40 KB for ambient occlusion in the live Real look (GTAO + output pass, High only) */, "neonplan3d-editor.js": 972 * 1024 /* STUDIO-UI-01: +20 KiB for native workspace rail, responsive library/inspector and mobile dock; editor-only chrome stays lazy. Original tools retained. Previous 952 KiB included own furniture and wall paint. */, "neonplan3d-card-editor.js": 278 * 1024 /* AUREON: +3 KB for the AUREON theme tokens and product name (was 273); +2 KB for shared editor strings (single-wall paint) */ };

copyFonts();
if (watch) {
  // in watch mode the hash is not tracked; a dev reload fetches the bundle anyway
  for (const c of [pathtraceConfig, viewerConfig, editorConfig("dev", "dev"), cardEditorConfig, timeTravelConfig, funConfig, voiceConfig, locateConfig, mainConfig("dev", "dev", "dev", "dev", "dev", "dev", "dev")]) await (await context(c)).watch();
} else {
  await checkLent();
  await build(pathtraceConfig);
  viewerConfig.define.__FP3D_PATHTRACE_HASH__ = JSON.stringify(hashOf(pathtraceConfig.outfile));
  copyFileSync("THIRD_PARTY_PATHTRACE.txt", `${out}/THIRD_PARTY_PATHTRACE.txt`);
  await build(viewerConfig);
  await build(locateConfig);
  const editor = editorConfig(hashOf(viewerConfig.outfile), hashOf(locateConfig.outfile));
  await build(editor);
  await build(cardEditorConfig);
  await build(timeTravelConfig);
  await build(funConfig);
  await build(voiceConfig);
  await build(importConfig);
  await build(mainConfig(hashOf(viewerConfig.outfile), hashOf(editor.outfile), hashOf(cardEditorConfig.outfile), hashOf(timeTravelConfig.outfile), hashOf(funConfig.outfile), hashOf(voiceConfig.outfile), hashOf(locateConfig.outfile)));
  let over = false;
  // old Fire-tablet WebViews (Chrome before 91, e.g. Fully Kiosk on a Fire 7) throw on an optional call with spread
  // arguments, `a?.b(...x)` – the roof failed there; lowering the target for it would cost ~11 KB, so it is banned
  for (const file of Object.keys(BUDGET)) {
    const hit = readFileSync(`${out}/${file}`, "utf8").match(/\?\.(?:[\w$]+)?\(\.\.\./);
    if (hit) {
      over = true;
      console.log(`OLD-WEBVIEW ${file}: "${hit[0]}" breaks Chrome < 91 – write it as "if (a.b) a.b(...x)"`);
    }
  }
  // the same WebViews lack newer functions (Object.hasOwn and findLast from Chrome 93/97, the toSorted family from 110)
  // and dvh (108): our own sources may not use them, and dvh only inside @supports – a dvh line with var() is not
  // dropped by an old browser, it loses the whole height (the Fire 7 showed an empty panel; idea: CasaNeon)
  const NEWER = /\bObject\.hasOwn\(|\.findLast(?:Index)?\(|\.to(?:Sorted|Reversed|Spliced)\(/;
  const sources = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(`${dir}/${e.name}`) : e.name.endsWith(".ts") && !e.name.endsWith(".test.ts") ? [`${dir}/${e.name}`] : []));
  for (const file of sources("src")) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const newer = line.match(NEWER);
      const dvh = /\d+dvh\b/.test(line) && !line.includes("@supports") && !lines.slice(Math.max(0, i - 3), i).some((l) => l.includes("@supports"));
      if (newer || dvh) {
        over = true;
        console.log(`OLD-WEBVIEW ${file}:${i + 1}: ${newer ? `"${newer[0]}" is missing in old WebViews` : "dvh outside @supports (height: 100dvh)"}`);
      }
    });
  }
  for (const [file, limit] of Object.entries(BUDGET)) {
    const size = statSync(`${out}/${file}`).size;
    const ok = size <= limit;
    over ||= !ok;
    console.log(`${ok ? "ok  " : "OVER"} ${file}: ${(size / 1024).toFixed(1)} KB (budget ${limit / 1024} KB)`);
  }
  // the import page loads once on a website, not on a wall tablet
  const importSize = statSync(importConfig.outfile).size;
  over ||= importSize > 160 * 1024;
  console.log(`${importSize <= 160 * 1024 ? "ok  " : "OVER"} site/import/neonplan-import.js: ${(importSize / 1024).toFixed(1)} KB (budget 160 KB)`);
  if (over) process.exit(1);
}
