import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).parent
ORDER = ["drucker-eff", "grove", "scott", "lencioni", "collins", "sinek", "covey",
         "goldsmith", "kahneman", "christensen", "ocean", "drucker-mgmt",
         "womack-lean", "liker", "goldratt", "ohno", "rother-shook", "rother-kata",
         "zhuo", "marquet", "doerr", "horowitz", "mcchrystal",
         "carnegie", "patterson", "voss", "cialdini", "newport", "clear",
         "dehaene", "brown", "young", "ericsson", "dweck",
         "harari", "frankl", "lebon", "taleb", "csikszentmihalyi", "morel"]

def parse(path):
    meta, branches = {}, []
    node = None
    para = []
    def flush():
        nonlocal para
        if para and node is not None:
            node["body"].append({"type": "p", "text": " ".join(para)})
        para = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if not branches and not line.startswith("===") and ":" in line and node is None:
            k, v = line.split(":", 1); meta[k.strip()] = v.strip(); continue
        if line.startswith("=== "):
            flush(); branches.append({"title": line[4:].strip(), "nodes": []}); node = None; continue
        if line.startswith("--- "):
            flush(); node = {"title": line[4:].strip(), "kw": "", "body": []}; branches[-1]["nodes"].append(node); continue
        if node is None:
            continue
        if line.startswith("kw:") and not node["body"] and not para:
            node["kw"] = line[3:].strip(); continue
        if line.startswith("- "):
            flush()
            if node["body"] and node["body"][-1]["type"] == "ul":
                node["body"][-1]["items"].append(line[2:].strip())
            else:
                node["body"].append({"type": "ul", "items": [line[2:].strip()]})
            continue
        if line.startswith("> "):
            flush()
            label, _, text = line[2:].partition(" | ")
            node["body"].append({"type": "callout", "label": label.strip(), "text": text.strip()})
            continue
        if not line.strip():
            flush(); continue
        para.append(line.strip())
    flush()
    def words_of(b):
        t = []
        for br in b:
            t.append(br["title"])
            for n in br["nodes"]:
                t.append(n["title"])
                for bl in n["body"]:
                    t.append(bl.get("text", "")); t.extend(bl.get("items", []))
        return len(re.findall(r"\w+", " ".join(t)))
    meta["y"] = int(meta["y"])
    meta["branches"] = branches
    meta["words"] = words_of(branches)
    return meta

books = []
for bid in ORDER:
    p = ROOT / "books" / f"{bid}.txt"
    if p.exists():
        books.append(parse(p))

QZ = json.loads((ROOT / "quizzes.json").read_text(encoding="utf-8"))
for b in books:
    b["quiz"] = QZ.get(b["id"], [])
for b in books:
    for br in b["branches"]:
        for n in br["nodes"]:
            if len(n["kw"]) > 44: print("  ! kw long", b["id"], len(n["kw"]), n["kw"])
            if len(n["title"]) > 38: print("  ! titre long", b["id"], n["title"])
    print(f'{b["id"]:14} {b["words"]:6} mots  ≈ {round(b["words"]/200)} min  '
          f'{len(b["branches"])} branches, {sum(len(x["nodes"]) for x in b["branches"])} nœuds')

