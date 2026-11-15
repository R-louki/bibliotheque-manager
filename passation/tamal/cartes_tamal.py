import json, html, base64, re, unicodedata
B = r"C:\Users\prolo.MYRA\Documents\Bibliothèque manager\build\quran"
H = r"C:\Users\prolo.MYRA\AppData\Local\Temp\claude\c8cfb917e32d24ae\036338db-dc59-421b-9f19-99a974b8b426\scratchpad\hadith"
Q = json.load(open(B + r"\qalun.json", encoding="utf-8"))
M = json.load(open(B + r"\map_to_hafs.json", encoding="utf-8"))
TM = json.load(open(B + r"\tafsir\muyassar.json", encoding="utf-8"))["t"]
BU = json.load(open(H + r"\ara-bukhari.json", encoding="utf-8")); MU = json.load(open(H + r"\ara-muslim.json", encoding="utf-8"))
names = {s["n"]: s["name"] for s in Q["surahs"]}
# (موضوع، سورة، آيات حفص، مقطع من الحديث، مصدر B/M)
C = [
 ("الإخلاص", 98, [5], "إنما الأعمال بالنيات", "B"),
 ("الصبر والشكر", 2, [153], "عجبا لأمر المؤمن", "M"),
 ("الابتلاء", 2, [155], "ما يصيب المسلم من نصب ولا وصب", "B"),
 ("الأخوّة", 49, [10], "لا يؤمن أحدكم حتى يحب لأخيه", "B"),
 ("حفظ اللسان", 50, [18], "فليقل خيرا أو ليصمت", "B"),
 ("كظم الغيظ", 3, [134], "ليس الشديد بالصرعة", "B"),
 ("حسن الظن", 49, [12], "إياكم والظن فإن الظن أكذب الحديث", "B"),
 ("الصدق", 9, [119], "الصدق يهدي إلى البر", "B"),
 ("الأمانة والوفاء", 4, [58], "آية المنافق ثلاث", "B"),
 ("بر الوالدين", 17, [23], "بحسن صحابتي", "B"),
 ("الدعاء", 2, [186], "ينزل ربنا تبارك وتعالى كل ليلة", "B"),
 ("التوبة", 39, [53], "بتوبة عبده", "B"),
 ("الذكر", 13, [28], "مثل الحي والميت", "B"),
 ("التوكل", 65, [3], "وعلى ربهم يتوكلون", "B"),
 ("التواضع", 25, [63], "وما تواضع أحد لله إلا رفعه الله", "M"),
 ("الرحمة", 21, [107], "من لا يرحم لا يرحم", "B"),
 ("الرفق", 3, [159], "إن الرفق لا يكون في شيء إلا زانه", "M"),
 ("الحياء", 28, [25], "الحياء لا يأتي إلا بخير", "B"),
 ("الصلاة", 29, [45], "أرأيتم لو أن نهرا بباب أحدكم", "B"),
 ("الصدقة", 2, [261], "اتقوا النار ولو بشق تمرة", "B"),
 ("طلب العلم", 20, [114], "من يرد الله به خيرا يفقهه في الدين", "B"),
 ("تعلّم القرآن", 54, [17], "خيركم من تعلم القرآن وعلمه", "B"),
 ("الكلمة الطيبة", 14, [24], "الكلمة الطيبة صدقة", "B"),
 ("حق الجار", 4, [36], "ما زال جبريل يوصيني بالجار", "B"),
 ("الصبر والعفّة", 39, [10], "ومن يتصبر يصبره الله", "B"),
 ("غنى النفس", 20, [131], "ليس الغنى عن كثرة العرض", "B"),
 ("الدنيا عبور", 57, [20], "كن في الدنيا كأنك غريب", "B"),
 ("العمل الباقي", 18, [46], "إذا مات الإنسان انقطع عنه عمله", "M"),
 ("الإحسان", 16, [90], "إن الله كتب الإحسان على كل شيء", "M"),
 ("شعب الإيمان", 49, [15], "الإيمان بضع وسبعون", "M"),
 ("كفّ الأذى", 33, [58], "المسلم من سلم المسلمون من لسانه ويده", "B"),
 ("صلة الرحم", 4, [1], "من أحب أن يبسط له في رزقه", "B"),
 ("الحسد", 4, [54], "لا تحاسدوا ولا تباغضوا", "M"),
 ("الغيبة", 49, [11], "ذكرك أخاك بما يكره", "M"),
 ("النصيحة", 11, [88], "الدين النصيحة", "M"),
 ("الأمر بالمعروف", 3, [110], "من رأى منكم منكرا فليغيره بيده", "M"),
 ("اليسر", 2, [185], "إن الدين يسر", "B"),
 ("الدعاء للإخوان", 59, [10], "دعوة المرء المسلم لأخيه بظهر الغيب", "M"),
 ("التفاؤل", 12, [87], "ويعجبني الفأل", "B"),
 ("قيام الليل والشكر", 17, [79], "أفلا أكون عبدا شكورا", "B"),
 ("الصيام", 2, [183], "الصيام جنة", "B"),
 ("ليلة القدر", 97, [1, 2, 3], "من قام ليلة القدر إيمانا واحتسابا", "B"),
 ("العدل", 5, [8], "سبعة يظلهم الله في ظله", "B"),
 ("الظلم", 14, [42], "اتقوا الظلم فإن الظلم ظلمات", "M"),
 ("الاستقامة", 41, [30], "فاستقم", "M"),
 ("مجاهدة الشهوات", 3, [14], "حفت الجنة بالمكاره", "M"),
 ("لا تحقرنّ المعروف", 99, [7, 8], "لا تحقرن من المعروف شيئا", "M"),
 ("نعيم الجنة", 32, [17], "ما لا عين رأت", "B"),
 ("حسن الخلق", 68, [4], "إن من خياركم أحسنكم أخلاقا", "B"),
 ("الصحة والفراغ", 94, [7], "نعمتان مغبون فيهما", "B"),
 ("المؤمن القوي", 8, [60], "المؤمن القوي خير وأحب إلى الله", "M"),
 ("الاستخارة", 28, [68], "إذا هم أحدكم بالأمر فليركع ركعتين", "B"),
 ("الرضا", 98, [8], "ذاق طعم الإيمان من رضي بالله ربا", "M"),
 ("الحب في الله", 9, [71], "ثلاث من كن فيه وجد حلاوة الإيمان", "B"),
 ("المداومة على العمل", 15, [99], "أدومها", "B1"),
 ("التيسير", 22, [78], "يسروا ولا تعسروا", "B"),
 ("الهم والحزن", 12, [86], "أعوذ بك من الهم والحزن", "B"),
 ("التسبيح", 20, [130], "كلمتان خفيفتان على اللسان", "B"),
 ("الاستغفار", 71, [10], "أستغفر الله وأتوب إليه في اليوم أكثر من سبعين مرة", "B"),
 ("اليد العليا", 2, [267], "اليد العليا خير من اليد السفلى", "B"),
 ("الإنفاق والخلف", 34, [39], "اللهم أعط منفقا خلفا", "B"),
 ("إكرام الضيف", 51, [24, 25, 26, 27], "فليكرم ضيفه", "B"),
 ("عيادة المريض", 26, [80], "مرضت فلم تعدني", "M"),
 ("كفالة اليتيم", 93, [9], "أنا وكافل اليتيم في الجنة", "B"),
 ("الستر والعفو", 24, [22], "ومن ستر مسلما", "B"),
 ("القصد والاعتدال", 25, [67], "سددوا وقاربوا", "B"),
 ("الحلم والأناة", 41, [35], "الحلم والأناة", "M"),
 ("الطهارة", 2, [222], "الطهور شطر الإيمان", "M"),
 ("الكلمة مسؤولية", 17, [36], "إن العبد ليتكلم بالكلمة من رضوان الله", "B"),
 ("الجليس الصالح", 18, [28], "مثل الجليس الصالح", "B"),
 ("المسؤولية", 66, [6], "كلكم راع", "B2"),
 ("الإحسان إلى الزوجة", 30, [21], "استوصوا بالنساء خيرا", "B"),
 ("سعة الرحمة", 7, [156], "إن رحمتي تغلب غضبي", "B"),
 ("حسن الظن بالله", 39, [36], "أنا عند ظن عبدي بي", "B"),
 ("الرجاء", 6, [54], "جعل الله الرحمة مائة جزء", "B"),
 ("تذكّر الموت", 102, [1, 2], "فزوروا القبور", "M"),
 ("إفشاء السلام", 4, [86], "أفشوا السلام بينكم", "M"),
 ("الإصلاح بين الناس", 4, [114], "يعدل بين الاثنين", "B"),
 ("الاعتصام بالسنّة", 59, [7], "كل أمتي يدخلون الجنة إلا من أبى", "B"),
 ("طاعة الرسول ﷺ", 3, [31], "من أطاعني فقد أطاع الله", "B"),
 ("الصلاة على النبي ﷺ", 33, [56], "من صلى علي صلاة صلى الله عليه بها عشرا", "M"),
 ("الخشية", 35, [28], "إني لأخشاكم لله", "B"),
 ("شكر النعم", 14, [34], "انظروا إلى من أسفل منكم", "M"),
 ("الزهد", 28, [77], "الدنيا سجن المؤمن", "M"),
 ("المبادرة بالخير", 3, [133], "بادروا بالأعمال", "M"),
]
def norm(t):
    t = unicodedata.normalize("NFKD", t); out = []; idx = []
    for i, ch in enumerate(t):
        if unicodedata.category(ch) in ("Mn", "Cf", "Sk"): continue
        ch = {"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي", "ـ": ""}.get(ch, ch)
        if not ch or not ch.strip() or unicodedata.category(ch)[0] in "PS":
            if ch == " " or (ch and ch.strip() == ""): out.append(" "); idx.append(i)
            continue
        out.append(ch); idx.append(i)
    s = re.sub(r" +", " ", "".join(out))
    return s
