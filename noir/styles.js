import { css } from 'lit';

// Theme tokens (set on :host by the element): --bg --card --card2 --sunk --raise --line --line2
// --fg --mut --dim --accent --on-accent. Container queries keep every width readable (no text truncation).
export const styles = css`
:host{display:block;container-type:inline-size;font-family:Geist,Inter,system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--fg);-webkit-font-smoothing:antialiased;font-feature-settings:'tnum' 1}
*{box-sizing:border-box}
button{font:inherit;color:inherit;cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.55}
button:focus-visible,input:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
.mono{font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
.page{position:relative;min-height:100vh;color:var(--fg);padding:20px clamp(12px,3vw,40px) 72px;background:var(--pagebg);transition:background 1s}
.wrap{max-width:1400px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
.eyebrow{font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.h2{margin:0;font-size:22px;font-weight:400;letter-spacing:-.025em;overflow-wrap:break-word}
.h2 small{font-size:14px;color:var(--mut)}
.wordmark{font-size:15px;font-weight:500;letter-spacing:.42em;color:var(--accent)}
.row{display:flex;align-items:center;gap:10px}
.wrapRow{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.sp{justify-content:space-between}
.grow{flex:1;min-width:0}
.txt{overflow-wrap:break-word;min-width:0}
.muted{color:var(--mut)}.dim{color:var(--dim)}
svg.i{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
svg.i.s{width:14px;height:14px}svg.i.f{fill:currentColor;stroke:none}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.08);opacity:1}}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes orbit{to{transform:rotate(360deg)}}
@keyframes flow{to{stroke-dashoffset:-24}}
.pulse{animation:pulse 2s ease-in-out infinite}.breathe{animation:breathe 6s ease-in-out infinite}.rise{animation:rise .5s cubic-bezier(.2,.7,.2,1) both}
@media (prefers-reduced-motion:reduce){.pulse,.breathe,.rise,.eq i,.orbit{animation:none!important}}
.eq{display:inline-flex;align-items:flex-end;gap:2px;height:11px}.eq i{width:2px;height:11px;border-radius:1px;background:currentColor;transform-origin:bottom;animation:eq .9s ease-in-out infinite}
.eq i:nth-child(2){animation-duration:.7s}.eq i:nth-child(3){animation-duration:1.1s}.eq.off i{animation-play-state:paused}

/* header */
.top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
.chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:14px;border:1px solid var(--line);background:var(--card);font-size:13px;color:var(--fg2)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border-radius:14px;border:1px solid var(--line);background:var(--card);font-size:13px;font-weight:500;color:var(--fg2)}
.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.btn.sm{min-height:36px;padding:0 14px;border-radius:999px;font-size:12px;border-color:var(--line2);background:transparent}
.btn.sm.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.ib{width:44px;height:44px;flex:none;display:inline-flex;align-items:center;justify-content:center;border-radius:14px;border:1px solid var(--line2);background:var(--raise);color:var(--fg)}
.ib.sm{width:36px;height:36px;border-radius:10px}
.ib.ghost{border:0;background:transparent}
.avatars{display:inline-flex;align-items:center;min-height:44px;padding:0 6px;border-radius:14px;border:1px solid var(--line);background:var(--card)}
.av{position:relative;width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;border:2px solid var(--card);background:var(--raise);color:var(--accent);background-size:cover;background-position:center}
.av+.av{margin-left:-8px}.av b{position:absolute;right:-2px;bottom:-2px;width:9px;height:9px;border-radius:50%;border:2px solid var(--card);background:var(--dim)}.av b.home{background:#7EE0A8}
.menu{position:absolute;right:0;top:52px;z-index:70;width:min(300px,86vw);padding:8px;border-radius:18px;background:var(--raise);border:1px solid var(--line2);box-shadow:0 30px 80px -20px rgba(0,0,0,.85);display:flex;flex-direction:column;gap:2px}
.mi{display:flex;align-items:center;gap:12px;min-height:48px;padding:6px 10px;border:0;border-radius:12px;background:transparent;text-align:left}
.mi[aria-checked="true"]{background:rgba(255,255,255,.05)}
.sw{position:relative;width:34px;height:34px;flex:none;border-radius:10px;overflow:hidden}.sw i{position:absolute;right:6px;bottom:6px;width:14px;height:14px;border-radius:50%}

/* edit banner */
.banner{position:sticky;top:8px;z-index:30;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;border-radius:18px;background:var(--raise);border:1px solid var(--accent);box-shadow:0 24px 70px -30px rgba(0,0,0,.9)}

/* hero */
.hero{position:relative;overflow:hidden;background:var(--card2);border:1px solid var(--line);border-radius:28px;padding:clamp(16px,2.2vw,26px);display:flex;flex-wrap:wrap;gap:20px}
.hero .glow{position:absolute;width:700px;height:700px;left:-260px;top:-380px;border-radius:50%;pointer-events:none;transition:background 1s}
.heroL{position:relative;flex:1 1 300px;min-width:240px;display:flex;flex-direction:column;justify-content:space-between;gap:16px}
.clock{font-size:clamp(56px,5.6vw,88px);font-weight:200;letter-spacing:-.07em;line-height:.85}
.greet{margin:4px 0 0;font-size:clamp(20px,1.7vw,24px);font-weight:400;letter-spacing:-.025em}
.story{margin:0;max-width:460px;font-size:15px;line-height:1.6;color:var(--mut)}
.heroR{position:relative;flex:2 1 460px;min-width:0;display:flex;flex-direction:column;gap:6px}
.seg{display:inline-flex;gap:2px;padding:3px;border-radius:11px;background:var(--sunk);border:1px solid var(--line)}
.seg button{min-height:32px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:var(--mut);font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.08em}
.seg button[aria-pressed="true"]{background:var(--fg);color:var(--bg)}
.stage{position:relative;height:300px;perspective:1800px;display:flex;align-items:center;justify-content:center}
.iso{position:relative;width:min(440px,84%);aspect-ratio:16/10;transform-style:preserve-3d;transform:translateY(6px) rotateX(56deg) rotateZ(-38deg)}
.ground{position:absolute;inset:-28px;border-radius:22px;background-color:var(--sunk);background-image:radial-gradient(var(--line2) 1px,transparent 1.2px);background-size:14px 14px;border:1px solid var(--line);box-shadow:0 60px 120px -40px rgba(0,0,0,.9)}
.r3{position:absolute;padding:0;border-radius:3px;transform-style:preserve-3d;transition:background .5s,border-color .5s,box-shadow .5s,transform .5s}
.r3 .w{position:absolute;transition:background .5s}
.r3 .wt{left:0;top:0;width:100%;transform-origin:top;transform:rotateX(90deg)}
.r3 .wb{left:0;bottom:0;width:100%;transform-origin:bottom;transform:rotateX(-90deg)}
.r3 .wl{left:0;top:0;height:100%;transform-origin:left;transform:rotateY(-90deg)}
.r3 .wr{right:0;top:0;height:100%;transform-origin:right;transform:rotateY(90deg)}
.r3 .halo{position:absolute;left:15%;top:15%;width:70%;height:70%;border-radius:50%;transform:translateZ(28px);filter:blur(16px);transition:opacity .5s}
.lbls{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s}.stage.ready .lbls{opacity:1}
.lbls .lbl{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) translateY(var(--dy,0px));display:flex;flex-direction:column;align-items:center;gap:3px;white-space:nowrap;padding:4px 8px;border-radius:10px;background:color-mix(in srgb,var(--bg) 55%,transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.lbl .n{font-family:'Geist Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;white-space:normal;max-width:132px;text-align:center;line-height:1.25}
.dots{display:inline-flex;gap:3px}.dots i{width:5px;height:5px;border-radius:50%}
.plan2d{--g:0px;position:relative;width:100%;aspect-ratio:16/8;min-height:240px;max-height:330px;margin-top:8px}
.r2{position:absolute;display:grid;grid-template-rows:auto 1fr auto;align-items:start;justify-items:start;text-align:left;padding:14px 16px;overflow:hidden;color:var(--fg);font:inherit;cursor:pointer;transition:background .4s,box-shadow .4s,border-color .4s,color .3s}
.r2 .pool{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .5s}
.r2.lit .pool{opacity:1}
.r2 .n{position:relative;font-family:'Geist Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);overflow-wrap:anywhere;max-width:100%}
.r2 .tp{position:relative;align-self:center;font-size:clamp(22px,3vw,40px);font-weight:200;letter-spacing:-.04em;line-height:1;color:var(--fg)}
.r2 .tp small{font-size:.5em;vertical-align:top;margin-left:1px;color:var(--mut)}
.r2 .mt{position:relative;display:flex;align-items:center;gap:8px;width:100%;font-size:12px;color:var(--dim)}
.r2 .lc{display:inline-flex;align-items:center;gap:5px}.r2 .lc .i{width:13px;height:13px}
.r2 .lc.on{color:rgb(var(--rgb))}
.r2 .dots{display:inline-flex;gap:4px;margin-left:auto}.r2 .dots i{width:6px;height:6px;border-radius:50%}
.r2.lit .n{color:var(--fg)}
/* A · Planta de arquiteto: rooms share hairline walls, a thicker outer wall, light washes the floor. */
.ps-a{border:2px solid color-mix(in srgb,var(--fg) 22%,transparent);border-radius:6px;background:linear-gradient(var(--sunk),var(--sunk)),repeating-linear-gradient(45deg,transparent 0 6px,rgba(255,255,255,.015) 6px 7px);box-shadow:inset 0 0 0 6px var(--bg),inset 0 0 0 7px var(--line)}
.ps-a .r2{border:1px solid color-mix(in srgb,var(--fg) 14%,transparent);border-radius:0;background:transparent;margin:-.5px}
.ps-a .r2.out{border-style:dashed;background:repeating-linear-gradient(135deg,transparent 0 8px,rgba(255,255,255,.025) 8px 9px)}
.ps-a .r2 .pool{background:radial-gradient(70% 80% at 50% 50%,rgba(var(--rgb),calc(.12 + .3 * var(--k))) 0%,rgba(var(--rgb),0) 75%)}
.ps-a .r2:hover{background:rgba(255,255,255,.02)}
.ps-a .r2.sel{box-shadow:inset 0 0 0 1.5px var(--accent);z-index:2}.ps-a .r2.sel .n{color:var(--accent)}
.ps-a .r2::after{content:'';position:absolute;left:16px;bottom:-1px;width:22%;max-width:60px;height:2px;background:var(--sunk);opacity:.9}
/* B · Vidro: floating glass tiles, light glows from below, gold ring when chosen. */
.ps-b{--g:5px;border-radius:24px}
.ps-b .r2{border-radius:18px;border:1px solid rgba(255,255,255,.07);background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.012) 60%);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 18px 40px -24px rgba(0,0,0,.9);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.ps-b .r2.out{border-style:dashed;background:rgba(255,255,255,.015)}
.ps-b .r2 .pool{background:radial-gradient(90% 70% at 50% 110%,rgba(var(--rgb),calc(.18 + .45 * var(--k))) 0%,rgba(var(--rgb),0) 70%)}
.ps-b .r2.lit{border-color:rgba(var(--rgb),calc(.2 + .35 * var(--k)));box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 calc(18px + 40px * var(--k)) -12px rgba(var(--rgb),.7)}
.ps-b .r2.sel{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 0 26px -6px color-mix(in srgb,var(--accent) 60%,transparent)}.ps-b .r2.sel .n{color:var(--accent)}
/* C · Noite: no boxes — rooms are pools of their own light on a dark floor, separated by fine gold seams. */
.ps-c{border-radius:22px;overflow:hidden;background:radial-gradient(120% 90% at 50% 0%,#141416 0%,#0a0a0b 70%);border:1px solid var(--line)}
.ps-c .r2{border:0;border-radius:0;background:transparent;box-shadow:inset -1px 0 0 color-mix(in srgb,var(--accent) 16%,transparent),inset 0 -1px 0 color-mix(in srgb,var(--accent) 16%,transparent)}
.ps-c .r2 .pool{background:radial-gradient(60% 65% at 50% 55%,rgba(var(--rgb),calc(.2 + .5 * var(--k))) 0%,rgba(var(--rgb),.05) 55%,rgba(var(--rgb),0) 80%);filter:blur(4px)}
.ps-c .r2 .tp{color:color-mix(in srgb,var(--fg) 82%,transparent)}
.ps-c .r2.out .n::after{content:' ·';opacity:.5}
.ps-c .r2.sel{background:color-mix(in srgb,var(--accent) 7%,transparent)}.ps-c .r2.sel .n{color:var(--accent)}
.ps-c .r2.sel::before{content:'';position:absolute;left:16px;right:16px;top:0;height:2px;background:var(--accent);box-shadow:0 0 12px var(--accent)}

/* scenes */
.scenes{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(150px,45%),1fr));gap:10px}
.scene{position:relative;overflow:hidden;min-height:108px;padding:18px;border-radius:22px;text-align:left;display:flex;flex-direction:column;justify-content:space-between;gap:10px;background:var(--card);border:1px solid var(--line);transition:border-color .3s,box-shadow .3s,transform .3s}
.scene .orb{position:absolute;width:220px;height:220px;right:-70px;top:-100px;border-radius:50%;transition:opacity .5s;pointer-events:none}
.scene b{position:relative;font-size:17px;font-weight:500;letter-spacing:-.02em;overflow-wrap:break-word}

/* live */
.live{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));grid-auto-rows:1fr;gap:12px}
.live>.act{min-height:0}
.act{position:relative;overflow:hidden;min-height:170px;padding:20px;border-radius:24px;background:var(--card);border:1px solid var(--line);display:flex;flex-direction:column;justify-content:space-between;gap:14px;transition:border-color .4s,box-shadow .4s}
.act .ttl{font-size:18px;font-weight:500;letter-spacing:-.02em;overflow-wrap:break-word}
.tag{font-family:'Geist Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.ring{position:relative;width:72px;height:72px;flex:none}.ring svg{transform:rotate(-90deg)}.ring span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.pills{display:flex;flex-wrap:wrap;gap:6px}.pill{min-height:26px;padding:3px 10px;border-radius:999px;display:inline-flex;align-items:center;font-size:12px;border:1px solid var(--line2);color:var(--dim)}
.bins{display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:6px}
.bin{display:flex;flex-direction:column;gap:6px;padding:10px 8px;border-radius:12px;background:var(--sunk);border:1px solid var(--line)}
.bin i{width:100%;height:4px;border-radius:2px}.bin b{font-size:12px;font-weight:500;overflow-wrap:break-word}
.rrooms{display:grid;grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:8px 4px}
.bar{position:relative;height:6px;border-radius:3px;background:var(--line2);overflow:hidden}.bar i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;transition:width 1s linear}

/* filters */
.filters{position:sticky;top:0;z-index:20;margin:0 -8px;padding:10px 8px;display:flex;flex-direction:column;gap:10px;background:color-mix(in srgb,var(--bg) 84%,transparent);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.scroller{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.scroller::-webkit-scrollbar{display:none}
.rc{flex:none;display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px 0 12px;border-radius:14px;font-size:13px;font-weight:500;white-space:nowrap;border:1px solid var(--line);background:var(--card);transition:all .25s}
/* Owner 2026-11-18: the chosen room shines in the theme colour (gold in Noir), not white. */
.rc[aria-pressed="true"]{background:var(--accent);color:var(--on-accent);border-color:var(--accent);box-shadow:0 0 18px color-mix(in srgb,var(--accent) 35%,transparent)}
.rc[aria-pressed="true"] i{background:var(--on-accent)!important;box-shadow:none!important}
.rc[aria-pressed="true"] small{color:inherit;opacity:.75}
.rc i{width:8px;height:8px;border-radius:50%}
.rc small{font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;font-weight:400;opacity:.65}
.dc{flex:none;min-height:36px;padding:0 12px;border-radius:10px;font-size:12px;white-space:nowrap;border:1px solid var(--line);background:transparent;color:var(--mut);transition:all .25s}
.dc[aria-pressed="true"]{color:var(--fg)}

/* sections & tiles */
.sec{display:flex;flex-direction:column;gap:12px}
.sech{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:10px;padding:0 4px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));gap:10px}
.grid.w{grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr))}
.tile{position:relative;overflow:hidden;padding:16px;border-radius:20px;background:var(--card);border:1px solid var(--line);display:flex;flex-direction:column;gap:14px;transition:border-color .35s,opacity .25s,transform .2s}
.tile.ghosted{opacity:.45}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:10px;align-items:start}
.pgrp{border-radius:18px;background:var(--card);border:1px solid var(--line);overflow:hidden;transition:border-color .3s}
.pgrp.lit{border-color:color-mix(in srgb,var(--accent) 20%,var(--line))}
.phead{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:10px 14px;border:0;background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.phead:disabled{cursor:default;opacity:1}
.pdot{width:32px;height:32px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--raise);color:var(--dim)}
.pgrp.lit .pdot{background:color-mix(in srgb,var(--accent) 16%,transparent);color:var(--accent)}
.pname{flex:1;min-width:0;font-size:15px;font-weight:500}
.pmeta{font-size:12px;color:var(--mut);white-space:nowrap}.pmeta b{font-weight:500;color:var(--fg)}
.pchev{color:var(--mut);transition:transform .3s}.pgrp.open .pchev{transform:rotate(180deg)}
.plist{border-top:1px solid var(--line)}
.prow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:12px;min-height:52px;padding:6px 14px 6px 58px}
.prow+.prow{border-top:1px solid color-mix(in srgb,var(--line) 70%,transparent)}
.pnm{font-size:14px;color:var(--fg2)}.prow.on .pnm{color:var(--fg)}
.pst{font-size:12px;color:var(--dim);white-space:nowrap}.prow.on .pst{color:var(--fg)}
.prow.na{opacity:.55}
.plock{display:flex;width:44px;justify-content:center;color:var(--mut)}
.lrow{grid-template-columns:minmax(0,1fr) auto auto;row-gap:2px}
.lname{display:flex;align-items:center;gap:10px;min-width:0;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.lbulb{flex:none;width:8px;height:8px;border-radius:50%;background:var(--line2)}
.lrow.on .lbulb{background:rgb(var(--lc));box-shadow:0 0 10px 1px rgba(var(--lc),.8)}
.lrng{grid-column:1 / -1;margin:0 0 8px 18px;height:3px}
@container (max-width:460px){.prow{padding-left:14px}}
.byplug{display:inline-flex;align-items:center;gap:6px;margin-top:4px;font-size:11px;color:var(--mut)}
.spinarc{transform-origin:36px 36px;animation:spin 1.6s linear infinite}
.sectog{display:inline-flex;align-items:center;gap:10px;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;min-height:44px}
.secchev{display:inline-flex;width:28px;height:28px;flex:none;border-radius:50%;align-items:center;justify-content:center;border:1px solid var(--line2);color:var(--mut);transition:transform .3s}
.sech.closed .secchev{transform:rotate(-90deg)}
.sec:has(> .sech.closed) > :not(.sech){display:none !important}
.sech.closed{opacity:.85}
.msheet{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:color-mix(in srgb,#09090a 88%,transparent);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);animation:msin .35s cubic-bezier(.25,.8,.25,1)}
@keyframes msin{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.mshead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 14px 10px 20px;border-bottom:1px solid var(--line)}
.mstitle{font-family:'Playfair Display','Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;font-style:italic;font-size:24px}
.msbody{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:10px 12px 16px;display:flex;flex-direction:column;gap:10px}
.msbody .mrow{flex-wrap:wrap;overflow:visible}
.vline{display:flex;align-items:center;gap:10px;flex:1 1 220px;max-width:360px;margin-left:auto}
.vpm{width:40px;height:40px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--line2);background:var(--raise);color:var(--accent);cursor:pointer;transition:background .2s,transform .1s}
.vpm:active{transform:scale(.92);background:color-mix(in srgb,var(--accent) 18%,var(--raise))}
.vrange{flex:1;min-width:60px;height:28px;margin:0;-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer}
.vrange::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 55%,#000),var(--accent)) 0 0/var(--v) 100% no-repeat,var(--line2)}
.vrange::-moz-range-track{height:3px;border-radius:2px;background:var(--line2)}
.vrange::-moz-range-progress{height:3px;border-radius:2px;background:var(--accent)}
.vrange::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;margin-top:-7.5px;border-radius:50%;background:color-mix(in srgb,var(--accent) 35%,#fff);box-shadow:0 0 0 5px color-mix(in srgb,var(--accent) 16%,transparent),0 2px 8px rgba(0,0,0,.8)}
.vrange::-moz-range-thumb{width:18px;height:18px;border:0;border-radius:50%;background:color-mix(in srgb,var(--accent) 35%,#fff)}
.vrange:focus-visible{outline:none}.vrange:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px var(--accent)}
.vnum{width:26px;text-align:right;font-size:13px;color:var(--fg2)}
@container (max-width:460px){.vline{flex-basis:100%;max-width:none;margin-left:0}}
.offchk{min-width:44px;height:32px;flex:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 10px;border-radius:999px;border:1.5px solid var(--line2);background:transparent;color:var(--mut);font:inherit;font-size:12px;cursor:pointer}
.offchk.on{border-color:#FF8A80;background:rgba(255,138,128,.14);color:#FFB1AA}
.willoff{padding:12px 14px;border-radius:12px;background:var(--sunk);border:1px solid var(--line);font-size:13px;color:var(--mut);line-height:1.45}
.willoff.some{border-color:rgba(255,138,128,.45);color:#FFD3CF;background:rgba(255,138,128,.08)}
.lbsel{display:flex;flex-direction:column;gap:6px}
.lbsel select{min-height:44px;padding:0 40px 0 14px;border-radius:12px;border:1px solid var(--line2);background:var(--sunk) url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23A1A1AA%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>') no-repeat right 14px center/16px;color:var(--fg);font:inherit;font-size:14px;-webkit-appearance:none;appearance:none}
.lblist{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.lbrow{display:flex;align-items:center;gap:12px;min-height:58px;padding:8px 10px 8px 14px;background:var(--sunk)}
.lbrow+.lbrow{border-top:1px solid var(--line)}
.lbrow .grow{display:flex;flex-direction:column;gap:2px}.lbrow b{font-weight:500;font-size:14px}.lbrow .muted{font-size:11px}
.lbdot{width:10px;height:10px;border-radius:50%;flex:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--fg) 6%,transparent)}
.lbic{width:34px;height:34px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--lc) 18%,transparent);color:var(--lc);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--lc) 35%,transparent);--mdc-icon-size:18px}
.lbic:empty::after{content:'';width:10px;height:10px;border-radius:50%;background:var(--lc)}
.lbic.sm{width:24px;height:24px;border-radius:7px;--mdc-icon-size:14px}
.lbseg{display:inline-flex;flex:none;padding:3px;border-radius:999px;background:var(--bg);border:1px solid var(--line)}
.lbseg button{min-height:30px;padding:0 10px;border:0;border-radius:999px;background:transparent;color:var(--mut);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.lbseg button[aria-checked="true"].normal{background:var(--raise);color:var(--fg)}
.lbseg button[aria-checked="true"].include{background:rgba(126,224,168,.16);color:#9FEBC0}
.lbseg button[aria-checked="true"].exclude{background:rgba(255,138,128,.16);color:#FFB1AA}
.lbsys{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:14px;border:1px dashed var(--line2)}
@container (max-width:460px){.lbrow{flex-wrap:wrap}.lbseg{width:100%;justify-content:space-between}.lbseg button{flex:1;white-space:normal;line-height:1.15;padding:4px 6px;font-size:11.5px}.lbexp{padding-left:0}}
.ppl{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
.pp{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:3px 12px 3px 3px;border-radius:999px;background:color-mix(in srgb,var(--fg) 4%,transparent);border:1px solid var(--line);color:var(--fg);font:inherit;text-align:left;cursor:pointer;transition:background .2s}
.pp:hover{background:color-mix(in srgb,var(--fg) 8%,transparent)}
.ppmap{display:inline-flex;color:var(--mut);margin-left:2px}
.ppav{width:30px;height:30px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--raise) center/cover;font-size:12px;font-weight:600;color:var(--fg2);box-shadow:0 0 0 2px var(--line2)}
.pp.home .ppav{box-shadow:0 0 0 2px #7EE0A8}.pp.coming .ppav{box-shadow:0 0 0 2px var(--accent)}
.pp b{display:block;font-size:12px;font-weight:500;line-height:1.2}.pp small{display:block;font-size:11px;color:var(--mut);line-height:1.2}
.pp.coming small{color:var(--accent)}
.sheet>*{flex-shrink:0}
.sthead{position:sticky;top:-22px;z-index:3;display:flex;flex-direction:column;gap:12px;margin:-22px -22px 0;padding:18px 22px 12px;background:var(--raise);border-bottom:1px solid var(--line)}
.sttabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:3px;border-radius:14px;background:var(--sunk);border:1px solid var(--line)}
.sttabs::-webkit-scrollbar{display:none}
.sttabs button{flex:1 0 auto;min-height:38px;padding:0 14px;border:0;border-radius:11px;background:transparent;color:var(--mut);font:inherit;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap}
.sttabs button[aria-selected="true"]{background:var(--accent);color:var(--on-accent)}
/* Owner 2026-11-18: the note and the "Salvo" pill share one footer line — never on top of each other. */
.stfoot{position:sticky;bottom:-22px;z-index:4;margin:0 -2px -22px;min-height:40px;display:flex;align-items:center;justify-content:center;padding:8px 2px 22px;background:linear-gradient(to top,var(--raise) 78%,transparent);font-size:11px;text-align:center}
.saved{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;box-shadow:0 8px 20px -8px rgba(0,0,0,.8);border-radius:999px;font-size:12px;animation:msin .3s ease;white-space:nowrap}
.saved.all{background:rgba(126,224,168,.14);color:#9FEBC0}.saved.local{background:rgba(255,200,120,.14);color:#FFD49A}
.lbexp{flex-basis:100%;font-size:12px;color:var(--mut);padding-left:46px}
.lbrow{flex-wrap:wrap}
.act.ph{border-style:dashed;border-color:var(--line2);background:transparent}
.applcfg{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:16px;background:var(--sunk);border:1px solid var(--line)}
.mall{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:46px;padding:0 14px;border-radius:12px;border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line));background:color-mix(in srgb,var(--accent) 6%,transparent);color:var(--accent);font:inherit;font-size:13px;font-weight:500;cursor:pointer}
.mpage{display:flex;flex-direction:column;gap:14px}.mpbar{display:flex;align-items:center;gap:10px}
.mlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:2px 16px}
.mli{display:grid;grid-template-columns:48px minmax(0,1fr) 34px;align-items:center;gap:14px;min-height:64px;padding:8px 6px;border:0;border-radius:12px;background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer;transition:background .2s}
.mli:hover,.mli:focus-visible{background:color-mix(in srgb,var(--fg) 5%,transparent)}
.mcov{position:relative;width:48px;height:48px;border-radius:8px;overflow:hidden;box-shadow:0 8px 18px -10px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.06)}
.mtx{display:flex;flex-direction:column;gap:3px;min-width:0}
.mtx b{font-size:14px;font-weight:500;line-height:1.3}
.mtx span{font-size:12px;color:var(--mut);line-height:1.3}
.mplay{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--mut);border:1px solid var(--line2);transition:all .2s}
.mli:hover .mplay{color:var(--on-accent);background:var(--accent);border-color:var(--accent)}
.mli.cur b{color:var(--accent)}.mli.cur .mplay{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,transparent)}
.alexa{display:flex;align-items:center;gap:12px;min-height:52px;padding:6px 8px 6px 14px;border-radius:14px;background:var(--sunk);border:1px solid var(--line);font-size:14px;color:var(--fg2)}
.alexa>.i{color:var(--mut)}
.vrooms{display:grid;grid-template-columns:repeat(auto-fit,minmax(56px,1fr));gap:6px}
.vr{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--dim);min-width:0}
.vr i{height:4px;border-radius:2px;background:var(--line2)}
.vr.done{color:var(--mut)}.vr.done i{background:color-mix(in srgb,#7EE0A8 45%,var(--line2))}
.vr.now{color:var(--fg)}.vr.now i{background:#7EE0A8;box-shadow:0 0 10px #7EE0A8}
.ekv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@container (min-width:700px){.ekv:has(>div:nth-child(5)){grid-template-columns:repeat(3,minmax(0,1fr))}.ekv:not(:has(>div:nth-child(5))){grid-template-columns:repeat(4,minmax(0,1fr))}}
.ekv>div{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:14px;background:var(--sunk);border:1px solid var(--line)}
.ekv b{font-size:22px;font-weight:300;letter-spacing:-.03em}.ekv small{font-size:12px;color:var(--mut);font-weight:400}
.ekv .soon{opacity:.45}
.act.wst{position:relative;overflow:hidden;gap:10px;padding:18px 20px}
.wwrap{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:10px;height:100%}
.act.wst.urgent{border-color:color-mix(in srgb,var(--accent) 40%,var(--line))}
.wglow{position:absolute;left:-30px;top:10px;width:210px;height:210px;pointer-events:none;opacity:.55}
.wtag{position:relative;color:var(--accent)}.act.wst:not(.urgent) .wtag{color:var(--mut)}
.whero{position:relative;display:flex;align-items:center;gap:16px;margin-top:2px}
.wbins{position:relative;display:flex;flex:none;align-items:flex-end}
.wb{width:50px;height:auto;overflow:visible;filter:drop-shadow(0 18px 18px rgba(0,0,0,.55))}
.wb .lid{transform-box:view-box;transform-origin:7px 13px;transition:transform .8s cubic-bezier(.3,.8,.2,1)}
.wb.open .lid{transform:rotate(-24deg)}
.wb.back{width:40px;margin-left:-14px;order:-1;opacity:.92}
.wb.sm{width:30px;filter:drop-shadow(0 6px 6px rgba(0,0,0,.5))}
.wtxt{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-width:0;flex:1}
.wname{font-family:'Playfair Display','Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;font-style:italic;font-size:26px;line-height:1.05;letter-spacing:-.01em}
.wsub{font-size:13px;color:var(--mut)}
.wbtn{display:inline-flex;align-items:center;gap:6px;margin-top:4px;min-height:32px;padding:0 12px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);background:transparent;color:var(--accent);font:inherit;font-size:13px;font-weight:500;transition:background .25s,color .25s}
.wbtn:hover{background:var(--accent);color:var(--on-accent)}
.wok{display:inline-flex;align-items:center;gap:6px;margin-top:4px;font-size:13px;color:var(--accent)}
.wshelf{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding-top:10px;border-top:1px solid var(--line)}
.wsi{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:6px;row-gap:1px;align-items:center;min-width:0}
.wdot{width:7px;height:10px;border-radius:2px;grid-row:1}
.wsi .mono{grid-column:2}
.wsi b{font-size:12px;font-weight:500;line-height:1.2}.wsi .mono{font-size:10px;color:var(--mut);letter-spacing:.06em}
.tile.mini{padding:10px 12px;gap:6px;border-radius:16px}.tile.mini .tbtn{min-height:40px}.tile.mini .ic{width:36px;height:36px}
.sgrid{grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:8px}
.tile .orb{position:absolute;width:180px;height:180px;left:-60px;top:-80px;border-radius:50%;transition:opacity .5s;pointer-events:none}
.tbtn{position:relative;display:flex;align-items:center;gap:12px;min-height:44px;padding:0;border:0;background:transparent;text-align:left;width:100%}
.ic{width:40px;height:40px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--raise);color:var(--dim);transition:all .35s}
.nm{display:flex;flex-direction:column;gap:2px;min-width:0}
.nm b{font-size:14px;font-weight:500;overflow-wrap:break-word}.nm span{font-size:12px;color:var(--mut);overflow-wrap:break-word}
.rng{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;margin:10px 0;cursor:pointer;background:var(--line2);position:relative}
.rng::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--fg);box-shadow:0 0 0 4px rgba(0,0,0,.35)}
.rng::-moz-range-thumb{width:18px;height:18px;border:0;border-radius:50%;background:var(--fg)}
.switch{width:52px;height:44px;flex:none;padding:0;border:0;background:transparent;display:flex;align-items:center;justify-content:flex-end}
.switch span{width:44px;height:26px;border-radius:999px;display:flex;align-items:center;padding:3px;background:var(--line2);transition:background .25s}
.switch span i{width:20px;height:20px;border-radius:50%;background:#F2F2F3;transition:transform .25s}
.switch[aria-checked="true"] span{background:var(--accent)}.switch[aria-checked="true"] span i{transform:translateX(18px)}
.badge{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:3px 10px;border-radius:999px;font-size:11px;border:1px solid var(--line2);background:var(--raise);color:var(--fg2)}
.cts{display:flex;gap:6px}.cts button{flex:1;min-height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;border:1px solid var(--line2);background:transparent;color:var(--mut)}
.cts button i{width:8px;height:8px;border-radius:50%}
.dial{position:relative;width:104px;height:104px;flex:none}
.dial .t{position:absolute;inset:0;border-radius:50%;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 9px),#000 calc(100% - 8px));mask:radial-gradient(farthest-side,transparent calc(100% - 9px),#000 calc(100% - 8px))}
.dial .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.dial .c b{font-size:28px;font-weight:200;letter-spacing:-.05em;line-height:1}
.blind{position:relative;width:52px;flex:none;min-height:84px;border-radius:10px;overflow:hidden;background:linear-gradient(180deg,#1B2233 0%,#121620 100%);border:1px solid #222838}
.blind i{position:absolute;left:0;right:0;top:0;transition:height 1s linear}
.cam{position:relative;aspect-ratio:16/10;border-radius:20px;overflow:hidden;background:var(--sunk);border:1px solid var(--line)}
.cam img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cam .foot{position:absolute;left:0;right:0;bottom:0;padding:30px 14px 12px;display:flex;justify-content:space-between;align-items:flex-end;gap:8px;background:linear-gradient(180deg,rgba(8,8,10,0),rgba(8,8,10,.85));color:#F2F2F3}
.livep{position:absolute;top:12px;left:12px;display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;background:rgba(8,8,10,.6);font-family:'Geist Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.1em;color:#F2F2F3}
.livep i{width:6px;height:6px;border-radius:50%;background:#FF6B5E}
.editbar{position:relative;z-index:3;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:4px;padding:4px;border-radius:12px;background:color-mix(in srgb,var(--sunk) 92%,transparent);border:1px solid var(--line2)}
.editbar.abs{position:absolute;left:10px;right:10px;top:10px}
.editbar .ent{flex:1 1 100%;order:-1;padding:2px 4px 0;font-family:'Geist Mono',ui-monospace,monospace;font-size:10px;color:var(--dim);overflow-wrap:anywhere}
.editbar input{flex:1 1 140px;min-width:0;min-height:36px;padding:0 10px;border-radius:9px;border:1px solid var(--accent);background:var(--raise);color:var(--fg);font:inherit;font-size:13px;outline:none}
.editbar .q{flex:1 1 100%;font-size:12px;color:var(--fg2);padding:2px 4px;line-height:1.4}
.dragover{outline:2px dashed var(--accent);outline-offset:3px}
.editing .tile,.editing .cam{outline:1px dashed rgba(242,242,243,.18);outline-offset:4px}

/* energy */
.flowbox{position:relative;height:230px}
.node{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;transition:opacity .5s}
.node .o{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}
.kv div{display:flex;flex-direction:column;gap:4px;padding:12px;border-radius:14px;background:var(--sunk)}
.kv b{font-size:18px;font-weight:300}

/* music */
.player{position:relative;overflow:hidden;padding:clamp(18px,2.4vw,28px);border-radius:28px;background:var(--card2);border:1px solid var(--line);display:flex;flex-direction:column;gap:20px;align-items:stretch}
.art{position:relative;flex:none;width:min(100%,340px);align-self:center;aspect-ratio:1/1;border-radius:22px;overflow:hidden;background:var(--sunk);box-shadow:0 40px 80px -30px rgba(0,0,0,.9)}
.art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.art .o1,.art .o2{position:absolute;border-radius:50%}
.art .o1{width:75%;height:75%;left:-12%;top:-8%}.art .o2{width:80%;height:80%;right:-18%;bottom:-18%;animation-delay:-3s}
.trk{font-size:clamp(24px,3vw,38px);font-weight:300;letter-spacing:-.04em;line-height:1.08;overflow-wrap:break-word}
.play{width:64px;height:64px;border:0;border-radius:50%;background:var(--fg);color:var(--bg);display:flex;align-items:center;justify-content:center;flex:none}
.round{width:48px;height:48px;border-radius:50%;border:1px solid var(--line2);background:transparent;display:flex;align-items:center;justify-content:center;flex:none}

/* weather */
.wx{display:flex;flex-direction:column;gap:10px;padding-top:14px;border-top:1px solid var(--line);max-width:460px}
.wxi{display:inline-flex;flex:none}
.hours{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px}
.hr{display:flex;flex-direction:column;align-items:center;gap:4px;padding:2px 0}
/* reminders */
.pushes{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:10px;align-items:start}
.push{display:flex;align-items:center;gap:12px;padding:14px;border-radius:20px;background:color-mix(in srgb,var(--raise) 88%,transparent);border:1px solid var(--line2);backdrop-filter:blur(18px);box-shadow:0 18px 50px -24px rgba(0,0,0,.8)}
.pi{width:36px;height:36px;flex:none;border-radius:11px;display:flex;align-items:center;justify-content:center}
/* modes */
.modes{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(170px,45%),1fr));gap:10px}
.mode{display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-height:132px;padding:16px;border-radius:22px;background:var(--card);border:1px solid var(--line);text-align:left;transition:border-color .3s,box-shadow .3s}
.mode[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 24px 70px -34px var(--accent)}
.overlay{position:fixed;inset:0;z-index:90;display:flex;align-items:flex-end;justify-content:center;padding:16px;background:rgba(5,5,6,.6);backdrop-filter:blur(6px)}
.sheet{width:min(520px,100%);max-height:calc(100vh - 32px);overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:22px;border-radius:26px;background:var(--raise);border:1px solid var(--line2);box-shadow:0 40px 100px rgba(0,0,0,.6)}
.chk{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:14px;background:var(--sunk);border:1px solid var(--line)}
.chk b{font-size:14px;font-weight:500}
@container (min-width:720px){.overlay{align-items:center}}
/* reminders bar, cameras, robot map */
.pushbar{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:6px 14px 6px 8px;border-radius:16px;border:1px solid var(--line);background:var(--card);text-align:left}
.camhit{position:absolute;inset:0;z-index:2;border:0;background:transparent;cursor:zoom-in}
.cam .foot,.cam .livep{pointer-events:none;z-index:1}
.robmap{position:relative;display:block;width:100%;aspect-ratio:16/9;max-height:240px;padding:0;border-radius:14px;overflow:hidden;border:1px solid var(--line2);background:var(--sunk);cursor:zoom-in}
.robmap img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
@container (max-width:640px){.hideNarrow{display:none}}
/* compact music */
.mcard{position:relative;overflow:hidden;padding:14px;border-radius:22px;background:var(--card2);border:1px solid var(--line);display:flex;flex-direction:column;gap:12px}
.mcard.jzc{padding:0;gap:0;background:#09090a;border-color:color-mix(in srgb,var(--accent) 20%,transparent)}
.mcard.jzc>.mctl,.mcard.jzc>.mlib,.mcard.jzc>.txt{margin:0 16px}.mcard.jzc>.mctl{padding:12px 0 2px}.mcard.jzc>.mlib{margin-top:10px;padding-bottom:16px}
.stg{--k:1.5;position:relative;overflow:hidden;min-height:380px;padding:28px 32px 34px;display:flex;flex-direction:column;justify-content:space-between;gap:24px;border-bottom:1px solid var(--line)}
.sglow{position:absolute;right:-6%;top:-30%;width:60%;height:120%;pointer-events:none;background:radial-gradient(closest-side,color-mix(in srgb,var(--accent) 24%,transparent) 0%,transparent 100%);opacity:.35;transition:opacity 1.4s}
.stg.on .sglow{opacity:1}
.bigv{position:absolute;width:600px;height:600px;right:-260px;top:50%;margin-top:-300px;pointer-events:none}
.bigv .vinyl{position:absolute;inset:0;border-radius:50%;
  background:
    radial-gradient(circle,transparent 0 31%,rgba(255,255,255,.05) 31.4%,transparent 32.2% 35.4%,rgba(255,255,255,.035) 35.8%,transparent 36.4%),
    radial-gradient(circle,transparent 0 52%,rgba(0,0,0,.55) 52.4% 53.2%,transparent 53.6% 70%,rgba(0,0,0,.55) 70.4% 71.1%,transparent 71.5% 85.5%,rgba(0,0,0,.5) 85.9% 86.5%,transparent 86.9%),
    repeating-radial-gradient(circle,#0e0e10 0 .55px,#151518 .55px 1.1px,#101012 1.1px 1.7px),
    #111113;
  box-shadow:-40px 10px 90px rgba(0,0,0,.92),0 0 0 1px rgba(255,255,255,.07),inset 0 0 0 2px #050506,inset 0 0 0 3px rgba(255,255,255,.07),inset 0 0 40px rgba(0,0,0,.7);
  animation:spin 2.2s linear infinite;animation-play-state:paused}
.stg.on .bigv .vinyl{animation-play-state:running}
.bigv .label{position:absolute;inset:33.5%;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.85),0 0 0 5px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.18),inset 0 0 18px rgba(0,0,0,.45)}
.bigv .label::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 50%,transparent 0 30%,rgba(0,0,0,.18) 31%,transparent 33%),linear-gradient(135deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 40%)}
.bigv .sheen{position:absolute;inset:0;border-radius:50%;pointer-events:none;mix-blend-mode:screen;
  background:
    conic-gradient(from 0deg,rgba(255,255,255,0) 0deg 25deg,rgba(255,240,215,.10) 45deg,rgba(255,240,215,.22) 58deg,rgba(255,240,215,.10) 72deg,rgba(255,255,255,0) 95deg 205deg,rgba(255,240,215,.12) 222deg,rgba(255,244,225,.30) 238deg,rgba(255,240,215,.12) 254deg,rgba(255,255,255,0) 275deg 290deg,rgba(200,215,255,.07) 304deg,rgba(255,255,255,0) 318deg 360deg);
  -webkit-mask:radial-gradient(circle,transparent 0 33.5%,#000 34.5% 98.8%,transparent 99.3%);mask:radial-gradient(circle,transparent 0 33.5%,#000 34.5% 98.8%,transparent 99.3%)}
.bigv .spindle{position:absolute;left:calc(50% - 5px);top:calc(50% - 5px);width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f4f4f5,#8a8a90 60%,#3a3a3e);box-shadow:0 1px 2px rgba(0,0,0,.8)}
.stg .arm{position:absolute;width:calc(120px * var(--k));height:calc(230px * var(--k));right:calc(20px - 10px * var(--k));top:calc(20px - 10px * var(--k));overflow:visible;pointer-events:none;transform-origin:91.67% 4.35%;transform:rotate(-24deg);transition:transform 1.3s cubic-bezier(.35,.75,.25,1);filter:drop-shadow(-6px 14px 10px rgba(0,0,0,.75))}
.stg.on .arm{transform:rotate(0deg)}
.arm .base{fill:#18181b;stroke:var(--accent);stroke-width:1.4}.arm .hub{fill:var(--accent)}
.arm .cw{fill:color-mix(in srgb,var(--accent) 65%,#000)}
.arm .rod{fill:none;stroke:var(--accent);stroke-width:2.6;stroke-linecap:round}.arm .head{fill:var(--accent)}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.bigv .vinyl{animation:none}.stg .arm{transition:none}}
.kwrap{display:inline-flex;align-items:center;gap:10px;margin-left:auto}
.kval{font-size:12px;color:var(--mut);min-width:22px;text-align:right}
.knob{position:relative;width:56px;height:56px;flex:none;border-radius:50%;cursor:grab;touch-action:none;outline:none}
.knob:focus-visible{box-shadow:0 0 0 2px var(--accent)}
.knob svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.knob .ktrack{fill:none;stroke:var(--line2);stroke-width:2;stroke-linecap:round}
.knob .kval2{fill:none;stroke:var(--accent);stroke-width:2.4;stroke-linecap:round;filter:drop-shadow(0 0 4px color-mix(in srgb,var(--accent) 70%,transparent))}
.kcap{position:absolute;inset:9px;border-radius:50%;background:radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 0 55%,rgba(0,0,0,.25) 100%),conic-gradient(from 0deg,#2a2a2e,#46464c,#1e1e22,#3c3c42,#232327,#46464c,#2a2a2e);box-shadow:0 6px 14px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.18),inset 0 -1px 0 rgba(0,0,0,.6)}
.kcap i{position:absolute;left:50%;top:5px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--accent);box-shadow:0 0 6px var(--accent)}
.stxt{position:relative;display:flex;flex-direction:column;gap:10px;max-width:min(560px,58%);text-shadow:0 2px 18px rgba(0,0,0,.85)}
.stime{font-size:11px;color:var(--mut);letter-spacing:.08em}
.sctl{position:relative;display:flex;align-items:center;gap:14px}
.sctl .ib.sm{width:44px;height:44px;background:rgba(9,9,10,.55);border-color:rgba(255,255,255,.14);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.sprog{position:absolute;left:0;right:0;bottom:0;width:100%;height:14px;margin:0;-webkit-appearance:none;appearance:none;background:linear-gradient(var(--accent),var(--accent)) 0 100%/var(--p) 3px no-repeat,linear-gradient(rgba(255,255,255,.08),rgba(255,255,255,.08)) 0 100%/100% 3px no-repeat;cursor:pointer}
.sprog::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;margin-top:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px var(--accent);opacity:0;transition:opacity .2s}
.sprog:hover::-webkit-slider-thumb,.sprog:focus-visible::-webkit-slider-thumb{opacity:1}
.sprog::-moz-range-thumb{width:12px;height:12px;border:0;border-radius:50%;background:var(--accent)}
.sprog::-webkit-slider-runnable-track{height:14px;background:transparent}
.jtag{display:flex;align-items:center;gap:8px;color:var(--accent);font-family:'Geist Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase}
.jtitle{font-family:'Playfair Display','Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;font-style:italic;font-weight:400;font-size:clamp(30px,4vw,54px);line-height:1.06;letter-spacing:-.015em;color:var(--fg)}
.jartist{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--mut)}
.jplay{width:62px;height:62px;background:var(--accent);color:var(--on-accent);box-shadow:0 14px 44px -10px color-mix(in srgb,var(--accent) 75%,transparent)}
.jz .rng{height:3px}
.sleeve{position:relative;display:block;width:100%;padding-right:12%}
.sleeve .disc{position:absolute;right:0;top:6%;width:88%;aspect-ratio:1/1;border-radius:50%;background:repeating-radial-gradient(circle,#0a0a0b 0 1.2px,#18181a 1.2px 2.4px);transition:transform .4s}
.cover:hover .disc,.cover:focus-visible .disc{transform:translateX(10%)}
.sleeve .sl{box-shadow:0 10px 20px -10px rgba(0,0,0,.9)}
.mctl{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px 18px;flex-wrap:wrap}
.mvol{flex:1 1 200px;max-width:320px;gap:8px}
.mchips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -2px;padding:0 2px}.mchips::-webkit-scrollbar{display:none}
.mchips .dc{min-height:34px}
.art.sm{width:76px;align-self:center;border-radius:14px;box-shadow:0 16px 32px -18px rgba(0,0,0,.9)}
.mlib{position:relative;display:flex;flex-direction:column;gap:10px;padding-top:10px;border-top:1px solid var(--line)}
.mrow{display:flex;gap:10px;overflow-x:auto;scrollbar-width:thin;padding-bottom:4px}
.cover{flex:none;width:104px;display:flex;flex-direction:column;gap:6px;padding:0;border:0;background:transparent;text-align:left;color:var(--fg)}
/* Owner 2026-11-18: compact player on the home page — less height, one footer row. */
.mcard.jzc.cmp{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center}
.mcard.jzc.cmp>.stg,.mcard.jzc.cmp>.txt{grid-column:1/-1}
.mcard.jzc.cmp .stg{--k:1.08;min-height:236px;padding:22px 28px 26px;gap:16px}
.mcard.jzc.cmp .bigv{width:440px;height:440px;right:-190px;margin-top:-220px}
.mcard.jzc.cmp .jtitle{font-size:clamp(26px,3vw,40px)}
.mcard.jzc.cmp>.mctl{padding:10px 0;margin-right:6px;flex-wrap:nowrap}
.mcard.jzc.cmp>.mlib{margin:0 16px 0 6px;padding:10px 0;border-top:0}
@container (max-width:760px){.mcard.jzc.cmp{display:flex;align-items:stretch}.mcard.jzc.cmp .mchips{flex-wrap:wrap;overflow:visible}.mcard.jzc.cmp>.mctl{justify-content:flex-start}.mcard.jzc.cmp>.mctl{padding:10px 0 2px;margin-right:16px;flex-wrap:wrap}.mcard.jzc.cmp>.mlib{margin:6px 16px 0;padding:10px 0 14px;border-top:1px solid var(--line)}}
@container (max-width:460px){.mcard.jzc.cmp .stg{--k:.9;min-height:220px;padding:18px 18px 22px}.mcard.jzc.cmp .bigv{width:320px;height:320px;right:-150px;margin-top:-160px}.mcard.jzc.cmp .jtitle{font-size:26px}}
@container (max-width:460px){.stg{--k:1;min-height:320px;padding:22px 20px 30px}.bigv{width:360px;height:360px;right:-170px;margin-top:-180px}.stg .arm{right:calc(16px - 10px * var(--k))}.stxt{max-width:62%}.jtitle{font-size:30px}.sctl{gap:12px}.mctl{justify-content:space-between}.cover{width:86px}.sgrid{gap:6px}}
/* toasts */
.toasts{position:fixed;right:20px;bottom:20px;z-index:80;display:flex;flex-direction:column;gap:10px;width:min(380px,calc(100% - 40px))}
.toast{display:flex;align-items:flex-start;gap:14px;padding:16px;border-radius:20px;background:var(--raise);border:1px solid var(--line2);box-shadow:0 30px 80px -20px rgba(0,0,0,.8)}
.empty{padding:40px;border-radius:24px;border:1px dashed var(--line2);text-align:center;color:var(--mut);font-size:14px}
@container (max-width:700px){.stage{height:250px}.hero{border-radius:24px}.clock{font-size:64px}}
@container (max-width:460px){.r2{padding:8px 9px}.r2 .n{font-size:8.5px;letter-spacing:.06em}.r2 .tp{font-size:20px}.r2 .mt{font-size:10px;gap:5px}.r2 .lc .i{width:11px;height:11px}.stage{height:250px}.iso{width:94%}.lbl .n{font-size:9px;letter-spacing:.08em;max-width:96px}.btn,.chip{padding:0 12px}}
/* Settings start page (owner 2026-11-18). */
.sthome{display:flex;flex-direction:column;gap:8px}
.sthi{display:flex;align-items:center;gap:14px;min-height:64px;padding:10px 14px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;text-align:left;cursor:pointer;transition:border-color .2s,background .2s}
.sthi:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
.sthi .ic{width:38px;height:38px;flex:none;color:var(--accent)}
.sthi b{display:block;font-size:15px;font-weight:500}.sthi small{display:block;font-size:12px;color:var(--mut);line-height:1.4;margin-top:2px}
.sthi>.i:last-child{color:var(--mut);flex:none}
.stclose{flex:none;border-radius:50%}
/* Alarm menu in the hero (owner 2026-11-18). */
.alw{position:relative;display:inline-flex}
.alp{display:inline-flex;align-items:center;gap:9px;min-height:40px;padding:0 10px 0 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--mut);font:inherit;cursor:pointer;transition:all .25s}
.alp .txt{display:flex;flex-direction:column;line-height:1.1;text-align:left}
.alp small{font-size:9px;letter-spacing:.14em;text-transform:uppercase;opacity:.75}.alp b{font-size:12px;font-weight:500;color:var(--fg)}
.alp .alc{opacity:.6;transition:transform .25s}.alp[aria-expanded="true"] .alc{transform:rotate(180deg)}
.alp.on{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent);box-shadow:0 0 18px -4px color-mix(in srgb,var(--accent) 45%,transparent)}
.alp.alert{color:#FF8A80;border-color:rgba(255,138,128,.6);animation:pulse 1.4s ease-in-out infinite}
.alm{position:absolute;top:calc(100% + 8px);right:0;z-index:30;width:min(300px,calc(100vw - 32px));display:flex;flex-direction:column;gap:2px;padding:8px;border-radius:18px;background:color-mix(in srgb,var(--bg) 55%,var(--raise));-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border:1px solid var(--line2);box-shadow:0 24px 60px -12px rgba(0,0,0,.8)}
.alm button{display:flex;align-items:center;gap:10px;min-height:42px;padding:0 10px;border:0;border-radius:12px;background:transparent;color:var(--fg);font:inherit;font-size:14px;text-align:left;cursor:pointer}
.alm button:hover:not(:disabled){background:var(--sunk)}
.alm button i{width:7px;height:7px;border-radius:50%;background:var(--line2);flex:none}
.alm button[aria-checked="true"]{color:var(--accent);cursor:default;opacity:1}.alm button[aria-checked="true"] i{background:var(--accent);box-shadow:0 0 8px var(--accent)}
.alm button[aria-checked="true"]>.i{margin-left:auto}
.alm button:disabled:not([aria-checked="true"]){opacity:.45;cursor:not-allowed}
.alm button{min-height:52px}.alm .alic{width:32px;height:32px;flex:none;display:grid;place-items:center;border-radius:10px;background:var(--sunk);color:var(--mut)}
.alm button[aria-checked="true"] .alic{background:var(--accent);color:var(--on-accent)}
.alm button b{display:block;font-size:14px;font-weight:500}.alm button small{display:block;font-size:11px;color:var(--mut);line-height:1.35;margin-top:1px}
.alm button[aria-checked="true"] b{color:var(--accent)}
.alm .alset{min-height:40px;margin-top:4px;border-top:1px solid var(--line);border-radius:0 0 12px 12px;font-size:12px;color:var(--mut)}
.alcode{min-height:40px;margin:2px 2px 6px;padding:0 12px;border-radius:10px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit}
.bchip{cursor:pointer;gap:8px;font:inherit;color:var(--fg)}
.bchip.red{border-color:rgba(255,107,107,.45);color:#FF8F8F;box-shadow:0 0 16px -6px rgba(255,107,107,.6)}
.bchip.yellow{border-color:rgba(242,193,78,.4);color:#F2C14E}
.bchip.green{color:var(--mut)}
.bsheet{width:min(560px,100%)}
.bsum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.bs{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:16px;background:var(--card);border:1px solid var(--line)}
.bs b{font-size:28px;font-weight:200;letter-spacing:-.04em;line-height:1}.bs small{font-size:11px;color:var(--mut)}
.bs.red b{color:#FF6B6B}.bs.yellow b{color:#F2C14E}.bs.green b{color:#6FD49A}
.bgh{font-size:10px;padding:8px 4px 0}.bgh.red{color:#FF8F8F}.bgh.yellow{color:#F2C14E}.bgh.green{color:#6FD49A}
.blist{display:flex;flex-direction:column;gap:6px}
.brow{display:flex;align-items:center;gap:14px;min-height:56px;padding:8px 14px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.brow b{display:block;font-size:14px;font-weight:500}.brow small{display:block;font-size:12px;color:var(--mut)}
.brow.red{border-color:rgba(255,107,107,.35);background:linear-gradient(90deg,rgba(255,107,107,.08),transparent 60%),var(--card)}
.brow.yellow{border-color:rgba(242,193,78,.3);background:linear-gradient(90deg,rgba(242,193,78,.07),transparent 60%),var(--card)}
.bpct{font-family:'Geist Mono',ui-monospace,monospace;font-size:13px;color:var(--mut)}
.brow.red .bpct{color:#FF8F8F}.brow.yellow .bpct{color:#F2C14E}
.bglyph{flex:none}
/* House mode: beside 3D / Planta on wide screens, beside the clock when the hero stacks (owner 2026-11-18). */
.hmL{display:none}
@container (max-width:860px){.hmL{display:block;position:absolute;top:26px;right:0;z-index:6}.hmR{display:none}}
@container (max-width:460px){.hmL .alp{min-height:44px;padding:0 8px 0 10px;gap:7px}.hmL .alp small{font-size:8px}.hmL .alp b{font-size:12px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
.numin{min-height:40px;width:96px;border-radius:10px;background:var(--sunk);color:var(--fg);border:1px solid var(--line2);padding:0 10px;font:inherit;text-align:right}
select.numin{text-align:left}
.chk small{display:block;font-size:11px;color:var(--mut);font-weight:400;margin-top:2px;line-height:1.4}
.linkbtn{border:0;background:transparent;padding:0;color:var(--accent);font:inherit;font-size:13px;text-decoration:underline;text-underline-offset:3px;cursor:pointer;text-align:left}
.esttag{display:inline-block;margin-right:4px;padding:1px 6px;border-radius:999px;border:1px dashed color-mix(in srgb,var(--accent) 55%,transparent);color:var(--accent);font-size:10px;letter-spacing:.04em}
.ediag{display:flex;flex-direction:column;gap:6px;padding-top:8px}
.edr{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:10px;background:var(--sunk);font-size:11.5px;color:var(--mut);overflow-wrap:anywhere}
.edr b{color:var(--fg);font-size:12.5px;font-weight:500}.edr b small{color:var(--dim);font-weight:400}
.edr.bad{border-left:2px solid #F2C14E}
.ekv>div>small.dim{display:block;font-size:11px;margin-top:2px}
.echart{display:flex;flex-direction:column;gap:10px;padding-top:4px}
.ebars{display:grid;align-items:end;gap:4px;height:120px}
.ebars.months{grid-template-columns:repeat(12,1fr)}.ebars.days{grid-template-columns:repeat(30,1fr);gap:2px}
.eb{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;gap:4px;min-width:0}
.eb i{display:block;border-radius:5px 5px 2px 2px;background:color-mix(in srgb,var(--accent) 38%,var(--line2));transition:height .5s}
.eb.now i{background:var(--accent);box-shadow:0 0 14px -2px color-mix(in srgb,var(--accent) 60%,transparent)}
.eb small{font-family:'Geist Mono',ui-monospace,monospace;font-size:9px;color:var(--dim);text-align:center;white-space:nowrap;overflow:hidden;height:12px;line-height:12px}
.eb.now small{color:var(--accent)}
@container (max-width:460px){.ebars.months small{font-size:8px}.ebars{height:96px}}
.sgrp{display:flex;flex-direction:column;gap:10px}
.stgh{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:40px;padding:4px 2px;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--mut);font:inherit;cursor:pointer;text-align:left}
.stgh .eyebrow{font-size:10px}.stgh .i{transition:transform .25s;color:var(--mut)}
.sgrp.closed .stgh .i{transform:rotate(-90deg)}
.stgh:hover .eyebrow,.stgh:hover .i{color:var(--fg)}
.stgb{display:flex;flex-direction:column;gap:10px}
`;
