# pbi-profiling

`pbi-profiling` é uma ferramenta local e read-only para profiling, discovery, auditoria e documentação de projetos Power BI em formato PBIP.

Ela transforma TMDL, PBIR, DAX, Power Query/M, fontes, relacionamentos, páginas e visuais em um runbook navegável e em artefatos estruturados para auditoria, automação e RAG.

## Principais capacidades

- profiling de modelos semânticos TMDL;
- leitura de PBIR;
- catálogo de tabelas, colunas, medidas e relacionamentos;
- análise de DAX e Power Query/M;
- resolução de fontes físicas;
- lineage e impacto;
- inventário de páginas, visuais e bookmarks;
- uso direto e transitivo;
- importância estrutural;
- complexidade;
- saúde e manutenção;
- oportunidades analíticas;
- contexto de negócio opcional;
- runbook HTML autocontido;
- exportação JSON e JSONL para RAG.

## Download

A distribuição oficial é publicada em **GitHub Releases** como:

```text
pbi-profiling-v<version>-windows-portable.zip
SHA256SUMS.txt
```

Use o ZIP do release, não o archive automático de source code do GitHub. O pacote oficial já contém a dependência upstream pinada necessária em runtime.

Consulte `docs/INSTALLATION.md` para instalação e verificação de checksum.

## Requisitos

- Windows 10 ou 11;
- Node.js 20 ou superior;
- Power BI Desktop apenas para o fluxo opcional com PBIX.

Não é necessário:

- `npm install`;
- Python;
- privilégio administrativo;
- mudança de PowerShell ExecutionPolicy;
- CDN;
- serviço externo.

## Início rápido

Depois de extrair o pacote:

```powershell
.\pbi-profiling.cmd
```

A aplicação abre no navegador e usa apenas o servidor local em `127.0.0.1`.

### Se você já possui PBIP

```text
Selecionar pasta PBIP
→ validar estrutura
→ Gerar runbook
→ Abrir runbook / Exportar HTML / JSON / RAG
```

### Se a origem é PBIX

```text
Selecionar PBIX
→ Abrir no Power BI Desktop
→ File > Save As > Power BI Project (.pbip)
→ Selecionar pasta PBIP
→ validar
→ Gerar runbook
```

PBIX não é convertido programaticamente pelo profiler. Power BI Desktop é a autoridade para materializar o PBIP oficial.

PBIT não é entrada de profiling.

## Saídas

Cada execução aprovada gera:

- `profile.html` — runbook humano autocontido;
- `profile.json` — contrato estruturado e auditável;
- `profile.rag.jsonl` — chunks autocontidos para busca/RAG/agentes.

Na aplicação local:

- **Abrir runbook** abre o HTML no navegador;
- **Exportar HTML** salva `profile.html`;
- **profile.json** baixa o JSON;
- **profile.rag.jsonl** baixa o JSONL.

Veja `docs/OUTPUTS.md` para os contratos de saída.

## Contrato de entrada

O artefato de profiling é **PBIP**.

Entradas aceitas:

- pasta raiz PBIP;
- arquivo `.pbip`;
- pasta `.SemanticModel`;
- pasta `.Report`.

Antes do profiling, a aplicação exige:

- pelo menos um arquivo TMDL;
- pelo menos uma tabela semântica parseável;
- estrutura PBIP/PBIR válida.

Projetos estruturalmente vazios são bloqueados.

## Privacidade e segurança

- análise local;
- PBIP tratado de forma read-only;
- servidor apenas em loopback;
- API protegida por token aleatório de sessão;
- runbook sem CDN;
- nenhum dado corporativo faz parte do repositório ou dos fixtures públicos;
- caminhos absolutos da estação não são persistidos no `profile.json` por padrão.

Consulte `SECURITY.md`.

## Arquitetura

A engine de interpretação PBIP usa `pbi-lineage-lenz` pinado no commit:

```text
7e2c61cac2f5e0ca6e7135df17a6918c89c42aec
```

O runtime importa o código-fonte auditado diretamente, sem dependências npm instaladas.

A arquitetura e as fronteiras do produto estão documentadas em `docs/ARCHITECTURE.md`.

## Contexto de negócio opcional

A raiz do PBIP pode conter:

```text
pbi-profiling.context.json
```

Esse sidecar declara significado de negócio, como propósito, audiência, grain e expectativas operacionais.

A ausência do contexto é válida. O profiler não fabrica significado de negócio.

Schema:

```text
schemas/pbi-profiling.context.schema.json
```

## Configuração semântica opcional

A raiz também pode conter:

```text
pbi-profiling.config.json
```

Esse arquivo controla apenas heurísticas de profiling e não altera fatos extraídos do PBIP.

Schema:

```text
schemas/pbi-profiling.config.schema.json
```

## CLI

Para automação sobre PBIP já salvo:

```powershell
node .\src\cli.js profile `
    "C:\caminho\MeuProjetoPBIP" `
    --output ".\output\MeuProjeto"
```

## Desenvolvimento

Clone com submodules:

```powershell
git clone --recurse-submodules https://github.com/renatomenendes/pbi-profiling.git
Set-Location .\pbi-profiling
git submodule update --init --recursive
```

Gates locais:

```powershell
node .\scripts\check.js
node .\scripts\test.js
node .\src\cli.js --help
node .\scripts\package-release.js
```

O CI valida Node.js 20, 22 e 24, Windows PowerShell 5.1, contrato zero-install e o pacote portátil real.

## Documentação

- `docs/INSTALLATION.md` — instalação e atualização;
- `docs/USER-GUIDE.md` — fluxo de uso;
- `docs/OUTPUTS.md` — contratos de saída;
- `docs/ARCHITECTURE.md` — arquitetura;
- `docs/METHODOLOGY.md` — metodologia de profiling;
- `docs/RELEASING.md` — processo de release;
- `CHANGELOG.md` — histórico de versões;
- `SECURITY.md` — política de segurança;
- `CONTRIBUTING.md` — contribuição;
- `ATTRIBUTIONS.md` e `THIRD_PARTY_NOTICES.md` — proveniência e licenças.

## Licença

MIT. Consulte `LICENSE`.

Licenças e atribuições de terceiros permanecem aplicáveis ao material upstream incluído.
