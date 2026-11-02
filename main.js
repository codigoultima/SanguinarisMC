(() => {
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('#site-nav');
  const toggle = document.querySelector('.menu-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onScroll = () => {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 24);
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && nav) {
    const close = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        close();
      }
    });
  }

  const reveals = document.querySelectorAll('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((item) => observer.observe(item));
  } else {
    reveals.forEach((item) => item.classList.add('visible'));
  }

  // Fallback: nunca dejar contenido invisible si el observer no se dispara.
  window.setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach((item) => item.classList.add('visible'));
  }, 1400);

  const year = document.querySelector('#year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const patchSection = document.querySelector('#novedades');
  if (patchSection) {
    const storageKey = 'sanguinaris.patches.v4';
    const tabs = Array.from(patchSection.querySelectorAll('.patch-tab'));
    const panels = Array.from(patchSection.querySelectorAll('.patch-card[role="tabpanel"]'));
    const patchPanel = patchSection.querySelector('.patch-panel');
    const currentLabel = patchSection.querySelector('.patch-current');
    const toggle = patchSection.querySelector('.patch-toggle');
    const toggleLabel = patchSection.querySelector('.patch-toggle-label');
    let saved = {};
    try {
      saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}') || {};
    } catch (error) {
      saved = {};
    }

    const showTab = (tab) => {
      if (!tab) {
        return;
      }
      const target = tab.getAttribute('aria-controls');
      tabs.forEach((item) => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.id !== target;
      });
      if (patchPanel) {
        patchPanel.dataset.current = tab.textContent.trim();
      }
      if (currentLabel) {
        currentLabel.textContent = tab.textContent.trim();
      }
      saved.tab = tab.id.replace('tab-', '');
    };

    const setCollapsed = (collapsed) => {
      patchSection.classList.toggle('is-collapsed', collapsed);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(!collapsed));
      }
      if (toggleLabel) {
        toggleLabel.textContent = collapsed ? 'Ver notas' : 'Ocultar notas';
      }
      saved.collapsed = collapsed;
    };

    const persist = () => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch (error) {
        /* almacenamiento no disponible: el estado dura la visita */
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        showTab(tab);
        persist();
      });
      tab.addEventListener('keydown', (event) => {
        const index = tabs.indexOf(tab);
        let next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          next = tabs[(index + 1) % tabs.length];
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (event.key === 'Home') {
          next = tabs[0];
        } else if (event.key === 'End') {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          event.preventDefault();
          showTab(next);
          next.focus();
          persist();
        }
      });
    });

    if (toggle) {
      toggle.addEventListener('click', () => {
        const collapsed = !patchSection.classList.contains('is-collapsed');
        setCollapsed(collapsed);
        persist();
        if (!collapsed) {
          patchSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
    }

    document.querySelectorAll('a[href="#novedades"]').forEach((link) => {
      link.addEventListener('click', () => {
        if (patchSection.classList.contains('is-collapsed')) {
          setCollapsed(false);
          persist();
        }
      });
    });

    const savedTab = tabs.find((tab) => tab.id === `tab-${saved.tab}`);
    showTab(savedTab || tabs[0]);
    setCollapsed(Boolean(saved.collapsed));
  }

  if (!reduceMotion) {
    const art = document.querySelector('.hero-art img');
    let ticking = false;
    const parallax = () => {
      if (art && window.scrollY < window.innerHeight * 1.2) {
        art.style.transform = `translate3d(0, ${window.scrollY * 0.08}px, 0) scale(1.03)`;
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(parallax);
        ticking = true;
      }
    }, { passive: true });
    parallax();
  }
})();
