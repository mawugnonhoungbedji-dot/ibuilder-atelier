/*!
 * Motion Kit v1 — motion-site-studio
 * Requires (load before this file):
 *   https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
 *   https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
 *   https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js
 * Usage: const lenis = MK.smooth(); MK.loader.bubbleWave({...}).add(MK.enter.lines('h1'), '-=.35') ...
 * Effect IDs refer to references/motion-catalog.md
 */
(function (global) {
  'use strict';
  const $ = (s, r = document) => (typeof s === 'string' ? r.querySelector(s) : s);
  const $$ = (s, r = document) => (typeof s === 'string' ? [...r.querySelectorAll(s)] : s instanceof Element ? [s] : [...s]);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis = null;

  /* ---------- injected base CSS ---------- */
  const css = `
  body.mk-loading{overflow:hidden}
  .mk-sticky{position:sticky;top:0;height:100vh;overflow:hidden}
  .mk-ln{display:block;overflow:hidden;padding-bottom:.06em}.mk-ln>span{display:inline-block}
  .mk-float{animation:mkFloat 6s ease-in-out infinite}
  @keyframes mkFloat{50%{translate:0 -10px}}
  .mk-ping{width:6px;height:6px;border-radius:50%;background:currentColor;animation:mkPing 2s infinite}
  @keyframes mkPing{0%{box-shadow:0 0 0 0 color-mix(in srgb,currentColor 60%,transparent)}70%,100%{box-shadow:0 0 0 7px transparent}}
  .mk-loader{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;pointer-events:none;font-family:inherit}
  .mk-loader .mk-lbg{position:absolute;inset:0}
  .mk-bubble{position:relative;z-index:3;padding:14px 34px;background:#f7faf6;border-radius:26px 26px 26px 0;font-size:22px;color:#222;box-shadow:0 10px 30px rgba(0,0,0,.06)}
  .mk-wave{position:absolute;z-index:2;width:min(780px,92vw);height:260px;left:50%;top:50%;transform:translate(-50%,-50%);overflow:visible}
  .mk-wave text{font-weight:800;font-size:56px;text-transform:uppercase}
  .mk-count{position:absolute;left:48px;bottom:40px;font-size:clamp(80px,14vw,220px);font-weight:300;letter-spacing:-.04em;line-height:.8}
  .mk-bar{position:absolute;left:0;bottom:0;height:3px;width:100%;transform-origin:left;transform:scaleX(0)}
  .mk-brand{position:relative;z-index:3;font-size:clamp(28px,4vw,56px);letter-spacing:-.02em;overflow:hidden}
  .mk-brand span{display:inline-block}
  .mk-bands{position:absolute;inset:0;display:flex}.mk-bands i{flex:1;transform-origin:top;margin-right:-1px}
  .mk-cursor{position:fixed;left:0;top:0;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#111;z-index:9998;pointer-events:none;display:grid;place-items:center;color:#fff;font-size:11px;white-space:nowrap;transition:width .35s,height .35s,margin .35s}
  .mk-cursor.big{width:84px;height:84px;margin:-42px 0 0 -42px}
  @media (hover:none){.mk-cursor{display:none}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- core ---------- */
  function smooth({ lerp = 0.085, anchors = true } = {}) {
    gsap.registerPlugin(ScrollTrigger);
    // the host site already runs its own Lenis (exposed as window.__lenis): reuse it, never start a second one
    if (window.__lenis) { lenis = window.__lenis; anchors = false; }
    else if (typeof Lenis !== 'undefined' && !reduce) {
      lenis = new Lenis({ lerp, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    if (anchors) document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const h = a.getAttribute('href'); if (h.length < 2 || !document.querySelector(h)) return;
      e.preventDefault(); lenis ? lenis.scrollTo(h, { duration: 1.4 }) : document.querySelector(h).scrollIntoView({ behavior: 'smooth' });
    });
    addEventListener('load', () => ScrollTrigger.refresh());
    return lenis;
  }
  const velocity = () => Math.abs((lenis && lenis.velocity) || 0);
  const lock = () => { document.body.classList.add('mk-loading'); lenis && lenis.stop(); };
  const unlock = () => { document.body.classList.remove('mk-loading'); lenis && lenis.start(); ScrollTrigger.refresh(); };

  /* Split text into .w spans, keeping inner elements (highlights) intact */
  function splitWords(el) {
    el = $(el); if (el.dataset.mkSplit) return el.querySelectorAll('.w');
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) f.appendChild(document.createTextNode(p));
          else { const s = document.createElement('span'); s.className = 'w'; s.style.display = 'inline-block'; s.textContent = p; f.appendChild(s); }
        });
        n.replaceWith(f);
      } else if (n.nodeType === 1 && !n.classList.contains('w') && n.tagName.toLowerCase() !== 'svg' && !n.hasAttribute('data-mk-skip')) walk(n);
    });
    walk(el); el.dataset.mkSplit = 1;
    return el.querySelectorAll('.w');
  }
  function splitChars(el) {
    el = $(el);
    const words = splitWords(el);
    words.forEach((w) => { w.innerHTML = [...w.textContent].map((c) => `<span class="ch" style="display:inline-block">${c}</span>`).join(''); });
    return el.querySelectorAll('.ch');
  }
  function wrapLines(el) {
    el = $(el); if (el.querySelector('.mk-ln')) return el.querySelectorAll('.mk-ln>span');
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="mk-ln"><span>${l.trim()}</span></span>`).join('');
    return el.querySelectorAll('.mk-ln>span');
  }

  /* =============== A — LOADERS (return a gsap timeline) =============== */
  function loaderShell(bg) {
    lock();
    const root = document.createElement('div'); root.className = 'mk-loader';
    root.innerHTML = `<div class="mk-lbg" style="background:${bg}"></div>`;
    document.body.appendChild(root);
    return root;
  }
  const finish = (tl, root) => tl.add(() => { root.remove(); unlock(); });

  const loader = {
    /* A1 */
    bubbleWave({ brand = 'Brand', words = ['Connection', 'Experience'], background = 'linear-gradient(115deg,#cdfb9c,#c4ecc8 45%,#c4dcef)', ink = '#0f1110', delay = 0.2 } = {}) {
      const root = loaderShell(background);
      root.insertAdjacentHTML('beforeend', `<svg class="mk-wave" viewBox="0 0 780 260"><defs><path id="mkwp1"/><path id="mkwp2"/></defs>
        <text fill="${ink}"><textPath id="mktp1" href="#mkwp1">${words[0] || ''}</textPath></text>
        <text fill="${ink}"><textPath id="mktp2" href="#mkwp2">${words[1] || ''}</textPath></text></svg><div class="mk-bubble">${brand}</div>`);
      const wp1 = root.querySelector('#mkwp1'), wp2 = root.querySelector('#mkwp2'), tp1 = root.querySelector('#mktp1'), tp2 = root.querySelector('#mktp2');
      const w = { amp: 0, ph: 0, o1: -60, o2: 110 };
      const path = (y, a, p) => { let d = `M -200 ${y}`; for (let x = -200; x <= 980; x += 20) d += ` L ${x} ${(y + Math.sin(x / 70 + p) * a).toFixed(2)}`; return d; };
      const draw = () => { w.ph += 0.07; wp1.setAttribute('d', path(118, w.amp, w.ph)); wp2.setAttribute('d', path(170, w.amp * 1.1, w.ph + 1.2)); tp1.setAttribute('startOffset', w.o1 + '%'); tp2.setAttribute('startOffset', w.o2 + '%'); };
      draw(); gsap.ticker.add(draw);
      const b = root.querySelector('.mk-bubble');
      gsap.set(b, { scale: 0.6, opacity: 0, transformOrigin: '0% 100%' });
      const tl = gsap.timeline({ delay });
      tl.to(b, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.8)' })
        .to(b, { scale: 0.4, opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=.35')
        .to(w, { amp: 34, duration: 0.6, ease: 'power2.out' }, '<')
        .fromTo(w, { o1: -60, o2: 110 }, { o1: 22, o2: 28, duration: 1.1, ease: 'power3.out' }, '<')
        .to(w, { amp: 6, duration: 0.7, ease: 'power2.inOut' })
        .to(w, { o1: 120, o2: -70, amp: 40, duration: 0.9, ease: 'power3.in' }, '+=.15')
        .to(b, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' }, '-=.45')
        .to(root.querySelector('.mk-lbg'), { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, '+=.25')
        .to(b, { opacity: 0, y: -10, filter: 'blur(6px)', duration: 0.6, ease: 'power2.in' }, '<.2')
        .add(() => gsap.ticker.remove(draw));
      return finish(tl, root);
    },
    /* A2 */
    counter({ brand = '', background = '#0f1110', ink = '#ffffff', accent = '#cdfb9c', duration = 2.2 } = {}) {
      const root = loaderShell(background);
      root.style.color = ink;
      root.insertAdjacentHTML('beforeend', `<div class="mk-brand" style="position:absolute;left:48px;top:40px;font-size:18px">${brand}</div><div class="mk-count">0</div><div class="mk-bar" style="background:${accent}"></div>`);
      const n = { v: 0 }, c = root.querySelector('.mk-count');
      const tl = gsap.timeline({ delay: 0.2 });
      tl.to(n, { v: 100, duration, ease: 'power2.inOut', onUpdate: () => (c.textContent = Math.round(n.v)) })
        .to(root.querySelector('.mk-bar'), { scaleX: 1, duration, ease: 'power2.inOut' }, '<')
        .to([c, root.querySelector('.mk-brand')], { yPercent: -40, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to(root, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=.1');
      return finish(tl, root);
    },
    /* A3 */
    curtain({ brand = 'Brand', bands = 6, color = '#0f1110', ink = '#ffffff' } = {}) {
      const root = loaderShell('transparent');
      root.insertAdjacentHTML('beforeend', `<div class="mk-bands">${'<i></i>'.repeat(bands)}</div><div class="mk-brand" style="color:${ink}">${brand}</div>`);
      root.querySelectorAll('.mk-bands i').forEach((i) => (i.style.background = color));
      const chars = splitChars(root.querySelector('.mk-brand'));
      const tl = gsap.timeline({ delay: 0.2 });
      tl.from(chars, { yPercent: 110, duration: 0.8, stagger: 0.04, ease: 'expo.out' })
        .to(chars, { yPercent: -110, duration: 0.5, stagger: 0.02, ease: 'power2.in' }, '+=.5')
        .to(root.querySelectorAll('.mk-bands i'), { scaleY: 0, duration: 0.9, stagger: 0.07, ease: 'expo.inOut' }, '-=.1');
      return finish(tl, root);
    },
    /* A4 */
    maskZoom({ brand = 'Brand', background = '#f2f4f3', ink = '#0f1110' } = {}) {
      const root = loaderShell(background);
      root.insertAdjacentHTML('beforeend', `<div class="mk-brand" style="color:${ink}">${brand}</div>`);
      const chars = splitChars(root.querySelector('.mk-brand'));
      const tl = gsap.timeline({ delay: 0.2 });
      tl.from(chars, { yPercent: 110, rotate: 8, duration: 0.9, stagger: 0.05, ease: 'expo.out' })
        .to(root.querySelector('.mk-brand'), { scale: 0.9, opacity: 0, filter: 'blur(8px)', duration: 0.6, ease: 'power2.in' }, '+=.5')
        .fromTo(root, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(50% 50% 50% 50% round 40px)', duration: 1, ease: 'expo.inOut' }, '-=.2');
      return finish(tl, root);
    },
    /* A5 */
    wordFlip({ words = ['Create', 'Connect', 'Grow'], brand = 'Brand', background = '#0f1110', ink = '#fff' } = {}) {
      const root = loaderShell(background);
      root.insertAdjacentHTML('beforeend', `<div class="mk-brand" style="color:${ink};height:1.2em;display:grid">${[...words, brand].map((w) => `<span style="grid-area:1/1;text-align:center">${w}</span>`).join('')}</div>`);
      const spans = root.querySelectorAll('.mk-brand>span');
      gsap.set(spans, { yPercent: 110 });
      const tl = gsap.timeline({ delay: 0.2 });
      spans.forEach((s, i) => {
        tl.to(s, { yPercent: 0, duration: 0.45, ease: 'expo.out' });
        if (i < spans.length - 1) tl.to(s, { yPercent: -110, duration: 0.4, ease: 'power3.in' }, '+=.15');
      });
      tl.to(root, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=.4');
      return finish(tl, root);
    },
  };

  /* =============== B — HERO ENTRANCE (return timelines; can be added to a loader tl) =============== */
  const enter = {
    lines: (sel, o = {}) => gsap.timeline().fromTo($$(sel).flatMap((e) => [...wrapLines(e)]), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'expo.out', ...o }),
    chars: (sel, o = {}) => gsap.timeline().fromTo($$(sel).flatMap((e) => [...splitChars(e)]), { yPercent: 100, rotateX: -80, opacity: 0, filter: 'blur(6px)' }, { yPercent: 0, rotateX: 0, opacity: 1, filter: 'blur(0px)', duration: 1, stagger: 0.025, ease: 'expo.out', ...o }),
    fadeUp: (sel, o = {}) => gsap.timeline().fromTo($$(sel), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out', ...o }),
    clipOpen: (sel, o = {}) => { const els = $$(sel); return gsap.timeline().fromTo(els, { clipPath: 'inset(50% 50% 50% 50% round 30px)' }, { clipPath: 'inset(0% 0% 0% 0% round 30px)', duration: 1.3, ease: 'expo.inOut', ...o }).fromTo(els.map((e) => e.querySelector('img,video')).filter(Boolean), { scale: 1.4 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, '<'); },
    rise: (sel, o = {}) => gsap.timeline().fromTo($$(sel), { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.5, stagger: 0.12, ease: 'expo.out', ...o }),
  };

  /* =============== C — AMBIENT LOOPS =============== */
  /* C1: columns of cards looping vertically in alternating directions; accelerates with scroll velocity */
  function loopColumns(cols, { speed = 38, gap = null, boost = 1.6 } = {}) {
    $$(cols).forEach((col, i) => {
      const inner = document.createElement('div');
      const cs = getComputedStyle(col);
      inner.style.cssText = `display:flex;flex-direction:column;gap:${gap ?? cs.rowGap ?? cs.gap};will-change:transform`;
      while (col.firstChild) inner.appendChild(col.firstChild);
      inner.innerHTML += inner.innerHTML;
      col.appendChild(inner);
      if (reduce) return;
      const dir = i % 2 ? 1 : -1; let y = dir > 0 ? -0.5 : 0;
      gsap.ticker.add((t, dt) => {
        const h = inner.scrollHeight; if (!h) return;
        y += (dir * (speed + velocity() * boost) * dt) / 1000 / h;
        if (y <= -0.5) y += 0.5; if (y > 0) y -= 0.5;
        inner.style.transform = `translate3d(0,${(y * h).toFixed(1)}px,0)`;
      });
    });
  }
  /* C2: horizontal marquee; highlightCenter adds .on to the item nearest viewport center */
  function marquee(track, { speed = 0.06, boost = 0.012, highlightCenter = false, reverse = false } = {}) {
    track = $(track); track.style.display = 'flex'; track.style.whiteSpace = 'nowrap'; track.style.willChange = 'transform';
    const base = track.innerHTML; let guard = 0;
    while (track.scrollWidth < innerWidth * 1.2 && guard++ < 20) track.innerHTML += base;
    track.innerHTML += track.innerHTML;
    const items = [...track.children]; let x = 0;
    if (reduce) return;
    gsap.ticker.add((t, dt) => {
      const half = track.scrollWidth / 2;
      x += (reverse ? 1 : -1) * (speed + velocity() * boost) * dt;
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      if (highlightCenter) {
        const cx = innerWidth / 2; let best = null, bd = 1e9;
        items.forEach((s) => { const r = s.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - cx); if (d < bd) { bd = d; best = s; } });
        items.forEach((s) => s.classList.toggle('on', s === best));
      }
    });
  }
  /* C3: orbit ring. items: [{deg, html}] placed on the ring and kept upright */
  function orbit(ring, { duration = 60, reverse = false, items = [] } = {}) {
    ring = $(ring);
    items.forEach(({ deg, html }) => {
      const h = document.createElement('div'); h.style.cssText = `position:absolute;inset:0;transform:rotate(${deg}deg)`;
      h.innerHTML = `<span class="mk-sat" style="position:absolute;left:50%;top:0;translate:-50% -50%;display:block;transform:rotate(${-deg}deg)">${html}</span>`;
      ring.appendChild(h);
    });
    if (reduce) return;
    const sign = reverse ? -1 : 1;
    gsap.to(ring, { rotate: 360 * sign, duration, repeat: -1, ease: 'none' });
    gsap.to(ring.querySelectorAll('.mk-sat'), { rotate: `-=${360 * sign}`, duration, repeat: -1, ease: 'none' });
  }
  /* C5: drifting gradient blob */
  function blob(el, { range = 120, duration = 8 } = {}) {
    if (reduce) return;
    $$(el).forEach((b) => {
      const go = () => gsap.to(b, { x: gsap.utils.random(-range, range), y: gsap.utils.random(-range, range), scale: gsap.utils.random(0.85, 1.2), duration, ease: 'sine.inOut', onComplete: go });
      go();
    });
  }

  /* =============== D — TYPOGRAPHY ON SCROLL =============== */
  /* D1 */
  function wordReveal(el, { from = 0.15, start = 'top 88%', end = 'top 45%', trigger = null, scrub = 0.5 } = {}) {
    return $$(el).map((e) => { const ws = splitWords(e); gsap.set(ws, { opacity: from });
      return gsap.to(ws, { opacity: 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: trigger || e, start, end, scrub } }); });
  }
  /* D2 */
  function splitIn(el, { start = 'top 85%' } = {}) {
    return $$(el).map((e) => gsap.from(splitWords(e), { yPercent: 60, opacity: 0, filter: 'blur(6px)', stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: e, start } }));
  }
  /* D3: elements need a background-image gradient (e.g. .hl) */
  function highlight(el, { start = 'top 80%', end = 'top 45%', trigger = null, scrub = 0.5 } = {}) {
    return $$(el).map((h) => { h.style.backgroundRepeat = 'no-repeat';
      return gsap.fromTo(h, { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', ease: 'none', scrollTrigger: { trigger: trigger || h, start, end, scrub } }); });
  }
  /* D4 */
  function textScale(el, { from = 0.55, start = 'top bottom', end = 'center center' } = {}) {
    return gsap.fromTo($(el), { scale: from, letterSpacing: '0.2em', opacity: 0.3 }, { scale: 1, letterSpacing: '-0.02em', opacity: 1, ease: 'none', scrollTrigger: { trigger: $(el), start, end, scrub: 0.6 } });
  }
  /* D5 */
  function scramble(el, { chars = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ', duration = 1.2, start = 'top 85%' } = {}) {
    $$(el).forEach((e) => {
      const final = e.textContent; const o = { p: 0 };
      ScrollTrigger.create({ trigger: e, start, once: true, onEnter: () => gsap.to(o, { p: 1, duration, ease: 'power2.out', onUpdate: () => {
        const n = Math.floor(final.length * o.p);
        e.textContent = final.slice(0, n) + [...final.slice(n)].map((c) => (c === ' ' ? ' ' : chars[(Math.random() * chars.length) | 0])).join('');
      }, onComplete: () => (e.textContent = final) }) });
    });
  }
  /* D6 */
  function scrollX(el, { distance = -40, trigger = null } = {}) {
    return gsap.fromTo($(el), { xPercent: 0 }, { xPercent: distance, ease: 'none', scrollTrigger: { trigger: trigger || $(el), start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  }

  /* =============== E — PINNED SCENES =============== */
  /* section must be tall (e.g. 300vh) and contain a .mk-sticky child. build(tl) adds tweens. */
  function pinScene(section, build, { scrub = 0.8, start = 'top top', end = 'bottom bottom' } = {}) {
    section = $(section);
    const tl = gsap.timeline({ scrollTrigger: { trigger: section, start, end, scrub } });
    build(tl, section);
    return tl;
  }
  /* E2: stacked cards replaced one by one. container has position:relative + fixed height; cards position:absolute;inset:0 */
  function stack(cards, { section, dots = null, peek = 18 } = {}) {
    cards = $$(cards); const dts = dots ? $$(dots) : [];
    cards.forEach((c, i) => gsap.set(c, { zIndex: 10 - i, y: -peek * Math.min(i, 2), scale: 1 - 0.04 * Math.min(i, 2), opacity: i < 3 ? 1 : 0 }));
    cards.slice(1).forEach((c) => gsap.set(c.children, { opacity: 0 }));
    const tl = gsap.timeline({ scrollTrigger: { trigger: $(section), start: 'top top', end: 'bottom bottom', scrub: 0.8,
      onUpdate: (s) => { const idx = Math.min(cards.length - 1, Math.floor(s.progress * cards.length * 1.03)); dts.forEach((d, i) => d.classList.toggle('on', i === idx)); } } });
    tl.to({}, { duration: 0.3 });
    for (let i = 0; i < cards.length - 1; i++) {
      const cur = cards[i], nxt = cards[i + 1], after = cards[i + 2];
      tl.to(cur, { y: 80, scale: 1.02, opacity: 0, filter: 'blur(14px)', duration: 1, ease: 'power2.in' })
        .to(nxt, { y: 0, scale: 1, duration: 1, ease: 'power2.out' }, '<.15')
        .to(nxt.children, { opacity: 1, duration: 0.6 }, '<.4');
      if (after) tl.to(after, { y: -peek, scale: 0.96, opacity: 1, duration: 1 }, '<-.4');
      tl.to({}, { duration: 0.5 });
    }
    return tl;
  }
  /* E3: horizontal scroll. section gets its height computed; track is a flex row inside .mk-sticky */
  function horizontal(section, track, { extra = 0 } = {}) {
    section = $(section); track = $(track);
    const dist = () => track.scrollWidth - innerWidth + extra;
    const setH = () => (section.style.height = `${dist() + innerHeight}px`);
    setH(); addEventListener('resize', setH);
    return gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } });
  }

  /* =============== F — CARD CHOREOGRAPHY =============== */
  /* F1: front card starts centered, slides right; back card emerges from behind on the left */
  function slideFromBehind(row, front, back, { start = 'top 95%', end = 'top 45%' } = {}) {
    row = $(row); front = $(front, row); back = $(back, row);
    return gsap.timeline({ scrollTrigger: { trigger: row, start, end, scrub: 0.6 } })
      .fromTo(front, { xPercent: -50, y: 60, opacity: 0, scale: 0.94 }, { xPercent: -50, y: 0, opacity: 1, scale: 1, duration: 0.4 })
      .to(front, { xPercent: 0, duration: 0.6 })
      .fromTo(back, { xPercent: 40, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.6 }, '<');
  }
  /* F2 */
  function rise(els, { start = 'top bottom', end = 'top 45%', y = 160, trigger = null } = {}) {
    els = $$(els);
    return gsap.from(els, { y, opacity: 0, stagger: 0.15, scrollTrigger: { trigger: trigger || els[0], start, end, scrub: 0.6 } });
  }
  /* F3 */
  function clipReveal(el, { from = 'center', start = 'top 85%', end = 'top 35%' } = {}) {
    const f = { center: 'inset(50% 50% 50% 50% round 30px)', bottom: 'inset(100% 0% 0% 0% round 30px)', left: 'inset(0% 100% 0% 0% round 30px)' }[from];
    return $$(el).map((e) => gsap.fromTo(e, { clipPath: f }, { clipPath: 'inset(0% 0% 0% 0% round 30px)', ease: 'none', scrollTrigger: { trigger: e, start, end, scrub: 0.6 } }));
  }
  /* F4: cards with position:sticky; top:Npx — previous card shrinks as next one covers it */
  function stickyCards(cards, { scale = 0.9 } = {}) {
    cards = $$(cards);
    cards.forEach((c, i) => { if (i === cards.length - 1) return;
      gsap.to(c, { scale, opacity: 0.4, filter: 'blur(2px)', ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: `top ${c.style.top || '10%'}`, scrub: true } }); });
  }
  /* F5 */
  function fan(cards, { spread = 14, start = 'top 80%', end = 'top 30%' } = {}) {
    cards = $$(cards); const mid = (cards.length - 1) / 2;
    return gsap.fromTo(cards, { rotate: 0, x: (i) => (mid - i) * 120, y: 40 }, { rotate: (i) => (i - mid) * spread * 0.4, x: 0, y: (i) => Math.abs(i - mid) * 18, ease: 'none', scrollTrigger: { trigger: cards[0].parentElement, start, end, scrub: 0.6 } });
  }

  /* =============== G — DATA =============== */
  function counter(el, from, to, { trigger = null, start = 'top 75%', end = 'bottom 40%', decimals = 0, scrub = true } = {}) {
    el = $(el); const o = { v: from };
    return gsap.to(o, { v: to, ease: 'none', scrollTrigger: { trigger: trigger || el, start, end, scrub }, onUpdate: () => (el.textContent = o.v.toFixed(decimals)) });
  }
  function bar(el, { start = 'top 85%', end = 'top 50%' } = {}) {
    return $$(el).map((b) => gsap.fromTo(b, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: b, start, end, scrub: 0.6 } }));
  }
  function draw(path, { start = 'top 80%', end = 'top 30%', trigger = null } = {}) {
    return $$(path).map((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L;
      return gsap.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: trigger || p, start, end, scrub: 0.6 } }); });
  }

  /* =============== H — DEPTH =============== */
  function parallax(el, { from = 120, to = -20, trigger = null } = {}) {
    return $$(el).map((e) => gsap.fromTo(e, { y: from }, { y: to, ease: 'none', scrollTrigger: { trigger: trigger || e, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
  }
  /* H2: each column has data-speed (final offset px); columns rise at different rates */
  function collage(cols, { trigger, start = 'top 90%', end = 'bottom bottom' } = {}) {
    return $$(cols).map((c, i) => gsap.fromTo(c, { y: 260 + i * 30 }, { y: +(c.dataset.speed || 0), ease: 'none', scrollTrigger: { trigger: $(trigger) || c.parentElement, start, end, scrub: 0.8 } }));
  }
  function growIn(el, { radius = 80 } = {}) {
    return $$(el).map((e) => gsap.from(e, { scale: 0.94, borderRadius: radius, scrollTrigger: { trigger: e, start: 'top bottom', end: 'top 30%', scrub: 0.6 } }));
  }
  function imageZoom(img, { from = 1.3 } = {}) {
    return $$(img).map((i) => gsap.fromTo(i, { scale: from }, { scale: 1, ease: 'none', scrollTrigger: { trigger: i.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
  }

  /* =============== I — MICRO-INTERACTIONS =============== */
  function tilt(els, { max = 8 } = {}) {
    if (matchMedia('(hover:none)').matches) return;
    $$(els).forEach((p) => {
      p.addEventListener('pointermove', (e) => { const r = p.getBoundingClientRect(); gsap.to(p, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * max, rotateX: -((e.clientY - r.top) / r.height - 0.5) * max, transformPerspective: 900, duration: 0.5 }); });
      p.addEventListener('pointerleave', () => gsap.to(p, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'expo.out' }));
    });
  }
  function magnetic(els, { strength = 0.35 } = {}) {
    if (matchMedia('(hover:none)').matches) return;
    $$(els).forEach((b) => {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength, duration: 0.4 }); });
      b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,.4)' }));
    });
  }
  /* I4: elements with data-cursor="Label" enlarge the cursor and show the label */
  function cursor() {
    if (matchMedia('(hover:none)').matches) return;
    const c = document.createElement('div'); c.className = 'mk-cursor'; document.body.appendChild(c);
    const xT = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' }), yT = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
    c.style.opacity = 0; // hidden until the pointer actually moves (avoids a stray dot at 0,0)
    addEventListener('pointermove', (e) => { c.style.opacity = 1; xT(e.clientX); yT(e.clientY); });
    document.addEventListener('pointerleave', () => (c.style.opacity = 0));
    document.addEventListener('pointerover', (e) => { const t = e.target.closest('[data-cursor]'); c.classList.toggle('big', !!t); c.textContent = t ? t.dataset.cursor : ''; });
  }

  /* =============== J — SECTION TRANSITIONS =============== */
  /* sections with data-bg="#000" data-ink="#fff" change the body colors when they reach the center */
  function bgSwap(sections, { base = { bg: getComputedStyle(document.body).backgroundColor, ink: getComputedStyle(document.body).color } } = {}) {
    $$(sections).forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 45%',
      onToggle: (self) => gsap.to(document.body, { backgroundColor: self.isActive ? s.dataset.bg : base.bg, color: self.isActive ? s.dataset.ink || base.ink : base.ink, duration: 0.6, overwrite: 'auto' }) }));
  }

  /* nav over dark sections: toggles `cls` on the nav while a [data-nav="dark"] section is under it */
  function navTheme(nav, { sections = '[data-nav="dark"]', cls = 'nav-dark' } = {}) {
    nav = $(nav);
    $$(sections).forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 60px', end: 'bottom 60px', onToggle: (self) => nav.classList.toggle(cls, self.isActive) }));
  }

  /* =============== K — STAYGO FAMILY (focus / blur / editorial) =============== */
  /* A6: the hero itself is the intro. Grey card grows to full frame, image goes from blur to sharp.
     hero = element to animate (rounded frame), img = its <img>. Locks scroll during the intro. */
  function focusHero(hero, { img = null, delay = 0.2, placeholder = '#9a9a9a' } = {}) {
    hero = $(hero); img = img ? $(img) : hero.querySelector('img');
    lock();
    const ph = document.createElement('div');
    ph.style.cssText = `position:absolute;inset:0;background:${placeholder};z-index:5;pointer-events:none`;
    hero.appendChild(ph);
    const tl = gsap.timeline({ delay, paused: true });
    // wait for the hero image to be decoded (max 2.5s) so the blur→sharp focus is actually visible
    const ready = img && !img.complete ? Promise.race([img.decode ? img.decode().catch(() => {}) : new Promise((r) => img.addEventListener('load', r, { once: true })), new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
    gsap.set(hero, { clipPath: 'inset(28% 30% 28% 30% round 24px)' });
    ready.then(() => tl.play());
    tl.fromTo(hero, { clipPath: 'inset(28% 30% 28% 30% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.6, ease: 'expo.inOut' })
      .to(ph, { opacity: 0, duration: 0.6, ease: 'power1.out' }, 0.35)
      .fromTo(img, { scale: 1.25, filter: 'blur(28px)' }, { scale: 1, filter: 'blur(0px)', duration: 1.9, ease: 'expo.out' }, 0.4)
      .add(() => { ph.remove(); unlock(); hero.style.clipPath = ''; });
    return tl;
  }
  /* K1: focus pull — elements come out of blur when they enter (scrub) */
  function blurIn(els, { blur = 22, start = 'top 92%', end = 'top 55%', scale = 1.04 } = {}) {
    return $$(els).map((e) => gsap.fromTo(e, { filter: `blur(${blur}px)`, opacity: 0.35, scale }, { filter: 'blur(0px)', opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: e, start, end, scrub: 0.6 } }));
  }
  /* D7: character-level gray→ink reveal (finer than wordReveal) */
  function charReveal(el, { from = 0.25, start = 'top 85%', end = 'top 35%' } = {}) {
    return $$(el).map((e) => { const cs = splitChars(e); gsap.set(cs, { opacity: from });
      return gsap.to(cs, { opacity: 1, stagger: 0.02, ease: 'none', scrollTrigger: { trigger: e, start, end, scrub: 0.5 } }); });
  }
  /* F6: button carousel. track = flex row inside an overflow:hidden viewport */
  function carousel(track, { prev, next, step = null } = {}) {
    track = $(track); let i = 0;
    const items = () => [...track.children];
    const go = (d) => {
      const it = items(); const w = step || (it[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0));
      const max = Math.max(0, Math.ceil((track.scrollWidth - track.parentElement.clientWidth) / w));
      i = Math.min(max, Math.max(0, i + d));
      gsap.to(track, { x: -i * w, duration: 0.9, ease: 'expo.out' });
      prev && $(prev).classList.toggle('off', i === 0); next && $(next).classList.toggle('off', i === max);
    };
    prev && $(prev).addEventListener('click', () => go(-1));
    next && $(next).addEventListener('click', () => go(1));
    go(0);
    return { go };
  }
  /* I6: accordion with smooth height. root contains .acc-item > .acc-q + .acc-a */
  function accordion(root, { openFirst = true } = {}) {
    const items = $$(`${typeof root === 'string' ? root : ''} .acc-item`.trim(), typeof root === 'string' ? document : root);
    const set = (it, open) => { const a = it.querySelector('.acc-a'); it.classList.toggle('open', open);
      gsap.to(a, { height: open ? a.scrollHeight : 0, opacity: open ? 1 : 0, duration: 0.6, ease: 'expo.out' }); };
    items.forEach((it, k) => { const a = it.querySelector('.acc-a'); a.style.overflow = 'hidden'; gsap.set(a, { height: 0, opacity: 0 });
      it.querySelector('.acc-q').addEventListener('click', () => { const was = it.classList.contains('open'); items.forEach((o) => set(o, false)); if (!was) set(it, true); });
      if (openFirst && k === 0) set(it, true); });
  }
  /* E7: hero stays pinned (sticky) while the next section slides over it; hero media zooms/darkens */
  function overlapHero(hero, { media = null, wordmark = null } = {}) {
    hero = $(hero); const n = hero.nextElementSibling;
    // wrap hero + next section: sticky only lasts while the next section covers it (otherwise the hero
    // would stay stuck behind every following section until the end of the page)
    const wrap = document.createElement('div'); wrap.className = 'mk-overlap'; wrap.style.position = 'relative';
    hero.before(wrap); wrap.appendChild(hero); if (n) wrap.appendChild(n);
    hero.style.position = 'sticky'; hero.style.top = '0'; hero.style.zIndex = '0';
    if (n) { n.style.position = 'relative'; n.style.zIndex = '1'; if (!getComputedStyle(n).backgroundColor.match(/rgba?\((?!.*,\s*0\))/)) n.style.background = getComputedStyle(document.body).backgroundColor; }
    const tl = gsap.timeline({ scrollTrigger: { trigger: n || hero, start: 'top bottom', end: 'top top', scrub: true } });
    if (media) tl.to($(media), { scale: 1.12, filter: 'brightness(.55)', ease: 'none' }, 0);
    if (wordmark) tl.to($(wordmark), { yPercent: -60, opacity: 0, ease: 'none' }, 0);
    return tl;
  }
  /* H5: giant footer wordmark, letters rise from below (scrub) */
  function wordmark(el, { start = 'top bottom', end = 'bottom bottom' } = {}) {
    el = $(el); const cs = splitChars(el);
    return gsap.fromTo(cs, { yPercent: 100 }, { yPercent: 0, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: el, start, end, scrub: 0.6 } });
  }

  global.MK = {
    focusHero, blurIn, charReveal, carousel, accordion, overlapHero, wordmark,
    navTheme,
    smooth, velocity, lock, unlock, splitWords, splitChars, wrapLines, reduce,
    get lenis() { return lenis; },
    loader, enter,
    loopColumns, marquee, orbit, blob,
    wordReveal, splitIn, highlight, textScale, scramble, scrollX,
    pinScene, stack, horizontal,
    slideFromBehind, rise, clipReveal, stickyCards, fan,
    counter, bar, draw,
    parallax, collage, growIn, imageZoom,
    tilt, magnetic, cursor, bgSwap,
  };
})(window);
