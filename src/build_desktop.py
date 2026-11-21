import base64,re
A='/mnt/project-files/doa/app/'
css=open(A+'app.css').read()
def b64(m):
    f=m.group(1); mime='font/woff2' if f.endswith('woff2') else 'font/ttf'
    return 'url("data:%s;base64,%s")'%(mime,base64.b64encode(open(A+f,'rb').read()).decode())
css=re.sub(r'url\("(fonts/[^"]+)"\)',b64,css)
content=open(A+'content.js').read().replace('src="audio/','src="https://ediansari2727-droid.github.io/ketab-doa/audio/')
idx=open(A+'index.html').read()
icon='data:image/png;base64,'+base64.b64encode(open(A+'icons/icon-192.png','rb').read()).decode()
idx=idx.replace('<link rel="manifest" href="manifest.webmanifest">\n','').replace('href="icons/icon-192.png"','href="%s"'%icon)
idx=idx.replace('<link rel="stylesheet" href="app.css">','<style>%s</style>'%css)
idx=idx.replace('<script src="content.js"></script>','<script>%s</script>'%content)
idx=idx.replace('<script src="times.js"></script>','<script>%s</script>'%open(A+'times.js').read())
idx=idx.replace('<script src="sortable.min.js"></script>','<script>%s</script>'%open(A+'sortable.min.js').read())
idx=idx.replace('<script src="app.js"></script>','<script>%s</script>'%open(A+'app.js').read().replace("'icons/icon-192.png'","'%s'"%icon))
open('/mnt/project-files/doa/download/ketab-doa-computer.html','w').write(idx)
