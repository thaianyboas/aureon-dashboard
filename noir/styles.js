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
/* Owner 2026-11-20: keep sheets clear of the iPhone status bar / notch and the home indicator. */
.overlay{position:fixed;inset:0;z-index:90;display:flex;align-items:flex-end;justify-content:center;padding:max(16px,calc(env(safe-area-inset-top,0px) + 14px)) max(16px,env(safe-area-inset-right,0px)) max(16px,calc(env(safe-area-inset-bottom,0px) + 10px)) max(16px,env(safe-area-inset-left,0px));background:rgba(5,5,6,.6);backdrop-filter:blur(6px)}
.sheet{width:min(520px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - max(16px,calc(env(safe-area-inset-top,0px) + 14px)) - max(16px,calc(env(safe-area-inset-bottom,0px) + 10px)));overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:22px;border-radius:26px;background:var(--raise);border:1px solid var(--line2);box-shadow:0 40px 100px rgba(0,0,0,.6)}
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
/* Edit everything (owner 2026-11-18). */
.blk{display:flex;flex-direction:column;gap:10px;padding:10px;border-radius:24px;border:1px dashed color-mix(in srgb,var(--accent) 40%,transparent)}
.blk.off{opacity:.55}
.blkbar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:2px 4px}
.blkbar .eyebrow{font-size:10px;color:var(--accent)}
.hp{position:relative;border-radius:14px;outline:1px dashed color-mix(in srgb,var(--accent) 35%,transparent);outline-offset:4px}
.hp.off>:not(.hpbar){opacity:.25}
.hpbar{position:absolute;top:-8px;right:-8px;z-index:7;display:flex;gap:4px}
.hpbar .ib{background:var(--raise);border:1px solid var(--line2)}
.rnbox{display:inline-flex;align-items:center;gap:4px}
.rnbox input{min-height:36px;min-width:0;width:min(260px,52vw);border-radius:10px;border:1px solid var(--accent);background:var(--sunk);color:var(--fg);font:inherit;padding:0 10px}
/* Own HA / HACS cards (owner 2026-11-18). */
.mycards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@container (max-width:700px){.mycards{grid-template-columns:minmax(0,1fr)}}
.mycard{display:flex;flex-direction:column;gap:6px;min-width:0}
.mycard.wide{grid-column:1/-1}
.mycard>*:not(.mcbar){--ha-card-background:var(--card2);--ha-card-border-radius:22px;--ha-card-border-color:var(--line);--card-background-color:var(--card2);--primary-text-color:var(--fg);--secondary-text-color:var(--mut)}
.mcbar{display:flex;align-items:center;gap:4px;padding:0 4px}.mcbar .eyebrow{font-size:10px;color:var(--accent)}
.cardph{min-height:96px;border-radius:22px;border:1px dashed var(--line2);display:grid;place-items:center;color:var(--mut);font-size:12px}
.cardph.err{color:#FF8A80;border-color:rgba(255,138,128,.5)}
.addcard{align-self:flex-start;border-style:dashed}
.cq{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:inherit}
.cpicks{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.cpick{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.cpick:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
.cpick b{font-size:14px;font-weight:500}.cpick small{font-size:11px;color:var(--mut);overflow-wrap:anywhere}
.cedit{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}
@container (max-width:700px){.cedit{grid-template-columns:minmax(0,1fr)}}
.cprev,.ccfg{display:flex;flex-direction:column;gap:8px;min-width:0}
.cyaml{min-height:220px;resize:vertical;border-radius:12px;border:1px solid var(--line2);background:var(--sunk);color:var(--fg);font:12.5px/1.5 'Geist Mono',ui-monospace,monospace;padding:12px;tab-size:2}
.cerr{color:#FF8A80;font-size:12px}
.hmL .hpbar{right:auto;left:-10px;top:-10px}
.efold{display:flex;flex-direction:column;gap:12px}
.efold+.efold{padding-top:10px;border-top:1px solid var(--line)}
.efh{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:36px;padding:0;border:0;background:transparent;color:var(--mut);font:inherit;cursor:pointer;text-align:left}
.efh .i{transition:transform .25s}.efold.closed .efh .i{transform:rotate(-90deg)}
.efh:hover .eyebrow{color:var(--fg)}
/* Theme gallery (owner 2026-11-20). */
.thfam{font-family:'Geist Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);padding-top:4px}
.thgal{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.thc{position:relative;display:flex;flex-direction:column;gap:0;padding:0;border-radius:18px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;text-align:left;cursor:pointer;overflow:hidden;transition:border-color .25s,transform .25s,box-shadow .25s}
.thc:hover{transform:translateY(-2px);border-color:var(--line2)}
.thc.on{border-color:var(--pa);box-shadow:0 0 0 1px var(--pa),0 12px 30px -14px var(--pa)}
.thpv{position:relative;display:block;height:92px;background:var(--pb);overflow:hidden}
.thglow{position:absolute;inset:-30% 30% 40% -20%;background:radial-gradient(closest-side,color-mix(in srgb,var(--pa) 35%,transparent),transparent);filter:blur(6px);opacity:.7}
.thcard{position:absolute;left:12px;right:30px;top:14px;bottom:14px;border-radius:12px;background:var(--pc);border:1px solid var(--pl);display:flex;flex-direction:column;justify-content:center;gap:6px;padding:0 12px}
.thclock{font-style:normal;font-size:20px;font-weight:200;letter-spacing:-.05em;color:#F2F2F3;line-height:1}
.thline{display:block;height:3px;width:56%;border-radius:2px;background:var(--pa)}
.thdots{display:flex;gap:4px}.thdots b{width:6px;height:6px;border-radius:50%;background:var(--pa);opacity:.9}.thdots b+b{opacity:.45}.thdots b+b+b{opacity:.2}
.thpill{position:absolute;right:10px;top:14px;width:12px;height:34px;border-radius:6px;background:linear-gradient(var(--pa),color-mix(in srgb,var(--pa) 30%,transparent))}
.thtx{display:flex;flex-direction:column;gap:2px;padding:10px 12px 12px}
.thtx b{font-size:13.5px;font-weight:500}.thtx small{font-size:11px;color:var(--mut);line-height:1.35}
.thok{position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--pa);color:#0A0A0A}
.thok .i{width:13px;height:13px}
@container (max-width:460px){.thgal{grid-template-columns:repeat(2,minmax(0,1fr))}.thpv{height:80px}.thclock{font-size:17px}}
.stfoot{position:sticky}
.shtop{position:absolute;right:2px;bottom:calc(100% - 4px);width:44px;height:44px;border-radius:50%;background:var(--raise);border:1px solid var(--line2);box-shadow:0 10px 26px -8px rgba(0,0,0,.7);color:var(--fg)}
.nmlink{cursor:pointer;border-radius:6px;outline-offset:3px;min-width:0}
.nmlink:hover>*{text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--accent) 60%,transparent);text-underline-offset:3px}
.nmlink:focus-visible{outline:2px solid var(--accent)}
.noarea{flex:none;font-size:10px;padding:2px 7px;border-radius:999px;border:1px dashed color-mix(in srgb,var(--accent) 55%,transparent);color:var(--accent);margin-left:6px}
.nahint{display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:var(--mut);line-height:1.4;border-bottom:1px solid var(--line)}
.nahint .i{color:var(--accent);flex:none}
/* Openings — concept A "Escudo" (owner 2026-11-21). */
.shieldc{--sc:var(--accent);display:flex;flex-direction:column;gap:18px;padding:18px;border-radius:26px;border:1px solid var(--line);background:linear-gradient(160deg,var(--card),var(--card2))}
.shieldc.warn{--sc:#F2C14E;border-color:rgba(242,193,78,.35)}
.shhd{display:flex;align-items:center;gap:14px}
.shring{width:58px;height:58px;flex:none;border-radius:50%;display:grid;place-items:center;color:var(--sc);border:1px solid color-mix(in srgb,var(--sc) 40%,transparent);background:radial-gradient(circle,color-mix(in srgb,var(--sc) 20%,transparent),transparent 70%);box-shadow:0 0 30px -6px color-mix(in srgb,var(--sc) 55%,transparent)}
.shieldc .txt{display:flex;flex-direction:column;gap:3px;min-width:0}
.shbig{font-size:22px;font-weight:300;letter-spacing:-.02em}
.shhd small{font-size:12px;color:var(--mut)}
.shrooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(66px,1fr));gap:6px}
.shr{display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 4px 10px;border-radius:16px;background:var(--sunk);border:1px solid var(--line);color:var(--accent);font:inherit;cursor:pointer;min-width:0}
.shr .txt{font-size:10px;line-height:1.25;color:var(--mut);max-width:100%;text-align:center;overflow-wrap:break-word;hyphens:auto}
.shr small{font-size:9.5px;color:#F2C14E}
.shr.open{color:#F2C14E;border-color:rgba(242,193,78,.5);background:linear-gradient(180deg,rgba(242,193,78,.12),var(--sunk))}.shr.open .txt{color:#F2C14E}
.shr.na{opacity:.45}
/* TV — concept A "Cinema" (owner 2026-11-21). */
.cinegrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:12px}
.cine{border-radius:28px;border:1px solid var(--line);background:linear-gradient(160deg,var(--card) 0%,var(--card2) 60%);overflow:hidden;display:flex;flex-direction:column}
.cart{position:relative;min-height:132px;padding:18px 84px 22px 18px;display:flex;flex-direction:column;gap:18px}
.cine.on{background:radial-gradient(120% 90% at 90% 0%,color-mix(in srgb,var(--accent) 30%,transparent),transparent 60%),linear-gradient(135deg,color-mix(in srgb,var(--accent) 10%,var(--card)) 0%,var(--card2) 70%)}
.csrc{font-family:'Iowan Old Style','Palatino Linotype',Georgia,serif;font-style:italic;font-size:clamp(26px,6vw,36px);line-height:1.1;letter-spacing:-.01em;color:var(--fg);overflow-wrap:anywhere}
.cine:not(.on) .csrc{color:var(--mut)}
.cpow{position:absolute;right:18px;top:18px;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--line2);background:var(--raise);color:var(--mut);cursor:pointer}
.cine.on .cpow{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,transparent);background:color-mix(in srgb,var(--accent) 12%,transparent);box-shadow:0 0 24px -4px color-mix(in srgb,var(--accent) 60%,transparent)}
.cbody{display:flex;flex-direction:column;gap:14px;padding:4px 18px 18px}
.cvol{display:flex;align-items:center;gap:10px}
.cline{position:relative;flex:1;height:22px;cursor:pointer}
.cline:before{content:'';position:absolute;left:0;right:0;top:10px;height:3px;border-radius:2px;background:var(--line2)}
.cline i{position:absolute;left:0;top:10px;height:3px;border-radius:2px;background:var(--accent)}
.cline i:after{content:'';position:absolute;right:-6px;top:-5px;width:13px;height:13px;border-radius:50%;background:var(--fg);box-shadow:0 2px 8px rgba(0,0,0,.5)}
.csrcs{display:flex;gap:6px;flex-wrap:wrap}
.chipb{padding:8px 13px;border-radius:999px;border:1px solid var(--line2);background:transparent;color:var(--mut);font:inherit;font-size:12px;cursor:pointer}
.chipb.on{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:600}
/* Openings — animated door/window drawings (owner 2026-11-21). */
.opi{overflow:visible}
.opi .gap{fill:currentColor;stroke:none;opacity:0;transition:opacity .5s ease}
.opi.open .gap{opacity:.22}
.opi .leaf,.opi .sl,.opi .sr{transform-box:fill-box;transition:transform .7s cubic-bezier(.34,1.45,.5,1)}
.opi .leaf path:first-child,.opi .sl path,.opi .sr path{fill:var(--card2)}
.opi .leaf{transform-origin:0 50%}
.opi.door.open .leaf{transform:scaleX(.42) skewY(-14deg);animation:opDoor 4.5s ease-in-out .8s infinite}
.opi .sl{transform-origin:0 50%}.opi .sr{transform-origin:100% 50%}
.opi.win.open .sl{transform:scaleX(.5) skewY(-12deg);animation:opWinL 5s ease-in-out .8s infinite}
.opi.win.open .sr{transform:scaleX(.5) skewY(12deg);animation:opWinR 5s ease-in-out .8s infinite}
@keyframes opDoor{0%,100%{transform:scaleX(.42) skewY(-14deg)}50%{transform:scaleX(.5) skewY(-12deg)}}
@keyframes opWinL{0%,100%{transform:scaleX(.5) skewY(-12deg)}50%{transform:scaleX(.58) skewY(-10deg)}}
@keyframes opWinR{0%,100%{transform:scaleX(.5) skewY(12deg)}50%{transform:scaleX(.58) skewY(10deg)}}
.shr.open .opi{filter:drop-shadow(0 0 6px rgba(242,193,78,.55))}
.shr svg.opi.i.s{width:30px;height:30px;stroke-width:1.5}.shring .opi{width:30px;height:30px;stroke-width:1.5}
@media (prefers-reduced-motion:reduce){.opi .leaf,.opi .sl,.opi .sr{animation:none!important;transition:none}}
/* Energy — concept A premium "Medidor" (owner 2026-11-21). */
.elive{display:inline-flex;align-items:center;gap:7px;font:10px ui-monospace,'SF Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:var(--accent)}
.elive:before{content:'';width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 15%,transparent),0 0 12px var(--accent);animation:pulse 2.4s ease-in-out infinite}
.egrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:12px;align-items:start}
.ecol{display:flex;flex-direction:column;gap:12px;min-width:0}
.ecard{position:relative;display:flex;flex-direction:column;gap:16px;padding:22px;border-radius:30px;border:1px solid var(--line);min-width:0;overflow:hidden;
  background:radial-gradient(120% 80% at 50% -10%,color-mix(in srgb,var(--accent) 10%,transparent),transparent 55%),linear-gradient(170deg,var(--card),var(--card2));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 30px 60px -30px rgba(0,0,0,.8)}
.ecard:before{content:'';position:absolute;top:0;left:22%;right:22%;height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--accent) 60%,#fff),transparent);opacity:.6}
.edial{position:relative;width:100%;max-width:320px;margin:0 auto;aspect-ratio:300/190}
.edial svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.edial .tk line{stroke:var(--line2);stroke-width:1.5;stroke-linecap:round}.edial .tk line.on{stroke:color-mix(in srgb,var(--accent) 45%,var(--line2))}
.edial .trk{fill:none;stroke:color-mix(in srgb,var(--fg) 6%,transparent);stroke-width:10;stroke-linecap:round}
.edial .arc,.edial .glo{fill:none;stroke:url(#aurEg);stroke-width:10;stroke-linecap:round;transition:d .8s ease}
.edial .glo{filter:blur(7px);opacity:.7}
.edial .pk{stroke:#F2C14E;stroke-width:2.5;stroke-linecap:round}
.edv{position:absolute;left:0;right:0;top:36%;display:flex;flex-wrap:wrap;justify-content:center;align-items:baseline;gap:0 4px;text-align:center}
.edv b{font-size:clamp(48px,13cqi,68px);font-weight:200;letter-spacing:-.05em;line-height:1;background:linear-gradient(180deg,#fff,color-mix(in srgb,var(--accent) 35%,#fff));-webkit-background-clip:text;background-clip:text;color:transparent}
.edv small{font-size:17px;color:var(--mut)}
.edv .txt{flex-basis:100%;font-size:12px;color:var(--mut);margin-top:6px;padding:0 24px}
.escale{display:flex;justify-content:space-between;gap:8px;width:100%;max-width:320px;margin:-12px auto 0;font:10px ui-monospace,monospace;color:var(--mut)}
.escale .pk{color:#F2C14E}
.echips{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}
.echip{font-size:11.5px;padding:6px 11px;border-radius:999px;border:1px solid var(--line2);color:var(--mut);background:rgba(255,255,255,.02)}
.echip b{color:var(--accent);font-weight:500}.echip.up b{color:#F2C14E}
.ecurve svg{display:block;width:100%;height:46px}.ecurve .ln{fill:none;stroke:var(--accent);stroke-width:1.5;vector-effect:non-scaling-stroke}
.eticks{display:flex;justify-content:space-between;font:9px ui-monospace,monospace;color:var(--mut);margin-top:4px}
.eduo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.ecell{display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:20px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.025),transparent);min-width:0}
.ecell .eyebrow{font-size:10px}
.ecell>b{font-size:28px;font-weight:200;letter-spacing:-.03em;margin-top:4px}.ecell>b small{font-size:12px;color:var(--mut);font-weight:400}
.ecell .eur{font-size:15px;color:color-mix(in srgb,var(--accent) 55%,#fff)}.ecell .eur small{color:var(--mut);font-size:11px}
.eprog{height:3px;border-radius:2px;background:var(--line);overflow:hidden;margin-top:6px}.eprog i{display:block;height:100%;background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 30%,transparent),var(--accent))}
.esm{font-size:10.5px;color:var(--mut)}
.etot{font-size:13px;color:var(--fg)}.etot em{font-style:normal;color:color-mix(in srgb,var(--accent) 55%,#fff);margin-left:6px}
.ecard .ebars .eb i{border-radius:6px 6px 3px 3px;background:linear-gradient(180deg,var(--line2),var(--line))}
.ecard .ebars .eb.now i{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 55%,#fff),color-mix(in srgb,var(--accent) 25%,transparent));box-shadow:0 0 24px -4px color-mix(in srgb,var(--accent) 60%,transparent)}
.ecard .ebars .eb.now small{color:var(--accent)}
.efoot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-top:14px;border-top:1px solid var(--line);font-size:12px;color:var(--mut)}.efoot b{color:var(--fg);font-weight:500}
.ewlist{display:flex;flex-direction:column}
.ewho{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 0;border:0;border-bottom:1px solid var(--line);background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.ewho .txt{display:flex;flex-direction:column;gap:3px;min-width:0}.ewho .txt b{font-size:15px;font-weight:400;overflow-wrap:anywhere}.ewho .txt small{font-size:11.5px;color:var(--mut)}
.ering{position:relative;width:44px;height:44px;display:grid;place-items:center;color:var(--accent)}
.ering>svg:not(.i){position:absolute;inset:0;width:44px;height:44px}.ering .bg{fill:none;stroke:var(--line);stroke-width:2.5}
.ering .fg{fill:none;stroke:var(--accent);stroke-opacity:.7;stroke-width:2.5;stroke-linecap:round}.ering .fg.lead{stroke-opacity:1}.ering .fg.est{stroke-dasharray:3 3}
.ering>svg.i{position:relative;width:18px;height:18px}
.ewv{text-align:right;font-size:17px;font-weight:300;white-space:nowrap}.ewv small{font-size:11px;color:var(--mut)}.ewv .pc{display:block;margin-top:3px}
.ewv.lead{color:color-mix(in srgb,var(--accent) 55%,#fff)}
.eidle{display:flex;align-items:center;gap:12px;margin-top:12px;padding:12px 14px;border-radius:18px;background:var(--sunk);border:1px solid var(--line);color:var(--mut);font:inherit;font-size:12.5px;text-align:left;cursor:pointer}
.eidle .txt{flex:1;min-width:0}.eidle b{font-weight:400;color:var(--fg)}
.edots{display:flex;flex:none}.edots i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--card);border:1px solid var(--line2);margin-left:-7px;color:var(--mut)}.edots i:first-child{margin-left:0}
.edots .i{width:11px;height:11px}
.erooms{display:flex;flex-direction:column;gap:10px}
.erm{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,10fr) auto;gap:10px;align-items:center;font-size:12.5px}
.erm .et{height:8px;border-radius:4px;background:var(--line)}.erm .et i{display:block;height:100%;border-radius:4px;background:var(--accent)}
.erm b{font-weight:400;color:var(--mut);min-width:52px;text-align:right}
@container (max-width:380px){.ecard{padding:18px}.eduo{gap:8px}.ecell{padding:13px}.ecell>b{font-size:24px}}
@media (prefers-reduced-motion:reduce){.elive:before{animation:none}.edial .arc,.edial .glo{transition:none}}
.esub{text-align:center;font-size:11.5px;color:var(--mut);margin-top:-6px}
/* Clima — concept A premium (owner 2026-11-21). */
.clgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,370px),1fr));gap:10px}
.clc{--k:143,184,255;position:relative;display:grid;grid-template-columns:142px minmax(0,1fr);gap:14px;align-items:center;padding:16px 18px 16px 12px;border-radius:30px;overflow:hidden;border:1px solid rgba(var(--k),.13);
  background:radial-gradient(70% 90% at 0% 50%,rgba(var(--k),.10),transparent 60%),radial-gradient(60% 50% at 100% 0%,rgba(255,255,255,.035),transparent 70%),linear-gradient(165deg,var(--card),var(--card2) 75%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 34px 60px -30px rgba(0,0,0,.95)}
.clc:before{content:'';position:absolute;top:0;left:16%;right:16%;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--k),.75),transparent)}
.clc.heat{--k:242,163,94}.clc.off{--k:138,148,143}
.cldial{position:relative;width:142px;height:142px}.cldial svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.clblur{filter:blur(4px)}.cllab{fill:var(--dim,#4F5D57);font:7.5px ui-monospace,monospace;text-anchor:middle}
.clv{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.clv b{font-size:33px;font-weight:200;letter-spacing:-.05em;line-height:1;background:linear-gradient(180deg,#fff 30%,rgb(var(--k)));-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 14px rgba(var(--k),.25))}
.clv small{font:8.5px ui-monospace,monospace;letter-spacing:.26em;color:var(--mut);margin-top:6px;text-transform:uppercase}
.clv em{font-style:normal;font-size:10.5px;margin-top:5px;color:rgb(var(--k))}
.clinfo{display:flex;flex-direction:column;gap:10px;min-width:0}
.clnm{display:flex;justify-content:space-between;align-items:center;gap:8px;min-width:0}.clnm b{font-size:16.5px;font-weight:500;letter-spacing:-.01em}
.clst{display:inline-flex;align-items:center;gap:6px;flex:none;font-size:10.5px;padding:5px 10px;border-radius:999px;background:rgba(var(--k),.1);border:1px solid rgba(var(--k),.22);color:rgb(var(--k));white-space:nowrap}
.clst:before{content:'';width:5px;height:5px;border-radius:50%;background:rgb(var(--k));box-shadow:0 0 8px rgb(var(--k))}
.clmeta{display:flex;flex-wrap:wrap;gap:2px 12px;font-size:11.5px;color:var(--mut)}.clmeta b{color:var(--fg);font-weight:400}
.clspark{position:relative;height:38px}.clspark svg{display:block;width:100%;height:38px;overflow:visible}
.clspark>i{position:absolute;right:-4px;width:8px;height:8px;border-radius:50%}
.cltl{position:absolute;right:0;font:8px ui-monospace,monospace;opacity:.8}
.clpill{display:flex;align-items:center;justify-content:space-between;padding:4px;border-radius:999px;border:1px solid rgba(var(--k),.18);background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.15));box-shadow:inset 0 1px 2px rgba(0,0,0,.6)}
.clpill button{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:50%;border:1px solid var(--line2);background:radial-gradient(circle at 50% 25%,rgba(255,255,255,.12),rgba(255,255,255,.02) 65%);color:var(--fg);cursor:pointer;box-shadow:0 5px 12px -5px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.08)}
.clpill button:disabled{opacity:.35;cursor:default}
.clpill b{font-size:20px;font-weight:300;text-align:center;letter-spacing:-.02em;line-height:1.1}.clpill b small{display:block;font:8px ui-monospace,monospace;color:var(--mut);letter-spacing:.24em;margin-top:2px;text-transform:uppercase}
.clc.heat .clpill b{color:#F7C98E}
@container (max-width:370px){.clc{grid-template-columns:118px minmax(0,1fr);gap:10px;padding:14px 14px 14px 8px}.cldial{width:118px;height:118px}.clv b{font-size:28px}}
/* Tomadas — concept A "Painel" (owner 2026-11-22). */
.pgrp.pgx{position:relative;border-radius:30px;border:1px solid color-mix(in srgb,var(--accent) 12%,var(--line));
  background:radial-gradient(70% 60% at 0% 0%,color-mix(in srgb,var(--accent) 8%,transparent),transparent 60%),linear-gradient(165deg,var(--card),var(--card2) 75%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 34px 60px -30px rgba(0,0,0,.95)}
.pgrp.pgx:before{content:'';position:absolute;top:0;left:16%;right:16%;height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--accent) 70%,transparent),transparent);pointer-events:none}
.pgx .phead{min-height:72px;padding:14px 18px}
.pgx .pdot{width:40px;height:40px;border-radius:14px;color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--accent) 20%,transparent)}
.pgx .pname{font-size:17px;font-weight:500}
.pxw{display:flex;flex-direction:column;align-items:flex-end;gap:1px;text-align:right}.pxw b{font-size:19px;font-weight:300;letter-spacing:-.02em}.pxw small{font-size:10.5px;color:var(--mut)}
.ptg{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,148px),1fr));gap:8px;padding:0 12px 12px}
.ptg .nahint{grid-column:1/-1}
.ptl{position:relative;display:flex;flex-direction:column;gap:12px;padding:14px;border-radius:20px;background:rgba(0,0,0,.25);border:1px solid var(--line);min-width:0;transition:border-color .3s,background .3s}
.ptl.on{border-color:color-mix(in srgb,var(--accent) 28%,transparent);background:radial-gradient(90% 80% at 0% 0%,color-mix(in srgb,var(--accent) 13%,transparent),transparent 70%),rgba(0,0,0,.2)}
.ptl.na{opacity:.5}
.ptop{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.pti{width:36px;height:36px;flex:none;border-radius:50%;display:grid;place-items:center;color:var(--mut);background:rgba(255,255,255,.03);border:1px solid var(--line2);transition:color .3s,box-shadow .3s}
.pti .i{width:17px;height:17px}
.ptl.on .pti{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 35%,transparent);box-shadow:0 0 18px -4px color-mix(in srgb,var(--accent) 70%,transparent)}
.plk{display:inline-flex;align-items:center;gap:5px;font-size:10px;padding:4px 8px;border-radius:999px;border:1px solid var(--line2);color:var(--mut);white-space:nowrap}.plk .i{width:10px;height:10px}
.pnx{display:flex;flex-direction:column;gap:3px;min-width:0}.pnx b{font-size:13.5px;font-weight:400;line-height:1.25;overflow-wrap:anywhere}
.pnx small{font-size:11.5px;color:var(--mut)}.pnx em{font-style:normal;color:var(--fg)}
/* Luzes — "linhas do C + A" (owner 2026-11-22). */
.pgrp.lgx.lit{border-color:rgba(var(--lc),.28);background:radial-gradient(70% 60% at 0% 0%,rgba(var(--lc),.10),transparent 60%),linear-gradient(165deg,var(--card),var(--card2) 75%)}
.pgrp.lgx.lit:before{background:linear-gradient(90deg,transparent,rgba(var(--lc),.75),transparent)}
.lbxs{display:flex;flex-direction:column;gap:8px;padding:0 12px 12px}
.lbxs .nahint{margin:0 2px}
.lbx{--lc:255,200,140;position:relative;display:flex;align-items:center;gap:12px;min-height:72px;padding:0 14px;border-radius:20px;overflow:hidden;background:rgba(0,0,0,.3);border:1px solid var(--line);touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:pointer;transition:border-color .3s}
.lbx.on{border-color:rgba(var(--lc),.35)}.lbx.na{opacity:.5;cursor:default}
.lfl{position:absolute;left:0;top:0;bottom:0;pointer-events:none;background:linear-gradient(90deg,rgba(var(--lc),.10),rgba(var(--lc),.45) 85%,rgba(var(--lc),.6));box-shadow:16px 0 26px -12px rgba(var(--lc),.75);transition:width .15s}
.lbi{position:relative;width:38px;height:38px;flex:none;border-radius:50%;display:grid;place-items:center;color:var(--mut);border:1px solid var(--line2);background:rgba(255,255,255,.03)}
.lbi .i{width:18px;height:18px}
.lbx.on .lbi{color:#fff;border-color:rgba(var(--lc),.6);background:radial-gradient(circle,rgba(var(--lc),.55),rgba(var(--lc),.08) 70%);box-shadow:0 0 calc(10px + var(--b)*26px) -2px rgba(var(--lc),.9)}
.lnx{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.lnx .lname{align-self:flex-start;max-width:100%;padding:0;border:0;background:none;color:var(--fg);font:inherit;text-align:left;cursor:pointer;min-width:0}.lnx .lname b{font-size:15px;font-weight:400}
.lnx small{font-size:11px;color:var(--mut)}.lbx.on .lnx small{color:rgb(var(--lc))}
.lpc{position:relative;font-size:22px;font-weight:200;letter-spacing:-.03em;white-space:nowrap}.lpc small{font-size:12px;color:var(--mut)}
.lbx .switch{position:relative;flex:none}
.lbx.on .switch[aria-checked=true]>span{background:linear-gradient(180deg,rgb(var(--lc)),rgba(var(--lc),.75));box-shadow:0 0 12px -2px rgba(var(--lc),.8)}
.lrng.sr{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;clip:rect(0 0 0 0);pointer-events:none}
.lbx .lpc{color:var(--fg)}
.pgrp.lgx:not(.lit) .pdot{color:var(--mut);background:rgba(255,255,255,.03);border-color:var(--line2);box-shadow:none}
/* Acontecendo agora — "rico e visual" (owner 2026-11-22). */
.live{grid-auto-rows:auto}
.act{background:radial-gradient(80% 70% at 50% 0%,rgba(255,255,255,.05),transparent 60%),linear-gradient(170deg,var(--card),var(--card2) 75%);border-radius:30px;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 34px 60px -30px rgba(0,0,0,.95)}
.act:before{content:'';position:absolute;top:0;left:16%;right:16%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);pointer-events:none}
.apgrid{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,165px),1fr));gap:10px}
.apgrid.one{grid-template-columns:minmax(0,420px)}
.act.ap{min-height:0;padding:14px 14px 16px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;text-align:center}
.act.ap.run{border-color:rgba(143,184,255,.32);background:radial-gradient(80% 70% at 50% 0%,rgba(143,184,255,.10),transparent 60%),linear-gradient(170deg,var(--card),var(--card2) 75%)}
.act.ap.run:before{background:linear-gradient(90deg,transparent,rgba(143,184,255,.7),transparent)}
.act.ap.done{border-color:color-mix(in srgb,var(--accent) 50%,transparent);box-shadow:0 0 40px -12px color-mix(in srgb,var(--accent) 60%,transparent),inset 0 1px 0 rgba(255,255,255,.06)}
.apbox{position:relative;display:block;width:min(128px,70%)}
.apill{display:block;width:100%;height:auto;filter:drop-shadow(0 14px 18px rgba(0,0,0,.7))}
.apr{stroke:#8FB8FF;filter:drop-shadow(0 0 4px #8FB8FF)}.apr.spin{transform-origin:64px 88px;animation:spin 2.4s linear infinite}
.apb{fill:#8FB8FF;filter:drop-shadow(0 0 4px #8FB8FF)}.apb.spinb{animation:apslide 2.4s ease-in-out infinite}
.apglow{stroke:#8FB8FF;stroke-opacity:.6;filter:drop-shadow(0 4px 6px #8FB8FF)}
.wave{animation:apwave 3s ease-in-out infinite}
@keyframes apwave{0%,100%{transform:translateX(0)}50%{transform:translateX(-14px)}}
@keyframes apslide{0%,100%{transform:translateX(0)}50%{transform:translateX(62px)}}
@keyframes spin{to{transform:rotate(360deg)}}
.apok{position:absolute;right:-6px;top:-6px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--on-accent,#111);box-shadow:0 0 18px color-mix(in srgb,var(--accent) 70%,transparent)}
.aptx{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;max-width:100%}
.act.ap .ttl{font-size:15px;font-weight:500}.apst{font-size:11.5px;color:var(--mut)}.act.ap.run .apst{color:#8FB8FF}.act.ap.done .apst{color:var(--accent)}
.act.ap .byplug{justify-content:center}
.approg{width:100%;height:4px;border-radius:2px;background:var(--line2);overflow:hidden}.approg i{display:block;height:100%;background:linear-gradient(90deg,rgba(143,184,255,.4),#8FB8FF);box-shadow:0 0 10px #8FB8FF}
.act .alexa{display:flex;justify-content:center;background:none;border:0;padding:0;margin:0}
.alx{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;border:1px solid var(--line2);background:rgba(255,255,255,.04);color:var(--mut);font:inherit;font-size:11.5px;cursor:pointer;white-space:nowrap}
.alx .i{width:12px;height:12px}.alx>i{width:6px;height:6px;border-radius:50%;background:var(--line2)}
.alx.on{color:var(--fg);border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.06)}.alx.on>i{background:#7EE0A8;box-shadow:0 0 6px #7EE0A8}
.wcd{position:relative;width:60px;height:60px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;align-self:center}
.wcd svg{position:absolute;inset:0;width:100%;height:100%}.wcd .bg{fill:none;stroke:var(--line2);stroke-width:3}.wcd .fg{fill:none;stroke:var(--fg);stroke-width:3;stroke-linecap:round}
.wcd b{position:relative;font-size:21px;font-weight:200;line-height:1}.wcd small{position:relative;font:8px ui-monospace,monospace;letter-spacing:.15em;color:var(--mut);margin-top:3px}
.wsi svg.wb.mini{width:30px;height:39px;flex:none}
.act.rob{gap:14px}
.robrow{display:flex;align-items:center;gap:16px}.robbox{order:-1;flex:none;width:112px;height:112px}
.robill{width:100%;height:100%;overflow:visible}.rbat{stroke:#7EE0A8;filter:drop-shadow(0 0 6px #7EE0A8)}.rbat.low{stroke:#F2C14E;filter:drop-shadow(0 0 6px #F2C14E)}
.reye{fill:#7EE0A8;filter:drop-shadow(0 0 4px #7EE0A8)}.rspin{transform-origin:64px 64px;animation:spin 6s linear infinite}
@container (max-width:420px){.robbox{width:92px;height:92px}}
@media (prefers-reduced-motion:reduce){.apr.spin,.apb.spinb,.wave,.rspin{animation:none}}
.wsi{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px}.wsi b{font-size:11.5px;font-weight:400;max-width:100%}.wsi .mono{font-size:9.5px;color:var(--mut)}
.act.wst .wbins svg.wb{width:78px;height:auto}.act.wst .wbins svg.wb.back{width:60px}
.act.ap .byplug{font-size:11px}
/* Machine cards: info "i" (left) and Alexa bell (right) in the corners (owner 2026-11-22). */
.act.ap{position:relative}
.apinfo,.alx{position:absolute;top:12px;z-index:2;width:32px;height:32px;padding:0;border-radius:50%;display:grid;place-items:center;border:1px solid var(--line2);background:rgba(255,255,255,.04);color:var(--mut);cursor:pointer;backdrop-filter:blur(6px)}
.apinfo{left:12px;font:italic 600 14px Georgia,'Iowan Old Style',serif}.apinfo.on{color:var(--fg);border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.1)}
.alx{right:12px;gap:0}.alx .i{width:14px;height:14px}
.alx>i{position:absolute;right:1px;top:1px;width:8px;height:8px;border-radius:50%;background:var(--line2);border:2px solid var(--card2)}
.alx.on{color:var(--fg);border-color:rgba(126,224,168,.4)}.alx.on>i{background:#7EE0A8;box-shadow:0 0 8px #7EE0A8}
.alx.setup{opacity:.6}.alx.setup .pl{position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:50%;background:var(--card2)}
.act.ap.done .apok{right:auto;left:50%;top:auto;bottom:-8px;transform:translateX(-50%)}
.apmore{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:6px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid var(--line);font-size:12px;color:var(--mut);animation:apfade .2s ease}
@keyframes apfade{from{opacity:0;transform:translateY(-4px)}}
.apgrid{align-items:start}.act.ap .apbox{width:min(118px,58%);margin-top:6px}
/* Music compact + speaker window (owner 2026-11-22). */
.mcard.jzc.cmp .sctl{gap:8px;flex-wrap:wrap}.mcard.jzc.cmp .sctl .ghost{width:34px;height:34px}
.mcard.jzc.cmp .stg{min-height:0}
.dc.spk{border-color:color-mix(in srgb,var(--accent) 45%,transparent);color:var(--accent);gap:7px}.dc.spk .txt{max-width:150px}.dc.spk.on{background:color-mix(in srgb,var(--accent) 14%,transparent)}
.spks{display:flex;flex-direction:column;gap:8px}
.spkh{font-size:10px;margin:6px 2px 0}
.spr{display:grid;grid-template-columns:38px minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:11px 12px;border-radius:18px;border:1px solid var(--line);background:rgba(0,0,0,.25);cursor:pointer;text-align:left}
.spr.on{border-color:color-mix(in srgb,var(--accent) 45%,transparent);background:radial-gradient(90% 90% at 0% 50%,color-mix(in srgb,var(--accent) 10%,transparent),transparent 70%),rgba(0,0,0,.2)}
.spr.na{opacity:.5;cursor:default}
.spi{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--line2);color:var(--mut)}.spr.on .spi{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 55%,transparent)}
.spn{display:flex;flex-direction:column;gap:2px;min-width:0}.spn b{font-size:14px;font-weight:400}.spn small{font-size:11px;color:var(--mut)}
.spv{margin-top:8px;width:100%}
.spdef{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:999px;border:1px solid var(--line2);background:transparent;color:var(--mut);font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}
.spdef .i{width:13px;height:13px}.spdef.on{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 50%,transparent)}.spdef.on .i{fill:currentColor}
@container (max-width:420px){.spdef span{display:none}.spdef{padding:7px}}
.spvl{display:block;margin-top:8px}
.stl{display:flex;align-items:center;gap:8px}.sheart{width:30px!important;height:30px!important;margin-left:-4px}
.mcard.jzc.cmp:has(.msheet.tall){min-height:540px}
.mchips .dc.spk{border-color:color-mix(in srgb,var(--accent) 45%,transparent);color:var(--accent)}
.mcard.jzc.cmp .sctl{position:relative;z-index:3}
/* Music: glass dock (owner 2026-11-22 "quero premium") and a short tone-arm on phones that rests on the record's edge. */
.mchips.mdock{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:2px;overflow-x:auto;margin:0;padding:6px;border-radius:22px;border:1px solid rgba(255,255,255,.07);
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.01));box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 14px 30px -18px rgba(0,0,0,.9)}
.mdock .dc.dk{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:62px;padding:8px 2px;border:0!important;border-radius:16px;background:none;color:var(--mut);font-size:10.5px;letter-spacing:.01em;min-width:0}
.mdock .dk .dki{position:relative;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:var(--fg);transition:background .2s,box-shadow .2s}
.mdock .dk .dki .i{width:19px;height:19px}
.mdock .dk .dkl{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}
.mdock .dk:hover .dki{background:rgba(255,255,255,.06)}
.mdock .dk.on{color:var(--fg)}.mdock .dk.on .dki{background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent);box-shadow:0 0 18px -4px color-mix(in srgb,var(--accent) 70%,transparent)}
.mdock .dk.spk .dki{color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 45%,transparent)}.mdock .dk.spk .dkl{color:var(--accent)}
.dkdot{position:absolute;right:0;top:0;width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);border:2px solid #0b0b0c}
@container (max-width:760px){.mcard.jzc.cmp .mchips.mdock{flex-wrap:nowrap;overflow-x:auto}}
@container (max-width:460px){.mcard.jzc.cmp .stg .arm{--k:.6;right:6px;top:8px}}
/* Premium record (owner 2026-11-22 "quero um disco premium"): fine grooves, two light reflections, a glossy rim, a gold
   ring round the cover label and a soft shadow under the record. Same spin animation as before. */
.bigv{filter:drop-shadow(0 30px 40px rgba(0,0,0,.85))}
.bigv .vinyl{background:
  radial-gradient(circle,transparent 0 33%,rgba(255,255,255,.05) 33.3%,transparent 34.2%),
  radial-gradient(circle,transparent 0 47.6%,rgba(255,255,255,.10) 48%,rgba(0,0,0,.6) 48.8%,#050505 49.4%,rgba(255,255,255,.16) 49.7%,transparent 50%),
  repeating-radial-gradient(circle,#0a0a0b 0 1.1px,#141416 1.1px 1.9px,#0c0c0d 1.9px 2.6px),
  #0b0b0c!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),inset 0 0 40px rgba(0,0,0,.9)}
.bigv .sheen{background:conic-gradient(from 200deg,transparent 0 6%,rgba(255,255,255,.16) 11%,transparent 17% 52%,rgba(255,255,255,.10) 57%,transparent 63% 100%)!important;opacity:1}
.bigv .label{box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 70%,#000),0 0 0 6px rgba(0,0,0,.55),0 0 22px color-mix(in srgb,var(--accent) 30%,transparent),inset 0 0 18px rgba(0,0,0,.45)!important}
.bigv .spindle{background:radial-gradient(circle at 35% 35%,#fff,color-mix(in srgb,var(--accent) 60%,#888) 55%,#2a2a2e)}
.mchips.mdock{padding:6px 4px;gap:0}.mdock .dc.dk{padding:8px 0}.mdock .dk .dkl{font-size:9.5px;letter-spacing:-.01em}
@container (max-width:380px){.mdock .dk .dkl{display:none}.mdock .dc.dk{min-height:48px}}
.mcard.jzc.cmp>.mlib{grid-column:1/-1;margin:0 16px!important;padding:12px 0 16px!important}.mchips.mdock{width:100%;max-width:620px;margin:0 auto}
/* Hero — original layout, premium finish (owner 2026-11-22). */
.hero{border-color:rgba(255,255,255,.07);background:radial-gradient(80% 50% at 85% 0%,rgba(185,200,210,.10),transparent 60%),radial-gradient(70% 40% at 0% 100%,color-mix(in srgb,var(--accent) 6%,transparent),transparent 70%),linear-gradient(170deg,var(--card),var(--card2) 70%);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 40px 70px -34px rgba(0,0,0,.95)}
.hero:before{content:'';position:absolute;top:0;left:14%;right:14%;height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--accent) 55%,#E6C88E),transparent);pointer-events:none;z-index:1}
.hmist{position:absolute;left:-20%;right:-20%;top:38%;height:110px;pointer-events:none;opacity:0;filter:blur(18px);transition:opacity 1s}
.hero.wx-fog .hmist{opacity:1;background:linear-gradient(90deg,transparent,rgba(210,220,225,.07) 40%,rgba(210,220,225,.05) 60%,transparent);animation:hmist 18s ease-in-out infinite alternate}
.hero.wx-cloud .hmist{opacity:.6;background:linear-gradient(90deg,transparent,rgba(200,210,220,.05),transparent)}
.hero.wx-sun{background:radial-gradient(70% 45% at 90% 0%,rgba(242,193,78,.12),transparent 60%),linear-gradient(170deg,var(--card),var(--card2) 70%)}
.hero.wx-wet{background:radial-gradient(80% 50% at 85% 0%,rgba(143,184,255,.12),transparent 60%),linear-gradient(170deg,var(--card),var(--card2) 70%)}
@keyframes hmist{from{transform:translateX(-6%)}to{transform:translateX(6%)}}
.clock{font-weight:100;background:linear-gradient(180deg,#fff 35%,color-mix(in srgb,var(--accent) 25%,#9AA8A2));-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 24px rgba(255,255,255,.08))}
.ccol{animation:ccol 2s steps(1) infinite}@keyframes ccol{50%{opacity:.35}}
.greet{font-family:'Iowan Old Style','Palatino Linotype',Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-.01em;font-size:clamp(22px,2vw,28px)}
.alp{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 10%,transparent),color-mix(in srgb,var(--accent) 3%,transparent))!important;border-color:color-mix(in srgb,var(--accent) 28%,transparent)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 0 24px -10px color-mix(in srgb,var(--accent) 60%,transparent)}
.alp>.i:first-child{width:30px;height:30px;padding:7px;border-radius:50%;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)}
.pp{padding:4px 12px 4px 4px;min-height:44px;border-color:rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))}
.ppav{width:36px;height:36px;position:relative}
.pp.home .ppav{box-shadow:0 0 0 2px var(--card2),0 0 0 3.5px color-mix(in srgb,#7EE0A8 70%,transparent)}
.pp.home .ppav:after{content:'';position:absolute;right:-2px;bottom:-2px;width:10px;height:10px;border-radius:50%;background:#7EE0A8;border:2px solid var(--card2);box-shadow:0 0 6px #7EE0A8}
.pp.home small{color:#7EE0A8}.pp b{font-size:13px}
.ppmap{width:26px;height:26px;border-radius:50%;align-items:center;justify-content:center;border:1px solid var(--line2);margin-left:4px}
.wx{border-top:0;position:relative}
.wx:before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)}
.wxr{display:inline-flex;align-items:center;gap:8px;font-size:11px;color:var(--mut)}
.wxb{position:relative;width:90px;height:4px;border-radius:2px;background:linear-gradient(90deg,#8FB8FF,#F2C14E)}
.wxb i{position:absolute;top:-3px;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:#fff;box-shadow:0 0 8px rgba(143,184,255,.9)}
.hours{gap:6px}.hr{padding:8px 0;border-radius:16px;border:1px solid transparent}
.hr.now{background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.015));border-color:rgba(255,255,255,.09)}
.hr svg{filter:drop-shadow(0 0 6px rgba(230,200,142,.35))}
@media (prefers-reduced-motion:reduce){.ccol,.hero.wx-fog .hmist{animation:none}}
/* House mode menu — "abas + detalhe" (owner 2026-11-22). */
.alm.almc{width:min(360px,calc(100vw - 32px));gap:10px;padding:14px;border-radius:26px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(170deg,rgba(26,28,27,.97),rgba(10,11,11,.98));box-shadow:0 40px 80px -20px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,255,255,.07)}
.almtabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:5px;border-radius:20px;background:rgba(0,0,0,.35);border:1px solid var(--line)}
.alm .almtabs button{position:relative;flex-direction:column;justify-content:center;gap:6px;min-height:64px;padding:8px 2px;border-radius:15px;font-size:11px;color:var(--mut);text-align:center;cursor:pointer}
.alm .almtabs button .i{width:18px;height:18px}.alm .almtabs button .txt{max-width:100%}
.alm .almtabs button[aria-checked="true"]{color:var(--mut);cursor:pointer}
.alm .almtabs button.sel{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 22%,transparent),color-mix(in srgb,var(--accent) 6%,transparent));color:var(--fg);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 20px -8px var(--accent)}
.alm .almtabs button.sel .i{color:var(--accent)}
.alm .almtabs button>i{position:absolute;top:7px;right:9px;width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 6px var(--accent)}
.alm .almtabs button[aria-checked="true"]>.i{margin-left:0}
.almdet{display:flex;flex-direction:column;padding:14px 16px;border-radius:20px;border:1px solid var(--line);background:rgba(255,255,255,.02)}
.almn{font-family:'Iowan Old Style','Palatino Linotype',Georgia,serif;font-style:italic;font-weight:400;font-size:26px;margin:4px 0 6px}
.almr{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line);font-size:13px}.almr:first-of-type{border-top:0}
.almi{width:30px;height:30px;flex:none;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.04);color:var(--mut)}
.almr em{font-style:normal;font-size:12px;color:var(--mut);text-align:right}
.alm .almgo{justify-content:center;margin-top:10px;min-height:46px;border-radius:14px;background:var(--fg);color:#111;font-weight:600}
.alm .alset{border-top:0;border:1px solid var(--line);border-radius:16px;min-height:44px;padding:0 14px}
.ccol{color:#E8EEEB;-webkit-text-fill-color:#E8EEEB}
/* TV sources — "4 favoritas + mais fontes" (owner 2026-11-22). */
.tvlbl{display:flex;align-items:center;justify-content:space-between;margin:18px 2px 8px}
.tvmore{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--mut);background:none;border:0;padding:4px 0;cursor:pointer;font-family:inherit}
.tvfav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:5px;border-radius:22px;background:rgba(0,0,0,.35);border:1px solid var(--line)}
.tvfav button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-height:72px;padding:10px 4px;border:0;border-radius:17px;background:none;color:var(--mut);font-family:inherit;font-size:11px;line-height:1.25;cursor:pointer;min-width:0}
.tvfav button .i{width:22px;height:22px}
.tvfav button .txt{max-width:100%;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;text-align:center}
.tvfav button.on{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 22%,transparent),color-mix(in srgb,var(--accent) 5%,transparent));color:var(--fg);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 22px -8px var(--accent)}
.tvfav button.on .i{color:var(--accent)}
.tvsheet{width:min(460px,100%)}.tvsh{display:block;font-family:'Iowan Old Style','Palatino Linotype',Georgia,serif;font-style:italic;font-weight:400;font-size:26px;margin-top:4px}
.tvlist{display:flex;flex-direction:column;gap:2px}
.tvrow{display:flex;align-items:center;gap:6px;border-radius:16px}.tvrow.on{background:color-mix(in srgb,var(--accent) 9%,transparent)}
.tvpick{flex:1;min-width:0;display:flex;align-items:center;gap:14px;padding:9px 10px;border:0;background:none;color:var(--fg);font-family:inherit;font-size:14px;text-align:left;cursor:pointer}
.tvrow.on .tvpick>.i{color:var(--accent)}
.tvi{width:36px;height:36px;flex:none;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.05);color:var(--mut)}.tvrow.on .tvi{color:var(--accent)}
.tvstar{width:40px;height:40px;flex:none;display:grid;place-items:center;border:0;background:none;color:color-mix(in srgb,var(--mut) 55%,transparent);cursor:pointer}
.tvstar.on{color:var(--accent)}.tvstar.on .i{fill:currentColor}
/* Music: volume in the controls row (owner 2026-11-22: "falta um botão de volume"). */
.sctl.svol{gap:8px;max-width:min(380px,100%);min-height:62px}
.sctl.svol .vline{flex:1 1 auto;max-width:none;margin-left:0;gap:8px;padding:4px 10px 4px 6px;border-radius:999px;background:rgba(9,9,10,.55);border:1px solid rgba(255,255,255,.12);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.sctl.svol .vline .vrange{min-width:0;flex:1}
/* Warm "estúdio" light on the record while music plays (owner 2026-11-22 chose E): a polished golden rim catching a
   key light, two warm reflections turning over the grooves, an amber glow spilling under the record. */
.bigv .vlamp,.bigv .vwarm,.stg .vfx{position:absolute;pointer-events:none;opacity:0;transition:opacity 1.6s ease}
.stg.on .bigv .vlamp,.stg.on .bigv .vwarm,.stg.on .vfx{opacity:1}
.bigv .vlamp{inset:0;border-radius:50%;background:radial-gradient(circle,transparent 0 49%,rgba(255,214,160,.95) 49.6%,rgba(255,170,90,.25) 50.4%,transparent 51.5%);-webkit-mask:conic-gradient(from 230deg,transparent 0 2%,#000 14%,#000 30%,transparent 46% 100%);mask:conic-gradient(from 230deg,transparent 0 2%,#000 14%,#000 30%,transparent 46% 100%);filter:drop-shadow(0 0 6px rgba(255,180,100,.8))}
.bigv .vwarm{inset:0;border-radius:50%;mix-blend-mode:screen;background:conic-gradient(from 0deg,transparent 0 6%,rgba(255,196,128,.32) 9%,rgba(255,170,100,.1) 12%,transparent 16% 56%,rgba(255,196,128,.26) 59%,rgba(255,170,100,.08) 62%,transparent 66% 100%);animation:vlspin 18s linear infinite;animation-play-state:paused}
.stg.on .bigv .vwarm{animation-play-state:running}
.stg .vfx{inset:0;mix-blend-mode:screen;border-radius:inherit;background:radial-gradient(42% 30% at 92% 104%,rgba(255,160,80,.32),transparent 70%),radial-gradient(30% 40% at 70% 0%,rgba(255,210,160,.12),transparent 70%);animation:vlbr 6s ease-in-out infinite}
@keyframes vlbr{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}
@keyframes vlspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.bigv .vwarm,.stg .vfx{animation:none!important}}
/* Filters — "constelação" (owner 2026-11-22). */
.filters.fh{gap:8px;padding:8px 8px 10px}
.fh .rcs{gap:10px;padding:6px 8px 12px;margin:-6px -8px -6px}
.fh .rc{gap:10px;min-height:52px;padding:8px 16px 8px 8px;border-radius:20px;border:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.012));color:var(--fg);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
.fh .rav{position:relative;width:34px;height:34px;flex:none;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.05);color:var(--mut)}
.fh .rav>i{position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:#FFC37A;box-shadow:0 0 8px #FFA845;border:2px solid var(--bg)}
.fh .rtx{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15;text-align:left}
.fh .rtx b{font-size:13.5px;font-weight:500}.fh .rtx small{font-family:inherit;font-size:11px;color:var(--mut);opacity:1;margin-top:3px}
.fh .rc[aria-pressed="true"]{color:var(--fg);border-color:color-mix(in srgb,var(--accent) 45%,transparent);background:radial-gradient(120% 140% at 50% 125%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 60%),linear-gradient(180deg,color-mix(in srgb,var(--card) 90%,#fff 4%),var(--card));box-shadow:0 12px 26px -12px color-mix(in srgb,var(--accent) 45%,transparent),inset 0 1px 0 rgba(255,255,255,.1)}
.fh .rc[aria-pressed="true"] .rav{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 100%,#fff 25%),color-mix(in srgb,var(--accent) 80%,#000 15%));color:var(--on-accent)}
.fh .rc[aria-pressed="true"] small{color:var(--mut);opacity:1}
.cbar{display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.08);box-shadow:inset 0 2px 10px rgba(0,0,0,.6);overflow-x:auto;scrollbar-width:none}
.cbar::-webkit-scrollbar{display:none}
.cbt{flex:1 0 auto;display:flex;align-items:center;justify-content:center;gap:8px;min-width:40px;height:40px;padding:0 10px;border:0;border-radius:999px;background:none;color:var(--mut);font:inherit;font-size:13px;cursor:pointer;transition:background .3s,color .3s}
.cbt .i{width:18px;height:18px}
.cbt.on{flex:2 0 auto;padding:0 16px;color:var(--fg);background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05));box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -6px 12px rgba(0,0,0,.25),0 8px 20px -8px rgba(255,255,255,.22)}
.cbt.on b{font-weight:500;font-size:11px;color:var(--accent)}
.fh .rc[aria-pressed="true"] .rav>i{background:#FFC37A!important;box-shadow:0 0 8px #FFA845!important}
/* Settings start page — "lista de vidro" (owner 2026-11-22). */
.sttl{display:flex;flex-direction:column;gap:4px;min-width:0}.sttl b{font-family:'Iowan Old Style','Palatino Linotype',Georgia,serif;font-style:italic;font-weight:400;font-size:32px;line-height:1.05;letter-spacing:0}
.sthv{gap:12px}
.sthv .stprof{min-height:76px;padding:14px 16px;border-radius:24px;border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);background:radial-gradient(100% 140% at 0% 0%,color-mix(in srgb,var(--accent) 14%,transparent),transparent 60%),rgba(255,255,255,.02)}
.stlogo{width:46px;height:46px;flex:none;border-radius:15px;display:grid;place-items:center;background:linear-gradient(160deg,color-mix(in srgb,var(--accent) 100%,#fff 30%),color-mix(in srgb,var(--accent) 70%,#000 20%));color:var(--on-accent);font:italic 400 23px 'Iowan Old Style','Palatino Linotype',Georgia,serif;box-shadow:0 8px 20px -8px color-mix(in srgb,var(--accent) 60%,transparent)}
.stlist{display:flex;flex-direction:column;border-radius:24px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);overflow:hidden}
.stlist .sthi{position:relative;min-height:66px;padding:12px 16px;border:0;border-radius:0;background:none}
.stlist .sthi+.sthi:before{content:'';position:absolute;top:0;left:66px;right:0;height:1px;background:rgba(255,255,255,.06)}
.stlist .sthi:hover{background:rgba(255,255,255,.03)}
.stlist .sthi .ic{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:#111;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 4px 10px -4px rgba(0,0,0,.8)}
.stval{font-style:normal;font-size:12.5px;color:var(--mut);white-space:nowrap;flex:none}
.sthi .stval+.i{margin-left:-6px}
.stlist .sthi small,.stprof small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stlist .sthi .txt,.stprof .txt{min-width:0}
/* Settings inner pages — "lista de vidro" (owner 2026-11-22). */
.switch[aria-checked="true"] span i{background:var(--on-accent);box-shadow:0 2px 6px rgba(0,0,0,.35)}
.switch[aria-checked="true"] span{box-shadow:0 0 14px -3px color-mix(in srgb,var(--accent) 70%,transparent)}
.stback{width:40px;height:40px;flex:none;border-radius:50%}
.sttl2 b{font-size:30px}
.sheet .stgh{border-bottom:0;min-height:30px;padding:10px 6px 2px}
.sheet .sgrp{gap:8px}
.stey{display:block;font-size:10px;padding:14px 6px 2px}
.sthint{font-size:12px;line-height:1.5;padding:0 6px}
.stgb.gl{gap:0;border-radius:22px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);overflow:hidden}
.stgb.gl>.chk,.stgb.gl .applcfg>.chk{position:relative;min-height:58px;padding:11px 14px;border:0;border-radius:0;background:none;gap:12px}
.stgb.gl>.chk+.chk:before,.stgb.gl .applcfg>.chk+.chk:before{content:'';position:absolute;top:0;left:60px;right:0;height:1px;background:rgba(255,255,255,.06)}
.stgb.gl>span.muted,.stgb.gl>.muted{padding:12px 16px 4px}
.chk>.ti{width:32px;height:32px;flex:none;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.06);color:var(--mut)}
.chk>.ti[style]{color:#111;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 4px 10px -4px rgba(0,0,0,.8)}
.chk>.ti .i{width:17px;height:17px}
.stgb.gl .chk small{font-size:12px}
.stgb.gl .numin{background:rgba(0,0,0,.45);border-color:rgba(255,255,255,.1);border-radius:12px}
/* mode segment with icons */
.mseg{display:flex;padding:4px;border-radius:18px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.07)}
.mseg button{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 0;border:0;border-radius:14px;background:none;color:var(--mut);font:inherit;font-size:11.5px;cursor:pointer}
.mseg button .i{width:18px;height:18px}
.mseg button[aria-selected="true"]{background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05));color:var(--fg);box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}
.offchk{min-width:0;width:28px;height:28px;padding:0;border-radius:50%;border:1.5px solid rgba(255,255,255,.22)}
.offchk .i{width:15px;height:15px}
.offchk.on{border-color:var(--accent);background:var(--accent);color:var(--on-accent);box-shadow:0 0 12px -2px color-mix(in srgb,var(--accent) 70%,transparent)}
.stnote{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);font-size:12.5px;color:var(--mut)}
.stnote .i{flex:none}
.willoff{border-radius:18px}
/* appliances */
.stgb.gl .applcfg{padding:0;border:0;border-radius:0;background:none;gap:0}
.selrow{cursor:pointer}.selrow>.i{color:var(--mut);flex:none}
.selrow select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px}
/* sections */
.grip{width:24px;height:40px;flex:none;display:grid;place-items:center;color:var(--mut);cursor:grab;touch-action:none;margin-right:-4px}
.secrow{transition:transform .18s ease}.secrow.drag{transition:none;z-index:2;background:color-mix(in srgb,var(--raise) 92%,#fff 4%)!important;box-shadow:0 14px 30px -12px #000}
/* themes, compact */
.sheet .thgal{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.sheet .thpv{height:64px}.sheet .thcard{left:8px;right:22px;top:9px;bottom:9px;border-radius:9px;padding:0 8px;gap:4px}
.sheet .thclock{font-size:13px}.sheet .thtx{padding:8px 9px 10px}.sheet .thtx b{font-size:12.5px}.sheet .thtx small{font-size:10px}
.thall{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px;padding:10px 6px;border:0;background:none;color:var(--mut);font:inherit;font-size:11px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;text-align:left}
.thall span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.thall b{display:inline-flex;align-items:center;gap:4px;font-weight:500;color:var(--fg);flex:none}
/* energy diagnosis */
.ediag.stgb{padding:0}
.ediag .edr{position:relative;padding:0;border-radius:0;background:none;border:0;gap:0;font-size:12px}
.ediag .edr+.edr:before{content:'';position:absolute;top:0;left:34px;right:0;height:1px;background:rgba(255,255,255,.06)}
.edh{width:100%;display:flex;align-items:center;gap:12px;min-height:58px;padding:10px 14px;border:0;background:none;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.edh b{display:block;font-size:14px;font-weight:500}.edh small{display:block;font-size:12px;color:var(--mut);margin-top:2px}
.edh em{font-style:normal;font-size:12.5px;color:var(--mut);white-space:nowrap}.edh>.i{color:var(--mut);flex:none}
.edd{width:8px;height:8px;flex:none;border-radius:50%;background:#7EE0A8;box-shadow:0 0 6px #7EE0A8}
.edr.bad .edd{background:#F2C66D;box-shadow:0 0 6px #F2C66D}.edr.bad em{color:#F2C66D}
.ediag .edr.bad{border-left:0}
.edx{display:block;padding:0 14px 8px 34px;color:var(--mut);font-size:11.5px;overflow-wrap:anywhere}.edr.open{padding-bottom:6px}
.pricerow{flex-wrap:wrap;row-gap:8px}.pricerow>.txt{flex:1 1 150px;min-width:0}.pricerow>.row{margin-left:auto}
.pricerow .numin{width:78px;text-align:right}.pricerow select.numin{width:auto}
.sheet .thtx small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* Premium jewel themes (owner 2026-11-22): fills become polished metal from the light to the mid tone, glows use the
   mid tone, cards carry a whisper of the deep tone. */
.prem [style*="background:var(--accent)"],.prem .btn.pri,.prem .sttabs button[aria-selected="true"]{background:linear-gradient(180deg,var(--a1),var(--a2))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 8px 18px -10px var(--a2)}
.prem .switch[aria-checked="true"] span{background:linear-gradient(180deg,var(--a1),var(--a2))}
.prem .card,.prem .sheet{background-image:radial-gradient(120% 80% at 100% 0%,color-mix(in srgb,var(--a3) 22%,transparent),transparent 60%)}
.prem .clock{background:linear-gradient(180deg,var(--fg) 30%,var(--a2) 150%);-webkit-background-clip:text;background-clip:text;color:transparent}
.prem .ccol{color:var(--fg);-webkit-text-fill-color:var(--fg)}
`;
