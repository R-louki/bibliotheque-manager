/* ---------- Étape 2 : apprendre ---------- */
const PATHS = [
  { id: "premiers-pas", t: "Premiers pas de manager", d: "Les fondations : maîtriser son temps, faire produire une équipe, donner du feedback et construire la confiance.", books: ["drucker-eff", "grove", "scott", "lencioni"] },
  { id: "diriger-equipe", t: "Diriger et faire grandir une équipe", d: "La dynamique collective, la franchise, le changement de comportement et les habitudes du leader.", books: ["lencioni", "scott", "goldsmith", "covey"] },
  { id: "strategie-decision", t: "Stratégie et décision", d: "Mieux décider, se concentrer sur l'essentiel, voir venir les ruptures et créer de nouveaux marchés.", books: ["kahneman", "collins", "christensen", "ocean"] },
  { id: "leadership-sens", t: "Leadership et sens", d: "Donner une direction, incarner des principes et faire de l'organisation un instrument au service de sa mission.", books: ["sinek", "covey", "collins", "drucker-mgmt"] }
];
const PASS = 0.75;
const quizPassed = id => { const r = ext.quiz[id]; const b = BOOKS.find(x => x.id === id); return !!(r && b && b.quiz && b.quiz.length && r.best / b.quiz.length >= PASS); };
const pathState = p => { const done = p.books.filter(id => read.has(id) && quizPassed(id)).length; return { done, total: p.books.length, complete: done === p.books.length }; };

/* Cartes de révision : une carte par idée qui a un encadré « À retenir » */
const CARDS = [];
BOOKS.forEach(b => b.branches.forEach((br, i) => br.nodes.forEach((nd, j) => {
  const c = nd.body.find(x => x.type === "callout"); if (!c) return;
  CARDS.push({ id: b.id + ":" + i + "-" + j, b, nid: `n-${i}-${j}`, front: nd.title, back: c.text.replace(/\*\*?/g, ""), label: c.label || "À retenir" });
})));
const INTERVALS = [0, 1, 3, 7, 16, 35];
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return dayKey(d); }
function eligibleBooks() { return new Set(BOOKS.filter(b => read.has(b.id) || (pos[b.id] && pos[b.id].pct >= 10)).map(b => b.id)); }
function dueCards() {
  const el = eligibleBooks(), today = dayKey();
  const due = CARDS.filter(c => ext.srs[c.id] && ext.srs[c.id].due <= today && el.has(c.b.id));
  const nd = ext.stats.newDay && ext.stats.newDay.d === today ? ext.stats.newDay.n : 0;
  const fresh = CARDS.filter(c => !ext.srs[c.id] && el.has(c.b.id)).slice(0, Math.max(0, 10 - nd));
  return { due, fresh, all: due.slice(0, 20).concat(fresh) };
}

