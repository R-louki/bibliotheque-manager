import json, hashlib, pathlib
from PIL import Image, ImageDraw

def icon(size, maskable=False):
    S = size * 4
    im = Image.new("RGB", (S, S), (44, 90, 76))
    d = ImageDraw.Draw(im)
    pad = int(S * (0.22 if maskable else 0.16))
    base = S - pad - int(S * 0.08)
    shelf_h = int(S * 0.035)
    d.rectangle([pad - int(S*0.02), base, S - pad + int(S*0.02), base + shelf_h], fill=(243, 234, 214))
    books = [(0.15, 0.62, (243, 234, 214)), (0.12, 0.50, (217, 169, 90)), (0.16, 0.70, (127, 192, 168)), (0.11, 0.56, (243, 234, 214))]
    x = pad
    for w, h, col in books:
        bw, bh = int(S * w), int(S * h)
        d.rounded_rectangle([x, base - bh, x + bw, base - int(S*0.004)], radius=int(S*0.015), fill=col)
        d.rectangle([x + int(bw*0.2), base - bh + int(S*0.06), x + int(bw*0.8), base - bh + int(S*0.075)], fill=(44, 90, 76))
        x += bw + int(S * 0.025)
    # lean the last book slightly by drawing an angled one
    return im.resize((size, size), Image.LANCZOS)

def build(site, index_html):
    ic = site / "icons"; ic.mkdir(exist_ok=True)
    icon(192).save(ic / "icon-192.png"); icon(512).save(ic / "icon-512.png"); icon(512, True).save(ic / "icon-maskable-512.png")
    icon(180).save(ic / "apple-touch-icon.png")
    manifest = {
        "name": "Bibliothèque du Manager", "short_name": "Bibliothèque",
        "description": "Livres de management en cartes mentales et lectures de 45 minutes.",
        "lang": "fr", "start_url": "./", "scope": "./", "display": "standalone",
        "background_color": "#f4f5f0", "theme_color": "#2c5a4c",
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
        ]
    }
    (site / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    ver = hashlib.sha1(index_html.encode("utf-8")).hexdigest()[:10]
    sw = """const VERSION = "bm-%s";
const CORE = ["./", "index.html", "en/index.html", "ar/index.html", "vendor/supabase.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req.url.split("#")[0], cp)); return r; }).catch(() => caches.match(req.url.split("#")[0]).then(h => h || caches.match(/\\/(en|ar)\\//.test(url.pathname) ? url.pathname.match(/\\/(en|ar)\\//)[1] + "/index.html" : "index.html"))));
    return;
  }
  const cacheable = url.origin === location.origin || /fonts\\.(googleapis|gstatic)\\.com$|cdnjs\\.cloudflare\\.com$|covers\\.openlibrary\\.org$|archive\\.org$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
""" % ver
    (site / "sw.js").write_text(sw, encoding="utf-8")
    return ver
