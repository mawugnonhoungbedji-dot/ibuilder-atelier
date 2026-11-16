// ===== Configuration : à modifier ici uniquement =====
const CONFIG = {
  phoneIntl: '2290168844875',
  phoneDisplay: '+229 01 68 84 48 75',
  message: "Bonjour ! Je veux réserver ma place pour l'atelier « Devenir un bon développeur de site web avec l'IA ».",
};

const wa = `https://wa.me/${CONFIG.phoneIntl}?text=${encodeURIComponent(CONFIG.message)}`;
document.querySelectorAll('[data-wa]').forEach(a => {
  a.href = wa; a.target = '_blank'; a.rel = 'noopener noreferrer';
});
document.querySelectorAll('[data-phone]').forEach(el => { el.textContent = CONFIG.phoneDisplay; });
document.getElementById('yr').textContent = new Date().getFullYear();

// Barre mobile : visible après le hero, masquée sur le CTA final
const sticky = document.querySelector('.sticky-cta');
const hero = document.querySelector('.hero');
const fin = document.querySelector('.final');
if ('IntersectionObserver' in window) {
  let heroOut = false, finalIn = false;
  const upd = () => sticky.classList.toggle('show', heroOut && !finalIn);
  new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; upd(); }).observe(hero);
  new IntersectionObserver(([e]) => { finalIn = e.isIntersecting; upd(); }).observe(fin);
  const pc = document.querySelector('.price-card');
  if (pc) new IntersectionObserver(([e]) => { finalIn = e.isIntersecting; upd(); }, { threshold: 0.5 }).observe(pc);
}

// Vitrine : slides + aperçus auto (muets, sans contrôles). Chaque projet reste 9 s au maximum, puis le suivant arrive tout seul.
(() => {
  const root = document.getElementById('showcase');
  const track = root.querySelector('.sc-track');
  const vids = [...root.querySelectorAll('video')];
  const tabs = [...root.querySelectorAll('.sc-tab')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX = 9;                 // secondes par projet
  let cur = 0, visible = false, elapsed = 0, last = 0;

  const loadSrc = v => { if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); } };
  const setProg = (i, p) => tabs[i].style.setProperty('--prog', Math.min(1, p));
  const slideLen = () => Math.min(MAX, vids[cur].duration > 0 ? vids[cur].duration : MAX);

  function play() {
    const v = vids[cur];
    if (reduce || !visible) return;
    v.currentTime = 0;
    const p = v.play(); if (p) p.catch(() => {});
  }
  function show(i) {
    cur = (i + vids.length) % vids.length;
    elapsed = 0;
    track.style.transform = `translateX(${-cur * 100}%)`;
    tabs.forEach((t, k) => {
      t.classList.toggle('is-on', k === cur);
      t.setAttribute('aria-selected', k === cur);
      setProg(k, k < cur ? 1 : 0);
    });
    vids.forEach((v, k) => { if (k !== cur) v.pause(); });
    loadSrc(vids[cur]); loadSrc(vids[(cur + 1) % vids.length]);
    play();
  }
  // horloge propre à la vitrine : ne dépend ni de la fin ni du chargement de la vidéo
  function tick(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (visible && !reduce && !document.hidden) {
      elapsed += dt;
      setProg(cur, elapsed / slideLen());
      if (elapsed >= slideLen()) show(cur + 1);
    }
    requestAnimationFrame(tick);
  }
  tabs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  root.querySelectorAll('.sc-arrow').forEach(b => b.addEventListener('click', () => show(cur + Number(b.dataset.dir))));

  let sx = null;
  const view = root.querySelector('.sc-view');
  view.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  view.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { loadSrc(vids[cur]); if (vids[cur].paused) play(); }
      else vids.forEach(v => v.pause());
    }, { threshold: 0.1 }).observe(root);
  } else { visible = true; }
  show(0);
  last = performance.now();
  requestAnimationFrame(tick);
})();
