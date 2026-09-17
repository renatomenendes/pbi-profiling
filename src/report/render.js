import { REPORT_CLIENT_JS } from './client.js';
import {
  escapeHtml,
  number,
  percent,
  safeJsonForScript,
  text,
} from './escape.js';
import { REPORT_CSS } from './styles.js';
import { renderPageWireframe } from './wireframe.js';

const FINDING_LABELS = {
  'unresolved-source-columns': 'Colunas sem fonte física resolvida',
  'hidden-pages': 'Páginas ocultas',
  'page-definition-parse-errors': 'Definições de página com falha de leitura',
  'never-shown-visuals': 'Visuais que nunca são exibidos',
  'unused-measures': 'Medidas sem uso observado',
  'unresolved-visual-bindings': 'Campos de visual não resolvidos no modelo',
  'broken-model-references': 'Referências quebradas no modelo',
};

export function renderReportHtml({
  profile,
  lineageHtml = '',
}) {
  const title = profile.meta.reportName || profile.meta.modelName || profile.meta.projectName;
  const lineagePayload = lineageHtml
    ? Buffer.from(lineageHtml, 'utf-8').toString('base64')
    : '';
  const generatedAt = formatDateTime(profile.meta.generatedAt);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${text(title)} — PBI Profiling</title>
  <style>${REPORT_CSS}</style>
</head>
<body data-project="${escapeHtml(profile.meta.projectName)}">
  <button
    id="mobile-nav-toggle"
    class="button mobile-nav-button"
    type="button"
    aria-label="Abrir navegação"
  >Menu</button>

  <div class="app-shell">
    ${renderSidebar()}

    <main class="main">
      <div class="content">
        <header class="hero">
          <div class="eyebrow">Power BI · Perfil técnico e runbook</div>
          <h1>${text(title)}</h1>
          <p class="hero-description">
            Visão navegável do projeto PBIP para onboarding, manutenção e investigação.
            Os fatos abaixo são derivados do modelo semântico e do relatório; definições de
            negócio ausentes no PBIP não são fabricadas.
          </p>
          <div class="meta-line">
            <span>Projeto: <strong>${text(profile.meta.projectName)}</strong></span>
            <span>Modelo: <strong>${text(profile.meta.modelName)}</strong></span>
            <span>Relatório: <strong>${text(profile.meta.reportName)}</strong></span>
            <span>Gerado em: <strong>${text(generatedAt)}</strong></span>
          </div>
        </header>

        ${renderOverview(profile)}
        ${renderPages(profile)}
        ${renderMetrics(profile)}
        ${renderData(profile)}
        ${renderLineage(Boolean(lineagePayload))}
        ${renderUsage(profile)}
        ${renderQuality(profile)}
        ${renderTechnical(profile)}

        <footer class="footer">
          Gerado por <strong>pbi-profiling</strong>. Perfil read-only do PBIP.
          O JSON estruturado está incorporado neste arquivo e pode ser exportado pelo menu lateral.
        </footer>
      </div>
    </main>
  </div>

  <script id="profile-payload" type="application/json">${safeJsonForScript(profile)}</script>
  <script id="lineage-payload" type="application/octet-stream">${lineagePayload}</script>
  <script>${REPORT_CLIENT_JS}</script>
</body>
</html>`;
}

function renderSidebar() {
  const items = [
    ['01', 'Visão geral', 'overview'],
    ['02', 'Páginas', 'pages'],
    ['03', 'Métricas', 'metrics'],
    ['04', 'Dados', 'data'],
    ['05', 'Lineage', 'lineage'],
    ['06', 'Uso', 'usage'],
    ['07', 'Qualidade', 'quality'],
    ['08', 'Técnico', 'technical'],
  ];

  return `
    <aside class="sidebar" aria-label="Navegação do perfil">
      <div class="brand">
        <strong>pbi-profiling</strong>
        <span>PBIP runbook</span>
      </div>
      <nav class="nav">
        ${items.map(([index, label, anchor]) => `
          <a href="#${anchor}">
            <span class="nav-index">${index}</span>
            <span>${label}</span>
          </a>
        `).join('')}
      </nav>
      <div class="sidebar-actions">
        <button id="theme-toggle" class="button" type="button">Tema escuro</button>
        <button id="download-profile" class="button" type="button">Exportar profile.json</button>
      </div>
    </aside>
  `;
}

function renderOverview(profile) {
  const counts = profile.overview.counts;
  const coverage = profile.overview.sourceResolutionCoverage;
  const topMeasures = profile.usage.measures.slice(0, 6);
  const topTables = profile.usage.tables.slice(0, 6);
  const findings = profile.health.findings;

  return `
    <section id="overview" class="section">
      ${sectionHeader(
        'Visão geral',
        'O tamanho do produto, a cobertura da documentação e os principais pontos de atenção.',
      )}

      <div class="grid stats-grid">
        ${statCard(counts.pages, 'Páginas')}
        ${statCard(counts.visuals, 'Visuais')}
        ${statCard(counts.tables, 'Tabelas')}
        ${statCard(counts.measures, 'Medidas')}
        ${statCard(counts.columns, 'Colunas')}
        ${statCard(counts.sources, 'Fontes')}
        ${statCard(counts.relationships, 'Relacionamentos')}
        ${statCard(counts.bookmarks, 'Bookmarks')}
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <article class="card">
          <div class="kicker">Cobertura de lineage físico</div>
          <div class="stat-value" style="margin-top:7px">${percent(coverage, 1)}</div>
          <div class="progress" style="margin-top:8px">
            <span style="--progress:${coverageBar(coverage)}"></span>
          </div>
          <p class="muted" style="margin-bottom:0">
            Percentual de colunas mapeáveis cuja origem física foi resolvida pela engine.
            Colunas calculadas e objetos sem fonte física legítima não são tratados como erro.
          </p>
        </article>

        <article class="card">
          <div class="kicker">Leitura rápida</div>
          <p style="margin:8px 0 0">
            Este PBIP possui <strong>${number(counts.pages)} páginas</strong> e
            <strong>${number(counts.visuals)} visuais</strong>, sustentados por
            <strong>${number(counts.tables)} tabelas</strong> e
            <strong>${number(counts.measures)} medidas</strong>.
            ${profile.overview.hiddenPages > 0
              ? `Há <strong>${number(profile.overview.hiddenPages)} página(s) oculta(s)</strong>.`
              : 'Não foram identificadas páginas ocultas.'}
            ${profile.usage.unusedMeasures.length > 0
              ? `<strong>${number(profile.usage.unusedMeasures.length)} medida(s)</strong> não possuem uso observado.`
              : 'Todas as medidas possuem uso observado.'}
          </p>
        </article>
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        ${rankCard('Medidas mais consumidas', topMeasures, (item) => ({
          name: item.name,
          context: item.table,
          value: item.visualReferences,
          suffix: 'visuais',
        }))}
        ${rankCard('Tabelas mais presentes nos visuais', topTables, (item) => ({
          name: item.table,
          context: `${item.directlyUsedMeasures} medidas · ${item.directlyUsedColumns} colunas`,
          value: item.visualReferences,
          suffix: 'visuais',
        }))}
      </div>

      <div style="margin-top:14px">
        ${renderFindingSummary(findings)}
      </div>
    </section>
  `;
}

function renderPages(profile) {
  const visuals = profile.report.visuals ?? [];

  if (!profile.report.pages.length) {
    return `
      <section id="pages" class="section">
        ${sectionHeader('Páginas', 'Estrutura visual e campos usados em cada página do relatório.')}
        ${emptyState('Nenhuma página PBIR foi encontrada.')}
      </section>
    `;
  }

  const cards = profile.report.pages.map((page) => {
    const pageVisuals = visuals.filter((visual) => visual.page === page.id);
    const fields = pageVisuals.flatMap((visual) => visual.fields ?? []);
    const measures = unique(
      fields
        .filter((field) => field.kind === 'measure' && field.name)
        .map((field) => `${field.table}[${field.name}]`),
    );
    const tables = unique(
      fields
        .filter((field) => field.table)
        .map((field) => field.table),
    );
    const hiddenVisuals = pageVisuals.filter((visual) => visual.isHidden).length;
    const neverShown = pageVisuals.filter((visual) => visual.neverShown).length;
    const search = [page.name, ...measures, ...tables].join(' ');

    return `
      <article class="card page-card" data-search-card data-search="${escapeHtml(search)}">
        <div class="page-card-header">
          <div>
            <h3>${text(page.name)}</h3>
            <div class="page-meta">
              ${page.isHidden ? badge('Página oculta', 'warning') : badge('Página visível', 'success')}
              ${badge(`${pageVisuals.length} visuais`)}
              ${badge(`${measures.length} medidas`)}
              ${badge(`${tables.length} tabelas`)}
              ${hiddenVisuals ? badge(`${hiddenVisuals} visuais ocultos`, 'warning') : ''}
              ${neverShown ? badge(`${neverShown} nunca exibidos`, 'danger') : ''}
            </div>
          </div>
          <span class="mono muted">${text(page.id)}</span>
        </div>

        ${renderPageWireframe(page, pageVisuals)}

        <details>
          <summary>Objetos consumidos nesta página</summary>
          <div class="grid grid-2" style="margin-top:10px">
            <div>
              <strong>Medidas</strong>
              ${simpleList(measures)}
            </div>
            <div>
              <strong>Tabelas</strong>
              ${simpleList(tables)}
            </div>
          </div>
        </details>
      </article>
    `;
  }).join('');

  return `
    <section id="pages" class="section">
      ${sectionHeader(
        'Páginas',
        'Mapa aproximado do layout, objetos consumidos e estados de visibilidade de cada página.',
      )}
      ${searchBox('pages-list', 'Buscar página, tabela ou medida…')}
      <div id="pages-list" class="grid grid-2">${cards}</div>
    </section>
  `;
}

function renderMetrics(profile) {
  const usageIndex = new Map(
    profile.usage.measures.map((item) => [`${item.table}\u0000${item.name}`, item]),
  );

  if (!profile.semanticModel.measures.length) {
    return `
      <section id="metrics" class="section">
        ${sectionHeader('Métricas', 'Catálogo das medidas DAX e de suas dependências.')}
        ${emptyState('Nenhuma medida foi encontrada no modelo.')}
      </section>
    `;
  }

  const rows = profile.semanticModel.measures
    .slice()
    .sort((left, right) =>
      left.table.localeCompare(right.table) || left.name.localeCompare(right.name),
    )
    .map((measure, index) => {
      const usage = usageIndex.get(`${measure.table}\u0000${measure.name}`) ?? {};
      const dependencies = [
        ...(measure.dependsOn?.measures ?? []),
        ...(measure.dependsOn?.columns ?? []),
      ];
      const search = [
        measure.table,
        measure.name,
        measure.description,
        measure.expression,
        ...dependencies,
      ].filter(Boolean).join(' ');
      const codeId = `dax-${index}`;

      return `
        <tr data-search-row data-search="${escapeHtml(search)}">
          <td>
            <strong>${text(measure.name)}</strong>
            ${measure.isHidden ? `<br>${badge('oculta', 'info')}` : ''}
          </td>
          <td>${text(measure.table)}</td>
          <td>${number(usage.visualReferences ?? 0)}</td>
          <td>${number(usage.pageReferences ?? 0)}</td>
          <td>${number(usage.referencedByMeasures ?? 0)}</td>
          <td>
            ${dependencies.length ? text(dependencies.join(', ')) : '<span class="muted">Sem dependências detectadas</span>'}
            <details>
              <summary>DAX e metadados</summary>
              ${measure.description ? `<p>${text(measure.description)}</p>` : ''}
              <button class="button" type="button" data-copy="${codeId}" style="margin:8px 0">Copiar DAX</button>
              <pre id="${codeId}" class="code">${text(measure.expression, '')}</pre>
              <div class="meta-line">
                <span>Formato: <span class="mono">${text(measure.formatString)}</span></span>
                ${measure.underCalculationGroups?.length
                  ? `<span>Calculation groups: ${text(measure.underCalculationGroups.join(', '))}</span>`
                  : ''}
              </div>
            </details>
          </td>
        </tr>
      `;
    }).join('');

  return `
    <section id="metrics" class="section">
      ${sectionHeader(
        'Métricas',
        'Catálogo completo das medidas DAX, dependências e evidência de uso no relatório.',
      )}
      ${searchBox('metrics-table', 'Buscar medida, tabela, DAX ou dependência…')}
      <div class="table-shell">
        <table id="metrics-table">
          <thead>
            <tr>
              <th>Medida</th>
              <th>Tabela</th>
              <th>Visuais</th>
              <th>Páginas</th>
              <th>Consumida por medidas</th>
              <th>Definição / dependências</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderData(profile) {
  const tableCards = profile.semanticModel.tables
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((table) => {
      const columns = profile.semanticModel.columns.filter((column) => column.table === table.name);
      const measures = profile.semanticModel.measures.filter((measure) => measure.table === table.name);
      const usage = profile.usage.tables.find((item) => item.table === table.name);
      const search = [
        table.name,
        table.physicalPath,
        table.physical,
        ...columns.map((column) => column.name),
        ...measures.map((measure) => measure.name),
      ].filter(Boolean).join(' ');

      return `
        <article class="card" data-search-card data-search="${escapeHtml(search)}">
          <div class="page-card-header">
            <div>
              <h3>${text(table.name)}</h3>
              <div class="page-meta">
                ${badge(table.kind ?? 'table', 'info')}
                ${table.isCalculated ? badge('calculada', 'warning') : ''}
                ${table.isHidden ? badge('oculta', 'info') : ''}
                ${badge(`${columns.length} colunas`)}
                ${badge(`${measures.length} medidas`)}
                ${usage ? badge(`${usage.visualReferences} visuais`) : ''}
              </div>
            </div>
          </div>

          ${table.physicalPath || table.physical
            ? `<p class="muted"><strong>Origem resolvida:</strong> ${text(table.physicalPath || table.physical)}</p>`
            : '<p class="muted">Origem física não exposta diretamente para esta tabela.</p>'}

          ${table.steps?.length ? `
            <details>
              <summary>Pipeline Power Query / M (${table.steps.length} etapas)</summary>
              <div style="margin-top:10px">
                ${table.steps.map((step) => `
                  <div class="source-item">
                    <strong>${text(step.name)} · ${text(step.kind)}</strong>
                    <span>${text(step.expr)}</span>
                  </div>
                `).join('')}
              </div>
            </details>
          ` : ''}

          <details>
            <summary>Colunas e medidas</summary>
            <div class="grid grid-2" style="margin-top:10px">
              <div>
                <strong>Colunas</strong>
                ${simpleList(columns.map((column) =>
                  `${column.name}${column.dataType ? ` · ${column.dataType}` : ''}`,
                ))}
              </div>
              <div>
                <strong>Medidas</strong>
                ${simpleList(measures.map((measure) => measure.name))}
              </div>
            </div>
          </details>
        </article>
      `;
    }).join('');

  return `
    <section id="data" class="section">
      ${sectionHeader(
        'Dados',
        'Tabelas, fontes, relacionamentos e transformações que sustentam o relatório.',
      )}

      <div class="grid grid-2">
        <article class="card">
          <h3>Fontes detectadas</h3>
          ${renderSources(profile.semanticModel.sources)}
        </article>
        <article class="card">
          <h3>Relacionamentos</h3>
          ${renderRelationships(profile.semanticModel.relationships)}
        </article>
      </div>

      <div style="margin-top:22px">
        ${searchBox('tables-list', 'Buscar tabela, coluna, medida ou origem…')}
        <div id="tables-list" class="grid grid-2">${tableCards || emptyState('Nenhuma tabela encontrada.')}</div>
      </div>
    </section>
  `;
}

function renderLineage(hasLineage) {
  return `
    <section id="lineage" class="section">
      ${sectionHeader(
        'Lineage',
        'Navegação técnica da cadeia visual → medida → coluna → Power Query → fonte física.',
      )}
      ${hasLineage ? `
        <div class="card lineage-shell">
          <div class="lineage-toolbar">
            <div>
              <strong>Explorador interativo</strong>
              <div id="lineage-status" class="muted">Carrega localmente ao entrar nesta seção</div>
            </div>
            <button id="load-lineage" class="button" type="button">Carregar lineage</button>
          </div>
          <iframe
            id="lineage-frame"
            title="Explorador interativo de lineage"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </div>
      ` : emptyState('O lineage interativo não foi incorporado nesta execução.')}
    </section>
  `;
}

function renderUsage(profile) {
  const measureRows = profile.usage.measures.slice(0, 20).map((item) => `
    <tr>
      <td><strong>${text(item.name)}</strong><br><span class="muted">${text(item.table)}</span></td>
      <td>${number(item.visualReferences)}</td>
      <td>${number(item.pageReferences)}</td>
      <td>${number(item.referencedByMeasures)}</td>
      <td>${item.active ? badge('ativo', 'success') : badge('sem uso observado', 'warning')}</td>
    </tr>
  `).join('');

  return `
    <section id="usage" class="section">
      ${sectionHeader(
        'Uso',
        'Evidência de consumo dos objetos: uso direto nos visuais e uso transitivo por outras medidas.',
      )}

      <div class="grid grid-2">
        <article class="card">
          <div class="kicker">Medidas sem uso observado</div>
          <div class="stat-value">${number(profile.usage.unusedMeasures.length)}</div>
          <p class="muted">
            “Sem uso observado” significa que a medida não aparece em visual e não é referenciada
            por outra medida segundo a análise atual. Isso é evidência para revisão, não autorização automática de exclusão.
          </p>
          ${simpleList(profile.usage.unusedMeasures.map((item) => `${item.table}[${item.name}]`))}
        </article>
        <article class="card">
          <div class="kicker">Colunas sem uso observado</div>
          <div class="stat-value">${number(profile.usage.unusedColumns.length)}</div>
          <p class="muted">
            Colunas podem ser necessárias para relacionamentos, ordenação, segurança ou transformações.
            A ausência de uso visual/DAX não implica obsolescência.
          </p>
        </article>
      </div>

      <div class="table-shell" style="margin-top:14px">
        <table>
          <thead>
            <tr>
              <th>Medida</th>
              <th>Visuais</th>
              <th>Páginas</th>
              <th>Por medidas</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${measureRows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderQuality(profile) {
  const findings = profile.health.findings;

  return `
    <section id="quality" class="section">
      ${sectionHeader(
        'Qualidade e cobertura',
        'Lacunas observáveis na documentação técnica. Findings são rastreáveis a objetos concretos.',
      )}

      <div class="grid stats-grid">
        ${statCard(profile.health.counts.errors, 'Erros')}
        ${statCard(profile.health.counts.warnings, 'Alertas')}
        ${statCard(profile.health.counts.info, 'Informações')}
        ${statCard(percent(profile.health.sourceResolutionCoverage, 1), 'Lineage físico')}
      </div>

      <div class="findings-list" style="margin-top:14px">
        ${findings.length
          ? findings.map(renderFindingDetail).join('')
          : callout('success', 'Nenhuma lacuna estrutural registrada', 'Os verificadores atuais não produziram findings para este PBIP.')}
      </div>
    </section>
  `;
}

function renderTechnical(profile) {
  return `
    <section id="technical" class="section">
      ${sectionHeader(
        'Técnico',
        'Metadados da execução, contrato do perfil e detalhes para investigação especializada.',
      )}

      <div class="technical-grid">
        <article class="card">
          <div class="kicker">Contrato</div>
          <h3>Profile schema v${number(profile.schemaVersion)}</h3>
          <p class="muted">O HTML e o JSON derivam do mesmo documento estruturado.</p>
        </article>
        <article class="card">
          <div class="kicker">Engine</div>
          <h3>${text(profile.meta.engine?.name)}</h3>
          <p class="muted">Viewer model: ${text(profile.meta.engine?.viewerModelVersion)}</p>
        </article>
        <article class="card">
          <div class="kicker">Princípio</div>
          <h3>Read-only</h3>
          <p class="muted">A geração do perfil não altera o PBIP analisado.</p>
        </article>
      </div>

      <details class="card" style="margin-top:14px">
        <summary>Estatísticas brutas da engine</summary>
        <pre class="code">${text(JSON.stringify(profile.engineStats, null, 2), '')}</pre>
      </details>
    </section>
  `;
}

function renderFindingSummary(findings) {
  if (!findings.length) {
    return callout(
      'success',
      'Sem findings estruturais no escopo atual',
      'A cobertura pode ser ampliada conforme novos verificadores forem incorporados.',
    );
  }

  return `
    <div class="findings-list">
      ${findings.slice(0, 6).map((finding) => callout(
        finding.severity,
        FINDING_LABELS[finding.code] ?? finding.title ?? finding.code,
        `${finding.count ?? finding.evidence?.length ?? 0} ocorrência(s) observada(s).`,
      )).join('')}
    </div>
  `;
}

function renderFindingDetail(finding) {
  const title = FINDING_LABELS[finding.code] ?? finding.title ?? finding.code;
  const evidence = finding.evidence ?? [];

  return `
    <article class="callout ${escapeHtml(finding.severity ?? 'info')}">
      <span class="callout-mark" aria-hidden="true"></span>
      <div>
        <h4>${text(title)} · ${number(finding.count ?? evidence.length)}</h4>
        ${evidence.length ? `
          <details>
            <summary>Ver evidências</summary>
            <pre class="code">${text(JSON.stringify(evidence, null, 2), '')}</pre>
          </details>
        ` : ''}
      </div>
    </article>
  `;
}

function renderSources(sources) {
  if (!sources?.length) {
    return '<p class="muted">Nenhuma fonte física foi detectada.</p>';
  }

  return `
    <div class="source-grid">
      ${sources.map((source) => {
        const location = [
          source.server,
          source.database,
          source.url,
          source.path,
        ].filter(Boolean).join(' · ');
        const tags = [
          source.gatewayRequired === true ? 'gateway' : null,
          source.parameterized ? 'parametrizada' : null,
          source.isNativeQuery ? 'native query' : null,
        ].filter(Boolean);

        return `
          <div class="source-item">
            <strong>${text(source.type)}</strong>
            <span>${text(location, 'Localização não exposta')}</span>
            ${tags.length ? `<div class="page-meta" style="margin-top:8px">${tags.map((tag) => badge(tag, 'info')).join('')}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRelationships(relationships) {
  if (!relationships?.length) {
    return '<p class="muted">Nenhum relacionamento físico foi encontrado.</p>';
  }

  return `
    <div class="source-grid">
      ${relationships.map((relationship) => `
        <div class="source-item">
          <strong>${text(`${relationship.fromTable}[${relationship.fromColumn}]`)}</strong>
          <span>→ ${text(`${relationship.toTable}[${relationship.toColumn}]`)}</span>
          <div class="page-meta" style="margin-top:8px">
            ${badge(relationship.isActive ? 'ativo' : 'inativo', relationship.isActive ? 'success' : 'warning')}
            ${relationship.crossFilter ? badge(relationship.crossFilter, 'info') : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function sectionHeader(title, description) {
  return `
    <div class="section-header">
      <div>
        <h2>${text(title)}</h2>
        <p>${text(description)}</p>
      </div>
    </div>
  `;
}

function statCard(value, label) {
  return `
    <article class="card stat-card">
      <span class="stat-value">${typeof value === 'string' ? text(value) : number(value)}</span>
      <span class="stat-label">${text(label)}</span>
    </article>
  `;
}

function rankCard(title, items, mapper) {
  return `
    <article class="card">
      <h3>${text(title)}</h3>
      ${items.length ? `
        <div class="rank-list">
          ${items.map((item) => {
            const mapped = mapper(item);
            return `
              <div class="rank-item">
                <div class="rank-name">
                  <strong>${text(mapped.name)}</strong>
                  <span>${text(mapped.context)}</span>
                </div>
                <span class="rank-number">${number(mapped.value)} ${text(mapped.suffix)}</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<p class="muted">Sem dados suficientes.</p>'}
    </article>
  `;
}

function searchBox(targetId, placeholder) {
  return `
    <div class="search-row">
      <input
        class="search-input"
        type="search"
        placeholder="${escapeHtml(placeholder)}"
        data-search-input="${escapeHtml(targetId)}"
        aria-label="${escapeHtml(placeholder)}"
      />
      <span class="muted"><span data-search-count="${escapeHtml(targetId)}">0</span> itens</span>
    </div>
  `;
}

function badge(label, kind = '') {
  return `<span class="badge ${escapeHtml(kind)}">${text(label)}</span>`;
}

function simpleList(items) {
  if (!items?.length) {
    return '<p class="muted">Nenhum item.</p>';
  }

  return `<ul>${items.map((item) => `<li>${text(item)}</li>`).join('')}</ul>`;
}

function emptyState(message) {
  return `
    <div class="empty-state">
      <strong>Sem conteúdo</strong>
      <span>${text(message)}</span>
    </div>
  `;
}

function callout(kind, title, description) {
  return `
    <div class="callout ${escapeHtml(kind)}">
      <span class="callout-mark" aria-hidden="true"></span>
      <div>
        <h4>${text(title)}</h4>
        <p>${text(description)}</p>
      </div>
    </div>
  `;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function coverageBar(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return '0%';
  }
  return `${Math.min(Math.max(normalized, 0), 1) * 100}%`;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
