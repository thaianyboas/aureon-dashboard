# AUREON Dashboard

## AUREON Noir 1.4.5 — 2026-11-18

- "Alexa avisa ao terminar" encontra também a automação que observa a tomada da máquina (mesmo nome de máquina ou mesmo cômodo).
- Cômodo escolhido aparece na cor do tema (dourado no Noir).
- Ao tocar num cômodo, o nome dele aparece inteiro abaixo dos botões fixos.

## AUREON Noir 1.4.4 — 2026-11-18

- Máquina de lavar, lava-louças e secadora sempre aparecem; sem aparelho ligado ao HA, aparece o cartão "Configurar".
- Configurações → Aparelhos: escolher de onde vem cada máquina (aparelho inteligente ou tomada) e esconder as que não quiser.
- Configurações → Modo da casa: configurar cada modo (Fora, Férias, Noite…) e as tomadas que desligam.
- Tocar num cômodo do mapa leva direto aos dispositivos desse cômodo.
- AUREON Music na página inicial mais baixo: controles, volume e biblioteca numa linha só.

## AUREON Noir 1.4.3 — 2026-11-18

- Nome escrito por você (no painel ou no HA) aparece exatamente como escrito.

## AUREON Noir 1.4.2 — 2026-11-18

- Configurações salvas no Home Assistant: as mesmas em todos os aparelhos, com aviso "Salvo em todos os aparelhos".
- Configurações: botão Voltar, abas fixas no topo, nada cortado; etiquetas com "Não usar / Mostrar só estes / Esconder estes" e explicação.
- Nomes: "Flur - Lampen" no cômodo Flur aparece como "Lampen" (sem o traço solto).

## AUREON Noir 1.4.1 — 2026-11-18

- Tocar na foto de uma pessoa abre o mapa do Home Assistant com onde ela está.

## AUREON Noir 1.4.0 — 2026-11-18

- Etiquetas 100% do Home Assistant: nome, cor, ícone e descrição; a função vem da descrição
  (ex.: `systemgeraete_dashboard` protege roteador/aquecimento); etiquetas no dispositivo valem para as entidades;
  atualiza sozinho quando uma etiqueta muda. Nova aba Etiquetas: Normal / Só estes / Esconder.
- Pessoas: onde cada um está (zona, em casa, "a caminho · ~5 min" com a integração Proximidade) e aviso
  "Fulano chega em casa em ~5 min". Novo blueprint `person_arriving.yaml` para notificar no celular.

## AUREON Noir 1.3.0 — 2026-11-18

- "Acontecendo agora": todos os cartões do mesmo tamanho; lixo compacto com "Hoje", "Amanhã" e datas (20.11);
  o mapa do robô abre na janela do Home Assistant.
- Botão redondo "voltar ao topo" no canto de baixo à direita.
- Televisão é uma seção própria (ligar/desligar, volume, sem som), não mais caixa de som.
- Configurações → Dispositivos: grupo Televisão e "Onde tocar · saídas de som" para escolher quais aparelhos aparecem.

## AUREON Noir 1.2.4 — 2026-11-17 (segurança dos modos)

- Geladeira/freezer, internet (router, FritzBox, Wi-Fi), Home Assistant/servidor/ISG, aquecimento e aquário ficam
  protegidos automaticamente, mesmo sem etiqueta: nunca desligam pelo painel nem pelos modos.
- Na janela de Fora/Férias, cada tomada tem um botão "desligar" claro; o painel mostra "Vai desligar (n): …" e o botão diz
  quantas tomadas vai desligar antes de ativar.
- Uma tomada protegida que estiver desligada pode ser religada pelo painel.

## AUREON Noir 1.2.3 — 2026-11-16

- AUREON Music: Playlists, Recentes, Álbuns, Curtidas, Podcasts, Onde tocar e busca abrem numa janela por cima do player.
- Volume novo: botões − e +, linha dourada para arrastar e o número.

## AUREON Noir 1.2.2 — 2026-11-16

- "Acontecendo agora" sem o cartão de música (o AUREON Music logo abaixo já mostra e controla).

## AUREON Noir 1.2.1 — 2026-11-16