def nmap(t):
    # retourne (texte normalisé, index vers texte NFKD d'origine)
    t = unicodedata.normalize("NFKD", t); out = []; idx = []
    for i, ch in enumerate(t):
        if unicodedata.category(ch) in ("Mn", "Cf", "Sk"): continue
        ch = {"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي"}.get(ch, ch)
        if ch.isspace(): ch = " "
        elif unicodedata.category(ch)[0] in "PS": continue
        if ch == " " and out and out[-1] == " ": continue
        out.append(ch); idx.append(i)
    return "".join(out), idx, t
def find_hadith(phrase, src):
    p = norm(phrase).strip(); res = []
    for h in (BU if src == "B" else MU)["hadiths"]:
        if not h["text"]: continue
        s, idx, orig = nmap(h["text"])
        k = s.find(p)
        if k >= 0: res.append((h, s, idx, orig, k, k + len(p)))
    return res
def matn(h, s, idx, orig, a, b):
    oa, ob = idx[a], idx[b - 1]
    QS = '"'
    if len(orig) <= 1100 and QS in orig:
        # hadith court : on enlève l'isnād (jusqu'à « عن النبي » / « رضي الله عنه ») et on garde le reste du texte
        fq = orig.find(QS)
        m = None
        for mm in re.finditer(r"(رضى الله عنه|رضي الله عنه|رضى الله عنها|رضي الله عنها|رضى الله عنهما|رضي الله عنهما|عَنِ النَّبِيِّ|عَنْ رَسُولِ اللَّهِ|سَمِعْتُ رَسُولَ اللَّهِ|سَمِعْتُ النَّبِيَّ)", orig[:fq]): m = mm
        st = m.end() if m else fq
        t = orig[st:].replace("‏", " ").replace(QS, " ").replace("صلى الله عليه وسلم", "ﷺ")
        t = re.sub(r"\s+", " ", t).strip(" ـ-،:")
        if t.startswith("صَلَّى") or t.startswith("ﷺ"): t = re.sub(r"^.{0,70}?(يَقُولُ|قَالَ)\s*:?\s*", "", t).strip()
        t = re.sub(r"^.{0,60}?(قَالَ النَّبِيُّ ﷺ|قَالَ رَسُولُ اللَّهِ ﷺ|أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ|سَمِعَ رَسُولَ اللَّهِ ﷺ يَقُولُ|سَمِعَ النَّبِيَّ ﷺ يَقُولُ)\s*", "", t).strip() if re.match(r"^.{0,60}?(قَالَ النَّبِيُّ ﷺ|قَالَ رَسُولُ اللَّهِ ﷺ|أَنَّ رَسُولَ اللَّهِ ﷺ قَالَ|سَمِعَ رَسُولَ اللَّهِ ﷺ يَقُولُ|سَمِعَ النَّبِيَّ ﷺ يَقُولُ)", t) else t
        if len(t) > 700: t = t[:700].rsplit(" ", 1)[0] + " …"
        return t, True
    q1 = orig.rfind('"', 0, oa); q2 = orig.find('"', ob)
    if q1 < 0:
        q1 = orig.rfind("‏", 0, oa); q2 = orig.find("‏", ob)    # dans le texte de Muslim les guillemets sont des marques RTL
    if q1 >= 0 and q2 >= 0 and q2 - q1 < 1500:
        t = orig[q1 + 1:q2].strip()
        if len(t) < 70: t = orig[q1 + 1:q1 + 1 + 420].strip() + " …"     # citation coupée par la narration : on prolonge
        return t, True
    lo = max(0, oa - 120); return orig[lo:min(len(orig), ob + 330)].strip(), False