/* Quiz */
let QZ = null;
function shuffle(a) { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
function openQuiz(bid) {
  const b = BOOKS.find(x => x.id === bid); if (!b || !b.quiz || !b.quiz.length) return;
  stopSpeech && stopSpeech();
  QZ = { b, i: 0, score: 0, qs: b.quiz.map(q => ({ q, order: shuffle(q.o.map((_, k) => k)) })), answered: false };
  $("quizOv").hidden = false; document.body.style.overflow = "hidden"; renderQuiz();
}
function closeQuiz() { $("quizOv").hidden = true; document.body.style.overflow = ""; QZ = null; if (!$("learn").hidden) renderLearn(); if (curBook) renderQuizBox(); }
function renderQuiz() {
  const { b, i, qs } = QZ, n = qs.length;
  $("qzTitle").textContent = "Quiz · " + b.t;
  if (i >= n) {
    const pct = QZ.score / n, prev = ext.quiz[b.id];
    ext.quiz[b.id] = { best: Math.max(QZ.score, prev ? prev.best : 0), last: QZ.score, n, t: Date.now(), tries: (prev ? prev.tries || 0 : 0) + 1 };
    saveExt();
    const msg = pct === 1 ? "Parfait ! Vous maîtrisez les idées clés de ce livre." : pct >= PASS ? "Quiz réussi. Relisez les passages des questions manquées pour consolider." : "Pas encore. Relisez les sections concernées puis retentez le quiz : il faut 6 bonnes réponses sur 8.";
    $("qzBody").innerHTML = `<div class="qzend"><div class="qzscore">${QZ.score}<small> / ${n}</small></div><p>${msg}</p><div class="qzacts"><button class="btn primary" type="button" id="qzAgain">Recommencer</button><button class="btn" type="button" id="qzDone">Terminer</button></div></div>`;
    $("qzProg").style.width = "100%"; $("qzCount").textContent = "Résultat";
    $("qzAgain").onclick = () => openQuiz(b.id); $("qzDone").onclick = closeQuiz;
    return;
  }
  const cur = qs[i]; QZ.answered = false;
  $("qzProg").style.width = (i / n * 100) + "%"; $("qzCount").textContent = `Question ${i + 1} sur ${n}`;
  $("qzBody").innerHTML = `<h3 class="qzq"></h3><div class="qzopts">${cur.order.map(k => `<button type="button" class="qzopt" data-k="${k}"></button>`).join("")}</div><div class="qzfb" id="qzFb" hidden></div>`;
  $("qzBody").querySelector(".qzq").textContent = cur.q.q;
  $("qzBody").querySelectorAll(".qzopt").forEach(btn => { btn.textContent = cur.q.o[+btn.dataset.k]; btn.onclick = () => answerQuiz(+btn.dataset.k); });
  const first = $("qzBody").querySelector(".qzopt"); if (first) first.focus({ preventScroll: true });
}
function answerQuiz(k) {
  if (!QZ || QZ.answered) return; QZ.answered = true;
  const cur = QZ.qs[QZ.i], ok = k === cur.q.a; if (ok) QZ.score++;
  $("qzBody").querySelectorAll(".qzopt").forEach(btn => { const kk = +btn.dataset.k; btn.disabled = true; if (kk === cur.q.a) btn.classList.add("ok"); else if (kk === k) btn.classList.add("ko"); });
  const fb = $("qzFb"); fb.hidden = false; fb.className = "qzfb " + (ok ? "ok" : "ko");
  fb.innerHTML = `<strong>${ok ? "Bonne réponse." : "Ce n'est pas ça."}</strong> <span></span><div class="qzacts"><button class="btn primary" type="button" id="qzNext">${QZ.i + 1 < QZ.qs.length ? "Question suivante" : "Voir mon score"}</button></div>`;
  fb.querySelector("span").textContent = cur.q.e;
  $("qzNext").onclick = () => { QZ.i++; renderQuiz(); }; $("qzNext").focus({ preventScroll: true });
}
function renderQuizBox() {
  const box = $("quizBox"); if (!box || !curBook) return;
  const b = curBook, r = ext.quiz[b.id];
  if (!b.quiz || !b.quiz.length) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<div><span class="lbl">Testez vos connaissances</span><strong>${b.quiz.length} questions sur les idées clés</strong><span class="sub">${r ? `Meilleur score : ${r.best} / ${r.n}${quizPassed(b.id) ? " · réussi ✓" : ""}` : "Il faut 6 bonnes réponses sur 8 pour réussir."}</span></div><button class="btn primary" type="button" data-quiz="${b.id}">${r ? "Refaire le quiz" : "Faire le quiz"}</button>`;
}

/* Révision */
let RV = null;
function openReview() {
  const { all } = dueCards(); if (!all.length) return;
  RV = { q: shuffle(all), i: 0, again: [], known: 0, done: 0 };
  $("revOv").hidden = false; document.body.style.overflow = "hidden"; renderReview();
}
function closeReview() { $("revOv").hidden = true; document.body.style.overflow = ""; RV = null; if (!$("learn").hidden) renderLearn(); }
function renderReview() {
  if (RV.i >= RV.q.length && RV.again.length) { RV.q = RV.q.concat(RV.again); RV.again = []; }
  const total = RV.q.length;
  if (RV.i >= total) {
    $("rvProg").style.width = "100%"; $("rvCount").textContent = "Terminé";
    $("rvBody").innerHTML = `<div class="qzend"><div class="qzscore">${RV.done}<small> cartes</small></div><p>Révision terminée. ${RV.known} carte${RV.known > 1 ? "s" : ""} connue${RV.known > 1 ? "s" : ""} du premier coup. Les cartes reviendront à intervalles de plus en plus espacés.</p><div class="qzacts"><button class="btn primary" type="button" id="rvDone">Terminer</button></div></div>`;
    $("rvDone").onclick = closeReview; return;
  }
  const c = RV.q[RV.i];
  $("rvProg").style.width = (RV.i / total * 100) + "%"; $("rvCount").textContent = `Carte ${RV.i + 1} sur ${total}`;
  $("rvBody").innerHTML = `<div class="rcard"><span class="rbook"></span><h3 class="rfront"></h3><p class="rhint">Rappelez-vous l'idée essentielle, puis retournez la carte.</p><div class="rback" hidden><span class="rlab"></span><p></p></div></div><div class="qzacts" id="rvActs"><button class="btn primary" type="button" id="rvFlip">Retourner la carte</button></div>`;
  const body = $("rvBody");
  body.querySelector(".rbook").textContent = c.b.t; body.querySelector(".rfront").textContent = c.front;
  body.querySelector(".rlab").textContent = c.label; body.querySelector(".rback p").textContent = c.back;
  $("rvFlip").onclick = () => {
    body.querySelector(".rback").hidden = false; body.querySelector(".rhint").hidden = true;
    $("rvActs").innerHTML = `<button class="btn" type="button" id="rvAgain">À revoir</button><button class="btn primary" type="button" id="rvKnow">Je savais</button>`;
    $("rvAgain").onclick = () => gradeCard(c, false); $("rvKnow").onclick = () => gradeCard(c, true); $("rvKnow").focus({ preventScroll: true });
  };
  $("rvFlip").focus({ preventScroll: true });
}
function gradeCard(c, ok) {
  const today = dayKey(), s = ext.srs[c.id];
  if (!s) { const nd = ext.stats.newDay && ext.stats.newDay.d === today ? ext.stats.newDay.n : 0; ext.stats.newDay = { d: today, n: nd + 1 }; }
  const firstTime = !RV.seen || !RV.seen[c.id]; RV.seen = RV.seen || {}; RV.seen[c.id] = 1;
  if (ok) { const box = Math.min(5, (s ? s.box : 0) + 1); ext.srs[c.id] = { box, due: addDays(INTERVALS[box]) }; if (firstTime) RV.known++; }
  else { ext.srs[c.id] = { box: 1, due: addDays(1) }; RV.again.push(c); }
  ext.stats.reviews = (ext.stats.reviews || 0) + 1; RV.done += firstTime ? 1 : 0;
  saveExt(); RV.i++; renderReview();
}

/* Badges */
function maxStreak() { const ks = Object.keys(ext.stats.days).filter(k => ext.stats.days[k] >= 60).sort(); let best = 0, cur = 0, prev = null; ks.forEach(k => { const d = new Date(k + "T12:00:00"); if (prev && (d - prev) / 864e5 < 1.5) cur++; else cur = 1; best = Math.max(best, cur); prev = d; }); return best; }
function badgeList() {
  const totalT = Object.values(ext.stats.days).reduce((a, b) => a + b, 0), hl = Object.values(ext.hl).flat(), notes = hl.filter(h => h.note).length;
  const passed = BOOKS.filter(b => quizPassed(b.id)).length, perfect = BOOKS.some(b => ext.quiz[b.id] && ext.quiz[b.id].best === (b.quiz || []).length && b.quiz && b.quiz.length);
  const ms = Math.max(maxStreak(), streak()), rv = ext.stats.reviews || 0, paths = PATHS.filter(p => pathState(p).complete).length;
  return [
    ["📖", "Premier livre", "Terminer un premier livre", read.size >= 1],
    ["📚", "Lecteur assidu", "Terminer 3 livres", read.size >= 3],
    ["🏛", "Grand lecteur", "Terminer 6 livres", read.size >= 6],
    ["👑", "Bibliothèque complète", `Terminer les ${BOOKS.length} livres`, read.size >= BOOKS.length],
    ["🔥", "Régulier", "Lire 3 jours de suite", ms >= 3],
    ["⚡", "Une semaine", "Lire 7 jours de suite", ms >= 7],
    ["🌟", "Un mois", "Lire 30 jours de suite", ms >= 30],
    ["⏱", "Première heure", "Cumuler 1 heure de lecture", totalT >= 3600],
    ["⌛", "Dix heures", "Cumuler 10 heures de lecture", totalT >= 36000],
    ["🖍", "Surligneur", "Surligner un premier passage", hl.length >= 1],
    ["✍", "Annotateur", "Écrire 10 notes", notes >= 10],
    ["✅", "Quiz réussi", "Réussir un premier quiz", passed >= 1],
    ["🎯", "Sans faute", "Obtenir 8 sur 8 à un quiz", perfect],
    ["🧠", "Expert", "Réussir 5 quiz", passed >= 5],
    ["🔁", "Mémoire durable", "Réviser 50 cartes", rv >= 50],
    ["🎓", "Diplômé", "Terminer un parcours guidé", paths >= 1]
  ];
}

/* Certificat */
let certPath = null;
function askCert(pid) { certPath = PATHS.find(p => p.id === pid); $("certName").value = ext.name || ""; $("certSheet").hidden = false; setTimeout(() => $("certName").focus(), 50); }
function makeCert() {
  const name = $("certName").value.trim(); if (!name) { $("certName").focus(); return; }
  ext.name = name; saveExt();
  const W = 1600, H = 1130, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  g.fillStyle = "#f6f1e3"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#2c5a4c"; g.lineWidth = 14; g.strokeRect(40, 40, W - 80, H - 80);
  g.strokeStyle = "#9a6a1f"; g.lineWidth = 2; g.strokeRect(70, 70, W - 140, H - 140);
  g.textAlign = "center"; g.fillStyle = "#9a6a1f"; g.font = "500 26px 'IBM Plex Mono', monospace"; g.fillText("BIBLIOTHÈQUE DU MANAGER", W / 2, 190);
  g.fillStyle = "#1c2420"; g.font = "72px 'Young Serif', Georgia, serif"; g.fillText("Certificat de parcours", W / 2, 300);
  g.font = "30px 'Source Serif 4', Georgia, serif"; g.fillStyle = "#5d6a63"; g.fillText("décerné à", W / 2, 380);
  g.fillStyle = "#2c5a4c"; g.font = "64px 'Young Serif', Georgia, serif"; g.fillText(name.slice(0, 40), W / 2, 470);
  g.fillStyle = "#1c2420"; g.font = "32px 'Source Serif 4', Georgia, serif"; g.fillText("pour avoir lu les livres et réussi les quiz du parcours", W / 2, 560);
  g.font = "italic 44px 'Source Serif 4', Georgia, serif"; g.fillText("« " + certPath.t + " »", W / 2, 630);
  g.font = "24px 'IBM Plex Mono', monospace"; g.fillStyle = "#5d6a63";
  certPath.books.forEach((id, k) => { const b = BOOKS.find(x => x.id === id); g.fillText(b.t + " — " + b.a, W / 2, 720 + k * 40); });
  const d = new Date(); g.fillStyle = "#1c2420"; g.font = "26px 'Source Serif 4', Georgia, serif"; g.fillText("Le " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(), W / 2, 960);
  g.beginPath(); g.arc(W - 230, H - 230, 70, 0, Math.PI * 2); g.fillStyle = "#2c5a4c"; g.fill(); g.fillStyle = "#f6f1e3"; g.font = "54px serif"; g.fillText("✓", W - 230, H - 210);
  cv.toBlob(blob => { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "certificat-" + certPath.id + ".png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000); }, "image/png");
  $("certSheet").hidden = true;
}

/* Vue « Apprendre » */
function renderLearn() {
  const { due, fresh, all } = dueCards(), el = eligibleBooks();
  const revTxt = all.length ? `${due.length ? due.length + " carte" + (due.length > 1 ? "s" : "") + " à revoir" : ""}${due.length && fresh.length ? " et " : ""}${fresh.length ? fresh.length + " nouvelle" + (fresh.length > 1 ? "s" : "") : ""} aujourd'hui.` : el.size ? "Rien à réviser aujourd'hui. Revenez demain : les cartes reviennent au bon moment pour s'ancrer dans la mémoire." : "Commencez un livre : ses cartes de révision apparaîtront ici dès que vous en aurez lu 10 %.";
  const quizRows = BOOKS.map(b => { const r = ext.quiz[b.id]; return `<div class="drow">${coverSVG(b)}<div><div class="t">${esc(b.t)}</div><div class="s"><span>${r ? `Meilleur score ${r.best} / ${r.n}${quizPassed(b.id) ? " · réussi ✓" : ""}` : "Pas encore fait"}</span></div></div><button class="btn${r ? "" : " primary"}" type="button" data-quiz="${b.id}">${r ? "Refaire" : "Commencer"}</button></div>`; }).join("");
  const pathCards = PATHS.map(p => {
    const st = pathState(p), next = p.books.find(id => !read.has(id) || !quizPassed(id));
    return `<article class="pathcard"><div class="ph"><h3></h3><span class="pp">${st.done} / ${st.total}</span></div><p class="pd"></p><div class="gbar"><i style="width:${st.done / st.total * 100}%"></i></div>
      <ol class="pbooks">${p.books.map(id => { const b = BOOKS.find(x => x.id === id), ok = read.has(id) && quizPassed(id); return `<li class="${ok ? "ok" : ""}"><button type="button" data-b="${id}">${coverSVG(b)}<span>${esc(b.t)}</span><em>${ok ? "✓ terminé" : read.has(id) ? "quiz à réussir" : "à lire"}</em></button></li>`; }).join("")}</ol>
      <div class="qzacts">${st.complete ? `<button class="btn primary" type="button" data-cert="${p.id}">Obtenir mon certificat</button>` : `<button class="btn primary" type="button" data-b="${next}">${st.done ? "Continuer" : "Commencer"} le parcours</button>`}</div></article>`;
  }).join("");
  const badges = badgeList(), got = badges.filter(x => x[3]).length;
  $("learnBody").innerHTML = `
    <section class="dsec"><h2 class="sectitle">Révision du jour</h2><div class="goalbox revbox"><div class="goalrow"><strong>${all.length ? all.length + " carte" + (all.length > 1 ? "s" : "") : "À jour"}</strong>${all.length ? `<button class="btn primary" type="button" id="startRev">Commencer la révision</button>` : ""}</div><span class="dempty" style="font-style:normal;font-size:14.5px">${revTxt} Chaque carte reprend une idée clé : plus vous la connaissez, plus elle revient tard.</span></div></section>
    <section class="dsec"><h2 class="sectitle">Parcours guidés</h2><div class="paths">${pathCards}</div></section>
    <section class="dsec"><h2 class="sectitle">Badges · ${got} sur ${badges.length}</h2><div class="badges">${badges.map(x => `<div class="badge${x[3] ? " on" : ""}" title="${esc(x[2])}"><span class="bi" aria-hidden="true">${x[0]}</span><strong>${esc(x[1])}</strong><span>${esc(x[2])}</span></div>`).join("")}</div></section>
    <section class="dsec"><h2 class="sectitle">Quiz par livre</h2><div class="dlist">${quizRows}</div></section>`;
  $("learnBody").querySelectorAll(".pathcard").forEach((c, k) => { c.querySelector("h3").textContent = PATHS[k].t; c.querySelector(".pd").textContent = PATHS[k].d; });
  const sr = $("startRev"); if (sr) sr.onclick = openReview;
}
document.addEventListener("click", e => {
  const qz = e.target.closest("[data-quiz]"); if (qz) { openQuiz(qz.dataset.quiz); return; }
  const ct = e.target.closest("[data-cert]"); if (ct) askCert(ct.dataset.cert);
});
$("qzClose").onclick = closeQuiz; $("rvClose").onclick = closeReview;
$("certGo").onclick = makeCert; $("certCancel").onclick = () => $("certSheet").hidden = true;
$("certName").addEventListener("keydown", e => { if (e.key === "Enter") makeCert(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!$("quizOv").hidden) closeQuiz(); else if (!$("revOv").hidden) closeReview(); else if (!$("certSheet").hidden) $("certSheet").hidden = true;
});

