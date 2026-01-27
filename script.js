// Disable scroll restoration & force top on load
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
});

/* ---------------- NAV ACTIVE LINK ---------------- */
const path = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.navlink, .nav_cta').forEach(a => {
  if (a.getAttribute('href') === path) {
    a.classList.add('active');
  }
});

/* ---------------- THEME TOGGLE ---------------- */
(() => {
  const html = document.documentElement;
  const input =
    document.getElementById('themeInput') ||
    document.getElementById('input') ||
    document.querySelector('.switch input');

  const saved = localStorage.getItem('theme');
  const isDark = saved !== 'light';

  if (!isDark) html.classList.add('light');
  else html.classList.remove('light');

  if (input) input.checked = isDark;

  input?.addEventListener('change', () => {
    const dark = input.checked;
    html.classList.toggle('light', !dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  });
})();

/* ---------------- SCROLL REVEAL ANIMATION ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const els = document.querySelectorAll('.reveal');

  const revealOnScroll = () => {
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 50) {
        el.classList.add(
          'animate__animated',
          'animate__fadeInUp'
        );
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();
});
