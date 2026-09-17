# pbi-profiling

Ferramenta read-only para profiling, discovery, auditoria e documentação de projetos Power BI em formato PBIP.

O objetivo é transformar artefatos técnicos de Power BI em um runbook navegável para pessoas técnicas e não técnicas, preservando rastreabilidade até fontes, tabelas, colunas, medidas, páginas e visuais — no espírito de progressive disclosure de ferramentas de profiling como `pandas-profiling`, mas aplicado ao ecossistema PBIP.

## Princípios

- reutilizar projetos open source maduros antes de reimplementar capacidades existentes;
- preservar proveniência e licenças de todo código reutilizado;
- separar extração, análise, contexto de negócio e apresentação;
- manter a inspeção estritamente read-only sobre projetos PBIP;
- diferenciar fatos extraídos, heurísticas estruturais e contexto humano declarado;
- nunca inferir “valor de negócio” a partir de centralidade técnica;
- produzir artefatos estruturados para auditoria/automação e uma saída HTML orientada a humanos;
- manter indicadores explicáveis: componentes, pesos, evidências e caveats permanecem no contrato;
- funcionar em estações corporativas sem privilégio administrativo e sem instalação de pacotes npm para execução;
- evoluir por branches e pull requests verificáveis, com CI e testes de contrato.

## Engine

A leitura técnica do PBIP usa `pbi-lineage-lenz` como engine pinada por commit, via Git submodule. Ela fornece parsing e normalização de TMDL, PBIR, DAX, Power Query/M, fontes físicas, dependências e lineage.

O runtime importa diretamente o código-fonte auditado do submodule pinado. Não depende de `node_modules` nem de resolução de pacotes no registry npm.

O `pbi-profiling` adiciona a camada de produto: profiling, contexto, onboarding, saúde, relevância analítica, oportunidades, impacto de manutenção e runbook humano.

Veja `ATTRIBUTIONS.md` para provenance e licenças.

## Saídas

Uma execução produz três artefatos derivados do mesmo contrato:

- `profile.html` — runbook humano autocontido e offline;
- `profile.json` — contrato estruturado e auditável;
- `profile.rag.jsonl` — chunks autocontidos para busca, RAG e agentes.

O HTML inclui:

- visão geral executiva;
- contexto de negócio, quando fornecido;
- páginas e wireframe aproximado do layout;
- catálogo de medidas e DAX;
- tabelas, fontes, relacionamentos e Power Query/M;
- centralidade/importância estrutural;
- complexidade explícita por componentes;
- capacidades e oportunidades analíticas;
- lineage interativo offline sem bibliotecas externas de runtime;
- uso direto/transitivo;
- qualidade e cobertura;
- manutenção e impacto de mudança;
- detalhes técnicos sob demanda.

## Execução zero-install

Requisitos de runtime:

- Node.js 20 ou superior;
- Git com suporte a submodules;
- repositório clonado com o submodule pinado.

Não é necessário executar `npm install`, `npm ci`, `npm update` ou instalar qualquer pacote JavaScript na estação.

Clone uma vez:

```powershell
git clone --recurse-submodules https://github.com/renatomenendes/pbi-profiling.git
Set-Location .\pbi-profiling
git submodule update --init --recursive
```

Execute diretamente com Node:

```powershell
node .\src\cli.js profile `
    "C:\caminho\para\meu-projeto-pbip" `
    --output ".\output\meu-projeto"
```

Validações locais também não dependem de npm:

```powershell
node .\scripts\check.js
node .\scripts\test.js
node .\src\cli.js --help
```

## Contexto de negócio opcional

PBIP descreve muito bem estrutura técnica, mas não prova finalidade, owner, uso operacional, SLA ou definição de negócio. Para manter essa fronteira explícita, o `pbi-profiling` aceita um sidecar opcional chamado:

```text
pbi-profiling.context.json
```

Quando o arquivo está na raiz do projeto analisado, ele é detectado automaticamente. Também pode ser informado explicitamente:

