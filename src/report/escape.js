export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function safeJsonForScript(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

export function text(value, fallback = '—') {
  const normalized = String(value ?? '').trim();
  return escapeHtml(normalized || fallback);
}

export function number(value, fallback = '—') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat('pt-BR').format(numeric)
    : fallback;
}

export function percent(value, digits = 0) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(numeric);
}
