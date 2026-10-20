// knesset26-bets — אתר הימורי מנדטים לכנסת ה-26 (27.10.2026)
// Worker יחיד: מגיש את האתר ומאחסן הימורים ב-Workers KV.
// רשימת המפלגות והאותיות: ועדת הבחירות המרכזית (gov.il/he/pages/candidates-lists-26, אושר 27.9.2026)
// נתוני סקר לייחוס: סקר חדשות 12, 19.10.2026 (ice.co.il/research/news/article/1134272)

const PARTIES = [
  { id: "yashar",    letter: "דרך", name: "ישר! עם איזנקוט",              color: "#0e9aa7", bloc: "center", poll: 24 },
  { id: "likud",     letter: "מחל", name: "הליכוד",                        color: "#1f4e9c", bloc: "right",  poll: 21 },
  { id: "beyahad",   letter: "רק",  name: "ביחד (בנט)",                   color: "#f28c28", bloc: "center", poll: 14 },
  { id: "democratim",letter: "אמת", name: "הדמוקרטים",                    color: "#d6336c", bloc: "center", poll: 9 },
  { id: "meshutefet",letter: "ודם", name: "הרשימה המשותפת",               color: "#157347", bloc: "arab",   poll: 9 },
  { id: "shas",      letter: "שס",  name: 'ש"ס',                          color: "#a67c00", bloc: "right",  poll: 8 },
  { id: "yahadut",   letter: "ג",   name: "יהדות התורה",                  color: "#25355f", bloc: "right",  poll: 7 },
  { id: "tziyonut",  letter: "ט",   name: "הציונות הדתית-זהות",           color: "#365f91", bloc: "right",  poll: 7 },
  { id: "otzma",     letter: "ב",   name: "עוצמה יהודית",                 color: "#6d2e2e", bloc: "right",  poll: 8 },
  { id: "beiteinu",  letter: "ל",   name: "ישראל ביתנו",                  color: "#3b78c3", bloc: "center", poll: 8 },
  { id: "raam",      letter: "עם",  name: 'רע"ם',                         color: "#2e9e5b", bloc: "arab",   poll: 5 },
  { id: "winter",    letter: "ך",   name: "עמך ישראל (וינטר)",            color: "#7c6f64", bloc: "none",   poll: 0, below: true },
  { id: "miluim",    letter: "די",  name: "המילואימניקים והכלכלית (הנדל-זליכה)", color: "#0e7490", bloc: "none", poll: 0, below: true },
  { id: "kachol",    letter: "כן",  name: "כחול לבן",                     color: "#35a6d6", bloc: "center", poll: 0, below: true },
  { id: "haredi",    letter: "זך",  name: "הציבור החרדי",                 color: "#4b5563", bloc: "none",   poll: 0, below: true },
];

const BLOC_LABELS = { right: "גוש הימין", center: "מרכז-שמאל", arab: "המפלגות הערביות", none: "ללא גוש" };

const HTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>הימור המנדטים 🗳️ כנסת 26</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  :root { --bg:#f4f1ea; --ink:#1e2430; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:'Heebo',system-ui,sans-serif; background:linear-gradient(160deg,#fdf6ec,#eef3fb 60%,#f4f1ea); color:var(--ink); min-height:100vh; }
  header { text-align:center; padding:28px 16px 8px; }
  header h1 { margin:0; font-size:clamp(26px,6vw,42px); font-weight:900; }
  header p { margin:6px 0 0; opacity:.75; }
  .tabs { display:flex; gap:8px; justify-content:center; margin:18px 0 6px; }
  .tabs button { font-family:inherit; font-size:17px; font-weight:700; padding:10px 22px; border-radius:999px; border:2px solid #d8d2c4; background:#fff; cursor:pointer; transition:.15s; }
  .tabs button.active { background:var(--ink); color:#fff; border-color:var(--ink); }
  .wrap { max-width:760px; margin:0 auto; padding:12px 16px 90px; }
  .counter { position:sticky; top:0; z-index:5; background:#fff; border-radius:18px; box-shadow:0 4px 18px rgba(30,36,48,.12); padding:14px 18px; margin-bottom:16px; }
  .counter .nums { display:flex; justify-content:space-between; align-items:baseline; font-weight:900; font-size:22px; }
  .bar { height:12px; background:#eee; border-radius:999px; overflow:hidden; margin-top:8px; }
  .bar > div { height:100%; background:#2e9e5b; transition:width .15s, background .15s; }
  .bar.over > div { background:#d6336c; }
  .hint { font-size:14px; opacity:.7; margin-top:6px; }
  .name-row { display:flex; gap:8px; margin-bottom:16px; }
  .name-row input { flex:1; font-family:inherit; font-size:17px; padding:12px 14px; border-radius:14px; border:2px solid #d8d2c4; }
  .card { background:#fff; border-radius:18px; padding:14px 16px; margin-bottom:12px; box-shadow:0 2px 10px rgba(30,36,48,.07); display:flex; align-items:center; gap:14px; }
  .slip { flex:none; width:64px; height:64px; border-radius:10px; background:linear-gradient(#fdfdf8,#f3f1e4); border:1px solid #d8d2c4; box-shadow:inset 0 0 0 3px #fff, 0 1px 4px rgba(0,0,0,.08); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:24px; color:#1a3a8f; }
  .info { flex:1; min-width:0; }
  .pname { font-weight:700; font-size:16px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .pollref { font-size:12px; font-weight:500; opacity:.55; }
  .below { font-size:11px; font-weight:700; color:#8a5a00; background:#fff3d6; border-radius:999px; padding:1px 8px; }
  .ctrl { display:flex; align-items:center; gap:10px; margin-top:8px; }
  input[type=range] { flex:1; accent-color:var(--pc,#1f4e9c); height:28px; }
  .num { width:64px; font-family:inherit; font-size:17px; font-weight:700; text-align:center; padding:6px 4px; border-radius:10px; border:2px solid #d8d2c4; }
  .submit { width:100%; font-family:inherit; font-size:19px; font-weight:900; padding:16px; border:none; border-radius:18px; background:#2e9e5b; color:#fff; cursor:pointer; margin-top:8px; }
  .submit:disabled { background:#b9c2cc; cursor:not-allowed; }
  .msg { text-align:center; font-weight:700; margin-top:10px; min-height:22px; }
  .stat-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin-bottom:18px; }
  .stat { background:#fff; border-radius:16px; padding:14px; text-align:center; box-shadow:0 2px 10px rgba(30,36,48,.07); }
  .stat b { display:block; font-size:26px; font-weight:900; }
  .stat span { font-size:13px; opacity:.7; }
  .avgrow { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .avgrow .slip { width:44px; height:44px; font-size:17px; }
  .avgrow .n { width:130px; font-size:14px; font-weight:700; }
  .avgrow .track { flex:1; background:#eee; border-radius:999px; height:18px; position:relative; }
  .avgrow .fill { height:100%; border-radius:999px; min-width:2px; }
  .avgrow .v { width:44px; font-weight:900; text-align:left; }
  .avgrow .polltick { position:absolute; top:-3px; width:2px; height:24px; background:#1e2430aa; }
  .bet { background:#fff; border-radius:16px; padding:12px 16px; margin-bottom:10px; box-shadow:0 2px 10px rgba(30,36,48,.07); cursor:pointer; }
  .bet .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .bet .who { font-weight:900; font-size:17px; }
  .chip { font-size:12px; font-weight:700; border-radius:999px; padding:2px 10px; }
  .c-right { background:#dbe7ff; color:#1f4e9c; }
  .c-center { background:#ffe6ef; color:#d6336c; }
  .c-arab { background:#dff3e8; color:#157347; }
  .c-none { background:#eee; color:#555; }
  .c-61 { background:#1e2430; color:#fff; }
  .bet .detail { display:none; margin-top:10px; border-top:1px dashed #d8d2c4; padding-top:10px; font-size:14px; }
  .bet.open .detail { display:block; }
  .bet .when { font-size:12px; opacity:.5; margin-right:auto; }
  footer { text-align:center; font-size:12px; opacity:.6; padding:0 16px 30px; line-height:1.7; }
  footer a { color:inherit; }
  .hidden { display:none; }
</style>
</head>
<body>
<header>
  <h1>🗳️ הימור המנדטים</h1>
  <p>הבחירות לכנסת ה-26 · יום שלישי 27.10.2026 · חלקו 120 מנדטים בין המפלגות</p>
</header>
<div class="tabs">
  <button id="tab-bet" class="active">מהמרים 🎲</button>
  <button id="tab-stats">ההשוואה 📊</button>
</div>

<div class="wrap" id="view-bet">
  <div class="counter">
    <div class="nums"><span>חולקו: <span id="used">0</span></span><span id="left">נותרו 120</span></div>
    <div class="bar" id="bar"><div style="width:0%"></div></div>
    <div class="hint">אי אפשר לעבור את ה-120 — והשליחה נפתחת רק כשחילקתם בדיוק 120.</div>
  </div>
  <div class="name-row">
    <input id="bettor" maxlength="24" placeholder="השם שלכם (כדי שיכירו את ההימור)">
  </div>
  <div id="cards"></div>
  <button class="submit" id="submit" disabled>חילקתם 120? שלחו את ההימור 🚀</button>
  <div class="msg" id="msg"></div>
</div>

<div class="wrap hidden" id="view-stats">
  <div class="stat-cards" id="stat-cards"></div>
  <h2>ההימור הממוצע</h2>
  <div id="avg"></div>
  <h2>כל ההימורים <span id="bcount" style="font-size:14px;opacity:.6"></span></h2>
  <div id="bets"></div>
</div>

<footer>
  המפלגות והאותיות לפי <a href="https://www.gov.il/he/pages/candidates-lists-26">ועדת הבחירות המרכזית לכנסת ה-26</a> ·
  נתוני הסקר לייחוס: <a href="https://www.ice.co.il/research/news/article/1134272">סקר חדשות 12, 19.10.26</a> ·
  הקוד פתוח ב-<a href="https://github.com/YuvalHir/knesset26-bets">GitHub</a>
</footer>

<script>
const PARTIES = ${JSON.stringify(PARTIES)};
const BLOCS = ${JSON.stringify(BLOC_LABELS)};
const $ = (s) => document.querySelector(s);
const state = {};
PARTIES.forEach(p => state[p.id] = 0);

function total() { return Object.values(state).reduce((a,b)=>a+b,0); }

function render() {
  const t = total(), left = 120 - t;
  $("#used").textContent = t;
  $("#left").textContent = left > 0 ? "נותרו " + left : (left === 0 ? "בדיוק 120! ✔" : "חריגה!");
  const bar = $("#bar");
  bar.classList.toggle("over", t > 120);
  bar.firstElementChild.style.width = Math.min(100, t/120*100) + "%";
  $("#submit").disabled = !(t === 120 && $("#bettor").value.trim().length >= 2);
  document.querySelectorAll(".card").forEach(c => {
    const id = c.dataset.id, v = state[id];
    c.querySelector("input[type=range]").value = Math.min(v, 40);
    c.querySelector(".num").value = v;
  });
}

function setVal(id, v) {
  v = Math.max(0, Math.min(120, Math.round(v) || 0));
  const others = total() - state[id];
  if (others + v > 120) v = 120 - others; // חסימה קשיחה: אי אפשר לעבור 120
  state[id] = v;
  render();
}

const cards = $("#cards");
PARTIES.forEach(p => {
  const el = document.createElement("div");
  el.className = "card"; el.dataset.id = p.id;
  el.style.setProperty("--pc", p.color);
  el.innerHTML =
    '<div class="slip" style="color:' + p.color + '">' + p.letter + '</div>' +
    '<div class="info"><div class="pname">' + p.name +
      (p.below ? '<span class="below">קרוב לאחוז החסימה</span>' : '') +
      (p.poll ? '<span class="pollref">סקר: ' + p.poll + '</span>' : '') +
    '</div>' +
    '<div class="ctrl"><input type="range" min="0" max="40" value="0">' +
    '<input class="num" type="number" min="0" max="120" value="0"></div></div>';
  const range = el.querySelector("input[type=range]");
  const num = el.querySelector(".num");
  range.addEventListener("input", () => setVal(p.id, +range.value));
  num.addEventListener("input", () => setVal(p.id, +num.value));
  cards.appendChild(el);
});

$("#bettor").value = localStorage.getItem("bettor") || "";
$("#bettor").addEventListener("input", render);
render();

async function send(overwrite) {
  const name = $("#bettor").value.trim();
  const res = await fetch("/api/bet", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, parties: state, overwrite })
  });
  if (res.status === 409) {
    if (confirm('כבר קיים הימור בשם "' + name + '". לדרוס אותו?')) return send(true);
    return;
  }
  if (!res.ok) { $("#msg").textContent = "משהו השתבש, נסו שוב 😕"; return; }
  localStorage.setItem("bettor", name);
  $("#msg").textContent = "נשמר! עוברים להשוואה… 🎉";
  setTimeout(() => switchTab("stats"), 800);
}
$("#submit").addEventListener("click", () => send(false));

function blocSums(parties) {
  const s = { right:0, center:0, arab:0, none:0 };
  for (const p of PARTIES) s[p.bloc] += parties[p.id] || 0;
  return s;
}

async function loadStats() {
  const data = await (await fetch("/api/bets")).json();
  const bets = data.bets;
  $("#bcount").textContent = "(" + bets.length + " מהמרים)";
  const cards = $("#stat-cards");
  if (!bets.length) {
    cards.innerHTML = '<div class="stat"><b>אין עדיין הימורים</b><span>היו הראשונים!</span></div>';
    $("#avg").innerHTML = ""; $("#bets").innerHTML = "";
    return;
  }
  const avg = {}, bavg = { right:0, center:0, arab:0, none:0 };
  PARTIES.forEach(p => avg[p.id] = 0);
  bets.forEach(b => {
    PARTIES.forEach(p => avg[p.id] += (b.parties[p.id] || 0) / bets.length);
    const bs = blocSums(b.parties);
    for (const k in bavg) bavg[k] += bs[k] / bets.length;
  });
  const sorted = [...PARTIES].sort((a,b) => avg[b.id] - avg[a.id]);
  cards.innerHTML =
    '<div class="stat"><b>' + bets.length + '</b><span>מהמרים</span></div>' +
    '<div class="stat"><b>' + Math.round(bavg.right) + '</b><span>גוש ימין (ממוצע)</span></div>' +
    '<div class="stat"><b>' + Math.round(bavg.center) + '</b><span>מרכז-שמאל (ממוצע)</span></div>' +
    '<div class="stat"><b>' + Math.round(bavg.arab) + '</b><span>מפלגות ערביות (ממוצע)</span></div>' +
    '<div class="stat"><b>' + sorted[0].name + '</b><span>המפלגה הגדולה לפי ההימור הממוצע</span></div>';
  const maxV = Math.max(...sorted.map(p => avg[p.id]), 1);
  $("#avg").innerHTML = sorted.map(p => {
    const v = avg[p.id];
    return '<div class="avgrow"><div class="slip" style="color:' + p.color + '">' + p.letter + '</div>' +
      '<div class="n">' + p.name + '</div>' +
      '<div class="track"><div class="fill" style="width:' + (v/maxV*100) + '%;background:' + p.color + '"></div>' +
      (p.poll ? '<div class="polltick" title="סקר: ' + p.poll + '" style="right:' + (p.poll/maxV*100) + '%"></div>' : '') +
      '</div><div class="v">' + (Math.round(v*10)/10) + '</div></div>';
  }).join("");
  $("#bets").innerHTML = "";
  bets.sort((a,b) => b.ts - a.ts).forEach(b => {
    const bs = blocSums(b.parties);
    const el = document.createElement("div");
    el.className = "bet";
    const badge61 = bs.right >= 61 ? '<span class="chip c-61">ימין 61+ 👑</span>'
      : (bs.center >= 61 ? '<span class="chip c-61">מרכז-שמאל 61+ 👑</span>' : "");
    el.innerHTML = '<div class="head"><span class="who">' + escapeHtml(b.name) + '</span>' +
      '<span class="chip c-right">ימין ' + bs.right + '</span>' +
      '<span class="chip c-center">מרכז-שמאל ' + bs.center + '</span>' +
      '<span class="chip c-arab">ערביות ' + bs.arab + '</span>' +
      (bs.none ? '<span class="chip c-none">ללא גוש ' + bs.none + '</span>' : '') +
      badge61 +
      '<span class="when">' + new Date(b.ts).toLocaleString("he-IL") + '</span></div>' +
      '<div class="detail">' + PARTIES.filter(p => (b.parties[p.id]||0) > 0)
        .map(p => p.letter + " " + p.name + ": <b>" + b.parties[p.id] + "</b>").join(" · ") + '</div>';
    el.addEventListener("click", () => el.classList.toggle("open"));
    $("#bets").appendChild(el);
  });
}

function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

function switchTab(which) {
  const bet = which === "bet";
  $("#tab-bet").classList.toggle("active", bet);
  $("#tab-stats").classList.toggle("active", !bet);
  $("#view-bet").classList.toggle("hidden", !bet);
  $("#view-stats").classList.toggle("hidden", bet);
  if (!bet) loadStats();
}
$("#tab-bet").addEventListener("click", () => switchTab("bet"));
$("#tab-stats").addEventListener("click", () => switchTab("stats"));
</script>
</body>
</html>`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

function validBet(body) {
  if (!body || typeof body.name !== "string") return "חסר שם";
  const name = body.name.trim();
  if (name.length < 2 || name.length > 24) return "שם לא תקין";
  const ids = new Set(PARTIES.map(p => p.id));
  let sum = 0;
  const clean = {};
  for (const [k, v] of Object.entries(body.parties || {})) {
    if (!ids.has(k)) return "מפלגה לא מוכרת";
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < 0 || n > 120) return "מספר לא תקין";
    clean[k] = n;
    sum += n;
  }
  if (sum !== 120) return "חייבים לחלק בדיוק 120 מנדטים";
  return { name, clean };
}

async function readAll(env) {
  return (await env.BETS.get("all", "json")) || [];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/bets") {
      return json({ bets: await readAll(env) });
    }
    if (url.pathname === "/api/bet" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "json" }, 400); }
      const v = validBet(body);
      if (typeof v === "string") return json({ error: v }, 400);
      const bets = await readAll(env);
      const i = bets.findIndex(b => b.name === v.name);
      if (i >= 0 && !body.overwrite) return json({ exists: true }, 409);
      const entry = { name: v.name, parties: v.clean, ts: Date.now() };
      if (i >= 0) bets[i] = entry; else bets.push(entry);
      await env.BETS.put("all", JSON.stringify(bets));
      return json({ ok: true });
    }
    if (url.pathname === "/health") return json({ ok: true });
    return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
