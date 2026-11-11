import {css,unsafeCSS} from "lit";
declare const __FP3D_EDITOR_HASH__: string;
/** AUREON: a short build code next to the version, so an update can be told apart (owner 2026-11-11). */
const AUREON_BUILD=typeof __FP3D_EDITOR_HASH__==="string"?__FP3D_EDITOR_HASH__.slice(0,6).replace(/[^0-9a-z]/gi,""):"";
export const studioPanelStyles=css`
.fp3d-app{background:var(--fp3d-bg);color:var(--fp3d-text)}.fp3d-header{gap:12px;padding:12px 20px;background:var(--fp3d-chrome);border-bottom:1px solid var(--fp3d-line)}.fp3d-header h1{font:22px Georgia,serif;letter-spacing:.4px}.fp3d-header button{border:1px solid var(--fp3d-line);border-radius:10px;padding:9px 14px;font:12px var(--fp3d-font);background:transparent;color:var(--fp3d-text);min-height:38px}.fp3d-header button[aria-pressed=true]{background:var(--fp3d-accent);color:var(--fp3d-accent-text)}.fp3d-seg{border:1px solid var(--fp3d-line);border-radius:12px;padding:3px;background:color-mix(in srgb,var(--fp3d-bg2) 70%,transparent)}.fp3d-seg button{border:0;border-radius:9px}.fp3d-nav{padding:10px 16px;gap:8px}.fp3d-view-opts{border-radius:14px;background:var(--fp3d-chrome-solid);border:1px solid var(--fp3d-line);padding:12px}.fp3d-version{font-size:10px;color:var(--fp3d-muted)}@media(max-width:700px){.fp3d-header{padding:8px 10px;gap:7px;flex-wrap:wrap}.fp3d-header h1{font-size:18px}.fp3d-header .fp3d-version{display:none}.fp3d-header>button[aria-label]{font-size:0;min-width:38px}.fp3d-header>button[aria-label]:before{content:"✦";font-size:17px}.fp3d-header button{min-height:40px;padding:8px 10px}}

.fp3d-version::after{content:"${unsafeCSS(AUREON_BUILD?" · "+AUREON_BUILD:"")}"}
/* AUREON editor 2026-11-11: the editor has its own top bar; the panel bar is hidden while it is open */
.fp3d-app:has(fp3d-editor)>.fp3d-header{display:none}
`;
