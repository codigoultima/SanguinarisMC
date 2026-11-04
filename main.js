(() => {
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('#site-nav');
  const toggle = document.querySelector('.menu-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const EN = window.SANGUINARIS_EN || { text: {}, attrs: [], meta: [], title: '' };
  let currentLang = 'es';
  const originalText = new WeakMap();
  const originalAttrs = new Map();
  const originalMeta = new Map();
  const originalTitle = document.title;

  const menuLabel = (open) => currentLang === 'en'
    ? (open ? 'Close menu' : 'Open menu')
    : (open ? 'Cerrar menú' : 'Abrir menú');

  const translateNodes = (lang) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, .lang-switch')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      if (!originalText.has(node)) {
        originalText.set(node, node.nodeValue);
      }
      const original = originalText.get(node);
      const trimmed = original.trim();
      const replacement = lang === 'en' ? EN.text[trimmed] : trimmed;
      if (replacement === undefined) {
        return;
      }
      const start = original.indexOf(trimmed);
      node.nodeValue = original.slice(0, start) + replacement + original.slice(start + trimmed.length);
    });
  };

  const applyAttrs = (lang) => {
    EN.attrs.forEach(([selector, attribute, english]) => {
      const element = document.querySelector(selector);
      if (!element) {
        return;
      }
      const key = selector + '|' + attribute;
      if (!originalAttrs.has(key)) {
        originalAttrs.set(key, element.getAttribute(attribute) || '');
      }
      element.setAttribute(attribute, lang === 'en' ? english : originalAttrs.get(key));
    });

    EN.meta.forEach(([selector, attribute, english]) => {
      const element = document.querySelector(selector);
      if (!element) {
        return;
      }
      const key = selector + '|' + attribute;
      if (!originalMeta.has(key)) {
        originalMeta.set(key, element.getAttribute(attribute) || '');
      }
      element.setAttribute(attribute, lang === 'en' ? english : originalMeta.get(key));
    });

    document.title = lang === 'en' && EN.title ? EN.title : originalTitle;
  };

  const applyLanguage = (lang) => {
    currentLang = lang === 'en' ? 'en' : 'es';
    document.documentElement.lang = currentLang;
    translateNodes(currentLang);
    applyAttrs(currentLang);

    document.querySelectorAll('.lang-btn').forEach((button) => {
      const active = button.dataset.lang === currentLang;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const langNote = document.querySelector('.patch-lang-note');
    if (langNote) {
      langNote.hidden = currentLang !== 'en';
    }

    if (toggle) {
      toggle.setAttribute('aria-label', menuLabel(toggle.getAttribute('aria-expanded') === 'true'));
    }
  };

  const storedLang = (() => {
    try {
      return window.localStorage.getItem('sanguinaris.lang');
    } catch (error) {
      return null;
    }
  })();

  document.querySelectorAll('.lang-btn').forEach((button) => {
    button.addEventListener('click', () => {
      applyLanguage(button.dataset.lang);
      try {
        window.localStorage.setItem('sanguinaris.lang', currentLang);
      } catch (error) {
        /* almacenamiento no disponible: el idioma dura la visita */
      }
    });
  });

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
      toggle.setAttribute('aria-label', menuLabel(false));
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', menuLabel(open));
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
    const storageKey = 'sanguinaris.patches.v9';
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
        toggleLabel.textContent = currentLang === 'en'
          ? (collapsed ? 'Show notes' : 'Hide notes')
          : (collapsed ? 'Ver notas' : 'Ocultar notas');
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

  applyLanguage(storedLang || 'es');
})();
