/* =========================================================
   درر للعطور والبخور — Application Logic
   ========================================================= */

const STORE_PHONE = '01143554422';
const STORE_INSTAGRAM = 'durar_store2021';

const state = {
  products: [],
  activeCategory: 'كل المنتجات',
  searchTerm: '',
  openCardId: null,
};

const els = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheEls();
  buildParticles();
  bindHeaderScroll();
  bindDarkMode();
  bindBackToTop();
  bindFabActions();
  bindSearch();

  try {
    const res = await fetch('products.json');
    state.products = await res.json();
  } catch (err) {
    console.error('Failed to load products.json', err);
    state.products = [];
  }

  buildFilters();
  renderProducts();
  finishLoading();
  observeReveals();
}

function cacheEls() {
  els.loadingScreen = document.getElementById('loading-screen');
  els.header = document.querySelector('header.site-header');
  els.searchInput = document.getElementById('search-input');
  els.searchClear = document.getElementById('search-clear');
  els.resultCount = document.getElementById('result-count');
  els.filtersWrap = document.getElementById('filters-wrap');
  els.productsSection = document.getElementById('products-section');
  els.darkToggle = document.getElementById('dark-toggle');
  els.backToTop = document.getElementById('back-to-top');
  els.toast = document.getElementById('toast');
  els.particles = document.getElementById('particles');
  els.whatsappFab = document.getElementById('whatsapp-fab');
  els.phoneFab = document.getElementById('phone-fab');
}

/* ---------- Loading Screen ---------- */
function finishLoading() {
  setTimeout(() => {
    els.loadingScreen.classList.add('hidden');
  }, 550);
}

/* ---------- Floating Particles ---------- */
function buildParticles() {
  const count = window.innerWidth < 640 ? 14 : 26;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = 4 + Math.random() * 10;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    p.style.animationDuration = (10 + Math.random() * 14) + 's';
    p.style.animationDelay = (Math.random() * 12) + 's';
    els.particles.appendChild(p);
  }
}

/* ---------- Sticky Header Shadow ---------- */
function bindHeaderScroll() {
  window.addEventListener('scroll', () => {
    els.header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* ---------- Dark Mode ---------- */
function bindDarkMode() {
  const saved = localStorage.getItem('durar-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    setThemeIcon(true);
  }
  els.darkToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('durar-theme', isDark ? 'dark' : 'light');
    setThemeIcon(isDark);
  });
}
function setThemeIcon(isDark) {
  els.darkToggle.innerHTML = isDark ? iconSun() : iconMoon();
}

/* ---------- Back to Top ---------- */
function bindBackToTop() {
  window.addEventListener('scroll', () => {
    els.backToTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  els.backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- Floating Contact Buttons ---------- */
function bindFabActions() {
  els.whatsappFab.href = `https://wa.me/2${STORE_PHONE}`;
  els.phoneFab.href = `tel:${STORE_PHONE}`;
}

/* ---------- Search ---------- */
function bindSearch() {
  els.searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value.trim();
    els.searchClear.classList.toggle('show', state.searchTerm.length > 0);
    renderProducts();
  });
  els.searchClear.addEventListener('click', () => {
    els.searchInput.value = '';
    state.searchTerm = '';
    els.searchClear.classList.remove('show');
    renderProducts();
    els.searchInput.focus();
  });
}

function normalizeArabic(str) {
  return str
    .toString()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .toLowerCase()
    .trim();
}

function matchesSearch(product, term) {
  if (!term) return true;
  const norm = normalizeArabic(term);
  const numeric = term.replace(/[^\d]/g, '');

  const haystacks = [
    product.name,
    product.group,
    product.category,
    ...(product.keywords || []),
  ].map(normalizeArabic);

  if (haystacks.some((h) => h.includes(norm))) return true;

  // Match sizes (e.g. "10 مل", "500 جرام")
  const sizeMatch = product.sizes.some((s) => normalizeArabic(s.size).includes(norm));
  if (sizeMatch) return true;

  // Match pure numeric queries against size numbers or price
  if (numeric) {
    const priceMatch = product.sizes.some((s) => s.price === numeric || s.price.includes(numeric));
    const sizeNumMatch = product.sizes.some((s) => s.size.replace(/[^\d]/g, '') === numeric);
    if (priceMatch || sizeNumMatch) return true;
  }

  return false;
}

/* ---------- Filters ---------- */
function buildFilters() {
  const categories = ['كل المنتجات', ...new Set(state.products.map((p) => p.category))];
  els.filtersWrap.innerHTML = '';
  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === state.activeCategory ? ' active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      state.activeCategory = cat;
      [...els.filtersWrap.children].forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderProducts();
    });
    els.filtersWrap.appendChild(chip);
  });
}

