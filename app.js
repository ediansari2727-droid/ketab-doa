(function () {
  'use strict';
  var DUAS = window.DUAS || [];
  var BY = {}; DUAS.forEach(function (d) { BY[d.id] = d; });
  var META = {
    kursi: { b: 'آ', when: 'صبح و شب' },
    qul: { b: 'ق', when: 'صبح و شب' },
    yasin: { b: 'یس', when: 'هر وقت خواستید' },
    arsh: { b: 'ع', when: 'روزی یک بار' },
    estegh: { b: 'غ', when: 'روزی یک بار' },
    afv: { b: 'ف', when: 'شب، پیش از خواب' },
    namaz: { b: 'ن', when: 'هر وقت خواستید' },
    amal: { b: 'ص', when: 'هر روز، حتی اندک' },
    sources: { b: 'م', when: 'پیوست' }
  };
  var SW = { s6: 'صبح و شام', s7: 'هنگام گرفتاری', s8: 'روزانه', s17: 'روزانه', s20: 'هر وقت خواستید', s21: 'هنگام اندوه', s23: 'روزانه', s29: 'هنگام تنگی روزی', s30: 'برای ادای وام', s49: 'هنگام آزار بدخواهان', s54: 'هنگام اندوه' };
  Object.keys(SW).forEach(function (k) { META[k] = { b: fa(k.slice(1)), when: SW[k], off: k !== 's6' }; });
  function defOn(id) { return !(META[id] && META[id].off); }
  var DEFAULT_ORDER = DUAS.map(function (d) { return d.id; }).filter(function (id) { return id !== 'sources'; });
  var KEY = 'doa-app-v1';
  var app = document.getElementById('app');
  var root = document.documentElement;

  // ---------- state ----------
  var st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { st = {}; }
  function def(k, v) { if (st[k] === undefined) st[k] = v; }
  def('order', DEFAULT_ORDER.slice());
  def('plan', DEFAULT_ORDER.reduce(function (o, id) { o[id] = defOn(id); return o; }, {}));
  def('log', {});
  def('ar', 0); def('fa', 0);
  def('far', '"Amiri",serif'); def('ffa', '"Vazirmatn",Tahoma,sans-serif');
  def('tr', true); def('wake', false); def('theme', 'auto');
  def('rem', [{ t: '07:00', on: true }, { t: '21:30', on: true }]);
  def('notified', {}); def('pos', {});
  def('tas', { i: 0, n: 0, goal: 33 }); def('fav', []); def('accent', 'lapis'); def('favLoop', false);
  // new duas added later go to the end of the user's order
  DEFAULT_ORDER.forEach(function (id) { if (st.order.indexOf(id) < 0) { st.order.push(id); st.plan[id] = defOn(id); } });
  st.order = st.order.filter(function (id) { return BY[id]; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} mirrorToSW(); if (typeof nativeSchedule === 'function') { clearTimeout(save._n); save._n = setTimeout(nativeSchedule, 800); } }

  // ---------- helpers ----------
  function fa(n) { return String(n).replace(/\d/g, function (c) { return '۰۱۲۳۴۵۶۷۸۹'[c]; }); }
  function dkey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function today() { return dkey(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function planIds() { return st.order.filter(function (id) { return st.plan[id]; }); }
  function doneMap(k) { return st.log[k || today()] || {}; }
  function isDone(id, k) { return !!doneMap(k)[id]; }
  function countDone(k) { var m = doneMap(k); return planIds().filter(function (id) { return m[id]; }).length; }
  function setDone(id, v) {
    var k = today(); var m = st.log[k] || (st.log[k] = {});
    if (v) m[id] = Date.now(); else delete m[id];
    save();
  }
  function streak() {
    var n = 0, d = new Date(), total = planIds().length;
    if (!total) return 0;
    if (countDone(dkey(d)) < total) d.setDate(d.getDate() - 1);
    for (;;) { var m = st.log[dkey(d)]; if (!m || Object.keys(m).length < Math.min(total, 1) || countFull(dkey(d)) === false) break; n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  // a past day counts as full if every dua in the current plan was ticked
  function countFull(k) { var m = st.log[k] || {}; return planIds().every(function (id) { return m[id]; }); }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function dates() {
    var d = new Date(), s = '', q = '';
    try { var f = function (o) { return d.toLocaleDateString('fa-IR-u-ca-persian', o); }; s = f({ weekday: 'long' }) + ' ' + f({ day: 'numeric' }) + ' ' + f({ month: 'long' }) + ' ' + f({ year: 'numeric' }).replace(/[^۰-۹]/g, ''); } catch (e) {}
    try { q = d.toLocaleDateString('fa-IR-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}
    return s + (q ? ' · ' + q : '');
  }

  // ---------- appearance ----------
  var ACCENTS = {
    lapis: ['لاجوردی', '#1F45A3', '#14307A', '#0C6E73'], emerald: ['زمردی', '#127A55', '#0B4D3A', '#1F8A63'],
    turquoise: ['فیروزه‌ای', '#0C7C86', '#0A4F55', '#1593A0'], ruby: ['یاقوتی', '#A3264A', '#6E1530', '#A8475E'],
    violet: ['بنفش', '#5B3AA6', '#36206E', '#7254C2'], gold: ['طلایی', '#A8670A', '#6B4310', '#B0832E'],
    rose: ['گلبهی', '#B0457A', '#7A2850', '#C0607F'], night: ['سرمه‌ای', '#34446B', '#141B2E', '#3A4A72']
  };
  var AR_SIZES = [1.2, 1.35, 1.5, 1.65, 1.8, 2, 2.2, 2.45, 2.7, 3];
  var FA_SIZES = [0.85, 0.92, 1, 1.08, 1.18, 1.3, 1.42, 1.56, 1.7];
  function applyLook() {
    var ai = Math.max(-3, Math.min(6, st.ar)), fi = Math.max(-2, Math.min(6, st.fa));
    root.style.setProperty('--ar-size', AR_SIZES[ai + 3] + 'rem');
    root.style.setProperty('--fa-size', FA_SIZES[fi + 2] + 'rem');
    root.style.setProperty('--f-ar', st.far);
    root.style.setProperty('--f-fa', st.ffa);
    if (st.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', st.theme);
    var A = ACCENTS[st.accent] || ACCENTS.lapis;
    root.style.setProperty('--accb', A[1]); root.style.setProperty('--h1', A[2]); root.style.setProperty('--h2', A[3]);
    document.body.classList.toggle('hide-fa', !st.tr);
    var oa = document.getElementById('o-ar'), of = document.getElementById('o-fa');
    if (oa) oa.textContent = fa(ai + 4); if (of) of.textContent = fa(fi + 3);
    document.getElementById('s-far').value = st.far;
    document.getElementById('s-ffa').value = st.ffa;
    document.getElementById('s-tr').setAttribute('aria-checked', String(!!st.tr));
    document.getElementById('s-wake').setAttribute('aria-checked', String(!!st.wake));
    document.querySelectorAll('#s-theme button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === st.theme)); });
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = st.theme === 'dark' ? '#0A101E' : st.theme === 'sepia' ? '#7A5A22' : '#14307A';
  }
  document.getElementById('sheet').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.step) { var p = b.dataset.step.split(':'); st[p[0]] += +p[1]; st.ar = Math.max(-3, Math.min(6, st.ar)); st.fa = Math.max(-2, Math.min(6, st.fa)); }
    else if (b.id === 's-tr') st.tr = !st.tr;
    else if (b.id === 's-wake') { st.wake = !st.wake; wake(); }
    else if (b.dataset.v) st.theme = b.dataset.v;
    else if (b.id === 'sheet-close') { sheet(false); return; }
    save(); applyLook();
  });
  document.getElementById('s-far').addEventListener('change', function (e) { st.far = e.target.value; save(); applyLook(); });
  document.getElementById('s-ffa').addEventListener('change', function (e) { st.ffa = e.target.value; save(); applyLook(); });
  document.getElementById('sheet-bg').addEventListener('click', function () { sheet(false); });
  function sheet(open) { document.getElementById('sheet').hidden = !open; document.getElementById('sheet-bg').hidden = !open; }

  var lock = null;
  function wake() {
    var reading = document.body.classList.contains('reading');
    if (st.wake && reading && 'wakeLock' in navigator && !lock) {
      navigator.wakeLock.request('screen').then(function (l) { lock = l; l.addEventListener('release', function () { lock = null; }); }).catch(function () {});
    } else if ((!st.wake || !reading) && lock) { lock.release(); lock = null; }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { wake(); checkMissed(); if (cur === 'home') render(); } });

  // ---------- one audio player for the whole app (keeps playing across pages) ----------
  var G = new Audio(); G.preload = 'metadata';
  var gInfo = null, sleepT = null, sleepAt = 0, SPEEDS = [1, 1.25, 1.5, 0.75];
  def('speed', 1);
  function gPlay(src, info, t0) {
    if (G._src !== src) { G._src = src; G.src = src; }
    gInfo = info; G.playbackRate = st.speed || 1;
    if (t0 != null) { var go = function () { G.currentTime = t0; }; if (G.readyState >= 1) go(); else G.addEventListener('loadedmetadata', go, { once: true }); }
    G.play().catch(function () {});
    if ('mediaSession' in navigator && window.MediaMetadata) try { navigator.mediaSession.metadata = new MediaMetadata({ title: info.label, artist: info.title, album: 'کتاب دعای روزانه', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }); } catch (e) {}
    mini();
  }
  function gStop() { clearInterval(segTimer); queue = null; G.pause(); gInfo = null; G.loop = false; clearTimeout(sleepT); sleepAt = 0; mini(); syncPlayers();
    document.querySelectorAll('.fv.playing').forEach(function (x) { x.classList.remove('playing'); }); }
  if ('mediaSession' in navigator) try {
    navigator.mediaSession.setActionHandler('play', function () { G.play(); });
    navigator.mediaSession.setActionHandler('pause', function () { G.pause(); });
    navigator.mediaSession.setActionHandler('stop', gStop);
    navigator.mediaSession.setActionHandler('seekbackward', function () { G.currentTime = Math.max(0, G.currentTime - 10); });
    navigator.mediaSession.setActionHandler('seekforward', function () { G.currentTime = G.currentTime + 10; });
  } catch (e) {}
  function mmss(t) { t = Math.max(0, Math.round(t || 0)); return fa(Math.floor(t / 60)) + ':' + fa(String(t % 60).padStart(2, '0')); }
  var miniEl = document.createElement('div'); miniEl.className = 'mini'; miniEl.hidden = true; document.body.appendChild(miniEl);
  miniEl.innerHTML = '<button class="mp" id="m-pp" aria-label="پخش/مکث">▶</button><button class="m-t" id="m-go"><b id="m-l"></b><small id="m-s"></small></button>' +
    '<button class="mb" id="m-b" aria-label="۱۰ ثانیه عقب">↻۱۰</button><button class="mb" id="m-sp" aria-label="سرعت">۱×</button><button class="mb" id="m-sl" aria-label="تایمر خاموشی">☾</button>' +
    '<button class="mb" id="m-lp" aria-label="تکرار" aria-pressed="false">⟲</button><button class="mb" id="m-x" aria-label="توقف و بستن">✕</button><div class="m-bar"><i id="m-f"></i></div>';
  function mini() {
    var show = !!gInfo; miniEl.hidden = !show; document.body.classList.toggle('has-mini', show);
    if (!show) return;
    document.getElementById('m-pp').textContent = G.paused ? '▶' : '❚❚';
    document.getElementById('m-l').textContent = gInfo.label;
    document.getElementById('m-s').textContent = mmss(G.currentTime) + ' / ' + mmss(G.duration) + (sleepAt ? ' · خاموشی ' + mmss((sleepAt - Date.now()) / 1000) : '');
    document.getElementById('m-sp').textContent = fa(st.speed || 1) + '×';
    document.getElementById('m-lp').setAttribute('aria-pressed', String(G.loop));
    document.getElementById('m-f').style.width = (G.duration ? G.currentTime / G.duration * 100 : 0) + '%';
  }
  miniEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'm-pp') { if (G.paused) G.play(); else G.pause(); }
    else if (b.id === 'm-x') gStop();
    else if (b.id === 'm-b') G.currentTime = Math.max(0, G.currentTime - 10);
    else if (b.id === 'm-sp') { var i = (SPEEDS.indexOf(st.speed || 1) + 1) % SPEEDS.length; st.speed = SPEEDS[i]; G.playbackRate = st.speed; save(); toast('سرعت پخش: ' + fa(st.speed) + '×'); }
    else if (b.id === 'm-lp') { G.loop = !G.loop; toast(G.loop ? 'تکرار روشن شد' : 'تکرار خاموش شد'); }
    else if (b.id === 'm-sl') {
      var opts = [0, 15, 30, 60], curM = sleepAt ? Math.round((sleepAt - Date.now()) / 60000) : 0, nx = 15;
      for (var k = 0; k < opts.length; k++) if (opts[k] > curM) { nx = opts[k]; break; } if (curM >= 60) nx = 0;
      clearTimeout(sleepT); sleepAt = 0;
      if (nx) { sleepAt = Date.now() + nx * 60000; sleepT = setTimeout(function () { G.pause(); sleepAt = 0; mini(); toast('صوت با تایمر خاموش شد'); }, nx * 60000); toast('خاموشی پس از ' + fa(nx) + ' دقیقه'); }
      else toast('تایمر خاموشی برداشته شد');
    }
    else if (b.id === 'm-go' && gInfo && gInfo.id) location.hash = gInfo.fav ? '#/fav' : '#/d/' + gInfo.id;
    mini(); syncPlayers();
  });
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach(function (ev) { G.addEventListener(ev, function () { mini(); syncPlayers(); }); });
  // in-page players are drawn by us and drive the shared audio
  function syncPlayers() {
    document.querySelectorAll('.cp').forEach(function (cp) {
      var mine = G._src === cp.dataset.src && gInfo;
      cp.querySelector('.cp-pp').textContent = mine && !G.paused ? '❚❚' : '▶';
      cp.classList.toggle('on', !!mine);
      if (mine && G.duration) { var r = cp.querySelector('.cp-bar'); if (!r._drag) r.value = Math.round(G.currentTime / G.duration * 1000); cp.querySelector('.cp-t').textContent = mmss(G.currentTime) + ' / ' + mmss(G.duration); }
      else if (!mine) { cp.querySelector('.cp-bar').value = 0; }
    });
  }
  function buildPlayers(id) {
    app.querySelectorAll('.player').forEach(function (pl) {
      var a = pl.querySelector('audio'); if (!a) return;
      var src = a.getAttribute('src'), label = (pl.querySelector('span') || {}).textContent || BY[id].title;
      label = label.replace('🔊', '').trim();
      var cp = document.createElement('div'); cp.className = 'cp'; cp.dataset.src = src;
      cp.innerHTML = '<button class="cp-pp" aria-label="پخش/مکث">▶</button><input class="cp-bar" type="range" min="0" max="1000" value="0" aria-label="جای پخش"><span class="cp-t">۰:۰۰</span>';
      a.replaceWith(cp);
      cp.querySelector('.cp-pp').onclick = function () {
        if (G._src === src && gInfo) { if (G.paused) G.play(); else G.pause(); }
        else { clearInterval(segTimer); queue = null; gPlay(src, { id: id, title: BY[id].title.replace(/<[^>]+>/g, ''), label: label }); }
      };
      var r = cp.querySelector('.cp-bar');
      r.addEventListener('input', function () { r._drag = true; });
      r.addEventListener('change', function () { r._drag = false; if (G._src !== src || !gInfo) gPlay(src, { id: id, title: BY[id].title.replace(/<[^>]+>/g, ''), label: label }); var go = function () { if (G.duration) G.currentTime = r.value / 1000 * G.duration; }; if (G.readyState >= 1) go(); else G.addEventListener('loadedmetadata', go, { once: true }); });
    });
    syncPlayers();
  }

  // ---------- views ----------
  var cur = '', sortable = null, editing = false, readId = null;
  function card(id, i) {
    var d = BY[id], m = META[id] || { b: '•', when: '' }, done = isDone(id), on = !!st.plan[id];
    return '<li class="card c-' + d.color + (done ? ' is-done' : '') + (on ? '' : ' off') + '" data-id="' + id + '">' +
      '<button class="handle" aria-label="جابه‌جا کردن">⋮⋮</button>' +
      '<a class="badge" href="#/d/' + id + '" tabindex="-1" aria-hidden="true">' + m.b + '</a>' +
      '<a class="t" href="#/d/' + id + '" style="text-decoration:none"><strong>' + d.title + '</strong><small>' + d.sub + '</small>' +
      (on ? '<span class="when">' + m.when + '</span>' : '<span class="when">' + ((META[id] || {}).when ? META[id].when + ' · ' : '') + 'خارج از برنامه</span>') + '</a>' +
      '<button class="chk" aria-pressed="' + done + '" aria-label="خواندم: ' + esc(d.title.replace(/<[^>]+>/g, '')) + '">✓</button>' +
      '<button class="sw tog" role="switch" aria-checked="' + on + '" aria-label="در برنامهٔ روزانه"></button>' +
      '</li>';
  }
  function ring(p) {
    var r = 36, c = 2 * Math.PI * r;
    return '<div class="ring"><svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r="' + r + '" fill="none" stroke="var(--rule)" stroke-width="8"/>' +
      '<circle cx="42" cy="42" r="' + r + '" fill="none" stroke="var(--green)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - p)) + '"/></svg><b>' + fa(Math.round(p * 100)) + '٪</b></div>';
  }
  function home() {
    var ids = planIds(), n = countDone(), tot = ids.length, s = streak();
    var next = ids.filter(function (id) { return !isDone(id); })[0];
    var miss = missedNow();
    var h = '<header class="hero"><div class="in"><div class="bism">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div><h1>کتاب دعای روزانه</h1><div class="dates">' + dates() + '</div></div></header><div class="wrap">';
    h += '<div class="prog">' + ring(tot ? n / tot : 0) + '<div><h2>برنامهٔ امروز</h2><p>' + fa(n) + ' از ' + fa(tot) + ' خوانده شد</p>' +
      (s ? '<span class="streak">🔥 ' + fa(s) + ' روز پیاپی</span> ' : '') +
      (next ? '<a class="btn" style="margin-top:.4rem;padding:.4rem 1rem;font-size:.88rem" href="#/d/' + next + '">ادامه: ' + BY[next].title + ' ←</a>' : '') + '</div></div>';
    if (tot && n === tot) h += '<div class="allgood">الحمدلله؛ همهٔ دعاهای امروز خوانده شد ✓</div>';
    else if (miss) h += '<div class="banner">⏰ <span><b>یادآور ' + fa(miss) + ':</b> هنوز ' + fa(tot - n) + ' دعا از برنامهٔ امروز مانده است.</span></div>';
    h += '<a class="searchbar" href="#/search">⌕ جستجو در همهٔ دعاها و ترجمه‌ها</a>';
    h += '<div class="sec-h"><h2>فهرست دعاها</h2><button class="chipbtn" id="edit" aria-pressed="' + editing + '">' + (editing ? 'تمام ✓' : '↕ ترتیب و برنامه') + '</button></div>';
    h += '<ul class="cards' + (editing ? ' editing' : '') + '" id="cards">' + st.order.map(card).join('') + '</ul>';
    h += editing ? '<p class="hint">کارت‌ها را با دستگیرهٔ ⋮⋮ بکشید تا ترتیب عوض شود. با کلید کنار هر دعا، آن را در برنامهٔ روزانه بگذارید یا بردارید.</p>' : '';
    h += '<div class="sec-h"><h2>بیشتر</h2></div><div class="extras">' +
      '<a class="card c-slate" href="#/d/sources" style="grid-template-columns:auto 1fr"><span class="badge">م</span><span class="t"><strong>منابع</strong><small>سند متن‌ها و ترجمه</small></span></a>' +
      '<a class="card c-lapis" href="#/tasbih" style="grid-template-columns:auto 1fr"><span class="badge">◎</span><span class="t"><strong>تسبیح</strong><small>شمارندهٔ ذکر</small></span></a></div>';
    h += '</div>';
    app.innerHTML = h;
    document.getElementById('edit').onclick = function () { editing = !editing; render(); };
    var list = document.getElementById('cards');
    list.addEventListener('click', function (e) {
      var li = e.target.closest('.card'); if (!li) return; var id = li.dataset.id;
      if (e.target.closest('.chk')) { var v = !isDone(id); setDone(id, v); if (v && navigator.vibrate) navigator.vibrate(25); render(); if (v && countDone() === planIds().length) toast('برنامهٔ امروز کامل شد 🌿'); }
      else if (e.target.closest('.tog')) { st.plan[id] = !st.plan[id]; save(); render(); }
      else if (editing && e.target.closest('a')) e.preventDefault();
    });
    if (sortable) { sortable.destroy(); sortable = null; }
    if (editing && window.Sortable) {
      sortable = Sortable.create(list, { handle: '.handle', animation: 160, delay: 0, onEnd: function () {
        st.order = Array.prototype.map.call(list.children, function (li) { return li.dataset.id; }); save();
      } });
    }
  }

  function reader(id) {
    var d = BY[id]; if (!d) { location.hash = '#/'; return; }
    readId = id;
    var ids = st.order, i = ids.indexOf(id), nextId = null;
    for (var j = 1; j <= ids.length; j++) { var c = ids[(i + j) % ids.length]; if (c !== id && st.plan[c] && !isDone(c)) { nextId = c; break; } }
    var done = isDone(id), inPlan = id !== 'sources';
    var h = '<div class="c-' + d.color + '"><div class="rprog" id="rprog"></div><div class="rbar"><a class="ib" href="#/" aria-label="بازگشت">→</a><h1>' + d.title + '</h1>' +
      '<button class="ib" id="aa" aria-label="اندازه و خط">Aa</button></div><div class="wrap">' +
      '<article class="frame"><div class="ch-h"><div class="orn">۞</div><span class="eyebrow">' + d.eyebrow + '</span><h2>' + d.title + '</h2>' + (d.sub ? '<p class="ch-sub">' + d.sub + '</p>' : '') + '</div>' +
      '<div class="ch-b">' + d.body + '</div></article>';
    if (inPlan) h += '<div class="mark"><button class="btn wide' + (done ? ' done' : '') + '" id="mk">' + (done ? '✓ امروز خوانده شد' : 'خواندم ✓') + '</button>' +
      (nextId ? '<a class="btn ghost wide" href="#/d/' + nextId + '">دعای بعدی: ' + BY[nextId].title + ' ←</a>' : '<a class="btn ghost wide" href="#/">بازگشت به فهرست</a>') + '</div>';
    h += '</div></div>';
    app.innerHTML = h;
    document.getElementById('aa').onclick = function () { sheet(true); };
    var mk = document.getElementById('mk');
    if (mk) mk.onclick = function () {
      var v = !isDone(id); setDone(id, v);
      mk.classList.toggle('done', v); mk.textContent = v ? '✓ امروز خوانده شد' : 'خواندم ✓';
      if (v) { if (navigator.vibrate) navigator.vibrate(30); toast(countDone() === planIds().length ? 'برنامهٔ امروز کامل شد 🌿' : 'ثبت شد؛ ' + fa(planIds().length - countDone()) + ' دعا مانده'); }
    };
    // favourites: a star on every passage
    app.querySelectorAll('.ch-b .pa').forEach(function (sec, i) {
      sec.id = 'p' + i;
      var sh = document.createElement('button'); sh.className = 'star share'; sh.setAttribute('aria-label', 'کپی یا ارسال این بند'); sh.textContent = '⇪';
      sh.onclick = function () { sharePa(id, sec); }; sec.appendChild(sh);
      var b = document.createElement('button'); b.className = 'star'; b.setAttribute('aria-label', 'افزودن به منتخب‌ها');
      var on = favIdx(id, i) >= 0; b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '★' : '☆';
      b.onclick = function () { var k = favIdx(id, i); if (k >= 0) { st.fav.splice(k, 1); toast('از منتخب‌ها برداشته شد'); } else { st.fav.push({ id: id, i: i }); toast('به منتخب‌ها اضافه شد ★'); }
        save(); var o = favIdx(id, i) >= 0; b.setAttribute('aria-pressed', String(o)); b.textContent = o ? '★' : '☆'; };
      sec.appendChild(b);
    });
    buildPlayers(id);
    var y = st.pos[id] || 0, jt = jumpTo; jumpTo = null;
    requestAnimationFrame(function () {
      if (jt != null && document.getElementById('p' + jt)) { var el = document.getElementById('p' + jt); el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 2200); }
      else { window.scrollTo(0, y); if (y > 300) toast('از جایی که مانده بودید ادامه دهید'); }
      onScroll();
    });
  }
  var posT;
  function onScroll() {
    if (cur !== 'read') return;
    var max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? scrollY / max : 0;
    var b = document.getElementById('rprog'); if (b) b.style.width = (p * 100) + '%';
    clearTimeout(posT); posT = setTimeout(function () { if (readId) { st.pos[readId] = scrollY > max - 50 ? 0 : Math.round(scrollY); save(); } }, 400);
  }
  addEventListener('scroll', onScroll, { passive: true });

  function plain(h) { var t = document.createElement('div'); t.innerHTML = h; t.querySelectorAll('.star,.n').forEach(function (x) { x.remove(); }); return t.textContent.replace(/\s+/g, ' ').trim(); }
  function sharePa(id, sec) {
    var ar = sec.querySelector('.ar,.q'), fa_ = sec.querySelector('.fa');
    var txt = (ar ? plain(ar.innerHTML) : '') + (fa_ ? '\n\n' + plain(fa_.innerHTML) : '') + '\n\n— ' + plain(BY[id].title) + ' (' + plain(BY[id].eyebrow) + ')';
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; }
    copyText(txt, 'متن این بند کپی شد');
  }
  function copyText(txt, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('کپی نشد'); } t.remove(); }
  }
  // search: Arabic matching ignores harakat and letter variants
  function normAr(t) { return t.replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/[ىي]/g, 'ی').replace(/ك/g, 'ک').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ی').replace(/\u200c/g, ' '); }
  var IDX = null, sq = '';
  function buildIdx() {
    IDX = [];
    DUAS.forEach(function (d) { parsed(d.id).querySelectorAll('.pa').forEach(function (sec, i) {
      var ar = sec.querySelector('.ar,.q'), f = sec.querySelector('.fa');
      var a = ar ? plain(ar.innerHTML) : '', p = f ? plain(f.innerHTML) : '';
      IDX.push({ id: d.id, i: i, ar: a, fa: p, n: normAr(a + ' ' + p) });
    }); });
  }
  function search() {
    if (!IDX) buildIdx();
    var h = '<div class="wrap"><h1 class="page-h">جستجو</h1><input class="sbox" id="sq" type="search" placeholder="یک کلمه به فارسی یا عربی… مثلاً عافیت، رزق، حسد" value="' + esc(sq) + '" autocomplete="off"><div id="sres"></div></div>';
    app.innerHTML = h;
    var inp = document.getElementById('sq'), out = document.getElementById('sres');
    var run = function () {
      sq = inp.value.trim(); var q = normAr(sq);
      if (q.length < 2) { out.innerHTML = '<p class="hint">دست‌کم دو حرف بنویسید. اعراب لازم نیست.</p>'; return; }
      var res = IDX.filter(function (x) { return x.n.indexOf(q) >= 0; }).slice(0, 80);
      out.innerHTML = '<p class="hint">' + fa(res.length) + (res.length === 80 ? '+' : '') + ' نتیجه</p>' + res.map(function (x) {
        var d = BY[x.id], txt = normAr(x.fa).indexOf(q) >= 0 ? x.fa : x.ar, cls = txt === x.ar ? 'ar-s' : '';
        if (txt.length > 220) { var k = Math.max(0, normAr(txt).indexOf(q) - 80); txt = (k ? '… ' : '') + txt.slice(k, k + 200) + ' …'; }
        return '<a class="sr c-' + d.color + '" href="#/d/' + x.id + '" data-i="' + x.i + '"><b>' + d.title + ' · بند ' + fa(x.i + 1) + '</b><span class="' + cls + '">' + esc(txt) + '</span></a>';
      }).join('');
    };
    inp.addEventListener('input', run); run();
    out.addEventListener('click', function (e) { var a = e.target.closest('.sr'); if (a) jumpTo = +a.dataset.i; });
    if (!sq) setTimeout(function () { inp.focus(); }, 50);
  }
  function favIdx(id, i) { for (var k = 0; k < st.fav.length; k++) if (st.fav[k].id === id && st.fav[k].i === i) return k; return -1; }
  function parsed(id) { if (!parsed.c[id]) { var t = document.createElement('div'); t.innerHTML = BY[id].body; parsed.c[id] = t; } return parsed.c[id]; }
  parsed.c = {};
  var seg = G, segTimer = null, queue = null, jumpTo = null;
  function stopSeg() { gStop(); }
  function playSeg(f, after) {
    clearInterval(segTimer);
    var src = audioOf(f.id); if (!src || f.t1 == null) { if (after) after(); return; }
    gPlay(src, { id: f.id, fav: true, title: 'منتخب‌ها', label: BY[f.id].title.replace(/<[^>]+>/g, '') + ' · بند ' + fa(f.i + 1) }, f.t0 || 0);
    document.querySelectorAll('.fv.playing').forEach(function (x) { x.classList.remove('playing'); });
    var el = document.querySelector('.fv[data-k="' + f.id + ':' + f.i + '"]'); if (el) el.classList.add('playing');
    segTimer = setInterval(function () { if (seg.currentTime >= f.t1) { clearInterval(segTimer); seg.pause(); if (el) el.classList.remove('playing'); if (after) after(); } }, 120);
  }
  function playAll() {
    var list = st.fav.filter(function (f) { return f.t1 != null && audioOf(f.id); });
    if (!list.length) { toast('اول برای منتخب‌ها بخش صوت تعیین کنید'); return; }
    var k = 0; queue = true;
    var next = function () { if (!queue) return; if (k >= list.length) { if (st.favLoop) k = 0; else { stopSeg(); return; } } playSeg(list[k++], function () { setTimeout(next, 600); }); };
    next();
  }
  function audioOf(id) { var a = parsed(id).querySelector('audio'); return a ? a.getAttribute('src') : null; }
  function favs() {
    var h = '<div class="wrap"><h1 class="page-h">منتخب‌ها</h1>';
    if (!st.fav.length) {
      h += '<div class="box"><h2>هنوز بندی انتخاب نکرده‌اید</h2><p class="note2">در هر دعا، کنار هر بند یک ستاره ☆ هست. روی آن بزنید تا آن بند اینجا بیاید. بعد می‌توانید فقط صوت همان بند را گوش دهید.</p><a class="btn" href="#/">رفتن به فهرست دعاها</a></div></div>';
      app.innerHTML = h; return;
    }
    h += '<div class="favbar"><button class="btn" id="pall">▶ پخش همه پشت سر هم</button><button class="btn ghost" id="pstop">■ توقف</button>' +
      '<span class="lp">تکرار <button class="sw" id="ploop" role="switch" aria-checked="' + st.favLoop + '" aria-label="تکرار"></button></span></div>';
    st.fav.forEach(function (f, k) {
      var d = BY[f.id]; if (!d) return; var sec = parsed(f.id).querySelectorAll('.pa')[f.i]; if (!sec) return;
      var c = sec.cloneNode(true); c.querySelectorAll('.star').forEach(function (x) { x.remove(); });
      var hasA = !!audioOf(f.id), segTxt = f.t1 != null ? mmss(f.t0) + ' تا ' + mmss(f.t1) : '';
      h += '<div class="fv c-' + d.color + '" data-k="' + f.id + ':' + f.i + '"><div class="fv-h"><a href="#/d/' + f.id + '">' + d.title + '</a><button class="ib fx" data-k="' + k + '" aria-label="حذف از منتخب‌ها">✕</button></div>' + c.outerHTML +
        (hasA ? '<div class="fv-a">' + (f.t1 != null ? '<button class="btn fp" data-k="' + k + '">▶ پخش این بند <small>(' + segTxt + ')</small></button>' : '') +
        '<button class="btn ghost fe" data-k="' + k + '">' + (f.t1 != null ? 'ویرایش بخش صوت' : '⏱ تعیین بخش صوت') + '</button></div><div class="seged" id="se' + k + '" hidden></div>' : '<p class="hint">این دعا صوت ندارد.</p>') + '</div>';
    });
    h += '<p class="hint">ترتیب پخش همان ترتیب این فهرست است. برای حذف، ✕ را بزنید.</p></div>';
    app.innerHTML = h;
    document.getElementById('pall').onclick = playAll;
    document.getElementById('pstop').onclick = stopSeg;
    document.getElementById('ploop').onclick = function () { st.favLoop = !st.favLoop; save(); this.setAttribute('aria-checked', String(st.favLoop)); };
    app.querySelectorAll('.fx').forEach(function (b) { b.onclick = function () { st.fav.splice(+b.dataset.k, 1); save(); favs(); }; });
    app.querySelectorAll('.fp').forEach(function (b) { b.onclick = function () { queue = null; playSeg(st.fav[+b.dataset.k]); }; });
    app.querySelectorAll('.fe').forEach(function (b) { b.onclick = function () { editSeg(+b.dataset.k); }; });
  }
  function editSeg(k) {
    stopSeg();
    var f = st.fav[k], box = document.getElementById('se' + k), t0 = f.t0 != null ? f.t0 : null, t1 = f.t1 != null ? f.t1 : null;
    app.querySelectorAll('.seged').forEach(function (x) { if (x !== box) { x.hidden = true; x.innerHTML = ''; } });
    box.hidden = false;
    box.innerHTML = '<p class="hint">صوت را پخش کنید. وقتی این بند شروع شد «شروع» و وقتی تمام شد «پایان» را بزنید.</p>' +
      '<audio controls preload="metadata" src="' + audioOf(f.id) + '"></audio>' +
      '<div class="segbtns"><button class="btn ghost" data-a="s">⏱ شروع از اینجا</button><button class="btn ghost" data-a="e">⏱ پایان اینجا</button></div>' +
      '<div class="segbtns"><span>شروع: <b class="v0">—</b></span><button class="chipbtn" data-a="s-">−۱ث</button><button class="chipbtn" data-a="s+">+۱ث</button>' +
      '<span>پایان: <b class="v1">—</b></span><button class="chipbtn" data-a="e-">−۱ث</button><button class="chipbtn" data-a="e+">+۱ث</button></div>' +
      '<div class="segbtns"><button class="btn ghost" data-a="t">▶ امتحان</button><button class="btn" data-a="ok">ذخیره</button><button class="chipbtn" data-a="x">انصراف</button></div>';
    var au = box.querySelector('audio');
    if (t0 != null) au.addEventListener('loadedmetadata', function () { au.currentTime = t0; }, { once: true });
    var show = function () { box.querySelector('.v0').textContent = t0 != null ? mmss(t0) : '—'; box.querySelector('.v1').textContent = t1 != null ? mmss(t1) : '—'; };
    show();
    var tt = null;
    box.onclick = function (e) {
      var b = e.target.closest('button'); if (!b || !b.dataset.a) return; var a = b.dataset.a;
      if (a === 's') t0 = au.currentTime; else if (a === 'e') { t1 = au.currentTime; au.pause(); }
      else if (a === 's-') t0 = Math.max(0, (t0 || 0) - 1); else if (a === 's+') t0 = (t0 || 0) + 1;
      else if (a === 'e-') t1 = Math.max(0, (t1 || 0) - 1); else if (a === 'e+') t1 = (t1 || 0) + 1;
      else if (a === 't') { if (t0 == null || t1 == null || t1 <= t0) { toast('اول شروع و پایان را تعیین کنید'); return; } clearInterval(tt); au.currentTime = t0; au.play(); tt = setInterval(function () { if (au.currentTime >= t1) { au.pause(); clearInterval(tt); } }, 120); }
      else if (a === 'ok') { if (t0 == null || t1 == null || t1 <= t0) { toast('پایان باید بعد از شروع باشد'); return; } f.t0 = Math.round(t0 * 10) / 10; f.t1 = Math.round(t1 * 10) / 10; save(); toast('بخش صوت ذخیره شد'); favs(); return; }
      else if (a === 'x') { au.pause(); favs(); return; }
      show();
    };
  }
  var ZIKR = [
    ['أَسْتَغْفِرُ اللّٰهَ رَبِّي وَأَتُوبُ إِلَيْهِ', 'استغفار'],
    ['سُبْحَانَ اللّٰهِ', 'تسبیح'], ['الْحَمْدُ لِلّٰهِ', 'تحمید'], ['اللّٰهُ أَكْبَرُ', 'تکبیر'],
    ['لَا إِلٰهَ إِلَّا اللّٰهُ', 'تهلیل'], ['اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ', 'صلوات'],
    ['لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ', 'حوقله'], ['حَسْبِيَ اللّٰهُ وَنِعْمَ الْوَكِيلُ', 'توکل']
  ];
  function tasbih() {
    var t = st.tas;
    app.innerHTML = '<div class="wrap"><h1 class="page-h">تسبیح</h1><div class="tas">' +
      '<select id="zk" aria-label="ذکر">' + ZIKR.map(function (z, i) { return '<option value="' + i + '"' + (i === t.i ? ' selected' : '') + '>' + z[1] + '</option>'; }).join('') + '</select>' +
      '<div class="zikr">' + ZIKR[t.i][0] + '</div>' +
      '<button class="bead" id="bead"><span><span id="cnt">' + fa(t.n) + '</span><small id="gl">از ' + fa(t.goal) + '</small></span></button>' +
      '<div class="row2"><div class="seg" id="goal">' + [33, 70, 100, 1000].map(function (g) { return '<button data-g="' + g + '" aria-pressed="' + (g === t.goal) + '">' + fa(g) + '</button>'; }).join('') + '</div>' +
      '<button class="chipbtn" id="rs">صفر کردن</button></div><p class="hint">با رسیدن به عدد هدف، گوشی می‌لرزد.</p></div></div>';
    document.getElementById('zk').onchange = function (e) { t.i = +e.target.value; t.n = 0; save(); tasbih(); };
    document.getElementById('bead').onclick = function () {
      t.n++; save(); document.getElementById('cnt').textContent = fa(t.n);
      if (navigator.vibrate) navigator.vibrate(t.n % t.goal === 0 ? [80, 60, 80] : 12);
      if (t.n % t.goal === 0) toast(fa(t.n) + ' بار؛ قبول باشد');
    };
    document.getElementById('rs').onclick = function () { t.n = 0; save(); tasbih(); };
    document.getElementById('goal').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; t.goal = +b.dataset.g; save(); tasbih(); };
  }

  function history() {
    var days = [], d = new Date(); d.setDate(d.getDate() - 34);
    var total = planIds().length, full = 0, any = 0;
    for (var i = 0; i < 35; i++) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
    Object.keys(st.log).forEach(function (k) { var c = Object.keys(st.log[k]).length; if (c) any++; if (countFull(k)) full++; });
    var best = 0, run = 0, keys = Object.keys(st.log).sort();
    if (keys.length) { var x = new Date(keys[0] + 'T12:00'), end = new Date(); while (x <= end) { if (countFull(dkey(x))) { run++; best = Math.max(best, run); } else run = 0; x.setDate(x.getDate() + 1); } }
    var h = '<div class="wrap"><h1 class="page-h">سابقهٔ خواندن</h1><div class="stats">' +
      '<div class="stat"><b>' + fa(streak()) + '</b><span>روز پیاپی</span></div><div class="stat"><b>' + fa(best) + '</b><span>بهترین رکورد</span></div><div class="stat"><b>' + fa(full) + '</b><span>روز کامل</span></div></div>' +
      '<div class="box"><h2>۳۵ روز اخیر</h2><div class="cal">';
    days.forEach(function (x) {
      var k = dkey(x), m = st.log[k] || {}, c = planIds().filter(function (id) { return m[id]; }).length, p = total ? c / total : 0;
      var l = p >= 1 ? 'l3' : p >= .5 ? 'l2' : p > 0 ? 'l1' : '';
      var lab = ''; try { lab = x.toLocaleDateString('fa-IR-u-ca-persian', { day: 'numeric' }); } catch (e) { lab = fa(x.getDate()); }
      h += '<div class="' + l + (k === today() ? ' today' : '') + '" title="' + fa(c) + ' از ' + fa(total) + '">' + lab + '</div>';
    });
    h += '</div><p class="hint">سبز پررنگ: همهٔ برنامه خوانده شد · سبز کم‌رنگ: بخشی از برنامه</p></div>';
    h += '<div class="box"><h2>امروز</h2>' + planIds().map(function (id) { return '<div class="row"><span>' + BY[id].title + '</span><span>' + (isDone(id) ? '✓ ' + new Date(doneMap()[id]).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '—') + '</span></div>'; }).join('') + '</div></div>';
    app.innerHTML = h;
  }

  var deferredInstall = null;
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; if (cur === 'settings') settings(); });
  function perm() { if (LN) return nativePerm === 'granted' ? 'granted' : nativePerm === 'denied' ? 'denied' : 'default'; return 'Notification' in window ? Notification.permission : 'unsupported'; }
  function settings() {
    var p = perm();
    var h = '<div class="wrap"><h1 class="page-h">تنظیمات</h1>';
    h += '<div class="box"><h2>یادآور روزانه</h2>' + st.rem.map(function (r, i) {
      return '<div class="row"><input type="time" value="' + r.t + '" data-i="' + i + '" class="rt" aria-label="ساعت یادآور"><span style="flex:1"></span>' +
        '<button class="sw rs" data-i="' + i + '" role="switch" aria-checked="' + r.on + '" aria-label="روشن/خاموش"></button><button class="ib rd" data-i="' + i + '" aria-label="حذف">✕</button></div>';
    }).join('') +
      '<button class="btn ghost" id="radd">+ افزودن ساعت</button> ' +
      (p === 'granted' ? '<button class="btn ghost" id="rtest">آزمایش اعلان</button>' : p === 'unsupported' ? '' : '<button class="btn" id="rperm">اجازهٔ اعلان</button>') +
      (LN ? '<p class="note2"><b>آلارم:</b> در این ساعت‌ها، حتی وقتی اپ بسته است، پیام می‌آید. اگر برنامهٔ امروز کامل شده باشد، پیام امروز نمی‌آید.</p></div>' :
      '<p class="note2"><b>اعلان:</b> اگر برنامهٔ روز کامل نشده باشد، در این ساعت‌ها پیام می‌آید. در نسخهٔ نصبی وب، اندروید ممکن است اعلانِ برنامهٔ بسته را دیر بدهد یا ندهد؛ برای همین:</p>' +
      '<button class="btn wide" id="ics">⏰ افزودن آلارم مطمئن به تقویم گوشی</button>' +
      '<p class="note2">این دکمه یک رویداد تکرارشونده با هشدار، در همان ساعت‌ها، به تقویم گوشی می‌دهد. تقویم حتماً هر روز یادآوری می‌کند. نسخهٔ APK آلارم واقعی دارد.</p></div>');
    h += '<div class="box"><h2>رنگ اپ</h2><div class="swatches" id="acc">' + Object.keys(ACCENTS).map(function (k) { var A = ACCENTS[k];
      return '<button data-acc="' + k + '" aria-pressed="' + (st.accent === k) + '" style="--sw1:' + A[2] + ';--sw2:' + A[3] + '"><i></i><span>' + A[0] + '</span></button>'; }).join('') + '</div>' +
      '<div class="row" style="margin-top:.6rem"><span>پوسته</span><div class="seg" id="th2">' + [['auto', 'خودکار'], ['light', 'روشن'], ['dark', 'شب'], ['sepia', 'کاغذی']].map(function (t) { return '<button data-v="' + t[0] + '" aria-pressed="' + (st.theme === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div></div></div>';
    h += '<div class="box"><h2>خواندن</h2><button class="btn ghost wide" id="look">اندازهٔ متن و خط</button></div>';
    if (!LN) h += '<div class="box"><h2>نصب</h2>' + (deferredInstall ? '<button class="btn wide" id="inst">نصب روی گوشی</button>' : '') +
      '<p class="note2">در کروم اندروید: منوی ⋮ ← «افزودن به صفحهٔ اصلی» یا «نصب برنامه». پس از نصب، بدون اینترنت هم کار می‌کند. صوت‌ها بعد از یک بار پخش، ذخیره می‌شوند.</p></div>';
    h += '<div class="box"><h2>داده‌ها</h2><button class="btn ghost" id="reord">بازگرداندن ترتیب اولیه</button> <button class="btn ghost" id="wipe">پاک کردن سابقه</button>' +
      '<p class="note2">همهٔ تیک‌ها و تنظیمات فقط روی همین دستگاه ذخیره می‌شوند.</p>' +
      '<h2 style="margin-top:1rem">پشتیبان</h2><p class="note2">برای انتقال به گوشی یا کامپیوتر دیگر: «کپی پشتیبان» را بزنید و متن را جایی نگه دارید (مثلاً برای خودتان بفرستید). در دستگاه دیگر آن را در کادر زیر بچسبانید و «بازیابی» را بزنید.</p>' +
      '<button class="btn ghost" id="bk">کپی پشتیبان</button><textarea id="rs-t" class="bk-t" placeholder="متن پشتیبان را اینجا بچسبانید"></textarea><button class="btn ghost" id="rs-b">بازیابی</button></div></div>';
    app.innerHTML = h;
    app.querySelectorAll('.rt').forEach(function (inp) { inp.onchange = function () { st.rem[+inp.dataset.i].t = inp.value; resetNotified(); save(); schedule(); toast('ذخیره شد'); }; });
    app.querySelectorAll('.rs').forEach(function (b) { b.onclick = function () { var r = st.rem[+b.dataset.i]; r.on = !r.on; save(); schedule(); settings(); }; });
    app.querySelectorAll('.rd').forEach(function (b) { b.onclick = function () { st.rem.splice(+b.dataset.i, 1); save(); schedule(); settings(); }; });
    document.getElementById('radd').onclick = function () { st.rem.push({ t: '12:00', on: true }); save(); schedule(); settings(); };
    var rp = document.getElementById('rperm'); if (rp) rp.onclick = function () { if (LN) { LN.requestPermissions().then(function (r) { nativePerm = r.display; nativeSchedule(); settings(); }); return; } Notification.requestPermission().then(function () { registerPeriodic(); schedule(); settings(); }); };
    var rt = document.getElementById('rtest'); if (rt) rt.onclick = function () { notify('آزمایش یادآور', 'اعلان‌ها درست کار می‌کنند 🌿'); };
    var ib = document.getElementById('ics'); if (ib) ib.onclick = ics;
    document.getElementById('look').onclick = function () { sheet(true); };
    document.getElementById('acc').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; st.accent = b.dataset.acc; save(); applyLook(); settings(); };
    document.getElementById('th2').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; st.theme = b.dataset.v; save(); applyLook(); settings(); };
    var ins = document.getElementById('inst'); if (ins) ins.onclick = function () { deferredInstall.prompt(); deferredInstall = null; };
    document.getElementById('bk').onclick = function () { copyText('DOA1:' + btoa(unescape(encodeURIComponent(JSON.stringify(st)))), 'پشتیبان کپی شد'); };
    document.getElementById('rs-b').onclick = function () {
      var v = document.getElementById('rs-t').value.trim().replace(/^DOA1:/, '');
      try { var o = JSON.parse(decodeURIComponent(escape(atob(v)))); if (!o || !o.order) throw 0; st = o; save(); applyLook(); toast('بازیابی شد'); settings(); } catch (e) { toast('متن پشتیبان درست نیست'); }
    };
    document.getElementById('reord').onclick = function () { st.order = DEFAULT_ORDER.slice(); save(); toast('ترتیب اولیه برگشت'); };
    document.getElementById('wipe').onclick = function () { if (confirm('همهٔ سابقهٔ خواندن پاک شود؟')) { st.log = {}; save(); toast('پاک شد'); } };
  }

  // ---------- reminders ----------
  var NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  var LN = NATIVE && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
  var nativePerm = 'prompt';
  if (LN) LN.checkPermissions().then(function (r) { nativePerm = r.display; if (cur === 'settings') settings(); nativeSchedule(); }).catch(function () {});
  // APK: real alarms for the next 30 days; today's are skipped once the plan is complete
  function nativeSchedule() {
    if (!LN || nativePerm !== 'granted') return;
    LN.getPending().then(function (r) {
      var old = (r.notifications || []).map(function (n) { return { id: n.id }; });
      return old.length ? LN.cancel({ notifications: old }) : null;
    }).then(function () {
      var now = Date.now(), list = [], doneToday = countDone() >= planIds().length;
      for (var d = 0; d < 30; d++) remTimes().forEach(function (t, i) {
        var p = t.split(':'), x = new Date(); x.setDate(x.getDate() + d); x.setHours(+p[0], +p[1], 0, 0);
        if (x.getTime() <= now || (d === 0 && doneToday)) return;
        list.push({ id: 1000 + d * 10 + i, title: 'وقت دعای روزانه', body: d === 0 ? remindBody() : 'برنامهٔ دعای امروز را باز کنید',
          schedule: { at: x, allowWhileIdle: true }, smallIcon: 'ic_stat_doa', iconColor: '#B48A2C' });
      });
      if (list.length) return LN.schedule({ notifications: list });
    }).catch(function () {});
  }
  function remTimes() { return st.rem.filter(function (r) { return r.on && /^\d\d:\d\d$/.test(r.t); }).map(function (r) { return r.t; }); }
  function resetNotified() { delete st.notified[today()]; }
  function missedNow() {
    var now = new Date(), hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    if (countDone() >= planIds().length) return null;
    var past = remTimes().filter(function (t) { return t <= hm; }).sort();
    return past.length ? past[past.length - 1] : null;
  }
  function notify(title, body) {
    if (perm() !== 'granted') return;
    if (LN) { LN.schedule({ notifications: [{ id: 999, title: title, body: body, smallIcon: 'ic_stat_doa' }] }).catch(function () {}); return; }
    var opt = { body: body, icon: 'icons/icon-192.png', badge: 'icons/badge.png', tag: 'doa-daily', renotify: true, dir: 'rtl', lang: 'fa', vibrate: [200, 100, 200], data: { url: './#/' } };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { r.showNotification(title, opt); }).catch(function () { try { new Notification(title, opt); } catch (e) {} });
    else try { new Notification(title, opt); } catch (e) {}
  }
  function remindBody() {
    var left = planIds().filter(function (id) { return !isDone(id); }).map(function (id) { return BY[id].title.replace(/<[^>]+>/g, ''); });
    return fa(left.length) + ' دعا مانده: ' + left.slice(0, 3).join('، ') + (left.length > 3 ? ' و …' : '');
  }
  function checkMissed() {
    var m = missedNow(), k = today(); if (!m) return;
    var sent = st.notified[k] || []; if (sent.indexOf(m) >= 0) return;
    sent.push(m); st.notified[k] = sent; save();
    if (document.visibilityState !== 'visible') notify('وقت دعای روزانه', remindBody());
  }
  var timer = null;
  function schedule() {
    clearTimeout(timer);
    var now = new Date(), best = null;
    remTimes().forEach(function (t) {
      var p = t.split(':'), x = new Date(now); x.setHours(+p[0], +p[1], 0, 0); if (x <= now) x.setDate(x.getDate() + 1);
      if (!best || x < best) best = x;
    });
    if (best) timer = setTimeout(function () { checkMissed(); schedule(); if (cur === 'home') render(); }, Math.min(best - now + 500, 2147483000));
    triggerSchedule();
  }
  // Chrome's Notification Triggers (only where supported): pre-schedule the next 7 days
  function triggerSchedule() {
    if (perm() !== 'granted' || !('showTrigger' in Notification.prototype) || !window.TimestampTrigger || !navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then(function (reg) {
      reg.getNotifications({ includeTriggered: true }).then(function (ns) { ns.forEach(function (n) { if (n.tag && n.tag.indexOf('doa-t-') === 0) n.close(); }); });
      var now = Date.now();
      for (var d = 0; d < 7; d++) remTimes().forEach(function (t) {
        var p = t.split(':'), x = new Date(); x.setDate(x.getDate() + d); x.setHours(+p[0], +p[1], 0, 0);
        if (x.getTime() > now && !(d === 0 && countDone() >= planIds().length))
          reg.showNotification('وقت دعای روزانه', { body: 'برنامهٔ دعای امروز را باز کنید', tag: 'doa-t-' + dkey(x) + t, icon: 'icons/icon-192.png', showTrigger: new TimestampTrigger(x.getTime()), data: { url: './#/' } });
      });
    }).catch(function () {});
  }
  function registerPeriodic() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (reg.periodicSync) reg.periodicSync.register('doa-daily', { minInterval: 60 * 60 * 1000 }).catch(function () {});
    });
  }
  // the service worker can't read localStorage: give it a copy of what it needs
  function mirrorToSW() {
    if (!('caches' in window) || location.protocol === 'file:') return;
    var m = { times: remTimes(), day: today(), left: planIds().length - countDone(), notified: st.notified[today()] || [], body: remindBody() };
    caches.open('doa-state').then(function (c) { c.put('state.json', new Response(JSON.stringify(m), { headers: { 'content-type': 'application/json' } })); }).catch(function () {});
  }
  function ics() {
    var times = remTimes(); if (!times.length) { toast('اول یک ساعت یادآور روشن کنید'); return; }
    var d = new Date(), ds = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ketab-doa//fa', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    times.forEach(function (t, i) {
      var hm = t.replace(':', '') + '00';
      L.push('BEGIN:VEVENT', 'UID:doa-' + i + '-' + hm + '@ketab-doa', 'DTSTAMP:' + stamp, 'DTSTART:' + ds + 'T' + hm, 'DURATION:PT15M', 'RRULE:FREQ=DAILY',
        'SUMMARY:وقت دعای روزانه', 'DESCRIPTION:کتاب دعای روزانه را باز کنید و برنامهٔ امروز را بخوانید.',
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:وقت دعای روزانه', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    var blob = new Blob([L.join('\r\n')], { type: 'text/calendar;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'doa-yadavar.ics'; document.body.appendChild(a); a.click(); a.remove();
    toast('فایل تقویم دانلود شد؛ آن را باز کنید و «ذخیره» بزنید');
  }

  // ---------- router ----------
  function render() {
    var hsh = location.hash || '#/', m;
    sheet(false);
    var reading = !!(m = hsh.match(/^#\/d\/(\w+)/));
    document.body.classList.toggle('reading', reading);
    if (!reading) readId = null;
    if (reading) { cur = 'read'; reader(m[1]); }
    else if (hsh === '#/tasbih') { cur = 'tasbih'; tasbih(); }
    else if (hsh === '#/fav') { cur = 'fav'; favs(); }
    else if (hsh === '#/search') { cur = 'search'; search(); }
    else if (hsh === '#/history') { cur = 'history'; history(); }
    else if (hsh === '#/settings') { cur = 'settings'; settings(); }
    else { cur = 'home'; home(); }
    document.querySelectorAll('#tabs a').forEach(function (a) { a.classList.toggle('on', a.dataset.t === cur); });
    wake();
  }
  var lastHash = location.hash;
  addEventListener('hashchange', function () {
    var wasRead = /^#\/d\//.test(lastHash); lastHash = location.hash;
    render(); if (!/^#\/d\//.test(location.hash)) window.scrollTo(0, wasRead ? (render._homeY || 0) : 0);
  });
  addEventListener('click', function (e) { var a = e.target.closest('a[href^="#/d/"]'); if (a && cur === 'home') render._homeY = scrollY; });

  applyLook();
  render();
  // daily rollover while the app stays open
  var lastDay = today();
  setInterval(function () { if (today() !== lastDay) { lastDay = today(); mirrorToSW(); if (cur === 'home') render(); } }, 60000);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(function () { if (perm() === 'granted') registerPeriodic(); mirrorToSW(); schedule(); }).catch(function () { schedule(); });
    navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.go) location.hash = e.data.go; });
  } else schedule();
  checkMissed();
})();
