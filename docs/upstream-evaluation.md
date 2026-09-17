# Upstream evaluation

Este documento registra os projetos avaliados como fontes de capacidades para o `pbi-profiling` e fixa as decisões de integração antes de reutilizar código.

## Objetivo do produto

O `pbi-profiling` deve transformar um projeto Power BI/PBIP em um perfil técnico e humano navegável, orientado a onboarding e operação. A saída principal é um runbook HTML autocontido; JSON/CSV/Markdown são artefatos secundários para auditoria e automação.

O produto deve responder, sem exigir domínio de TMDL, DAX ou PBIR:

- o que o painel faz;
- quais páginas e visuais existem;
- quais métricas sustentam o painel;
- de onde vêm os dados;
- como cada medida chega aos visuais;
- o que realmente é usado;
- onde há riscos ou lacunas;
- quais ativos possuem maior valor, uso e relevância;
- quais oportunidades analíticas existem além do painel atual.

## Critérios de avaliação

Cada upstream foi avaliado por:

- fidelidade de parsing PBIP/TMDL/PBIR;
- cobertura de DAX e Power Query/M;
- suporte a páginas, visuais, bookmarks e filtros;
- where-used, impacto e lineage até a fonte física;
- field parameters e calculation groups;
- qualidade da saída HTML para não especialistas;
- capacidade de exportar artefatos estruturados;
- testes e maturidade;
- execução offline/read-only;
- licença e adequação a uso corporativo;
- facilidade de integração sem duplicar engines.

## Matriz de capacidades

| Capacidade | Melhor referência | Decisão |
|---|---|---|
| Descoberta PBIP | `@pbi-lineage-lenz/core` | Usar como engine |
| Parsing TMDL | `@pbi-lineage-lenz/core` | Usar como engine |
| Parsing PBIR | `@pbi-lineage-lenz/core` | Usar como engine |
| Parsing DAX | `@pbi-lineage-lenz/core` | Usar como engine |
| Parsing Power Query/M | `@pbi-lineage-lenz/core` | Usar como engine |
| Fontes físicas e rename chain | `@pbi-lineage-lenz/core` | Usar como engine |
| Field parameters | `@pbi-lineage-lenz/core` | Usar como engine |
| Calculation groups | `@pbi-lineage-lenz/core` | Usar como engine |
| Bookmarks | `@pbi-lineage-lenz/core` | Usar como engine |
| Dependency graph | `@pbi-lineage-lenz/core` | Usar como engine |
| Visual -> measure -> column -> source | `@pbi-lineage-lenz/core` | Usar como engine |
| Impact analysis | `@pbi-lineage-lenz/core` | Usar como engine |
| Orphans | `@pbi-lineage-lenz/core` | Usar como engine |
| Diff de modelo | `@pbi-lineage-lenz/core` | Expor posteriormente |
| Viewer de lineage | `@pbi-lineage-lenz/viewer` | Reutilizar como componente |
| HTML offline de lineage | `@pbi-lineage-lenz/handoff` | Reutilizar capacidade/empacotamento |
| Wireframe SVG das páginas | `djrien-ai/pbi-doc-generator` | Adaptar seletivamente com atribuição |
| Data roles dos visuais | `djrien-ai/pbi-doc-generator` + engine PBIR | Adaptar seletivamente |
| Complexity index | `ViciusLio/pbi-semantic-doc` | Adaptar conceito/implementação MIT após testes |
| RAG-ready output | `ViciusLio/pbi-semantic-doc` | Adaptar contrato de saída |
| Busca/navegação humana | `pbip-documenter` / `pbi-doc-generator` | Adotar padrões de UX, não duplicar engine |
| PBIR breadth benchmark | `maxanatsko/pbir.tools` | Referência somente; código proibido para derivação |
| Valor x uso x relevância | inexistente de forma completa | Implementação própria |
| Runbook de onboarding | inexistente de forma completa | Implementação própria |
| Oportunidades analíticas | inexistente | Implementação própria |

## Upstreams aprovados para reutilização

### JonathanJihwanKim/pbi-lineage-lenz

- Commit avaliado: `7e2c61cac2f5e0ca6e7135df17a6918c89c42aec`.
- Licença: MIT.
- Pacotes relevantes: `@pbi-lineage-lenz/core`, `viewer`, `handoff`.
- O `core` é deliberadamente platform-independent: recebe `Map<path, content>` e devolve dados puros.
- Expõe parsing TMDL/PBIR/DAX/M, source-name resolution, graph, lineage, impact, orphans e diff.
- A própria documentação de proveniência informa que o core converge parsing/graph do `pbip-lineage-explorer`, M-query do `pbip-documenter` e source naming do `model-lenz`.