/* ---------- Render Products ---------- */
function renderProducts() {
  const filtered = state.products.filter((p) => {
    const catOk = state.activeCategory === 'كل المنتجات' || p.category === state.activeCategory;
    const searchOk = matchesSearch(p, state.searchTerm);
    return catOk && searchOk;
  });

  els.resultCount.textContent = state.searchTerm
    ? `${filtered.length} نتيجة لـ "${state.searchTerm}"`
    : '';

  els.productsSection.innerHTML = '';

  if (filtered.length === 0) {
    els.productsSection.innerHTML = `
      <div class="no-results">
        ${iconSearchOff()}
        <p>لا توجد منتجات مطابقة لبحثك</p>
      </div>`;
    return;
  }

  // Group by category so each selected category renders as its own item-list table
  const byCategory = groupBy(filtered, 'category');
  Object.keys(byCategory).forEach((catName) => {
    if (state.activeCategory === 'كل المنتجات' && !state.searchTerm) {
      const heading = document.createElement('h2');
      heading.className = 'category-heading reveal';
      heading.textContent = catName;
      els.productsSection.appendChild(heading);
    }
    els.productsSection.appendChild(buildItemTable(byCategory[catName]));
  });

  observeReveals();
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
}

/* ---------- Item List Table ---------- */
function buildItemTable(products) {
  const wrap = document.createElement('div');
  wrap.className = 'item-table-wrap reveal';

  const table = document.createElement('table');
  table.className = 'item-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th class="col-image">الصورة</th>
        <th class="col-name">المنتج</th>
        <th class="col-sizes">الأحجام والأسعار</th>
        <th class="col-actions">إجراءات</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  products.forEach((product) => tbody.appendChild(buildItemRow(product)));

  wrap.appendChild(table);
  return wrap;
}

function buildItemRow(product) {
  const tr = document.createElement('tr');
  tr.className = 'item-row';
  tr.dataset.id = product.id;

  const minPrice = Math.min(...product.sizes.map((s) => parseInt(s.price, 10)));

  tr.innerHTML = `
    <td class="col-image" data-label="الصورة">
      <div class="item-icon">${getCategoryIcon(product.category)}</div>
    </td>
    <td class="col-name" data-label="المنتج">
      <div class="item-eyebrow">${escapeHtml(product.group)}</div>
      <div class="item-name">${escapeHtml(product.name)}</div>
      <span class="meta-pill">من ${minPrice} جنيه</span>
    </td>
    <td class="col-sizes" data-label="الأحجام والأسعار">
      <div class="size-chips">
        ${product.sizes.map((s) => `
          <span class="size-chip">
            <span class="size-chip-size">${escapeHtml(s.size)}</span>
            <span class="size-chip-price">${escapeHtml(s.price)} جنيه</span>
          </span>`).join('')}
      </div>
    </td>
    <td class="col-actions" data-label="إجراءات">
      <div class="row-actions">
        <button class="mini-btn copy-btn">${iconCopy()} نسخ</button>
        <button class="mini-btn share-btn">${iconShare()} مشاركة</button>
      </div>
    </td>
  `;

  tr.querySelector('.copy-btn').addEventListener('click', () => copyProduct(product));
  tr.querySelector('.share-btn').addEventListener('click', () => shareProduct(product));

  return tr;
}

