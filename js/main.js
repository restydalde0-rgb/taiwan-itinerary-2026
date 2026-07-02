// ==============================================================
// TAIWANDER '26 — shared interactions (all pages)
// Every block guards for element existence so one file serves
// the whole site.
// ==============================================================

// ==============================================================
// PHP-FIRST MONEY ENGINE
// One rate drives every price on the site. Elements opt in with:
//   <span class="money" data-twd="140"></span>            → ₱270 / NT$140
//   <span class="money" data-twd="200" data-twd-max="250"> → ranges
//   <span class="money" data-twd="0">                      → "Free"
//   data-suffix="/ pax" adds a small note after the PHP figure.
// Tables with class "expense-table" get their data-twd rows summed
// into the tfoot .money[data-total] cell (ranges use the midpoint),
// so day totals and the trip summary can never drift out of sync.
// Tables flagged data-nosum are excluded from page grand totals.
// ==============================================================
const RATE = 1.93; // NT$1 = ₱1.93 (July 2026 estimate — update here only)

const phpFmt = v => '₱' + Math.round(v).toLocaleString('en-US');
const twdFmt = v => 'NT$' + Math.round(v).toLocaleString('en-US');

function renderMoney(el, twd, twdMax) {
  if (twd === 0 && !twdMax) {
    el.innerHTML = '<span class="m-free">Free</span>';
    return;
  }
  const php = twdMax ? phpFmt(twd * RATE) + '–' + phpFmt(twdMax * RATE) : phpFmt(twd * RATE);
  const nt = twdMax ? twdFmt(twd) + '–' + twdFmt(twdMax) : twdFmt(twd);
  const note = el.dataset.suffix ? ' <span class="m-note">' + el.dataset.suffix + '</span>' : '';
  el.innerHTML = '<b class="m-php">' + php + note + '</b><span class="m-twd">≈ ' + nt + '</span>';
}

document.querySelectorAll('.money[data-twd]').forEach(el => {
  renderMoney(el, parseFloat(el.dataset.twd), el.dataset.twdMax ? parseFloat(el.dataset.twdMax) : null);
});

document.querySelectorAll('.expense-table').forEach(table => {
  let sum = 0;
  // Only the amount column (last cell) counts — inline money mentions
  // in the description cell are informational, not line items.
  table.querySelectorAll('tbody td:last-child > .money[data-twd]').forEach(el => {
    const lo = parseFloat(el.dataset.twd);
    const hi = el.dataset.twdMax ? parseFloat(el.dataset.twdMax) : lo;
    sum += (lo + hi) / 2;
  });
  const totalEl = table.querySelector('.money[data-total]');
  if (totalEl) renderMoney(totalEl, Math.round(sum), null);
  // expose for cross-table grand totals (summary page)
  table.dataset.sum = Math.round(sum);
});

// Grand total across the page's expense tables (summary page)
const grandEls = document.querySelectorAll('.money[data-grand]');
if (grandEls.length) {
  let grand = 0;
  document.querySelectorAll('.expense-table:not([data-nosum])').forEach(t => { grand += parseFloat(t.dataset.sum || 0); });
  grandEls.forEach(el => {
    const div = parseFloat(el.dataset.divide || 1);
    renderMoney(el, Math.round(grand / div), null);
  });
}

// ---------- Theme (dark mode) ----------
const THEME_KEY = 'taiwan2026-theme';
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}
(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
})();
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });
}

// ---------- Page-load fade ----------
window.addEventListener('DOMContentLoaded', () => document.body.classList.add('loaded'));

// ---------- Mobile nav ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

// ---------- Nav shadow + back-to-top ----------
const nav = document.getElementById('nav');
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
  if (toTop) toTop.classList.toggle('show', window.scrollY > 600);
}, { passive: true });
if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ---------- Reveal-on-scroll ----------
const revealer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealer.observe(el));

// ---------- Countdown to departure (home) ----------
const cdEl = document.getElementById('countdown');
if (cdEl) {
  // MNL departure: Mon 17 Aug 2026, 11:35 PM (UTC+8)
  const target = new Date('2026-08-17T23:35:00+08:00').getTime();
  const cells = {
    d: document.getElementById('cdD'), h: document.getElementById('cdH'),
    m: document.getElementById('cdM'), s: document.getElementById('cdS')
  };
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      cdEl.innerHTML = '<div class="cd-cell"><div class="n">🏮</div><div class="l">Enjoy Taipei!</div></div>';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    cells.d.textContent = d;
    cells.h.textContent = String(h).padStart(2, '0');
    cells.m.textContent = String(m).padStart(2, '0');
    cells.s.textContent = String(s).padStart(2, '0');
    setTimeout(tick, 1000);
  }
  tick();

  // "N sleeps until…" headline in the CTA band
  const sleepsTitle = document.getElementById('sleepsTitle');
  if (sleepsTitle) {
    const days = Math.ceil((target - Date.now()) / 86400000);
    if (days > 0) sleepsTitle.textContent = `${days} sleep${days === 1 ? '' : 's'} until soy milk & sky lanterns 🏮`;
  }
}

