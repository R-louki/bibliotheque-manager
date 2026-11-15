import pymupdf, numpy as np, json, re, collections, sys
from numpy.fft import rfft2, irfft2
S = 1.5
d = pymupdf.open(r"C:\Users\prolo.MYRA\Downloads\quran-qalun-mushaf.pdf")
def gray(page, clip=None):
    pm = page.get_pixmap(matrix=pymupdf.Matrix(S, S), colorspace=pymupdf.csGRAY, clip=clip)
    return np.frombuffer(pm.samples, np.uint8).reshape(pm.height, pm.width).astype(np.float64) / 255.0
# gabarit : anneau du marqueur (136) de la page 100, centre ~ (703,857)... mesuré sur le rendu
cx, cy = 703.0, 857.0
def mk_tpl(cx, cy, r=24):
    return 1.0 - gray(d[100], pymupdf.Rect(cx - r, cy - r, cx + r, cy + r))
tpl = mk_tpl(cx, cy);
# on masque le centre (chiffres) pour ne garder que l'anneau
h, w = tpl.shape; yy, xx = np.mgrid[:h, :w]; rr = np.hypot(yy - h / 2, xx - w / 2)
mask = (rr > 0.42 * h / 2 * 1.0).astype(np.float64)
t = tpl * mask; m = mask.sum(); t = (t - (t.sum() / m)) * mask; tn = np.sqrt((t ** 2).sum()); th, tw = t.shape
def ncc(img):
    inv = 1.0 - img; H, W = inv.shape
    F = rfft2(inv); T = rfft2(t, s=(H, W))
    cc = irfft2(F * np.conj(T), s=(H, W))
    ii = np.pad(inv, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    i2 = np.pad(inv ** 2, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    box = lambda a: a[th:, tw:] - a[:-th, tw:] - a[th:, :-tw] + a[:-th, :-tw]
    # énergie locale approx (fenêtre complète)
    n = th * tw; s1 = box(ii); s2 = box(i2); var = np.maximum(s2 - s1 ** 2 / n, 1e-6)
    h2, w2 = H - th + 1, W - tw + 1
    out = cc[:h2, :w2] / (tn * np.sqrt(var))
    return out
def find(page, thr):
    sc = ncc(gray(page)); work = sc.copy(); pts = []
    while True:
        i = np.unravel_index(np.argmax(work), work.shape)
        if work[i] < thr: break
        pts.append((float((i[1] + tw / 2) / S), float((i[0] + th / 2) / S), float(work[i])))
        work[max(0, i[0] - th // 2): i[0] + th // 2, max(0, i[1] - tw // 2): i[1] + tw // 2] = -1
    return pts
if __name__ == "__main__":
    Q = json.load(open(r"C:\Users\prolo.MYRA\Documents\Bibliothèque manager\build\quran\qalun.json", encoding="utf-8"))
    ends = collections.Counter()
    for s in Q["surahs"]:
        for a in s["ayat"]: ends[int(re.findall(r"\d+", a["p"])[-1])] += 1
    for p in (3, 100, 5, 50, 300):
        for thr in (0.45, 0.55):
            pts = find(d[p], thr); print(p, "seuil", thr, "détectés", len(pts), "attendus", ends[p], [round(c, 2) for _, _, c in pts][:14])