rows = []; bad = []
for i, (theme, sn, hs, hp, src) in enumerate(C, 1):
    qv = sorted({qi + 1 for qi, hh in enumerate(M[sn - 1]) if any(x in hh for x in hs)})
    ay = Q["surahs"][sn - 1]["ayat"]; txt = " ".join(ay[q - 1]["t"] for q in qv)
    tf = [(TM[sn - 1][h - 1] if h - 1 < len(TM[sn - 1]) else "").strip() for h in hs]
    k = int(src[1:]) if len(src) > 1 else 0; src = src[0]; C[i - 1] = (theme, sn, hs, hp, src)
    hits = find_hadith(hp, src)
    if len(hits) <= k: bad.append((i, theme, "hadith introuvable", hp))
    h = hits[k] if len(hits) > k else None
    m = matn(*h) if h else ("", False)
    if h and not m[1]: bad.append((i, theme, "extrait sans guillemets", hp))
    rows.append((i, theme, sn, hs, qv, txt, tf, h, m, len(hits)))
print("cartes:", len(rows), "| à revoir:", len(bad))
for b in bad: print(b)
json.dump([(r[0], r[1], r[2], r[3], r[4]) for r in rows], open("cards2_meta.json", "w", encoding="utf-8"), ensure_ascii=False)
font = base64.b64encode(open(B + r"\fonts\KFGQPC-Qaloon-v0.10.ttf", "rb").read()).decode()
BN = BU["metadata"]["sections"]; MN = MU["metadata"]["sections"]
h_ = ['<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>مراجعة بطاقات تأمل اليوم</title>',
      '<style>@font-face{font-family:Q;src:url(data:font/ttf;base64,' + font + ')}',
      'body{font-family:system-ui,"Segoe UI",Tahoma,sans-serif;background:#f4f5f0;color:#222;margin:auto;padding:14px;max-width:760px;line-height:1.7}',
      'h1{font-size:20px}.c{background:#fff;border:1px solid #d9dccf;border-radius:12px;padding:12px 14px;margin:12px 0}',
      '.t{font-weight:700;color:#2c5a4c}.r{font-size:13px;color:#666;direction:rtl}.v{font-family:Q,serif;font-size:26px;line-height:2.1;text-align:center;direction:rtl;margin:8px 0}',
      '.tf,.hd{font-size:15px;direction:rtl;border-top:1px dashed #ccc;padding-top:6px;color:#333;margin-top:6px}.tf small,.hd small{color:#888;display:block}.hd{background:#faf7ee;border-radius:8px;padding:8px 10px}</style>',
      '<h1>بطاقات «تأمل اليوم» — %d بطاقة للمراجعة</h1><p dir=rtl>لكل بطاقة: موضوع، آية بنص قالون، التفسير الميسّر كما هو، ثم حديث من الصحيحين (البخاري أو مسلم فقط) بنصّه كما في المصدر بعد حذف الإسناد، وقد يمتد النص إلى تتمة الرواية في الحديث نفسه. اكتب لي أرقام البطاقات التي تريد حذفها أو استبدالها.</p>' % len(rows)]