- Biblioteca do AUREON Music em lista elegante; o início mostra 4 itens e "Ver tudo no AUREON Music" abre a página completa.
- Seções abrem e fecham pelo título (o painel lembra).
- Configurações do robô e "Não perturbe" das Alexas não aparecem mais como tomadas.
- Blueprints da Alexa funcionam com a integração Alexa Devices (nativa) e com a Alexa Media Player.

## AUREON Noir 1.2.0 — 2026-11-16

- Topo mais limpo: o tema fica só em Configurações; previsão do tempo compacta (uma linha + 6 horas).
- Casa 3D: nomes dos cômodos em plaquinhas que nunca ficam uns em cima dos outros.
- AUREON Music "Palco": vinil grande com braço de toca-discos, botão de volume giratório, repetir, próxima/anterior
  enviados direto para a Alexa quando a música toca num Echo ou grupo Alexa.
- Coleta de lixo com lixeiras ilustradas: a próxima coleta em destaque, "hoje" sempre visível, próximos dias embaixo,
  nomes curtos (Restmüll, Papier, Bio).
- Luzes e tomadas agrupadas por cômodo (fechadas no celular, abertas no computador).
- Máquinas: programa e temperatura, linha "Alexa avisa ao terminar" (liga/desliga a automação do blueprint),
  máquinas antigas acompanhadas pela tomada com medição.
- Robô: cômodo atual e progresso cômodo a cômodo (Dreame). Energia: hoje, custo hoje, este mês.

## AUREON Noir 1.1.0 — 2026-11-16

- **Lembretes** no topo (luzes acesas por cômodo, janela aberta com aquecimento ligado, porta destrancada, fim de ciclo,
  coleta de lixo), cada um com ação; **Minimizar** deixa só uma barrinha (lembrado neste navegador).
- **Previsão do tempo** da cidade (agora, próximas horas, máx./mín.) via `weather/subscribe_forecast`.
- **Modo da casa**: Em casa · Fora · Férias · Noite. Cada modo mostra o que vai fazer e só age depois de **Ativar**:
  alarme, apagar luzes, desligar as tomadas escolhidas (protegidas nunca), e Em casa religa as que Fora/Férias desligaram.
- **Configurações** (engrenagem): tema, vista 3D/Planta, previsão, quais lembretes aparecem, seções (mostrar/ordem),
  **etiquetas** por seção ("mostrar só com" / "esconder com"), **dispositivos** (mostrar/ocultar cada um, inclusive caixas
  de som ocultas no Home Assistant), exportar/importar configurações.
- AUREON Music mais compacto; o mapa do robô (câmera do Dreame) aparece no cartão do robô; tocar numa câmera abre a câmera do HA.
- **Blueprints da Alexa** (fim de ciclo): `blueprints/automation/aureon/appliance_done_status.yaml` (sensor de status) e
  `appliance_done_power.yaml` (tomada com medição). Importar: Configurações → Automações → Blueprints → Importar blueprint →
  colar o link do arquivo no GitHub. Precisam da integração Alexa Media Player.

## AUREON Noir 1.0.0 — 2026-11-16 (painel inteiro substituído a pedido da dona)

O painel do HACS agora é o **AUREON Noir**: uma página só com a casa inteira, lida direto dos registros do Home Assistant
(áreas, dispositivos, entidades e etiquetas). Nenhum entity_id é adivinhado; nenhum comando é enviado sem um toque.

**O que tem**
- Relógio, saudação e resumo da casa; casa em **3D** ou **Planta** (cada área do HA vira um cômodo; tocar filtra o painel).
- **Cenas** (scene.*), **Acontecendo agora**: música, máquina de lavar/secar/lava-louças (progresso e fim de ciclo com aviso),
  coleta de lixo (os mesmos formatos de sensor do AUREON anterior), robô aspirador (vacuum.*) e cortinas em movimento.
- Seções: Luzes (brilho e cor), Clima (termostatos), Tomadas e interruptores (consumo em W), Energia (soma das tomadas com
  medição; solar e bateria já preparados — aparecem sozinhos quando existir um sensor de potência solar), Cortinas e
  persianas, Portas e janelas, Segurança (alarme, fechaduras, câmeras) e **AUREON Music**.
