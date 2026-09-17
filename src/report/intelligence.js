import {
  escapeHtml,
  number,
  percent,
  text,
} from './escape.js';

export function renderContextSection(profile) {
  const context = profile.context;
  const dashboard = context?.data?.dashboard ?? {};

  if (!context || context.status !== 'provided') {
    return `
      <section id="context" class="section">
        ${sectionHeader(
          'Contexto de negócio',
          'Informação explicitamente fornecida por pessoas responsáveis pelo produto. O PBIP não é usado para inventar finalidade, owner ou SLA.',
        )}
        <div class="callout info">
          <span class="callout-mark" aria-hidden="true"></span>
          <div>
            <h4>Contexto não fornecido</h4>
            <p>
              A documentação técnica continua completa. Para adicionar finalidade, público,
              uso operacional, perguntas de negócio, grain, SLA e definições de métricas,
              forneça opcionalmente <span class="mono">pbi-profiling.context.json</span>.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  const owner = dashboard.owner
    ? [dashboard.owner.team, dashboard.owner.contact].filter(Boolean).join(' · ')
    : null;
  const refresh = dashboard.refresh
    ? [
        dashboard.refresh.cadence,
        dashboard.refresh.sla,
        dashboard.refresh.timezone,
      ].filter(Boolean).join(' · ')
    : null;

  return `
    <section id="context" class="section">
      ${sectionHeader(
        'Contexto de negócio',
        `Contexto humano carregado de ${context.source}. Esta camada é declarativa e permanece separada dos fatos extraídos do PBIP.`,
      )}

      <div class="grid grid-2">
        <article class="card">
          <div class="kicker">Finalidade</div>
          <p>${text(dashboard.purpose, 'Não documentada')}</p>
          <div class="kicker">Owner</div>
          <p>${text(owner, 'Não documentado')}</p>
          <div class="kicker">Público</div>
          ${simpleList(dashboard.audience)}
        </article>
        <article class="card">
          <div class="kicker">Operação</div>
          <p><strong>Refresh / SLA:</strong> ${text(refresh, 'Não documentado')}</p>
          <strong>Uso operacional</strong>
          ${simpleList(dashboard.operationalUse)}
          <strong>Perguntas de negócio</strong>
          ${simpleList(dashboard.businessQuestions)}
        </article>
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <article class="card">
          <h3>Cobertura do contexto</h3>
          ${coverageRow('Dashboard', context.coverage?.dashboard)}
          ${coverageRow('Tabelas', context.coverage?.objects?.tables)}
          ${coverageRow('Medidas', context.coverage?.objects?.measures)}
          ${coverageRow('Páginas', context.coverage?.objects?.pages)}
          ${coverageRow('Fontes', context.coverage?.objects?.sources)}
        </article>
        <article class="card">
          <h3>Caveats e notas</h3>
          ${simpleList([
            ...(dashboard.caveats ?? []),
            ...(context.data?.notes ?? []),
          ])}
        </article>
      </div>

      ${context.warnings?.length ? `
        <div class="callout warning" style="margin-top:14px">
          <span class="callout-mark" aria-hidden="true"></span>
          <div>
            <h4>${number(context.warnings.length)} aviso(s) de contexto</h4>
            ${simpleList(context.warnings)}
          </div>
        </div>
      ` : ''}
    </section>
  `;
}

export function renderIntelligenceSection(profile) {
  const complexity = profile.complexity;
  const importance = profile.importance;
  const analytical = profile.analytical;
  const topMeasures = importance?.mostCentralMeasures?.slice(0, 10) ?? [];
  const topTables = importance?.mostCentralTables?.slice(0, 10) ?? [];
  const opportunities = analytical?.opportunities ?? [];
  const capabilities = analytical?.capabilities ?? [];

  return `
    <section id="intelligence" class="section">
      ${sectionHeader(
        'Inteligência de profiling',
        'Centralidade técnica, complexidade e potencial analítico derivados de evidência estrutural. Estes indicadores não substituem contexto de negócio nem validação estatística.',
      )}

      <div class="grid stats-grid">
        ${scoreCard('Complexidade combinada', complexity?.combined)}
        ${scoreCard('Modelo semântico', complexity?.semanticModel)}
        ${scoreCard('Relatório', complexity?.report)}
        ${statCard(
          opportunities.filter((item) => item.status === 'supported-candidate').length,
          'Oportunidades com suporte forte',
        )}
        ${statCard(
          complexity?.hotspots?.length ?? 0,
          'Hotspots DAX',
        )}
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        ${centralityTable('Medidas estruturalmente centrais', topMeasures, false)}
        ${centralityTable('Tabelas estruturalmente centrais', topTables, true)}
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <article class="card">
          <h3>Capacidades analíticas observadas</h3>
          <div class="source-grid">
            ${capabilities.length
              ? capabilities.map(renderCapability).join('')
              : '<p class="muted">Nenhuma capacidade estrutural foi inferida.</p>'}
          </div>
        </article>
        <article class="card">
          <h3>Hotspots de complexidade DAX</h3>
          ${complexity?.hotspots?.length
            ? `<div class="source-grid">${complexity.hotspots.slice(0, 10).map((item) => `
                <div class="source-item">
                  <strong>${text(`${item.table}[${item.name}]`)}</strong>
                  <span>${percent(item.score, 1)} · ${text(bandLabel(item.band))} · ${number(item.metrics?.dependencyCount ?? 0)} dependências · profundidade ${number(item.metrics?.nestingDepth ?? 0)}</span>
                </div>
              `).join('')}</div>`
            : '<p class="muted">Nenhum hotspot acima do limiar de 50% foi observado.</p>'}
        </article>
      </div>

      <div style="margin-top:22px">
        <h3>Oportunidades analíticas</h3>
        <p class="muted">
          Uma oportunidade significa que a estrutura do PBIP contém sinais compatíveis com a análise.
          Ela não afirma que o dado linha a linha tem qualidade, histórico ou poder preditivo suficiente.
        </p>
        <div class="table-shell">
          <table>
            <thead>
              <tr>
                <th>Oportunidade</th>
                <th>Status</th>
                <th>Força estrutural</th>
                <th>Confiança</th>
                <th>Evidência / pré-requisitos</th>
              </tr>
            </thead>
            <tbody>
              ${opportunities.map(renderOpportunityRow).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <details class="card" style="margin-top:14px">
        <summary>Metodologia dos indicadores</summary>
        <div class="grid grid-2" style="margin-top:12px">
          <div>
            <strong>Importância estrutural</strong>
            <p class="muted">${text(importance?.methodology?.scope)}</p>
            <pre class="code">${text(JSON.stringify(importance?.methodology, null, 2), '')}</pre>
          </div>
          <div>
            <strong>Complexidade</strong>
            <p class="muted">${text(complexity?.methodology?.interpretation)}</p>
            <pre class="code">${text(JSON.stringify(complexity?.methodology, null, 2), '')}</pre>
          </div>
        </div>
      </details>
    </section>
  `;
}

function renderCapability(item) {
  const kind = item.status === 'strong-structural-support'
    ? 'success'
    : item.status === 'partial-structural-support'
      ? 'warning'
      : 'info';

  return `
    <div class="source-item">
      <strong>${text(item.title)}</strong>
      <span>${text(statusLabel(item.status))} · força ${percent(item.strength, 0)} · confiança ${text(item.confidence)}</span>
      <div class="page-meta" style="margin-top:8px">
        <span class="badge ${kind}">${text(statusLabel(item.status))}</span>
        <span class="badge">${number(item.evidence?.length ?? 0)} evidências</span>
      </div>
      <p class="muted" style="margin-bottom:0">${text(item.caveat)}</p>
    </div>
  `;
}

function renderOpportunityRow(item) {
  const kind = item.status === 'supported-candidate'
    ? 'success'
    : item.status === 'candidate-needs-validation'
      ? 'warning'
      : 'info';

  return `
    <tr>
      <td><strong>${text(item.title)}</strong></td>
      <td><span class="badge ${kind}">${text(statusLabel(item.status))}</span></td>
      <td>${percent(item.strength, 0)}</td>
      <td>${text(item.confidence)}</td>
      <td>
        <details>
          <summary>${number(item.evidence?.length ?? 0)} evidências · ${number(item.prerequisites?.length ?? 0)} pré-requisitos</summary>
          <strong>Evidência</strong>
          ${simpleList(item.evidence)}
          <strong>Antes de modelar</strong>
          ${simpleList(item.prerequisites)}
          <p class="muted">${text(item.caveat)}</p>
        </details>
      </td>
    </tr>
  `;
}

function centralityTable(title, items, tableMode) {
  return `
    <article class="card">
      <h3>${text(title)}</h3>
      ${items.length ? `
        <div class="table-shell">
          <table>
            <thead><tr><th>Objeto</th><th>Índice</th><th>Evidência</th></tr></thead>
            <tbody>
              ${items.map((item) => `
                <tr>
                  <td><strong>${text(tableMode ? item.table : `${item.table}[${item.name}]`)}</strong></td>
                  <td>${percent(item.score, 1)}<br><span class="muted">${text(bandLabel(item.band))}</span></td>
                  <td>${text(centralityEvidence(item, tableMode))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="muted">Sem objetos suficientes.</p>'}
    </article>
  `;
}

function centralityEvidence(item, tableMode) {
  const evidence = item.evidence ?? {};
  if (tableMode) {
    return `${evidence.visualReferences ?? 0} visuais · ${evidence.pageReferences ?? 0} páginas · ${evidence.relationshipDegree ?? 0} relações · ${evidence.dependentMeasures ?? 0} medidas dependentes`;
  }
  return `${evidence.visualReferences ?? 0} visuais · ${evidence.pageReferences ?? 0} páginas · ${evidence.directDependentMeasures ?? 0} dependentes diretas · ${evidence.transitiveDependentMeasures ?? 0} transitivas`;
}

function scoreCard(label, value) {
  return `
    <article class="card stat-card">
      <span class="stat-value">${percent(value?.score, 1)}</span>
      <span class="stat-label">${text(label)} · ${text(bandLabel(value?.band))}</span>
    </article>
  `;
}

function statCard(value, label) {
  return `
    <article class="card stat-card">
      <span class="stat-value">${number(value)}</span>
      <span class="stat-label">${text(label)}</span>
    </article>
  `;
}

function coverageRow(label, value) {
  return `
    <div style="margin-top:10px">
      <div class="wireframe-legend"><strong>${text(label)}</strong><span>${percent(value, 0)}</span></div>
      <div class="progress"><span style="--progress:${progress(value)}"></span></div>
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

function simpleList(items) {
  if (!items?.length) {
    return '<p class="muted">Nenhum item documentado.</p>';
  }
  return `<ul>${items.map((item) => `<li>${text(item)}</li>`).join('')}</ul>`;
}

function progress(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${Math.max(0, Math.min(1, numeric)) * 100}%`;
}

function statusLabel(status) {
  return String(status ?? 'unknown')
    .replaceAll('-', ' ')
    .replace('strong structural support', 'suporte estrutural forte')
    .replace('partial structural support', 'suporte estrutural parcial')
    .replace('not observed', 'não observado')
    .replace('supported candidate', 'candidato bem suportado')
    .replace('candidate needs validation', 'candidato a validar')
    .replace('insufficient structural evidence', 'evidência estrutural insuficiente');
}

function bandLabel(band) {
  return ({
    'very-high': 'muito alta',
    high: 'alta',
    moderate: 'moderada',
    low: 'baixa',
  })[band] ?? 'não calculada';
}
