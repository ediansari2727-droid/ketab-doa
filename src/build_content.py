import json, re, sys, html
sys.path.insert(0, '/mnt/project-files/doa/app-src')
from sahifa_a import D as A; from sahifa_b import D as B; from sahifa_c import D as C; from sahifa_d import D as Dd; from sahifa_e import D as E
S = {**A, **B, **C, **Dd, **E}
FA = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
fn = lambda n: str(n).translate(FA)
base = json.load(open('/mnt/project-files/doa/app-src/base_content.json'))
out = [d for d in base if d['id'] != 'sources']
src = [d for d in base if d['id'] == 'sources'][0]
for n in sorted(S):
    d = S[n]
    body = '<p class="intro-ar">%s</p><p class="intro-fa">%s</p>' % (d['intro_ar'], d['intro_fa'])
    body += '<div class="player"><span>🔊 قرائت دعای %s (عربی)</span><audio controls preload="none" src="audio/dua%d.mp3"></audio></div>' % (fn(n), n)
    for i, (ar, fa) in enumerate(d['p'], 1):
        body += '<section class="pa"><span class="n">%s</span><p class="ar">%s</p><p class="fa">%s</p></section>' % (fn(i), ar, fa)
    out.append(dict(id='s%d' % n, color='lapis', eyebrow='صحیفهٔ سجادیه · دعای %s' % fn(n), title=d['title'], sub=d['sub'], body=body))
note = ('<li><b>یازده دعای دیگر صحیفه (۶، ۷، ۸، ۱۷، ۲۰، ۲۱، ۲۳، ۲۹، ۳۰، ۴۹، ۵۴):</b> متنِ بی‌اعراب از پیکرهٔ علمی OpenITI '
        '(الصحیفة السجادیة، نسخهٔ Shia001112) گرفته شد. اعراب را Claude گذاشته و متن اعراب‌دار را حرف‌به‌حرف با OpenITI مقابله کرده است؛ '
        'جز تفاوت‌های املایی (مانند «أسئلک/أسألک») و چند خطای آشکار تایپی در OpenITI، اختلافی نماند. چون اعراب از نسخهٔ چاپی کپی نشده، '
        'برای قرائت دقیق، متن را با صوت همان دعا هم بشنوید. ترجمه‌ها تازه و جمله‌به‌جمله است.</li>'
        '<li><b>صوت این یازده دعا:</b> فایل‌هایی که خودتان از duas.org فرستادید.</li>')
src = dict(src); src['body'] = src['body'].replace('</ul>', note + '</ul>', 1)
out.append(src)
open('/mnt/project-files/doa/app/content.js', 'w').write('window.DUAS=' + json.dumps(out, ensure_ascii=False) + ';')
print(len(out), [d['id'] for d in out])