- **AUREON Music** usa o SpotifyPlus de verdade (o mesmo controlador do AUREON anterior): biblioteca (playlists, recentes,
  álbuns, curtidas, podcasts), busca, curtir a música, **Onde tocar** (Spotify Connect) e as caixas por cômodo.
- **Editar painel**: arrastar ou mover cartões, ocultar, reordenar seções, renomear. Renomear muda o nome no Home Assistant
  (registro de entidades/dispositivos) **só para administradores e só depois de confirmar**; para outros usuários o nome
  muda só neste navegador.
- **Temas**: Aureon, Âmbar, Oceano, Ametista, Jade, Rosé, Platina e "Home Assistant" (segue o tema do HA).
- Idioma automático pelo Home Assistant (português, alemão ou inglês). Nenhum texto é cortado em telas pequenas.

**Etiquetas (Configurações → Áreas, etiquetas e zonas → Etiquetas)**
- `no_dboard` — a entidade nunca aparece no painel.
- `protegida` (ou `immer_an`, `always_on`) — tomada que **nunca** pode ser desligada pelo painel (mostra um cadeado).
- `steckdosen_dashboard` — um interruptor que é tomada.

**Como atualizar**
1. HACS → AUREON Dashboard → ⋮ → **Atualizar** (ou Baixar novamente).
2. Recarregue o navegador sem cache (no celular/iSG: feche e abra o app).
3. O painel continua no mesmo lugar: cartão `custom:aureon-dashboard` ou estratégia `custom:aureon-dashboard`.
   O cartão `custom:aureon-music-player` mostra só o AUREON Music.

**Voltar para a versão anterior**: a versão 0.29.0-test.5 está em `rollback/v0.29.0-test.5/aureon-dashboard.js`
(e a v0.28.0 em `rollback/v0.28.0/`). O editor 3D Floor Studio e as páginas antigas não fazem parte do AUREON Noir.

**Desenvolvimento**: código em `noir/`; `npm ci && npm run build:noir` gera `dist/aureon-dashboard.js` e o hash;
`node --test noir/tests/*.test.mjs` e `node scripts/test-noir-browser.mjs` (Chrome real + casa sintética, sem dados pessoais).

---

## Histórico anterior

**Prévia HACS 0.29.0-test.5.** Selecione Forest Luxe · Botanical em Configurações → Aparência. Alterne em Configurações → Página Início → Exibir planta 3D. A versão anterior pode ser recuperada pelo commit `2e196a1`, e a versão estável continua em `rollback/v0.28.0/`.

**Owner test build 0.29.0-test.3 (2026-11-03).** At the owner's request the HACS distribution in `dist/` now carries the current AUREON platform build for testing in her own Home Assistant. The compact settings and visual theme gallery have owner approval; this remains an owner test build. It needs the matching NeonPlan3D AUREON integration from `thaianyboas/aureon-integration` (same `neonplan3d` domain; replaces the official integration, keeps its storage). The previous stable v0.28.0 file is kept in `rollback/v0.28.0/`. See [OWNER_TEST_2026-11-01.md](OWNER_TEST_2026-11-01.md).

## Balance and personal cards — 2026-11-02

Select **Aubergine · Balance** in Settings → Appearance → AUREON theme for the approved burgundy,
plum and champagne palette. The equipment view groups native controls by function and offers combined
room, type, availability and Label filters. Labels only filter the current equipment view; choose All labels or clear the active chip to reset. Earlier global include/exclude rules are retired. Reserved no_dboard visibility and system-device control restrictions still apply.

Use **Edit cards** on a dashboard page to remove/restore cards, rename them, change size, move them
with the arrows, or add an eligible equipment card. Arrows move cards among siblings in their section.
**Undo** restores the previous edit; **Reset layout** restores that page. Personal layouts stay in this
Home Assistant user's browser and are included in settings export/import. They do not rename HA entities,
change automations or call services. Equipment controls keep their original Home Assistant permissions.

