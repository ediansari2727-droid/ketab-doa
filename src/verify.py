import re, json, sys, difflib, importlib
sys.path.insert(0, '/mnt/project-files/doa/app-src')
OI = json.load(open('/tmp/claude-0/sah/openiti11.json'))
def norm(t):
    t = re.sub(r'[ً-ٰٟـ]', '', t)
    t = re.sub(r'[أإآٱ]', 'ا', t).replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي').replace('ء', '')
    t = t.replace('حيوه', 'حياه').replace('صلوه', 'صلاه').replace('زكوه', 'زكاه')
    t = re.sub(r'[^ء-ي ]', ' ', t)
    t = re.sub(r'\bو ', 'و', t)  # OpenITI sometimes splits "و "
    return t.split()
def check(mod, nums):
    D = importlib.import_module(mod).D
    for n in nums:
        d = D[n]
        mine = norm(d['intro_ar'] + ' ' + ' '.join(a for a, f in d['p']))
        src = OI[str(n)]; src = src.split('\n', 1)[1]  # drop OpenITI header
        src = norm(src)
        sm = difflib.SequenceMatcher(None, src, mine, autojunk=False)
        print('== dua', n, 'words', len(src), len(mine), 'ratio %.3f' % sm.ratio())
        for op, a, b, c, e in sm.get_opcodes():
            if op != 'equal': print(' ', op, 'OpenITI:', ' '.join(src[a:b]), '| mine:', ' '.join(mine[c:e]))
if __name__ == '__main__':
    check(sys.argv[1], [int(x) for x in sys.argv[2:]])
