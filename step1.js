/* ---------- Données étendues : notes, statistiques, objectif, réglages ---------- */
const EXTK = "biblio-manager-ext";
function normExt(e) {
  e = e && typeof e === "object" ? e : {};
  const st = e.stats && typeof e.stats === "object" ? e.stats : {};
  return { readAt: e.readAt || {}, hl: e.hl || {}, stats: { days: st.days || {}, books: st.books || {} }, goal: Math.max(1, +e.goal || 2), prefs: e.prefs || {} };
}
let ext = normExt(loadJSON(EXTK));
function saveExt(sync) { saveJSON(EXTK, ext); if (sync !== false) onLocalChange(); }
const dayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/* ---------- Vues ---------- */
const VIEWS = ["home", "dash", "notebook", "book"];
function showView(v) {
  VIEWS.forEach(x => $(x).hidden = x !== v);
  $("appnav").hidden = v === "book";
  document.querySelectorAll("#appnav .tabs [data-view]").forEach(a => a.setAttribute("aria-current", a.dataset.view === v ? "page" : "false"));
  if (v === "dash") renderDash();
  if (v === "notebook") renderNotebook();
  if (v !== "book") { try { history.replaceState(null, "", v === "home" ? location.pathname + location.search : "#" + (v === "dash" ? "parcours" : "carnet")); } catch (e) {} }
  window.scrollTo(0, 0);
}

