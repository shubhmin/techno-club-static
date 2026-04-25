//Slideshow
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".hero-slide");
  let current = 0;
  const interval = 3000; // time per slide (ms)

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  setInterval(() => {
    current = (current + 1) % slides.length;
    showSlide(current);
  }, interval);
});


// Disable scroll restoration & force top on load
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
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
      const halfVisible = rect.top + rect.height / 10 < window.innerHeight;

      if (halfVisible) {
        el.classList.add("active");
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();
});

//Gallery Lightbox Script
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const closeBtn = document.getElementById('closeBtn');
const counter = document.getElementById('counter');
let currentAlbum = [];
let currentIndex = 0;

function show(index) {
  if (currentAlbum.length === 0) return;
  currentIndex = (index + currentAlbum.length) % currentAlbum.length;
  lightboxImage.src = currentAlbum[currentIndex];
  counter.textContent = (currentIndex + 1) + '/' + currentAlbum.length;
}

function openLightbox(imgSrc, siblings) {
  currentAlbum = siblings;
  currentIndex = siblings.indexOf(imgSrc);
  if (currentIndex === -1) currentIndex = 0;
  show(currentIndex);
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
}

prevBtn.addEventListener('click', (e) => { e.stopPropagation(); show(currentIndex - 1); });
nextBtn.addEventListener('click', (e) => { e.stopPropagation(); show(currentIndex + 1); });
closeBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-close')) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('hidden')) return;
  if (e.key === 'ArrowLeft') show(currentIndex - 1);
  if (e.key === 'ArrowRight') show(currentIndex + 1);
  if (e.key === 'Escape') closeLightbox();
});

// Wire up thumbnails: use the clicked image's src and build album from same section
document.querySelectorAll('figure.cursor-pointer').forEach(figure => {
  figure.addEventListener('click', () => {
    const img = figure.querySelector('img');
    if (!img || !img.src) return;
    const clickedSrc = img.getAttribute('src');
    const grid = figure.closest('.grid');
    const siblings = grid ? Array.from(grid.querySelectorAll('figure img')).map(i => i.getAttribute('src')).filter(Boolean) : [clickedSrc];
    openLightbox(clickedSrc, siblings.length ? siblings : [clickedSrc]);
  });
});


//Chatbot Script//
let knowledgeBase = {};

// Load JSON dynamically
fetch("knowledge.json")
  .then(response => response.json())
  .then(data => {
    knowledgeBase = data;
  })
  .catch(err => console.error("Error loading knowledge base:", err));

const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "You"
    ? "flex justify-end"
    : "flex justify-start";

  const bubble = document.createElement("div");
  bubble.className = sender === "You"
    ? "bg-indigo-600 text-white p-3 rounded-xl max-w-xs"
    : "bg-slate-800 text-slate-200 p-3 rounded-xl max-w-xs";
  bubble.innerText = text;

  div.appendChild(bubble);
  chatbox.appendChild(div);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function getResponse(msg) {
  msg = msg.toLowerCase();
  for (let key in knowledgeBase) {
    if (msg.includes(key)) return knowledgeBase[key];
  }
  return "Sorry, I only answer questions about cybersecurity and ethical AI.";
}

function handleSend() {
  const msg = userInput.value.trim();
  if (!msg) return;
  appendMessage("You", msg);
  const reply = getResponse(msg);
  setTimeout(() => appendMessage("Bot", reply), 500);
  userInput.value = "";
}

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") handleSend();
});

// Quick buttons
document.querySelectorAll('[data-ask]').forEach(btn => {
  btn.addEventListener('click', () => {
    userInput.value = btn.getAttribute('data-ask');
    handleSend();
  });
});



/* ────────────────── Pill scrollbar ─────────────────────── */
(function () {
  const track = document.getElementById("pill-scrollbar");
  const thumb = document.getElementById("pill-thumb");

  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  function update() {
    const scrollTop = window.scrollY;
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const maxScroll = docHeight - winHeight;

    const thumbH = Math.max(40, (winHeight / docHeight) * winHeight);
    const thumbY = maxScroll > 0 ? (scrollTop / maxScroll) * (winHeight - thumbH) : 0;

    thumb.style.height = thumbH + "px";
    thumb.style.transform = `translateY(${thumbY}px)`;
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  update();

  thumb.addEventListener("pointerdown", e => {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartScroll = window.scrollY;
    thumb.classList.add("dragging");
    thumb.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  thumb.addEventListener("pointermove", e => {
    if (!isDragging) return;
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const thumbH = Math.max(40, (winHeight / docHeight) * winHeight);
    const maxScroll = docHeight - winHeight;
    const trackRange = winHeight - thumbH;

    const delta = e.clientY - dragStartY;
    const scrollDelta = (delta / trackRange) * maxScroll;
    window.scrollTo(0, dragStartScroll + scrollDelta);
  });

  thumb.addEventListener("pointerup", () => {
    isDragging = false;
    thumb.classList.remove("dragging");
  });
})();
