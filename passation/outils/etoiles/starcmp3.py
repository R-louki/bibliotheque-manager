import json, re, collections
Q = json.load(open(r"C:\Users\prolo.MYRA\Documents\Bibliothèque manager\build\quran\qalun.json", encoding="utf-8"))
S = json.load(open("starscan.json")); RG = json.load(open("ringscan.json"))
verses = []
for s in Q["surahs"]:
    for a in s["ayat"]:
        pg = [int(x) for x in re.findall(r"\d+", a["p"])]
        verses.append((s["n"], a["n"], pg, "\u06de" in a["t"]))
bypage = collections.defaultdict(list)
for v in verses:
    for p in range(v[2][0], v[2][-1] + 1): bypage[p].append(v)
def order(items):
    ys = sorted(set(round(i[2]) for i in items)); cl = []
    for y in ys:
        if cl and y - cl[-1][-1] < 30: cl[-1].append(y)
        else: cl.append([y])
    def line(y):
        for i, c in enumerate(cl):
            if c[0] - 30 <= y <= c[-1] + 30: return i
    return sorted(items, key=lambda t: (line(t[2]), -t[1]))
ok = 0; bad = []
cnt_mk = 0
for p in range(1, 605):
    marks = [("m", x, y) for x, y, _ in RG[str(p)]]
    stars = [("s", x, y) for x, y, _ in S[str(p)]["stars"]]
    ends = sorted([v for v in bypage[p] if v[2][-1] == p], key=lambda v: (v[0], v[1]))
    if len(marks) != len(ends): bad.append((p, "marqueurs", len(marks), len(ends))); continue
    cnt_mk += 1
    o = order(marks + stars); n = 0; printed = []
    for t in o:
        if t[0] == "m": n += 1
        else: printed.append(n)
    data = [sum(1 for e in ends if (e[0], e[1]) < (v[0], v[1])) for v in sorted([v for v in bypage[p] if v[3] and v[2][0] == p], key=lambda v: (v[0], v[1]))]
    ids = [(v[0], v[1]) for v in sorted([v for v in bypage[p] if v[3] and v[2][0] == p], key=lambda v: (v[0], v[1]))]
    if printed == data: ok += 1
    else: bad.append((p, "etoiles", printed, data, ids))
print("pages avec marqueurs concordants:", cnt_mk, "| étoiles concordantes:", ok, "| à examiner:", len(bad))
for b in bad: print(b)
json.dump(bad, open("starcmp3.json", "w"), ensure_ascii=False)
