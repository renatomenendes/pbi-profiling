# Upstream evaluation

Este documento registra os projetos open source avaliados como fontes de capacidades para o `pbi-profiling`.

Nenhum código upstream é importado nesta etapa. O objetivo deste PR é fixar proveniência, licença e responsabilidade técnica antes de reutilizar qualquer implementação.

## Critérios

Cada upstream será avaliado por:

- fidelidade de parsing PBIP/TMDL/PBIR;
- cobertura de DAX, Power Query/M, páginas e visuais;
- where-used e lineage;
- qualidade da saída HTML e experiência para não especialistas;
- capacidade de exportar artefatos estruturados;
- testes e maturidade;
- execução offline/read-only;
- facilidade de integração sem acoplamento desnecessário.

## Shortlist verificada

### JonathanJihwanKim/pbip-documenter

- Linguagem principal: JavaScript.
- Licença: MIT.
- Foco: documentação profunda de PBIP/TMDL/PBIR diretamente no navegador.
- Valor para o projeto: referência forte para documentação humana, catálogo de objetos, ERD e navegação do modelo.
- Decisão atual: estudar parser, modelo interno e experiência de documentação antes de importar qualquer componente.

Origem: https://github.com/JonathanJihwanKim/pbip-documenter

### JonathanJihwanKim/pbi-lineage-lenz

- Linguagem principal: JavaScript.
- Licença: MIT.
- Foco: lineage até a fonte física, compreensão de modelos existentes e handoff HTML autocontido.
- Arquitetura relevante: separação entre core, viewer, handoff, export e CLI.
- Valor para o projeto: referência prioritária para lineage, handoff e separação entre parsing e apresentação.
- Decisão atual: estudar `packages/core`, `packages/viewer` e `packages/handoff` antes de definir nossa arquitetura final.

Origem: https://github.com/JonathanJihwanKim/pbi-lineage-lenz

### djrien-ai/pbi-doc-generator

- Linguagem principal: Python.
- Licença: MIT.
- Foco: documentação standalone de PBIX/PBIP, TMDL, DAX, relacionamentos, Power Query e páginas/visuais.
- Capacidades de interesse: `tmdl_parser.py`, `pbip_adapter.py`, lineage de medidas, template HTML, Mermaid e wireframe SVG de páginas.
- Valor para o projeto: maior proximidade com nosso runtime Python e boa referência para saída visual orientada a humanos.
- Decisão atual: candidato prioritário para reaproveitamento seletivo após inspeção de testes e contratos do parser.

Origem: https://github.com/djrien-ai/pbi-doc-generator

### ViciusLio/pbi-semantic-doc

- Linguagem principal: Python.
- Licença: MIT.
- Foco: documentação de SemanticModel e Report, saída Markdown/HTML/JSON/RAG e execução sem dependências externas no núcleo.
- Valor para o projeto: referência para CLI, export estruturado, complexidade e documentação combinada modelo + relatório.
- Decisão atual: avaliar especialmente o modelo de dados intermediário e os exporters antes de reutilizar código.

Origem: https://github.com/ViciusLio/pbi-semantic-doc

## Diretriz de integração

O `pbi-profiling` não será uma cópia integral de nenhum upstream. Cada capacidade será classificada em uma das formas abaixo:

1. dependência externa;
2. adaptação de componente MIT com atribuição preservada;
3. implementação própria apenas quando houver lacuna real no ecossistema.

Toda adaptação deverá registrar:

- repositório e commit de origem;
- arquivo ou módulo aproveitado;
- licença;
- alterações locais;
- testes que comprovam compatibilidade com nossos PBIPs.

## Diferencial do pbi-profiling

O foco próprio será a camada que os upstreams não resolvem integralmente:

- profiling orientado a valor, uso e relevância;
- runbook para onboarding de pessoas não especialistas;
- interpretação operacional do painel;
- cobertura e riscos apresentados de forma compreensível;
- identificação de oportunidades analíticas, incluindo anomaly detection;
- documentação reutilizável para o conjunto de painéis da gerência.

## Próxima etapa

Inspecionar os módulos centrais dos quatro upstreams e construir uma matriz de capacidades por implementação. Somente depois disso será aberto um PR de integração de código.