/* ---------- Couvertures générées ---------- */
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const COVER_CACHE = {};
function coverSVG(b) {
  if (COVER_CACHE[b.id]) return COVER_CACHE[b.id];
  const h = hashStr(b.id), r = rng(h), m = h % 4;
  let art = "";
  if (m === 0) { const cx = 40 + r() * 120, cy = 150 + r() * 90; for (let k = 1; k <= 9; k++) art += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${k * 16}"/>`; }
  else if (m === 1) { for (let k = -12; k < 22; k++) art += `<line x1="${k * 18}" y1="300" x2="${k * 18 + 180}" y2="120"/>`; }
  else if (m === 2) { for (let k = 0; k < 7; k++) art += `<path d="M${-20 + k * 36} 300 a ${30 + k * 6} ${30 + k * 6} 0 0 1 ${60 + k * 12} 0"/>`; }
  else { for (let y = 150; y < 285; y += 18) for (let x = 24; x < 190; x += 18) art += r() > 0.7 ? `<circle cx="${x}" cy="${y}" r="5" fill="#fff" fill-opacity=".28" stroke="none"/>` : `<circle cx="${x}" cy="${y}" r="2.2"/>`; }
  const lines = wrapText(b.t, 15).slice(0, 4), fs = lines.length > 2 ? 19 : 22;
  const title = lines.map((l, k) => `<text x="24" y="${52 + k * (fs + 5)}" font-size="${fs}">${esc(l)}</text>`).join("");
  const auth = esc(b.a.length > 26 ? b.a.slice(0, 25) + "…" : b.a);
  const svg = `<svg class="cover" viewBox="0 0 200 300" role="img" aria-label="Couverture : ${esc(b.t)}"><rect width="200" height="300" fill="var(${b.c})"/><g fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2">${art}</g><rect x="0" y="0" width="7" height="300" fill="#000" fill-opacity=".14"/><g fill="#fff" font-family="Young Serif, Georgia, serif">${title}</g><text x="24" y="276" fill="#fff" fill-opacity=".85" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="11" letter-spacing=".5">${auth.toUpperCase()}</text></svg>`;
  return COVER_CACHE[b.id] = svg;
}

/* ---------- Réglages de lecture ---------- */
function applyPrefs() {
  const pr = ext.prefs || {}, root = document.documentElement;
  root.style.setProperty("--read-size", (+pr.size || 17) + "px");
  root.style.setProperty("--measure", (+pr.width || 66) + "ch");
  if (pr.theme && pr.theme !== "auto") root.setAttribute("data-theme", pr.theme); else root.removeAttribute("data-theme");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue("--paper").trim() || "#f4f5f0";
  const cur = { size: String(+pr.size || 17), theme: pr.theme || "auto", width: String(+pr.width || 66) };
  document.querySelectorAll("#prefs .seg").forEach(seg => seg.querySelectorAll("button").forEach(btn => btn.setAttribute("aria-pressed", btn.dataset.v === cur[seg.dataset.pref])));
  TTS.rate = +pr.rate || 1; const pl = $("plRate"); if (pl) pl.textContent = TTS.rate.toString().replace(".", ",") + "×";
}
$("prefBtn").onclick = () => { const open = $("prefs").hidden; $("prefs").hidden = !open; $("prefBtn").setAttribute("aria-pressed", String(open)); };
$("prefs").addEventListener("click", e => {
  const btn = e.target.closest("button[data-v]"); if (!btn) return;
  const key = btn.closest(".seg").dataset.pref;
  ext.prefs = Object.assign({}, ext.prefs, { [key]: key === "theme" ? btn.dataset.v : +btn.dataset.v });
  saveExt(); applyPrefs();
});
document.addEventListener("click", e => { if (!$("prefs").hidden && !e.target.closest("#prefs,#prefBtn")) { $("prefs").hidden = true; $("prefBtn").setAttribute("aria-pressed", "false"); } });

/* ---------- Surlignage et notes ---------- */
function wrapQuote(root, quote, id, hasNote) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest(".noderow,button") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const map = []; let s = "", prevSpace = true, lastBlock = null, n;
  while ((n = tw.nextNode())) {
    const blk = n.parentElement.closest("p,li,h3,.kw,.callout > b");
    if (blk !== lastBlock) { if (!prevSpace) { s += " "; map.push(null); prevSpace = true; } lastBlock = blk; }
    const t = n.nodeValue;
    for (let i = 0; i < t.length; i++) {
      if (/\s/.test(t[i])) { if (prevSpace) continue; s += " "; map.push([n, i]); prevSpace = true; }
      else { s += t[i]; map.push([n, i]); prevSpace = false; }
    }
  }
  const q = quote.replace(/\s+/g, " ").trim(); const at = s.indexOf(q); if (at < 0 || !q) return false;
  const segs = new Map();
  for (let k = at; k < at + q.length; k++) { const e = map[k]; if (!e) continue; const g = segs.get(e[0]) || [e[1], e[1]]; g[0] = Math.min(g[0], e[1]); g[1] = Math.max(g[1], e[1]); segs.set(e[0], g); }
  segs.forEach(([a, b], node) => {
    let mid = node; if (a > 0) mid = node.splitText(a);
    const len = b - a + 1; if (len < mid.nodeValue.length) mid.splitText(len);
    if (!mid.nodeValue.trim()) return;
    const mk = document.createElement("mark"); mk.className = "hl" + (hasNote ? " has-note" : ""); mk.dataset.hl = id;
    mid.parentNode.insertBefore(mk, mid); mk.appendChild(mid);
  });
  return true;
}
function refreshNodeHl(nodeId) {
  const el = $(nodeId); if (!el || !curBook) return;
  el.querySelectorAll("mark.hl").forEach(m => m.replaceWith(...m.childNodes)); el.normalize();
  const list = (ext.hl[curBook.id] || []).filter(h => h.n === nodeId);
  list.forEach(h => wrapQuote(el, h.x, h.id, !!h.note));
  const c = el.querySelector(".hlcount"); if (c) c.textContent = list.length ? `✎ ${list.length} surlignage${list.length > 1 ? "s" : ""}` : "";
}
function refreshAllHl() { if (!curBook) return; document.querySelectorAll("#reading .node").forEach(n => refreshNodeHl(n.id)); }
let selPending = null, selTimer = null, selHideTimer = null;
document.addEventListener("selectionchange", () => { clearTimeout(selTimer); selTimer = setTimeout(checkSel, 150); });
function nodeOf(x) { return x ? (x.nodeType === 1 ? x : x.parentElement).closest("#reading .node") : null; }
function checkSel() {
  const s = getSelection();
  if (!curBook || $("book").hidden || !s || s.isCollapsed || !s.rangeCount) return hideSel();
  const r = s.getRangeAt(0), a = nodeOf(r.startContainer), b = nodeOf(r.endContainer);
  if (!a || a !== b) return hideSel();
  const text = s.toString().replace(/\s+/g, " ").trim();
  if (text.length < 3 || text.length > 900) return hideSel();
  clearTimeout(selHideTimer); selPending = { n: a.id, x: text }; $("selbar").hidden = false;
}
function hideSel() { clearTimeout(selHideTimer); selHideTimer = setTimeout(hideSelNow, 400); }
function hideSelNow() { $("selbar").hidden = true; selPending = null; }
function addHl(withNote) {
  if (!selPending || !curBook) return;
  const h = { id: Math.random().toString(36).slice(2, 10), n: selPending.n, x: selPending.x, note: "", t: Date.now() };
  (ext.hl[curBook.id] = ext.hl[curBook.id] || []).push(h); saveExt();
  try { getSelection().removeAllRanges(); } catch (e) {}
  hideSelNow(); refreshNodeHl(h.n);
  if (withNote) openNote(curBook.id, h.id);
}
["selHl", "selNote"].forEach(id => {
  const btn = $(id); let done = false;
  btn.addEventListener("pointerdown", e => { e.preventDefault(); done = true; addHl(id === "selNote"); setTimeout(() => done = false, 400); });
  btn.addEventListener("click", () => { if (!done) addHl(id === "selNote"); });
});
let noteCtx = null;
function openNote(bid, hid) {
  const h = (ext.hl[bid] || []).find(x => x.id === hid); if (!h) return;
  noteCtx = { bid, hid };
  const b = BOOKS.find(x => x.id === bid);
  $("noteTitle").textContent = b ? b.t : "Ma note";
  $("noteQuote").textContent = h.x; $("noteText").value = h.note || "";
  $("noteSheet").hidden = false; setTimeout(() => $("noteText").focus(), 50);
}
function closeNote() { $("noteSheet").hidden = true; noteCtx = null; }
$("noteClose").onclick = closeNote;
$("noteSheet").addEventListener("click", e => { if (e.target.id === "noteSheet") closeNote(); });
$("noteSave").onclick = () => {
  if (!noteCtx) return; const h = (ext.hl[noteCtx.bid] || []).find(x => x.id === noteCtx.hid);
  if (h) { h.note = $("noteText").value.trim(); h.t = h.t || Date.now(); saveExt(); }
  const bid = noteCtx.bid; closeNote();
  if (curBook && curBook.id === bid && h) refreshNodeHl(h.n);
  if (!$("notebook").hidden) renderNotebook();
};
$("noteDel").onclick = () => {
  if (!noteCtx) return; const list = ext.hl[noteCtx.bid] || [], i = list.findIndex(x => x.id === noteCtx.hid);
  const h = list[i]; if (i >= 0) list.splice(i, 1); if (!list.length) delete ext.hl[noteCtx.bid]; saveExt();
  const bid = noteCtx.bid; closeNote();
  if (curBook && curBook.id === bid && h) refreshNodeHl(h.n);
  if (!$("notebook").hidden) renderNotebook();
};

