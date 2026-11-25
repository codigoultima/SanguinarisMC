(() => {
  const EN = window.SANGUINARIS_EN || { text: {}, attrs: [], meta: [], title: '', cardIds: [] };
  const translatedCards = new Set(EN.cardIds || []);
  let currentLang = 'es';
  const originalText = new WeakMap();
  const originalAttrs = new Map();
  const originalMeta = new Map();
  const originalTitle = document.title;

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
        if (lang === 'en') {
          const card = parent.closest('.patch-card[role="tabpanel"]');
          if (card && !translatedCards.has(card.id)) {
            return NodeFilter.FILTER_REJECT;
          }
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

  /* Galería: sin capturas no se muestra; con ?editar se ven los huecos para preparar el contenido. */
  const editing = /[?&]editar(=|&|$)/.test(window.location.search);
  if (editing) {
    document.documentElement.classList.add('editar');
  } else if (!document.querySelector('#galeria .has-media')) {
    document.querySelectorAll('[data-nav-media]').forEach((link) => { link.hidden = true; });
  }

  const year = document.querySelector('#year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  applyLanguage(storedLang || 'es');
})();