/* ---------- Category Icon Medallions ---------- */
function getCategoryIcon(category) {
  const icons = {
    'البخور': `<svg viewBox="0 0 64 64" fill="none"><path d="M32 8c-2 5-1 7 1 9s3 5 1 7-5 2-6-1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 46h24l-3 8H23l-3-8z" fill="currentColor" opacity="0.15"/><path d="M20 46h24l-3 8H23l-3-8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><ellipse cx="32" cy="46" rx="12" ry="3" stroke="currentColor" stroke-width="2"/><path d="M26 30c0-5 3-8 6-8s6 3 6 8" stroke="currentColor" stroke-width="1.6" opacity="0.6"/></svg>`,
    'الدلكة': `<svg viewBox="0 0 64 64" fill="none"><rect x="18" y="24" width="28" height="26" rx="6" fill="currentColor" opacity="0.12"/><rect x="18" y="24" width="28" height="26" rx="6" stroke="currentColor" stroke-width="2"/><path d="M24 24v-4a8 8 0 0116 0v4" stroke="currentColor" stroke-width="2"/><path d="M24 34h16M24 40h16" stroke="currentColor" stroke-width="1.6" opacity="0.55"/></svg>`,
    'الخمر الفرنسية': `<svg viewBox="0 0 64 64" fill="none"><rect x="24" y="10" width="16" height="8" rx="2" stroke="currentColor" stroke-width="2"/><path d="M27 18v6h10v-6" stroke="currentColor" stroke-width="2"/><path d="M20 24h24l2 6v22a4 4 0 01-4 4H22a4 4 0 01-4-4V30l2-6z" fill="currentColor" opacity="0.12"/><path d="M20 24h24l2 6v22a4 4 0 01-4 4H22a4 4 0 01-4-4V30l2-6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M22 38h20" stroke="currentColor" stroke-width="1.6" opacity="0.5"/></svg>`,
    'المرشات': `<svg viewBox="0 0 64 64" fill="none"><rect x="27" y="8" width="8" height="10" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M35 12h5a2 2 0 012 2v2a2 2 0 01-2 2h-5" stroke="currentColor" stroke-width="2"/><path d="M22 22h18l3 6v26a4 4 0 01-4 4H23a4 4 0 01-4-4V28l3-6z" fill="currentColor" opacity="0.12"/><path d="M22 22h18l3 6v26a4 4 0 01-4 4H23a4 4 0 01-4-4V28l3-6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M44 10l4-2M45 14h4M44 18l4 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/></svg>`,
    'الخمرة السودانية': `<svg viewBox="0 0 64 64" fill="none"><path d="M28 8h8v8h-8z" stroke="currentColor" stroke-width="2"/><path d="M26 16h12l4 8v28a4 4 0 01-4 4H26a4 4 0 01-4-4V24l4-8z" fill="currentColor" opacity="0.12"/><path d="M26 16h12l4 8v28a4 4 0 01-4 4H26a4 4 0 01-4-4V24l4-8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><ellipse cx="32" cy="32" rx="7" ry="9" stroke="currentColor" stroke-width="1.6" opacity="0.55"/></svg>`,
    'المخمريات': `<svg viewBox="0 0 64 64" fill="none"><path d="M26 10h12l-1 10-4 4-4-4-3-10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M23 34c0-6 4-10 9-10s9 4 9 10v16a4 4 0 01-4 4H27a4 4 0 01-4-4V34z" fill="currentColor" opacity="0.12"/><path d="M23 34c0-6 4-10 9-10s9 4 9 10v16a4 4 0 01-4 4H27a4 4 0 01-4-4V34z" stroke="currentColor" stroke-width="2"/><path d="M23 42h18" stroke="currentColor" stroke-width="1.6" opacity="0.5"/></svg>`,
  };
  return icons[category] || icons['الخمرة السودانية'];
}

/* ---------- Copy / Share ---------- */
function productText(product) {
  const lines = product.sizes.map((s) => `${s.size} — ${s.price} جنيه`).join('\n');
  return `${product.name}\n${lines}\n\nدرر للعطور والبخور\n📞 ${STORE_PHONE}`;
}

function copyProduct(product) {
  const text = productText(product);
  navigator.clipboard?.writeText(text).then(() => {
    showToast('تم نسخ تفاصيل المنتج');
  }).catch(() => {
    showToast('تعذر النسخ، حاول مرة أخرى');
  });
}

function shareProduct(product) {
  const text = productText(product);
  if (navigator.share) {
    navigator.share({ title: product.name, text }).catch(() => {});
  } else {
    copyProduct(product);
  }
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

/* ---------- Reveal on Scroll ---------- */
let revealObserver;
function observeReveals() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  }
  document.querySelectorAll('.reveal:not(.visible)').forEach((el) => revealObserver.observe(el));
}

/* ---------- Utils ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Inline Icons ---------- */
function iconChevron() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>`;
}
function iconCopy() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;
}
function iconShare() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>`;
}
function iconSearchOff() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 8l6 6M14 8l-6 6"/></svg>`;
}
function iconSun() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
}
function iconMoon() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
}
