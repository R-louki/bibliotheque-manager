import json, re, collections
exec(open("starcmp3.py", encoding="utf-8").read().split("ok = 0; bad = []")[0])   # réutilise lecture + fonctions
allv = sorted(verses, key=lambda v: (v[0], v[1])); idx = {(v[0], v[1]): i for i, v in enumerate(allv)}
printed_pos = []      # (page, verset où commence l'étoile imprimée)
flag = []
for p in range(1, 605):
    marks = [("m", x, y) for x, y, _ in RG[str(p)]]; stars = [("s", x, y) for x, y, _ in S[str(p)]["stars"]]
    ends = sorted([v for v in bypage[p] if v[2][-1] == p], key=lambda v: (v[0], v[1]))
    if len(marks) != len(ends): flag.append((p, "marqueurs", len(marks), len(ends))); continue
    n = 0
    for t in order(marks + stars):
        if t[0] == "m": n += 1
        else:
            if n == 0:
                # avant le premier marqueur de la page : le verset qui se termine en premier doit commencer ici
                first = ends[0] if ends else None
                if first and first[2][0] == p: printed_pos.append((p, (first[0], first[1])))
                else: flag.append((p, "étoile avant le 1er marqueur dans un verset venu de la page précédente", first[:2] if first else None))
            else:
                e = ends[n - 1]; i = idx[(e[0], e[1])] + 1
                if i < len(allv): printed_pos.append((p, (allv[i][0], allv[i][1])))
data_pos = sorted((v[2][0], (v[0], v[1])) for v in verses if v[3])
pr = sorted(printed_pos)
print("étoiles imprimées localisées:", len(pr), "| dans les données:", len(data_pos))
sp, sd = set(x[1] for x in pr), set(x[1] for x in data_pos)
print("identiques:", len(sp & sd), "| seulement imprimé:", len(sp - sd), "| seulement données:", len(sd - sp))
d_only = sorted(sd - sp); p_only = sorted(sp - sd)
print("données seules:", d_only[:200]); print("imprimé seul:", p_only[:200])
print("à part:", flag)
json.dump({"imprime_seul": p_only, "donnees_seul": d_only, "flag": flag}, open("starfix.json", "w"))
