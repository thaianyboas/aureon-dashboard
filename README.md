# AUREON Dashboard

## AUREON Noir 1.8.0 — 2026-11-22

- Fontes da TV redesenhadas: uma barra com 4 fontes favoritas com ícones (a que está passando fica verde e sempre aparece) e "Mais fontes" com a lista completa; toque na ★ para escolher suas 4 favoritas (salvas em todos os aparelhos).

## AUREON Noir 1.7.9 — 2026-11-22

- Menu do modo da casa redesenhado: abas em vidro com os 4 modos e um painel mostrando o que cada modo faz (alarme, luzes, tomadas). Tocar numa aba só mostra; "Ativar" abre a confirmação de sempre.
- Relógio: os dois pontos não somem mais no iPhone.

## AUREON Noir 1.7.8 — 2026-11-22

- Topo do painel com acabamento premium (mesmo layout): relógio fino com degradê e dois pontos piscando, saudação em itálico, modo da casa em vidro com brilho, fotos com anel e luz verde quando em casa, barra mínima→máxima no tempo, hora atual destacada na previsão e um fundo que acompanha o céu (névoa, sol, chuva).

## AUREON Noir 1.7.7 — 2026-11-22

- AUREON Music mais rápido: o play muda na hora e vai direto para a caixa padrão (a lista de caixas é lida antes); escolher uma caixa já começa a tocar nela; depois de cada toque o player é atualizado logo em seguida.

## AUREON Noir 1.7.6 — 2026-11-22

- AUREON Music mais compacto e premium: disco com sulcos finos, reflexos e anel no selo (continua girando); braço menor que não passa pelos botões; todos os controles numa fila.
- Opções numa barra de vidro com ícones: Caixa, Playlists, Recentes, Álbuns, Curtidas, Podcasts, Buscar.
- Botão "Caixa" abre a janela das caixas de som: Alexas do Spotify (a que toca com equalizador e volume) e as outras caixas do HA. ⭐ deixa uma caixa como padrão — o play vai para ela quando nada está tocando (salvo para todos os aparelhos).
- "Caixas de som por cômodo" sai de baixo do player (continua no modo Editar painel).

## AUREON Noir 1.7.5 — 2026-11-22

- Máquinas pela tomada: o painel aprende quanto tempo uma lavagem costuma durar (últimos 10 dias da tomada, mediana de pelo menos 2 ciclos) e mostra no visor o horário estimado de término (≈), com a barra de progresso. Somente leitura.
- Cartões das máquinas mais limpos: os detalhes ficam num botão "i" (canto esquerdo); o aviso da Alexa é um sino pequeno no canto direito, com luz verde quando ligado (um toque liga/desliga).

## AUREON Noir 1.7.4 — 2026-11-22

- "Acontecendo agora" em visual rico: máquinas desenhadas (água e anel azul quando lavando, ✓ e brilho quando terminam); o visor mostra o horário de término (ou há quanto tempo está ligada, nas máquinas pela tomada).
- Aviso da Alexa vira o botão "Alexa avisa" (pontinho verde quando ligado).
- Lixo: lixeira grande, anel com os dias que faltam e as próximas lixeiras coloridas. Robô desenhado com anel de bateria.
- Blueprints "Alexa avisa o fim do ciclo": nova opção **Volume do aviso** (padrão 60%). A Alexa fala nesse volume e depois volta ao volume anterior. Reimporte os blueprints no HA para usar.

## AUREON Noir 1.7.3 — 2026-11-22

- Luzes em novo visual premium: cada luz acesa enche a linha com a própria cor até o brilho; porcentagem grande e interruptor na cor da luz. Arraste para o lado na linha para ajustar o brilho; um toque acende/apaga; tocar no nome abre os detalhes.
- Cômodos com luz acesa ganham um brilho na cor da luz; apagados ficam neutros.
- Clima: o título não diz mais "todos no alvo" quando um cômodo está acima do alvo ("nenhum aquecendo").