data = json.dumps(books, ensure_ascii=False).replace("</", "<\\/")
tpl = (ROOT / "template.html").read_text(encoding="utf-8")
out = tpl.replace("/*__DATA__*/", data)
(ROOT / "bibliotheque-du-manager.html").write_text(out, encoding="utf-8")
print("OK", len(out) // 1024, "Ko")

# ---- Version en ligne (GitHub Pages + Supabase), en trois langues
import shutil, copy
import os
SITE = pathlib.Path(os.environ.get("SITE_DIR", str(ROOT.parent / "bibliotheque-manager")))
CFG = {"url": "https://tujlyauskqaqwgeppdnj.supabase.co", "key": "sb_publishable_ZogShztsynruEKwqF-oM8w_bcPMn3m-", "google": True}
DESC = {"fr": "{n} livres de management, de compétences et de sciences humaines en cartes mentales, avec quiz et suivi de progression sur tous vos appareils.",
        "en": "{n} books on management, skills and the human sciences as mind maps, with quizzes and progress tracking on all your devices.",
        "ar": "{n} كتابًا في الإدارة والمهارات والعلوم الإنسانية في شكل خرائط ذهنية، مع اختبارات ومتابعة للتقدّم على جميع أجهزتك."}

def load_tr(lang):
    d = ROOT / "i18n" / lang
    ui = json.loads((d / "ui.json").read_text(encoding="utf-8")) if (d / "ui.json").exists() else {"dict": {}, "pats": [], "cats": {}}
    bt = {}
    if (d / "books").exists():
        for f in (d / "books").glob("*.json"):
            bt[f.stem] = json.loads(f.read_text(encoding="utf-8"))
    return ui, bt

nfull = {}
def parse_body(path):
    txt = path.read_text(encoding="utf-8")
    tmp = "y: 0\n" + txt
    q = pathlib.Path("/tmp/_pb.txt"); q.write_text(tmp, encoding="utf-8")
    return parse(q)["branches"]

def translate_books(lang):
    bs = copy.deepcopy(books)
    for b in bs: b["bodyLang"] = "fr"
    if lang == "fr": return bs, {"dict": {}, "pats": []}, 0
    ui, bt = load_tr(lang)
    n = 0
    for b in bs:
        b["cat"] = ui.get("cats", {}).get(b["cat"], b["cat"])
        b["p"] = re.sub(r"≈ (\d+) p\.", ui.get("pages", r"≈ \1 p."), b["p"])
        tr = bt.get(b["id"])
        if not tr: continue
        n += 1
        for k in ("t", "pitch", "center"):
            if tr.get(k): b[k] = tr[k]
        for i, br in enumerate(tr.get("br", [])):
            if i >= len(b["branches"]): break
            B = b["branches"][i]; B["title"] = br[0]
            for j, nd in enumerate(br[1]):
                if j >= len(B["nodes"]): break
                B["nodes"][j]["title"] = nd[0]
                if len(nd) > 1 and nd[1]: B["nodes"][j]["kw"] = nd[1]
                if len(nd) > 2 and nd[2]: B["nodes"][j]["body"] = nd[2]
        if tr.get("body"): b["bodyLang"] = lang
        fp = ROOT / "i18n" / lang / "full" / f'{b["id"]}.txt'
        if fp.exists():
            fb = parse_body(fp)
            same = len(fb) == len(b["branches"]) and all(len(x["nodes"]) == len(y["nodes"]) for x, y in zip(fb, b["branches"]))
            if not same:
                print("  ! structure différente", lang, b["id"])
            else:
                for x, y in zip(fb, b["branches"]):
                    for nx, ny in zip(x["nodes"], y["nodes"]):
                        ny["body"] = nx["body"]
                b["bodyLang"] = lang
                nfull[lang] = nfull.get(lang, 0) + 1
        if tr.get("quiz"):
            b["quiz"] = [{"q": q[0], "o": q[1], "a": b["quiz"][k]["a"], "e": q[2]} for k, q in enumerate(tr["quiz"]) if k < len(b["quiz"])]
        tw = []
        for B in b["branches"]:
            tw.append(B["title"])
    return bs, {"dict": ui.get("dict", {}), "pats": ui.get("pats", [])}, n

def page(lang, out_html, root):
    head, sep, body = out_html.partition("</style>")
    head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
    ui = TR_UI[lang]
    title = ui["dict"].get("Bibliothèque du Manager", "Bibliothèque du Manager")
    head = head.replace("<title>Bibliothèque du Manager</title>", "<title>" + title + "</title>")
    return ("<!doctype html>\n<html lang=\"" + lang + "\" dir=\"" + ("rtl" if lang == "ar" else "ltr") + "\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n"
        "<meta name=\"description\" content=\"" + DESC[lang].format(n=len(books)) + "\">\n"
        "<link rel=\"manifest\" href=\"" + root + "manifest.webmanifest\">\n<meta name=\"theme-color\" content=\"#f4f5f0\">\n"
        "<link rel=\"icon\" type=\"image/png\" href=\"" + root + "icons/icon-192.png\">\n<link rel=\"apple-touch-icon\" href=\"" + root + "icons/apple-touch-icon.png\">\n"
        "<link rel=\"alternate\" hreflang=\"fr\" href=\"" + root + "\"><link rel=\"alternate\" hreflang=\"en\" href=\"" + root + "en/\"><link rel=\"alternate\" hreflang=\"ar\" href=\"" + root + "ar/\">\n"
        "<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n<meta name=\"apple-mobile-web-app-title\" content=\"" + title + "\">\n"
        "<style>html{color-scheme:light}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px/1.4 system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>\n"
        + head + sep + "\n<script src=\"" + root + "vendor/supabase.js\"></script>\n"
        "<script>window.SUPA_CFG=" + json.dumps(CFG) + ";window.LANG=" + json.dumps(lang) + ";window.SITE_ROOT=" + json.dumps(root) + ";window.I18N=" + json.dumps(ui, ensure_ascii=False).replace("</", "<\\/") + ";</script>\n</head>\n<body>\n" + body.lstrip("\n") + "\n</body>\n</html>\n")

TR_UI = {}
pages = {}
for lang in ("fr", "en", "ar"):
    bs, ui, n = translate_books(lang); TR_UI[lang] = ui
    d = json.dumps(bs, ensure_ascii=False).replace("</", "<\\/")
    pages[lang] = page(lang, tpl.replace("/*__DATA__*/", d), "./" if lang == "fr" else "../")
    if lang != "fr": print(f"  {lang}: {n}/{len(bs)} livres traduits, {nfull.get(lang,0)} textes complets, {len(ui['dict'])} chaînes UI")

if SITE.exists():
    (SITE / "index.html").write_text(pages["fr"], encoding="utf-8")
    for lang in ("en", "ar"):
        (SITE / lang).mkdir(exist_ok=True); (SITE / lang / "index.html").write_text(pages[lang], encoding="utf-8")
    v = SITE / "vendor"; v.mkdir(exist_ok=True)
    src = pathlib.Path("/tmp/claude-0/-home-claude/23635339-aa1c-5e6c-bc9b-58e1161d2c2a/scratchpad/sb/package/dist/umd")
    for f in src.glob("*.js"): shutil.copy(f, v / f.name)
    (SITE / ".nojekyll").write_text("")
    sys.path.insert(0, str(ROOT)); import pwa
    print("PWA", pwa.build(SITE, pages["fr"] + pages["en"] + pages["ar"]))
    print("SITE OK", len(pages["fr"])//1024, "Ko")
