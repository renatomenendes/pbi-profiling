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
  return Number.isFinite(Number(value))
    ? new Intl.NumberFormat('pt-BR').format(Number(value))
    : fallback;
}

export function percent(value, digits = 0) {
  if (!Number.isFinite(Number(value))) {
    return '—';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value));
}
