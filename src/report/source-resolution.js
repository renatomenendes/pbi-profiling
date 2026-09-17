import {
  number,
  percent,
  text,
} from './escape.js';

export function renderSourceResolutionSection(profile) {
  const resolution = profile.sourceResolution;
  if (!resolution) return '';

  const summary = resolution.summary;
  const tableRows = (resolution.tables ?? [])
    .map((item) => `
      <tr>
        <td><strong>${text(item.table)}</strong></td>
        <td>${text(item.system)}</td>
        <td>${text(levelLabel(item.level))}</td>
        <td>${text(scopeLabel(item.scope))}</td>
        <td>${text(item.locatorKinds.join(', ') || '—')}</td>
      </tr>
    `)
    .join('');

  return `
    <section id="source-resolution" class="section">
      <div class="section-heading">
        <div>
          <div class="eyebrow">Origem dos dados</div>
          <h2>Resolução de fontes</h2>
          <p>
            A origem é separada em três classes para evitar falsos gaps: fontes externas,
            valores inline/model-local e colunas calculadas. Fontes Web e arquivos podem ser
            corretamente identificados mesmo quando o PBIP não expõe um objeto equivalente a
            database/schema/table/column.
          </p>
        </div>
      </div>

      <div class="grid stats-grid">
        ${stat(summary.resourceLineageCoverage, 'Lineage externo até recurso', true)}
        ${stat(summary.physicalColumnCoverage, 'Lineage externo até coluna física', true)}
        ${stat(summary.resourceResolved, 'Colunas em recurso externo')}
        ${stat(summary.inlineColumns, 'Colunas inline/model-local')}
        ${stat(summary.unresolvedColumns, 'Colunas ainda sem explicação')}
        ${stat(summary.computedColumns, 'Colunas calculadas')}
      </div>

      <div class="grid grid-2" style="margin-top:14px">
        <article class="card">
          <div class="kicker">Como interpretar</div>
          <p>
            <strong>Lineage externo até recurso</strong> significa que uma coluna que depende de
            fonte externa foi associada, no mínimo, ao recurso físico que alimenta a tabela — por
            exemplo, uma URL Web ou um arquivo. Isso não prova o nome de uma coluna no sistema de origem.
          </p>
          <p class="muted">
            <strong>Lineage externo até coluna física</strong> é mais estrito: exige um objeto físico
            endereçável e uma coluna mapeada. Portanto, cobertura física baixa não é automaticamente
            um erro quando o conector entrega um recurso sem semântica de tabela.
          </p>
          <p class="muted" style="margin-bottom:0">
            <strong>Inline/model-local</strong> representa valores incorporados ao próprio PBIP ou ao
            Power Query. Esses objetos são explicados localmente e ficam fora do denominador de cobertura
            externa, inclusive quando outra tabela os consome por join.
          </p>
        </article>

        <article class="card">
          <div class="kicker">Classificação atual</div>
          <p style="margin-bottom:0">
            Das <strong>${number(summary.traceableColumns)}</strong> colunas que requerem lineage de
            origem externa, <strong>${number(summary.physicalColumnResolved)}</strong> chegaram a uma
            coluna física, <strong>${number(summary.resourceResolved)}</strong> chegaram ao recurso
            externo e <strong>${number(summary.unresolvedColumns)}</strong> permanecem sem resolução
            suficiente. Além delas, <strong>${number(summary.inlineColumns)}</strong> coluna(s) terminam
            em origem inline/model-local e <strong>${number(summary.computedColumns)}</strong> são
            calculadas; ambas as classes ficam fora do denominador externo.
          </p>
        </article>
      </div>

      <div class="table-shell" style="margin-top:14px">
        <table>
          <thead>
            <tr>
              <th>Tabela do modelo</th>
              <th>Sistema</th>
              <th>Nível resolvido</th>
              <th>Escopo</th>
              <th>Identificadores disponíveis</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function stat(value, label, isPercent = false) {
  const rendered = isPercent ? percent(value, 1) : number(value);
  return `
    <article class="card stat-card">
      <div class="stat-value">${rendered}</div>
      <div class="stat-label">${text(label)}</div>
    </article>
  `;
}

function levelLabel(level) {
  return {
    'physical-table': 'Tabela física',
    resource: 'Recurso',
    unresolved: 'Não resolvida',
  }[level] ?? level;
}

function scopeLabel(scope) {
  return {
    external: 'Externo',
    inline: 'Inline/modelo',
    unknown: 'Indeterminado',
  }[scope] ?? scope;
}
