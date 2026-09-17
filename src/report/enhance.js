import { percent } from './escape.js';
import { renderReportHtml } from './render.js';
import {
  renderContextSection,
  renderIntelligenceSection,
} from './intelligence.js';
import { renderMaintenanceSection } from './maintenance.js';
import { renderSourceResolutionSection } from './source-resolution.js';

const NAVIGATION = [
  ['01', 'Visão geral', 'overview'],
  ['02', 'Contexto', 'context'],
  ['03', 'Páginas', 'pages'],
  ['04', 'Métricas', 'metrics'],
  ['05', 'Origem', 'source-resolution'],
  ['06', 'Dados', 'data'],
  ['07', 'Inteligência', 'intelligence'],
  ['08', 'Manutenção', 'maintenance'],
  ['09', 'Lineage', 'lineage'],
  ['10', 'Uso', 'usage'],
  ['11', 'Qualidade', 'quality'],
  ['12', 'Técnico', 'technical'],
];

export function renderEnhancedReportHtml({
  profile,
  lineageHtml = '',
}) {
  let html = renderReportHtml({
    profile,
    lineageHtml,
  });

  html = replaceOverviewSourceCoverage(html, profile);
  html = injectBeforeSection(
    html,
    'pages',
    renderContextSection(profile),
  );
  html = injectBeforeSection(
    html,
    'data',
    renderSourceResolutionSection(profile),
  );
  html = injectBeforeSection(
    html,
    'lineage',
    renderIntelligenceSection(profile),
  );
  html = injectBeforeSection(
    html,
    'lineage',
    renderMaintenanceSection(profile),
  );
  html = replaceNavigation(html);

  return html;
}

function replaceOverviewSourceCoverage(html, profile) {
  const summary = profile.sourceResolution?.summary;
  if (!summary) {
    return html;
  }

  const pattern = /<article class="card">\s*<div class="kicker">Cobertura de lineage físico<\/div>[\s\S]*?<\/article>/;
  if (!pattern.test(html)) {
    throw new Error('Runbook overview source-coverage extension point not found.');
  }

  const resourceCoverage = summary.resourceLineageCoverage;
  const physicalCoverage = summary.physicalColumnCoverage;
  const resourceProgress = Number.isFinite(Number(resourceCoverage))
    ? `${Math.max(0, Math.min(1, Number(resourceCoverage))) * 100}%`
    : '0%';

  const replacement = `
        <article class="card">
          <div class="kicker">Cobertura de origem externa</div>
          <div class="stat-value" style="margin-top:7px">${percent(resourceCoverage, 1)}</div>
          <div class="progress" style="margin-top:8px">
            <span style="--progress:${resourceProgress}"></span>
          </div>
          <p style="margin:10px 0 4px">
            <strong>Lineage até recurso externo:</strong> ${percent(resourceCoverage, 1)}
          </p>
          <p style="margin:0 0 8px">
            <strong>Lineage até coluna física:</strong> ${percent(physicalCoverage, 1)}
          </p>
          <p class="muted" style="margin-bottom:0">
            A primeira cobertura verifica se a origem externa é conhecida, mesmo quando a fonte é
            URL, arquivo ou serviço. A segunda é mais estrita e exige uma tabela/coluna física
            endereçável. Dados inline e colunas calculadas são classificados separadamente.
          </p>
        </article>`;

  return html.replace(pattern, replacement);
}

function injectBeforeSection(html, sectionId, content) {
  const marker = `<section id="${sectionId}" class="section">`;
  const index = html.indexOf(marker);

  if (index < 0) {
    throw new Error(
      `Runbook extension point not found for section: ${sectionId}`,
    );
  }

  return `${html.slice(0, index)}${content}\n${html.slice(index)}`;
}

function replaceNavigation(html) {
  const pattern = /<nav class="nav">[\s\S]*?<\/nav>/;
  if (!pattern.test(html)) {
    throw new Error('Runbook navigation extension point not found.');
  }

  const navigation = `
      <nav class="nav">
        ${NAVIGATION.map(([index, label, anchor]) => `
          <a href="#${anchor}">
            <span class="nav-index">${index}</span>
            <span>${label}</span>
          </a>
        `).join('')}
      </nav>`;

  return html.replace(pattern, navigation);
}