Update both the dashboard and matching AUREON integration from HACS, then restart Home Assistant
for the integration and refresh the browser cache. This is an owner-authorized master test build;
physical Home Assistant/iSG acceptance is still separate from the automated synthetic-fixture checks.

## Approved settings revision — 2026-11-03

Settings use compact categories, bounded equipment/source lists, expandable room pictures and a compact
mobile More menu. Home Assistant controls the language automatically, including existing installations
that previously saved a manual choice. Choose among 26 visual theme miniatures in Appearance; selection
applies immediately, shows the active palette and preserves gallery scroll.

For this settings revision, update **AUREON Dashboard** in HACS and reload the browser. The integration's
renderer/editor/backend did not change; its existing 69857f1 source pin remains compatible.

## Floor Studio source integration

`floor-studio/` contains the supplied consolidated source checkpoint, the original MIT-licensed NeonPlan3D frontend/editor/backend, five visual modes (Neon, Blueprint, Day, Night, Real) and four optional AUREON modules: Window Watch, Announcements, Heat Monitor and House Answers. Each module requires explicit administrator approval. AUREON's distribution scope is free/open-source functionality and the user-supplied AUREON extensions only. No commercial furniture packs, paid Pro extensions, or personal apartment presets may be bundled. Compatibility code inherited from the open-source upstream may remain, but commercial assets and promotional materials are outside the AUREON scope.

The build uses the exact frontend lockfile. The tested module implementations and the modules bundled in the frontend are checked for byte-for-byte parity. Real currently uses procedural palette/shader shading; it is not a completed PBR renderer.

```sh
npm ci --prefix floor-studio/neonplan3d-main/frontend
npm run validate
python3 -m unittest discover -s floor-studio/tests -p 'test_*.py'
npm test
npm run build
npm run readiness
```

Gate regression tests isolate the missing-evidence case and also run after a build; runtime readiness stays blocked. `npm run build` typechecks, compiles all NeonPlan3D bundles, records hashes and packages a **candidate only** under `build/floor-studio-candidate`. It does not overwrite the stable HACS distribution. GitHub Actions runs source tests, the build and backend tests and uploads the candidate without creating releases or development branches.

## Installation blockers

The supplied dashboard bridge uses the NeonPlan3D integration's original card and `/neonplan3d` editor. Updating this repository as a HACS **Dashboard** does not install the Python backend or replace the original integration's served frontend. A supported HACS installation path for the modified integration must be validated before promotion. The nested backend is source, not a claim of HACS integration packaging.

The readiness gate remains blocked until actual Home Assistant functional testing verifies the floor view, administrator editor, nonadministrator restrictions, project persistence and module permissions. Backend unit tests use Home Assistant's test harness with mocked frontend registration; they do not establish browser/runtime acceptance. No runtime evidence is fabricated.

Upstream license: `floor-studio/neonplan3d-main/LICENSE`. Unrelated upstream demo media, firmware, shop tooling and tutorial recordings are omitted; the complete supplied ZIP was inspected locally.

## Platform and music candidate

The expanded mission is tracked in [PLATFORM_ROADMAP.md](floor-studio/PLATFORM_ROADMAP.md). All nine original ZIPs were recovered and fingerprint-verified; [INTEGRATION_MATRIX.md](floor-studio/INTEGRATION_MATRIX.md) distinguishes available source, licenses, actual integrations and pending work. The ninth project is SpotifyPlus Card.

The original AUREON Music Player Full/Compact is implemented under `floor-studio/dashboard/music`, compiled into the review-only dashboard candidate and mounted in Medien/Startseite. SpotifyPlus and optional Spotcast remain independent backends. The official supplied image guides the composition, without a commercial button or fictional default cover/person. ControlRoom Music Card is unchanged.

`npm run build` now compiles both native NeonPlan frontend and the dashboard candidate and verifies their separate evidence. `npm run test:browser` uses a real Chrome/Chromium (`CHROME_BIN`) with isolated synthetic HA fixtures, not an installed HA instance. CI runs it after compilation. See [music validation](floor-studio/MUSIC_VALIDATION_2026-10-30.md) for implemented behavior and limits. Stable `dist/` remains v0.28.0; do not update expecting this player yet.
