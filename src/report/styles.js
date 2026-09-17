export const REPORT_CSS = `
:root {
  color-scheme: light dark;
  --bg: #f4f6f8;
  --surface: #ffffff;
  --surface-2: #f8fafc;
  --text: #17202a;
  --muted: #5f6b78;
  --border: #d9e0e7;
  --accent: #005a9c;
  --accent-soft: #e7f2fb;
  --success: #157347;
  --success-soft: #e8f5ed;
  --warning: #9a6700;
  --warning-soft: #fff5d8;
  --danger: #b42318;
  --danger-soft: #fdecea;
  --info: #3f5f7f;
  --info-soft: #edf3f8;
  --shadow: 0 10px 30px rgba(17, 24, 39, 0.07);
  --radius: 14px;
  --sidebar: 248px;
  --content: 1480px;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:root[data-theme="dark"] {
  --bg: #0f141a;
  --surface: #171d24;
  --surface-2: #1d2530;
  --text: #edf2f7;
  --muted: #a7b1bd;
  --border: #303a46;
  --accent: #65b5e8;
  --accent-soft: #173b55;
  --success: #6fd59a;
  --success-soft: #173c2b;
  --warning: #f0c36a;
  --warning-soft: #473918;
  --danger: #ff8b82;
  --danger-soft: #4a2421;
  --info: #a7c3df;
  --info-soft: #223447;
  --shadow: 0 12px 34px rgba(0, 0, 0, 0.3);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  line-height: 1.5;
}

button,
input {
  font: inherit;
}

a {
  color: var(--accent);
}

.app-shell {
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar);
  overflow-y: auto;
  padding: 22px 16px;
  border-right: 1px solid var(--border);
  background: var(--surface);
  z-index: 20;
}

.brand {
  display: grid;
  gap: 4px;
  margin-bottom: 22px;
  padding: 0 8px;
}

.brand strong {
  font-size: 1rem;
  letter-spacing: 0.01em;
}

.brand span {
  color: var(--muted);
  font-size: 0.78rem;
}

.nav {
  display: grid;
  gap: 4px;
}

.nav a {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 8px 10px;
  color: var(--muted);
  text-decoration: none;
  border-radius: 9px;
  font-size: 0.9rem;
}

.nav a:hover,
.nav a.is-active {
  color: var(--text);
  background: var(--accent-soft);
}

.nav-index {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font-size: 0.72rem;
  font-weight: 700;
}

.sidebar-actions {
  display: grid;
  gap: 8px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
}

.button:hover {
  border-color: var(--accent);
}

.main {
  margin-left: var(--sidebar);
  padding: 30px clamp(20px, 3vw, 54px) 80px;
}

.content {
  max-width: var(--content);
  margin: 0 auto;
}

.hero {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 44px);
  border: 1px solid var(--border);
  border-radius: 20px;
  background:
    linear-gradient(135deg, var(--accent-soft), transparent 45%),
    var(--surface);
  box-shadow: var(--shadow);
}

.eyebrow {
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0;
  max-width: 1000px;
  font-size: clamp(1.9rem, 4vw, 3.4rem);
  line-height: 1.05;
}

.hero-description {
  max-width: 960px;
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: var(--muted);
  font-size: 0.82rem;
}

.section {
  scroll-margin-top: 18px;
  margin-top: 46px;
}

.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.section-header h2 {
  margin: 0;
  font-size: clamp(1.35rem, 2.5vw, 2rem);
}

.section-header p {
  max-width: 760px;
  margin: 5px 0 0;
  color: var(--muted);
}

.grid {
  display: grid;
  gap: 14px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.card {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 4px 16px rgba(17, 24, 39, 0.035);
}

.card h3,
.card h4 {
  margin-top: 0;
}

.stat-card {
  display: grid;
  gap: 4px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.stat-label {
  color: var(--muted);
  font-size: 0.8rem;
}

.kicker {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.badge.warning {
  color: var(--warning);
  border-color: color-mix(in srgb, var(--warning) 35%, var(--border));
  background: var(--warning-soft);
}

.badge.danger {
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 35%, var(--border));
  background: var(--danger-soft);
}

.badge.success {
  color: var(--success);
  border-color: color-mix(in srgb, var(--success) 35%, var(--border));
  background: var(--success-soft);
}

.badge.info {
  color: var(--info);
  background: var(--info-soft);
}

.progress {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.progress > span {
  display: block;
  height: 100%;
  width: var(--progress, 0%);
  background: var(--accent);
  border-radius: inherit;
}

.callout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.callout-mark {
  width: 9px;
  min-height: 42px;
  border-radius: 999px;
  background: var(--info);
}

.callout.warning .callout-mark {
  background: var(--warning);
}

.callout.danger .callout-mark {
  background: var(--danger);
}

.callout.success .callout-mark {
  background: var(--success);
}

.callout h4 {
  margin: 0 0 3px;
  font-size: 0.95rem;
}

.callout p {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.findings-list {
  display: grid;
  gap: 10px;
}

.table-shell {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}

th,
td {
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--border);
}

th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--surface-2);
  color: var(--muted);
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

tr:last-child td {
  border-bottom: 0;
}

tr[data-search-row][hidden],
[data-search-card][hidden] {
  display: none !important;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.search-input {
  width: min(520px, 100%);
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
}

.search-input:focus {
  outline: 2px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-color: var(--accent);
}

.muted {
  color: var(--muted);
}

.mono {
  font-family: var(--mono);
  font-size: 0.82rem;
}

.code {
  max-height: 420px;
  overflow: auto;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-2);
  font-family: var(--mono);
  font-size: 0.78rem;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

details {
  border-top: 1px solid var(--border);
  padding-top: 10px;
  margin-top: 10px;
}

summary {
  cursor: pointer;
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 700;
}

.page-card {
  display: grid;
  gap: 16px;
}

.page-card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}

.page-card-header h3 {
  margin: 0;
}

.page-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
}

.wireframe-shell {
  display: grid;
  gap: 7px;
}

.page-wireframe {
  width: 100%;
  max-height: 520px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-2);
}

.wireframe-page {
  fill: var(--surface);
  stroke: var(--border);
  stroke-width: 2;
}

.wireframe-visual {
  fill: color-mix(in srgb, var(--accent) 10%, var(--surface));
  stroke: color-mix(in srgb, var(--accent) 55%, var(--border));
  stroke-width: 1.5;
}

.wireframe-visual.is-hidden {
  fill: color-mix(in srgb, var(--warning) 12%, var(--surface));
  stroke: var(--warning);
  stroke-dasharray: 7 5;
}

.wireframe-visual.is-never-shown {
  fill: color-mix(in srgb, var(--danger) 11%, var(--surface));
  stroke: var(--danger);
  stroke-dasharray: 4 4;
}

.wireframe-label {
  fill: var(--text);
  font-family: var(--sans);
  font-weight: 700;
  pointer-events: none;
}

.wireframe-detail {
  fill: var(--muted);
  font-family: var(--sans);
  pointer-events: none;
}

.wireframe-legend {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted);
  font-size: 0.74rem;
}

.wireframe-empty {
  display: grid;
  gap: 4px;
  min-height: 160px;
  place-content: center;
  padding: 20px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--muted);
}

.rank-list {
  display: grid;
  gap: 9px;
}

.rank-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.rank-name {
  min-width: 0;
}

.rank-name strong,
.rank-name span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-name span {
  color: var(--muted);
  font-size: 0.74rem;
}

.rank-number {
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.source-grid {
  display: grid;
  gap: 10px;
}

.source-item {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-2);
}

.source-item strong,
.source-item span {
  display: block;
}

.source-item span {
  margin-top: 3px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}

.lineage-shell {
  padding: 0;
  overflow: hidden;
}

.lineage-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

#lineage-frame {
  display: block;
  width: 100%;
  height: min(78vh, 940px);
  min-height: 600px;
  border: 0;
  background: #10161d;
}

.empty-state {
  display: grid;
  gap: 5px;
  place-items: center;
  min-height: 180px;
  padding: 24px;
  text-align: center;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.technical-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.footer {
  margin-top: 56px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.78rem;
}

.mobile-nav-button {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 30;
}

@media (max-width: 1050px) {
  .grid-4,
  .grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .mobile-nav-button {
    display: inline-flex;
  }

  .sidebar {
    transform: translateX(-102%);
    transition: transform 180ms ease;
    box-shadow: var(--shadow);
  }

  body.nav-open .sidebar {
    transform: translateX(0);
  }

  .main {
    margin-left: 0;
    padding-top: 64px;
  }

  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .main {
    padding-left: 12px;
    padding-right: 12px;
  }

  .hero {
    padding: 22px 18px;
  }

  .section-header {
    align-items: start;
    flex-direction: column;
  }

  #lineage-frame {
    min-height: 520px;
  }
}

@media print {
  .sidebar,
  .mobile-nav-button,
  .sidebar-actions,
  .search-row,
  .lineage-toolbar {
    display: none !important;
  }

  .main {
    margin: 0;
    padding: 0;
  }

  .section {
    break-inside: avoid;
  }

  .card,
  .hero {
    box-shadow: none;
  }

  #lineage-frame {
    display: none;
  }
}
`;
