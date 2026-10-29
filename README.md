# AUREON Dashboard v0.1

Primeira versão de demonstração compatível com o frontend Home Assistant, distribuída pelo HACS como **Dashboard** (plugin frontend). Não altera nem controla dispositivos.

## Estrutura
- `dist/aureon-dashboard.js`: custom card independente, sem dependências externas.
- `hacs.json`: metadados HACS.

## Instalação pelo GitHub
Faça upload dos arquivos mantendo os caminhos. Para instalações HACS de repositórios privados, verifique se o HACS consegue acessar o repositório; se não, não torne público automaticamente. Depois de adicionar o repositório personalizado como Dashboard e instalar, verifique em **Configurações > Dashboards > Recursos** se `/hacsfiles/aureon-dashboard/aureon-dashboard.js` está cadastrado como módulo JavaScript (o HACS geralmente faz isso automaticamente).

Crie uma view temporária no dashboard Home Assistant e adicione um card manual com YAML:

```yaml
type: custom:aureon-dashboard
```

**Importante:** ainda é um card dentro de uma view, não um dashboard de tela cheia. O projeto evoluirá para uma experiência de painel completo. Não conectar HA real ao JARVIS, SpotifyPlus ou NeonPlan nesta versão.

## Regras
- Master/HACS, sem releases ou tags obrigatórios.
- Código original de NeonPlan, JARVIS e Music Card permanece intacto.
- Nenhum segredo no GitHub.
