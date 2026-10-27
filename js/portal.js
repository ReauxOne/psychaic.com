// Clicking a doorway in the scene opens a circle of the next page's colour from the
// spot you clicked, then goes there. Skipped for reduced motion and modified clicks.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a.portal');
    if (!link || still.matches || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const href = link.getAttribute('href');
    const veil = document.createElement('div');
    veil.className = 'portal-veil';
    veil.style.left = `${e.clientX}px`;
    veil.style.top = `${e.clientY}px`;
    veil.style.background = link.dataset.tint || getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#FFFFFF';
    document.body.appendChild(veil);
    const cover = Math.hypot(innerWidth, innerHeight) / 20;  // the veil is 40px wide
    requestAnimationFrame(() => requestAnimationFrame(() => { veil.style.transform = `scale(${cover})`; }));
    setTimeout(() => { location.href = href; }, 620);
  });
  // coming back with the browser's Back button: clear any veil left on the page
  addEventListener('pageshow', () => document.querySelectorAll('.portal-veil').forEach((v) => v.remove()));
})();
