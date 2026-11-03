import json, sys, importlib.util, pathlib
R = pathlib.Path(__file__).parent
S = json.load(open('/tmp/claude-0/-home-claude/23635339-aa1c-5e6c-bc9b-58e1161d2c2a/scratchpad/fr_skel.json'))
for f in sys.argv[1:]:
    spec = importlib.util.spec_from_file_location("m", R / f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    for lang, D in (("en", m.EN), ("ar", m.AR)):
        for bid, tr in D.items():
            fr = S[bid]; ok = True
            if len(tr["br"]) != len(fr["br"]): print("!! branches", lang, bid, len(tr["br"]), len(fr["br"])); ok = False
            for i, (a, b) in enumerate(zip(tr["br"], fr["br"])):
                if len(a[1]) != len(b[1]): print("!! nodes", lang, bid, i, len(a[1]), len(b[1])); ok = False
            if len(tr["quiz"]) != len(fr["quiz"]): print("!! quiz", lang, bid); ok = False
            for q in tr["quiz"]:
                if len(q[1]) != 4: print("!! options", lang, bid, q[0][:40]); ok = False
            (R / lang / "books").mkdir(parents=True, exist_ok=True)
            (R / lang / "books" / f"{bid}.json").write_text(json.dumps(tr, ensure_ascii=False), encoding="utf-8")
            print("ok" if ok else "WARN", lang, bid)
