(() => {
  const canvas = document.querySelector('#polymer-network');
  const control = document.querySelector('#background-motion');
  const layer = document.querySelector('.academic-ambient');
  if (!canvas || !control || !layer) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) { control.hidden = true; return; }
  const fields = [...layer.querySelectorAll('.gel-field')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const CYCLE = 16000, TAU = Math.PI * 2;
  let enabled = !reduce.matches;
  let width = 0, height = 0, frame = 0, last = null, lastDraw = null;
  let elapsed = reduce.matches ? 8500 : 0;
  const smooth = (a, b, x) => {
    const v = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return v * v * (3 - 2 * v);
  };
  // Abstract visual cycle, not a molecular mechanism or kinetic simulation.
  // 0–3 s: flowing monomers; 3–7 s: network formation;
  // 7–10 s: stable gel; 10–14 s: network dissociation; 14–16 s: flow.
  const nodes = [], bonds = [];
  const patches = [
    { x: -.02, y: .11, dx: .049, dy: .105, cols: 5, rows: 8 },
    { x: .79, y: .03, dx: .047, dy: .112, cols: 5, rows: 8 },
    { x: .32, y: .78, dx: .060, dy: .085, cols: 7, rows: 3 }
  ];
  patches.forEach((patch, cluster) => {
    const start = nodes.length;
    for (let row = 0; row < patch.rows; row++) {
      for (let col = 0; col < patch.cols; col++) {
        const id = nodes.length;
        nodes.push({
          x: patch.x + (col + (row % 2) * .45) * patch.dx + Math.sin(id * 3.7) * .006,
          y: patch.y + row * patch.dy + Math.cos(id * 2.3) * .01,
          seed: id * 2.399963 + cluster,
          radius: 1.8 + (id % 4) * .3
        });
        if (col > 0) bonds.push([id - 1, id, .12 + ((id * 7) % 13) / 36]);
        if (row > 0) {
          bonds.push([id - patch.cols, id, .25 + ((id * 3) % 11) / 28]);
          if (col > 0 && (row + col) % 2 === 0) bonds.push([start + (row - 1) * patch.cols + col - 1, id, .55]);
        }
      }
    }
  });
  const draw = () => {
    const seconds = (elapsed % CYCLE) / 1000;
    const phase = seconds / 16 * TAU;
    const gel = smooth(3, 7, seconds) * (1 - smooth(10, 14, seconds));
    const fluid = 1 - gel;
    const mobility = fluid * fluid;
    ctx.clearRect(0, 0, width, height);
    // All movement uses the same clock, so gel, particles and bonds freeze together.
    fields.forEach((field, i) => {
      const dx = Math.sin(phase + i * 1.7) * 3.8 * mobility;
      const dy = Math.cos(phase * 2 + i) * 2.5 * mobility;
      field.style.transform = `translate(${dx}%,${dy}%) scale(${1 + fluid * .06})`;
      field.style.opacity = String(.45 + gel * .45);
    });
    const positions = nodes.map(n => {
      const spreadX = Math.min(width * .09, 125), spreadY = Math.min(height * .12, 95);
      return {
        x: n.x * width + mobility * spreadX * (Math.sin(phase + n.seed) + .24 * Math.sin(phase * 3 + n.seed * .7)),
        y: n.y * height + mobility * spreadY * (Math.cos(phase * 2 + n.seed) + .20 * Math.sin(phase + n.seed * 1.3))
      };
    });
    // Connections emerge progressively, and retract as the network dissolves.
    for (const [a, b, threshold] of bonds) {
      const connection = smooth(threshold, Math.min(threshold + .32, 1), gel);
      if (connection < .005) continue;
      const p = positions[a], q = positions[b];
      const middleX = (p.x + q.x) / 2, middleY = (p.y + q.y) / 2;
      const bend = Math.sin(a * .8) * 7;
      ctx.lineWidth = .7 + .25 * gel;
      ctx.strokeStyle = `rgba(51,87,117,${.19 * connection})`;
      ctx.beginPath();
      ctx.moveTo(middleX + (p.x - middleX) * connection, middleY + (p.y - middleY) * connection);
      ctx.quadraticCurveTo(middleX + bend, middleY - bend,
        middleX + (q.x - middleX) * connection, middleY + (q.y - middleY) * connection);
      ctx.stroke();
    }
    for (let i = 0; i < nodes.length; i++) {
      const p = positions[i], radius = nodes[i].radius;
      ctx.beginPath();ctx.arc(p.x, p.y, radius + 4.5, 0, TAU);
      ctx.fillStyle = `rgba(125,171,200,${.035 + .018 * gel})`;ctx.fill();
      ctx.beginPath();ctx.arc(p.x, p.y, radius, 0, TAU);
      ctx.fillStyle = `rgba(56,100,136,${.22 + .055 * gel})`;ctx.fill();
    }
  };
  const resize = () => {
    width = window.innerWidth; height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);draw();
  };
  const tick = now => {
    frame = 0;
    if (!enabled || document.hidden) return;
    if (last !== null) elapsed += now - last;
    last = now;
    if (lastDraw === null || now - lastDraw >= 1000 / 30) { draw(); lastDraw = now; }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);frame = 0;last = null;lastDraw = null;
    const running = enabled && !document.hidden;
    layer.classList.toggle('ambient-paused', !running);
    control.setAttribute('aria-pressed', String(enabled));
    control.textContent = enabled ? 'Pause background' : 'Animate background';
    if (running) frame = requestAnimationFrame(tick);
  };
  control.addEventListener('click', () => { enabled = !enabled;sync(); });
  reduce.addEventListener('change', event => {
    enabled = !event.matches;
    if (event.matches) { elapsed = 8500;draw(); }
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame);last = null; });
  window.addEventListener('pageshow', sync);
  resize();sync();
})();
