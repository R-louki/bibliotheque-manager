/* ---------- Étape 3 : communauté ---------- */
let myProfile = null, isAdmin = false, ratingCache = {}, nameResolve = null;
const fmtStars = n => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
async function loadMe() {
  if (!sb || !session) return;
  try {
    const { data } = await sb.from("profiles").select("display_name").eq("id", session.user.id).maybeSingle(); myProfile = data || null;
    const a = await sb.rpc("is_admin"); isAdmin = !!a.data; $("adminBtn").hidden = !isAdmin;
  } catch (e) {}
  loadRatings(); checkPendingJoin();
}
async function loadRatings() {
  if (!sb || !session) return;
  const { data, error } = await sb.from("reviews").select("book_id,rating"); if (error || !data) return;
  const agg = {}; data.forEach(r => { const a = agg[r.book_id] || (agg[r.book_id] = { s: 0, n: 0 }); a.s += r.rating; a.n++; });
  ratingCache = {}; Object.entries(agg).forEach(([k, a]) => ratingCache[k] = { avg: a.s / a.n, n: a.n });
  syncHome(); if (curBook) renderBookRating();
}
function ratingTxt(id) { const r = ratingCache[id]; return r ? "★ " + r.avg.toFixed(1).replace(".", ",") + " (" + r.n + ")" : ""; }
function renderBookRating() { const el = $("bkRating"); if (!el || !curBook) return; const t = ratingTxt(curBook.id); el.textContent = t; el.hidden = !t; }
function needName() {
  if (myProfile) return Promise.resolve(true);
  return new Promise(res => { nameResolve = res; $("nameInput").value = ext.name || ""; $("nameMsg").hidden = true; $("nameSheet").hidden = false; setTimeout(() => $("nameInput").focus(), 50); });
}
async function saveName() {
  const v = $("nameInput").value.trim();
  if (v.length < 2) { $("nameMsg").textContent = "Saisissez au moins 2 caractères."; $("nameMsg").hidden = false; return; }
  const { error } = await sb.from("profiles").upsert({ id: session.user.id, display_name: v.slice(0, 40) });
  if (error) { $("nameMsg").textContent = "Enregistrement impossible. Vérifiez votre connexion et réessayez."; $("nameMsg").hidden = false; return; }
  myProfile = { display_name: v.slice(0, 40) }; $("nameSheet").hidden = true; if (nameResolve) { nameResolve(true); nameResolve = null; }
}
$("nameSave").onclick = saveName; $("nameInput").addEventListener("keydown", e => { if (e.key === "Enter") saveName(); });
$("nameCancel").onclick = () => { $("nameSheet").hidden = true; if (nameResolve) { nameResolve(false); nameResolve = null; } };
async function namesFor(ids) {
  const u = [...new Set(ids)]; if (!u.length) return {};
  const { data } = await sb.from("profiles").select("id,display_name").in("id", u);
  const m = {}; (data || []).forEach(p => m[p.id] = p.display_name); return m;
}
function confirmBtn(btn, label, action) {
  if (btn.dataset.armed) { action(); return; }
  btn.dataset.armed = "1"; const old = btn.textContent; btn.textContent = label;
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = old; } }, 4000);
}

