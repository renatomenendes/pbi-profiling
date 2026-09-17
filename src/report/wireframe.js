import { escapeHtml, number, text } from './escape.js';

const FALLBACK_WIDTH = 1280;
const FALLBACK_HEIGHT = 720;

export function renderPageWireframe(page, visuals) {
  const width = positive(page.width) ?? inferExtent(visuals, 'x', 'width') ?? FALLBACK_WIDTH;
  const height = positive(page.height) ?? inferExtent(visuals, 'y', 'height') ?? FALLBACK_HEIGHT;
  const viewBox = `0 0 ${width} ${height}`;

  const rectangles = visuals
    .filter((visual) => validPosition(visual.position))
    .map((visual) => renderVisual(visual))
    .join('');

  if (!rectangles) {
    return `
      <div class="wireframe-empty">
        <strong>Layout não disponível</strong>
        <span>O PBIR não expôs posições utilizáveis para os visuais desta página.</span>
      </div>
    `;
  }

  return `
    <div class="wireframe-shell">
      <svg
        class="page-wireframe"
        viewBox="${escapeHtml(viewBox)}"
        role="img"
        aria-label="Mapa aproximado dos visuais da página ${text(page.name)}"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect class="wireframe-page" x="0" y="0" width="${width}" height="${height}" rx="8" />
        ${rectangles}
      </svg>
      <div class="wireframe-legend">
        <span>${number(visuals.length)} visuais</span>
        <span>${number(width)} × ${number(height)}</span>
      </div>
    </div>
  `;
}

function renderVisual(visual) {
  const position = visual.position;
  const x = finite(position.x, 0);
  const y = finite(position.y, 0);
  const width = Math.max(finite(position.width, 80), 1);
  const height = Math.max(finite(position.height, 40), 1);
  const className = [
    'wireframe-visual',
    visual.isHidden ? 'is-hidden' : '',
    visual.neverShown ? 'is-never-shown' : '',
  ].filter(Boolean).join(' ');
  const label = visual.title || visual.type || visual.id || 'Visual';
  const detail = [
    visual.type || 'tipo desconhecido',
    `${visual.fields?.length ?? visual.boundFields ?? 0} campos`,
    visual.isHidden ? 'oculto' : null,
    visual.neverShown ? 'nunca exibido' : null,
  ].filter(Boolean).join(' · ');
  const fontSize = Math.max(Math.min(width / 18, height / 5, 16), 8);
  const detailSize = Math.max(fontSize * 0.72, 6);

  return `
    <g class="wireframe-group">
      <title>${text(label)} — ${text(detail)}</title>
      <rect
        class="${escapeHtml(className)}"
        x="${x}"
        y="${y}"
        width="${width}"
        height="${height}"
        rx="6"
      />
      <text
        class="wireframe-label"
        x="${x + 8}"
        y="${y + Math.min(fontSize + 8, height / 2)}"
        font-size="${fontSize}"
      >${truncate(label, width, fontSize)}</text>
      <text
        class="wireframe-detail"
        x="${x + 8}"
        y="${y + Math.min((fontSize * 2) + 12, Math.max(height - 6, fontSize + 8))}"
        font-size="${detailSize}"
      >${truncate(detail, width, detailSize)}</text>
    </g>
  `;
}

function truncate(value, width, fontSize) {
  const available = Math.max(width - 16, 0);
  const approximateCharacters = Math.max(
    Math.floor(available / Math.max(fontSize * 0.58, 1)),
    1,
  );
  const normalized = String(value ?? '');

  if (normalized.length <= approximateCharacters) {
    return escapeHtml(normalized);
  }

  if (approximateCharacters <= 1) {
    return '…';
  }

  return escapeHtml(
    `${normalized.slice(0, approximateCharacters - 1)}…`,
  );
}

function validPosition(position) {
  return Boolean(
    position &&
    Number.isFinite(Number(position.x)) &&
    Number.isFinite(Number(position.y)) &&
    Number.isFinite(Number(position.width)) &&
    Number.isFinite(Number(position.height)),
  );
}

function inferExtent(visuals, axis, size) {
  const values = visuals
    .filter((visual) => validPosition(visual.position))
    .map((visual) =>
      finite(visual.position[axis], 0) + finite(visual.position[size], 0),
    );

  return values.length ? Math.max(...values) : null;
}

function positive(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function finite(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
