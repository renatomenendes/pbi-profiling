export const REPORT_CLIENT_JS = `
(() => {
  const root = document.documentElement;
  const body = document.body;

  function preferredTheme() {
    const stored = localStorage.getItem('pbi-profiling-theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem('pbi-profiling-theme', theme);
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.textContent = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
      button.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro',
      );
    }
  }

  setTheme(preferredTheme());

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  const mobileButton = document.getElementById('mobile-nav-toggle');
  mobileButton?.addEventListener('click', () => {
    body.classList.toggle('nav-open');
  });

  document.querySelectorAll('.nav a').forEach((link) => {
    link.addEventListener('click', () => body.classList.remove('nav-open'));
  });

  document.querySelectorAll('[data-search-input]').forEach((input) => {
    const targetId = input.dataset.searchInput;
    const target = document.getElementById(targetId);
    if (!target) return;

    const apply = () => {
      const query = input.value.trim().toLocaleLowerCase('pt-BR');
      const candidates = target.querySelectorAll(
        '[data-search-row], [data-search-card]',
      );
      let visible = 0;

      candidates.forEach((candidate) => {
        const haystack = (candidate.dataset.search || candidate.textContent || '')
          .toLocaleLowerCase('pt-BR');
        const show = !query || haystack.includes(query);
        candidate.hidden = !show;
        if (show) visible += 1;
      });

      const counter = document.querySelector(
        '[data-search-count="' + targetId + '"]',
      );
      if (counter) counter.textContent = String(visible);
    };

    input.addEventListener('input', apply);
    apply();
  });

  const navLinks = new Map(
    [...document.querySelectorAll('.nav a[href^="#"]')].map((link) => [
      link.getAttribute('href').slice(1),
      link,
    ]),
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        navLinks.forEach((link) => link.classList.remove('is-active'));
        navLinks.get(visible.target.id)?.classList.add('is-active');
      },
      {
        rootMargin: '-15% 0px -70% 0px',
        threshold: [0, 0.1, 0.4],
      },
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });
  }

  let lineageLoaded = false;

  function loadLineage() {
    if (lineageLoaded) return;

    const payload = document.getElementById('lineage-payload');
    const frame = document.getElementById('lineage-frame');
    if (!payload || !frame || !payload.textContent.trim()) return;

    try {
      const binary = atob(payload.textContent.trim());
      const bytes = Uint8Array.from(binary, (character) =>
        character.charCodeAt(0),
      );
      frame.srcdoc = new TextDecoder('utf-8').decode(bytes);
      lineageLoaded = true;
      const status = document.getElementById('lineage-status');
      if (status) status.textContent = 'Lineage carregado';
    } catch (error) {
      const status = document.getElementById('lineage-status');
      if (status) status.textContent = 'Falha ao abrir lineage';
      console.error(error);
    }
  }

  document.getElementById('load-lineage')?.addEventListener('click', loadLineage);

  const lineageSection = document.getElementById('lineage');
  if (lineageSection && 'IntersectionObserver' in window) {
    const lineageObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadLineage();
          observer.disconnect();
        }
      },
      { rootMargin: '350px 0px' },
    );
    lineageObserver.observe(lineageSection);
  }

  document.getElementById('download-profile')?.addEventListener('click', () => {
    const payload = document.getElementById('profile-payload');
    if (!payload) return;

    const blob = new Blob([payload.textContent], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const project = document.body.dataset.project || 'power-bi';
    link.href = url;
    link.download = project.replace(/[^a-z0-9._-]+/gi, '_') + '-profile.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copy);
      if (!target) return;

      try {
        await navigator.clipboard.writeText(target.textContent || '');
        const original = button.textContent;
        button.textContent = 'Copiado';
        setTimeout(() => {
          button.textContent = original;
        }, 1200);
      } catch (error) {
        console.error(error);
      }
    });
  });
})();
`;
