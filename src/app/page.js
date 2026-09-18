export function renderAppPage() {
  return String.raw`<!doctype html>
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
      width: min(1040px, calc(100% - 32px));
      margin: 0 auto;
      padding: 44px 0 64px;
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
      max-width: 780px;
      margin: 0;
      color: #5d687b;
      font-size: 17px;
      line-height: 1.6;
    }

    .step {
      margin-top: 18px;
    }

    .step-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 12px;
      font-size: 20px;
    }

    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 999px;
      color: #fff;
      background: #2457e6;
      font-size: 14px;
      font-weight: 800;
    }

    .card {
      background: rgba(255, 255, 255, .95);
      border: 1px solid #dce2ea;
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 16px 50px rgba(29, 42, 72, .07);
    }

    .card h3 {
      margin: 0 0 8px;
    }

    .card p {
      margin: 0 0 16px;
      color: #657086;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
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
      opacity: .42;
      cursor: not-allowed;
    }

    .selection {
      min-height: 70px;
      margin-top: 14px;
      padding: 13px 14px;
      color: #667286;
      border: 1px dashed #cbd3df;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.55;
    }

    .selection strong {
      display: block;
      margin-bottom: 4px;
      color: #344158;
    }

    .selection.ready {
      color: #356246;
      background: #eff9f3;
      border-style: solid;
      border-color: #b8dfc7;
    }

    .selection.warning {
      color: #76591a;
      background: #fff8e6;
      border-style: solid;
      border-color: #ead49c;
    }

    .selection.error {
      color: #8e3832;
      background: #fff2f1;
      border-style: solid;
      border-color: #f0c1bd;
    }

    .facts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .fact {
      display: inline-flex;
      padding: 5px 9px;
      color: #4b596e;
      background: #edf2f8;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }

    .status-card {
      display: none;
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

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 25px;
      padding: 3px 9px;
      color: #42506a;
      background: #e9eef9;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }

    .pill.success {
      color: #17643a;
      background: #e4f6eb;
    }

    .pill.error {
      color: #9c2d28;
      background: #fde8e7;
    }

    .progress {
      height: 8px;
      margin: 15px 0 10px;
      overflow: hidden;
      background: #e7ebf1;
      border-radius: 999px;
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
      background: #2f8d55;
      animation: none;
    }

    .progress.error > span {
      width: 100%;
      background: #b8403a;
      animation: none;
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
      color: #606c80;
      border-bottom: 1px solid #edf0f4;
      font-size: 13px;
    }

    .notice {
      margin-top: 16px;
      padding: 14px 16px;
      color: #4d5a70;
      background: #edf2ff;
      border: 1px solid #d8e1ff;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.55;
    }

    .muted {
      color: #778196;
      font-size: 12px;
    }

    [hidden] {
      display: none !important;
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

      button.secondary,
      .button.secondary {
        color: #dce4f2;
        background: #1c2431;
        border-color: #3b4658;
      }

      .selection {
        color: #a5b0c2;
        border-color: #3b4658;
      }

      .selection strong {
        color: #dbe4f2;
      }

      .selection.ready {
        color: #a8d8b9;
        background: #15271d;
        border-color: #2f6243;
      }

      .selection.warning {
        color: #e8d296;
        background: #2b2515;
        border-color: #685824;
      }

      .selection.error {
        color: #f0aaa5;
        background: #301a1a;
        border-color: #75413e;
      }

      .fact {
        color: #c5cfdf;
        background: #202a39;
      }

      .notice {
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
      <div class="eyebrow">Power BI · PBIP Profiling</div>
      <h1>pbi-profiling</h1>
      <p>
        O artefato de profiling é PBIP. Se a origem estiver em PBIX, abra o
        arquivo no Power BI Desktop e salve oficialmente como Power BI Project
        (.pbip) antes de gerar o runbook.
      </p>
    </header>

    <section class="step">
      <h2 class="step-title">
        <span class="step-number">1</span>
        Se necessário, abra o PBIX no Desktop
      </h2>

      <div class="card">
        <h3>Origem PBIX</h3>
        <p>
          Este passo apenas abre o arquivo no Power BI Desktop. Depois use
          <strong>File &gt; Save As &gt; Power BI Project (.pbip)</strong>.
          PBIT não é a entrada do profiler.
        </p>

        <input id="pbix-file" type="file" accept=".pbix" hidden>

        <div id="pbix-selection" class="selection">
          Nenhum PBIX selecionado. Se você já possui PBIP, pule este passo.
        </div>

        <div class="actions">
          <button id="pbix-select" class="secondary" type="button">
            Selecionar PBIX
          </button>
          <button id="pbix-open" type="button" disabled>
            Abrir no Power BI Desktop
          </button>
        </div>
      </div>
    </section>

    <section class="step">
      <h2 class="step-title">
        <span class="step-number">2</span>
        Selecione e valide o PBIP
      </h2>

      <div class="card">
        <h3>Projeto PBIP</h3>
        <p>
          Selecione a pasta raiz criada pelo Power BI Desktop. O projeto só é
          liberado quando TMDL e estrutura semântica passam pela validação.
        </p>

        <input
          id="project-folder-fallback"
          type="file"
          webkitdirectory
          directory
          multiple
          hidden
        >

        <div id="project-selection" class="selection">
          Nenhum PBIP selecionado.
        </div>

        <div class="actions">
          <button id="project-select" class="secondary" type="button">
            Selecionar pasta PBIP
          </button>
          <button id="generate-runbook" type="button" disabled>
            Gerar runbook
          </button>
        </div>
      </div>
    </section>

    <section class="step">
      <h2 class="step-title">
        <span class="step-number">3</span>
        Resultado
      </h2>

      <div id="status-card" class="card status-card">
        <div class="status-line">
          <strong id="status-title">Aguardando</strong>
          <span id="status-pill" class="pill">idle</span>
        </div>

        <div id="progress" class="progress"><span></span></div>
        <p id="status-message">Nenhuma operação em andamento.</p>
        <ul id="events" class="events"></ul>

        <div id="result-actions" class="actions" hidden>
          <a id="open-runbook" class="button" target="_blank" rel="noopener">
            Abrir runbook
          </a>
          <a id="download-json" class="button secondary">profile.json</a>
          <a id="download-rag" class="button secondary">profile.rag.jsonl</a>
        </div>
      </div>
    </section>

    <div class="notice">
      O servidor escuta somente em <strong>127.0.0.1</strong>. O profiler não
      converte PBIX para PBIP e não altera o projeto selecionado. O PBIP deve ser
      salvo pelo próprio Power BI Desktop.
    </div>
  </main>

  <script>
    const token = new URLSearchParams(location.search).get('token');

    const RELEVANT_EXTENSIONS = new Set([
      '.tmdl',
      '.json',
      '.pbir',
      '.platform',
    ]);

    const SKIP_DIRECTORIES = new Set([
      '.git',
      'node_modules',
      '.vscode',
      '.idea',
      '.pbi',
      'cache',
    ]);

    const elements = {
      pbixFile: document.getElementById('pbix-file'),
      pbixSelection: document.getElementById('pbix-selection'),
      pbixSelect: document.getElementById('pbix-select'),
      pbixOpen: document.getElementById('pbix-open'),
      projectFallback: document.getElementById('project-folder-fallback'),
      projectSelection: document.getElementById('project-selection'),
      projectSelect: document.getElementById('project-select'),
      generateRunbook: document.getElementById('generate-runbook'),
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
    };

    let selectedPbix = null;
    let readyProjectId = null;
    let busy = false;
    let polling = null;

    function apiHeaders(extra) {
      return Object.assign(
        {
          'x-pbi-profiling-token': token || '',
        },
        extra || {},
      );
    }

    function setBusy(value) {
      busy = Boolean(value);
      elements.pbixSelect.disabled = busy;
      elements.pbixOpen.disabled =
        busy || !selectedPbix;
      elements.projectSelect.disabled = busy;
      elements.generateRunbook.disabled =
        busy || !readyProjectId;
    }

    function showStatus(title, message) {
      elements.statusCard.classList.add('visible');
      elements.resultActions.hidden = true;
      elements.statusTitle.textContent = title;
      elements.statusPill.textContent = 'running';
      elements.statusPill.className = 'pill';
      elements.statusMessage.textContent = message;
      elements.progress.className = 'progress';
      elements.events.replaceChildren();
    }

    function renderError(error) {
      elements.statusCard.classList.add('visible');
      elements.resultActions.hidden = true;
      elements.statusTitle.textContent = 'Falha';
      elements.statusPill.textContent = 'failed';
      elements.statusPill.className = 'pill error';
      elements.statusMessage.textContent =
        error && error.message
          ? error.message
          : String(error);
      elements.progress.className = 'progress error';
      setBusy(false);
    }

    async function readResponse(response) {
      const text = await response.text();
      let payload = {};

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          throw new Error(
            'O servidor local retornou uma resposta inválida.',
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          payload.error ||
          'Falha na solicitação local.',
        );
      }

      return payload;
    }

    function escapeHtml(value) {
      return String(
        value == null ? '' : value,
      )
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function formatBytes(bytes) {
      const value = Number(bytes || 0);

      if (value < 1024) {
        return value + ' B';
      }

      if (value < 1024 * 1024) {
        return (value / 1024).toFixed(1) + ' KB';
      }

      return (
        value / (1024 * 1024)
      ).toFixed(1) + ' MB';
    }

    function fact(label, value) {
      return (
        '<span class="fact">' +
        escapeHtml(label) +
        ': ' +
        escapeHtml(value) +
        '</span>'
      );
    }

    function normalizeBrowserPath(value) {
      return String(value || '')
        .replaceAll('\\', '/')
        .replace(/^\.\//, '')
        .replace(/^\/+/, '');
    }

    function pathParts(value) {
      return normalizeBrowserPath(value)
        .split('/')
        .filter(Boolean);
    }

    function shouldDescend(path) {
      return !pathParts(path).some(
        function(part) {
          return SKIP_DIRECTORIES.has(
            part.toLowerCase(),
          );
        },
      );
    }

    function shouldReadProjectFile(path) {
      const parts = pathParts(path);

      if (
        parts.some(
          function(part) {
            return SKIP_DIRECTORIES.has(
              part.toLowerCase(),
            );
          },
        )
      ) {
        return false;
      }

      const name =
        parts[parts.length - 1] || '';
      const dot = name.lastIndexOf('.');
      const extension =
        dot >= 0
          ? name.slice(dot).toLowerCase()
          : '';

      return RELEVANT_EXTENSIONS.has(extension);
    }

    async function readDirectoryHandle(handle) {
      const files = [];

      async function walk(directory, prefix) {
        for await (const entry of directory.values()) {
          const path =
            prefix
              ? prefix + '/' + entry.name
              : entry.name;

          if (entry.kind === 'directory') {
            if (shouldDescend(path)) {
              await walk(entry, path);
            }
            continue;
          }

          if (!shouldReadProjectFile(path)) {
            continue;
          }

          files.push({
            path: normalizeBrowserPath(path),
            file: await entry.getFile(),
          });
        }
      }

      await walk(handle, '');

      return {
        name:
          handle.name ||
          'Power BI project',
        files,
      };
    }

    function readFileList(fileList) {
      const files = [];
      let rootName = '';

      for (const file of fileList || []) {
        const raw = normalizeBrowserPath(
          file.webkitRelativePath ||
          file.name,
        );
        const parts = pathParts(raw);

        if (
          !rootName &&
          parts.length > 1
        ) {
          rootName = parts[0];
        }

        const relative =
          parts.length > 1
            ? parts.slice(1).join('/')
            : parts.join('/');

        if (!shouldReadProjectFile(relative)) {
          continue;
        }

        files.push({
          path: relative,
          file,
        });
      }

      return {
        name:
          rootName ||
          'Power BI project',
        files,
      };
    }

    function promptForDirectoryFallback() {
      return new Promise(
        function(resolve) {
          const input =
            elements.projectFallback;
          input.value = '';

          function onChange() {
            input.removeEventListener(
              'change',
              onChange,
            );

            if (
              !input.files ||
              input.files.length === 0
            ) {
              resolve(null);
              return;
            }

            resolve(
              readFileList(input.files),
            );
          }

          input.addEventListener(
            'change',
            onChange,
            {
              once: true,
            },
          );
          input.click();
        },
      );
    }

    async function pickProjectFolder() {
      if (
        typeof window.showDirectoryPicker ===
        'function'
      ) {
        try {
          const handle =
            await window.showDirectoryPicker({
              id: 'pbi-profiling-pbip',
              mode: 'read',
            });

          return await readDirectoryHandle(handle);
        } catch (error) {
          if (
            error &&
            error.name === 'AbortError'
          ) {
            return null;
          }

          if (
            error &&
            error.name === 'SecurityError'
          ) {
            return await promptForDirectoryFallback();
          }

          throw error;
        }
      }

      return await promptForDirectoryFallback();
    }

    async function uploadProjectFiles(
      projectId,
      files,
    ) {
      let next = 0;
      let completed = 0;
      const workers =
        Math.min(4, files.length);

      async function worker() {
        while (true) {
          const index = next;
          next += 1;

          if (index >= files.length) {
            return;
          }

          const item = files[index];

          const response = await fetch(
            '/api/projects/' +
              encodeURIComponent(projectId) +
              '/files?path=' +
              encodeURIComponent(item.path),
            {
              method: 'PUT',
              headers: apiHeaders({
                'content-type':
                  'application/octet-stream',
              }),
              body: item.file,
            },
          );

          await readResponse(response);
          completed += 1;

          elements.projectSelection.innerHTML =
            '<strong>Preparando PBIP</strong>' +
            'Enviando arquivos relevantes: ' +
            completed +
            ' / ' +
            files.length;
        }
      }

      await Promise.all(
        Array.from(
          {
            length: workers,
          },
          () => worker(),
        ),
      );
    }

    async function openSelectedPbix() {
      if (!selectedPbix || busy) {
        return;
      }

      setBusy(true);
      showStatus(
        'Abrindo PBIX',
        'Copiando o PBIX para o workspace local e abrindo no Power BI Desktop.',
      );

      try {
        const response = await fetch(
          '/api/pbix/open',
          {
            method: 'POST',
            headers: apiHeaders({
              'content-type':
                'application/octet-stream',
              'x-file-name':
                encodeURIComponent(
                  selectedPbix.name,
                ),
            }),
            body: selectedPbix,
          },
        );

        const payload =
          await readResponse(response);

        elements.pbixSelection.className =
          'selection ready';
        elements.pbixSelection.innerHTML =
          '<strong>PBIX aberto no Power BI Desktop</strong>' +
          escapeHtml(selectedPbix.name) +
          '<br>Agora use File &gt; Save As &gt; Power BI Project (.pbip). ' +
          'Depois selecione a pasta PBIP no passo 2.';

        elements.statusTitle.textContent =
          'PBIX aberto';
        elements.statusPill.textContent =
          'ready';
        elements.statusPill.className =
          'pill success';
        elements.statusMessage.textContent =
          payload.message;
        elements.progress.className =
          'progress done';
        setBusy(false);
      } catch (error) {
        renderError(error);
      }
    }

    async function selectProjectFolder() {
      if (busy) {
        return;
      }

      try {
        const selection =
          await pickProjectFolder();

        if (!selection) {
          return;
        }

        if (selection.files.length === 0) {
          throw new Error(
            'A pasta selecionada não contém arquivos PBIP/TMDL/PBIR relevantes.',
          );
        }

        readyProjectId = null;
        elements.resultActions.hidden = true;
        setBusy(true);

        elements.projectSelection.className =
          'selection warning';
        elements.projectSelection.innerHTML =
          '<strong>Validando PBIP</strong>' +
          escapeHtml(selection.name) +
          '<br>' +
          selection.files.length +
          ' arquivos relevantes encontrados.';

        const create = await fetch(
          '/api/projects',
          {
            method: 'POST',
            headers: apiHeaders({
              'content-type':
                'application/json',
            }),
            body: JSON.stringify({
              name: selection.name,
            }),
          },
        );

        const created =
          await readResponse(create);

        await uploadProjectFiles(
          created.projectId,
          selection.files,
        );

        const validate = await fetch(
          '/api/projects/' +
            encodeURIComponent(
              created.projectId,
            ) +
            '/validate',
          {
            method: 'POST',
            headers: apiHeaders(),
          },
        );

        const validation =
          await readResponse(validate);

        readyProjectId =
          created.projectId;

        elements.projectSelection.className =
          'selection ready';
        elements.projectSelection.innerHTML =
          '<strong>PBIP validado e pronto para profiling</strong>' +
          escapeHtml(selection.name) +
          '<div class="facts">' +
          fact('TMDL', validation.tmdlFiles) +
          fact('Tabelas', validation.tables) +
          fact('Colunas', validation.columns) +
          fact('Medidas', validation.measures) +
          fact('Páginas', validation.pages) +
          fact('Visuais', validation.visuals) +
          '</div>';

        setBusy(false);
      } catch (error) {
        readyProjectId = null;
        elements.projectSelection.className =
          'selection error';
        elements.projectSelection.innerHTML =
          '<strong>PBIP inválido</strong>' +
          escapeHtml(
            error && error.message
              ? error.message
              : String(error),
          );
        setBusy(false);
      }
    }

    async function generateRunbook() {
      if (!readyProjectId || busy) {
        return;
      }

      setBusy(true);
      showStatus(
        'Gerando runbook',
        'Executando profiling sobre o PBIP validado.',
      );

      try {
        const response = await fetch(
          '/api/projects/' +
            encodeURIComponent(
              readyProjectId,
            ) +
            '/profile',
          {
            method: 'POST',
            headers: apiHeaders(),
          },
        );

        const payload =
          await readResponse(response);

        pollJob(payload.jobId);
      } catch (error) {
        renderError(error);
      }
    }

    function pollJob(jobId) {
      if (polling) {
        clearInterval(polling);
      }

      async function refresh() {
        try {
          const response = await fetch(
            '/api/jobs/' +
              encodeURIComponent(jobId),
            {
              headers: apiHeaders(),
            },
          );

          const job =
            await readResponse(response);

          elements.statusMessage.textContent =
            job.message || 'Processando.';
          elements.statusPill.textContent =
            job.status;

          elements.events.replaceChildren(
            ...(job.events || [])
              .slice(-12)
              .map(function(event) {
                const item =
                  document.createElement('li');
                item.textContent =
                  event.message;
                return item;
              }),
          );

          if (job.status === 'failed') {
            clearInterval(polling);
            polling = null;
            renderError(
              new Error(job.message),
            );
            return;
          }

          if (job.status !== 'completed') {
            return;
          }

          clearInterval(polling);
          polling = null;

          elements.statusTitle.textContent =
            'Runbook gerado';
          elements.statusPill.textContent =
            'completed';
          elements.statusPill.className =
            'pill success';
          elements.progress.className =
            'progress done';

          const base =
            '/api/jobs/' +
            encodeURIComponent(job.id);
          const suffix =
            '?token=' +
            encodeURIComponent(token || '');

          elements.openRunbook.href =
            base + '/runbook' + suffix;
          elements.downloadJson.href =
            base + '/profile' + suffix;
          elements.downloadRag.href =
            base + '/rag' + suffix;
          elements.resultActions.hidden = false;

          setBusy(false);
        } catch (error) {
          clearInterval(polling);
          polling = null;
          renderError(error);
        }
      }

      refresh();
      polling =
        setInterval(
          refresh,
          1000,
        );
    }

    elements.pbixSelect.addEventListener(
      'click',
      function() {
        if (busy) {
          return;
        }

        elements.pbixFile.value = '';
        elements.pbixFile.click();
      },
    );

    elements.pbixFile.addEventListener(
      'change',
      function() {
        selectedPbix =
          elements.pbixFile.files?.[0] ||
          null;

        if (!selectedPbix) {
          elements.pbixSelection.className =
            'selection';
          elements.pbixSelection.textContent =
            'Nenhum PBIX selecionado. Se você já possui PBIP, pule este passo.';
          setBusy(false);
          return;
        }

        elements.pbixSelection.className =
          'selection ready';
        elements.pbixSelection.innerHTML =
          '<strong>PBIX selecionado</strong>' +
          escapeHtml(selectedPbix.name) +
          '<br>' +
          formatBytes(selectedPbix.size);

        setBusy(false);
      },
    );

    elements.pbixOpen.addEventListener(
      'click',
      openSelectedPbix,
    );

    elements.projectSelect.addEventListener(
      'click',
      selectProjectFolder,
    );

    elements.generateRunbook.addEventListener(
      'click',
      generateRunbook,
    );

    setBusy(false);
  </script>
</body>
</html>`;
}
