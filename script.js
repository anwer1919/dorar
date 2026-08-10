/* ═══════════════════════════════════════════
   درر للعطور والبخور — script.js (بدون بحث)
   ═══════════════════════════════════════════ */
(() => {
  'use strict';

  const CONFIG = {
    whatsapp: '201507794384',      // واتساب الصفحة الأساسي (الطلبات)
    phone: '+201507794384',        // هاتف الصفحة الأساسي
    devWhatsapp: '249998989999'    // واتساب المطور anwer ahmed
  };

  /* ── صورة خاصة لكل تصنيف ── */
  const IMG = {
    'الخمرة السودانية':  'images/khomra.jpg',
    'الخمر الفرنسية':     'images/french.jpg',
    'الدلكة السودانية':  'images/dilka.jpg',
    'دلكة محلب':         'images/dilka-mahlab.jpg',
    'بخورات الشاف':      'images/bakhoor.jpg',
    'بخورات العنفر':     'images/anbar.jpg',
    'بخورات الصندل':     'images/sandal.jpg',
    'بخورات القهوه':     'images/oud-haram.jpg',
    'مخمريات نسائيه':    'images/mukh.jpg',
    'لمسة محلب':         'images/lamsa.jpg',
    'بخاخات درر':        'images/french.jpg',
    'مرشات':             'images/lamsa.jpg'
  };

  const catImage = cat => {
    const c = (cat || '').trim();
    if (IMG[c]) return IMG[c];
    if (c.includes('فرنسية')) return IMG['الخمر الفرنسية'];
    if (c.includes('دلكة') && c.includes('محلب')) return IMG['دلكة محلب'];
    if (c.includes('دلكة'))   return IMG['الدلكة السودانية'];
    if (c.includes('عنفر'))   return IMG['بخورات العنفر'];
    if (c.includes('صندل'))   return IMG['بخورات الصندل'];
    if (c.includes('شاف'))    return IMG['بخورات الشاف'];
    if (c.includes('قهوه') || c.includes('بخور')) return IMG['بخورات القهوه'];
    if (c.includes('مخمر'))   return IMG['مخمريات نسائيه'];
    if (c.includes('بخاخ'))   return IMG['بخاخات درر'];
    if (c.includes('مرش'))    return IMG['مرشات'];
    if (c.includes('لمسة'))   return IMG['لمسة محلب'];
    if (c.includes('خمرة'))   return IMG['الخمرة السودانية'];
    return 'logo.png';
  };

  const imgFor = p => p.image || `images/${p.id}.jpg`;
  const imgFallback = p => `this.onerror=null;this.src='${catImage(p.category)}'`;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const state = { products: [], byId: new Map(), activeCat: 'all', selectedId: null };
  let currency = 'جنيه';

  const indexBox = $('#catalogIndex'), detailBox = $('#catalogDetail'),
        layout = $('#catalogLayout'), chipsBox = $('#chips'), emptyBox = $('#empty'),
        toast = $('#toast'),
        carousel = $('#catCarousel');

  let suppressScroll = false;

  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

  /* ── تحميل البيانات ── */
  async function loadData() {
    try {
      const res = await fetch('products.json');
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      currency = data.currency || 'جنيه';
      state.products = data.products.map(p => ({ ...p }));
      state.products.forEach(p => state.byId.set(p.id, p));
      buildChips();
      buildCarousel();
      applyFilters(true);
    } catch {
      layout.hidden = true;
      emptyBox.hidden = false;
      emptyBox.querySelector('p').textContent = 'تعذّر تحميل قائمة المنتجات — افتح الموقع عبر خادم محلي (Live Server)';
    } finally { hideLoader(); }
  }

  const getFiltered = () => state.products.filter(p =>
    (state.activeCat === 'all' || p.category === state.activeCat));

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
    if (chip) setActiveCat(chip.dataset.cat, true);
  });

  /* ── الكاروسيل ── */
  function buildCarousel() {
    const cats = [...new Set(state.products.map(p => p.category))];
    carousel.innerHTML = cats.map((c, i) => {
      const count = state.products.filter(p => p.category === c).length;
      return `
      <div class="cat-slide" data-cat="${c}" style="animation-delay:${i * 60}ms">
        <img src="${catImage(c)}" alt="${esc(c)}" loading="lazy">
        <span class="cat-count">${count} منتج</span>
        <span class="cat-slide-name">${esc(c)}</span>
      </div>`;
    }).join('');
  }

  carousel.addEventListener('click', e => {
    const slide = e.target.closest('.cat-slide');
    if (slide) setActiveCat(slide.dataset.cat, true);
  });

  let scrollTimer;
  carousel.addEventListener('scroll', () => {
    if (suppressScroll) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const r0 = carousel.getBoundingClientRect();
      const center = r0.left + r0.width / 2;
      let best = null, bestD = Infinity;
      carousel.querySelectorAll('.cat-slide').forEach(s => {
        const r = s.getBoundingClientRect();
        const d = Math.abs((r.left + r.width / 2) - center);
        if (d < bestD) { bestD = d; best = s; }
      });
      if (best && best.dataset.cat !== state.activeCat) {
        state.activeCat = best.dataset.cat;
        $$('.chip').forEach(c => c.classList.toggle('active', c.dataset.cat === state.activeCat));
        $$('.cat-slide').forEach(s => s.classList.toggle('active', s === best));
        applyFilters();
      }
    }, 120);
  }, { passive: true });

  function setActiveCat(cat, scrollCarousel = false) {
    state.activeCat = cat;
    $$('.chip').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
    $$('.cat-slide').forEach(s => s.classList.toggle('active', s.dataset.cat === cat));
    if (scrollCarousel && cat !== 'all') {
      const el = carousel.querySelector(`.cat-slide[data-cat="${cat}"]`);
      if (el) {
        suppressScroll = true;
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        setTimeout(() => suppressScroll = false, 800);
      }
    }
    applyFilters();
  }

  /* ── قائمة المنتجات مع صور مصغرة ── */
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
            <span class="idx-thumb"><img src="${imgFor(p)}" onerror="${imgFallback(p)}" alt="" loading="lazy"></span>
            <span>${esc(p.name)}</span>
          </button>`).join('')}
      </div>`).join('');
  }

  /* ── لوحة التفاصيل مع الصورة ── */
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
      <div class="detail-media">
        <img class="detail-img" src="${imgFor(p)}" onerror="${imgFallback(p)}" alt="${esc(p.name)}">
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

  function select(id, scrollToDetail = false) {
    state.selectedId = id;
    $$('.idx-item').forEach(b => b.classList.toggle('active', b.dataset.id === id));
    renderDetail(state.byId.get(id));
    if (scrollToDetail && innerWidth < 920) {
      detailBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function applyFilters(initial = false) {
    const filtered = getFiltered();

    if (!filtered.length) {
      layout.hidden = true; emptyBox.hidden = false; return;
    }
    layout.hidden = false; emptyBox.hidden = true;
    buildIndex(filtered);

    const stillVisible = filtered.some(p => p.id === state.selectedId);
    if (initial || !stillVisible) select(filtered[0].id);
  }

  $('#resetFilters').addEventListener('click', () => {
    setActiveCat('all');
  });

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

  /* ── روابط التواصل ── */
  const waHref = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent('السلام عليكم، أرغب في الاستفسار عن منتجات درر للعطور والبخور')}`;
  ['#waFloat', '#waLink'].forEach(s => $(s).href = waHref);
  ['#phoneFloat', '#phoneLink'].forEach(s => $(s).href = `tel:${CONFIG.phone}`);
  $('#year').textContent = new Date().getFullYear();
  $('#devWa').href = `https://wa.me/${CONFIG.devWhatsapp}?text=${encodeURIComponent('السلام عليكم، بخصوص تطوير موقع درر للعطور والبخور')}`;

  function hideLoader() { setTimeout(() => $('#loader').classList.add('done'), 450); }

  loadData();
})();