// ---------- Animated counters (budget KPIs) ----------
const counters = document.querySelectorAll('[data-count]');
if (counters.length) {
  const fmt = new Intl.NumberFormat('en-US');
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      counterObs.unobserve(e.target);
      const el = e.target;
      const end = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const dur = 1300;
      const t0 = performance.now();
      function step(t) {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + fmt.format(Math.round(end * eased)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => counterObs.observe(c));
}

// ---------- Donut chart (budget) ----------
// Renders from the legend's data-value attributes so the visible
// legend is the single source of truth (chart never gates values).
const donutSvg = document.getElementById('donutSvg');
const donutLegend = document.getElementById('donutLegend');
if (donutSvg && donutLegend) {
  const items = [...donutLegend.querySelectorAll('li')];
  const values = items.map(li => parseFloat(li.dataset.value));
  const colors = items.map(li => li.dataset.color);
  const total = values.reduce((a, b) => a + b, 0);
  const R = 80, C = 2 * Math.PI * R, GAP = 2.5;
  const NS = 'http://www.w3.org/2000/svg';
  let offset = 0;
  values.forEach((v, i) => {
    const len = (v / total) * C;
    const seg = document.createElementNS(NS, 'circle');
    seg.setAttribute('class', 'seg');
    seg.setAttribute('cx', 100); seg.setAttribute('cy', 100); seg.setAttribute('r', R);
    seg.setAttribute('stroke', `var(${colors[i]})`);
    seg.setAttribute('stroke-dasharray', `${Math.max(len - GAP, 0.5)} ${C - len + GAP}`);
    seg.setAttribute('stroke-dashoffset', -offset);
    seg.setAttribute('transform', 'rotate(-90 100 100)');
    seg.setAttribute('tabindex', '0');
    const name = items[i].querySelector('.nm').textContent;
    const title = document.createElementNS(NS, 'title');
    title.textContent = `${name}: ${phpFmt(values[i] * RATE)} (NT$${values[i].toLocaleString()}) · ${(v / total * 100).toFixed(1)}%`;
    seg.appendChild(title);
    // legend ↔ segment cross-highlight
    seg.addEventListener('mouseenter', () => { donutSvg.classList.add('dim'); items[i].style.background = 'var(--surface-2)'; });
    seg.addEventListener('mouseleave', () => { donutSvg.classList.remove('dim'); items[i].style.background = ''; });
    items[i].addEventListener('mouseenter', () => { donutSvg.classList.add('dim'); seg.style.opacity = '1'; seg.style.strokeWidth = '32'; });
    items[i].addEventListener('mouseleave', () => { donutSvg.classList.remove('dim'); seg.style.opacity = ''; seg.style.strokeWidth = ''; });
    donutSvg.insertBefore(seg, donutSvg.querySelector('text'));
    offset += len;
  });
  // fill % labels in legend
  items.forEach((li, i) => {
    const pct = li.querySelector('.pct');
    if (pct) pct.textContent = (values[i] / total * 100).toFixed(0) + '%';
  });
}

// ---------- Daily-spend horizontal bars ----------
const hbars = document.querySelectorAll('.hb-fill[data-width]');
if (hbars.length) {
  const barObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.width + '%';
        barObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  hbars.forEach(b => barObs.observe(b));
}

// ---------- Currency converter (rate shared with money engine) ----------
const twdInput = document.getElementById('twdInput');
const phpInput = document.getElementById('phpInput');
if (twdInput && phpInput) {
  twdInput.addEventListener('input', () => {
    const v = parseFloat(twdInput.value);
    phpInput.value = isNaN(v) ? '' : (v * RATE).toFixed(2);
  });
  phpInput.addEventListener('input', () => {
    const v = parseFloat(phpInput.value);
    twdInput.value = isNaN(v) ? '' : (v / RATE).toFixed(2);
  });
}

// ---------- Packing checklist with localStorage ----------
const checks = document.querySelectorAll('[data-check]');
if (checks.length) {
  const bar = document.getElementById('checkBar');
  const label = document.getElementById('checkLabel');
  const STORE_KEY = 'taiwan2026-packing';

  function loadChecks() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) {}
    checks.forEach(c => { c.checked = !!saved[c.dataset.check]; });
  }
  function saveChecks() {
    const state = {};
    checks.forEach(c => { state[c.dataset.check] = c.checked; });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function updateProgress() {
    const done = [...checks].filter(c => c.checked).length;
    if (bar) bar.style.width = (done / checks.length * 100) + '%';
    if (label) label.textContent = done === checks.length
      ? '🎉 All packed — Taipei is waiting!'
      : `${done} of ${checks.length} packed`;
  }
  checks.forEach(c => c.addEventListener('change', () => { saveChecks(); updateProgress(); }));
  loadChecks();
  updateProgress();
}
