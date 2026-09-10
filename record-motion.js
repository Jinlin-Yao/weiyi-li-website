(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.music-invitation').forEach(panel => {
    const button = panel.querySelector('.record-controls button');
    if (!button) return;
    let enabled = !reduced.matches, visible = true;
    const sync = () => {
      panel.classList.toggle('record-paused', !enabled || !visible || document.hidden);
      button.setAttribute('aria-pressed', String(enabled));
      button.textContent = enabled ? 'Pause record' : 'Animate record';
    };
    button.addEventListener('click', () => { enabled = !enabled; sync(); });
    reduced.addEventListener('change', event => { enabled = !event.matches; sync(); });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(panel);
    }
    sync();
  });
})();
