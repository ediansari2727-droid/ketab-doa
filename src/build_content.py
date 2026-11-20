import os
import json, re, sys, html
sys.path.insert(0, '/mnt/project-files/doa/app-src')
from sahifa_a import D as A; from sahifa_b import D as B; from sahifa_c import D as C; from sahifa_d import D as Dd; from sahifa_e import D as E; from sahifa_f import D as F
S = {**A, **B, **C, **Dd, **E, **F}
FA = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
fn = lambda n: str(n).translate(FA)
base = json.load(open('/mnt/project-files/doa/app-src/base_content.json'))
out = [d for d in base if d['id'] != 'sources']
src = [d for d in base if d['id'] == 'sources'][0]
for n in sorted(S):
    d = S[n]
    body = '<p class="intro-ar">%s</p><p class="intro-fa">%s</p>' % (d['intro_ar'], d['intro_fa'])
    if os.path.exists('/mnt/project-files/doa/app/audio/dua%d.mp3' % n): body += '<div class="player"><span>🔊 قرائت دعای %s (عربی)</span><audio controls preload="none" src="audio/dua%d.mp3"></audio></div>' % (fn(n), n)
    for i, (ar, fa) in enumerate(d['p'], 1):
        body += '<section class="pa"><span class="n">%s</span><p class="ar">%s</p><p class="fa">%s</p></section>' % (fn(i), ar, fa)
    out.append(dict(id='s%d' % n, color='lapis', eyebrow='صحیفهٔ سجادیه · دعای %s' % fn(n), title=d['title'], sub=d['sub'], body=body))
note = ('<li><b>یازده دعای دیگر صحیفه (۶، ۷، ۸، ۱۷، ۲۰، ۲۱، ۲۳، ۲۹، ۳۰، ۴۹، ۵۴):</b> متنِ بی‌اعراب از پیکرهٔ علمی OpenITI '
        '(الصحیفة السجادیة، نسخهٔ Shia001112) گرفته شد. اعراب را Claude گذاشته و متن اعراب‌دار را حرف‌به‌حرف با OpenITI مقابله کرده است؛ '
        'جز تفاوت‌های املایی (مانند «أسئلک/أسألک») و چند خطای آشکار تایپی در OpenITI، اختلافی نماند. چون اعراب از نسخهٔ چاپی کپی نشده، '
        'برای قرائت دقیق، متن را با صوت همان دعا هم بشنوید. ترجمه‌ها تازه و جمله‌به‌جمله است.</li>'
        '<li><b>دعاهای استغفار صحیفه (۱۲، ۱۶، ۳۱، ۳۸):</b> به همان روش بالا؛ متن OpenITI، اعراب و ترجمهٔ تازهٔ جمله‌به‌جمله، و مقابلهٔ کلمه‌به‌کلمه با OpenITI.</li>'
        '<li><b>صوت دعاها:</b> فایل‌هایی که خودتان از duas.org فرستادید.</li>')
src = dict(src); src['body'] = src['body'].replace('</ul>', note + '</ul>', 1)
out.append(src)
# passages the duas.org reciter skips (checked by speech recognition + listening, 2026-11-20)
MISS = {
  'arsh': {6: 'قاری «فَلَا يَرُومُونَ النَّظَرَ إِلَيْكَ» را نخوانده است.',
           9: 'قاری «وَمُنْكَرٍ وَنَكِيرٍ، وَرُومَانَ فَتَّانِ الْقُبُورِ» را نخوانده است (حدود دقیقهٔ ۴:۵۸).'},
  's7':  {5: 'قاری «وَبِقُدْرَتِكَ أَوْرَدْتَهُ عَلَيَّ، وَبِسُلْطَانِكَ وَجَّهْتَهُ إِلَيَّ» را نخوانده است.',
          6: 'قاری این بند را نخوانده است.',
          11: 'این بند در صوت نیست؛ قاری دعا را با «یا ذا العرش العظیم» تمام می‌کند.'},
  's20': {4: 'قاری از «وَعَبِّدْنِي لَكَ» تا «وَلَا تَمْحَقْهُ بِالْمَنِّ» را نخوانده است.',
          5: 'قاری این بند را نخوانده است.'},
}
import re as _re
for d in out:
    for k, msg in MISS.get(d['id'], {}).items():
        secs = d['body'].split('<section class="pa">')
        secs[k] = secs[k].replace('</section>', '<p class="miss">🔇 ' + msg + '</p></section>', 1)
        d['body'] = '<section class="pa">'.join(secs)
open('/mnt/project-files/doa/app/content.js', 'w').write('window.DUAS=' + json.dumps(out, ensure_ascii=False) + ';')
print(len(out), [d['id'] for d in out])
