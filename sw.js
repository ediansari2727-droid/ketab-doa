// Offline cache + daily reminder for کتاب دعای روزانه
var V = 'doa-v14';
var CORE = ['./', 'index.html', 'app.css', 'app.js', 'content.js', 'times.js', 'oghat.js', 'sortable.min.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/badge.png',
  'fonts/amiri-arabic-400-normal.woff2', 'fonts/amiri-arabic-700-normal.woff2', 'fonts/vazirmatn-arabic-400-normal.woff2',
  'fonts/vazirmatn-arabic-700-normal.woff2', 'fonts/scheherazade-new-arabic-400-normal.woff2', 'fonts/scheherazade-new-arabic-700-normal.woff2',
  'fonts/noto-naskh-arabic-arabic-400-normal.woff2', 'fonts/noto-naskh-arabic-arabic-700-normal.woff2', 'fonts/hafs.ttf'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V && k !== 'doa-state' && k !== 'doa-audio'; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin) return;
  if (/\.mp3$/.test(u.pathname)) {
    // audio: serve from cache when saved; otherwise stream from network and save a full copy in the background
    e.respondWith(caches.open('doa-audio').then(function (c) {
      return c.match(u.pathname).then(function (hit) {
        if (hit) return rangeOf(hit, r);
        e.waitUntil(fetch(u.pathname).then(function (full) { if (full.ok && full.status === 200) return c.put(u.pathname, full); }).catch(function () {}));
        return fetch(r);
      });
    }));
    return;
  }
  // app files: network first (so updates arrive), cache as fallback
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); }); }));
});
function rangeOf(res, req) {
  var range = req.headers.get('range'); if (!range) return res;
  return res.arrayBuffer().then(function (buf) {
    var m = /bytes=(\d*)-(\d*)/.exec(range), size = buf.byteLength;
    var s = m && m[1] ? +m[1] : 0, en = m && m[2] ? +m[2] : size - 1;
    return new Response(buf.slice(s, en + 1), { status: 206, headers: { 'Content-Type': 'audio/mpeg', 'Content-Range': 'bytes ' + s + '-' + en + '/' + size, 'Content-Length': String(en - s + 1), 'Accept-Ranges': 'bytes' } });
  });
}
// periodic background check (Chrome, installed app only; timing decided by the browser)
self.addEventListener('periodicsync', function (e) { if (e.tag === 'doa-daily') e.waitUntil(check()); });
function hm(d) { return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function dk(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function check() {
  return caches.open('doa-state').then(function (c) { return c.match('state.json').then(function (r) { return r ? r.json() : null; }).then(function (s) {
    if (!s) return;
    var now = new Date(), today = dk(now);
    if (s.day !== today) { s.day = today; s.notified = []; s.left = -1; }
    // prayer reminders that came due while the app was closed (only if the browser woke us within 20 minutes)
    var due = (s.pr || []).filter(function (p) { return p.at <= now.getTime() && p.at > now.getTime() - 20 * 6e4 && !p.sent; });
    due.forEach(function (p) { p.sent = 1; });
    var shown = Promise.all(due.map(function (p) { return self.registration.showNotification(p.title, { body: p.body, icon: 'icons/icon-192.png', badge: 'icons/badge.png', tag: 'doa-pr-' + p.at, dir: 'rtl', lang: 'fa', data: { url: './#/oghat' } }); }));
    if (due.length) return shown.then(function () { return c.put('state.json', new Response(JSON.stringify(s))); });
    if (s.left === 0) return;
    var past = s.times.filter(function (t) { return t <= hm(now); }).sort(), t = past[past.length - 1];
    if (!t || s.notified.indexOf(t) >= 0) return;
    s.notified.push(t);
    return c.put('state.json', new Response(JSON.stringify(s))).then(function () {
      return self.registration.showNotification('وقت دعای روزانه', { body: s.left > 0 ? s.body : 'برنامهٔ دعای امروز را باز کنید', icon: 'icons/icon-192.png', badge: 'icons/badge.png', tag: 'doa-daily', dir: 'rtl', lang: 'fa', data: { url: './#/' } });
    });
  }); });
}
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    var url = (e.notification.data && e.notification.data.url) || './#/', go = url.replace(/^\.\//, '');
    for (var i = 0; i < cs.length; i++) { cs[i].postMessage({ go: go }); return cs[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
