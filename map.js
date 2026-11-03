/* ---------- Carte mentale ---------- */
let mapZoom = null, curBook = null;
function wrapText(s, max) {
  const words = s.split(" "); const lines = []; let line = "";
  words.forEach(w => { if ((line + " " + w).trim().length > max && line) { lines.push(line); line = w; } else line = (line + " " + w).trim(); });
  if (line) lines.push(line); return lines;
}
const MM = { collapsed: new Set(), view: null, full: null, bookId: null, pts: new Map(), drag: null };
const trunc = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
function nodeOrder(b) { const o = []; b.branches.forEach((br, i) => br.nodes.forEach((_, j) => o.push(`n-${i}-${j}`))); return o; }
function mapStates(b) {
  const order = nodeOrder(b), p = pos[b.id], cur = p && p.node ? order.indexOf(p.node) : -1, done = read.has(b.id);
  const mk = new Set(marks[b.id] || []), hlc = {};
  (ext.hl[b.id] || []).forEach(h => { hlc[h.n] = (hlc[h.n] || 0) + 1; });
  const st = {}; order.forEach((nid, k) => { st[nid] = { visited: done || (cur >= 0 && k <= cur), current: !done && k === cur, marked: mk.has(nid), hl: hlc[nid] || 0 }; });
  return st;
}
function isPhone() { return document.documentElement.dataset.device === "phone"; }
function initialCollapsed(b) {
  if (!isPhone()) return new Set();
  const p = pos[b.id], cb = p && p.node ? +(/^n-(\d+)-/.exec(p.node) || [0, 0])[1] : 0;
  return new Set(b.branches.map((_, i) => i).filter(i => i !== cb));
}
function buildRadial(b) {
  const st = mapStates(b), W = 1560, cx = W / 2, ROW = 50, GAP = 22, CW = 318, CH = 40;
  const rows = i => MM.collapsed.has(i) ? 1 : b.branches[i].nodes.length;
  const right = [], left = []; const total = b.branches.reduce((s, _, i) => s + rows(i), 0); let acc = 0;
  b.branches.forEach((br, i) => { (acc < total / 2 ? right : left).push(i); acc += rows(i); });
  const sideH = arr => arr.reduce((s, i) => s + rows(i) * ROW + GAP, -GAP);
  const H = Math.max(sideH(right), sideH(left), 300) + 70, cy = H / 2;
  let out = "";
  const centerLines = wrapText(b.center || b.t, 20), cw = 250, ch = 36 + centerLines.length * 24;
  function side(arr, dir) {
    let y = cy - sideH(arr) / 2;
    arr.forEach(i => {
      const br = b.branches[i], col = `var(${BCOL[i % BCOL.length]})`, coll = MM.collapsed.has(i);
      const bh = rows(i) * ROW, by = y + bh / 2;
      const bl = wrapText(br.title.toUpperCase(), 21), bw = Math.min(214, Math.max(...bl.map(l => l.length)) * 8.4 + 34), bhgt = 20 + bl.length * 17;
      const bx = dir > 0 ? cx + 170 : cx - 170 - bw, sx = cx + dir * (cw / 2 - 6), ex = dir > 0 ? bx : bx + bw;
      const nDone = br.nodes.filter((_, j) => st[`n-${i}-${j}`].visited).length;
      out += `<path d="M${sx},${cy} C${sx + dir * 70},${cy} ${ex - dir * 70},${by} ${ex},${by}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" opacity=".85"/>`;
      if (!coll) br.nodes.forEach((nd, j) => {
        const nid = `n-${i}-${j}`, s = st[nid], ny = y + j * ROW + ROW / 2, nx0 = dir > 0 ? bx + bw : bx;
        const tx = dir > 0 ? cx + 420 : cx - 420 - CW, edge = dir > 0 ? tx : tx + CW;
        out += `<path d="M${nx0},${by} C${nx0 + dir * 55},${by} ${edge - dir * 60},${ny} ${edge},${ny}" fill="none" stroke="${col}" stroke-width="2" opacity=".65"/>`;
        const icons = (s.marked ? "★ " : "") + (s.hl ? "✎" + s.hl + " " : "") + (s.visited ? "✓" : "");
        out += `<g class="mm-node mm-leaf${s.visited ? " visited" : ""}${s.current ? " current" : ""}${s.marked ? " marked" : ""}" tabindex="0" role="link" aria-label="${esc(nd.title)}" data-target="${nid}">
          <rect class="mm-card" x="${tx}" y="${ny - CH / 2}" width="${CW}" height="${CH}" rx="8"/>
          <rect x="${dir > 0 ? tx : tx + CW - 5}" y="${ny - CH / 2}" width="5" height="${CH}" rx="2" fill="${col}"/>
          <text class="mm-label" x="${tx + 14}" y="${ny - 3}">${esc(trunc(nd.title, 36))}</text>
          ${nd.kw ? `<text class="mm-kw" x="${tx + 14}" y="${ny + 13}">${esc(trunc(nd.kw, 44))}</text>` : ""}
          ${icons ? `<text class="mm-ic" x="${tx + CW - 12}" y="${ny + 5}" text-anchor="end">${icons.trim()}</text>` : ""}
        </g>`;
      });
      out += `<g class="mm-node mm-branchg" tabindex="0" role="button" aria-expanded="${!coll}" aria-label="${esc(br.title)} : ${coll ? "déplier" : "replier"}" data-toggle="${i}">
        <rect class="mm-hit" x="${bx}" y="${by - bhgt / 2}" width="${bw}" height="${bhgt}" rx="14" fill="${col}"/>
        ${bl.map((l, k) => `<text class="mm-branch" x="${bx + bw / 2}" y="${by - (bl.length - 1) * 8.5 + k * 17 + 4.5}" text-anchor="middle">${esc(l)}</text>`).join("")}
        <g transform="translate(${dir > 0 ? bx + bw - 4 : bx + 4},${by - bhgt / 2 + 2})"><circle r="11" fill="var(--card)" stroke="${col}" stroke-width="2"/><text class="mm-cnt" y="4" text-anchor="middle">${coll ? "+" + br.nodes.length : nDone + "/" + br.nodes.length}</text></g>
      </g>`;
      y += bh + GAP;
    });
  }
  side(right, 1); side(left, -1);
  out += `<g class="mm-node mm-centerg" tabindex="0" role="link" aria-label="Haut de la lecture" data-target="reading-top"><rect x="${cx - cw / 2}" y="${cy - ch / 2}" width="${cw}" height="${ch}" rx="20" fill="var(${b.c})"/>
    ${centerLines.map((l, k) => `<text class="mm-center" x="${cx}" y="${cy - (centerLines.length - 1) * 12 + k * 24 + 6}" text-anchor="middle">${esc(l)}</text>`).join("")}</g>`;
  return { svg: `<svg id="mmsvg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Carte mentale de ${esc(b.t)}">${out}</svg>`, W, H };
}
function buildOutline(b) {
  const st = mapStates(b);
  return `<div class="mmtree"><button type="button" class="mmroot" data-t="reading-top" style="--bc:var(${b.c})">${esc(b.center || b.t)}</button>` + b.branches.map((br, i) => {
    const coll = MM.collapsed.has(i), nDone = br.nodes.filter((_, j) => st[`n-${i}-${j}`].visited).length;
    return `<section class="mmbr" style="--bc:var(${BCOL[i % BCOL.length]})"><button type="button" class="mmbh" data-toggle="${i}" aria-expanded="${!coll}"><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="bt">${esc(br.title)}</span><span class="cnt">${nDone}/${br.nodes.length}</span><span class="chev" aria-hidden="true">▾</span></button>
      <ul class="mmleaves"${coll ? " hidden" : ""}>${br.nodes.map((nd, j) => { const nid = `n-${i}-${j}`, s = st[nid];
        return `<li><button type="button" class="mmleaf${s.visited ? " visited" : ""}${s.current ? " current" : ""}" data-t="${nid}"><span class="dot" aria-hidden="true"></span><span class="lt"><span class="ln">${esc(nd.title)}</span>${nd.kw ? `<span class="lk">${esc(nd.kw)}</span>` : ""}</span><span class="st">${s.marked ? "★" : ""}${s.hl ? " ✎" + s.hl : ""}${s.visited ? " ✓" : ""}</span></button></li>`; }).join("")}</ul></section>`;
  }).join("") + `</div>`;
}
function renderMap(fresh) {
  const b = curBook; if (!b) return;
  const stage = $("mapscroll"), phone = isPhone();
  $("map").classList.toggle("outline", phone);
  $("zOut").hidden = $("zIn").hidden = $("zFit").hidden = phone;
  const allColl = MM.collapsed.size === b.branches.length;
  $("zAll").textContent = phone ? (MM.collapsed.size ? "Tout déplier" : "Tout replier") : (MM.collapsed.size ? "Tout déplier" : "Tout replier");
  $("mapHint").textContent = phone ? "Touchez une branche pour la déplier, puis une idée pour la lire. ✓ lue · ★ marque-page · ✎ surlignages." : (document.documentElement.dataset.device === "desktop" ? "Glissez pour déplacer la carte, Ctrl + molette ou − / + pour zoomer, cliquez sur une branche pour la replier. ✓ lue · ★ marque-page · ✎ surlignages." : "Glissez pour déplacer la carte, pincez ou utilisez − / + pour zoomer, touchez une branche pour la replier. ✓ lue · ★ marque-page · ✎ surlignages.");
  if (phone) { stage.innerHTML = buildOutline(b); MM.bookId = b.id; return; }
  const keep = !fresh && MM.bookId === b.id && MM.view;
  const m = buildRadial(b); stage.innerHTML = m.svg; MM.full = { x: 0, y: 0, w: m.W, h: m.H };
  if (!keep) MM.view = { ...MM.full };
  MM.bookId = b.id; setView();
}
function setView() { const s = $("mmsvg"); if (s && MM.view) s.setAttribute("viewBox", `${MM.view.x} ${MM.view.y} ${MM.view.w} ${MM.view.h}`); }
function svgPoint(cx, cy) { const s = $("mmsvg"); const pt = s.createSVGPoint(); pt.x = cx; pt.y = cy; return pt.matrixTransform(s.getScreenCTM().inverse()); }
function zoomAt(f, cx, cy) {
  if (!MM.view) return; const v = MM.view, nw = Math.min(MM.full.w * 1.3, Math.max(MM.full.w / 7, v.w / f)), k = v.w / nw;
  let p; if (cx == null) p = { x: v.x + v.w / 2, y: v.y + v.h / 2 }; else p = svgPoint(cx, cy);
  MM.view = { x: p.x - (p.x - v.x) / k, y: p.y - (p.y - v.y) / k, w: nw, h: v.h / k }; setView();
}
function panBy(dx, dy) { const s = $("mmsvg"); if (!s) return; const r = s.getBoundingClientRect(), sc = Math.min(r.width / MM.view.w, r.height / MM.view.h); MM.view.x -= dx / sc; MM.view.y -= dy / sc; setView(); }
function toggleBranch(i) { MM.collapsed.has(i) ? MM.collapsed.delete(i) : MM.collapsed.add(i); renderMap(false); }
$("zIn").onclick = () => zoomAt(1.3); $("zOut").onclick = () => zoomAt(1 / 1.3);
$("zFit").onclick = () => { MM.view = { ...MM.full }; setView(); };
$("zAll").onclick = () => { if (!curBook) return; MM.collapsed = MM.collapsed.size ? new Set() : new Set(curBook.branches.map((_, i) => i)); renderMap(true); };
(function bindStage() {
  const st = $("mapscroll");
  st.addEventListener("pointerdown", e => {
    if (isPhone() || !$("mmsvg")) return;
    st.setPointerCapture(e.pointerId); MM.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (MM.pts.size === 1) MM.drag = { x: e.clientX, y: e.clientY, moved: 0, target: e.target.closest(".mm-node") };
    else { MM.drag = null; const [a, b] = [...MM.pts.values()]; MM.pinch = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  st.addEventListener("pointermove", e => {
    if (!MM.pts.has(e.pointerId)) return;
    const prev = MM.pts.get(e.pointerId); MM.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (MM.pts.size === 2) { const [a, b] = [...MM.pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (MM.pinch) zoomAt(d / MM.pinch, (a.x + b.x) / 2, (a.y + b.y) / 2); MM.pinch = d; return; }
    if (MM.drag) { const dx = e.clientX - prev.x, dy = e.clientY - prev.y; MM.drag.moved += Math.abs(dx) + Math.abs(dy); if (MM.drag.moved > 6) { st.classList.add("grabbing"); panBy(dx, dy); } }
  });
  const end = e => {
    if (!MM.pts.has(e.pointerId)) return; MM.pts.delete(e.pointerId); st.classList.remove("grabbing");
    if (MM.pts.size === 0 && MM.drag && MM.drag.moved <= 6 && MM.drag.target) { const g = MM.drag.target; if (g.dataset.toggle != null) toggleBranch(+g.dataset.toggle); else if (g.dataset.target) goTo(g.dataset.target); }
    if (MM.pts.size < 2) MM.pinch = null; if (MM.pts.size === 0) MM.drag = null;
  };
  st.addEventListener("pointerup", end); st.addEventListener("pointercancel", e => { MM.drag = null; end(e); });
  st.addEventListener("wheel", e => { if (isPhone() || !$("mmsvg") || !(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
  st.addEventListener("click", e => { if (!isPhone()) return; const t = e.target.closest("[data-toggle]"); if (t) { e.stopPropagation(); toggleBranch(+t.dataset.toggle); } });
  st.addEventListener("keydown", e => { const g = e.target.closest(".mm-node"); if (!g || (e.key !== "Enter" && e.key !== " ")) return; e.preventDefault(); if (g.dataset.toggle != null) toggleBranch(+g.dataset.toggle); else goTo(g.dataset.target); });
})();
function goTo(id) {
  if (id === "map") renderMap(false);
  const el = $(id); if (!el) return;
  el.scrollIntoView({ block: "start" });
  if (el.classList.contains("node")) { el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600); }
}

/* Sommaire latéral (ordinateur) */
function renderSide() {
  const b = curBook, box = $("bkSide"); if (!b || !box) return;
  const st = mapStates(b);
  box.innerHTML = `<div class="sidehead">${coverSVG(b)}<div><strong></strong><span class="sp" id="sidePct"></span></div></div><nav aria-label="Sommaire du livre">` + b.branches.map((br, i) => `<div class="sbr" style="--bc:var(${BCOL[i % BCOL.length]})"><button type="button" class="sbt" data-t="b-${i}">${esc(br.title)}</button><ul>${br.nodes.map((nd, j) => { const nid = `n-${i}-${j}`, s = st[nid]; return `<li><button type="button" class="sn${s.visited ? " visited" : ""}" data-t="${nid}" data-sn="${nid}"><span>${esc(nd.title)}</span><i>${s.marked ? "★" : ""}${s.hl ? "✎" : ""}</i></button></li>`; }).join("")}</ul></div>`).join("") + `</nav><button type="button" class="linkish" data-t="map">↑ Carte mentale</button>`;
  box.querySelector(".sidehead strong").textContent = b.t;
}
let sideRaf = 0;
function updateSide(pct) {
  if (document.documentElement.dataset.device !== "desktop" || !curBook) return;
  cancelAnimationFrame(sideRaf); sideRaf = requestAnimationFrame(() => {
    const id = currentNodeId(); document.querySelectorAll("#bkSide .sn.current").forEach(x => x.classList.remove("current"));
    const el = document.querySelector(`#bkSide [data-sn="${id}"]`); if (el) { el.classList.add("current"); const box = $("bkSide"), r = el.getBoundingClientRect(), br = box.getBoundingClientRect(); if (r.top < br.top + 60 || r.bottom > br.bottom - 20) box.scrollTop += r.top - br.top - br.height / 3; }
    const sp = $("sidePct"); if (sp) sp.textContent = Math.round(pct * 100) + " % lu";
  });
}
