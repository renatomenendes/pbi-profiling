# pbi-profiling

Ferramenta para profiling, discovery, auditoria e documentação de projetos Power BI em formato PBIP.

O objetivo é transformar artefatos técnicos de Power BI em documentação navegável e compreensível para pessoas técnicas e não técnicas, preservando rastreabilidade até as fontes, medidas, páginas e visuais.

## Princípios

- reutilizar projetos open source maduros antes de reimplementar capacidades existentes;
- preservar proveniência e licenças de todo código reutilizado;
- separar extração, análise e apresentação;
- manter a inspeção read-only sobre projetos PBIP;
- produzir artefatos estruturados para auditoria e uma saída HTML orientada a humanos;
- evoluir por branches e pull requests pequenos e verificáveis.

## Escopo inicial

- TMDL e modelo semântico;
- PBIR, páginas e visuais;
- Power Query / M e fontes;
- medidas DAX e dependências;
- where-used e lineage;
- cobertura, qualidade e exceções;
- profiling de valor, uso e relevância;
- geração de runbook HTML para onboarding e operação.

O primeiro caso real de validação será o Painel de Disponibilidade Tecnológica UMSP.
