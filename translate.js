/* One-click Chinese translation for all pages */
(() => {
  const BTN_ID = 'translate-fab';
  if (document.getElementById(BTN_ID)) return;

  // Floating button
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.innerHTML = '中';
  btn.title = 'Translate to Chinese / 翻译为中文';
  document.body.appendChild(btn);

  const style = document.createElement('style');
  style.textContent = `
    #${BTN_ID}{position:fixed;bottom:22px;right:22px;z-index:99999;width:46px;height:46px;border-radius:50%;background:rgba(10,10,10,.82);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:15px;font-weight:700;cursor:pointer;backdrop-filter:blur(12px);box-shadow:0 4px 24px rgba(0,0,0,.35);transition:all .3s ease;font-family:Arial,sans-serif;letter-spacing:.5px}
    #${BTN_ID}:hover{transform:scale(1.12);background:rgba(0,180,220,.9);border-color:rgba(0,229,255,.6)}
    #${BTN_ID}.loading{pointer-events:none;animation:fabSpin .8s linear infinite}
    #${BTN_ID}.active{background:rgba(0,180,220,.85)}
    @keyframes fabSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    #${BTN_ID} .fab-tooltip{position:absolute;right:56px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.85);color:#fff;font-size:12px;padding:6px 12px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .3s;font-weight:400}
    #${BTN_ID}:hover .fab-tooltip{opacity:1}
    @media(max-width:600px){#${BTN_ID}{width:40px;height:40px;bottom:14px;right:14px;font-size:13px}}
    @media(prefers-reduced-motion:reduce){#${BTN_ID}{transition:none}#${BTN_ID}.loading{animation:none}}
  `;
  document.head.appendChild(style);

  let isZH = false;
  let originals = [];

  // Collect translatable text nodes
  function collect() {
    const nodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('script,style,noscript,textarea,#translate-fab,.goog-te-banner-frame,.goog-te-balloon-frame')) return NodeFilter.FILTER_REJECT;
        const text = node.textContent;
        if (!text || !text.trim()) return NodeFilter.FILTER_REJECT;
        if (text.trim().length < 2) return NodeFilter.FILTER_REJECT;
        // Skip if already mostly Chinese
        const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        if (chinese / text.length > 0.4) return NodeFilter.FILTER_REJECT;
        // Skip pure numbers / symbols / URLs
        if (/^[\d\s\p{P}\p{S}]+$/u.test(text.trim())) return NodeFilter.FILTER_REJECT;
        if (/^https?:\/\//.test(text.trim())) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while (n = walker.nextNode()) nodes.push(n);
    return nodes;
  }

  // Call Google Translate free endpoint
  async function translateText(text, target = 'zh-CN') {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data || !data[0]) return text;
    return data[0].map(seg => seg[0]).join('');
  }

  // Batch translate with markers
  async function translateBatch(nodes) {
    const MAX_CHARS = 3500;
    const batches = [];
    let cur = [], curLen = 0;
    for (const node of nodes) {
      const t = node.textContent.trim();
      if (curLen + t.length + 12 > MAX_CHARS && cur.length > 0) {
        batches.push(cur); cur = []; curLen = 0;
      }
      cur.push(node); curLen += t.length + 12;
    }
    if (cur.length) batches.push(cur);

    for (const batch of batches) {
      const marked = batch.map((n, i) => `[[[${i}]]]${n.textContent.trim()}`).join(' ');
      try {
        const translated = await translateText(marked);
        // Parse markers
        const regex = /\[\[\[(\d+)\]\]\]/g;
        const positions = [];
        let m;
        while ((m = regex.exec(translated)) !== null) {
          positions.push({ idx: parseInt(m[1]), end: regex.lastIndex });
        }
        for (let i = 0; i < positions.length; i++) {
          const start = positions[i].end;
          const end = i + 1 < positions.length
            ? translated.indexOf(`[[[${positions[i + 1].idx}]]]`, start)
            : translated.length;
          const t = translated.substring(start, end).trim();
          if (t && batch[positions[i].idx]) batch[positions[i].idx].textContent = t;
        }
      } catch (e) {
        console.warn('Batch failed, individual fallback:', e);
        for (const node of batch) {
          try {
            const t = await translateText(node.textContent.trim());
            if (t) node.textContent = t;
          } catch (e2) { /* skip */ }
        }
      }
    }
  }

  btn.addEventListener('click', async () => {
    if (isZH) {
      originals.forEach(o => { o.node.textContent = o.original; });
      btn.innerHTML = '中';
      btn.title = 'Translate to Chinese / 翻译为中文';
      btn.classList.remove('active');
      isZH = false;
      return;
    }

    const nodes = collect();
    originals = nodes.map(n => ({ node: n, original: n.textContent }));

    btn.classList.add('loading');
    btn.innerHTML = '⟳';

    try {
      await translateBatch(nodes);
    } catch (e) {
      console.error('Translation failed:', e);
    }

    btn.classList.remove('loading');
    btn.innerHTML = 'EN';
    btn.title = 'Back to English / 切换回英文';
    btn.classList.add('active');
    isZH = true;
  });
})();