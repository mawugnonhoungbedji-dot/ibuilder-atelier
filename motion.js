/* iBuilder — couche de mouvement (motion-site-studio, mode intégration)
 * Règle d'or : au repos, chaque section est identique à la version sans mouvement.
 * Ajouter ?nomotion à l'URL pour voir la page sans aucun effet.
 * Dépend de : gsap, ScrollTrigger, Lenis, motion-kit.js (chargés avant ce fichier).
 */
(() => {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const off = /[?&]nomotion/.test(location.search);
  const clearCover = () => html.removeAttribute('data-mk-pre');
  if (reduce || off || !window.gsap || !window.ScrollTrigger || !window.MK) { clearCover(); return; }

  setTimeout(clearCover, 6000); // sécurité
  gsap.registerPlugin(ScrollTrigger);
  html.classList.add('mk-on');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const desktop = matchMedia('(min-width: 900px)').matches;

  try { history.scrollRestoration = 'manual'; } catch (e) {}
  MK.smooth();

  // ---------- A. Intro (1ère visite) + B. entrée du hero ----------
  let first = true;
  try { first = sessionStorage.getItem('ib-visited') !== '1'; sessionStorage.setItem('ib-visited', '1'); } catch (e) {}

  const radius = '28px 0 28px 28px';
  const heroIn = () => {
    const tl = gsap.timeline();
    tl.from('.hdr', { yPercent: -100, opacity: 0, duration: 0.8, ease: 'expo.out' })
      .add(MK.enter.lines('.hero h1'), '<0.05')
      .fromTo('.hero .eyebrow, .hero .lead, .hero .cta-row, .hero .micro', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'expo.out' }, '-=0.85')
      .fromTo('.hero .trainer-card', { clipPath: `inset(50% 50% 50% 50% round ${radius})` }, { clipPath: `inset(0% 0% 0% 0% round ${radius})`, duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath' }, '-=1.1')
      .fromTo('.hero .trainer-card img', { scale: 1.35 }, { scale: 1, duration: 1.7, ease: 'expo.out' }, '<')
      .from('.hero .sticker', { autoAlpha: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' }, '-=0.7')
      .from('.facts li', { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'expo.out' }, '-=0.6');
    // G. compteurs 21 / 1 / 45
    $$('.facts b').forEach((b) => {
      const to = parseInt(b.textContent, 10), o = { v: 0 };
      tl.to(o, { v: to, duration: 1.4, ease: 'power2.out', onUpdate: () => (b.textContent = Math.round(o.v)), onComplete: () => (b.textContent = to) }, '-=1.2');
    });
    return tl;
  };

  if (first) {
    const l = MK.loader.curtain({ brand: 'iBuilder', color: '#0000ff', ink: '#ffffff', bands: 6 });
    clearCover();
    l.add(heroIn(), '-=0.35');
  } else {
    clearCover();
    heroIn().delay(0.1);
  }

  // ---------- C. Bandeau défilant sensible à la vélocité du scroll ----------
  const track = $('.marquee-track');
  if (track) {
    track.style.animation = 'none'; track.style.gap = '0'; track.style.transform = '';
    [...track.children].forEach((c) => (c.style.marginRight = '34px'));
    MK.marquee(track, { speed: 0.075, boost: 0.022 });
  }

  // ---------- H. Parallaxe douce du portrait du hero ----------
  gsap.to('.hero .trainer-card img', { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });

  // ---------- D. Typographie ----------
  MK.wordReveal('#constat h2', { from: 0.18, start: 'top 90%', end: 'bottom 55%' });
  $$('#constat .prose p:not(.pull)').forEach((p) => gsap.from(p, { y: 34, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 90%' } }));
  MK.splitIn('#constat .pull', { start: 'top 88%' });

  $$('.head').forEach((hd) => {
    const sc = $('.script', hd), h2 = $('h2', hd), sub = $('.sub', hd);
    if (sc) gsap.from(sc, { opacity: 0, y: 20, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: hd, start: 'top 88%' } });
    if (h2) MK.splitIn(h2, { start: 'top 88%' });
    if (sub) gsap.from(sub, { opacity: 0, y: 22, duration: 1, delay: 0.15, ease: 'expo.out', scrollTrigger: { trigger: hd, start: 'top 86%' } });
  });
  $$('.split h2, .trainer-right h2, .final h2').forEach((e) => MK.splitIn(e, { start: 'top 88%' }));
  $$('.split .script, .trainer-right .script, .final .script').forEach((e) => gsap.from(e, { opacity: 0, y: 20, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: e, start: 'top 90%' } }));
  MK.scramble('.deliv span', { duration: 0.9, start: 'top 92%' }); // D5

  // ---------- F. Cartes ----------
  gsap.from('.sc-view', { scale: 0.92, y: 70, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.showcase', start: 'top 100%', end: 'top 45%', scrub: 0.6 } });
  gsap.from('.sc-tab', { opacity: 0, y: 16, stagger: 0.1, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: '.showcase', start: 'top 85%' } });
  MK.rise('.pillar', { trigger: '.pillars', start: 'top 92%', end: 'top 40%', y: 110 });
  MK.rise('.tk', { trigger: '.track', start: 'top 92%', end: 'top 45%', y: 90 });
  gsap.from('.checks li', { x: 60, opacity: 0, stagger: 0.09, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.checks', start: 'top 85%' } });
  gsap.from('.deliv li', { y: 40, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '.deliv', start: 'top 88%' } });
  gsap.from('.stack li', { x: -50, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.stack', start: 'top 85%' } });
  gsap.from('.price-card', { y: 70, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.offer', start: 'top 80%' } });
  $$('.fit > div, .proof, .why, .trainer-card.tall').forEach((e) => gsap.from(e, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: e, start: 'top 90%' } }));
  gsap.from('.faq details', { y: 24, opacity: 0, stagger: 0.07, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: '.faq', start: 'top 88%' } });
  // F4. Les 3 semaines se recouvrent (grand écran seulement)
  if (desktop && innerHeight >= 700) MK.stickyCards('.weeks .week', { scale: 0.93 });

  // ---------- E. Le calcul : surcouche automatique (aucun contrôle), puis le prix s'affiche ----------
  const fmt = (n) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, '\u00a0');
  const calc = $('#calcul'), offre = $('#offre');
  if (calc && offre) {
    const rows = $$('.calc-rows li'), totalEl = $('#calcTotal'), priceEl = $('#calcPrice');
    const vals = [50000, 60000, 150000, 25000];
    const goOffre = () => {
      const y = offre.getBoundingClientRect().top + scrollY - 70;
      (MK.lenis && MK.lenis.scrollTo) ? MK.lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y);
    };
    let running = false;
    const play = () => {
      if (running) return;
      running = true;
      MK.lock();
      calc.classList.add('on');
      goOffre(); // la section prix est déjà en place derrière la surcouche
      const o = { v: 0 }, p = { v: 285000 };
      gsap.set(rows, { opacity: 0, x: -70, scale: 0.96 });
      gsap.set('.calc-chip, .calc h2', { opacity: 0, y: 26 });
      gsap.set('.calc-total', { opacity: 0 });
      gsap.set('.calc-in', { opacity: 1, y: 0, scale: 1 });
      gsap.set('.calc-final', { opacity: 0 });
      gsap.set('.calc-strike', { scaleX: 0, rotation: -3, transformOrigin: '0% 50%' });
      gsap.set('.calc-bar i', { scaleX: 0 });
      gsap.set(calc, { clipPath: 'inset(0% 0% 0% 0%)', opacity: 0 });
      totalEl.textContent = '0';
      const tl = gsap.timeline({ onComplete: () => { calc.classList.remove('on'); gsap.set(calc, { clearProps: 'all' }); running = false; MK.unlock(); goOffre(); ScrollTrigger.refresh(); } });
      gsap.to('.calc-bar i', { scaleX: 1, duration: 7.4, ease: 'none', delay: 0.2 });
      tl.to(calc, { opacity: 1, duration: 0.35, ease: 'power1.out' })
        .to('.calc-chip, .calc h2', { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'expo.out' }, 0.25)
        .to('.calc-total', { opacity: 1, duration: 0.3 }, '<0.2');
      let cum = 0;
      rows.forEach((r, i) => {
        cum += vals[i]; const target = cum;
        tl.to(r, { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }, '+=0.12')
          .to(o, { v: target, duration: 0.5, ease: 'power1.out', onUpdate: () => (totalEl.textContent = fmt(o.v)) }, '<')
          .fromTo(totalEl, { scale: 1.14 }, { scale: 1, duration: 0.35, ease: 'power2.out' }, '<0.15');
      });
      tl.to('.ct-num', { scale: 1.22, duration: 0.5, ease: 'power2.inOut' }, '+=0.15')           // le grand total
        .to('.calc-strike', { scaleX: 1, duration: 0.45, ease: 'power3.out' }, '+=0.1')         // on barre uniquement le chiffre, en vert
        .to(totalEl, { color: '#ffffff', opacity: 0.7, duration: 0.35 }, '<0.1')
        .to(rows, { opacity: 0.35, duration: 0.35 }, '<')
        .to('.calc-in', { opacity: 0, y: -60, scale: 0.9, duration: 0.5, ease: 'power2.in' }, '+=0.25')
        .to('.calc-final', { opacity: 1, duration: 0.3 }, '-=0.1')
        .fromTo('.cf-price b', { scale: 0.5 }, { scale: 1, duration: 0.8, ease: 'back.out(1.7)' }, '<')
        .to(p, { v: 15000, duration: 0.8, ease: 'power3.out', onUpdate: () => (priceEl.textContent = fmt(p.v)), onComplete: () => (priceEl.innerHTML = '15&nbsp;000') }, '<')
        .fromTo('.ring', { scale: 0.2, opacity: 0.9 }, { scale: 3.4, opacity: 0, duration: 1.1, stagger: 0.2, ease: 'power2.out' }, '<0.1')
        .from('.cf-top, .cf-sub', { opacity: 0, y: 22, stagger: 0.12, duration: 0.5 }, '-=0.6')
        .to({}, { duration: 0.8 })
        .to(calc, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut' });  // le rideau se lève : le prix est là
    };
    // Le calcul ne se joue qu'après une vraie action du visiteur (molette, doigt, clavier, clic), jamais au chargement
    let armed = false;
    const arm = () => { armed = true; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, arm, { passive: true, once: true }));
    // À chaque arrivée sur la section prix par le haut (y compris après être remonté puis redescendu)
    ScrollTrigger.create({ trigger: offre, start: 'top 72%',
      onEnter: () => { if (armed && !running && ScrollTrigger.isInViewport(offre, 0.05)) play(); } });
    // Les liens « Prix » / « Voir le détail du prix » relancent aussi le calcul, d'où qu'on vienne
    addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href="#offre"]');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      armed = true; if (!running) play();
    }, true);
  }

  // ---------- E6. Les sections s'ouvrent dans la précédente (clip-path qui s'élargit) ----------
  const openIn = (sel, inset = '5% 6% 5% 6% round 52px') => {
    const s = $(sel); if (!s) return;
    gsap.fromTo(s, { clipPath: `inset(${inset})` }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: s, start: 'top 96%', end: 'top 18%', scrub: 0.6 } });
  };
  ['#programme', '#suivi', '.final'].forEach((s) => openIn(s));

  // ---------- G. Prix : compteur ----------
  const pb = $('.price b');
  if (pb) {
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: '.price-card', start: 'top 80%', once: true, onEnter: () => gsap.to(o, { v: 15000, duration: 1.6, ease: 'power3.out',
      onUpdate: () => (pb.textContent = Math.round(o.v).toLocaleString('fr-FR').replace(/\s/g, ' ')), onComplete: () => (pb.innerHTML = '15&nbsp;000') }) });
  }

  // ---------- H. Profondeur : photos du bloc « Ce que tu auras » ----------
  MK.imageZoom('.gallery img', { from: 1.25 });

  // ---------- I. Micro-interactions ----------
  MK.magnetic('.btn-lg, .hdr .btn-sm', { strength: 0.28 });
  MK.tilt('.price-card, .trainer-card, .facts li', { max: 6 });

  addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
})();
