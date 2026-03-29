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
      if (rect.top < window.innerHeight) {
        el.classList.add("active");
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();
});

/* ────────────────── Pill scrollbar ─────────────────────── */
(function () {
  const track = document.getElementById("pill-scrollbar");
  const thumb = document.getElementById("pill-thumb");

  let isDragging    = false;
  let dragStartY    = 0;
  let dragStartScroll = 0;

  function update() {
    const scrollTop  = window.scrollY;
    const winHeight  = window.innerHeight;
    const docHeight  = document.documentElement.scrollHeight;
    const maxScroll  = docHeight - winHeight;

    const thumbH = Math.max(40, (winHeight / docHeight) * winHeight);
    const thumbY = maxScroll > 0 ? (scrollTop / maxScroll) * (winHeight - thumbH) : 0;

    thumb.style.height    = thumbH + "px";
    thumb.style.transform = `translateY(${thumbY}px)`;
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  update();

  thumb.addEventListener("pointerdown", e => {
    isDragging      = true;
    dragStartY      = e.clientY;
    dragStartScroll = window.scrollY;
    thumb.classList.add("dragging");
    thumb.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  thumb.addEventListener("pointermove", e => {
    if (!isDragging) return;
    const winHeight  = window.innerHeight;
    const docHeight  = document.documentElement.scrollHeight;
    const thumbH     = Math.max(40, (winHeight / docHeight) * winHeight);
    const maxScroll  = docHeight - winHeight;
    const trackRange = winHeight - thumbH;

    const delta      = e.clientY - dragStartY;
    const scrollDelta = (delta / trackRange) * maxScroll;
    window.scrollTo(0, dragStartScroll + scrollDelta);
  });

  thumb.addEventListener("pointerup", () => {
    isDragging = false;
    thumb.classList.remove("dragging");
  });
})();