```powershell
node .\src\cli.js profile `
    ".\MeuProjeto" `
    --output ".\output" `
    --context ".\documentacao\context.json"
```

Exemplo mínimo:

```json
{
  "schemaVersion": 1,
  "dashboard": {
    "purpose": "Monitorar disponibilidade operacional.",
    "audience": ["Operação", "Gestão"],
    "operationalUse": ["Acompanhamento diário"],
    "businessQuestions": [
      "Onde a disponibilidade está degradando?"
    ],
    "refresh": {
      "cadence": "Horária",
      "sla": "90 minutos",
      "timezone": "America/Sao_Paulo"
    }
  },
  "tables": {
    "MinhaTabela": {
      "grain": "Site x timestamp",
      "businessMeaning": "Histórico de estado por site"
    }
  },
  "measures": {
    "Medidas[Disponibilidade]": {
      "businessDefinition": "Percentual de disponibilidade no contexto filtrado"
    }
  }
}
```

A ausência do sidecar é válida. Nesse caso, o runbook declara explicitamente que o contexto não foi fornecido, em vez de fabricá-lo.

## Inteligência de profiling

### Importância estrutural

Mede centralidade técnica, não valor de negócio. Para medidas considera abrangência em visuais/páginas e fanout de dependências diretas/transitivas. Para tabelas considera exposição em visuais/páginas, breadth de objetos, grau de relacionamentos e medidas dependentes.

Todos os pesos e componentes aparecem em `profile.json` e no HTML.

### Complexidade

A complexidade de DAX observa, entre outros sinais:

- tamanho da expressão;
- variedade de padrões DAX;
- breadth de dependências;
- profundidade de parênteses;
- variáveis, linhas e densidade estrutural.

O modelo e o relatório também recebem indicadores normalizados. Os scores são indicadores de complexidade estrutural, não notas de qualidade.

### Relevância analítica

A ferramenta detecta sinais estruturais como:

- colunas temporais;
- estados/status;
- duração/persistência;
- entidades/grupos;
- timestamps de freshness;
- variáveis numéricas;
- medidas de time intelligence;
- visuais de série temporal.

A partir desses sinais gera candidatos transparentes para:

- anomalia pontual;
- anomalia contextual;
- anomalia coletiva;
- transições de estado;
- persistência/duração;
- freshness;
- comparação entre pares;
- baseline sazonal.

Uma oportunidade significa somente que a estrutura é compatível. Validação de grain, histórico, cadência, qualidade de dados e utilidade operacional deve ocorrer sobre os dados reais antes de qualquer modelo.

## RAG

`profile.rag.jsonl` contém chunks autocontidos por entidade lógica, incluindo overview, página, tabela, medida, fonte, relacionamento, findings, oportunidades, contexto e hotspots de manutenção.

Dependências, uso, complexidade e centralidade chegam pré-resolvidos; um consumidor downstream não precisa reparsear DAX para responder perguntas básicas sobre o modelo.

## Privacidade e segurança

- a análise é local e read-only;
- o HTML não depende de CDN ou rede para abrir;
- a execução não acessa o registry npm;
- caminhos absolutos da estação não são persistidos no `profile.json` por padrão;
- nenhum PBIP ou dado corporativo é necessário no repositório do `pbi-profiling`;
- texto originado do PBIP é escapado antes de ser incorporado ao HTML;
- contexto de negócio é carregado localmente e tratado como entrada explícita, nunca inferida.

## Desenvolvimento

Os mesmos gates usados pelo runtime podem ser executados sem package manager:

```powershell
node .\scripts\check.js
node .\scripts\test.js
```

O CI valida Node.js 20, 22 e 24, o commit pinado do upstream, ausência de `node_modules`, ausência de dependências npm no pacote, sintaxe, suíte de testes e smoke test do CLI.

Os gates públicos usam somente fixtures sintéticas/open source; artefatos corporativos não são versionados neste repositório.
