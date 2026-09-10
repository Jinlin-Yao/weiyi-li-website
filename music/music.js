const body = document.body;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const control = document.querySelector('.motion-button');
let motion = !reduced.matches;
const applyMotion = () => {
  body.classList.toggle('motion-off', !motion);
  if (control) {
    control.textContent = motion ? 'Motion: on' : 'Motion: off';
    control.setAttribute('aria-pressed', String(motion));
  }
};
applyMotion();
control?.addEventListener('click', () => { motion = !motion; applyMotion(); });
reduced.addEventListener('change', event => { motion = !event.matches; applyMotion(); });
let ticking = false;
const progress = () => {
  const range = document.documentElement.scrollHeight - window.innerHeight;
  body.style.setProperty('--progress', `${range > 0 ? (window.scrollY / range) * 100 : 0}%`);
  ticking = false;
};
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(progress); ticking = true; } }, {passive: true});
window.addEventListener('resize', progress);
progress();
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.addEventListener('pointermove', event => {
    if (!motion) return;
    body.style.setProperty('--cx', `${event.clientX}px`);
    body.style.setProperty('--cy', `${event.clientY}px`);
  }, {passive: true});
  document.querySelectorAll('.album-art').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!motion) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--rx', `${-((event.clientY-r.top)/r.height-.5)*9}deg`);
      card.style.setProperty('--ry', `${((event.clientX-r.left)/r.width-.5)*9}deg`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx','0deg'); card.style.setProperty('--ry','0deg'); });
  });
}
