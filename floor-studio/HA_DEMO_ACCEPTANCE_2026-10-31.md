# Aceite no Home Assistant descartável — 31/10/2026

Instância: Home Assistant Core 2026.2.3 criada dentro do ambiente do Claude, com a integração `demo` e dados sintéticos marcados como DEMO. **Não é o HA da proprietária, e nada foi instalado nele.** NeonPlan3D (candidato AUREON) instalado como custom component, com o painel `/neonplan3d`. O AUREON foi carregado como recurso Lovelace `custom:aureon-dashboard` no dashboard `/aureon-home`.

Script: `scripts/ha-acceptance-flow.mjs` (`HA_URL`, `HA_TOKENS`, `HA_LANG=de|pt`, `CHROME_BIN`). Os tokens ficam fora do repositório.

| Etapa | Alemão | Português |
| --- | --- | --- |
| No editor original do painel NeonPlan3D: desenhar 2 cômodos, inserir porta, renomear cômodo com nome próprio | ✓ | ✓ |
| Os dados ficam no armazenamento do NeonPlan3D (`neonplan3d/building/get`) | ✓ | ✓ |
| A Startseite AUREON mostra os mesmos IDs, nomes próprios e aberturas | ✓ | ✓ |
| Depois de recarregar a página, a planta continua igual | ✓ | ✓ |
| Nova edição no Studio (3º cômodo) aparece na Startseite | ✓ | ✓ |
| Startseite em 1440/820/390 sem rolagem horizontal | ✓ | ✓ |

Fonte única: o produto não contém planta padrão. Editor e Startseite usam o mesmo armazenamento do NeonPlan3D. Só o enquadramento da câmera é próprio de cada página.

Idioma: o frontend do HA definiu o idioma. Navegação, estados ("Chuvoso", "Fora"), datas e textos AUREON seguiram DE/PT. Nomes cadastrados pelo usuário ("Wohnzimmer", "Atelier Lumière", "Sala Demo (nome próprio)") aparecem sem tradução.

Limites: móveis e materiais não foram alterados por UI neste fluxo. Usam o mesmo armazenamento e o mesmo formato já validados por importação/exportação. Energia está vazia porque a descoberta automática ainda está pendente.
