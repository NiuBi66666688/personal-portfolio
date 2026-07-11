/* ═══════════════════════════════════════════════
   W7W — Main JavaScript
   Loader, Navigation, Scroll Reveals, Language Toggle
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {

/* ── CHECK LOADER STATE ── */
const loader = document.getElementById('loader');
const loaderCounter = document.getElementById('loader-counter');

if (sessionStorage.getItem('w7w:loader-played') === '1') {
  loader.style.display = 'none';
  document.body.style.overflow = '';
} else {
  loader.style.display = 'block';
  document.body.style.overflow = 'hidden';
  var _start = null;
  var DURATION = 4500;

  function countdown(ts) {
    if (!_start) _start = ts;
    var elapsed = ts - _start;
    var p = Math.min(elapsed / DURATION, 1);
    var eased = 1 - Math.pow(1 - p, 4); // easeOut quart
    var num = Math.max(0, Math.ceil(100 * (1 - eased)));
    loaderCounter.textContent = String(num).padStart(3, '0');

    if (p < 1) {
      requestAnimationFrame(countdown);
    } else {
      loaderCounter.textContent = '000';
      loader.classList.add('hidden');
      document.body.style.overflow = '';
      setTimeout(function() { loader.style.display = 'none'; }, 1200);
      try { sessionStorage.setItem('w7w:loader-played', '1'); } catch(e) {}
    }
  }
  requestAnimationFrame(countdown);
}

/* ── MENU OVERLAY ── */
var menuBtn = document.querySelector('.menu-btn');
var menuOverlay = document.querySelector('.menu-overlay');
var menuClose = document.querySelector('.menu-overlay-close');

if (menuBtn) {
  menuBtn.addEventListener('click', function() {
    menuOverlay.classList.add('open');
  });
}
if (menuClose) {
  menuClose.addEventListener('click', function() {
    menuOverlay.classList.remove('open');
  });
}
if (menuOverlay) {
  menuOverlay.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      menuOverlay.classList.remove('open');
    });
  });
}

/* ── SCROLL REVEAL ── */
var reveals = document.querySelectorAll('.reveal');
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(function(el) { observer.observe(el); });

// Check above-fold elements after load
setTimeout(function() {
  reveals.forEach(function(el) {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add('visible');
    }
  });
}, 800);

/* ── LANGUAGE TOGGLE ── */
var currentLang = 'zh';

window.toggleLang = function() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  applyLang();
};

function applyLang() {
  // Elements with data-zh / data-en (textContent, supports <br>)
  var els = document.querySelectorAll('[data-zh]');
  els.forEach(function(el) {
    var key = currentLang === 'zh' ? 'data-zh' : 'data-en';
    var val = el.getAttribute(key);
    if (val !== null) {
      el.innerHTML = val; // Use innerHTML to preserve <br>
    }
  });

  // Update lang buttons
  var btns = document.querySelectorAll('.lang-btn');
  btns.forEach(function(btn) {
    btn.textContent = currentLang === 'zh' ? 'EN' : '中';
  });
}

/* ── PARALLAX MOUSE ON HERO LETTERS ── */
var heroLetters = document.querySelectorAll('.hero-letter');
document.addEventListener('mousemove', function(e) {
  var x = (e.clientX / window.innerWidth - 0.5) * 2;
  var y = (e.clientY / window.innerHeight - 0.5) * 2;
  heroLetters.forEach(function(letter, i) {
    var speed = (i + 1) * 0.03;
    letter.style.transform = 'translate(' + (x * speed * 25) + 'px, ' + (y * speed * 12) + 'px)';
  });
});

/* ── WORKS SECTION: Smooth sticky behavior ── */
// The works-word-w is already sticky via CSS; this refreshes intersection checks on resize
window.addEventListener('resize', function() {
  // Force recalculation of above-fold reveals
  reveals.forEach(function(el) {
    if (el.getBoundingClientRect().top < window.innerHeight && !el.classList.contains('visible')) {
      el.classList.add('visible');
    }
  });
});

}); // DOMContentLoaded
