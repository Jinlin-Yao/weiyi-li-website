/* Tab-style view switching: only one section visible at a time */
(() => {
  const views = ['home', 'news', 'research', 'publications', 'experience', 'honors', 'contact'];
  const wordmark = document.querySelector('.wordmark');

  function setView(view) {
    if (!views.includes(view)) view = 'home';
    document.body.dataset.view = view;

    // Highlight active nav link
    document.querySelectorAll('nav a[data-view]').forEach(a => a.classList.remove('active'));
    if (view !== 'home') {
      const activeLink = document.querySelector(`nav a[data-view="${view}"]`);
      if (activeLink) activeLink.classList.add('active');
    }

    // Sync URL hash without scrolling
    if (view === 'home') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      history.replaceState(null, '', `#${view}`);
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }

  // Nav click handlers
  document.querySelectorAll('nav a[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setView(link.dataset.view);
    });
  });

  // Wordmark (Weiyi Li 李伟义) = back to home
  if (wordmark) {
    wordmark.addEventListener('click', (e) => {
      e.preventDefault();
      setView('home');
    });
  }

  // Support in-page links that jump to sections (e.g. "View full CV" stays,
  // but news items linking to #honors / #experience should switch views too)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]:not([data-view])');
    if (!link) return;
    const target = link.getAttribute('href').slice(1);
    if (views.includes(target)) {
      e.preventDefault();
      setView(target);
    }
  });

  // Initial view from URL hash
  const initialHash = window.location.hash.slice(1);
  setView(initialHash || 'home');

  // Handle back/forward navigation
  window.addEventListener('hashchange', () => {
    setView(window.location.hash.slice(1) || 'home');
  });
})();
