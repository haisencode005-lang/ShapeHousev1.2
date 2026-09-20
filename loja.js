/* =========================================================================
   SHAPEHOUSE — loja.js
   Destaca o chip de categoria correspondente à seção visível na tela,
   usando IntersectionObserver (mesmo padrão do scroll reveal do site).
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const chips = Array.from(document.querySelectorAll('.cat-chip'));
  const blocos = Array.from(document.querySelectorAll('.category-block'));
  if (!chips.length || !blocos.length) return;

  const chipPorId = new Map(chips.map((chip) => [chip.getAttribute('href').replace('#', ''), chip]));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const chip = chipPorId.get(entry.target.id);
      if (!chip) return;
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

  blocos.forEach((bloco) => observer.observe(bloco));
});
