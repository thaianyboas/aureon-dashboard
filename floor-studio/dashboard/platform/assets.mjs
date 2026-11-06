// AUREON design assets (illustrative presets, never the user's home). Served next to the dashboard bundle in `aureon-assets/`.
export const ROOM_PRESETS=['living','kitchen','dining','bedroom','bathroom','hallway','balcony','entrance','controlroom','pool','office','hobby'];
let base=null;
export function assetBase(){
 if(base)return base;
 try{const hit=performance.getEntriesByType('resource').map(e=>e.name).find(n=>/\/aureon-dashboard\.js(\?|$)/.test(n));if(hit){base=new URL('aureon-assets/',hit).href;return base;}}catch{}
 try{const s=[...document.scripts].map(x=>x.src).find(n=>/\/aureon-dashboard\.js(\?|$)/.test(n));if(s){base=new URL('aureon-assets/',s).href;return base;}}catch{}
 return '/hacsfiles/aureon-dashboard/aureon-assets/';
}
export const assetUrl=name=>assetBase()+name;
export const presetUrl=key=>ROOM_PRESETS.includes(key)?assetUrl('room-'+key+'.webp'):'';
// Keyword match on the user's own area name or icon (any language; names are never changed or translated).
const RULES=[['pool',/pool|schwimm|piscin|swimming|whirlpool|spa\b|sauna|mdi:(pool|hot-tub)/i],['office',/b(ü|ue|u)ro|office|escrit[oó]rio|arbeitszimmer|study|despacho|bureau|ufficio|kantoor|mdi:(desk|monitor|briefcase)/i],['hobby',/hobby|atelier|werkstatt|workshop|craft|studio|bastel|ateli|mdi:(palette|hammer|guitar|easel)/i],['kitchen',/k(ü|ue|u)che|kitchen|cozinha|cocina|cuisine|cucina|keuken|kök|kjøkken|køkken|kuchnia|stove|mdi:(stove|fridge|chef)/i],['bathroom',/bad(ezimmer)?\b|bath|banheiro|baño|salle de bain|bagno|badkamer|wc|toilet|shower|mdi:(shower|bathtub|toilet)/i],['bedroom',/schlaf|bed(room)?|quarto|dormit|chambre|camera da letto|slaapkamer|sovrum|soverom|sypialnia|kinder|mdi:(bed|bunk)/i],['dining',/ess(zimmer|bereich)|dining|jantar|comedor|salle à manger|sala da pranzo|eetkamer|mdi:(silverware|table-furniture)/i],['balcony',/balkon|balcony|varanda|terras|terrace|loggia|patio|garten|garden|jardim|mdi:(balcony|flower|tree)/i],['hallway',/flur|diele|gang|hall|corredor|couloir|corridoio|gang|mdi:(door|stairs)/i],['entrance',/eingang|entr(y|ance|ada|ée)|ingresso|foyer|mdi:(door-open|home-import)/i],['controlroom',/controlroom|technik|keller|hauswirtschaft|utility|technical|server|garage|lavand|laundry|waschk|mdi:(server|washing|garage|water-boiler)/i],['living',/wohn|living|lounge|sala|salon|soggiorno|woonkamer|stue|vardagsrum|mdi:(sofa|television)/i]];
export function presetForArea(area){const text=`${area?.name||''} ${area?.icon||''}`;for(const [key,re] of RULES)if(re.test(text))return key;return '';}
globalThis.aureonAssetUrl=assetUrl;
