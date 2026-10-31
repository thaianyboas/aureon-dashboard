# Auditoria funcional NeonPlan3D × AUREON — 31/10/2026

Referência: ZIP `neonplan3d-main` 2.0.7, SHA-256 `917dfc2b78eb37d3de760316078be24c17a0f262ae14986a778061328c2aa744`.
Ambiente de teste: Chromium headless + SwiftShader, bundles compilados reais (originais do ZIP e candidato AUREON), dados sintéticos. **Nenhum Home Assistant foi instalado ou contatado.**

Legenda: **validado** = fluxo executado de ponta a ponta com resultado conferido; **parcial** = código preservado e parte do fluxo executada; **ausente** = não está no AUREON; **bloqueado** = depende de algo que não existe neste ambiente (licença, hardware, HA real).

| Função original | Localização no original | Implementação no AUREON | Teste executado | Resultado | Pendência |
| --- | --- | --- | --- | --- | --- |
| Editor completo (menus, barra, painel) | `components/editor.ts` (`render*`) | Mesmo componente compilado; 7 membros alterados só para remover comércio | `test-neonplan-fidelity-browser.mjs` casos 01, 02, 09: original e AUREON lado a lado | **validado**: listas de controles idênticas nos 3 casos (28/36/39 botões) | — |
| Criar andar | `addFloor`, menu do andar | Original | `test-editor-browser.mjs` "native floor menu creates a floor" | **validado** | — |
| Desenhar cômodo (ponteiro) | `addRoom`, handlers de ponteiro | Original | editor-browser + fidelidade caso 03 (3º cômodo criado nos dois) | **validado** | — |
| Desfazer / refazer | histórico do editor, botões ↶ ↷ | Original | editor-browser: geometria exata restaurada | **validado** | Atalhos Ctrl+Z/Ctrl+Y não exercitados por teclado |
| Salvar → fechar → reabrir | `building-changed` + store backend | Original + bloqueio de revisão AUREON | editor-browser "serialized parent plan reloads into a fresh native editor"; planta privada: importar, salvar, fechar, reabrir no editor **original** sem diferença | **validado** (frontend) | Persistência no backend real do HA não testada |
| Importar planta (JSON nativo) | `importPlan` → `parseExport` (`transfer.ts`) | Original | Arquivo nativo de 6 cômodos/9 aberturas importado pelo botão "Importar planta" do editor original, geometria idêntica | **validado** | — |
| Exportar / modelo compartilhável | `exportPlan`, `withoutEntities` | Original + limpeza de privacidade ampliada | editor-browser round-trip; 3 testes de privacidade | **validado** | — |
| Paredes, espessura por aresta | `geometry/walls.ts` (protegido por hash) | Idêntico ao ZIP | Gate de fidelidade (23 arquivos críticos) + planta privada com espessuras 0,10–0,47 m renderizada em 2D/3D | **validado** | — |
| Portas e janelas | `Opening`, formulários, geometrias | Original | fidelidade caso 04; planta privada com 6 portas e 3 janelas em 2D e 3D | **validado** | Estilos de porta especiais não conferidos um a um |
| Catálogo gratuito de móveis | `FURNITURE_TYPES`, biblioteca | Original | fidelidade caso 05 (14 controles iguais) | **parcial** | Inserir/arrastar cada categoria não exercitado |
| Posição/rotação de objetos | formulários e transformações | Original | fidelidade caso 06 | **parcial** | Arraste e rotação por ponteiro não automatizados |
| Materiais de piso/acabamentos | formulários de cômodo | Original | fidelidade caso 07 | **parcial** | Comparação visual de cada material |
| Vista 3D ao lado / renderer | `fp3d-view3d`, `viewer3d.ts` | Original + 4 métodos com extensão revisada (enquadramento opcional, padrão = original) | fidelidade caso 08; renderer 9 checagens; captura 3D da planta privada no card original | **validado** | — |
| Looks Neon/Blueprint/Day | `themes.ts`, `viewer/theme.ts` | Original | renderer: troca de looks sem recriar card/andar | **validado** | — |
| Night (4º modo AUREON) | extensão AUREON | `viewer/theme.ts` | renderer + capturas `look-night` | **validado** | Aprovação visual sua |
| Real/PBR (5º modo AUREON) | extensão AUREON | `viewer/real-pbr.ts`: sombra ajustada ao tamanho da casa (2048 px), dia/noite pelo `sun.sun`, lâmpadas acesas viram luzes quentes, brilhos aditivos sem manchas | testes Real (grain/shader/regressão) + captura `look-real` com lâmpada demo à noite | **parcial** | Materiais de modelos importados (GLB) e aprovação visual |
| Configurações | `renderSettingsMenu` | Original | fidelidade caso 09 | **parcial** | Persistência de cada opção individual |
| Usuário não administrador | permissões do editor | Original | editor-browser: sem criar andar, móveis desabilitados | **validado** | — |
| Vínculo a entidades/áreas | formulários + `bindings.py` | Original + gravação com revisão | testes de backend e de vínculo (fixture) | **parcial** | Teste com HA real |
| Modelos próprios GLB/OBJ | `src/import` | Original | Só presença do código | **parcial** | Importar um modelo real de teste |
| Pacotes e extensões oficiais licenciados | `packs.py`, `license.py` | Original (verificação de assinatura preservada) | testes originais de assinatura/licença | **bloqueado** | Precisa de licença/pacote seu para validar; nada foi desbloqueado |
| Loja, preços, ofertas, compra | `extensions.ts`, `features.ts` | Removido da interface (pedido) | guard de superfície pública | **ausente (intencional)** | — |
| Recursos avançados (telhado, terreno, solar, piscina, localização, voz, câmeras, presença, viagem no tempo) | vários módulos | Código original preservado | testes unitários originais (515) | **parcial** | Execução depende de dispositivos/entidades reais |
| Tutoriais, documentação e imagens do site | `frontend/tutorials`, `docs`, `site` | Não copiados para o pacote | inventário `fidelity/FILES.json` | **ausente** | Decidir se devem acompanhar o AUREON |

Observação: durante a comparação, um recurso respondeu 403 no servidor local de teste (fora da árvore servida). Os dez cenários concluíram com controles idênticos; a origem desse recurso ainda não foi identificada.

## Extensões de apresentação revisadas (método original alterado)

| Método | Mudança | Padrão |
| --- | --- | --- |
| `card.ts::Floorplan3dCard.render` | repassa `aureon_frame` ao 3D | 1 = enquadramento original |
| `view3d.ts::Fp3dView3d.start` / `updated` | encaminham `frameScale` ao viewer | sem efeito em 1 |
| `viewer3d.ts::FloorplanViewer.fit` | raio × `frameScale`; vista inicial salva continua prevalecendo | 1 = original |

Além disso, somente CSS: `--aureon-stage-background` e `--aureon-card-background` (vazios = fundo original). O gate de fidelidade passa a conferir esses 4 métodos pelo hash revisado. Qualquer nova mudança neles volta a falhar até ser revisada.
