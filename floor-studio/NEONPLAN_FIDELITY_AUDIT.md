# Auditoria de fidelidade ao NeonPlan3D fornecido

## Referência verificável e conclusão delimitada

Referência: ZIP `neonplan3d-main(2).zip`, SHA-256 `917dfc2b78eb37d3de760316078be24c17a0f262ae14986a778061328c2aa744`, versão **2.0.7**, 615 entradas com CRC conferido, 576 arquivos. Não é uma afirmação sobre outra versão disponível na internet.

**O candidato contém o código do editor original completo, e não apenas um editor simplificado.** A análise AST inclui métodos, funções nomeadas e handlers em propriedades: 440 membros do editor permanecem equivalentes sem comentários; sete membros foram modificados para remover conteúdo comercial e um (`renderNews`) foi removido por exibir avisos da loja. Os 448 membros originais estão individualmente inventariados. Isso comprova a presença/preservação do código, mas não prova todos os comportamentos em execução.

A comparação de todos os arquivos está em `fidelity/FILES.json`; a de 2.222 símbolos frontend, incluindo linhas originais/candidatas e hashes canônicos, em `fidelity/SYMBOLS.json`. O guard de regressão confere 2.156 métodos/handlers preservados e 23 arquivos críticos de geometria, modelo, importação e licenciamento. A matriz abaixo não transforma igualdade de código em uma alegação de testes de produção completos.

## Inventário de arquivos e escopo

O inventário cobre todas as entradas do arquivo fornecido: componentes, menus/ferramentas, catálogo, geometrias, shaders/renderer, módulos, configuração, atalhos, importação/exportação, backend, documentação, tutoriais, ferramentas auxiliares e recursos de desenvolvimento. O candidato tem 384 arquivos idênticos, 28 modificados e 164 ausentes da árvore original, além de 14 novos arquivos nesta comparação. Os arquivos ausentes **não são 164 ferramentas do editor**: são 78 arquivos de documentação/imagens, 57 de tutoriais, dez ferramentas auxiliares (incluindo ferramentas de loja), dez arquivos de infraestrutura original, seis do site e três arquivos de preview. Permanecem explicitamente classificados como ausentes do pacote/árvore; não são apresentados como preservados. Nenhum arquivo de `frontend/src` está ausente. As funções comerciais removidas estão identificadas dentro dos arquivos modificados. Inventários registram o estado auditado; alterações posteriores exigem nova conferência.

## Matriz de funcionalidades

