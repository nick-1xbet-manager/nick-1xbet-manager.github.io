/* offer page: personal link, banners, GEO checker (localised) */
(function () {
  'use strict';
  var C = window.OFFER, GEO = window.GEO;
  var raw = new URLSearchParams(location.search).get('for') || '';
  var name = raw.replace(/[^\p{L}\p{N} _\-.@]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 40).trim();
  if (name) {
    var b = document.getElementById('offer-for');
    b.textContent = C.forLabel + ' ' + name; b.hidden = false;
    document.title = C.forLabel + ' ' + name + ' — ' + document.title;
  }
  if (typeof BANNERS !== 'undefined' && BANNERS.length) {
    var grid = document.getElementById('banner-grid');
    BANNERS.forEach(function (f) {
      var img = document.createElement('img');
      img.src = '/offer/banners/' + encodeURIComponent(f); img.alt = '1xBet banner'; img.loading = 'lazy'; img.width = 1080; img.height = 1080;
      grid.appendChild(img);
    });
    document.getElementById('banners').hidden = false;
  }

  var q = document.getElementById('geo-q'), reg = document.getElementById('geo-region'), chipsBox = document.getElementById('geo-chips');
  var list = document.getElementById('geo-list'), count = document.getElementById('geo-count'), more = document.getElementById('geo-more');
  var PAGE = 24, status = 'a', shown = PAGE, NI = C.nameIdx || 1;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var flag = function (code) { return /^[A-Z]{2}$/.test(code) && code !== 'AB' ? String.fromCodePoint.apply(null, code.split('').map(function (c) { return 0x1F1A5 + c.charCodeAt(0); })) : '🌐'; };
  var rname = function (r) { return (C.regions && C.regions[r]) || r; };
  Array.from(new Set(GEO.map(function (g) { return g[3]; }))).sort().forEach(function (r) { reg.add(new Option(rname(r), r)); });

  function chips() {
    var n = function (k) { return GEO.filter(function (g) { return (!k || g[4] === k) && (!reg.value || g[3] === reg.value); }).length; };
    chipsBox.innerHTML = [['a', C.st.a], ['', C.st.all], ['l', C.st.l], ['c', C.st.c], ['n', C.st.n]].map(function (x) {
      return '<button type="button" class="chip" data-k="' + x[0] + '" aria-pressed="' + (status === x[0]) + '">' + (x[0] ? '<span class="dot d-' + x[0] + '"></span>' : '') + esc(x[1]) + ' <i>' + n(x[0]) + '</i></button>';
    }).join('');
  }
  function render() {
    var s = q.value.trim().toLowerCase();
    var rows = GEO.filter(function (g) {
      return (!status || g[4] === status) && (!reg.value || g[3] === reg.value) &&
        (!s || [g[0], g[1], g[2], g[5], g[6]].join(' ').toLowerCase().indexOf(s) > -1);
    });
    count.textContent = rows.length + ' ' + (rows.length === 1 ? C.one : C.many) + ' · ' + C.tail;
    more.hidden = rows.length <= shown; more.textContent = C.showAll.replace('{n}', rows.length);
    list.innerHTML = rows.length ? rows.slice(0, shown).map(function (g) {
      var vals = [g[5], g[6], g[7], g[8]];
      var m = vals.map(function (v, i) { return v ? '<div><span>' + esc(C.more[i]) + '</span> <b>' + esc(v) + '</b></div>' : ''; }).join('');
      return '<button type="button" class="g" aria-expanded="false"><div class="g-top"><span class="g-flag" aria-hidden="true">' + flag(g[0]) + '</span>' +
        '<span class="g-name">' + esc(g[NI] || g[1]) + '<small>' + esc(g[0]) + ' · ' + esc(rname(g[3])) + '</small></span>' +
        '<span class="st"><span class="dot d-' + g[4] + '"></span>' + esc(C.st[g[4]]) + '</span></div>' +
        (g[9] ? '<div class="g-flagnote">' + esc(g[9]) + '</div>' : '') + '<div class="g-more">' + m + '</div></button>';
    }).join('') : '<div class="geo-empty">' + C.empty + '</div>';
  }
  chipsBox.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; status = b.dataset.k; shown = PAGE; chips(); render(); });
  list.addEventListener('click', function (e) { var b = e.target.closest('.g'); if (!b) return; b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); });
  q.addEventListener('input', function () { if (q.value.trim() && status) { status = ''; chips(); } render(); });
  reg.addEventListener('change', function () { shown = PAGE; chips(); render(); });
  more.addEventListener('click', function () { shown = Infinity; render(); });
  document.addEventListener('geo:pick', function (e) {
    var g = GEO.filter(function (x) { return x[0] === e.detail; })[0]; if (!g) return;
    q.value = g[1]; status = ''; reg.value = ''; chips(); render();
    var first = list.querySelector('.g'); if (first) first.setAttribute('aria-expanded', 'true');
    q.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  chips(); render();
})();
