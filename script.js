/* ═══════════════════════════════════════════
   درر للعطور والبخور — script.js (v2 Catalog)
   ═══════════════════════════════════════════ */
(() => {
  'use strict';

  /* ── الإعدادات: غيّر الأرقام هنا ── */
  const CONFIG = {
    whatsapp: '+201507794284',
    phone: '+201507794284'
  };

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const state = { products: [], byId: new Map(), activeCat: 'all', query: '', selectedId: null };
  let currency = 'جنيه';

  const indexBox = $('#catalogIndex'), detailBox = $('#catalogDetail'),
        layout = $('#catalogLayout'), chipsBox = $('#chips'), emptyBox = $('#empty'),
        input = $('#searchInput'), clearBtn = $('#searchClear'),
        countEl = $('#resultCount'), toast = $('#toast');

  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

  /* ── تطبيع النص العربي للبحث الذكي ── */
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const normalize = t => (t || '').toString()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, d => AR.indexOf(d))
    .trim();

  /* ── تحميل البيانات ── */
  async function loadData() {
    try {
      const res = await fetch('products.json');
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      currency = data.currency || 'جنيه';
      state.products = data.products.map(p => ({
        ...p,
        _search: normalize([p.name, p.category, p.tagline, p.weight,
          ...(p.keywords || []), ...p.sizes.flatMap(s => [s.size, s.price])].join(' '))
      }));
      state.products.forEach(p => state.byId.set(p.id, p));
      buildChips();
      applyFilters(true);
    } catch {
      layout.hidden = true;
      emptyBox.hidden = false;
      emptyBox.querySelector('p').textContent = 'تعذّر تحميل قائمة المنتجات — افتح الموقع عبر خادم محلي (Live Server)';
    } finally { hideLoader(); }
  }

  /* ── النتائج بعد الفلترة ── */
  const getFiltered = () => state.products.filter(p =>
    (state.activeCat === 'all' || p.category === state.activeCat) &&
    (!state.query || p._search.includes(state.query)));

  /* ── الفلاتر العلوية ── */
  function buildChips() {
    const cats = [...new Set(state.products.map(p => p.category))];
    chipsBox.innerHTML = chipHTML('all', 'كل المنتجات', 0) +
      cats.map((c, i) => chipHTML(c, c, i + 1)).join('');
  }
  const chipHTML = (v, l, i) =>
    `<button type="button" class="chip${v === 'all' ? ' active' : ''}" data-cat="${v}" style="animation-delay:${i * 60}ms">${esc(l)}</button>`;

  chipsBox.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.activeCat = chip.dataset.cat;
    applyFilters();
  });

  /* ── قائمة المنتجات (Index) مجمّعة بالفئات ── */
  function buildIndex(filtered) {
    const groups = new Map();
    filtered.forEach(p => {
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category).push(p);
    });
    let i = 0;
    indexBox.innerHTML = [...groups.entries()].map(([cat, items]) => `
      <div class="idx-group">
        <div class="idx-cat"><span>✦ ${esc(cat)}</span><span class="idx-count">${items.length}</span></div>
        ${items.map(p => `
          <button type="button" class="idx-item${p.id === state.selectedId ? ' active' : ''}"
                  data-id="${p.id}" style="animation-delay:${Math.min(i++ * 40, 400)}ms">
            <span class="idx-dot" aria-hidden="true">✦</span><span>${esc(p.name)}</span>
          </button>`).join('')}
      </div>`).join('');
  }

  /* ── لوحة التفاصيل ── */
  function renderDetail(p) {
    const catProducts = state.products.filter(x => x.category === p.category);
    const prices = p.sizes.map(s => Number(s.price));
    const min = Math.min(...prices), max = Math.max(...prices);
    const waText = encodeURIComponent(`السلام عليكم، أرغب في طلب: ${p.name} — درر للعطور والبخور`);

    detailBox.innerHTML = `
    <article class="detail-card">
      <div class="detail-top">
        <span class="badge">✦ ${esc(p.category)}</span>
        <span class="detail-count">${catProducts.length} منتجات في هذه الفئة</span>
      </div>
      <h3 class="detail-name">${esc(p.name)}</h3>
      <p class="detail-tag">${esc(p.tagline)}</p>
      <div class="detail-keywords">
        ${(p.keywords || []).map(k => `<span class="kw">${esc(k)}</span>`).join('')}
        ${p.weight ? `<span class="kw">${esc(p.weight)}</span>` : ''}
      </div>
      <div class="detail-stats">
        <div class="stat"><b>${p.sizes.length}</b><span>أحجام متوفرة</span></div>
        <div class="stat"><b>${min}</b><span>أقل سعر (${currency})</span></div>
        <div class="stat"><b>${max}</b><span>أعلى سعر (${currency})</span></div>
      </div>
      <div class="table-wrap">
        <table class="price-table">
          <thead><tr><th scope="col">الحجم</th><th scope="col">السعر</th></tr></thead>
          <tbody>
            ${p.sizes.map((s, i) =>
              `<tr style="--i:${i}"><td>${esc(s.size)}</td><td>${esc(s.price)} ${currency}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card-actions">
        <button type="button" class="act-btn" data-copy aria-label="نسخ بيانات ${esc(p.name)}">
          <svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
          نسخ
        </button>
        <button type="button" class="act-btn" data-share aria-label="مشاركة ${esc(p.name)}">
          <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.7l6.8-4.4M8.6 13.3l6.8 4.4"/></svg>
          مشاركة
        </button>
        <a class="act-btn wa" href="https://wa.me/${CONFIG.whatsapp}?text=${waText}"
           target="_blank" rel="noopener" aria-label="طلب ${esc(p.name)} عبر واتساب">
          <svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9.6 8.4L5 21l1.2-5.4A8.5 8.5 0 1 1 21 11.5z"/></svg>
          اطلب الآن
        </a>
      </div>
      ${catProducts.length > 1 ? `
      <div class="related">
        <p class="related-title">✦ منتجات أخرى في فئة ${esc(p.category)}</p>
        <div class="related-list">
          ${catProducts.filter(x => x.id !== p.id)
            .map(x => `<button type="button" class="related-btn" data-id="${x.id}">${esc(x.name)}</button>`).join('')}
        </div>
      </div>` : ''}
    </article>`;
  }

  /* ── اختيار منتج ── */
  function select(id, scrollToDetail = false) {
    state.selectedId = id;
    $$('.idx-item').forEach(b => b.classList.toggle('active', b.dataset.id === id));
    renderDetail(state.byId.get(id));
    if (scrollToDetail && innerWidth < 920) {
      detailBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ── تطبيق البحث والفلاتر ── */
  function applyFilters(initial = false) {
    const filtered = getFiltered();
    countEl.textContent = filtered.length ? `${filtered.length} منتج` : '';
    clearBtn.hidden = !input.value;

    if (!filtered.length) {
      layout.hidden = true; emptyBox.hidden = false; return;
    }
    layout.hidden = false; emptyBox.hidden = true;
    buildIndex(filtered);

    const stillVisible = filtered.some(p => p.id === state.selectedId);
    if (initial || !stillVisible) select(filtered[0].id);
  }

  input.addEventListener('input', () => { state.query = normalize(input.value); applyFilters(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; state.query = ''; applyFilters(); }
  });
  clearBtn.addEventListener('click', () => { input.value = ''; state.query = ''; applyFilters(); input.focus(); });
  $$('.example-chip').forEach(b => b.addEventListener('click', () => {
    input.value = b.dataset.q; state.query = normalize(b.dataset.q); applyFilters(); input.focus();
  }));
  $('#resetFilters').addEventListener('click', () => {
    input.value = ''; state.query = ''; state.activeCat = 'all';
    $$('.chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
    applyFilters();
  });

  /* ── نقرات القائمة والتفاصيل ── */
  indexBox.addEventListener('click', e => {
    const item = e.target.closest('.idx-item');
    if (item) select(item.dataset.id, true);
  });

  detailBox.addEventListener('click', e => {
    const rel = e.target.closest('.related-btn');
    if (rel) { select(rel.dataset.id); return; }
    const p = state.byId.get(state.selectedId);
    if (!p) return;
    if (e.target.closest('[data-copy]')) copyProduct(p);
    if (e.target.closest('[data-share]')) shareProduct(p);
  });

  /* ── نسخ ومشاركة ── */
  const productText = p =>
    `${p.name} — ${p.category}\n` +
    p.sizes.map(s => `${s.size} : ${s.price} ${currency}`).join('\n') +
    `\n✦ درر للعطور والبخور`;

  function copyProduct(p) {
    const text = productText(p);
    const done = () => showToast('تم نسخ بيانات المنتج ✦');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done);
    else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove(); done();
    }
  }
  async function shareProduct(p) {
    if (navigator.share) {
      try { await navigator.share({ title: p.name, text: productText(p) }); } catch { /* أُلغيت */ }
    } else copyProduct(p);
  }

  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ── الوضع الليلي ── */
  const setTheme = t => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('durar-theme', t); } catch { /* خاص */ }
  };
  setTheme((() => {
    try {
      return localStorage.getItem('durar-theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch { return 'light'; }
  })());
  $('#themeToggle').addEventListener('click', () =>
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

  /* ── الجزيئات العائمة ── */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const box = $('#particles');
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('span');
      const size = 3 + Math.random() * 7;
      s.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;
        animation-duration:${7 + Math.random() * 10}s;animation-delay:${Math.random() * 9}s;`;
      box.appendChild(s);
    }
  }

  /* ── التمرير ── */
  const header = $('#siteHeader'), backTop = $('#backTop');
  addEventListener('scroll', () => {
    header.classList.toggle('scrolled', scrollY > 12);
    backTop.hidden = scrollY < 500;
  }, { passive: true });
  backTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  const io = new IntersectionObserver(entries =>
    entries.forEach(en => en.isIntersecting && en.target.classList.add('inview')),
    { threshold: 0.12 });
  $$('.fade-section').forEach(el => io.observe(el));

  /* ── التواصل ── */
  const waHref = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent('السلام عليكم، أرغب في الاستفسار عن منتجات درر للعطور والبخور')}`;
  ['#waFloat', '#waLink'].forEach(s => $(s).href = waHref);
  ['#phoneFloat', '#phoneLink'].forEach(s => $(s).href = `tel:${CONFIG.phone}`);
  $('#year').textContent = new Date().getFullYear();

  function hideLoader() { setTimeout(() => $('#loader').classList.add('done'), 450); }

  loadData();
})();
