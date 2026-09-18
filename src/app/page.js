export function renderAppPage() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>pbi-profiling</title>
  <style>
    :root {
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #172033;
      background: #f3f5f8;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 15% 0%, rgba(43, 105, 255, .12), transparent 34rem),
        #f3f5f8;
    }

    main {
      width: min(1080px, calc(100% - 32px));
      margin: 0 auto;
      padding: 46px 0 64px;
    }

    .hero {
      margin-bottom: 24px;
    }

    .eyebrow {
      color: #526078;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 8px 0 10px;
      font-size: clamp(34px, 5vw, 58px);
      line-height: .98;
      letter-spacing: -.04em;
    }

    .hero p {
      max-width: 760px;
      margin: 0;
      color: #5d687b;
      font-size: 17px;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .card {
      background: rgba(255, 255, 255, .94);
      border: 1px solid #dce2ea;
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 16px 50px rgba(29, 42, 72, .07);
    }

    .card h2 {
      margin: 0 0 8px;
      font-size: 20px;
    }

    .card p {
      margin: 0 0 18px;
      color: #657086;
      line-height: 1.5;
    }

    label {
      display: block;
      margin-bottom: 7px;
      color: #3d485d;
      font-size: 13px;
      font-weight: 700;
    }

    input[type="text"],
    input[type="number"],
    input[type="file"] {
      width: 100%;
      min-height: 44px;
      padding: 10px 12px;
      color: inherit;
      background: #fff;
      border: 1px solid #cfd6e1;
      border-radius: 10px;
      font: inherit;
    }

    .field {
      margin-top: 14px;
    }

    .inline {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .inline input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }

    button,
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 9px 15px;
      color: #fff;
      background: #2457e6;
      border: 1px solid #2457e6;
      border-radius: 10px;
      font: inherit;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }

    button.secondary,
    .button.secondary {
      color: #27354d;
      background: #fff;
      border-color: #ccd4df;
    }

    button:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }

    .status {
      margin-top: 16px;
    }

    .status-card {
      display: none;
      margin-top: 16px;
    }

    .status-card.visible {
      display: block;
    }

    .status-line {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }

    .status-line strong {
      font-size: 18px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 25px;
      padding: 3px 9px;
      border-radius: 99px;
      background: #e9eef9;
      color: #42506a;
      font-size: 12px;
      font-weight: 700;
    }

    .pill.success {
      background: #e4f6eb;
      color: #17643a;
    }

    .pill.error {
      background: #fde8e7;
      color: #9c2d28;
    }

    .progress {
      height: 8px;
      margin: 15px 0 10px;
      overflow: hidden;
      background: #e7ebf1;
      border-radius: 99px;
    }

    .progress > span {
      display: block;
      width: 22%;
      height: 100%;
      background: #2457e6;
      border-radius: inherit;
      animation: move 1.3s ease-in-out infinite alternate;
    }

    .progress.done > span {
      width: 100%;
      animation: none;
      background: #2f8d55;
    }

    .progress.error > span {
      width: 100%;
      animation: none;
      background: #b8403a;
    }

    @keyframes move {
      from { transform: translateX(-40%); }
      to { transform: translateX(360%); }
    }

    .events {
      max-height: 220px;
      margin-top: 12px;
      padding: 0;
      overflow: auto;
      list-style: none;
    }

    .events li {
      padding: 8px 0;
      border-bottom: 1px solid #edf0f4;
      color: #606c80;
      font-size: 13px;
    }

    .privacy {
      margin-top: 16px;
      padding: 14px 16px;
      color: #4d5a70;
      background: #edf2ff;
      border: 1px solid #d8e1ff;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
    }

    .muted {
      color: #778196;
      font-size: 12px;
    }

    @media (max-width: 780px) {
      .grid { grid-template-columns: 1fr; }
      main { width: min(100% - 20px, 1080px); padding-top: 26px; }
    }

    @media (prefers-color-scheme: dark) {
      :root {
        color: #edf2fb;
        background: #10141d;
      }

      body {
        background:
          radial-gradient(circle at 15% 0%, rgba(68, 113, 255, .17), transparent 34rem),
          #10141d;
      }

      .card {
        background: rgba(23, 29, 40, .96);
        border-color: #303a4b;
        box-shadow: none;
      }

      .hero p,
      .card p,
      .events li,
      .muted {
        color: #9da9bc;
      }

      .eyebrow,
      label {
        color: #b5c0d2;
      }

      input[type="text"],
      input[type="number"],
      input[type="file"] {
        color: #edf2fb;
        background: #111722;
        border-color: #3a465a;
      }

      button.secondary,
      .button.secondary {
        color: #dce4f2;
        background: #1c2431;
        border-color: #3b4658;
      }

      .privacy {
        color: #b9c7df;
        background: #18223a;
        border-color: #283959;
      }

      .events li {
        border-color: #293241;
      }
    }
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <div class="eyebrow">Power BI · Universal Intake</div>
      <h1>pbi-profiling</h1>
      <p>
        Selecione um PBIX ou informe um projeto PBIP existente. O processamento
        ocorre localmente, gera um runbook autocontido e não envia o arquivo
        para serviços externos.
      </p>
    </header>

    <div class="grid">
      <section class="card">
        <h2>PBIX</h2>
        <p>
          Para arquivos PBIX atuais. O relatório é extraído localmente e o
          modelo é serializado pelo TOM do Power BI Desktop já instalado.
        </p>

        <div class="field">
          <label for="pbix-file">Arquivo PBIX</label>
          <input id="pbix-file" type="file" accept=".pbix">
        </div>

        <div class="field inline">
          <input id="pbix-keep" type="checkbox">
          <label for="pbix-keep" style="margin:0">Manter PBIP temporário para inspeção</label>
        </div>

        <div class="field">
          <label for="pbix-timeout">Timeout do Desktop (segundos)</label>
          <input id="pbix-timeout" type="number" min="30" max="1800" value="300">
        </div>

        <div class="actions">
          <button id="pbix-run" type="button">Gerar runbook</button>
        </div>
      </section>

      <section class="card">
        <h2>PBIP / SemanticModel</h2>
        <p>
          Para projetos já descompactados. Aceita a pasta do projeto, um
          arquivo .pbip ou uma pasta .SemanticModel/.Report.
        </p>

        <div class="field">
          <label for="project-path">Caminho local</label>
          <input
            id="project-path"
            type="text"
            autocomplete="off"
            placeholder="C:\projetos\MeuPainel"
          >
        </div>

        <div class="actions">
          <button id="path-run" type="button">Analisar projeto</button>
        </div>

        <p class="muted" style="margin-top:16px">
          O navegador não recebe permissão para enumerar seu disco. Por isso,
          projetos em pasta são informados por caminho; PBIX usa o seletor de
          arquivo e upload apenas para localhost.
        </p>
      </section>
    </div>

    <div class="privacy">
      O servidor escuta somente em <strong>127.0.0.1</strong>. PBIX enviados
      pela tela são gravados em diretório temporário local e removidos quando
      o aplicativo encerra. Nenhuma CDN, telemetria ou chamada de rede é usada
      pelo frontend.
    </div>

    <section id="status-card" class="card status-card">
      <div class="status-line">
        <strong id="status-title">Preparando</strong>
        <span id="status-pill" class="pill">queued</span>
      </div>
      <div id="progress" class="progress"><span></span></div>
      <p id="status-message">Aguardando início.</p>
      <ul id="events" class="events"></ul>
      <div id="result-actions" class="actions" hidden>
        <a id="open-runbook" class="button" target="_blank" rel="noopener">Abrir runbook</a>
        <a id="download-json" class="button secondary">profile.json</a>
        <a id="download-rag" class="button secondary">profile.rag.jsonl</a>
      </div>
      <p id="workspace-note" class="muted" hidden></p>
    </section>
  </main>

  <script>
    const token = new URLSearchParams(location.search).get('token');

    const elements = {
      statusCard: document.getElementById('status-card'),
      statusTitle: document.getElementById('status-title'),
      statusPill: document.getElementById('status-pill'),
      statusMessage: document.getElementById('status-message'),
      progress: document.getElementById('progress'),
      events: document.getElementById('events'),
      resultActions: document.getElementById('result-actions'),
      openRunbook: document.getElementById('open-runbook'),
      downloadJson: document.getElementById('download-json'),
      downloadRag: document.getElementById('download-rag'),
      workspaceNote: document.getElementById('workspace-note'),
      pbixRun: document.getElementById('pbix-run'),
      pathRun: document.getElementById('path-run'),
    };

    let polling = null;

    function apiHeaders(extra = {}) {
      return {
        'x-pbi-profiling-token': token || '',
        ...extra,
      };
    }

    function setBusy(busy) {
      elements.pbixRun.disabled = busy;
      elements.pathRun.disabled = busy;
    }

    function showStatus() {
      elements.statusCard.classList.add('visible');
      elements.resultActions.hidden = true;
      elements.workspaceNote.hidden = true;
      elements.progress.className = 'progress';
      elements.events.replaceChildren();
    }

    async function startPbix() {
      const fileInput = document.getElementById('pbix-file');
      const file = fileInput.files?.[0];

      if (!file) {
        alert('Selecione um arquivo .pbix.');
        return;
      }

      const keepWorkspace = document.getElementById('pbix-keep').checked;
      const timeout = Number(document.getElementById('pbix-timeout').value || 300);

      setBusy(true);
      showStatus();
      elements.statusTitle.textContent = 'Enviando PBIX';
      elements.statusMessage.textContent = 'Copiando o arquivo somente para o servidor local.';

      try {
        const response = await fetch(
          '/api/jobs/pbix?keepWorkspace=' + (keepWorkspace ? '1' : '0') +
            '&timeout=' + encodeURIComponent(timeout),
          {
            method: 'POST',
            headers: apiHeaders({
              'content-type': 'application/octet-stream',
              'x-file-name': encodeURIComponent(file.name),
            }),
            body: file,
          },
        );

        const payload = await readResponse(response);
        pollJob(payload.jobId);
      } catch (error) {
        renderClientError(error);
      }
    }

    async function startPath() {
      const path = document.getElementById('project-path').value.trim();

      if (!path) {
        alert('Informe o caminho do projeto PBIP.');
        return;
      }

      setBusy(true);
      showStatus();

      try {
        const response = await fetch('/api/jobs/path', {
          method: 'POST',
          headers: apiHeaders({
            'content-type': 'application/json',
          }),
          body: JSON.stringify({ path }),
        });

        const payload = await readResponse(response);
        pollJob(payload.jobId);
      } catch (error) {
        renderClientError(error);
      }
    }

    async function readResponse(response) {
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha na solicitação.');
      }
      return payload;
    }

    function pollJob(jobId) {
      if (polling) {
        clearInterval(polling);
      }

      const refresh = async () => {
        try {
          const response = await fetch('/api/jobs/' + encodeURIComponent(jobId), {
            headers: apiHeaders(),
          });
          const job = await readResponse(response);
          renderJob(job);

          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(polling);
            polling = null;
            setBusy(false);
          }
        } catch (error) {
          clearInterval(polling);
          polling = null;
          renderClientError(error);
          setBusy(false);
        }
      };

      refresh();
      polling = setInterval(refresh, 1000);
    }

    function renderJob(job) {
      elements.statusTitle.textContent =
        job.status === 'completed'
          ? 'Runbook gerado'
          : job.status === 'failed'
            ? 'Falha no processamento'
            : 'Processando';

      elements.statusPill.textContent = job.status;
      elements.statusPill.className =
        'pill' +
        (job.status === 'completed'
          ? ' success'
          : job.status === 'failed'
            ? ' error'
            : '');

      elements.statusMessage.textContent =
        job.message || 'Processando.';

      elements.progress.className =
        'progress' +
        (job.status === 'completed'
          ? ' done'
          : job.status === 'failed'
            ? ' error'
            : '');

      elements.events.replaceChildren(
        ...(job.events || []).slice(-12).map((event) => {
          const item = document.createElement('li');
          item.textContent = event.message;
          return item;
        }),
      );

      if (job.status === 'completed') {
        const base = '/api/jobs/' + encodeURIComponent(job.id);
        const suffix = '?token=' + encodeURIComponent(token || '');

        elements.openRunbook.href = base + '/runbook' + suffix;
        elements.downloadJson.href = base + '/profile' + suffix;
        elements.downloadRag.href = base + '/rag' + suffix;
        elements.resultActions.hidden = false;

        if (job.workspacePath) {
          elements.workspaceNote.textContent =
            'PBIP temporário preservado em: ' + job.workspacePath;
          elements.workspaceNote.hidden = false;
        }
      }
    }

    function renderClientError(error) {
      showStatus();
      elements.statusTitle.textContent = 'Falha';
      elements.statusPill.textContent = 'failed';
      elements.statusPill.className = 'pill error';
      elements.statusMessage.textContent = error.message || String(error);
      elements.progress.className = 'progress error';
      setBusy(false);
    }

    elements.pbixRun.addEventListener('click', startPbix);
    elements.pathRun.addEventListener('click', startPath);
  </script>
</body>
</html>`;
}
