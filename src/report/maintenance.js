import {
  number,
  percent,
  text,
} from './escape.js';

export function renderMaintenanceSection(profile) {
  const maintenance = profile.maintenance;

  if (!maintenance) {
    return '';
  }

  const hotspots = maintenance.hotspots ?? [];
  const documentation = maintenance.documentation ?? {};
  const dependencies = maintenance.sourceDependencies ?? {};

  return `
    <section id="maintenance" class="section">
      ${sectionHeader(
        'Manutenção e impacto de mudança',
        'Prioriza objetos que merecem maior cautela durante alterações. O indicador combina centralidade, complexidade, dependências e documentação; não é uma nota de qualidade.',
      )}

      <div class="grid stats-grid">
        ${statCard(maintenance.summary?.highAttentionMeasures ?? 0, 'Medidas com atenção alta')}
        ${statCard(maintenance.summary?.criticalAttentionMeasures ?? 0, 'Atenção muito alta')}
        ${statCard(maintenance.summary?.operationalDependencies ?? 0, 'Dependências operacionais')}
        ${statCard(maintenance.summary?.unresolvedStructuralFindings ?? 0, 'Lacunas estruturais')}
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <article class="card">
          <h3>Cobertura de documentação</h3>
          ${coverageRow('Descrições TMDL de medidas', documentation.tmdlMeasureDescriptions)}
          ${coverageRow('Definições de negócio de medidas', documentation.businessMeasureDefinitions)}
          ${coverageRow('Contexto de tabelas', documentation.tableBusinessContext)}
          ${coverageRow('Contexto de páginas', documentation.pageBusinessContext)}
          <p class="muted">
            Ausência de contexto de negócio não é tratada como defeito quando o sidecar não foi fornecido;
            ela apenas permanece visível como documentação ainda não declarada.
          </p>
        </article>

        <article class="card">
          <h3>Dependências operacionais</h3>
          ${dependencyRow('Gateway', dependencies.gatewayRequired)}
          ${dependencyRow('Native query', dependencies.nativeQueries)}
          ${dependencyRow('Conexões parametrizadas', dependencies.parameterized)}
          <p class="muted">${text(dependencies.interpretation)}</p>
        </article>
      </div>

      <div style="margin-top:22px">
        <h3>Hotspots de mudança</h3>
        <p class="muted">
          Objetos no topo não são necessariamente ruins; são objetos em que uma alteração tem maior
          superfície potencial de impacto ou maior custo de compreensão.
        </p>
        ${hotspots.length ? `
          <div class="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Medida</th>
                  <th>Atenção</th>
                  <th>Centralidade</th>
                  <th>Complexidade</th>
                  <th>Dependências</th>
                  <th>Documentação</th>
                  <th>Razões</th>
                </tr>
              </thead>
              <tbody>
                ${hotspots.map(renderHotspotRow).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="muted">Nenhuma medida encontrada para análise.</p>'}
      </div>

      <details class="card" style="margin-top:14px">
        <summary>Metodologia de manutenção</summary>
        <p class="muted">${text(maintenance.methodology?.scope)}</p>
        <pre class="code">${text(JSON.stringify(maintenance.methodology, null, 2), '')}</pre>
      </details>
    </section>
  `;
}

function renderHotspotRow(item) {
  const evidence = item.evidence ?? {};
  const documented =
    evidence.technicalDescriptionPresent || evidence.businessDefinitionPresent;

  return `
    <tr>
      <td><strong>${text(`${item.table}[${item.name}]`)}</strong></td>
      <td>${percent(item.score, 1)}<br><span class="muted">${text(bandLabel(item.band))}</span></td>
      <td>${percent(evidence.structuralImportance, 1)}</td>
      <td>${percent(evidence.daxComplexity, 1)}</td>
      <td>${number(evidence.dependencyCount ?? 0)}</td>
      <td>${documented ? '<span class="badge success">documentada</span>' : '<span class="badge warning">lacuna</span>'}</td>
      <td>${item.reasons?.length ? text(item.reasons.map(reasonLabel).join(', ')) : '<span class="muted">sem limiar elevado</span>'}</td>
    </tr>
  `;
}

function dependencyRow(label, items) {
  const values = items ?? [];
  return `
    <div class="source-item" style="margin-top:8px">
      <strong>${text(label)}</strong>
      <span>${number(values.length)} fonte(s)</span>
      ${values.length ? `<details><summary>Ver fontes</summary><pre class="code">${text(JSON.stringify(values, null, 2), '')}</pre></details>` : ''}
    </div>
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

function statCard(value, label) {
  return `
    <article class="card stat-card">
      <span class="stat-value">${number(value)}</span>
      <span class="stat-label">${text(label)}</span>
    </article>
  `;
}

function progress(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${Math.max(0, Math.min(1, numeric)) * 100}%`;
}

function bandLabel(band) {
  return ({
    'very-high': 'muito alta',
    high: 'alta',
    moderate: 'moderada',
    low: 'baixa',
  })[band] ?? 'não calculada';
}

function reasonLabel(reason) {
  return ({
    'high-structural-centrality': 'centralidade alta',
    'high-dax-complexity': 'complexidade DAX alta',
    'broad-dependency-surface': 'muitas dependências',
    'documentation-gap': 'lacuna de documentação',
  })[reason] ?? reason;
}
