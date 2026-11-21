// اوقات شرعی، آفلاین. روش مؤسسهٔ ژئوفیزیک دانشگاه تهران (جعفری):
// صبح: خورشید ۱۷٫۷ درجه زیر افق؛ طلوع و غروب: ۰٫۸۳۳ درجه (شکست نور + نیم‌قطر)؛
// مغرب: ۴٫۵ درجه زیر افق؛ نیمه‌شب شرعی: میانهٔ غروب تا اذان صبح فردا.
// فرمول‌های خورشید همان praytimes.org (دقت حدود یک دقیقه).
(function (g) {
  'use strict';
  var R = Math.PI / 180;
  function sin(d) { return Math.sin(d * R); } function cos(d) { return Math.cos(d * R); }
  function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }
  function sun(jd) {
    var D = jd - 2451545.0, gg = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * sin(gg) + 0.020 * sin(2 * gg), 360), e = 23.439 - 0.00000036 * D;
    var RA = fix(Math.atan2(cos(e) * sin(L), cos(L)) / R / 15, 24);
    return { decl: Math.asin(sin(e) * sin(L)) / R, eqt: q / 15 - RA };
  }
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  // ساعت محلیِ خورشیدی (به وقت جهانی + طول/۱۵) برای رسیدن خورشید به زاویهٔ «ang» زیر افق
  function day(y, m, d, lat, lng) {
    var jd = julian(y, m, d) - lng / 360;
    function noon(t) { return fix(12 - sun(jd + t / 24).eqt, 24); }
    function at(ang, t, before) {
      var s = sun(jd + t / 24), n = noon(t);
      var c = (-sin(ang) - sin(s.decl) * sin(lat)) / (cos(s.decl) * cos(lat));
      if (c > 1 || c < -1) return NaN;
      var T = Math.acos(c) / R / 15;
      return n + (before ? -T : T);
    }
    var t = { fajr: 5, sunrise: 6, dhuhr: 12, sunset: 18, maghrib: 18.3 };
    for (var i = 0; i < 3; i++) t = {
      fajr: at(17.7, t.fajr, true), sunrise: at(0.833, t.sunrise, true), dhuhr: noon(t.dhuhr),
      sunset: at(0.833, t.sunset, false), maghrib: at(4.5, t.maghrib, false)
    };
    return t; // ساعت‌ها به «وقت محلی میانگین» طول جغرافیایی؛ بعد به منطقهٔ زمانی تبدیل می‌شوند
  }
  // زمان مطلق (میلی‌ثانیه) هر وقت، برای روز y/m/d
  function times(y, m, d, lat, lng) {
    var base = Date.UTC(y, m - 1, d), off = lng / 15;
    var a = day(y, m, d, lat, lng), nx = new Date(base + 864e5);
    var b = day(nx.getUTCFullYear(), nx.getUTCMonth() + 1, nx.getUTCDate(), lat, lng);
    function abs(h, plusDay) { return isNaN(h) ? NaN : base + (plusDay ? 864e5 : 0) + (h - off) * 36e5; }
    var r = { fajr: abs(a.fajr), sunrise: abs(a.sunrise), dhuhr: abs(a.dhuhr), sunset: abs(a.sunset), maghrib: abs(a.maghrib) };
    var fajr2 = abs(b.fajr, true);
    r.midnight = r.sunset + (fajr2 - r.sunset) / 2;
    return r;
  }
  // جهت قبله (درجه از شمال جغرافیایی، ساعتگرد)
  function qibla(lat, lng) {
    var kl = 21.422487, kg = 39.826206, dl = (kg - lng) * R;
    var y = Math.sin(dl), x = Math.cos(lat * R) * Math.tan(kl * R) - Math.sin(lat * R) * Math.cos(dl);
    return fix(Math.atan2(y, x) / R, 360);
  }
  function distKm(lat, lng) {
    var kl = 21.422487 * R, kg = 39.826206 * R, a = lat * R, b = lng * R;
    return 6371 * Math.acos(Math.min(1, Math.sin(a) * Math.sin(kl) + Math.cos(a) * Math.cos(kl) * Math.cos(kg - b)));
  }
  // شهرها: نام، عرض، طول، اختلاف ساعت با گرینویچ
  var CITIES = [
    ['تهران', 35.6892, 51.3890, 3.5], ['مشهد', 36.2605, 59.6168, 3.5], ['قم', 34.6416, 50.8746, 3.5], ['اصفهان', 32.6546, 51.6680, 3.5],
    ['شیراز', 29.5918, 52.5837, 3.5], ['تبریز', 38.0800, 46.2919, 3.5], ['کرج', 35.8400, 50.9391, 3.5], ['اهواز', 31.3183, 48.6706, 3.5],
    ['کرمانشاه', 34.3142, 47.0650, 3.5], ['رشت', 37.2808, 49.5832, 3.5], ['ارومیه', 37.5527, 45.0761, 3.5], ['زاهدان', 29.4963, 60.8629, 3.5],
    ['کرمان', 30.2839, 57.0834, 3.5], ['همدان', 34.7992, 48.5146, 3.5], ['یزد', 31.8974, 54.3569, 3.5], ['اردبیل', 38.2498, 48.2933, 3.5],
    ['بندرعباس', 27.1832, 56.2666, 3.5], ['اراک', 34.0917, 49.6892, 3.5], ['زنجان', 36.6736, 48.4787, 3.5], ['سنندج', 35.3219, 46.9862, 3.5],
    ['قزوین', 36.2797, 50.0049, 3.5], ['خرم‌آباد', 33.4878, 48.3558, 3.5], ['گرگان', 36.8456, 54.4393, 3.5], ['ساری', 36.5633, 53.0601, 3.5],
    ['بجنورد', 37.4747, 57.3290, 3.5], ['بیرجند', 32.8649, 59.2262, 3.5], ['سمنان', 35.5729, 53.3971, 3.5], ['بوشهر', 28.9234, 50.8203, 3.5],
    ['ایلام', 33.6374, 46.4227, 3.5], ['یاسوج', 30.6682, 51.5880, 3.5], ['شهرکرد', 32.3256, 50.8644, 3.5], ['کاشان', 33.9850, 51.4100, 3.5],
    ['نجف', 32.0003, 44.3354, 3], ['کربلا', 32.6160, 44.0249, 3], ['کاظمین', 33.3800, 44.3400, 3], ['سامرا', 34.1983, 43.8742, 3],
    ['مکه', 21.4225, 39.8262, 3], ['مدینه', 24.4686, 39.6142, 3], ['دمشق', 33.5138, 36.2765, 3]
  ];
  g.OGHAT = { times: times, qibla: qibla, distKm: distKm, CITIES: CITIES };
  if (typeof module !== 'undefined') module.exports = g.OGHAT;
})(typeof window !== 'undefined' ? window : globalThis);