/* Avis sur un livre */
let myStars = 0;
async function renderReviews() {
  const box = $("reviews"); if (!box || !curBook) return;
  if (!sb || !session) { box.hidden = true; return; }
  const bid = curBook.id; box.hidden = false;
  box.innerHTML = `<h2 class="sectitle">Avis des lecteurs</h2><p class="dempty">Chargement des avis…</p>`;
  const { data, error } = await sb.from("reviews").select("id,user_id,rating,body,created_at,updated_at").eq("book_id", bid).order("updated_at", { ascending: false }).limit(100);
  if (!curBook || curBook.id !== bid) return;
  if (error) { box.innerHTML = `<h2 class="sectitle">Avis des lecteurs</h2><p class="dempty">Les avis ne peuvent pas être chargés pour le moment. Ils s'afficheront au retour de la connexion.</p>`; return; }
  const names = await namesFor(data.map(r => r.user_id));
  const mine = data.find(r => r.user_id === session.user.id), others = data.filter(r => r !== mine);
  const avg = data.length ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0;
  myStars = mine ? mine.rating : 0;
  box.innerHTML = `<div class="rvhead"><h2 class="sectitle">Avis des lecteurs</h2>${data.length ? `<span class="rvavg"><b>${avg.toFixed(1).replace(".", ",")}</b> ${fmtStars(Math.round(avg))} · ${data.length} avis</span>` : ""}</div>
    <div class="rvform"><span class="lbl">${mine ? "Votre avis" : "Donnez votre avis"}</span>
      <div class="stars" role="radiogroup" aria-label="Votre note">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="${n === myStars}" aria-label="${n} sur 5" data-star="${n}">${n <= myStars ? "★" : "☆"}</button>`).join("")}</div>
      <label for="rvText" hidden>Votre avis</label><textarea id="rvText" rows="3" maxlength="1500" placeholder="Ce que ce livre vous a apporté, à qui vous le conseillez…"></textarea>
      <div class="qzacts" style="justify-content:flex-start"><button class="btn primary" type="button" id="rvPost">${mine ? "Mettre à jour" : "Publier mon avis"}</button>${mine ? `<button class="linkish" type="button" id="rvDel">Supprimer mon avis</button>` : ""}<span class="rvmsg" id="rvMsg" role="status"></span></div></div>
    <div class="rvlist">${others.length ? others.map(r => `<article class="rvitem" data-rid="${r.id}"><div class="rvtop"><strong></strong><span class="rvst">${fmtStars(r.rating)}</span><span class="rvdate">${fmtDate(r.updated_at)}</span>${isAdmin ? `<button class="linkish" type="button" data-moddel="${r.id}">Supprimer (modération)</button>` : ""}</div><p></p></article>`).join("") : `<p class="dempty">${mine ? "Vous êtes le premier à donner votre avis." : "Aucun avis pour l'instant. Soyez le premier !"}</p>`}</div>`;
  $("rvText").value = mine ? mine.body : "";
  box.querySelectorAll(".rvitem").forEach((el, k) => { el.querySelector("strong").textContent = names[others[k].user_id] || "Lecteur"; el.querySelector("p").textContent = others[k].body; if (!others[k].body) el.querySelector("p").remove(); });
  box.querySelectorAll("[data-star]").forEach(b => b.onclick = () => { myStars = +b.dataset.star; box.querySelectorAll("[data-star]").forEach(x => { const n = +x.dataset.star; x.textContent = n <= myStars ? "★" : "☆"; x.setAttribute("aria-checked", n === myStars); }); });
  $("rvPost").onclick = async () => {
    if (!myStars) { $("rvMsg").textContent = "Choisissez une note de 1 à 5 étoiles."; return; }
    if (!(await needName())) return;
    $("rvPost").disabled = true;
    const { error } = await sb.from("reviews").upsert({ book_id: bid, user_id: session.user.id, rating: myStars, body: $("rvText").value.trim().slice(0, 1500), updated_at: new Date().toISOString() }, { onConflict: "book_id,user_id" });
    $("rvPost").disabled = false;
    if (error) { $("rvMsg").textContent = "Publication impossible. Vérifiez votre connexion et réessayez."; return; }
    loadRatings(); renderReviews();
  };
  const del = $("rvDel"); if (del) del.onclick = () => confirmBtn(del, "Confirmer la suppression", async () => { await sb.from("reviews").delete().eq("id", mine.id); loadRatings(); renderReviews(); });
  box.querySelectorAll("[data-moddel]").forEach(b => b.onclick = () => confirmBtn(b, "Confirmer", async () => { await sb.from("reviews").delete().eq("id", b.dataset.moddel); loadRatings(); renderReviews(); }));
}

/* Clubs de lecture */
let myClubs = [], CLUB = null, clubTimer = null;
const clubLink = code => location.origin + location.pathname + "#rejoindre-" + code;
async function loadClubs() {
  if (!sb || !session) { myClubs = []; return; }
  const { data } = await sb.from("clubs").select("id,name,description,book_id,owner_id,invite_code,created_at").order("created_at", { ascending: false });
  myClubs = data || [];
}
function clubsSection() {
  if (!sb || !session) return "";
  return `<section class="dsec"><h2 class="sectitle">Clubs de lecture</h2><div class="dlist" id="clubList">${myClubs.length ? myClubs.map(c => { const b = BOOKS.find(x => x.id === c.book_id); return b ? `<div class="drow">${coverSVG(b)}<div><div class="t"></div><div class="s"><span>${esc(b.t)}</span></div></div><button class="btn primary" type="button" data-club="${c.id}">Ouvrir</button></div>` : ""; }).join("") : `<p class="dempty">Lisez un livre à plusieurs : créez un club, partagez le lien d'invitation, suivez la progression de chacun et échangez dans la discussion.</p>`}</div><div class="qzacts" style="justify-content:flex-start;margin-top:10px"><button class="btn primary" type="button" id="clubNew">Créer un club</button></div></section>`;
}
function fillClubNames() { const list = $("clubList"); if (!list) return; list.querySelectorAll(".drow").forEach((r, k) => { const c = myClubs.filter(x => BOOKS.some(b => b.id === x.book_id))[k]; if (c) r.querySelector(".t").textContent = c.name; }); }
function openClubForm() {
  $("clubBook").innerHTML = BOOKS.map(b => `<option value="${b.id}"${curBook && curBook.id === b.id ? " selected" : ""}>${esc(b.t)}</option>`).join("");
  $("clubName").value = ""; $("clubDesc").value = ""; $("clubMsg").hidden = true; $("clubSheet").hidden = false; setTimeout(() => $("clubName").focus(), 50);
}
async function createClub() {
  const name = $("clubName").value.trim(); if (name.length < 2) { $("clubMsg").textContent = "Donnez un nom au club (2 caractères minimum)."; $("clubMsg").hidden = false; return; }
  if (!(await needName())) return;
  const { data, error } = await sb.from("clubs").insert({ name: name.slice(0, 60), description: $("clubDesc").value.trim().slice(0, 400), book_id: $("clubBook").value }).select().single();
  if (error) { $("clubMsg").textContent = "Création impossible. Vérifiez votre connexion et réessayez."; $("clubMsg").hidden = false; return; }
  $("clubSheet").hidden = true; await loadClubs(); if (!$("learn").hidden) renderLearn(); openClub(data.id);
}
async function openClub(id) {
  if (!myClubs.some(c => c.id === id)) await loadClubs();
  CLUB = myClubs.find(c => c.id === id); if (!CLUB) return;
  $("clubOv").hidden = false; document.body.style.overflow = "hidden"; $("clubTitle").textContent = CLUB.name;
  const b = BOOKS.find(x => x.id === CLUB.book_id), owner = CLUB.owner_id === session.user.id;
  $("clubBody").innerHTML = `<div class="clubtop">${coverSVG(b)}<div><span class="lbl">Livre du club</span><strong></strong><p class="cdesc"></p><div class="qzacts" style="justify-content:flex-start"><button class="btn primary" type="button" data-clubbook="${b.id}">Lire le livre</button></div></div></div>
    <section><h2 class="sectitle">Inviter</h2><div class="invite"><input id="clubLinkInput" readonly aria-label="Lien d'invitation"><button class="btn" type="button" id="clubCopy">Copier le lien</button></div><p class="dempty" style="font-style:normal;font-size:14px">Envoyez ce lien : la personne crée son compte, puis rejoint le club en un clic.</p></section>
    <section><h2 class="sectitle">Progression des membres</h2><div class="dlist" id="clubProg"><p class="dempty">Chargement…</p></div></section>
    <section><h2 class="sectitle">Discussion</h2><div class="chat" id="clubChat"></div><div class="chatin"><label for="clubMsgIn" hidden>Message</label><textarea id="clubMsgIn" rows="2" maxlength="1000" placeholder="Votre message au club…"></textarea><button class="btn primary" type="button" id="clubSend">Envoyer</button></div></section>
    <div class="qzacts" style="justify-content:flex-start">${owner ? `<button class="linkish" type="button" id="clubDel">Supprimer le club</button>` : `<button class="linkish" type="button" id="clubLeave">Quitter le club</button>`}</div>`;
  $("clubBody").querySelector(".clubtop strong").textContent = b.t; $("clubBody").querySelector(".cdesc").textContent = CLUB.description || "";
  $("clubLinkInput").value = clubLink(CLUB.invite_code);
  $("clubCopy").onclick = async () => { try { await navigator.clipboard.writeText($("clubLinkInput").value); $("clubCopy").textContent = "Lien copié"; } catch (e) { $("clubLinkInput").select(); $("clubCopy").textContent = "Sélectionné"; } setTimeout(() => { const c = $("clubCopy"); if (c) c.textContent = "Copier le lien"; }, 2000); };
  $("clubSend").onclick = sendClubMsg; $("clubMsgIn").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendClubMsg(); } });
  const del = $("clubDel"); if (del) del.onclick = () => confirmBtn(del, "Confirmer : supprimer définitivement", async () => { await sb.from("clubs").delete().eq("id", CLUB.id); closeClub(); await loadClubs(); renderLearn(); });
  const lv = $("clubLeave"); if (lv) lv.onclick = () => confirmBtn(lv, "Confirmer : quitter le club", async () => { await sb.from("club_members").delete().eq("club_id", CLUB.id).eq("user_id", session.user.id); closeClub(); await loadClubs(); renderLearn(); });
  refreshClub(); clearInterval(clubTimer); clubTimer = setInterval(() => { if (document.visibilityState === "visible") refreshClub(true); }, 15000);
}
async function refreshClub(quiet) {
  if (!CLUB) return; const cid = CLUB.id;
  const [pr, ms] = await Promise.all([sb.rpc("club_progress", { c: cid }), sb.from("club_messages").select("id,user_id,body,created_at").eq("club_id", cid).order("created_at", { ascending: true }).limit(200)]);
  if (!CLUB || CLUB.id !== cid) return;
  const prog = $("clubProg");
  if (pr.data) prog.innerHTML = pr.data.sort((a, b) => (b.is_read - a.is_read) || (b.pct - a.pct)).map(m => `<div class="mrow"><span class="mn"></span><span class="mini"><i style="width:${m.is_read ? 100 : m.pct}%"></i></span><span class="mp">${m.is_read ? "✓ terminé" : m.pct + " %"}</span></div>`).join("");
  if (pr.data) prog.querySelectorAll(".mn").forEach((el, k) => el.textContent = pr.data[k].display_name + (pr.data[k].user_id === session.user.id ? " (vous)" : ""));
  const chat = $("clubChat"); if (!ms.data) return;
  const names = await namesFor(ms.data.map(m => m.user_id));
  const atBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 40;
  chat.innerHTML = ms.data.length ? ms.data.map(m => `<div class="msg${m.user_id === session.user.id ? " me" : ""}"><span class="mw"></span><p></p><span class="mt">${fmtDate(m.created_at)} · ${new Date(m.created_at).toTimeString().slice(0, 5)}</span></div>`).join("") : `<p class="dempty">Aucun message. Lancez la discussion : une idée qui vous a marqué, une question pour le groupe…</p>`;
  chat.querySelectorAll(".msg").forEach((el, k) => { el.querySelector(".mw").textContent = names[ms.data[k].user_id] || "Lecteur"; el.querySelector("p").textContent = ms.data[k].body; });
  if (!quiet || atBottom) chat.scrollTop = chat.scrollHeight;
}
async function sendClubMsg() {
  const t = $("clubMsgIn").value.trim(); if (!t || !CLUB) return;
  if (!(await needName())) return;
  $("clubSend").disabled = true;
  const { error } = await sb.from("club_messages").insert({ club_id: CLUB.id, body: t.slice(0, 1000) });
  $("clubSend").disabled = false;
  if (!error) { $("clubMsgIn").value = ""; refreshClub(); }
}
function closeClub() { $("clubOv").hidden = true; document.body.style.overflow = ""; CLUB = null; clearInterval(clubTimer); }
$("clubClose").onclick = closeClub;
$("clubCreate").onclick = createClub; $("clubCancel").onclick = () => $("clubSheet").hidden = true;
document.addEventListener("click", e => {
  const c = e.target.closest("[data-club]"); if (c) { openClub(c.dataset.club); return; }
  const cb = e.target.closest("[data-clubbook]"); if (cb) { closeClub(); openBook(cb.dataset.clubbook); return; }
  if (e.target.id === "clubNew") openClubForm();
});
/* Rejoindre par lien d'invitation */
const JOINK = "biblio-manager-join";
(function captureJoin() { const m = /^#rejoindre-([a-z0-9]{6,20})$/i.exec(location.hash); if (m) { try { sessionStorage.setItem(JOINK, m[1]); } catch (e) {} try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} } })();
async function checkPendingJoin() {
  let code = null; try { code = sessionStorage.getItem(JOINK); } catch (e) {} if (!code || !sb || !session) return;
  const { data } = await sb.rpc("club_preview", { code });
  const pv = data && data[0]; if (!pv) { try { sessionStorage.removeItem(JOINK); } catch (e) {} openInfo("Invitation introuvable", "Ce lien d'invitation n'est plus valide. Demandez un nouveau lien à la personne qui vous a invité."); return; }
  const b = BOOKS.find(x => x.id === pv.book_id);
  $("joinText").textContent = `Le club « ${pv.name} » lit ${b ? "« " + b.t + " »" : "un livre de la bibliothèque"} et compte ${pv.members} membre${pv.members > 1 ? "s" : ""}.`;
  $("joinSheet").hidden = false;
  $("joinGo").onclick = async () => {
    if (!(await needName())) return;
    const r = await sb.rpc("join_club", { code }); try { sessionStorage.removeItem(JOINK); } catch (e) {}
    $("joinSheet").hidden = true;
    if (r.error) { openInfo("Impossible de rejoindre", /full/.test(r.error.message) ? "Ce club a atteint 50 membres." : "Le club n'a pas pu être rejoint. Réessayez plus tard."); return; }
    await loadClubs(); openClub(r.data);
  };
  $("joinNo").onclick = () => { try { sessionStorage.removeItem(JOINK); } catch (e) {} $("joinSheet").hidden = true; };
}

/* Espace administrateur */
async function renderAdmin() {
  const box = $("adminBody"); box.innerHTML = `<p class="dempty">Chargement des statistiques…</p>`;
  const { data, error } = await sb.rpc("admin_stats");
  if (error || !data) { box.innerHTML = `<p class="dempty">Statistiques indisponibles. Cet espace est réservé aux administrateurs.</p>`; return; }
  const rows = BOOKS.map(b => ({ b, st: (data.books || {})[b.id] || { read: 0, started: 0 }, rt: (data.ratings || {})[b.id] })).sort((x, y) => y.st.started - x.st.started);
  const { data: last } = await sb.from("reviews").select("id,book_id,user_id,rating,body,updated_at").order("updated_at", { ascending: false }).limit(20);
  const names = await namesFor((last || []).map(r => r.user_id));
  box.innerHTML = `<div class="tiles">
      <div class="tile"><span class="v">${data.users}</span><span class="k">Inscrits</span></div>
      <div class="tile"><span class="v">${data.new_7d}</span><span class="k">Nouveaux (7 j)</span></div>
      <div class="tile"><span class="v">${data.active_7d}</span><span class="k">Actifs (7 j)</span></div>
      <div class="tile"><span class="v">${data.active_30d}</span><span class="k">Actifs (30 j)</span></div>
      <div class="tile"><span class="v">${data.reviews}</span><span class="k">Avis</span></div>
      <div class="tile"><span class="v">${data.clubs}</span><span class="k">Clubs</span></div></div>
    <section class="dsec"><h2 class="sectitle">Lectures par livre</h2><div class="tblwrap"><table class="tbl"><thead><tr><th>Livre</th><th>Commencé</th><th>Terminé</th><th>Note</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.b.t)}</td><td>${r.st.started}</td><td>${r.st.read}</td><td>${r.rt ? String(r.rt.avg).replace(".", ",") + " (" + r.rt.n + ")" : "–"}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="dsec"><h2 class="sectitle">Derniers avis · modération</h2><div class="rvlist">${(last || []).length ? last.map(r => `<article class="rvitem"><div class="rvtop"><strong></strong><span class="rvst">${fmtStars(r.rating)}</span><span class="rvdate"></span><button class="linkish" type="button" data-admdel="${r.id}">Supprimer</button></div><p></p></article>`).join("") : `<p class="dempty">Aucun avis publié.</p>`}</div></section>
    <p class="dempty" style="font-style:normal;font-size:14px">Les nouveaux livres s'ajoutent en me demandant de rédiger leur fiche : le site est mis à jour automatiquement.</p>`;
  box.querySelectorAll(".rvitem").forEach((el, k) => { const r = last[k], b = BOOKS.find(x => x.id === r.book_id); el.querySelector("strong").textContent = names[r.user_id] || "Lecteur"; el.querySelector(".rvdate").textContent = (b ? b.t + " · " : "") + fmtDate(r.updated_at); el.querySelector("p").textContent = r.body || ""; });
  box.querySelectorAll("[data-admdel]").forEach(b => b.onclick = () => confirmBtn(b, "Confirmer", async () => { await sb.from("reviews").delete().eq("id", b.dataset.admdel); renderAdmin(); loadRatings(); }));
}
$("adminBtn").onclick = () => { $("acctSheet").hidden = true; if (curBook) goHome(); showView("admin"); };

