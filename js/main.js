// ============================================
// TAIWAN 2026 — interactions
// ============================================

// ---------- Mobile nav ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// ---------- Nav shadow + back-to-top ----------
const nav = document.getElementById('nav');
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
  toTop.classList.toggle('show', window.scrollY > 600);
}, { passive: true });
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ---------- Scroll-spy: highlight active section ----------
const sections = document.querySelectorAll('section[id], header[id]');
const linkMap = {};
navLinks.querySelectorAll('a[href^="#"]').forEach(a => {
  linkMap[a.getAttribute('href').slice(1)] = a;
});
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && linkMap[e.target.id]) {
      Object.values(linkMap).forEach(a => a.classList.remove('active'));
      linkMap[e.target.id].classList.add('active');
    }
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach(s => spy.observe(s));

// ---------- Reveal-on-scroll animations ----------
const revealer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealer.observe(el));

// ---------- Currency converter (NT$1 = ₱1.93, Jul 2026) ----------
const RATE = 1.93;
const twdInput = document.getElementById('twdInput');
const phpInput = document.getElementById('phpInput');
twdInput.addEventListener('input', () => {
  const v = parseFloat(twdInput.value);
  phpInput.value = isNaN(v) ? '' : (v * RATE).toFixed(2);
});
phpInput.addEventListener('input', () => {
  const v = parseFloat(phpInput.value);
  twdInput.value = isNaN(v) ? '' : (v / RATE).toFixed(2);
});

// ---------- Packing checklist with localStorage ----------
const checks = document.querySelectorAll('[data-check]');
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
  bar.style.width = (done / checks.length * 100) + '%';
  label.textContent = done === checks.length
    ? '🎉 All packed — Taipei is waiting!'
    : `${done} of ${checks.length} packed`;
}
checks.forEach(c => c.addEventListener('change', () => { saveChecks(); updateProgress(); }));
loadChecks();
updateProgress();
