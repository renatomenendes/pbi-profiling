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
