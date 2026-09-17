import { escapeHtml, safeJsonForScript } from './escape.js';

export function renderLineageHtml(profile) {
  const graph = buildLineageGraph(profile);
  const title =
    profile.meta.reportName ||
    profile.meta.modelName ||
    profile.meta.projectName ||
    'Power BI';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — Lineage</title>
<style>
:root{color-scheme:light dark;font-family:Inter,Segoe UI,Arial,sans-serif;--bg:#f5f7fa;--panel:#fff;--text:#17202a;--muted:#667085;--border:#d7dde5;--accent:#2457d6;--source:#7c3aed;--table:#0f766e;--measure:#b45309;--page:#1d4ed8;--edge:#aab4c3}
@media(prefers-color-scheme:dark){:root{--bg:#0b1118;--panel:#111923;--text:#e7edf4;--muted:#98a6b7;--border:#263241;--accent:#7aa2ff;--source:#b794f4;--table:#5eead4;--measure:#fbbf24;--page:#93c5fd;--edge:#536174}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text)}header{position:sticky;top:0;z-index:5;background:var(--panel);border-bottom:1px solid var(--border);padding:14px 18px}.top{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.top h1{font-size:18px;margin:0}.muted{color:var(--muted)}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}input,select,button{font:inherit;border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:8px;padding:8px 10px}input{min-width:260px;flex:1}button{cursor:pointer}.layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;min-height:calc(100vh - 98px)}.canvas-shell{overflow:auto;padding:16px}.canvas{background:var(--panel);border:1px solid var(--border);border-radius:12px;min-width:1160px;overflow:hidden}.details{border-left:1px solid var(--border);background:var(--panel);padding:16px;overflow:auto}.details h2{font-size:16px;margin-top:0}.details pre{white-space:pre-wrap;word-break:break-word;font-size:12px}.legend{display:flex;gap:14px;font-size:12px;color:var(--muted)}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}.source{background:var(--source)}.table{background:var(--table)}.measure{background:var(--measure)}.page{background:var(--page)}svg{display:block;width:100%;height:auto}.lane{font-size:12px;fill:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.06em}.edge{stroke:var(--edge);stroke-width:1.25;opacity:.52}.edge.active{stroke:var(--accent);stroke-width:2.4;opacity:1}.node rect{fill:var(--panel);stroke:var(--border);stroke-width:1.2;rx:8}.node text{fill:var(--text);font-size:12px}.node .sub{fill:var(--muted);font-size:10px}.node[data-kind="source"] rect{stroke:var(--source)}.node[data-kind="table"] rect{stroke:var(--table)}.node[data-kind="measure"] rect{stroke:var(--measure)}.node[data-kind="page"] rect{stroke:var(--page)}.node{cursor:pointer}.node.dim{opacity:.16}.node.active rect{stroke:var(--accent);stroke-width:2.6}.empty{padding:30px;color:var(--muted)}@media(max-width:900px){.layout{grid-template-columns:1fr}.details{border-left:0;border-top:1px solid var(--border)}}
</style>
</head>
<body>
<header>
  <div class="top"><h1>${escapeHtml(title)} · lineage</h1><span class="muted">${graph.nodes.length} nós · ${graph.edges.length} ligações</span></div>
  <div class="toolbar">
    <input id="search" type="search" placeholder="Buscar fonte, tabela, medida ou página…" />
    <select id="kind"><option value="all">Todos os objetos</option><option value="source">Fontes</option><option value="table">Tabelas</option><option value="measure">Medidas</option><option value="page">Páginas</option></select>
    <button id="reset" type="button">Limpar seleção</button>
    <div class="legend"><span><i class="dot source"></i>Fonte</span><span><i class="dot table"></i>Tabela</span><span><i class="dot measure"></i>Medida</span><span><i class="dot page"></i>Página</span></div>
  </div>
</header>
<div class="layout">
  <div class="canvas-shell"><div class="canvas"><svg id="graph" role="img" aria-label="Mapa de lineage"></svg></div></div>
  <aside class="details" id="details"><h2>Lineage técnico</h2><p class="muted">Selecione um objeto para inspecionar dependências diretas. Fontes no nível de recurso não são apresentadas como colunas físicas.</p></aside>
</div>
<script id="payload" type="application/json">${safeJsonForScript(graph)}</script>
<script>
(() => {
  const graph = JSON.parse(document.getElementById('payload').textContent);
  const svg = document.getElementById('graph');
  const details = document.getElementById('details');
  const search = document.getElementById('search');
  const kind = document.getElementById('kind');
  const reset = document.getElementById('reset');
  const NS = 'http://www.w3.org/2000/svg';
  const xByKind = {source:40,table:330,measure:650,page:970};
  const widthByKind = {source:220,table:230,measure:250,page:180};
  const laneNames = {source:'Fontes',table:'Tabelas',measure:'Medidas',page:'Páginas'};
  const groups = Object.fromEntries(Object.keys(xByKind).map(k => [k, graph.nodes.filter(n => n.kind === k)]));
  const maxRows = Math.max(1, ...Object.values(groups).map(items => items.length));
  const height = Math.max(560, 70 + maxRows * 66);
  svg.setAttribute('viewBox', '0 0 1200 ' + height);
  svg.setAttribute('height', String(height));

  const positions = new Map();
  for (const [k, items] of Object.entries(groups)) {
    const lane = document.createElementNS(NS, 'text');
    lane.setAttribute('class','lane');
    lane.setAttribute('x',xByKind[k]);
    lane.setAttribute('y','28');
    lane.textContent = laneNames[k];
    svg.appendChild(lane);
    items.forEach((node, i) => positions.set(node.id, {x:xByKind[k], y:48+i*66, w:widthByKind[k], h:44}));
  }

  const edgeLayer = document.createElementNS(NS,'g');
  svg.appendChild(edgeLayer);
  graph.edges.forEach((edge, index) => {
    const a = positions.get(edge.from);
    const b = positions.get(edge.to);
    if (!a || !b) return;
    const line = document.createElementNS(NS,'path');
    const x1=a.x+a.w, y1=a.y+a.h/2, x2=b.x, y2=b.y+b.h/2, mid=(x1+x2)/2;
    line.setAttribute('d', 'M '+x1+' '+y1+' C '+mid+' '+y1+', '+mid+' '+y2+', '+x2+' '+y2);
    line.setAttribute('fill','none');
    line.setAttribute('class','edge');
    line.dataset.from=edge.from;
    line.dataset.to=edge.to;
    line.dataset.index=String(index);
    edgeLayer.appendChild(line);
  });

  const nodeLayer = document.createElementNS(NS,'g');
  svg.appendChild(nodeLayer);
  graph.nodes.forEach(node => {
    const p=positions.get(node.id);
    if(!p) return;
    const g=document.createElementNS(NS,'g');
    g.setAttribute('class','node');
    g.dataset.id=node.id;
    g.dataset.kind=node.kind;
    g.dataset.search=(node.label+' '+(node.subtitle||'')).toLowerCase();
    const rect=document.createElementNS(NS,'rect');
    rect.setAttribute('x',p.x); rect.setAttribute('y',p.y); rect.setAttribute('width',p.w); rect.setAttribute('height',p.h); g.appendChild(rect);
    const label=document.createElementNS(NS,'text');
    label.setAttribute('x',p.x+10); label.setAttribute('y',p.y+18); label.textContent=node.label.length>32?node.label.slice(0,31)+'…':node.label; g.appendChild(label);
    if(node.subtitle){const sub=document.createElementNS(NS,'text'); sub.setAttribute('class','sub'); sub.setAttribute('x',p.x+10); sub.setAttribute('y',p.y+34); sub.textContent=node.subtitle.length>36?node.subtitle.slice(0,35)+'…':node.subtitle; g.appendChild(sub);}
    g.addEventListener('click',()=>select(node.id));
    nodeLayer.appendChild(g);
  });

  function select(id){
    const node=graph.nodes.find(n=>n.id===id);
    if(!node) return;
    const neighbours=new Set([id]);
    graph.edges.forEach(e=>{if(e.from===id)neighbours.add(e.to); if(e.to===id)neighbours.add(e.from);});
    document.querySelectorAll('.node').forEach(el=>{el.classList.toggle('active',el.dataset.id===id); el.classList.toggle('dim',!neighbours.has(el.dataset.id));});
    document.querySelectorAll('.edge').forEach(el=>el.classList.toggle('active',el.dataset.from===id||el.dataset.to===id));
    const incoming=graph.edges.filter(e=>e.to===id).map(e=>graph.nodes.find(n=>n.id===e.from)?.label).filter(Boolean);
    const outgoing=graph.edges.filter(e=>e.from===id).map(e=>graph.nodes.find(n=>n.id===e.to)?.label).filter(Boolean);
    details.innerHTML='<h2>'+esc(node.label)+'</h2><p class="muted">'+esc(node.kindLabel)+(node.subtitle?' · '+esc(node.subtitle):'')+'</p>'+(node.description?'<p>'+esc(node.description)+'</p>':'')+list('Recebe de',incoming)+list('Alimenta',outgoing)+(node.expression?'<h3>DAX</h3><pre>'+esc(node.expression)+'</pre>':'');
  }
  function list(title,items){return '<h3>'+title+'</h3>'+(items.length?'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="muted">Nenhum vínculo direto.</p>');}
  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function applyFilter(){const q=search.value.trim().toLowerCase(), k=kind.value; document.querySelectorAll('.node').forEach(el=>{const visible=(!q||el.dataset.search.includes(q))&&(k==='all'||el.dataset.kind===k); el.style.display=visible?'':'none';});}
  search.addEventListener('input',applyFilter);
  kind.addEventListener('change',applyFilter);
  reset.addEventListener('click',()=>{search.value='';kind.value='all';applyFilter();document.querySelectorAll('.node').forEach(el=>el.classList.remove('active','dim'));document.querySelectorAll('.edge').forEach(el=>el.classList.remove('active'));details.innerHTML='<h2>Lineage técnico</h2><p class="muted">Selecione um objeto para inspecionar dependências diretas.</p>';});
})();
</script>
</body>
</html>`;
}

export function buildLineageGraph(profile) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();
  const edgeIds = new Set();

  const addNode = (node) => {
    if (!node?.id || nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  };

  const addEdge = (from, to, type) => {
    if (!from || !to || from === to || !nodeIds.has(from) || !nodeIds.has(to)) return;
    const id = `${from}\u0000${to}\u0000${type}`;
    if (edgeIds.has(id)) return;
    edgeIds.add(id);
    edges.push({ from, to, type });
  };

  const sourceByTable = new Map();
  const sourceResolutionByTable = new Map(
    (profile.sourceResolution?.tables ?? []).map((item) => [item.table, item]),
  );

  for (const table of profile.semanticModel.tables ?? []) {
    const descriptor = describeSourceNode(table, sourceResolutionByTable.get(table.name));
    if (!descriptor) continue;
    addNode(descriptor.node);
    sourceByTable.set(table.name, descriptor.node.id);
  }

  for (const table of profile.semanticModel.tables ?? []) {
    addNode({
      id: `table:${table.name}`,
      kind: 'table',
      kindLabel: 'Tabela',
      label: table.name,
      subtitle: `${table.columnCount ?? 0} colunas · ${table.measureCount ?? 0} medidas`,
      description: table.kind && table.kind !== 'table' ? `Tipo: ${table.kind}` : null,
    });
  }

  for (const measure of profile.semanticModel.measures ?? []) {
    addNode({
      id: `measure:${measure.table}[${measure.name}]`,
      kind: 'measure',
      kindLabel: 'Medida',
      label: measure.name,
      subtitle: measure.table,
      description: measure.description ?? null,
      expression: measure.expression ?? null,
    });
  }

  for (const page of profile.report.pages ?? []) {
    addNode({
      id: `page:${page.id}`,
      kind: 'page',
      kindLabel: 'Página',
      label: page.name,
      subtitle: page.isHidden ? 'oculta' : 'visível',
    });
  }

  for (const table of profile.semanticModel.tables ?? []) {
    addEdge(sourceByTable.get(table.name), `table:${table.name}`, 'source-table');
  }

  for (const relationship of profile.semanticModel.relationships ?? []) {
    const from = relationship.fromTable || relationship.from?.table || relationship.from?.tableName;
    const to = relationship.toTable || relationship.to?.table || relationship.to?.tableName;
    addEdge(from ? `table:${from}` : null, to ? `table:${to}` : null, 'relationship');
  }

  for (const measure of profile.semanticModel.measures ?? []) {
    const measureId = `measure:${measure.table}[${measure.name}]`;
    addEdge(`table:${measure.table}`, measureId, 'contains');

    for (const dependency of measure.dependsOn?.measures ?? []) {
      const parsed = /^(.*?)\[(.*)\]$/.exec(dependency);
      if (parsed) addEdge(`measure:${parsed[1]}[${parsed[2]}]`, measureId, 'measure-dependency');
    }

    for (const dependency of measure.dependsOn?.columns ?? []) {
      const parsed = /^(.*?)\[(.*)\]$/.exec(dependency);
      if (parsed) addEdge(`table:${parsed[1]}`, measureId, 'column-dependency');
    }
  }

  const pageById = new Set((profile.report.pages ?? []).map((page) => page.id));
  for (const visual of profile.report.visuals ?? []) {
    if (!pageById.has(visual.page)) continue;
    for (const field of visual.fields ?? []) {
      if (field.kind === 'measure' && field.table && field.name) {
        addEdge(`measure:${field.table}[${field.name}]`, `page:${visual.page}`, 'measure-page');
      } else if (field.table) {
        addEdge(`table:${field.table}`, `page:${visual.page}`, 'table-page');
      }
    }
  }

  const order = { source: 0, table: 1, measure: 2, page: 3 };
  nodes.sort((left, right) =>
    (order[left.kind] ?? 99) - (order[right.kind] ?? 99) ||
    left.label.localeCompare(right.label),
  );

  return { nodes, edges };
}

function describeSourceNode(table, resolution) {
  if (typeof table.physicalPath === 'string' && table.physicalPath.trim()) {
    const label = table.physicalPath.trim();
    return {
      node: {
        id: `source:path:${label}`,
        kind: 'source',
        kindLabel: 'Fonte física',
        label,
        subtitle: 'objeto físico endereçável',
        description: null,
      },
    };
  }

  if (typeof table.physical === 'string' && table.physical.trim()) {
    const label = table.physical.trim();
    return {
      node: {
        id: `source:value:${label}`,
        kind: 'source',
        kindLabel: 'Fonte física',
        label,
        subtitle: null,
        description: null,
      },
    };
  }

  const physical = table.physical;
  if (!physical || typeof physical !== 'object') return null;

  const system = physical.system ?? 'Fonte';
  const locator = [
    physical.server,
    physical.database,
    physical.schema,
    physical.table,
    physical.url,
    physical.path,
  ].filter(Boolean).join('|');

  if (!locator && !physical.system) return null;

  const sourceId = `source:resource:${system}:${locator || table.name}`;
  const level = resolution?.level ?? (physical.table ? 'physical-table' : 'resource');
  const scope = resolution?.scope ?? (system === 'Inline Literal' ? 'inline' : 'external');

  let subtitle = 'recurso físico';
  if (physical.table) subtitle = 'tabela física';
  else if (physical.url) subtitle = 'recurso Web';
  else if (physical.path) subtitle = 'arquivo/recurso de caminho';
  else if (scope === 'inline') subtitle = 'fonte inline do modelo';
  else if (physical.server || physical.database) subtitle = 'serviço de dados';

  const description = level === 'resource'
    ? 'A origem foi resolvida até o recurso, mas não até uma tabela/coluna física endereçável.'
    : null;

  return {
    node: {
      id: sourceId,
      kind: 'source',
      kindLabel: scope === 'inline' ? 'Fonte inline' : 'Fonte física',
      label: system,
      subtitle,
      description,
    },
  };
}