/* ---------- Carnet ---------- */
let nbFilter = "all";
function fmtDate(t) { const d = new Date(t); return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
function renderNotebook() {
  const withHl = BOOKS.filter(b => (ext.hl[b.id] || []).length);
  const total = withHl.reduce((s, b) => s + ext.hl[b.id].length, 0);
  if (nbFilter !== "all" && !withHl.some(b => b.id === nbFilter)) nbFilter = "all";
  if (!total) { $("nbBody").innerHTML = `<p class="dempty">Aucun surlignage pour l'instant. Ouvrez une fiche, sélectionnez un passage avec le doigt ou la souris, puis touchez « Surligner ».</p>`; return; }
  const opts = `<option value="all">Tous les livres (${total})</option>` + withHl.map(b => `<option value="${b.id}"${nbFilter === b.id ? " selected" : ""}>${esc(b.t)} (${ext.hl[b.id].length})</option>`).join("");
  const groups = withHl.filter(b => nbFilter === "all" || b.id === nbFilter).map(b => {
    const items = [...ext.hl[b.id]].sort((x, y) => (y.t || 0) - (x.t || 0)).map(h => `<div class="nbitem"><blockquote></blockquote>${h.note ? `<p class="nbnote"></p>` : ""}<div class="nbmeta"><span>${esc(nodeTitle(b, h.n) || "")}${h.t ? " · " + fmtDate(h.t) : ""}</span><button class="linkish" type="button" data-go="${b.id}|${h.n}">Voir dans la fiche</button><button class="linkish" type="button" data-note="${b.id}|${h.id}">${h.note ? "Modifier la note" : "Ajouter une note"}</button></div></div>`).join("");
    return `<section class="nbgroup" data-bid="${b.id}"><h2>${coverSVG(b)}<span></span></h2>${items}</section>`;
  }).join("");
  $("nbBody").innerHTML = `<div class="nbtools"><label for="nbSel" hidden>Livre</label><select id="nbSel">${opts}</select><button class="btn" type="button" id="nbExport">Exporter mes notes (.txt)</button></div>${groups}`;
  $("nbBody").querySelectorAll(".nbgroup").forEach(g => {
    const b = BOOKS.find(x => x.id === g.dataset.bid); g.querySelector("h2 span").textContent = b.t;
    const list = [...ext.hl[b.id]].sort((x, y) => (y.t || 0) - (x.t || 0));
    g.querySelectorAll(".nbitem").forEach((it, k) => { it.querySelector("blockquote").textContent = "« " + list[k].x + " »"; const nn = it.querySelector(".nbnote"); if (nn) nn.textContent = list[k].note; });
  });
  $("nbSel").onchange = e => { nbFilter = e.target.value; renderNotebook(); };
  $("nbExport").onclick = exportNotes;
}
document.addEventListener("click", e => { const nb = e.target.closest("[data-note]"); if (nb) { const [bid, hid] = nb.dataset.note.split("|"); openNote(bid, hid); } });
function exportNotes() {
  let out = "Bibliothèque du Manager — mes surlignages et notes\nExporté le " + fmtDate(Date.now()) + "\n";
  BOOKS.forEach(b => {
    const list = ext.hl[b.id] || []; if (!list.length) return;
    out += "\n\n=== " + b.t + " (" + b.a + ") ===\n";
    list.forEach(h => { out += "\n• " + (nodeTitle(b, h.n) || "") + "\n  « " + h.x + " »\n" + (h.note ? "  Note : " + h.note + "\n" : ""); });
  });
  const url = URL.createObjectURL(new Blob([out], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "mes-notes-bibliotheque.txt"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- Lecture audio ---------- */
const TTS = { q: [], i: 0, on: false, rate: 1, voice: null, node: null };
const hasTTS = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
function pickVoice() { if (!hasTTS) return; const vs = speechSynthesis.getVoices(); TTS.voice = vs.find(v => /^fr[-_]FR/i.test(v.lang) && /google|natural|premium|enhanced/i.test(v.name)) || vs.find(v => /^fr[-_]FR/i.test(v.lang)) || vs.find(v => /^fr/i.test(v.lang)) || null; }
if (hasTTS) { $("ttsBtn").hidden = false; pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener("voiceschanged", pickVoice); }
function currentNodeId() { let cur = null; document.querySelectorAll("#reading .node").forEach(n => { if (n.getBoundingClientRect().top < 160) cur = n.id; }); return cur || (document.querySelector("#reading .node") || {}).id; }
function buildQueue(from) {
  const nodes = [...document.querySelectorAll("#reading .node")]; let st = nodes.findIndex(n => n.id === from); if (st < 0) st = 0;
  const q = [];
  nodes.slice(st).forEach(n => {
    q.push({ n: n.id, text: n.querySelector("h3").textContent + "." });
    n.querySelectorAll("p,li,.callout").forEach(el => {
      if (el.tagName === "P" && el.closest(".callout")) return;
      const lab = el.classList.contains("callout") ? el.querySelector("b") : null;
      q.push({ n: n.id, text: lab ? lab.textContent + ". " + el.textContent.slice(lab.textContent.length) : el.textContent });
    });
  });
  return q;
}
function speakNext() {
  if (!TTS.on) return;
  if (TTS.i >= TTS.q.length) { stopSpeech(); return; }
  const it = TTS.q[TTS.i];
  if (it.n !== TTS.node) {
    document.querySelectorAll(".node.speaking").forEach(x => x.classList.remove("speaking"));
    const el = $(it.n); if (el) { el.classList.add("speaking"); el.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
    TTS.node = it.n; $("plNow").textContent = nodeTitle(curBook, it.n);
  }
  const u = new SpeechSynthesisUtterance(it.text); u.lang = "fr-FR"; if (TTS.voice) u.voice = TTS.voice; u.rate = TTS.rate;
  u.onend = () => { if (!TTS.on || u._dead) return; TTS.i++; speakNext(); };
  u.onerror = ev => { if (u._dead || ev.error === "interrupted" || ev.error === "canceled") return; TTS.i++; speakNext(); };
  TTS.cur = u; lastAct = Date.now(); speechSynthesis.speak(u);
}
function killUtter() { if (TTS.cur) TTS.cur._dead = true; try { speechSynthesis.cancel(); } catch (e) {} }
function startSpeech() {
  if (!hasTTS || !curBook) return; killUtter();
  TTS.q = buildQueue(currentNodeId()); TTS.i = 0; TTS.on = true; TTS.node = null;
  $("player").hidden = false; $("plPlay").textContent = "❚❚"; $("plPlay").setAttribute("aria-label", "Pause"); $("ttsBtn").setAttribute("aria-pressed", "true");
  speakNext();
}
function pauseSpeech() { TTS.on = false; killUtter(); $("plPlay").textContent = "▶"; $("plPlay").setAttribute("aria-label", "Reprendre"); }
function resumeSpeech() { if (!TTS.q.length) return startSpeech(); TTS.on = true; $("plPlay").textContent = "❚❚"; $("plPlay").setAttribute("aria-label", "Pause"); speakNext(); }
function stopSpeech() {
  if (!hasTTS) return; TTS.on = false; killUtter(); TTS.q = []; TTS.node = null;
  $("player").hidden = true; $("ttsBtn").setAttribute("aria-pressed", "false");
  document.querySelectorAll(".node.speaking").forEach(x => x.classList.remove("speaking"));
}
$("ttsBtn").onclick = () => TTS.on ? stopSpeech() : startSpeech();
$("plPlay").onclick = () => TTS.on ? pauseSpeech() : resumeSpeech();
$("plStop").onclick = stopSpeech;
$("plRate").onclick = () => {
  const steps = [0.8, 1, 1.25, 1.5, 1.75], nxt = steps[(steps.indexOf(TTS.rate) + 1) % steps.length];
  ext.prefs = Object.assign({}, ext.prefs, { rate: nxt }); saveExt(); applyPrefs();
  if (TTS.on) { killUtter(); speakNext(); }
};

/* ---------- Temps de lecture ---------- */
let lastAct = Date.now(), tickN = 0;
["scroll", "pointerdown", "keydown", "touchstart"].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
setInterval(() => {
  if (!curBook || $("book").hidden || document.visibilityState !== "visible") return;
  if (Date.now() - lastAct > 90000 && !TTS.on) return;
  const k = dayKey(); ext.stats.days[k] = (ext.stats.days[k] || 0) + 15; ext.stats.books[curBook.id] = (ext.stats.books[curBook.id] || 0) + 15;
  tickN++; saveExt(tickN % 4 === 0);
}, 15000);
(function prune() { const lim = new Date(); lim.setDate(lim.getDate() - 400); const lk = dayKey(lim); Object.keys(ext.stats.days).forEach(k => { if (k < lk) delete ext.stats.days[k]; }); })();

/* ---------- Tableau de bord ---------- */
function fmtDur(sec) { const m = Math.round(sec / 60); if (m < 60) return m + " min"; const h = Math.floor(m / 60), r = m % 60; return h + " h" + (r ? " " + String(r).padStart(2, "0") : ""); }
function streak() { const days = ext.stats.days; let n = 0; const d = new Date(); if (!((days[dayKey(d)] || 0) >= 60)) d.setDate(d.getDate() - 1); while ((days[dayKey(d)] || 0) >= 60) { n++; d.setDate(d.getDate() - 1); } return n; }
function chartSVG() {
  const N = 30, vals = [], labels = []; const d = new Date(); d.setDate(d.getDate() - (N - 1));
  for (let k = 0; k < N; k++) { vals.push(Math.round((ext.stats.days[dayKey(d)] || 0) / 60)); labels.push(d.getDate()); d.setDate(d.getDate() + 1); }
  const max = Math.max(10, ...vals), top = Math.ceil(max / 10) * 10;
  const W = 600, H = 190, L = 34, R = 8, T = 14, B = 26, bw = (W - L - R) / N;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Minutes de lecture sur les 30 derniers jours">`;
  [0, 0.5, 1].forEach(f => { const y = T + (H - T - B) * (1 - f); s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="IBM Plex Mono, monospace">${Math.round(top * f)}</text>`; });
  vals.forEach((v, k) => {
    const hgt = (H - T - B) * v / top, x = L + k * bw + 2, y = H - B - hgt;
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${Math.max(hgt, v ? 2 : 0).toFixed(1)}" rx="2" fill="${k === N - 1 ? "var(--ochre)" : "var(--accent)"}"><title>${v} min</title></rect>`;
    if (k % 5 === 4 || k === N - 1) s += `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="IBM Plex Mono, monospace">${labels[k]}</text>`;
  });
  return s + `<text x="${L}" y="10" font-size="11" fill="var(--muted)" font-family="IBM Plex Mono, monospace">minutes / jour</text></svg>`;
}
function renderDash() {
  const total = Object.values(ext.stats.days).reduce((a, b) => a + b, 0);
  const now = new Date(), ym = now.getFullYear() * 12 + now.getMonth();
  const monthRead = Object.entries(ext.readAt).filter(([id, t]) => read.has(id) && (new Date(t).getFullYear() * 12 + new Date(t).getMonth()) === ym).length;
  const hlN = Object.values(ext.hl).reduce((a, l) => a + l.length, 0);
  const st = streak();
  const goalPct = Math.min(100, monthRead / ext.goal * 100);
  const inProg = BOOKS.filter(b => !read.has(b.id) && pos[b.id] && pos[b.id].pct >= 2).sort((a, b) => (pos[b.id].t || 0) - (pos[a.id].t || 0));
  const byTime = BOOKS.filter(b => ext.stats.books[b.id] >= 60).sort((a, b) => ext.stats.books[b.id] - ext.stats.books[a.id]).slice(0, 6);
  const maxT = byTime.length ? ext.stats.books[byTime[0].id] : 1;
  const recent = Object.entries(ext.readAt).filter(([id]) => read.has(id)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, t]) => ({ b: BOOKS.find(x => x.id === id), t })).filter(x => x.b);
  const row = (b, sub, bar, btn) => `<div class="drow">${coverSVG(b)}<div><div class="t">${esc(b.t)}</div><div class="s">${bar != null ? `<span class="mini"><i style="width:${bar}%"></i></span>` : ""}<span>${sub}</span></div></div>${btn || ""}</div>`;
  $("dashBody").innerHTML = `
    <div class="tiles">
      <div class="tile"><span class="v">${read.size}<small style="font-size:.55em;color:var(--muted)"> / ${BOOKS.length}</small></span><span class="k">Livres lus</span></div>
      <div class="tile"><span class="v">${fmtDur(total)}</span><span class="k">Temps de lecture</span></div>
      <div class="tile"><span class="v">${st} j</span><span class="k">Série en cours</span></div>
      <div class="tile"><span class="v">${hlN}</span><span class="k">Surlignages</span></div>
    </div>
    <section class="dsec"><h2 class="sectitle">Objectif de ${MONTHS[now.getMonth()]}</h2>
      <div class="goalbox"><div class="goalrow"><strong>${monthRead} livre${monthRead > 1 ? "s" : ""} lu${monthRead > 1 ? "s" : ""} sur ${ext.goal}</strong>
        <span class="stepper"><button type="button" data-goal="-1" aria-label="Réduire l'objectif">−</button><span>${ext.goal} par mois</span><button type="button" data-goal="1" aria-label="Augmenter l'objectif">+</button></span></div>
        <div class="gbar"><i style="width:${goalPct}%"></i></div>
        <span class="dempty" style="font-style:normal;font-size:14px">${monthRead >= ext.goal ? "Objectif atteint ce mois-ci. Bravo !" : `Encore ${ext.goal - monthRead} livre${ext.goal - monthRead > 1 ? "s" : ""} pour atteindre votre objectif. Une série se construit avec au moins une minute de lecture par jour.`}</span></div></section>
    <section class="dsec"><h2 class="sectitle">Vos 30 derniers jours</h2><div class="chartbox">${chartSVG()}</div></section>
    <section class="dsec"><h2 class="sectitle">En cours de lecture</h2><div class="dlist">${inProg.length ? inProg.map(b => row(b, pos[b.id].pct + " % · " + esc(nodeTitle(b, pos[b.id].node)), pos[b.id].pct, `<button class="btn primary" type="button" data-resume="${b.id}">Continuer</button>`)).join("") : `<p class="dempty">Aucune lecture en cours. Ouvrez un livre depuis la bibliothèque pour commencer.</p>`}</div></section>
    <section class="dsec"><h2 class="sectitle">Temps passé par livre</h2><div class="dlist">${byTime.length ? byTime.map(b => row(b, fmtDur(ext.stats.books[b.id]), Math.round(ext.stats.books[b.id] / maxT * 100))).join("") : `<p class="dempty">Le temps de lecture s'affichera ici dès votre première minute de lecture.</p>`}</div></section>
    <section class="dsec"><h2 class="sectitle">Terminés récemment</h2><div class="dlist">${recent.length ? recent.map(x => row(x.b, "Terminé le " + fmtDate(x.t), null, `<button class="btn" type="button" data-b="${x.b.id}">Relire</button>`)).join("") : `<p class="dempty">Marquez un livre comme lu à la fin de sa fiche pour le voir ici.</p>`}</div></section>`;
}
document.addEventListener("click", e => { const g = e.target.closest("[data-goal]"); if (g) { ext.goal = Math.min(20, Math.max(1, ext.goal + +g.dataset.goal)); saveExt(); renderDash(); } });

/* ---------- Application installable ---------- */
let deferredInstall = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; $("installBtn").hidden = false; });
if (isIOS && !standalone && window.SUPA_CFG) $("installBtn").hidden = false;
addEventListener("appinstalled", () => { $("installBtn").hidden = true; deferredInstall = null; });
function openInfo(title, text) { $("infoTitle").textContent = title; $("infoText").textContent = text; $("infoSheet").hidden = false; }
$("infoClose").onclick = () => $("infoSheet").hidden = true;
$("infoSheet").addEventListener("click", e => { if (e.target.id === "infoSheet") $("infoSheet").hidden = true; });
$("installBtn").onclick = async () => {
  if (deferredInstall) { deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) {} deferredInstall = null; $("installBtn").hidden = true; }
  else openInfo("Installer sur iPhone ou iPad", "Dans Safari, touchez le bouton Partager (le carré avec une flèche vers le haut), puis « Sur l'écran d'accueil ». La bibliothèque s'ouvrira ensuite comme une application, même sans connexion.");
};
if ("serviceWorker" in navigator && window.SUPA_CFG && location.protocol === "https:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!$("noteSheet").hidden) closeNote(); else if (!$("infoSheet").hidden) $("infoSheet").hidden = true; else if (!$("prefs").hidden) $("prefs").hidden = true; } });

