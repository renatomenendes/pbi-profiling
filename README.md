# pbi-profiling

Ferramenta read-only para profiling, discovery, auditoria e documentação de projetos Power BI a partir de PBIP e, no Windows, PBIX.

O objetivo é transformar artefatos técnicos de Power BI em um runbook navegável para pessoas técnicas e não técnicas, preservando rastreabilidade até fontes, tabelas, colunas, medidas, páginas e visuais — no espírito de progressive disclosure de ferramentas de profiling como `pandas-profiling`, mas aplicado ao ecossistema PBIP.

## Princípios

- reutilizar projetos open source maduros antes de reimplementar capacidades existentes;
- preservar proveniência e licenças de todo código reutilizado;
- separar extração, análise, contexto de negócio, configuração heurística e apresentação;
- manter a inspeção estritamente read-only sobre projetos PBIP;
- diferenciar fatos extraídos, heurísticas estruturais e contexto humano declarado;
- nunca inferir “valor de negócio” a partir de centralidade técnica;
- não embutir vocabulário de um cliente, dashboard ou domínio no núcleo analítico;
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

## Entrada universal

A partir da versão 0.4, o mesmo pipeline aceita diferentes pontos de entrada:

- pasta de projeto PBIP;
- arquivo `.pbip`;
- pasta `.SemanticModel` ou `.Report`;
- arquivo `.pbix` no Windows.

PBIP é analisado diretamente. PBIX usa um workspace temporário local:

```text
PBIX
  │
  ├─ relatório PBIR embutido → extração local
  └─ DataModel → Power BI Desktop já instalado
                    │
                    └─ Analysis Services local → TOM/TmdlSerializer
  │
  ▼
PBIP/TMDL/PBIR temporário
  │
  ▼
pbi-profiling
```

O arquivo PBIX original nunca é modificado. O workspace temporário é removido após a geração do HTML/JSON/RAG, salvo quando `--keep-workspace` é solicitado.

A conversão do modelo não tenta reimplementar o backup `DataModel`: usa o serializador TMDL oficial exposto pelo TOM do Power BI Desktop. Isso preserva a fidelidade do modelo e evita dependências Python/.NET adicionais no projeto.

### Limites atuais do intake PBIX

O intake direto é deliberadamente conservador:

- requer Windows e Power BI Desktop já instalado;
- requer PBIX atual com `Report/definition/` PBIR embutido;
- PBIX legado com apenas `Report/Layout` falha explicitamente em vez de fabricar uma tradução parcial;
- thin reports/live connection sem modelo local falham explicitamente até que a resolução segura do semantic model remoto seja implementada;
- o Power BI Desktop aberto para materializar o modelo fica aberto ao final; o profiler não fecha uma sessão do usuário sem identidade inequívoca.

Exemplo:

```powershell
node .\src\cli.js profile `
    "C:\caminho\Painel.pbix" `
    --output ".\output\Painel"
```

Para preservar o PBIP temporário para auditoria:

```powershell
node .\src\cli.js profile `
    "C:\caminho\Painel.pbix" `
    --output ".\output\Painel" `
    --keep-workspace
```

## Aplicação local

Uma UI local zero-install está disponível sobre o mesmo pipeline do CLI:

```powershell
node .\src\app.js
```

O processo abre uma página em `127.0.0.1` com:

- seletor de arquivo PBIX;
- entrada de caminho para PBIP/SemanticModel/Report;
- progresso do job;
- abertura do runbook;
- download local de `profile.json` e `profile.rag.jsonl`;
- opção de preservar o PBIP temporário.

A UI não usa CDN, telemetria ou serviços externos. Upload de PBIX significa apenas transferência do navegador para o servidor local em loopback; o arquivo fica em diretório temporário e é removido quando a aplicação encerra.

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
    "purpose": "Acompanhar indicadores de desempenho do processo.",
    "audience": ["Operação", "Gestão"],
    "businessQuestions": [
      "Onde os principais indicadores estão se desviando do comportamento esperado?"
    ],
    "refresh": {
      "cadence": "Diária"
    }
  },
  "tables": {
    "FactEvents": {
      "grain": "Entidade x instante de observação",
      "businessMeaning": "Histórico de observações do processo"
    }
  }
}
```

A ausência do sidecar é válida. Nesse caso, o runbook declara explicitamente que o contexto não foi fornecido, em vez de fabricá-lo.

## Configuração semântica opcional

A relevância analítica funciona sem configuração específica de domínio. Por padrão, o profiler usa:

- tipos de dados;
- relações do modelo;
- papéis dos campos nos visuais;
- padrões DAX;
- tipos de visual;
- um vocabulário bilíngue pequeno e genérico para conceitos como data, estado, duração, identificador e freshness.

O núcleo não contém substantivos de negócio como equipamento, cliente, fornecedor, município, câmera, produto ou qualquer outro conceito específico de um projeto.

Quando um domínio utiliza nomes próprios que não podem ser inferidos estruturalmente, um sidecar separado pode acrescentar hints:

```text
pbi-profiling.config.json
```

Ele é detectado automaticamente na raiz do PBIP ou pode ser passado por `--config`:

```powershell
node .\src\cli.js profile `
    ".\MeuProjeto" `
    --output ".\output" `
    --config ".\documentacao\profiling.json"
```

Exemplo:

```json
{
  "schemaVersion": 1,
  "analysis": {
    "semanticHints": {
      "mode": "extend",
      "terms": {
        "state": ["mode"],
        "entity": ["account"]
      },
      "columns": {
        "FactEvents[ObservedAt]": ["temporal"],
        "FactEvents[AccountCode]": ["entity"]
      }
    }
  }
}
```

`extend` preserva a semântica genérica e adiciona vocabulário local. `replace` desativa o vocabulário padrão e usa somente os hints fornecidos. Tipos, relações, papéis de visuais e DAX continuam sendo evidência estrutural em ambos os modos.

Cada sinal analítico registra a base da inferência, por exemplo `data-type:temporal`, `relationship-key`, `visual-grouping-role`, `default-lexicon`, `custom-semantic-term` ou `explicit-column-hint`. O HTML informa se a análise foi genérica ou configurada.

Contexto e configuração são deliberadamente separados:

- `pbi-profiling.context.json` declara significado de negócio;
- `pbi-profiling.config.json` controla somente heurísticas de profiling.

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

A ferramenta detecta sinais estruturais genéricos como:

- colunas temporais;
- estados/estágios;
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
- contexto de negócio é carregado localmente e tratado como entrada explícita, nunca inferida;
- configuração heurística local é reportada como configuração, nunca apresentada como fato extraído.

## Desenvolvimento

Os mesmos gates usados pelo runtime podem ser executados sem package manager:

```powershell
node .\scripts\check.js
node .\scripts\test.js
```

O CI valida Node.js 20, 22 e 24, o commit pinado do upstream, ausência de `node_modules`, ausência de dependências npm no pacote, sintaxe, suíte de testes e smoke test do CLI.

Os gates públicos usam somente fixtures sintéticas/open source; artefatos corporativos não são versionados neste repositório.
