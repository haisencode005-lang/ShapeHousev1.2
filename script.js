/* =========================================================================
   SHAPEHOUSE — script.js
   Funções compartilhadas por TODAS as páginas: menu mobile, header no
   scroll, scroll reveal e utilitário de animação dos cards da Home.
   ========================================================================= */

/** Alterna a navegação mobile (usado no header de todas as páginas). */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? '✕' : '☰';
  });
}

/** Escurece/condensa o header assim que o usuário rola a página. */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    header.style.boxShadow = window.scrollY > 10
      ? '0 10px 30px -20px rgba(0,0,0,.6)'
      : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/**
 * Revela elementos com a classe .reveal-up (ou .nav-card) assim que
 * entram na viewport, usando IntersectionObserver.
 */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal-up, .nav-card');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // pequeno atraso escalonado para efeito de cascata
        const delay = el.classList.contains('nav-card')
          ? Array.from(el.parentElement.children).indexOf(el) * 90
          : 0;
        setTimeout(() => {
          el.classList.add('in-view', 'reveal');
        }, delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach((el) => observer.observe(el));
}

/** Marca o link do menu correspondente à página atual. */
function initActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHeaderScroll();
  initScrollReveal();
  initActiveLink();
});