for i, theme, sn, hs, qv, txt, tf, h, m, nh in rows:
    ref_h = "سورة " + names[sn] + " " + "،".join(map(str, hs))
    h_.append('<div class=c><div class=t dir=rtl>%d. %s</div><div class=r>%s · آية قالون %s (عدّ حفص: %s)</div><div class=v>%s</div>' % (i, html.escape(theme), html.escape(ref_h), "،".join(map(str, qv)), "،".join(map(str, hs)), html.escape(txt)))
    for hv, t in zip(hs, tf): h_.append('<div class=tf><small>التفسير الميسّر — آية %d (عدّ حفص)</small>%s</div>' % (hv, html.escape(t) or "—"))
    if h:
        hh = h[0]; ref = hh["reference"]
        cite = ("صحيح البخاري — حديث رقم %s" % hh["hadithnumber"]) if C[i - 1][4] == "B" else ("صحيح مسلم — كتاب %s، حديث %s في الكتاب (%s)" % (ref["book"], ref["hadith"], MN.get(str(ref["book"]), "")))
        h_.append('<div class=hd><small>%s%s</small>%s</div>' % (html.escape(cite), "" if m[1] else " — تنبيه: مقتطف من النص", html.escape(m[0])))
    else: h_.append('<div class=hd><small>لم أجد الحديث</small></div>')
    h_.append("</div>")
open(r"C:\Users\PROLO~1.MYR\AppData\Local\Temp\claude\c8cfb917e32d24ae\036338db-dc59-421b-9f19-99a974b8b426\scratchpad\quran\tamal_cartes.html".replace("PROLO~1.MYR", "prolo.MYRA"), "w", encoding="utf-8").write("\n".join(h_))
for i, theme, sn, hs, qv, txt, tf, h, m, nh in rows[:0]: pass
