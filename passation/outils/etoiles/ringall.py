import json
from ringscan import d, find
res = {}
for p in range(1, 605):
    res[p] = find(d[p], 0.55)
    if p % 50 == 0: print(p, flush=True)
json.dump(res, open("ringscan.json", "w"))
print("done")
