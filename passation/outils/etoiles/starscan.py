import pymupdf, numpy as np, json, sys, re
from numpy.fft import rfft2, irfft2
PDF = r"C:\Users\prolo.MYRA\Downloads\quran-qalun-mushaf.pdf"
S = 2.0
d = pymupdf.open(PDF)
def gray(page, clip=None):
    pm = page.get_pixmap(matrix=pymupdf.Matrix(S, S), colorspace=pymupdf.csGRAY, clip=clip)
    return np.frombuffer(pm.samples, np.uint8).reshape(pm.height, pm.width).astype(np.float32) / 255.0
tpl = 1.0 - gray(d[100], pymupdf.Rect(665, 851, 683, 869))
tpl -= tpl.mean(); tn = np.sqrt((tpl ** 2).sum())
th, tw = tpl.shape
def ncc(img):
    inv = (1.0 - img).astype(np.float64)
    H, W = inv.shape
    F = rfft2(inv); T = rfft2(tpl, s=(H, W))
    cc = irfft2(F * np.conj(T), s=(H, W))
    # local energy
    ii = np.pad(inv, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    i2 = np.pad(inv ** 2, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    def box(a):
        return a[th:, tw:] - a[:-th, tw:] - a[th:, :-tw] + a[:-th, :-tw]
    n = th * tw
    s1 = box(ii); s2 = box(i2)
    var = np.maximum(s2 - s1 ** 2 / n, 1e-6)
    out = np.zeros((H, W), np.float32)
    h2, w2 = H - th + 1, W - tw + 1
    out[:h2, :w2] = cc[:h2, :w2] / (tn * np.sqrt(var))
    return out, h2, w2
res = {}
for pg in range(1, 605):
    page = d[pg]
    img = gray(page)
    sc, h2, w2 = ncc(img)
    sc = sc[:h2, :w2]
    pts = []
    work = sc.copy()
    while True:
        i = np.unravel_index(np.argmax(work), work.shape)
        if work[i] < 0.80: break
        pts.append((float(i[1] + tw / 2) / S, float(i[0] + th / 2) / S, float(work[i])))
        y0, x0 = i
        work[max(0, y0 - th): y0 + th, max(0, x0 - tw): x0 + tw] = -1
    marks = []
    for x in page.get_drawings():
        if len(x['items']) >= 250:
            r = x['rect']; marks.append(((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2))
    res[pg] = {"stars": pts, "marks": marks}
    if pg % 50 == 0: print(pg, flush=True)
json.dump(res, open(r"starscan.json", "w"))
print("done")

