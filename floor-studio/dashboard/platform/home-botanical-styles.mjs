// Forest Luxe · Botanical start page (home-botanical.mjs). Proportions follow the approved reference
// (1672 × 941 canvas: content column ≈ 2.45 × the rail, footer across both). One stylesheet for both layouts.
export const botanicalStyles=`
.page:has(.bh)>.layout-bar:not(:has(button[aria-pressed="true"])){display:none}
.bh{--bh-gold:#e6c47e;--bh-gold-2:#cfae6c;--bh-line:rgba(232,210,160,.26);--bh-line-soft:rgba(232,210,160,.14);--bh-text:#f6eedd;--bh-muted:#d2c6a9;--bh-green:#63d08b;
 --bh-glass:linear-gradient(160deg,rgba(74,88,64,.42) 0%,rgba(28,42,31,.60) 45%,rgba(14,26,19,.72) 100%);
 --bh-serif:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',system-ui,'Segoe UI',sans-serif;--bh-sans:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter',system-ui,'Segoe UI',sans-serif;
 container:bh/inline-size;color:var(--bh-text);font-family:var(--bh-sans);-webkit-font-smoothing:antialiased;letter-spacing:-.003em;padding:clamp(10px,1vw,18px) clamp(12px,1.7vw,30px) clamp(14px,1.3vw,22px)}
:where(.bh) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:left}
.bh button:focus-visible{outline:2px solid var(--bh-gold);outline-offset:3px}
.bh-grid{min-height:calc(100dvh - 110px);display:grid;grid-template-columns:minmax(0,1fr) minmax(290px,28.2%);grid-template-rows:auto auto 1fr auto;grid-template-areas:"head tools" "head rail" "main rail" "foot foot";column-gap:clamp(14px,1.25vw,22px);row-gap:clamp(12px,1.1vw,18px)}
.bh-head{grid-area:head;display:flex;align-items:center;gap:clamp(14px,1.9vw,32px);padding:clamp(4px,1.4vw,26px) 0 0 clamp(0px,.9vw,16px);min-width:0}
.bh-head h1{margin:0;font:600 clamp(28px,3.1vw,50px)/1.06 var(--bh-serif);letter-spacing:-.025em;color:#fbf4e4;text-shadow:0 2px 18px rgba(0,0,0,.45)}
.bh-head h1 em{font-style:normal;color:var(--bh-gold)}
.bh-head p{margin:.45em 0 0;font-size:clamp(14px,1.2vw,19px);color:#e3d8be;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .7em}
.bh-head p i{font-style:normal;color:var(--bh-gold);opacity:.9}
.bh-avatar{position:relative;flex:none;display:grid;place-items:center;width:clamp(48px,4.3vw,72px);aspect-ratio:1;border-radius:50%;padding:3px;background:linear-gradient(145deg,#f3d798,#9b7a3e 55%,#e9cd8e);box-shadow:0 0 0 1px rgba(0,0,0,.4),0 6px 18px rgba(0,0,0,.45),0 0 20px rgba(222,184,105,.22)}
.bh-avatar img,.bh-avatar>span{width:100%;height:100%;border-radius:50%;object-fit:cover;background:#1d2a20;display:grid;place-items:center;font:400 1.4em var(--bh-serif);color:var(--bh-gold)}
.bh-avatar.big{width:clamp(66px,7vw,118px);padding:4px}
.bh-avatar.home::after{content:"";position:absolute;right:5%;bottom:5%;width:22%;height:22%;max-width:20px;max-height:20px;border-radius:50%;background:#3ccf6e;border:3px solid #10201a;box-shadow:0 0 8px rgba(60,207,110,.6)}
.bh-tools{grid-area:tools;display:flex;justify-content:flex-end;align-items:center;gap:clamp(8px,1.2vw,22px)}
.bh .bh-round{position:relative;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;color:#f1e7d2;transition:background .2s,color .2s}
.bh .bh-round:hover:not(:disabled){background:rgba(255,240,205,.08);color:#fff}
.bh .bh-round:disabled{opacity:.4;cursor:default}
.bh .bh-round .bh-i{width:25px;height:25px}
.bh .bh-edit{border:1px solid var(--bh-line);background:rgba(20,32,22,.55)}
.bh .bh-edit[aria-pressed="true"]{background:var(--bh-gold);color:#1d1708}
.bh-tools .bh-round{background:rgba(10,20,14,.42);border:1px solid rgba(255,255,255,.08);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.bh-dot{position:absolute;top:8px;right:9px;width:9px;height:9px;border-radius:50%;background:#3ccf6e;box-shadow:0 0 0 2px #0f1c14}
.bh-i{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
.bh .hi{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.bh-chev{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none;color:#e9dfc8}
.bh-card,.bh .bh-tile,.bh-music,.bh-plan{position:relative;border-radius:20px;border:1px solid var(--bh-line);background:var(--bh-glass);box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 1px 2px rgba(0,0,0,.25),0 18px 40px rgba(0,0,0,.30)}
@supports ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.bh-card,.bh .bh-tile,.bh-music{-webkit-backdrop-filter:blur(22px) saturate(150%);backdrop-filter:blur(22px) saturate(150%)}}
.bh-card::before,.bh .bh-tile::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(120% 70% at 10% 0%,rgba(240,214,150,.13),transparent 60%)}
.bh-main{grid-area:main;display:flex;flex-direction:column;gap:clamp(12px,1.2vw,20px);min-width:0;align-self:end}
.bh-with-plan .bh-main{align-self:stretch}
.bh-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(10px,1vw,16px)}
.bh .bh-tile{display:flex;flex-direction:row;justify-content:flex-start;text-align:left;align-items:center;gap:clamp(8px,.8vw,14px);min-height:clamp(76px,6.2vw,104px);padding:clamp(10px,1vw,18px) clamp(10px,1vw,18px);min-width:0;transition:border-color .2s,transform .2s}
.bh .bh-tile:hover{border-color:rgba(232,200,130,.7)}
.bh-tile-icon{display:grid;place-items:center;flex:none;color:var(--bh-gold)}
.bh-tile-icon .hi{width:clamp(26px,2.3vw,42px);height:clamp(26px,2.3vw,42px);stroke-width:1.3;filter:drop-shadow(0 1px 6px rgba(206,160,80,.35))}
.bh-tile-text{display:grid;gap:4px;min-width:0;flex:1}
.bh-tile-text strong{font:600 clamp(14.5px,1.15vw,19px)/1.2 var(--bh-serif);letter-spacing:-.01em;color:#fbf3e3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bh-tile-text small{font-size:clamp(12px,.92vw,16px);color:var(--bh-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bh .bh-tile.calm .bh-tile-text small{color:#b9d88c}
.bh .bh-tile.alert .bh-tile-text small{color:#f0b47a}
.bh .bh-tile .bh-chev{opacity:.85}
.bh-bars{width:22px;height:22px;color:var(--bh-gold)}
.bh-switch{position:relative;flex:none;width:clamp(34px,2.7vw,46px);height:clamp(20px,1.6vw,26px);border-radius:99px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);transition:background .25s}
.bh-switch i{position:absolute;top:50%;left:3px;width:calc(clamp(20px,1.6vw,26px) - 8px);aspect-ratio:1;border-radius:50%;background:#efe6d3;transform:translateY(-50%);transition:left .25s;box-shadow:0 1px 3px rgba(0,0,0,.5)}
.bh-switch.on{background:linear-gradient(90deg,#d9a956,#f2cf86);border-color:#f2d596}
.bh-switch.on i{left:calc(100% - clamp(20px,1.6vw,26px) + 5px);background:#fffaf0}
.bh-music{min-height:clamp(76px,6vw,96px);display:flex;align-items:stretch;overflow:hidden}
.bh-music ::slotted(*){flex:1;min-width:0}
.bh-plan{flex:1;min-height:clamp(220px,18vw,340px);overflow:hidden;background:radial-gradient(90% 80% at 50% 40%,rgba(48,64,44,.35),transparent 70%)}
.bh-plan aureon-home-plan{display:block;position:absolute;inset:0}
.bh .bh-plan-open{position:absolute;right:14px;top:14px;display:flex;align-items:center;gap:8px;padding:9px 15px;border-radius:99px;border:1px solid var(--bh-line)!important;background:rgba(14,26,18,.72)!important;font-size:14px;color:#f1e6cc!important}
.bh .bh-title{display:inline-flex;align-items:center;gap:10px;font:600 clamp(16px,1.3vw,21px)/1.2 var(--bh-serif);letter-spacing:-.015em;color:#f8f0de;min-height:34px}
.bh .bh-title .hi,.bh-title>.bh-i{width:clamp(20px,1.6vw,26px);height:clamp(20px,1.6vw,26px);color:var(--bh-gold);stroke-width:1.5}
.bh .bh-title .bh-chev{width:16px;height:16px}
.bh-rooms{display:grid;gap:clamp(8px,.8vw,12px)}
.bh-room-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:clamp(8px,.8vw,14px)}
.bh .bh-room{position:relative;overflow:hidden;aspect-ratio:1.12;border-radius:14px;border:1px solid var(--bh-line-soft);background:#1b2a1f;box-shadow:0 10px 22px rgba(0,0,0,.35)}
.bh .bh-room img,.bh-room>svg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s}
.bh .bh-room:hover img{transform:scale(1.04)}
.bh .bh-room::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(14,20,12,.92) 6%,rgba(18,26,16,.55) 34%,transparent 62%)}
.bh-room-text{position:absolute;z-index:1;left:clamp(5px,.6vw,11px);right:4px;bottom:clamp(6px,.7vw,11px);display:flex;align-items:center;gap:clamp(4px,.5vw,9px);min-width:0}
.bh-room-text>span:last-child{display:grid;min-width:0}
.bh-room-icon{display:grid;place-items:center;flex:none;width:clamp(22px,1.9vw,34px);aspect-ratio:1;border-radius:50%;background:rgba(18,26,18,.6);border:1px solid rgba(232,204,140,.35);color:var(--bh-gold)}
.bh-room-icon .hi{width:62%;height:62%}
.bh-room-text strong{font-size:clamp(11.5px,.95vw,16px);font-weight:600;color:#fff8ea;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.bh-room-text small{font-size:clamp(9.5px,.74vw,12.5px);color:#e2d8c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bh-rail{grid-area:rail;align-self:start;display:flex;flex-direction:column;gap:clamp(12px,1.05vw,17px);min-width:0}
.bh-rail .bh-card{padding:clamp(11px,1vw,18px) clamp(13px,1.2vw,22px)}
.bh .bh-wx{display:grid;gap:clamp(8px,.7vw,12px);width:100%;overflow:hidden;background:linear-gradient(100deg,rgba(14,28,19,.92) 22%,rgba(22,38,24,.55) 62%,rgba(30,44,26,.25)),var(--bh-wx-art) 72% 0%/cover no-repeat,var(--bh-glass)!important}
.bh-wx-loc{display:flex;align-items:center;gap:9px;font-size:clamp(14px,1.1vw,18px);color:#f3ead6}
.bh-wx-loc .bh-i{width:18px;height:18px;color:#f3ead6}
.bh-wx-now{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:clamp(8px,.9vw,14px)}
.bh-wx-temp{display:grid;gap:2px;min-width:0}
.bh-wx-temp b{font:300 clamp(30px,2.8vw,46px)/1 var(--bh-serif);letter-spacing:-.03em;color:#fff6e3;white-space:nowrap}
.bh-wx-temp b small{font-size:.66em}
.bh-wx-temp>span{font-size:clamp(13px,1.05vw,17px);color:#eee4cd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bh-wx-hilo{display:grid;gap:6px;font-size:clamp(12px,.95vw,15px);color:#eee3cb;white-space:nowrap;align-self:start;padding-top:4px}
.bh-wx-icon{position:relative;display:block;width:clamp(48px,4.2vw,72px);aspect-ratio:1}
.bh-wx-icon.small{width:clamp(24px,1.9vw,32px);margin:0 auto}
.bh-wx-frame{position:absolute;inset:0;background-size:600% 100%;background-repeat:no-repeat}
.bh-wx-sun{position:absolute;left:0;top:0;width:68%;height:68%}
.bh-wx-cloud{position:absolute;right:-6%;bottom:-2%;width:86%;height:86%}
.bh-wx-sun .bh-wx-frame,.bh-wx-cloud .bh-wx-frame{inset:0}
.bh-wx-hours{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--bh-line-soft);padding-top:clamp(6px,.6vw,10px)}
.bh-wx-hours>span{display:grid;justify-items:center;gap:2px;min-width:0;border-inline-end:1px solid var(--bh-line-soft)}
.bh-wx-hours>span:last-child{border:0}
.bh-wx-hours small{font-size:clamp(11px,.85vw,14px);color:#e9dfc8}
.bh-wx-hours b{font-size:clamp(12.5px,1vw,16px);font-weight:500;color:#fbf2df;white-space:nowrap}
.bh-wx-empty p,.bh-empty{margin:6px 0 0;font-size:14px;line-height:1.45;color:var(--bh-muted)}
.bh-waste{display:grid;gap:clamp(8px,.8vw,12px);align-content:start}
.bh-bins{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(6px,.6vw,10px)}
.bh-bin-tile{display:grid;justify-items:center;gap:2px;min-width:0;padding:clamp(6px,.6vw,10px) 4px clamp(6px,.6vw,9px);border-radius:12px;border:1px solid var(--bh-line-soft);background:rgba(255,248,230,.045);text-align:center}
.bh-bin{width:clamp(34px,2.9vw,52px);height:auto;filter:drop-shadow(0 5px 7px rgba(0,0,0,.45))}
.bh-bin-tile strong{font-size:clamp(11.5px,.92vw,14.5px);font-weight:600;color:#fbf3e2;line-height:1.2;max-width:100%;overflow-wrap:anywhere}
.bh-bin-tile small{font-size:clamp(10.5px,.82vw,13px);color:#ddd1b6;white-space:nowrap}
.bh-bin-tile small.soon{color:var(--bh-gold);font-weight:600}
.bh-foot{grid-area:foot;align-self:end;display:flex;flex-wrap:wrap;gap:clamp(12px,1.1vw,18px);margin-top:clamp(2px,.6vw,10px)}
.bh-person{flex:1 1 230px;max-width:360px;display:flex;align-items:center;gap:clamp(12px,1.2vw,20px);padding:clamp(12px,1.1vw,18px) clamp(14px,1.3vw,22px);min-width:0}
.bh-person-text{display:grid;gap:6px;min-width:0}
.bh-person-text strong{font:600 clamp(16px,1.3vw,21px)/1.2 var(--bh-serif);letter-spacing:-.015em;color:#fbf3e3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bh-person-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px clamp(12px,1.6vw,26px);font-size:clamp(12.5px,1vw,16px);color:#e6dcc4}
.bh-person-meta>span{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
.bh-person-meta .bh-i{width:18px;height:18px;color:var(--bh-gold)}
.bh-battery i{position:relative;width:24px;height:12px;border:1.6px solid #9ee0ae;border-radius:3px;background:linear-gradient(90deg,#5fd182 var(--level),transparent 0) content-box;padding:1.5px}
.bh-battery i::after{content:"";position:absolute;right:-4.5px;top:2.5px;width:2.5px;height:4px;border-radius:0 1px 1px 0;background:#9ee0ae}
.bh-battery i.low{border-color:#f0a070;background:linear-gradient(90deg,#f08a5a var(--level),transparent 0) content-box}
.bh-robot{flex:2.3 1 440px;display:flex;align-items:center;gap:clamp(10px,1.2vw,22px);padding:clamp(10px,1vw,16px) clamp(14px,1.3vw,22px);min-width:0}
.bh .bh-robot-main{display:flex;align-items:center;gap:clamp(12px,1.4vw,26px);flex:1;min-width:0}
.bh-robot-art{width:clamp(96px,9vw,150px);height:auto;flex:none;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
.bh-robot-art.cleaning .bh-robot-leds{animation:bh-pulse 1.4s ease-in-out infinite}
@keyframes bh-pulse{50%{opacity:.25}}
.bh-robot-text{display:grid;gap:6px;min-width:0}
.bh-robot-text small span{overflow:hidden;text-overflow:ellipsis}
.bh-robot-text strong{font:600 clamp(16.5px,1.35vw,22px)/1.2 var(--bh-serif);letter-spacing:-.015em;color:#fbf3e3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bh-robot-text small{display:flex;align-items:center;gap:7px;white-space:nowrap;min-width:0;overflow:hidden;font-size:clamp(12.5px,1vw,16px);color:#e6dcc4}
.bh-robot-text small .bh-i{width:17px;height:17px;color:var(--bh-green);fill:currentColor;stroke:none}
.bh-robot-plan{display:flex;align-items:center;gap:clamp(10px,1vw,16px);flex:0 1 auto;min-width:0;padding:clamp(9px,.8vw,13px) clamp(12px,1.1vw,18px);border-radius:16px;border:1px solid var(--bh-line-soft);background:rgba(8,18,12,.42)}
.bh-robot-plan>span{display:grid;gap:3px;min-width:0}
.bh-robot-plan small{font-size:clamp(11.5px,.92vw,14.5px);color:#e1d6bc;white-space:nowrap}
.bh-robot-plan b{font-size:clamp(12.5px,1vw,16px);font-weight:500;color:#fbf3e2;white-space:nowrap}
.bh-cal{width:clamp(24px,2vw,32px);height:clamp(24px,2vw,32px);color:#efe5cf;stroke-width:1.3}
.bh-robot-plan .bh-round{width:46px;height:46px;border:1.5px solid #f2e7cf}
.bh-robot-plan .bh-round .bh-i{width:20px;height:20px;fill:currentColor}
.bh-robot-empty{opacity:.82}
@container bh (max-width:1180px){
 .bh-grid{grid-template-columns:minmax(0,1fr) minmax(270px,29%)}
 .bh .bh-tile{gap:9px;padding-inline:11px}
 .bh .bh-tile .bh-chev{display:none}
}
@container bh (max-width:1000px){
 .bh-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}
 .bh .bh-tile .bh-chev{display:block}
 .bh-robot{flex-wrap:wrap}
}
@container bh (max-width:860px){
 .bh-grid{grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto;grid-template-areas:"head tools" "main main" "rail rail" "foot foot"}
 .bh-main{align-self:start}
 .bh-grid{min-height:0}
 .bh-rail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
 .bh-rail>.bh-wx{grid-column:1/-1}
 .bh-room-grid{grid-template-columns:repeat(auto-fill,minmax(118px,1fr))}
 .bh-person{max-width:none}
}
@container bh (max-width:560px){
 .bh{padding:10px 10px 16px}
 .bh-grid{grid-template-areas:"head head" "tools tools" "main main" "rail rail" "foot foot"}
 .bh-tools{justify-content:flex-start;gap:4px;padding:0}
 .bh-head{gap:12px;padding:6px 0 0}
 .bh-head h1{font-size:27px}
 .bh-head p{font-size:13.5px}
 .bh-tiles{gap:8px}
 .bh .bh-tile{padding:11px 12px;min-height:70px;gap:9px}
 .bh .bh-tile .bh-chev,.bh .bh-tile .bh-bars{display:none}
 .bh-room-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
 .bh-room-icon{display:none}
 .bh-rail{grid-template-columns:minmax(0,1fr)}
 .bh-foot{flex-direction:column}
 .bh-robot{flex-direction:column;align-items:stretch}
 .bh-robot-plan{justify-content:space-between}
 .bh-plan{min-height:300px}
}
@media(prefers-reduced-motion:reduce){.bh *{animation:none!important;transition:none!important}}
`;
