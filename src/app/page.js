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
      width: min(1080px, calc(100% - 32px));
      margin: 0 auto;
      padding: 46px 0 64px;
    }

    .hero { margin-bottom: 24px; }

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
    input[type="number"] {
      width: 100%;
      min-height: 44px;
      padding: 10px 12px;
      color: inherit;
      background: #fff;
      border: 1px solid #cfd6e1;
      border-radius: 10px;
      font: inherit;
    }

    .field { margin-top: 14px; }

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
      opacity: .45;
      cursor: not-allowed;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }

    .selection {
      min-height: 68px;
      margin-top: 16px;
      padding: 12px 14px;
      border: 1px dashed #cbd3df;
      border-radius: 12px;
      color: #667286;
      font-size: 13px;
      line-height: 1.5;
    }

    .selection strong {
      display: block;
      margin-bottom: 3px;
      color: #344158;
    }

    .selection.ready {
      border-style: solid;
      border-color: #b8dfc7;
      background: #eff9f3;
      color: #356246;
    }

    .selection.error {
      border-style: solid;
      border-color: #f0c1bd;
      background: #fff2f1;
      color: #8e3832;
    }

    details.advanced {
      margin-top: 16px;
    }

    details.advanced summary {
      cursor: pointer;
      color: #56637a;
      font-size: 13px;
      font-weight: 700;
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

    .status-card {
      display: none;
      margin-top: 16px;
    }

    .status-card.visible { display: block; }

    .status-line {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }

    .status-line strong { font-size: 18px; }

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

    .muted {
      color: #778196;
      font-size: 12px;
    }

    @media (max-width: 780px) {
      .grid { grid-template-columns: 1fr; }
      main {
        width: min(100% - 20px, 1080px);
        padding-top: 26px;
      }
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
      label,
      details.advanced summary {
        color: #b5c0d2;
      }

      input[type="text"],
      input[type="number"] {
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

      .selection {
        color: #a5b0c2;
        border-color: #3b4658;
      }

      .selection strong { color: #dbe4f2; }

      .selection.ready {
        color: #a8d8b9;
        background: #15271d;
        border-color: #2f6243;
      }

      .selection.error {
        color: #f0aaa5;
        background: #301a1a;
        border-color: #75413e;
      }

      .events li { border-color: #293241; }
    }
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <div class="eyebrow">Power BI · Universal Intake</div>
      <h1>pbi-profiling</h1>
      <p>
        Escolha um PBIX ou uma pasta PBIP. A seleção ocorre no navegador,
        o processamento permanece local e o mesmo pipeline produz runbook,
        perfil estruturado e chunks RAG.
      </p>
    </header>

    <div class="grid">
      <section class="card">
        <h2>PBIX</h2>
        <p>
          Para arquivos Power BI Desktop. O arquivo é copiado por streaming
          somente para o workspace local, aberto pelo Desktop e serializado
          para TMDL pelo TOM já instalado.
        </p>

        <input id="pbix-file" type="file" accept=".pbix" hidden>

        <div id="pbix-selection" class="selection">
          Nenhum PBIX selecionado.
        </div>

        <div class="actions">
          <button id="pbix-select" class="secondary" type="button">
            Selecionar PBIX
          </button>
        </div>

        <div class="field">
          <label for="pbix-timeout">Timeout do Desktop (segundos)</label>
          <input
            id="pbix-timeout"
            type="number"
            min="30"
            max="1800"
            value="300"
          >
        </div>

        <div class="actions">
          <button id="pbix-run" type="button" disabled>
            Gerar runbook
          </button>
        </div>
      </section>

      <section class="card">
        <h2>PBIP / SemanticModel</h2>
        <p>
          Selecione a pasta do projeto. O navegador lê somente TMDL, PBIR,
          JSON e .platform relevantes; caches, .pbi, imagens e diretórios
          de desenvolvimento são ignorados.
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
          Nenhum projeto selecionado.
        </div>

        <div class="actions">
          <button id="project-select" class="secondary" type="button">
            Selecionar pasta do projeto
          </button>
          <button id="project-run" type="button" disabled>
            Gerar runbook
          </button>
        </div>

        <details class="advanced">
          <summary>Modo avançado: analisar um caminho local</summary>

          <div class="field">
            <label for="manual-path">Caminho local</label>
            <input
              id="manual-path"
              type="text"
              autocomplete="off"
              placeholder="C:\projetos\MeuPainel"
            >
          </div>

          <div class="actions">
            <button id="manual-run" class="secondary" type="button">
              Analisar caminho
            </button>
          </div>
        </details>
      </section>
    </div>

    <div class="privacy">
      O servidor escuta somente em <strong>127.0.0.1</strong>. A UI não usa
      PowerShell para escolher arquivos, não usa CDN e não envia artefatos para
      serviços externos. PowerShell permanece restrito ao adapter PBIX/TOM.
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
        <a id="open-runbook" class="button" target="_blank" rel="noopener">
          Abrir runbook
        </a>
        <a id="download-json" class="button secondary">profile.json</a>
        <a id="download-rag" class="button secondary">profile.rag.jsonl</a>
        <button id="export-pbip" class="button secondary" type="button" hidden>
          Salvar PBIP convertido
        </button>
      </div>
      <p id="workspace-note" class="muted" hidden></p>
    </section>
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
      pbixRun: document.getElementById('pbix-run'),
      projectFolderFallback: document.getElementById('project-folder-fallback'),
      projectSelection: document.getElementById('project-selection'),
      projectSelect: document.getElementById('project-select'),
      projectRun: document.getElementById('project-run'),
      manualPath: document.getElementById('manual-path'),
      manualRun: document.getElementById('manual-run'),
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
      exportPbip: document.getElementById('export-pbip'),
      workspaceNote: document.getElementById('workspace-note'),
    };

    let selectedPbix = null;
    let selectedProject = null;
    let polling = null;
    let busy = false;

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
      elements.projectSelect.disabled = busy;
      elements.manualRun.disabled = busy;
      elements.pbixRun.disabled = busy || !selectedPbix;
      elements.projectRun.disabled = busy || !selectedProject;
      elements.exportPbip.disabled = busy;
    }

    function showStatus(title, message) {
      elements.statusCard.classList.add('visible');
      elements.resultActions.hidden = true;
      elements.exportPbip.hidden = true;
      elements.exportPbip.dataset.jobId = '';
      elements.workspaceNote.hidden = true;
      elements.statusTitle.textContent = title || 'Processando';
      elements.statusPill.textContent = 'running';
      elements.statusPill.className = 'pill';
      elements.statusMessage.textContent = message || 'Processando.';
      elements.progress.className = 'progress';
      elements.events.replaceChildren();
    }

    function renderClientError(error) {
      elements.statusCard.classList.add('visible');
      elements.resultActions.hidden = true;
      elements.workspaceNote.hidden = true;
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

    function formatBytes(bytes) {
      const value = Number(bytes || 0);
      if (value < 1024) return value + ' B';
      if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
      if (value < 1024 * 1024 * 1024) {
        return (value / (1024 * 1024)).toFixed(1) + ' MB';
      }
      return (value / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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
          return SKIP_DIRECTORIES.has(part.toLowerCase());
        },
      );
    }

    function shouldReadProjectFile(path) {
      const normalized = normalizeBrowserPath(path);
      const parts = pathParts(normalized);

      if (
        parts.some(
          function(part) {
            return SKIP_DIRECTORIES.has(part.toLowerCase());
          },
        )
      ) {
        return false;
      }

      const name = parts[parts.length - 1] || '';
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
        name: handle.name || 'Power BI project',
        files: files,
      };
    }

    function readFileList(fileList) {
      const files = [];
      let rootName = '';

      for (const file of fileList || []) {
        const raw = normalizeBrowserPath(
          file.webkitRelativePath || file.name,
        );
        const parts = pathParts(raw);

        if (!rootName && parts.length > 1) {
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
          file: file,
        });
      }

      return {
        name: rootName || 'Power BI project',
        files: files,
      };
    }

    function promptForDirectoryFallback() {
      return new Promise(
        function(resolve) {
          const input = elements.projectFolderFallback;
          input.value = '';

          let settled = false;

          function finish(value) {
            if (settled) return;
            settled = true;
            input.removeEventListener('change', onChange);
            input.removeEventListener('cancel', onCancel);
            resolve(value);
          }

          function onChange() {
            if (!input.files || input.files.length === 0) {
              finish(null);
              return;
            }
            finish(readFileList(input.files));
          }

          function onCancel() {
            finish(null);
          }

          input.addEventListener('change', onChange);
          input.addEventListener('cancel', onCancel);

          window.addEventListener(
            'focus',
            function() {
              setTimeout(
                function() {
                  if (
                    !settled &&
                    (!input.files || input.files.length === 0)
                  ) {
                    finish(null);
                  }
                },
                500,
              );
            },
            { once: true },
          );

          input.click();
        },
      );
    }

    async function pickProjectFolder() {
      if (
        typeof window.showDirectoryPicker === 'function'
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
          throw error;
        }
      }

      return await promptForDirectoryFallback();
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

    async function uploadProjectFiles(projectId, files) {
      let next = 0;
      let completed = 0;
      const workers = Math.min(4, files.length);

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
            '<strong>Preparando projeto</strong>' +
            'Enviando arquivos relevantes: ' +
            completed +
            ' / ' +
            files.length;
        }
      }

      const running = [];
      for (let index = 0; index < workers; index += 1) {
        running.push(worker());
      }

      await Promise.all(running);
    }

    async function stageSelectedProject(selection) {
      if (
        !selection ||
        !selection.files ||
        selection.files.length === 0
      ) {
        throw new Error(
          'A pasta selecionada não contém artefatos PBIP/TMDL/PBIR relevantes.',
        );
      }

      elements.projectSelection.className = 'selection';
      elements.projectSelection.innerHTML =
        '<strong>Preparando projeto</strong>' +
        selection.files.length +
        ' arquivos relevantes encontrados.';

      const create = await fetch(
        '/api/projects',
        {
          method: 'POST',
          headers: apiHeaders({
            'content-type': 'application/json',
          }),
          body: JSON.stringify({
            name: selection.name,
          }),
        },
      );

      const created = await readResponse(create);

      await uploadProjectFiles(
        created.projectId,
        selection.files,
      );

      const validationResponse = await fetch(
        '/api/projects/' +
          encodeURIComponent(created.projectId) +
          '/validate',
        {
          method: 'POST',
          headers: apiHeaders(),
        },
      );

      const validation =
        await readResponse(validationResponse);

      selectedProject = {
        id: created.projectId,
        name: selection.name,
        validation: validation,
      };

      const model =
        validation.modelName || 'modelo detectado';
      const report =
        validation.reportName || 'sem relatório PBIR';
      const note =
        validation.note
          ? '<br><span class="muted">' +
            escapeHtml(validation.note) +
            '</span>'
          : '';

      elements.projectSelection.className =
        'selection ready';
      elements.projectSelection.innerHTML =
        '<strong>Projeto pronto para análise</strong>' +
        escapeHtml(selection.name) +
        '<br>Modelo: ' +
        escapeHtml(model) +
        '<br>Relatório: ' +
        escapeHtml(report) +
        '<br>' +
        validation.fileCount +
        ' arquivos · ' +
        formatBytes(validation.totalBytes) +
        note;

      setBusy(false);
    }

    function escapeHtml(value) {
      return String(value == null ? '' : value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    async function selectProject() {
      if (busy) return;

      try {
        const selection = await pickProjectFolder();
        if (!selection) {
          return;
        }

        selectedProject = null;
        setBusy(true);
        await stageSelectedProject(selection);
      } catch (error) {
        selectedProject = null;
        elements.projectSelection.className =
          'selection error';
        elements.projectSelection.innerHTML =
          '<strong>Projeto não pôde ser preparado</strong>' +
          escapeHtml(
            error && error.message
              ? error.message
              : String(error),
          );
        setBusy(false);
      }
    }

    function selectPbix() {
      if (busy) return;
      elements.pbixFile.value = '';
      elements.pbixFile.click();
    }

    function onPbixChanged() {
      const file =
        elements.pbixFile.files &&
        elements.pbixFile.files[0];

      selectedPbix = file || null;

      if (!selectedPbix) {
        elements.pbixSelection.className =
          'selection';
        elements.pbixSelection.textContent =
          'Nenhum PBIX selecionado.';
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
    }

    async function startPbix() {
      if (!selectedPbix || busy) {
        return;
      }

      const timeout = Number(
        document.getElementById('pbix-timeout').value ||
        300,
      );

      setBusy(true);
      showStatus(
        'Preparando PBIX',
        'Copiando o PBIX por streaming para o workspace local.',
      );

      try {
        const response = await fetch(
          '/api/jobs/pbix?keepWorkspace=1&timeout=' +
            encodeURIComponent(timeout),
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

        const payload = await readResponse(response);
        pollJob(payload.jobId);
      } catch (error) {
        renderClientError(error);
      }
    }

    async function startProject() {
      if (!selectedProject || busy) {
        return;
      }

      setBusy(true);
      showStatus(
        'Processando PBIP',
        'Executando profiling sobre o projeto validado.',
      );

      try {
        const response = await fetch(
          '/api/projects/' +
            encodeURIComponent(selectedProject.id) +
            '/profile',
          {
            method: 'POST',
            headers: apiHeaders(),
          },
        );

        const payload = await readResponse(response);
        pollJob(payload.jobId);
      } catch (error) {
        renderClientError(error);
      }
    }

    async function startManualPath() {
      const path = elements.manualPath.value.trim();

      if (!path || busy) {
        if (!path) {
          renderClientError(
            new Error(
              'Informe um caminho local antes de analisar.',
            ),
          );
        }
        return;
      }

      setBusy(true);
      showStatus(
        'Analisando caminho',
        'Validando o alvo local informado.',
      );

      try {
        const response = await fetch(
          '/api/jobs/path',
          {
            method: 'POST',
            headers: apiHeaders({
              'content-type': 'application/json',
            }),
            body: JSON.stringify({
              path: path,
            }),
          },
        );

        const payload = await readResponse(response);
        pollJob(payload.jobId);
      } catch (error) {
        renderClientError(error);
      }
    }

    async function createUniqueProjectDirectory(
      parent,
      projectName,
    ) {
      const base = sanitizeFolderName(
        projectName + '-PBIP',
      );

      for (
        let suffix = 1;
        suffix <= 100;
        suffix += 1
      ) {
        const name =
          suffix === 1
            ? base
            : base + '-' + suffix;

        try {
          await parent.getDirectoryHandle(name);
        } catch (error) {
          if (
            error &&
            error.name === 'NotFoundError'
          ) {
            return await parent.getDirectoryHandle(
              name,
              {
                create: true,
              },
            );
          }
          throw error;
        }
      }

      throw new Error(
        'Não foi possível criar uma pasta de destino exclusiva para o PBIP convertido.',
      );
    }

    function sanitizeFolderName(value) {
      const sanitized = String(value || 'PowerBI')
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/[. ]+$/g, '')
        .trim();

      return sanitized || 'PowerBI';
    }

    async function getOutputFileHandle(
      root,
      relativePath,
    ) {
      const parts = normalizeBrowserPath(
        relativePath,
      ).split('/').filter(Boolean);

      if (parts.length === 0) {
        throw new Error(
          'Arquivo convertido sem caminho relativo válido.',
        );
      }

      let directory = root;

      for (
        let index = 0;
        index < parts.length - 1;
        index += 1
      ) {
        directory =
          await directory.getDirectoryHandle(
            parts[index],
            {
              create: true,
            },
          );
      }

      return await directory.getFileHandle(
        parts[parts.length - 1],
        {
          create: true,
        },
      );
    }

    async function exportConvertedPbip() {
      const jobId =
        elements.exportPbip.dataset.jobId;

      if (!jobId) {
        return;
      }

      if (
        typeof window.showDirectoryPicker !==
        'function'
      ) {
        renderClientError(
          new Error(
            'Este navegador não permite gravar uma pasta PBIP diretamente. Use Microsoft Edge ou Chrome atualizados.',
          ),
        );
        return;
      }

      let destination;

      try {
        destination =
          await window.showDirectoryPicker({
            id: 'pbi-profiling-export',
            mode: 'readwrite',
          });
      } catch (error) {
        if (
          error &&
          error.name === 'AbortError'
        ) {
          return;
        }
        renderClientError(error);
        return;
      }

      setBusy(true);
      elements.workspaceNote.hidden = false;
      elements.workspaceNote.textContent =
        'Preparando exportação do PBIP convertido...';

      try {
        const base =
          '/api/jobs/' +
          encodeURIComponent(jobId) +
          '/workspace';

        const manifestResponse =
          await fetch(
            base,
            {
              headers: apiHeaders(),
            },
          );

        const manifest =
          await readResponse(
            manifestResponse,
          );

        const projectDirectory =
          await createUniqueProjectDirectory(
            destination,
            manifest.projectName ||
              'PowerBI',
          );

        let completed = 0;

        for (const item of manifest.files) {
          const response = await fetch(
            base +
              '/file?path=' +
              encodeURIComponent(
                item.path,
              ),
            {
              headers: apiHeaders(),
            },
          );

          if (!response.ok) {
            throw new Error(
              'Falha ao ler o arquivo convertido: ' +
                item.path,
            );
          }

          const fileHandle =
            await getOutputFileHandle(
              projectDirectory,
              item.path,
            );
          const writable =
            await fileHandle.createWritable();

          if (
            response.body &&
            typeof response.body.pipeTo ===
              'function'
          ) {
            await response.body.pipeTo(
              writable,
            );
          } else {
            try {
              await writable.write(
                await response.arrayBuffer(),
              );
            } finally {
              await writable.close();
            }
          }

          completed += 1;
          elements.workspaceNote.textContent =
            'Salvando PBIP convertido: ' +
            completed +
            ' / ' +
            manifest.files.length +
            ' arquivos.';
        }

        await fetch(
          base,
          {
            method: 'DELETE',
            headers: apiHeaders(),
          },
        );

        elements.workspaceNote.textContent =
          'PBIP convertido salvo na pasta "' +
          projectDirectory.name +
          '".';
        elements.exportPbip.hidden = true;
        elements.exportPbip.dataset.jobId = '';
      } catch (error) {
        elements.workspaceNote.textContent =
          error && error.message
            ? error.message
            : String(error);
      } finally {
        setBusy(false);
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

          const job = await readResponse(response);
          renderJob(job);

          if (
            job.status === 'completed' ||
            job.status === 'failed'
          ) {
            clearInterval(polling);
            polling = null;
            setBusy(false);
          }
        } catch (error) {
          clearInterval(polling);
          polling = null;
          renderClientError(error);
        }
      }

      refresh();
      polling = setInterval(refresh, 1000);
    }

    function renderJob(job) {
      elements.resultActions.hidden = true;
      elements.workspaceNote.hidden = true;

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
        ...(job.events || [])
          .slice(-12)
          .map(
            function(event) {
              const item =
                document.createElement('li');
              item.textContent = event.message;
              return item;
            },
          ),
      );

      if (job.status === 'completed') {
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

        if (job.workspaceAvailable) {
          elements.exportPbip.hidden = false;
          elements.exportPbip.dataset.jobId =
            job.id;
          elements.workspaceNote.textContent =
            'O PBIP convertido está disponível para salvar em uma pasta escolhida por você.';
          elements.workspaceNote.hidden = false;
        }
      }
    }

    elements.pbixSelect.addEventListener(
      'click',
      selectPbix,
    );
    elements.pbixFile.addEventListener(
      'change',
      onPbixChanged,
    );
    elements.pbixRun.addEventListener(
      'click',
      startPbix,
    );
    elements.projectSelect.addEventListener(
      'click',
      selectProject,
    );
    elements.projectRun.addEventListener(
      'click',
      startProject,
    );
    elements.manualRun.addEventListener(
      'click',
      startManualPath,
    );
    elements.exportPbip.addEventListener(
      'click',
      exportConvertedPbip,
    );

    setBusy(false);
  </script>
</body>
</html>`;
}