## AUREON Noir 1.7.2 — 2026-11-22

- Tomadas e interruptores em novo visual premium ("Painel"): cada cômodo é um cartão de vidro com watts e "x de y ligadas"; cada aparelho é um bloco com o próprio ícone (brilha quando ligado), watts e interruptor.
- Protegidas mostram "Protegida" com cadeado no lugar do interruptor e nunca desligam pelo painel. No celular os cômodos continuam abrindo com a seta.
- Testes: dados de teste usam a data local (antes falhavam entre 0 h e 1 h).

## AUREON Noir 1.7.1 — 2026-11-21

- Clima em novo visual premium: mostrador com risquinhos que acendem até a temperatura de agora, ponto branco no alvo, tendência da última hora, mini gráfico das últimas 6 horas com a linha do alvo, e botões − / + de vidro.
- Etiqueta honesta: "No alvo" só quando está a até 0,5° do alvo; "Acima do alvo" / "Abaixo do alvo" quando não; "Aquecendo" e "Desligado" como antes.
- "Chega ao alvo em" (estimativa) quando está aquecendo e a temperatura sobe; umidade quando o termostato informa.
- No modo "Editar painel" o Clima continua com os blocos antigos. Energia sem mudanças.

## AUREON Noir 1.7.1 — 2026-11-21

- Clima em novo visual premium: mostrador que acende até a temperatura de agora, ponto branco no alvo, tendência da última hora, mini gráfico das últimas 6 horas com a linha do alvo, umidade e "chega ao alvo em" quando aquece; botões − / + de vidro.
- Etiqueta do termostato pelos números: "No alvo" (até 0,5°), "Acima do alvo", "Abaixo do alvo", "Aquecendo" ou "Desligado".
- Energia mais curta: mostrador menor, Hoje / Este mês enxutos; "Últimos 12 meses", "Quem consome agora" e "Por cômodo" ficam num cartão só e começam fechados.

## AUREON Noir 1.7.0 — 2026-11-21

- Energia em novo visual premium ("Medidor"): mostrador com escala e brilho, pico do dia em dourado, comparação com ontem e média do dia, curva de consumo hora a hora, Hoje e Este mês com previsão do fim do mês.
- 12 meses em cartão próprio, com total do ano e mês passado.
- "Quem consome agora": ícone de cada aparelho dentro de um anel que mostra a parte dele no total; aparelhos em espera (≤ 5 W) ficam juntos numa linha que abre ao tocar. Tocar num aparelho abre os detalhes no HA.
- Tudo vem das estatísticas do Home Assistant (somente leitura); o que o HA não tiver simplesmente não aparece.

## AUREON Noir 1.6.9 — 2026-11-21

- Portas e janelas: os ícones mostram o estado de verdade — porta aberta gira na dobradiça e janela aberta abre as folhas, com uma luz por trás e um leve balanço. Fechou, volta ao desenho fechado. Sem animação se o aparelho pedir menos movimento.

## AUREON Noir 1.6.8 — 2026-11-21

- Portas e janelas: novo cartão "Escudo" — anel com brilho, "tudo fechado" ou quantas estão abertas (âmbar), e um bloco por cômodo com o tempo aberto.
- Televisão: novo cartão "Cinema" — a fonte em letra grande itálica, botão de ligar com brilho, linha de volume (toque para ajustar), mudo e fontes como chips.
- No modo "Editar painel" as duas seções continuam com os blocos antigos para mover, esconder e renomear.

## AUREON Noir 1.6.7 — 2026-11-21

- Mapa 3D e planta: o cômodo "Sem cômodo" só aparece se houver um aparelho sem área que funciona e não está escondido (aparelhos indisponíveis, como Echo Dots antigas, não contam mais).

## AUREON Noir 1.6.6 — 2026-11-21

