import {svg} from '../../neonplan3d-main/frontend/node_modules/lit/index.js';
// Drawn illustration for rooms without a photo (Pool, Büro, Hobbyraum …): a calm gradient and a fine line drawing
// chosen from the room name in any language. The owner's own photo (Settings › Room images) always wins.
const KINDS=[
 [/pool|schwimm|piscin|swim/i,'pool','M6 40c6-4 10-4 16 0s10 4 16 0 10-4 16 0 10 4 16 0M6 50c6-4 10-4 16 0s10 4 16 0 10-4 16 0 10 4 16 0M22 34V14a5 5 0 0 1 10 0M46 34V14a5 5 0 0 1 10 0M22 22h24M22 29h24'],
 [/büro|buero|office|escrit|arbeit|study/i,'office','M10 46h56M18 46V30h40v16M24 30l-4-14h36l-4 14M32 24h12M38 46v8M28 54h20'],
 [/hobby|atelier|werk|craft|studio/i,'hobby','M38 12c-14 0-26 10-26 24 0 8 6 12 12 12 4 0 5-3 5-6s2-5 6-5h8c8 0 13-6 13-12 0-8-8-13-18-13zM24 32h.1M30 22h.1M42 20h.1M50 28h.1'],
 [/garten|garden|jardim|terrasse|terrace/i,'garden','M38 56V36M38 36c-12 0-16-10-10-18 2-6 8-8 10-8s8 2 10 8c6 8 2 18-10 18zM16 56h44M24 56c0-6 4-8 8-8M52 56c0-6-4-8-8-8'],
 [/keller|cellar|basement|porão|porao|lager|storage/i,'cellar','M12 54h12V44h12V34h12V24h16M12 54h52M20 20h10v8H20z'],
 [/garage|garag/i,'garage','M10 54V28l28-14 28 14v26M18 54V36h40v18M22 46h32M26 42h4M46 42h4'],
 [/bad|bath|banheir|wc|dusche|shower/i,'bath','M12 34h52v6a12 12 0 0 1-12 12H24a12 12 0 0 1-12-12zM18 34V18a6 6 0 0 1 12 0M22 52l-2 4M54 52l2 4'],
 [/küche|kueche|kitchen|cozinha/i,'kitchen','M14 30h48M18 30v22h40V30M22 22h32l4 8H18zM30 40h16M38 14v8'],
 [/schlaf|bed|quarto|dorm|kinder|child/i,'bed','M10 50V22M10 40h56v10M66 50V36a6 6 0 0 0-6-6H32v10M16 34a5 5 0 1 0 10 0 5 5 0 0 0-10 0'],
 [/wohn|living|sala|lounge/i,'living','M14 36v-8a6 6 0 0 1 6-6h36a6 6 0 0 1 6 6v8M10 38a4 4 0 0 1 8 0v6h40v-6a4 4 0 0 1 8 0v12H10zM16 50v4M60 50v4'],
 [/ess|dining|jantar/i,'dining','M14 30h48M20 30v24M56 30v24M38 14v10M30 18c0 4 4 6 8 6s8-2 8-6'],
 [/flur|hall|corredor|diele|entr/i,'hall','M26 56V12h24v44M44 34h.1M14 56h48'],
 [/balkon|balcon|varand|loggia/i,'balcony','M10 34h56M10 34v20M66 34v20M10 54h56M20 34v20M30 34v20M40 34v20M50 34v20M24 26c4-10 24-10 28 0'],
 [/wasch|laundry|lavand/i,'laundry','M18 12h40v44H18zM18 22h40M38 42a8 8 0 1 0 0-.1M24 17h.1M30 17h.1'],
 [/control|technik|server|tech/i,'tech','M12 16h52v30H12zM28 54h20M38 46v8M20 26h14M20 34h20M46 26h10'],
];
export function roomArtKind(name=''){return KINDS.find(([re])=>re.test(name))?.[1]||'home';}
export function roomArt(name=''){const k=KINDS.find(([re])=>re.test(name)),path=k?k[2]:'M12 34 38 14l26 20M18 30v24h40V30M32 54V40h12v14';
 return svg`<svg class="room-art" viewBox="0 0 76 68" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="roomArtGlow" cx=".7" cy=".25" r=".9"><stop offset="0" stop-color="var(--p-accent)" stop-opacity=".28"/><stop offset=".6" stop-color="var(--p-accent)" stop-opacity=".05"/><stop offset="1" stop-color="var(--p-accent)" stop-opacity="0"/></radialGradient></defs><rect width="76" height="68" fill="#16140f"/><rect width="76" height="68" fill="url(#roomArtGlow)"/><g transform="translate(40 4) scale(.42)"><path d=${path} fill="none" stroke="var(--p-accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/></g></svg>`;}
