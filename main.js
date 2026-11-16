// ===== Configuration : à modifier ici uniquement =====
const CONFIG = {
  phoneIntl: '2290168844875',
  phoneDisplay: '+229 01 68 84 48 75',
  message: "Bonjour ! Je veux réserver ma place pour l'atelier « Devenir un bon développeur de site web avec l'IA ».",
};

const wa = `https://wa.me/${CONFIG.phoneIntl}?text=${encodeURIComponent(CONFIG.message)}`;
document.querySelectorAll('[data-wa]').forEach(a => {
  a.href = wa; a.target = '_blank'; a.rel = 'noopener noreferrer';
  const s = document.createElement('span'); s.className = 'sr-only'; s.textContent = " (s'ouvre dans un nouvel onglet)"; a.appendChild(s);
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

// Vitrine : aperçus automatiques (muets). 9 s par projet, bouton pause, pause au survol / au focus.
(() => {
  const root = document.getElementById('showcase');
  const track = root.querySelector('.sc-track');
  const slides = [...root.querySelectorAll('.slide')];
  const vids = [...root.querySelectorAll('video')];
  const tabs = [...root.querySelectorAll('.sc-tab')];
  const pauseBtn = root.querySelector('.sc-pause');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX = 9;
  let cur = 0, visible = false, elapsed = 0, last = 0, userPaused = reduce, hovered = false;

  const loadSrc = v => { if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); } };
  const setProg = (i, p) => tabs[i].style.setProperty('--prog', Math.min(1, p));
  const slideLen = () => Math.min(MAX, vids[cur].duration > 0 ? vids[cur].duration : MAX);
  const running = () => visible && !userPaused && !hovered && !document.hidden;

  function syncMedia() {
    vids.forEach((v, k) => { if (k === cur && running()) { const p = v.play(); if (p) p.catch(() => {}); } else v.pause(); });
  }
  function setPaused(p) {
    userPaused = p;
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.setAttribute('aria-label', p ? 'Relancer le défilement' : 'Mettre le défilement en pause');
    pauseBtn.firstElementChild.textContent = p ? '▶' : '❚❚';
    syncMedia();
  }
  function show(i, restart = true) {
    cur = (i + vids.length) % vids.length;
    elapsed = 0;
    track.style.transform = `translateX(${-cur * 100}%)`;
    tabs.forEach((t, k) => {
      t.classList.toggle('is-on', k === cur);
      t.setAttribute('aria-current', String(k === cur));
      setProg(k, k < cur ? 1 : 0);
    });
    slides.forEach((s, k) => { s.inert = k !== cur; s.setAttribute('aria-hidden', String(k !== cur)); });
    loadSrc(vids[cur]); loadSrc(vids[(cur + 1) % vids.length]);
    if (restart) { vids[cur].currentTime = 0; }
    syncMedia();
  }
  function tick(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (running()) {
      elapsed += dt;
      setProg(cur, elapsed / slideLen());
      if (elapsed >= slideLen()) show(cur + 1);
    }
    requestAnimationFrame(tick);
  }
  tabs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  root.querySelectorAll('.sc-arrow').forEach(b => b.addEventListener('click', () => show(cur + Number(b.dataset.dir))));
  pauseBtn.addEventListener('click', () => setPaused(!userPaused));
  root.addEventListener('pointerenter', () => { hovered = true; syncMedia(); });
  root.addEventListener('pointerleave', () => { hovered = false; syncMedia(); });
  root.addEventListener('focusin', () => { hovered = true; syncMedia(); });
  root.addEventListener('focusout', () => { hovered = false; syncMedia(); });
  root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });

  let sx = null;
  const view = root.querySelector('.sc-view');
  view.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  view.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loadSrc(vids[cur]); syncMedia(); }, { threshold: 0.1 }).observe(root);
  } else { visible = true; }
  setPaused(userPaused);
  show(0);
  last = performance.now();
  requestAnimationFrame(tick);
})();


// ===== Navigation moderne =====
(() => {
  const hdr = document.getElementById('hdr');
  const nav = document.getElementById('nav');
  const links = [...nav.querySelectorAll('a')];
  const mlinks = [...document.querySelectorAll('#mnav a:not(.btn)')];
  const btn = document.getElementById('menuBtn');
  const panel = document.getElementById('mnav');
  let activeId = null;

  // compactage au défilement
  const onScroll = () => hdr.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // repérage de la section visible
  const ids = links.map(a => a.getAttribute('href').slice(1));
  const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
  const setActive = (id) => {
    activeId = id;
    [...links, ...mlinks].forEach(a => { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      const top = scrollY < 200 && !es.some(e => e.isIntersecting); if (top) setActive(null);
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
  }

  // menu mobile
  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (open) { panel.hidden = false; requestAnimationFrame(() => panel.classList.add('open')); }
    else { panel.classList.remove('open'); setTimeout(() => { if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true; }, 280); }
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); } });
  document.addEventListener('click', (e) => { if (btn.getAttribute('aria-expanded') === 'true' && !hdr.contains(e.target)) setOpen(false); });
})();