- Em todo o painel, tocar no nome de um aparelho abre os detalhes do Home Assistant; aparelhos sem cômodo abrem direto nas configurações do HA para escolher a área ("Definir cômodo").
- "Sem cômodo" explica o que fazer; cômodos apagados no HA também contam como sem cômodo.

## AUREON Noir 1.6.5 — 2026-11-20

- iPhone: janelas (Configurações, baterias, cartões, modo da casa) não sobem mais até o relógio/notch nem descem até a barra de baixo.
- Configurações: botão de voltar ao topo depois de descer.

## AUREON Noir 1.6.4 — 2026-11-20

- Temas: galeria com miniatura de cada tema (fundo, cartão, relógio e cor de destaque), em famílias — Clássicos, Metais, Pedras preciosas, Cores da noite e Home Assistant.
- 8 temas novos: Ônix, Pérola, Ouro rosé, Titânio, Rubi, Terracota, Petróleo e Índigo (24 no total).

## AUREON Noir 1.6.3 — 2026-11-18

- Energia: "Quem consome agora" começa fechado e abre na seta; gráfico e "Por cômodo" também abrem e fecham (salvo em todos os aparelhos).
- 8 temas novos: Champagne, Cobre, Bordô, Esmeralda, Safira, Aurora, Oliva e Grafite.

## AUREON Noir 1.6.2 — 2026-11-18

- Modo edição: botão "Adicionar cartão" no topo; no celular os olhinhos da data e do modo da casa não ficam mais um em cima do outro.

## AUREON Noir 1.6.1 — 2026-11-18

- Editar painel (etapa 2): "Adicionar cartão" — qualquer cartão do Home Assistant ou instalado pelo HACS (Mushroom, mini-graph…) entra no bloco "Meus cartões", com prévia ao vivo, editor visual do próprio cartão e YAML. Cada cartão pode ser movido, editado, ficar em largura inteira ou ser removido.

## AUREON Noir 1.6.0 — 2026-11-18

- Editar painel (etapa 1): todos os blocos da página (Lembretes, Início, Cenas, Acontecendo agora, AUREON Music, Aparelhos e seções) podem ser movidos e escondidos; "Acontecendo agora", "Cenas" e cada seção podem ser renomeados.
- Início: data, relógio, saudação, pessoas, tempo, modo da casa e mapa podem ser escondidos; saudação própria com {nome}.
- "Restaurar padrão" volta tudo; salvo no Home Assistant para todos os aparelhos.

## AUREON Noir 1.5.9 — 2026-11-18

- Configurações: todo título abre e fecha (fica salvo em todos os aparelhos).
- Diagnóstico de energia saiu da página e foi para Configurações → Geral (fechado por padrão).
- Saiu a frase "Toque num cômodo para ver os dispositivos".

## AUREON Noir 1.5.8 — 2026-11-18

- Energia: "Mês passado" e "Este ano" (kWh e €) e um gráfico dos últimos 30 dias ou 12 meses, tudo das estatísticas do Home Assistant.

## AUREON Noir 1.5.7 — 2026-11-18

- Energia: o sensor "Power" (W) de uma tomada com a etiqueta no_dboard agora é usado para medir essa tomada (a etiqueta só esconde o sensor como cartão). Consumo agora volta a ser medido de verdade nas tomadas Meross e outras.

## AUREON Noir 1.5.6 — 2026-11-18

- Energia: aparelhos estimados pelo contador de kWh não são mais chamados de "medidos"; o número no botão Energia conta todos os aparelhos com valor.

## AUREON Noir 1.5.5 — 2026-11-18

