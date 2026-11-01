# AUREON 0.29.0-test.1 — teste na instalação da proprietária

Autorizado pela proprietária em 31/10/2026 para testar no próprio Home Assistant. **Não é aprovação visual nem versão final.** Sem tags ou releases.

## O que é publicado
- `thaianyboas/aureon-dashboard` → `dist/aureon-dashboard.js` + `dist/aureon-assets/` (HACS, categoria Dashboard).
- `thaianyboas/aureon-integration` → `custom_components/neonplan3d` gerado deste repositório (HACS, categoria Integração). Mesmo domínio `neonplan3d` da integração oficial: **substitui** a oficial e usa o mesmo armazenamento (`.storage/neonplan3d.*`). Não instalar as duas juntas.
- Nenhuma planta, foto, modelo 3D pessoal, credencial ou licença é publicada. Plantas e modelos próprios são importados só na instalação da proprietária.

## Novidades em relação à v0.28.0
Startseite com a planta nativa do Floor Studio (fonte única), cinco looks (Neon, Blueprint, Day, Night, Real), enquadramento de apresentação, cartão do cômodo com Licht/Temperatur/Jalousien, painel do cômodo, Medien v2, navegação do celular com "Mais", tema Forest Luxe · Botanical, imagens de cômodo com upload privado; no Floor Studio, extensões revisadas: modelos .glb próprios por móvel (`aureon_model`) e acabamentos de piso/parede por cômodo (`aureon_finish`).

## Pendências conhecidas
Aprovação visual (Startseite, Medien, demais páginas), correções do relatório de segurança, descoberta automática de Energia, cobertura de idiomas, seleção de modelos/acabamentos pela interface do editor (hoje entram pelo arquivo importado), teste em aparelho real com GPU.

## Voltar à versão anterior
1. Restaurar o backup completo do Home Assistant feito antes da atualização **ou**:
2. Dashboard: copiar `rollback/v0.28.0/aureon-dashboard.js` para `/config/www/community/aureon-dashboard/aureon-dashboard.js` (substituindo o arquivo e o `.gz` ao lado, se existir) e recarregar o navegador.
3. Integração: no HACS remover o repositório `aureon-integration`, baixar novamente a integração NeonPlan3D oficial e reiniciar o Home Assistant. O armazenamento da planta continua o mesmo.