| Funcionalidade original | Estado no AUREON | Evidência | Correção realizada | Teste / limite |
| --- | --- | --- | --- | --- |
| Editor nativo completo | Preservada integralmente em código; execução parcial verificada | `components/editor.ts`; 440 membros equivalentes; sete mudanças comerciais e um aviso comercial removido | Nenhuma substituição de editor; wrapper continua usando o componente/painel original | Comparação inicial e dez cenários reais; não comprova todos os casos |
| Menus e barras de ferramentas | Preservada integralmente nos cenários exercitados | `renderFloorMenu`, `renderToolBar`, `renderSettingsMenu`; AST preservado | Nenhuma simplificação necessária | `02-menus-tools`, `09-settings`; listas de controles coincidem |
| Criação e desenho de ambientes | Preservada integralmente no cenário exercitado | `addRoom`, eventos de ponteiro e geometria preservados | Nenhuma | `03-draw-2d`: terceiro cômodo criado nos dois editores |
| Paredes, espessuras e dimensões | Preservada em código; cobertura de execução parcial | Geometrias e formulários originais; guard de arquivos | Nenhuma | Painéis comparados; casos geométricos complexos continuam na suíte nativa e exigem cobertura adicional |
| Portas e janelas | Preservada em código e painel exercitado | `openingEntities`, `openingState`, formulários e geometrias originais | Associação nativa estreita adicionada sem aceitar geometria | `04-openings`; teste do renderer com abertura/persiana/indisponibilidade |
| Múltiplos ambientes | Preservada no cenário exercitado | Modelo, desenho e catálogo originais | Nenhuma | Mesma planta com dois ambientes; desenho do terceiro |
| Múltiplos andares | Preservada em código; execução comparativa ampliada pendente | `addFloor`, `selectFloor`, elevações e ferramentas originais | Nenhuma | Teste anterior de criação de andar; não há alegação de cobertura completa de plantas complexas |
| Seleção e movimentação | Preservada em código; seleção exercitada | Handlers originais e transformação geométrica | Nenhuma | `06-object-position`; arraste completo de todos os tipos não é provado pela captura |
| Rotação e dimensionamento | Preservada em código; execução comparativa ampliada pendente | Formulários e helpers originais | Nenhuma | Campos de objeto comparados; regressões geométricas existentes |
| Catálogo gratuito | Preservada em código e navegação exercitada | `FURNITURE_TYPES`, grupos, geometria e biblioteca originais | Nenhuma substituição por modelos decorativos | `05-free-furniture-library`; categorias/controles coincidem |
| Materiais e acabamentos nativos | Preservada em código e painel exercitado | Materiais de piso, acabamentos e formulários originais | Nenhuma alteração de geometria/material nativo para os looks originais | `07-room-materials`; não é aprovação visual final |
| Câmera e navegação 3D | Preservada em código; abertura da cena exercitada | Renderer e wrapper originais | Real/PBR é um caminho adicional | `08-native-3d`; exploração completa de câmera/visita ainda não certificada |
| Alternância 2D/3D | Preservada no cenário exercitado | Controle original `3D beside` e componente `fp3d-view3d` | Nenhuma | Canvas WebGL real nos dois ambientes isolados |
| Atalhos e undo/redo | Preservada em código; undo/redo exercitado separadamente | `onKey`, handlers e histórico originais preservados | Nenhuma | Suíte nativa e teste anterior de desfazer/refazer; todos os atalhos não exercitados no browser |
| Configurações | Preservada no menu exercitado | Mesmas opções visíveis; métodos originais | Módulos AUREON acrescentados por aprovação explícita | `09-settings`; persistência de cada configuração ainda requer cobertura |
| Salvamento e restauração | Preservada com adaptação de segurança | Mesmo store e formato; lock/CAS e rollback em memória adicionais | Rejeição de vínculo com revisão antiga; recuperação de falha de escrita | Fixtures backend: salvar, reler, conflito, leitor e falha de disco; sem HA real |
| Backup completo | Preservada em código e round-trip exercitado | API original e exportação privada original | Nenhuma remoção de vínculos da cópia privada | `10-import-export`, testes de backup/assinatura existentes |
| Modelo compartilhável | Preservada com adaptação de privacidade | `transfer.ts`; limpeza ampliada de vínculos/imagens/ações | Remove dados de integração da cópia compartilhável sem alterar fonte ou geometria | Três regressões de privacidade; nomes e forma da planta continuam no template |
| Importação de planta | Preservada em código e JSON exercitado | `parseExport`, diálogos e backend originais | Nenhuma simplificação | Round-trip e arquivo inválido; casos complexos adicionais pendentes |
| Modelos próprios GLB/OBJ e conversor | Não verificável integralmente nesta auditoria de execução | Fonte original do conversor em `src/import`; fluxo original separado do editor | Nenhum conversor aproximado introduzido | Existência/preservação de código; não se afirma aceitação de todo modelo externo |
| Recursos avançados (telhado, terreno, solar, piscina, localização, voz, câmeras, presença, time travel) | Preservados em código conforme gates originais; execução integral não verificável | Inventário de símbolos/arquivos, geometrias e verificações originais | Sem liberação de recursos pagos | Ausência de pacotes/dispositivos reais limita ensaios; não marcar 100% |
| Assinatura de pacotes e vínculo à instalação | Preservada integralmente em código | `packs.py` idêntico; importação continua verificando assinatura/instância | Nenhum bypass | Testes originais e AUREON de assinatura alterada/instância errada |
| Ativação/atualização oficial de licença | Modificada sem necessidade, agora restaurada no backend/API | `license.py` e `api.ts` restaurados byte a byte ao ZIP; rotas oficiais admin | Restaura compatibilidade técnica privada, sem abrir loja pública; utilitário original de pacotes e três exemplos ESP32 também restaurados | Testes originais de licença restaurados, rede simulada; leitor negado; sem chave real |
| Loja, preços, ofertas, newsletter, compra/Upgrade | Modificada intencionalmente | Componentes públicos deixam de chamar APIs comerciais; avisos/teasers removidos | Remoção mantida | Guard de superfície pública; nenhuma consulta comercial automática no startup |
| Extensões pagas privadas | Não verificável em execução; compatibilidade/proteção preservadas em código | Verificações e APIs oficiais; loader original exige aprovação | Nenhum pacote pago distribuído ou desbloqueado | Testes sintéticos; nenhuma afirmação sobre extensões privadas reais |
| Três looks originais Neon/Blueprint/Day | Preservados em código com composição de shader ampliada | Ramos originais e geometrias; comparação Neon no editor | Sem substituição do renderer original | Comparação 3D Neon e suíte de shader; aceitação visual continua pendente |
| Night/Real AUREON | Extensão/adaptação adicional | `themes.ts`, `viewer/theme.ts`, `real-pbr.ts` | Tipagem e editor do cartão passam a oferecer também Night/Real | Testes dos cinco looks e limpeza; material authoring/importados pendentes |
| Quatro módulos AUREON | Extensão adicional; conclusão funcional pendente | Fontes próprias e aprovação individual | Não substituem extensões oficiais | Testes existentes; persistência/configuração completa ainda pendente |
| Documentação/imagens/tutoriais auxiliares omitidos | Ausente da árvore candidata em parte | 164 caminhos individuais em `FILES.json` | Não copiados automaticamente nem confundidos com runtime | Inventário explícito; não afirmar preservação de todos os arquivos do ZIP |
| Firmware ESP32 e utilitário de assinatura próprios | Fonte original restaurada; execução não verificável | Três YAMLs `firmware/key-helper` e `tools/fp3dpack.py` idênticos ao ZIP | Restaurados como ferramentas auxiliares sem gerar chaves nem instalar firmware | Sem hardware; proteção e chaves confiáveis do runtime não alteradas |