**Decisão:** dependência primária do `pbi-profiling`. Não copiar seus parsers para Python.

Origem: https://github.com/JonathanJihwanKim/pbi-lineage-lenz

### JonathanJihwanKim/pbip-documenter

- Commit avaliado: `ed986ed83f2d05ef09b9310da7eeed671e0d59ed`.
- Licença: MIT.
- Arquitetura: TMDL state machine, PBIR visual parser, M parser, lineage engine, HTML/Markdown/JSON, ERD e diagramas.
- O M-parser deste projeto já converge para `pbi-lineage-lenz/core`.

**Decisão:** usar como referência de UX/documentação e como proveniência indireta da engine. Evitar manter cópia paralela dos parsers.

Origem: https://github.com/JonathanJihwanKim/pbip-documenter

### djrien-ai/pbi-doc-generator

- Commit avaliado: `1141d7c535beb956bf945c5737923ce97f0c161d`.
- Licença: MIT.
- Linguagem: Python.
- Diferenciais úteis: wireframe SVG em escala das páginas, data roles por visual e experiência HTML orientada a navegação.

**Decisão:** reutilização seletiva apenas das capacidades complementares que a engine principal não oferece, preservando atribuição e adicionando testes próprios.

Origem: https://github.com/djrien-ai/pbi-doc-generator

### ViciusLio/pbi-semantic-doc

- Commit avaliado: `3e653828e4957ba7fb698ad92b1ff8bf4f791182`.
- Licença: MIT.
- Diferenciais úteis: complexity index, saída combinada modelo+relatório, HTML self-contained, JSON e JSONL RAG-ready com dependências DAX pre-resolvidas.

**Decisão:** adaptar contratos e algoritmos complementares; não adotar parser paralelo.

Origem: https://github.com/ViciusLio/pbi-semantic-doc

## Referência funcional sem reutilização de código

### maxanatsko/pbir.tools

A ferramenta cobre uma superfície PBIR ampla, incluindo fields, filters, visual calculations, bookmarks e automação. Entretanto, sua licença é custom non-commercial e proíbe explicitamente derivative works sem consentimento.

**Decisão:** usar apenas como benchmark funcional. Nenhum código, template ou implementação será copiado ou adaptado.

Origem: https://github.com/maxanatsko/pbir.tools

## Arquitetura resultante

O `pbi-profiling` terá uma única engine de interpretação PBIP e camadas próprias de profiling:

```text
PBIP
  -> discovery/read-only file maps
  -> @pbi-lineage-lenz/core
  -> normalized profiling model
       -> semantic profile
       -> report profile
       -> usage profile
       -> quality profile
       -> value/relevance profile
       -> onboarding/runbook profile
       -> analytical opportunities
  -> outputs
       -> profile.html (principal)
       -> profile.json
       -> rag.jsonl
       -> optional lineage exports
```

A separação é intencional:

- **engine** interpreta o PBIP;
- **profilers** calculam achados e relevância;
- **presentation** traduz o resultado para humanos;
- **exports** preservam dados estruturados para automação.

## Regras de proveniência

Toda reutilização de código MIT deve registrar:

- repositório de origem;
- commit de origem;
- arquivo/módulo original;
- licença;
- alterações realizadas;
- testes que comprovam compatibilidade.

Dependências externas devem ser preferidas quando o upstream já publica um módulo coeso e testável. Vendoring só será usado quando houver motivo técnico documentado.

## Diferencial próprio

O investimento próprio ficará concentrado onde os upstreams não resolvem o problema gerencial:

- profiling orientado a **valor, uso e relevância**;
- interpretação dos objetos em linguagem de onboarding;
- saúde e cobertura da documentação;
- centralidade e criticidade de medidas/tabelas/fontes;
- separação entre achado, evidência e hipótese;
- runbook humano do painel;
- artefatos para busca/RAG;
- identificação de oportunidades analíticas, incluindo anomaly detection;
- aplicação repetível sobre todos os painéis da gerência.

## Próxima decisão implementada

A primeira versão integrada será construída sobre Node.js/ES modules para consumir diretamente os pacotes `@pbi-lineage-lenz/*`, evitando um wrapper Python que apenas duplicaria I/O e contratos. A interface pública será CLI e os outputs permanecerão independentes da linguagem de implementação.
