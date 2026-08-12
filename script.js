/* ═══════════════════════════════════════════
   درر — Soft UI Edition
   ═══════════════════════════════════════════ */
(() => {
  'use strict';

  const CONFIG = {
    whatsapp: '201507794384',
    phone: '+201507794384',
    devWhatsapp: '249998989999'
  };

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
    'بخاخات درر':        'images/oud.jpg',
    'مرشات':             'images/marash.jpg'
  };

  const catImage = cat => {
    const c = (cat || '').trim();
    if (IMG[c]) return IMG[c];
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
    }
  }

  const getFiltered = () => state.products.filter(p =>
    state.activeCat === 'all' || p.category === state.activeCat);

  function buildChips() {
    const cats = [...new Set(state.products.map(p => p.category))];
    chipsBox.innerHTML = chipHTML('all', 'كل المنتجات', 0) +
      cats.map((c, i) => chipHTML(c, c, i + 1)).join('');
  }
  const chipHTML = (v, l, i) =>
    `<button type="button" class="chip${v === 'all' ? ' active' : ''}" data-cat="${v}" style="animation-delay:${i * 40}ms">${esc(l)}</button>`;

  chipsBox.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip) setActiveCat(chip.dataset.cat, true);
  });

  function buildCarousel() {
    const cats = [...new Set(state.products.map(p => p.category))];
    carousel.innerHTML = cats.map((c, i) => {
      const count = state.products.filter(p => p.category === c).length;
      return `
      <div class="cat-slide" data-cat="${c}" style="animation-delay:${i * 60}ms">
        <img src="${catImage(c)}" alt="${esc(c)}" loading="lazy">
        <span class="cat-count">${count}</span>
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

  function buildIndex(filtered) {
    const groups = new Map();
    filtered.forEach(p => {
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category).push(p);
    });
    indexBox.innerHTML = [...groups.entries()].map(([cat, items]) => `
      <div class="idx-group">
        <div class="idx-cat"><span>${esc(cat)}</span><span class="idx-count">${items.length}</span></div>
        ${items.map(p => `
          <button type="button" class="idx-item${p.id === state.selectedId ? ' active' : ''}" data-id="${p.id}">
            <span class="idx-thumb"><img src="${imgFor(p)}" onerror="${imgFallback(p)}" alt="" loading="lazy"></span>
            <span>${esc(p.name)}</span>
          </button>`).join('')}
      </div>`).join('');
  }

  function renderDetail(p) {
    const catProducts = state.products.filter(x => x.category === p.category);
    const prices = p.sizes.map(s => Number(s.price));
    const min = Math.min(...prices), max = Math.max(...prices);
    const waText = encodeURIComponent(`السلام عليكم، أرغب في طلب: ${p.name}`);

    detailBox.innerHTML = `
    <article class="detail-card">
      <div class="detail-top">
        <span class="badge">${esc(p.category)}</span>
        <span class="detail-count">${catProducts.length} منتج في الفئة</span>
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
        <div class="stat"><b>${p.sizes.length}</b><span>أحجام</span></div>
        <div class="stat"><b>${min}</b><span>يبدأ من</span></div>
        <div class="stat"><b>${max}</b><span>حتى</span></div>
      </div>
      <div class="table-wrap">
        <table class="price-table">
          <thead><tr><th>الحجم</th><th>السعر</th></tr></thead>
          <tbody>
            ${p.sizes.map(s =>
              `<tr><td>${esc(s.size)}</td><td>${esc(s.price)} ${currency}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card-actions">
        <button type="button" class="act-btn" data-copy>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          نسخ
        </button>
        <button type="button" class="act-btn" data-share>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
          مشاركة
        </button>
        <a class="act-btn wa" href="https://wa.me/${CONFIG.whatsapp}?text=${waText}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.34M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.89 9.88"/></svg>
          اطلبي الآن
        </a>
      </div>
      ${catProducts.length > 1 ? `
      <div class="related">
        <p class="related-title">منتجات أخرى في نفس الفئة</p>
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
    if (scrollToDetail && innerWidth < 1024) {
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

  $('#resetFilters').addEventListener('click', () => setActiveCat('all'));

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

  const productText = p =>
    `${p.name} — ${p.category}\n` +
    p.sizes.map(s => `${s.size} : ${s.price} ${currency}`).join('\n') +
    `\nدرر للعطور والبخور`;

  function copyProduct(p) {
    const text = productText(p);
    const done = () => showToast('تم نسخ البيانات');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done);
    else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove(); done();
    }
  }
  async function shareProduct(p) {
    if (navigator.share) {
      try { await navigator.share({ title: p.name, text: productText(p) }); } catch {}
    } else copyProduct(p);
  }

  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  // Mobile menu
  $('#mobileToggle').addEventListener('click', () => {
    $('.nav-links').classList.toggle('open');
  });
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
    $('.nav-links').classList.remove('open');
  }));

  // Contact links
  const waHref = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent('السلام عليكم، أرغب في الاستفسار')}`;
  ['#waFloat', '#waMain'].forEach(s => $(s).href = waHref);
  ['#phoneMain'].forEach(s => $(s).href = `tel:${CONFIG.phone}`);
  $('#year').textContent = new Date().getFullYear();
  $('#devWa').href = `https://wa.me/${CONFIG.devWhatsapp}?text=${encodeURIComponent('السلام عليكم، بخصوص تطوير موقع درر')}`;

  loadData();
})();