- Energia — consumo em tempo real reescrito para qualquer marca (Meross, Tapo, Shelly, Tuya, IKEA, Zigbee2MQTT, Matter…): um sensor de potência por aparelho (W/kW/mW), também sensores ocultos, sensores sem dispositivo (pelo nome da entidade) e potência como atributo da tomada.
- Nunca mostra 0 W sem medição: sensor indisponível = sem valor; sem nenhuma medição aparece "—".
- Tomada desligada ainda conta a potência real que o sensor informa; celulares, medidor geral e rede não entram como consumidores; média/pico não são somados.
- Aparelho só com kWh: potência ESTIMADA pelo aumento do contador nos últimos 30 min, marcada "estimado".
- "Consumo monitorado agora" (não é a casa inteira); solar/rede/bateria só aparecem com sensores reais.
- Diagnóstico de energia: por aparelho, qual sensor de potência e de energia o Home Assistant entrega.

## AUREON Noir 1.5.4 — 2026-11-18

- Energia calcula sozinha: soma os medidores de energia (kWh) da casa pelas estatísticas do Home Assistant — hoje e este mês. Com a etiqueta "Verbrauch" só esses aparelhos contam; sem ela, todos os medidores (sem solar, rede e cópias "heute/Monat").
- Preço da energia em Configurações → Geral → Energia (€/kWh); custo de hoje e do mês calculados.
- "Quem consome agora" mostra também os kWh de hoje de cada aparelho.

## AUREON Noir 1.5.3 — 2026-11-18

- Blueprint "Avisa quando alguém está chegando": corrigido o erro "'distance_sensor' is undefined" (o gatilho agora usa trigger_variables). Reimporte o blueprint no HA.

- Celular: AUREON Music ocupa o cartão inteiro e os botões da biblioteca não ficam mais cortados.
- Lembretes: "luz acesa" e "coleta de lixo" não aparecem mais por padrão (já se vê no mapa e no cartão do lixo). Dá para ligar de novo em Configurações → Geral → Lembretes.

## AUREON Noir 1.5.2 — 2026-11-18

- Celular e tablet: Modo da casa ao lado do relógio.
- Fotos das pessoas saíram do topo (já aparecem junto da saudação).

## AUREON Noir 1.5.1 — 2026-11-18

- Baterias: botão no topo na cor da pior bateria (vermelho até 10%, amarelo até 25%, verde acima) com quantas trocar; ao tocar, lista de todas as baterias da casa, a mais vazia primeiro. Celulares e robô aspirador ficam de fora.

## AUREON Noir 1.5.0 — 2026-11-18

- Planta nova em vidro: cada cômodo com temperatura grande, luzes acesas na cor da lâmpada e brilho vindo de baixo; cômodo escolhido em dourado.
- Topo (relógio, tempo, casa) mais baixo.
- AUREON Music vem antes dos botões de cômodos e tipos.
- Energia aparece com qualquer sensor de potência (também os escondidos pelo HA e os em kW), uma linha por aparelho.
- Ícone de Seções nas Configurações; ícones do menu Modo da casa centralizados.

## AUREON Noir 1.4.9 — 2026-11-18

- Modo da casa e alarme juntos num só menu elegante ao lado de 3D / Planta (Em casa, Fora, Férias, Noite). Escolher um modo abre a confirmação de sempre; nada muda antes de tocar em "Ativar".
- A faixa de modos embaixo saiu (não repete mais).

## AUREON Noir 1.4.8 — 2026-11-18

- Alarme da casa: menu elegante ao lado de 3D / Planta, com o estado atual; só muda quando você escolhe um modo.
- Configurações: página inicial com todas as áreas; "Voltar" volta para ela e "Fechar" fecha.
- Aba escolhida nas Configurações na cor do tema; textos completos em alemão e inglês.

## AUREON Noir 1.4.7 — 2026-11-18

- Configurações: o aviso "Salvo" aparece no lugar da nota do rodapé, sem ficar por cima do texto.

## AUREON Noir 1.4.6 — 2026-11-18

- "Alexa avisa ao terminar" agora reconhece de verdade as automações feitas com o blueprint AUREON (o HA só informa o blueprint pela configuração salva da automação).

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
