/* Nick — 1xBet Affiliate Manager · motion + map (no libraries) */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(pointer: fine)').matches;
  var T = window.I18N || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* scroll progress + header state */
  var bar = $('.progress i'), hd = $('.hd'), ticking = false;
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.setProperty('--p', max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    if (hd) hd.classList.toggle('scrolled', h.scrollTop > 8);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* fit kinetic words to the column, like the bot videos */
  function fitWords() {
    $$('.k-word,.k-hero').forEach(function (k) {
      k.style.fontSize = '';
      var wr = k.closest('.wrap'), cs = getComputedStyle(wr), avail = wr.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), w = 0;
      $$('span', k).forEach(function (s) { w = Math.max(w, s.scrollWidth); });
      if (w > avail) k.style.fontSize = (parseFloat(getComputedStyle(k).fontSize) * avail / w * 0.98) + 'px';
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWords);
  fitWords();
  window.addEventListener('resize', fitWords);

  /* one-shot reveals: kinetic scenes, steps line, counters */
  function once(els, threshold, fn) {
    if (!('IntersectionObserver' in window) || RM) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } });
    }, { threshold: threshold });
    els.forEach(function (el) { io.observe(el); });
  }
  once($$('.scene'), 0.35, function (el) { el.classList.add('in'); });
  once($$('.steps'), 0.4, function (el) { el.classList.add('in'); });

  var nf = new Intl.NumberFormat(document.documentElement.lang || 'en');
  function countUp(el) {
    var to = +el.dataset.count, suf = el.dataset.suffix || '', raw = el.dataset.raw === '1';
    var fmt = function (v) { return (raw ? String(v) : nf.format(v)) + suf; };
    if (RM) { el.textContent = fmt(to); return; }
    var from = +(el.dataset.from || 0), t0 = performance.now(), dur = 1400;
    (function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  once($$('[data-count]'), 0.6, countUp);

  /* magnetic CTAs */
  if (FINE && !RM) $$('[data-mag]').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.32;
      b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
    b.addEventListener('pointerleave', function () {
      b.style.transition = 'transform .5s cubic-bezier(.2,1.6,.4,1)'; b.style.transform = '';
      setTimeout(function () { b.style.transition = ''; }, 500);
    });
  });

  /* sticky mobile CTA: only between hero and final block */
  var sticky = $('.sticky'), heroCta = $('.hero-cta'), fin = $('.final');
  if (sticky && 'IntersectionObserver' in window) {
    var heroGone = false, finIn = false;
    var upd = function () { sticky.classList.toggle('on', heroGone && !finIn); };
    if (heroCta) new IntersectionObserver(function (e) { heroGone = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; upd(); }).observe(heroCta);
    if (fin) new IntersectionObserver(function (e) { finIn = e[0].isIntersecting; upd(); }).observe(fin);
  }

  /* FAQ: smooth open/close on native <details> */
  $$('.faq details').forEach(function (d) {
    var s = $('summary', d), a = $('.ans', d);
    s.addEventListener('click', function (e) {
      if (RM || !a.animate) return;
      e.preventDefault();
      if (d.open) {
        a.animate([{ height: a.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: 'ease' })
          .onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var h = a.offsetHeight;
        a.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });

  /* language menu: close on outside click / Esc */
  $$('.lang').forEach(function (l) {
    document.addEventListener('click', function (e) { if (l.open && !l.contains(e.target)) l.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') l.open = false; });
  });

  /* ================= dot map ================= */
  var stage = $('.map-stage');
  if (!stage || !window.MAPDOTS || !window.GEO) return;
  var M = window.MAPDOTS, cvs = $('canvas', stage), tip = $('.map-tip', stage), ctx = cvs.getContext('2d');
  var nameIdx = T.nameIdx || 1;
  var byCode = {};
  window.GEO.forEach(function (g) { byCode[g[0]] = g; });
  var LIC = 2, AV = 1, NO = 0;
  function kind(code) {
    var g = byCode[code];
    if (!g) return NO;
    if (/Local licence/.test(g[8]) && g[4] === 'a') return LIC;
    return g[4] === 'a' ? AV : NO;
  }
  var focusList = { world: [0, 225, 3, 84], latam: [26, 95, 26, 85], africa: [90, 145, 24, 76], cis: [112, 175, 8, 40], asia: [118, 205, 10, 60] };
  var F = focusList[stage.dataset.focus] || focusList.world;
  var hl = (stage.dataset.highlight || '').split(',').filter(Boolean);

  var dots = [];
  for (var i = 0; i < M.d.length; i += 3) {
    var code = M.codes[M.d[i + 2]];
    dots.push({ c: M.d[i], r: M.d[i + 1], code: code, k: kind(code), x: 0, y: 0 });
  }
  var lic = {}; dots.forEach(function (d) { if (d.k === LIC) (lic[d.code] = lic[d.code] || []).push(d); });
  var licCodes = Object.keys(lic);
  var all = {}; dots.forEach(function (d) { (all[d.code] = all[d.code] || []).push(d); });
  var hlCodes = hl.filter(function (c) { return all[c]; });

  var W, H, cell, dpr, base = document.createElement('canvas'), bctx = base.getContext('2d');
  var COLORS = ['#c9d9ec', '#8cbbe9', '#1257a8'];
  function layout() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cvs.width = base.width = Math.round(W * dpr); cvs.height = base.height = Math.round(H * dpr);
    var fw = F[1] - F[0], fh = F[3] - F[2];
    cell = Math.min(W / fw, H / fh);
    var ox = (W - fw * cell) / 2 - F[0] * cell, oy = (H - fh * cell) / 2 - F[2] * cell;
    dots.forEach(function (d) { d.x = ox + (d.c + .5) * cell; d.y = oy + (d.r + .5) * cell; });
    drawBase(1e9);
  }
  function rad(d) { return cell * (d.k === LIC ? .36 : .29); }
  function drawBase(t) {
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.clearRect(0, 0, W, H);
    for (var j = 0; j < dots.length; j++) {
      var d = dots[j];
      if (d.x < -cell || d.x > W + cell || d.y < -cell || d.y > H + cell) continue;
      var a = Math.max(0, Math.min(1, (t - d.c * 5) / 380));
      if (!a) continue;
      var k = d.k;
      if (k === LIC) { var la = Math.max(0, Math.min(1, (t - 1300 - d.c * 4) / 300)); bctx.fillStyle = la ? COLORS[2] : COLORS[1]; }
      else bctx.fillStyle = COLORS[k];
      if (hl.length && hl.indexOf(d.code) > -1) bctx.fillStyle = '#042d6e';
      bctx.globalAlpha = a;
      bctx.beginPath(); bctx.arc(d.x, d.y, rad(d) * (0.6 + 0.4 * a), 0, 6.283); bctx.fill();
    }
    bctx.globalAlpha = 1;
  }

  var hover = null, pulses = [], t0 = performance.now(), introDone = RM, visible = true, raf = 0, lastPulse = 0;
  function frame(now) {
    raf = 0;
    var t = now - t0;
    if (!introDone) { drawBase(t); if (t > 2200) introDone = true; }
    if (!base.width || !base.height) { if (visible) raf = requestAnimationFrame(frame); return; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!RM && t > 1800 && now - lastPulse > 650 && licCodes.length) {
      lastPulse = now;
      var pool = hlCodes.length && Math.random() < .6 ? hlCodes : licCodes;
      var code = pool[(Math.random() * pool.length) | 0], ds = lic[code] || all[code], d = ds[(ds.length / 2) | 0];
      pulses.push({ x: d.x, y: d.y, s: now });
    }
    pulses = pulses.filter(function (p) {
      var k = (now - p.s) / 1800; if (k >= 1) return false;
      ctx.strokeStyle = 'rgba(47,139,224,' + (0.55 * (1 - k)) + ')'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(p.x, p.y, cell * (0.6 + k * 4.2), 0, 6.283); ctx.stroke();
      return true;
    });
    if (hover) {
      ctx.fillStyle = '#042d6e';
      dots.forEach(function (d) { if (d.code === hover) { ctx.beginPath(); ctx.arc(d.x, d.y, cell * .4, 0, 6.283); ctx.fill(); } });
    }
    if (visible && (!introDone || pulses.length || !RM)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  function label(code) {
    var g = byCode[code], k = kind(code);
    var st = k === LIC ? T.lic : k === AV ? T.av : (g && g[4] === 'l' ? T.lp : g && g[4] === 'c' ? T.cf : T.no);
    var nm = g ? g[nameIdx] || g[1] : code;
    return '<b>' + nm.replace(/</g, '&lt;') + '</b>' + st;
  }
  function pick(e) {
    var r = cvs.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = null, bd = (cell * 1.4) * (cell * 1.4);
    for (var j = 0; j < dots.length; j++) { var d = dots[j], dx = d.x - x, dy = d.y - y, q = dx * dx + dy * dy; if (q < bd) { bd = q; best = d; } }
    return best ? { d: best, x: x, y: y } : null;
  }
  cvs.addEventListener('pointermove', function (e) {
    var p = pick(e);
    hover = p ? p.d.code : null;
    if (p && byCode[p.d.code]) {
      tip.innerHTML = label(p.d.code);
      tip.style.left = Math.max(80, Math.min(W - 80, p.d.x)) + 'px'; tip.style.top = p.d.y + 'px';
      tip.classList.add('on'); cvs.style.cursor = stage.dataset.pick ? 'pointer' : 'default';
    } else tip.classList.remove('on');
    kick();
  });
  cvs.addEventListener('pointerleave', function () { hover = null; tip.classList.remove('on'); kick(); });
  cvs.addEventListener('click', function (e) {
    var p = pick(e); if (p && byCode[p.d.code]) document.dispatchEvent(new CustomEvent('geo:pick', { detail: p.d.code }));
  });

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); if (introDone) drawBase(1e9); kick(); }).observe(stage);
  layout(); if (!RM) drawBase(0); kick();
})();
