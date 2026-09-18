export function renderAppPage(
  {
    defaultExportRoot = '',
  } = {},
) {
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
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 44px 0 64px;
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
      max-width: 800px;
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
      background: #2457e6;
      color: #fff;
      font-size: 14px;
      font-weight: 800;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .card {
      background: rgba(255, 255, 255, .95);
      border: 1px solid #dce2ea;
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 16px 50px rgba(29, 42, 72, .07);
    }

    .card h2,
    .card h3 {
      margin: 0 0 8px;
    }

    .card p {
      margin: 0 0 16px;
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

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }

    .selection {
      min-height: 72px;
      margin-top: 14px;
      padding: 13px 14px;
      border: 1px dashed #cbd3df;
      border-radius: 12px;
      color: #667286;
      font-size: 13px;
      line-height: 1.55;
    }

    .selection strong {
      display: block;
      margin-bottom: 4px;
      color: #344158;
    }

    .selection.ready {
      border-style: solid;
      border-color: #b8dfc7;
      background: #eff9f3;
      color: #356246;
    }

    .selection.warning {
      border-style: solid;
      border-color: #ead49c;
      background: #fff8e6;
      color: #76591a;
    }

    .selection.error {
      border-style: solid;
      border-color: #f0c1bd;
      background: #fff2f1;
      color: #8e3832;
    }

    .prepared {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 18px;
      align-items: center;
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
      border-radius: 999px;
      background: #edf2f8;
      color: #4b596e;
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

    .status-line strong { font-size: 18px; }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 25px;
      padding: 3px 9px;
      border-radius: 999px;
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

    [hidden] { display: none !important; }

    @media (max-width: 780px) {
      .grid,
      .prepared {
        grid-template-columns: 1fr;
      }

      main {
        width: min(100% - 20px, 1120px);
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
      label {
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
        background: #202a39;
        color: #c5cfdf;
      }

      .privacy {
        color: #b9c7df;
        background: #18223a;
        border-color: #283959;
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
        Escolha a origem, prepare um PBIP válido e só então gere o runbook.
        Conversão e profiling são etapas separadas para impedir documentação
        final baseada em um projeto incompleto.
      </p>
    </header>

    <section class="step">
      <h2 class="step-title">
        <span class="step-number">1</span>
        Escolha a origem
      </h2>

      <div class="grid">
        <article class="card">
          <h3>Tenho um PBIX</h3>
          <p>
            O Desktop materializa o modelo e o TOM cria um PBIP temporário.
            Nesta etapa ainda não existe runbook.
          </p>

          <input id="pbix-file" type="file" accept=".pbix" hidden>

          <div id="pbix-selection" class="selection">
            Nenhum PBIX selecionado.
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
            <button id="pbix-select" class="secondary" type="button">
              Selecionar PBIX
            </button>
            <button id="pbix-convert" type="button" disabled>
              Converter para PBIP
            </button>
          </div>
        </article>

        <article class="card">
          <h3>Já tenho um PBIP</h3>
          <p>
            Selecione a pasta do projeto. O modelo é validado antes de liberar
            a geração do runbook.
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
          </div>
        </article>
      </div>
    </section>

    <section class="step">
      <h2 class="step-title">
        <span class="step-number">2</span>
        Projeto preparado
      </h2>

      <div class="card">
        <div class="prepared">
          <div>
            <div id="prepared-state" class="selection">
              Escolha uma origem para começar.
            </div>

            <div id="export-panel" class="field" hidden>
              <label for="export-root">Destino do PBIP convertido</label>
              <input
                id="export-root"
                type="text"
                autocomplete="off"
                placeholder="C:\projetos\..."
              >
              <p class="muted" style="margin-top:8px">
                O PBIP convertido precisa ser salvo e validado antes do runbook.
              </p>
              <div class="actions">
                <button id="export-pbip" type="button">
                  Salvar PBIP convertido
                </button>
              </div>
            </div>
          </div>

          <div>
            <button id="generate-runbook" type="button" disabled>
              Gerar runbook
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="step">
      <h2 class="step-title">
        <span class="step-number">3</span>
        Execução e resultado
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

    <div class="privacy">
      O servidor escuta somente em <strong>127.0.0.1</strong>. Nenhum runbook
      é liberado sem um modelo TMDL validado. PowerShell permanece restrito à
      conversão PBIX/TOM.
    </div>
  </main>

  <script>
    const token = new URLSearchParams(location.search).get('token');
    const DEFAULT_EXPORT_ROOT = ${JSON.stringify(defaultExportRoot)};

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
      pbixConvert: document.getElementById('pbix-convert'),
      projectFallback: document.getElementById('project-folder-fallback'),
      projectSelection: document.getElementById('project-selection'),
      projectSelect: document.getElementById('project-select'),
      preparedState: document.getElementById('prepared-state'),
      exportPanel: document.getElementById('export-panel'),
      exportRoot: document.getElementById('export-root'),
      exportPbip: document.getElementById('export-pbip'),
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
    let selectedProject = null;
    let conversionJobId = null;
    let readySource = null;
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
      elements.pbixConvert.disabled =
        busy || !selectedPbix;
      elements.exportPbip.disabled =
        busy || !conversionJobId;
      elements.generateRunbook.disabled =
        busy || !readySource;
    }

    function resetPreparedState() {
      readySource = null;
      conversionJobId = null;
      elements.exportPanel.hidden = true;
      elements.exportPbip.dataset.jobId = '';
      elements.generateRunbook.disabled = true;
      elements.preparedState.className = 'selection';
      elements.preparedState.textContent =
        'A origem mudou. Prepare o projeto novamente.';
      elements.resultActions.hidden = true;
    }

    function choosePbix(file) {
      selectedProject = null;
      selectedPbix = file || null;
      resetPreparedState();

      elements.projectSelection.className = 'selection';
      elements.projectSelection.textContent =
        'Nenhum PBIP selecionado.';

      if (!selectedPbix) {
        elements.pbixSelection.className = 'selection';
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

    function chooseProject(project) {
      selectedPbix = null;
      selectedProject = project;
      conversionJobId = null;
      readySource = project
        ? {
            kind: 'project',
            id: project.id,
          }
        : null;

      elements.pbixFile.value = '';
      elements.pbixSelection.className = 'selection';
      elements.pbixSelection.textContent =
        'Nenhum PBIX selecionado.';

      elements.exportPanel.hidden = true;
      elements.resultActions.hidden = true;

      if (!project) {
        elements.preparedState.className = 'selection';
        elements.preparedState.textContent =
          'Escolha uma origem para começar.';
      } else {
        renderPreparedValidation(
          project.validation,
          'PBIP validado e pronto para profiling.',
        );
      }

      setBusy(false);
    }

    function renderPreparedValidation(
      validation,
      title,
    ) {
      elements.preparedState.className =
        'selection ready';
      elements.preparedState.innerHTML =
        '<strong>' +
        escapeHtml(title) +
        '</strong>' +
        escapeHtml(
          validation.projectName ||
          validation.modelName ||
          'Power BI project',
        ) +
        '<div class="facts">' +
        fact('TMDL', validation.tmdlFiles) +
        fact('Tabelas', validation.tables) +
        fact('Colunas', validation.columns) +
        fact('Medidas', validation.measures) +
        fact('Páginas', validation.pages) +
        fact('Visuais', validation.visuals) +
        '</div>';
    }

    function fact(label, value) {
      return '<span class="fact">' +
        escapeHtml(label) +
        ': ' +
        escapeHtml(value) +
        '</span>';
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

    function showOperation(
      title,
      message,
    ) {
      elements.statusCard.classList.add('visible');
      elements.resultActions.hidden = true;
      elements.statusTitle.textContent = title;
      elements.statusPill.textContent = 'running';
      elements.statusPill.className = 'pill';
      elements.statusMessage.textContent = message;
      elements.progress.className = 'progress';
      elements.events.replaceChildren();
    }

    function renderFailure(error) {
      elements.statusCard.classList.add('visible');
      elements.resultActions.hidden = true;
      elements.statusTitle.textContent = 'Falha';
      elements.statusPill.textContent = 'failed';
      elements.statusPill.className = 'pill error';
      elements.statusMessage.textContent =
        error && error.message
          ? error.message
          : String(error);
      elements.progress.className =
        'progress error';
      setBusy(false);
    }

    function renderCompletedProfile(job) {
      elements.statusCard.classList.add('visible');
      elements.statusTitle.textContent =
        'Runbook gerado';
      elements.statusPill.textContent =
        'completed';
      elements.statusPill.className =
        'pill success';
      elements.statusMessage.textContent =
        job.message ||
        'Runbook generated successfully.';
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
    }

    function renderEvents(job) {
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
    }

    function pollJob(
      jobId,
      {
        terminalStatuses,
        onTerminal,
      },
    ) {
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

          renderEvents(job);
          elements.statusMessage.textContent =
            job.message || 'Processando.';
          elements.statusPill.textContent =
            job.status;

          if (
            terminalStatuses.includes(
              job.status,
            )
          ) {
            clearInterval(polling);
            polling = null;
            await onTerminal(job);
          }
        } catch (error) {
          clearInterval(polling);
          polling = null;
          renderFailure(error);
        }
      }

      refresh();
      polling = setInterval(
        refresh,
        1000,
      );
    }

    async function convertPbix() {
      if (!selectedPbix || busy) {
        return;
      }

      resetPreparedState();
      setBusy(true);
      showOperation(
        'Convertendo PBIX',
        'Abrindo o modelo no Power BI Desktop e serializando para PBIP.',
      );

      const timeout = Number(
        document.getElementById(
          'pbix-timeout',
        ).value || 300,
      );

      try {
        const response = await fetch(
          '/api/jobs/pbix?timeout=' +
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

        const payload =
          await readResponse(response);

        pollJob(
          payload.jobId,
          {
            terminalStatuses: [
              'converted',
              'failed',
            ],
            async onTerminal(job) {
              if (job.status === 'failed') {
                renderFailure(
                  new Error(job.message),
                );
                return;
              }

              conversionJobId = job.id;
              renderPreparedValidation(
                job.validation,
                'PBIP convertido e validado em workspace temporário.',
              );

              elements.exportPanel.hidden = false;
              elements.exportRoot.value =
                elements.exportRoot.value.trim() ||
                DEFAULT_EXPORT_ROOT;

              elements.statusTitle.textContent =
                'Conversão concluída';
              elements.statusPill.textContent =
                'converted';
              elements.statusPill.className =
                'pill success';
              elements.statusMessage.textContent =
                'Salve o PBIP convertido para continuar.';
              elements.progress.className =
                'progress done';
              setBusy(false);
            },
          },
        );
      } catch (error) {
        renderFailure(error);
      }
    }

    async function exportConvertedPbip() {
      if (
        !conversionJobId ||
        busy
      ) {
        return;
      }

      const destination =
        elements.exportRoot.value.trim();

      if (!destination) {
        renderFailure(
          new Error(
            'Informe a pasta de destino para salvar o PBIP convertido.',
          ),
        );
        return;
      }

      setBusy(true);
      showOperation(
        'Salvando PBIP',
        'Copiando e validando o PBIP persistido.',
      );

      try {
        const response = await fetch(
          '/api/jobs/' +
            encodeURIComponent(
              conversionJobId,
            ) +
            '/workspace/export',
          {
            method: 'POST',
            headers: apiHeaders({
              'content-type':
                'application/json',
            }),
            body: JSON.stringify({
              destinationRoot:
                destination,
            }),
          },
        );

        const exported =
          await readResponse(response);

        readySource = {
          kind: 'conversion',
          id: conversionJobId,
        };

        renderPreparedValidation(
          exported.validation,
          'PBIP salvo e validado. Pronto para gerar o runbook.',
        );

        elements.preparedState.innerHTML +=
          '<br><span class="muted">Salvo em: ' +
          escapeHtml(exported.path) +
          '</span>';

        elements.exportPanel.hidden = true;
        elements.statusTitle.textContent =
          'PBIP salvo';
        elements.statusPill.textContent =
          'ready';
        elements.statusPill.className =
          'pill success';
        elements.statusMessage.textContent =
          'Projeto persistido e validado.';
        elements.progress.className =
          'progress done';
        setBusy(false);
      } catch (error) {
        renderFailure(error);
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

        selectedProject = null;
        readySource = null;
        selectedPbix = null;
        elements.pbixFile.value = '';
        elements.pbixSelection.className =
          'selection';
        elements.pbixSelection.textContent =
          'Nenhum PBIX selecionado.';
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

        const validate =
          await fetch(
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

        const project = {
          id: created.projectId,
          name: selection.name,
          validation,
        };

        selectedProject = project;
        elements.projectSelection.className =
          'selection ready';
        elements.projectSelection.innerHTML =
          '<strong>PBIP validado</strong>' +
          escapeHtml(selection.name) +
          '<br>Tabelas: ' +
          escapeHtml(validation.tables) +
          ' · TMDL: ' +
          escapeHtml(validation.tmdlFiles);

        chooseProject(project);
      } catch (error) {
        selectedProject = null;
        readySource = null;
        elements.projectSelection.className =
          'selection error';
        elements.projectSelection.innerHTML =
          '<strong>PBIP inválido</strong>' +
          escapeHtml(
            error && error.message
              ? error.message
              : String(error),
          );
        elements.preparedState.className =
          'selection error';
        elements.preparedState.textContent =
          'O projeto não passou na validação estrutural.';
        setBusy(false);
      }
    }

    async function generateRunbook() {
      if (!readySource || busy) {
        return;
      }

      setBusy(true);
      showOperation(
        'Gerando runbook',
        'Executando profiling sobre o PBIP validado.',
      );

      try {
        let endpoint;

        if (
          readySource.kind ===
          'project'
        ) {
          endpoint =
            '/api/projects/' +
            encodeURIComponent(
              readySource.id,
            ) +
            '/profile';
        } else {
          endpoint =
            '/api/jobs/' +
            encodeURIComponent(
              readySource.id,
            ) +
            '/profile';
        }

        const response =
          await fetch(
            endpoint,
            {
              method: 'POST',
              headers: apiHeaders(),
            },
          );

        const payload =
          await readResponse(response);

        pollJob(
          payload.jobId,
          {
            terminalStatuses: [
              'completed',
              'failed',
            ],
            async onTerminal(job) {
              if (job.status === 'failed') {
                renderFailure(
                  new Error(job.message),
                );
                return;
              }

              renderCompletedProfile(job);
              setBusy(false);
            },
          },
        );
      } catch (error) {
        renderFailure(error);
      }
    }

    async function uploadProjectFiles(
      projectId,
      files,
    ) {
      let next = 0;
      let completed = 0;
      const workers = Math.min(
        4,
        files.length,
      );

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
              encodeURIComponent(
                projectId,
              ) +
              '/files?path=' +
              encodeURIComponent(
                item.path,
              ),
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
            '<strong>Validando PBIP</strong>' +
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

          return await readDirectoryHandle(
            handle,
          );
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

    async function readDirectoryHandle(
      handle,
    ) {
      const files = [];

      async function walk(
        directory,
        prefix,
      ) {
        for await (
          const entry of directory.values()
        ) {
          const path =
            prefix
              ? prefix + '/' + entry.name
              : entry.name;

          if (
            entry.kind === 'directory'
          ) {
            if (shouldDescend(path)) {
              await walk(entry, path);
            }
            continue;
          }

          if (
            !shouldReadProjectFile(path)
          ) {
            continue;
          }

          files.push({
            path:
              normalizeBrowserPath(path),
            file:
              await entry.getFile(),
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
              readFileList(
                input.files,
              ),
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

    function readFileList(fileList) {
      const files = [];
      let rootName = '';

      for (const file of fileList || []) {
        const raw =
          normalizeBrowserPath(
            file.webkitRelativePath ||
            file.name,
          );
        const parts =
          pathParts(raw);

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

        if (
          !shouldReadProjectFile(
            relative,
          )
        ) {
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
      const parts =
        pathParts(path);

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
      const dot =
        name.lastIndexOf('.');
      const extension =
        dot >= 0
          ? name
              .slice(dot)
              .toLowerCase()
          : '';

      return RELEVANT_EXTENSIONS.has(
        extension,
      );
    }

    function formatBytes(bytes) {
      const value =
        Number(bytes || 0);

      if (value < 1024) {
        return value + ' B';
      }

      if (value < 1024 * 1024) {
        return (
          value / 1024
        ).toFixed(1) + ' KB';
      }

      return (
        value /
        (1024 * 1024)
      ).toFixed(1) + ' MB';
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
        choosePbix(
          elements.pbixFile.files?.[0] ||
          null,
        );
      },
    );

    elements.pbixConvert.addEventListener(
      'click',
      convertPbix,
    );

    elements.projectSelect.addEventListener(
      'click',
      selectProjectFolder,
    );

    elements.exportPbip.addEventListener(
      'click',
      exportConvertedPbip,
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