## Comparação visual executada

Foram abertos os bundles reais fornecidos no ZIP e os bundles reconstruídos do candidato em dois realms de browser, com o mesmo objeto de planta sintética, idioma inglês, permissões administrativas simuladas e preferências reinicializadas. Nenhum HA foi instalado. `test-neonplan-fidelity-browser.mjs` produz dez capturas lado a lado: editor inicial, menus/ferramentas, desenho 2D, aberturas, catálogo, objeto, materiais, painel 3D real, configurações e importação/exportação. Os dez cenários apresentaram as mesmas listas de controles visíveis. Isso é uma comparação dirigida, não uma prova de equivalência de pixels ou de toda a aplicação.

Durante a preparação, o teste precisou corrigir interferência do armazenamento de preferências entre os dois frames e o formato da resposta simulada de histórico; esses eram problemas da fixture, não regressões demonstradas do produto. As imagens de catálogo são geradas assincronamente pelo renderer nativo; o teste dá tempo equivalente aos dois.

A comparação de editor **não** aprova o design da Startseite. A reconstrução solicitada com planta grande central, painel direito e pessoas na base foi pausada para esta auditoria. O trabalho em andamento está preservado localmente, não foi apresentado como design final nem publicado como funcionalidade acabada.

## Reprodução e limites

Instalar as dependências fixadas na raiz (`npm ci`) e no frontend. `npm run test:fidelity` verifica invariantes aprovadas sem precisar redistribuir o ZIP. A análise completa pode ser refeita com `audit-neonplan-files.py` e `audit-neonplan-methods.mjs`, fornecendo o ZIP/extracão verificados. O parser AST usa TypeScript 6.0.2 isoladamente das ferramentas TypeScript 7 do frontend, que não disponibilizam a mesma API de análise.

Para as imagens comparativas, definir `NEONPLAN_ORIGINAL` para a raiz extraída e `CHROME_BIN` para o Chromium, executar `node scripts/test-neonplan-fidelity-browser.mjs`. Arquivos ficam em `build/fidelity-audit`. O ZIP original e seus arquivos privados não são publicados. Capturas não contêm dados de residência real.

**Não há declaração de fidelidade de 100%, desenvolvimento completo ou validação em produção.** Permanecem testes comparativos adicionais de transformação, plantas complexas, importações de modelos, recursos avançados e extensões legalmente licenciadas, além das prioridades gerais AUREON. Stable v0.28.0 permanece preservada e nenhuma instalação intermediária foi solicitada ou realizada.
