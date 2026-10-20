// knesset26-bets — אתר הימורי מנדטים לכנסת ה-26 (27.10.2026)
// Worker יחיד: מגיש את האתר ומאחסן הימורים ב-Workers KV.
// רשימת המפלגות והאותיות: ועדת הבחירות המרכזית (gov.il/he/pages/candidates-lists-26, אושר 27.9.2026)
// כחול לבן הוסרה: גנץ הודיע על פרישה 19.10.2026 (israelhayom.co.il)
// קבוצות: כל אחד יכול לפתוח קבוצת מהמרים עם קוד בת 7 תווים; הימורים ישנים נשמרים בקבוצה הכללית.

const PARTIES = [
  { id: "yashar",     letter: "דרך", name: "ישר! עם איזנקוט",              color: "#0e9aa7", official: "ישר! עם איזנקוט לראשות הממשלה מאחדים את ישראל", bloc: "center" },
  { id: "likud",      letter: "מחל", name: "הליכוד",                        color: "#1f4e9c", official: "הליכוד בהנהגת בנימין נתניהו לראשות הממשלה", bloc: "right"  },
  { id: "beyahad",    letter: "רק",  name: "ביחד (בנט)",                   color: "#f28c28", official: "ביחד בראשות נפתלי בנט", bloc: "center" },
  { id: "democratim", letter: "אמת", name: "הדמוקרטים",                    color: "#d6336c", official: "הדמוקרטים בראשות יאיר גולן", bloc: "center" },
  { id: "meshutefet", letter: "ודם", name: "הרשימה המשותפת",               color: "#157347", official: "הרשימה המשותפת", bloc: "arab"   },
  { id: "shas",       letter: "שס",  name: 'ש"ס',                          color: "#a67c00", official: "התאחדות הספרדים שומרי תורה תנועתו של מרן הרב עובדיה יוסף זצ״ל", bloc: "right"  },
  { id: "yahadut",    letter: "ג",   name: "יהדות התורה",                  color: "#25355f", official: "יהדות התורה והשבת אגודת ישראל – דגל התורה", bloc: "right"  },
  { id: "tziyonut",   letter: "ט",   name: "הציונות הדתית-זהות",           color: "#365f91", official: "הציונות הדתית בראשות בצלאל סמוטריץ׳ וזהות בראשות משה פייגלין", bloc: "right"  },
  { id: "otzma",      letter: "ב",   name: "עוצמה יהודית",                 color: "#6d2e2e", official: "עוצמה יהודית בראשות איתמר בן גביר", bloc: "right"  },
  { id: "beiteinu",   letter: "ל",   name: "ישראל ביתנו",                  color: "#3b78c3", official: "ישראל ביתנו בראשות אביגדור ליברמן", bloc: "center" },
  { id: "raam",       letter: "עם",  name: 'רע"ם',                         color: "#2e9e5b", official: "רע״ם – הרשימה הערבית המאוחדת", bloc: "arab"   },
  { id: "winter",     letter: "ך",   name: "עמך ישראל (וינטר)",            color: "#7c6f64", official: "עמך ישראל בראשות עופר וינטר", bloc: "right", below: true },
  { id: "miluim",     letter: "די",  name: "המילואימניקים והכלכלית (הנדל-זליכה)", color: "#0e7490", official: "המילואימניקים והכלכלית בראשות יועז הנדל וירון זליכה", bloc: "miluim", below: true },
  { id: "haredi",     letter: "זך",  name: "הציבור החרדי",                 color: "#4b5563", official: "הציבור החרדי בראשות מוטי ליטנר", bloc: "haredi", below: true },
  { id: "noam",       letter: "ני",  name: "נעם לישראל",                   color: "#5b21b6", official: "נעם לישראל למען עתיד הילדים בראשות אבי מעוז", bloc: "right", below: true },
];

const GENERAL = { code: "GENERAL", name: "הקבוצה הכללית" };

async function sha256hex(t) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
// נעילת ההימורים: 27.10.2026 21:59 שעון ישראל - מחושב דינמית לפי Asia/Jerusalem (כולל שעון קיץ/חורף)
function jerusalemUtcMs(y, mo, d, h, mi) {
  const guess = Date.UTC(y, mo - 1, d, h, mi) - 2 * 3600e3; // ישראל היא UTC+2/+3
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(p => p.type !== "literal").map(p => [p.type, +p.value]));
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return guess + (Date.UTC(y, mo - 1, d, h, mi) - localAsUtc);
}
const BET_CLOSE = jerusalemUtcMs(2026, 10, 27, 21, 59);

const POLLS = [
  { id: "ch12", label: "חדשות 12", date: "19.10.26",
    src: "https://www.mako.co.il/news-israel-elections/2026/Article-a6eb664b9d451a1026.htm",
    seats: { yashar:24, likud:21, beyahad:14, democratim:9, meshutefet:9, shas:8, yahadut:7, tziyonut:7, otzma:8, beiteinu:8, raam:5, winter:0, miluim:0, haredi:0, noam:0 } },
  { id: "ch13", label: "חדשות 13", date: "19.10.26",
    src: "https://13tv.co.il/item/news/politics/politics/jw3wm-905406894/",
    seats: { yashar:20, likud:18, beyahad:14, democratim:9, meshutefet:9, shas:7, yahadut:7, tziyonut:7, otzma:7, beiteinu:8, raam:6, winter:4, miluim:4, haredi:0, noam:0 } },
  { id: "ch14", label: "ערוץ 14", date: "18.10.26",
    src: "https://www.c14.co.il/elections26?tab=polls",
    seats: { yashar:22, likud:29, beyahad:10, democratim:8, meshutefet:7, shas:10, yahadut:8, tziyonut:7, otzma:7, beiteinu:6, raam:6, winter:0, miluim:0, haredi:0, noam:0 } },
  { id: "kan", label: "כאן 11", date: "18.10.26",
    src: "https://www.kan.org.il/content/kan-news/politic/1110393/",
    seats: { yashar:23, likud:21, beyahad:12, democratim:9, meshutefet:8, shas:8, yahadut:7, tziyonut:7, otzma:8, beiteinu:8, raam:5, winter:0, miluim:4, haredi:0, noam:0 } },
  { id: "i24", label: "i24NEWS", date: "18.10.26",
    src: "https://www.i24news.tv/he/news/israel-elections-2026/polls/artc-81805",
    seats: { yashar:21, likud:25, beyahad:13, democratim:9, meshutefet:8, shas:8, yahadut:8, tziyonut:6, otzma:10, beiteinu:6, raam:6, winter:0, miluim:0, haredi:0, noam:0 } },
  { id: "walla", label: "וואלה", date: "13.10.26",
    src: "https://www.walla.co.il/news/politics/383957251",
    seats: { yashar:22, likud:20, beyahad:13, democratim:10, meshutefet:8, shas:7, yahadut:8, tziyonut:6, otzma:8, beiteinu:9, raam:5, winter:0, miluim:4, haredi:0, noam:0 } },
];

const BLOC_LABELS = { right: "קואליציה", center: "אופוזיציה", arab: "מפלגות ערביות", haredi: "הציבור החרדי", miluim: "הנדל-זליכה" };

const HTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>הימור המנדטים 🗳️ כנסת 26</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  :root { --blue:#0038b8; --bluedark:#0a2472; --ink:#101b3c; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:'Heebo',system-ui,sans-serif; color:var(--ink); min-height:100vh;
    background:linear-gradient(#fff,#f2f6ff 30%,#e8efff); }
  .flagbar { height:12px; background:var(--blue); }
  .flagstar { text-align:center; font-size:30px; color:var(--blue); line-height:1; margin:10px 0 0; }
  header { text-align:center; padding:10px 16px 8px; }
  header h1 { margin:0; font-size:clamp(26px,6vw,42px); font-weight:900; color:var(--bluedark); }
  header p { margin:6px 0 0; opacity:.7; }
  .groupbar { display:none; justify-content:center; align-items:center; gap:8px; margin-top:10px; flex-wrap:wrap; }
  .groupbar.show { display:flex; }
  .groupbar .gname { font-weight:900; color:#fff; background:var(--bluedark); border-radius:999px; padding:5px 16px; font-size:15px; }
  .groupbar button { font-family:inherit; font-size:13px; font-weight:700; border:1.5px solid var(--blue); color:var(--blue); background:#fff; border-radius:999px; padding:5px 12px; cursor:pointer; }
  .tabs { display:flex; gap:8px; justify-content:center; margin:16px 0 6px; }
  .tabs button { font-family:inherit; font-size:17px; font-weight:700; padding:10px 22px; border-radius:999px; border:2px solid var(--blue); background:#fff; color:var(--blue); cursor:pointer; transition:.15s; }
  .tabs button.active { background:var(--blue); color:#fff; }
  .wrap { max-width:760px; margin:0 auto; padding:12px 16px 90px; }
  .gate { max-width:440px; margin:24px auto; }
  .gate .gcard { background:#fff; border:1px solid #dbe4ff; border-radius:20px; padding:22px; margin-bottom:16px; box-shadow:0 4px 18px rgba(0,56,184,.10); text-align:center; }
  .gate h2 { margin:0 0 4px; font-size:20px; color:var(--bluedark); }
  .gate p { margin:0 0 14px; font-size:14px; opacity:.7; }
  .gate input { width:100%; font-family:inherit; font-size:18px; text-align:center; padding:12px; border-radius:12px; border:2px solid #c7d5f7; margin-bottom:10px; letter-spacing:1px; }
  .gate button { width:100%; font-family:inherit; font-size:17px; font-weight:900; padding:13px; border:none; border-radius:12px; background:var(--blue); color:#fff; cursor:pointer; }
  .gate .or { text-align:center; font-weight:700; opacity:.4; margin:4px 0 16px; }
  .gate .err { color:#d6336c; font-weight:700; font-size:14px; min-height:18px; margin-top:8px; }
  .counter { position:sticky; top:0; z-index:5; background:#fff; border:1px solid #dbe4ff; border-radius:14px; box-shadow:0 3px 12px rgba(0,56,184,.10); padding:7px 14px 8px; margin-bottom:12px; }
  .counter .nums { display:flex; justify-content:space-between; align-items:baseline; font-weight:900; font-size:16px; color:var(--bluedark); }
  .bar { height:8px; background:#e5ebfb; border-radius:999px; overflow:hidden; margin-top:6px; display:flex; }
  .bar > div { height:100%; transition:width .15s; }
  .bar .seg-r { background:#1f4e9c; }
  .bar .seg-c { background:#c1121f; }
  .bar .seg-a { background:#157347; }
  .bar .seg-h { background:#4b5563; }
  .bar .seg-m { background:#b7a96b; }
  .cd { font-size:12.5px; text-align:center; margin:10px 0 6px; font-weight:700; color:var(--bluedark); }
  .hint { font-size:14px; opacity:.7; margin-top:6px; }
  .pollbox { background:#fff; border:1px solid #dbe4ff; border-radius:18px; padding:12px 14px; margin-bottom:14px; }
  .pollbox .ptitle { font-weight:900; font-size:15px; margin-bottom:8px; }
  .polls { display:flex; flex-wrap:wrap; gap:8px; }
  .polls button { background:#fff; border:2px solid #c7d5f7; border-radius:12px; padding:5px 9px; cursor:pointer; display:flex; align-items:center; justify-content:center; min-width:54px; height:42px; }
  .polls button img { max-height:28px; max-width:66px; display:block; }
  .polls button.active { border-color:var(--blue); background:#eef4ff; box-shadow:inset 0 0 0 1px var(--blue); }
  .pollmeta { font-size:12.5px; opacity:.7; margin-top:8px; }
  .pollmeta a { color:var(--blue); }
  .fillbtn { width:100%; margin-top:8px; font-family:inherit; font-size:15px; font-weight:900; padding:10px; border-radius:12px; border:2px dashed var(--blue); background:#eef3ff; color:var(--blue); cursor:pointer; }
  .blocstrip { display:flex; justify-content:center; gap:9px; flex-wrap:wrap; margin-top:5px; font-size:12px; font-weight:700; }
  .blocstrip b { font-weight:900; }
  .bloc61 { font-size:11.5px; font-weight:500; opacity:.6; }
  .smallstrip { margin-top:6px; font-size:12px; color:#5a627a; text-align:center; }
  .editmode { background:#fff7e0; border:1px solid #f0df9a; color:#8a6d00; border-radius:12px; padding:8px 12px; font-size:13.5px; font-weight:700; margin-bottom:10px; text-align:center; }
  .name-row { display:flex; gap:8px; margin-bottom:14px; }
  .name-row input { flex:1; font-family:inherit; font-size:17px; padding:12px 14px; border-radius:14px; border:2px solid #c7d5f7; background:#fff; }
  .card { background:#fff; border-radius:18px; padding:14px 16px; margin-bottom:12px; box-shadow:0 2px 10px rgba(16,27,60,.07); display:flex; align-items:center; gap:14px; border:1px solid #e7edff; }
  .slip { flex:none; width:72px; height:88px; border-radius:6px; background:linear-gradient(#ffffff,#f7f5ec);
    border:1px solid #cfcaba; box-shadow:0 2px 5px rgba(0,0,0,.12), inset 0 0 0 2px #fff;
    display:flex; flex-direction:column; align-items:center; justify-content:center; transform:rotate(-2deg); overflow:hidden; }
  .slip .letters { font-weight:900; font-size:27px; color:var(--blue); letter-spacing:1px; }
  .slip .tiny { font-size:9.5px; color:#8a8571; text-align:center; padding:0 5px; margin-top:3px; line-height:1.15; max-width:100%; }
  .info { flex:1; min-width:0; }
  .pname { font-weight:700; font-size:16px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .pollref { font-size:12px; font-weight:500; opacity:.55; }
  .below { font-size:11px; font-weight:700; color:#8a5a00; background:#fff3d6; border-radius:999px; padding:1px 8px; }
  .ctrl { display:flex; align-items:center; gap:10px; margin-top:8px; }
  input[type=range] { flex:1; accent-color:var(--pc,var(--blue)); height:28px; }
  .num { width:64px; font-family:inherit; font-size:17px; font-weight:700; text-align:center; padding:6px 4px; border-radius:10px; border:2px solid #c7d5f7; }
  .submit { width:100%; font-family:inherit; font-size:19px; font-weight:900; padding:16px; border:none; border-radius:18px; background:var(--blue); color:#fff; cursor:pointer; margin-top:8px; }
  .submit:disabled { background:#b9c2cc; cursor:not-allowed; }
  .msg { text-align:center; font-weight:700; margin-top:10px; min-height:22px; }
  .stat-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin-bottom:18px; }
  .stat { background:#fff; border:1px solid #e7edff; border-radius:16px; padding:14px; text-align:center; box-shadow:0 2px 10px rgba(16,27,60,.07); }
  .stat b { display:block; font-size:24px; font-weight:900; color:var(--bluedark); }
  .stat span { font-size:13px; opacity:.7; }
  .avgrow { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .avgrow .slip { width:46px; height:58px; }
  .avgrow .slip .letters { font-size:19px; }
  .avgrow .slip .tiny { display:none; }
  .avgrow .n { width:120px; font-size:13px; font-weight:700; }
  .avgrow .track { flex:1; background:#e5ebfb; border-radius:999px; height:18px; position:relative; }
  .avgrow .fill { height:100%; border-radius:999px; min-width:2px; }
  .avgrow .v { width:44px; font-weight:900; text-align:left; }
  .avgrow .polltick { position:absolute; top:-3px; width:2px; height:24px; background:#101b3c99; }
  .bet { background:#fff; border:1px solid #e7edff; border-radius:16px; padding:12px 16px; margin-bottom:10px; box-shadow:0 2px 10px rgba(16,27,60,.07); cursor:pointer; }
  .bet .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .bet .who { font-weight:900; font-size:17px; }
  .bet .gname { font-size:11px; font-weight:700; background:#eef3ff; color:var(--blue); border-radius:999px; padding:2px 9px; }
  .chip { font-size:12px; font-weight:700; border-radius:999px; padding:2px 10px; }
  .c-right { background:#dbe7ff; color:#1f4e9c; }
  .c-center { background:#fbe3e3; color:#c1121f; }
  .c-arab { background:#dff3e8; color:#157347; }
  .c-haredi { background:#e5e7eb; color:#374151; }
  .c-miluim { background:#f3ecd4; color:#8a7a2e; }
  .c-61 { background:var(--bluedark); color:#fff; }
  .bet .detail { display:none; margin-top:10px; border-top:1px dashed #c7d5f7; padding-top:10px; font-size:14px; }
  .bet.open .detail { display:block; }
  .bet .when { font-size:12px; opacity:.5; margin-right:auto; }
  footer { text-align:center; font-size:12px; opacity:.65; padding:0 16px 30px; line-height:1.8; }
  footer a { color:var(--blue); }
  .hidden { display:none !important; }
</style>
</head>
<body>
<div class="flagbar"></div>
<div class="flagstar">✡</div>
<header>
  <h1>הימור המנדטים 🗳️</h1>
  <p>הבחירות לכנסת ה-26 · יום שלישי 27.10.2026 · חלקו 120 מנדטים בין המפלגות</p>
  <div class="groupbar" id="groupbar">
    <span class="gname" id="gname"></span>
    <button id="copylink">העתק קישור לקבוצה 🔗</button>
    <button id="leavegroup">החלף קבוצה</button>
  </div>
</header>

<div class="wrap hidden" id="view-gate">
  <div class="gate">
    <div class="gcard">
      <h2>פתיחת קבוצת מהמרים 👥</h2>
      <p>תקבלו קוד לשיתוף החברים</p>
      <input id="newgname" maxlength="30" placeholder="שם הקבוצה (למשל: החברים של יובל)">
      <button id="createg">צור קבוצה</button>
      <div class="err" id="createerr"></div>
    </div>
    <div class="or">או</div>
    <div class="gcard">
      <h2>הצטרפות לקבוצה 🔑</h2>
      <p>הקלידו את הקוד בן 7 התווים שקיבלתם</p>
      <input id="joincode" maxlength="7" placeholder="למשל: KX7Q2MZ" style="text-transform:uppercase">
      <button id="joing">הצטרף</button>
      <div class="err" id="joinerr"></div>
    </div>
    <div class="or">או</div>
    <div class="gcard">
      <h2>הימור בלי קבוצה 🗳️</h2>
      <p>ההימור שלך יופיע בעמוד הכללי של כל המהמרים</p>
      <button id="nogroup">מהמרים בלי קבוצה</button>
    </div>
  </div>
</div>

<div id="main" class="hidden">
<div class="tabs">
  <button id="tab-bet" class="active">מהמרים 🎲</button>
  <button id="tab-stats">השוואה 📊</button>
</div>

<div class="wrap" id="view-bet">
  <div class="counter">
    <div class="nums"><span>חולקו: <span id="used">0</span>/120</span><span id="left">נותרו 120</span></div>
    <div class="bar" id="bar"><div class="seg-r" style="width:0%"></div><div class="seg-c" style="width:0%"></div><div class="seg-a" style="width:0%"></div><div class="seg-h" style="width:0%"></div><div class="seg-m" style="width:0%"></div></div>
    <div class="blocstrip" id="blocstrip"></div>
  </div>
  <div class="pollbox">
    <div class="ptitle">🗞️ סקר לייחוס</div>
    <div class="polls" id="polls"></div>
    <div class="pollmeta" id="pollmeta"></div>
  </div>
  <div class="editmode hidden" id="editmode">✏️ עריכת ההימור שלך - מולא מההימור הקודם שלך במכשיר הזה
    <div style="margin-top:6px;font-weight:500">קישור עריכה אישי למכשיר אחר: <button type="button" id="copyedit" style="font-family:inherit;font-size:12.5px;font-weight:700;border:1px solid #d9c26a;background:#fff;color:#8a6d00;border-radius:8px;padding:2px 10px;cursor:pointer">העתק 🔗</button></div>
  </div>
  <div class="name-row">
    <input id="bettor" maxlength="24" placeholder="השם שלכם (כדי שיכירו את ההימור)">
  </div>
  <div id="cards"></div>
  <div id="countdown" class="cd"></div>
  <button class="submit" id="submit" disabled>חילקתם 120? שלחו את ההימור 🚀</button>
  <div class="msg" id="msg"></div>
</div>

<div class="wrap hidden" id="view-stats">
  <h2 id="stats-title">הקבוצה שלכם</h2>
  <div class="stat-cards" id="stat-cards"></div>
  <h3>ההימור הממוצע בקבוצה</h3>
  <div id="avg"></div>
  <h3>ההימורים בקבוצה <span id="bcount" style="font-size:14px;opacity:.6"></span></h3>
  <div id="bets"></div>
  <h2 style="margin-top:34px">🌍 כל הקבוצות</h2>
  <div class="stat-cards" id="gstat-cards"></div>
  <h3>ההימור הממוצע הכללי</h3>
  <div id="gavg"></div>
  <h3>כל ההימורים <span id="gbcount" style="font-size:14px;opacity:.6"></span></h3>
  <div id="gbets"></div>
</div>
</div>

<footer>
  המפלגות והאותיות לפי <a href="https://www.gov.il/he/pages/candidates-lists-26">ועדת הבחירות המרכזית לכנסת ה-26</a> (27.9.26) ·
  כחול לבן הוסרה בעקבות פרישת גנץ (19.10.26)<br>
  מקורות הסקרים: <span id="pollsources"></span><br>
  הקוד פתוח ב-<a href="https://github.com/YuvalHir/knesset26-bets">GitHub</a>
</footer>

<script>
const PARTIES = ${JSON.stringify(PARTIES)};
const POLLS = ${JSON.stringify(POLLS)};
const GENERAL = ${JSON.stringify(GENERAL)};
function jerusalemUtcMs(y, mo, d, h, mi) {
  const guess = Date.UTC(y, mo - 1, d, h, mi) - 2 * 3600e3;
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(p => p.type !== "literal").map(p => [p.type, +p.value]));
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return guess + (Date.UTC(y, mo - 1, d, h, mi) - localAsUtc);
}
const BET_CLOSE = jerusalemUtcMs(2026, 10, 27, 21, 59);
const CLOSE_STR = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(BET_CLOSE);
const $ = (s) => document.querySelector(s);
const state = {};
PARTIES.forEach(p => state[p.id] = 0);
const LOGOS = {
  ch12: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iMTA3NS4wMzFweCIgaGVpZ2h0PSIxOTIuNDA0cHgiIHZpZXdCb3g9IjAgMCAxMDc1LjAzMSAxOTIuNDA0IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAxMDc1LjAzMSAxOTIuNDA0Ig0KCSB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxyZWN0IGZpbGw9IiM4RDAwMDEiIHdpZHRoPSIxMDc1LjAzMSIgaGVpZ2h0PSIxOTIuNDA0Ii8+DQoJPGc+DQoJCTxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik0xNDQuMjgxLDQ1LjI3OWMtMTYuNTQ2LDAtMjUuNzUzLDIuMDQ5LTM3LjE4Myw0LjQzOHY1OS44NThjMCw5Ljg5My0yLjM4OCwxMy45ODItOS4zOCwxMy45ODINCgkJCWMtMy43NDksMC00Ljk0My0wLjE2NC04LjAxMi0wLjg0NmwtMC4xNzMsMjAuODAzYzMuMjQzLDEuNTM0LDEwLjIzNCwyLjcyOCwxNy40LDIuNzI4YzE5LjQ0MiwwLjE3NSwyNy42MjctMTEuOTM2LDI3LjYyNy0zMi43NDMNCgkJCWwtMC4xNzMtNDUuNTM2YzMuNDEtMC4xNzMsNi44MjUtMC4zNCw5LjcyMS0wLjM0YzEzLjk4NCwwLDE4LjkzNSw1LjI4NSwxOC45MzUsMTcuMDU0djU5LjY5MWgyNy40NTRWODQuNjc3DQoJCQlDMTkwLjQ5Nyw1NS42ODcsMTcyLjI1LDQ1LjI3OSwxNDQuMjgxLDQ1LjI3OXoiLz4NCgkJPHJlY3QgeD0iMjA1LjgyNyIgeT0iNDcuMTU1IiBmaWxsPSIjRkZGRkZGIiB3aWR0aD0iMjcuMjg4IiBoZWlnaHQ9Ijk3LjIxMyIvPg0KCQk8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMzMwLjE5NSw5MS4zMjhjMCwyMC40NjgtOC42OTMsMzIuOTE4LTI4LjEzNCwzMi45MThjLTEwLjc1LDAtMTguMjU1LTQuMjY0LTIyLjg1OC0xMS40Mw0KCQkJYzI2Ljk0OC0zLjA2OCwzNy4xODEtMTMuNjQyLDM3LjE4MS0zNy44NlY0Ny4xNTVoLTI3LjEyMXYyNy44MDFjMCwxMi43ODgtMy4yMzYsMTcuNTY2LTE1LjM0NSwxOC43NTl2LTIuMzg3VjQ3LjE1NWgtMjcuMTINCgkJCXY0Mi4yOTljMCwzNi44MzMsMjAuMTI5LDU2Ljc4OCw1NS4yNjMsNTYuNzg4YzM1LjEyNSwwLDU1LjI1NC0xOS45NTUsNTUuMjU0LTU2Ljc4OFY0Ny4xNTVoLTI3LjEyVjkxLjMyOHoiLz4NCgkJPHBvbHlnb24gZmlsbD0iI0ZGRkZGRiIgcG9pbnRzPSIzNzQuNDczLDY5LjQ5NyA0MTYuNzcxLDY5LjQ5NyA0MTYuNzcxLDE0NC4zNjggNDQ0LjA1OSwxNDQuMzY4IDQ0NC4wNTksNjkuNDk3IDQ1Ny43MDMsNjkuNDk3IA0KCQkJNDU3LjcwMyw0Ny4xNTUgMzc0LjQ3Myw0Ny4xNTUgCQkiLz4NCgkJPHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0iTTUwOC44MDYsNDUuMjc5Yy0xNy45MDcsMC0yNy4xMTMsMi4wNDktMzguNTQzLDQuNDM4djk0LjY1MWgyNy40NjJWNjcuOTYzDQoJCQljMy41ODMtMC4xNzMsNy4zMzEtMC4zNCwxMC45MTQtMC4zNGMxNS4zNDUsMCwyMC4yODgsNS4yODUsMjAuMjg4LDE3LjA1NHY1OS42OTFoMjcuNDdWODQuNjc3DQoJCQlDNTU2LjM5Niw1NS42ODcsNTM4LjEzNCw0NS4yNzksNTA4LjgwNiw0NS4yNzl6Ii8+DQoJCTxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik02MDUuODcyLDQ1LjI3OWMtMTYuMjA0LDAtMjQuODk3LDEuODc2LTM2LjE0Niw0LjA5N3YyMi4xN2M2LjQ3MS0xLjE5MywyMy4xOTEtMy45MjMsMzUuOTgxLTMuOTIzDQoJCQljMTUuMTc4LDAsMTkuOTUzLDUuMjg1LDE5Ljk1MywxNy4wNTR2NTkuNjkxaDI3LjQ1NFY4NC42NzdDNjUzLjExNSw1NS42ODcsNjM1LjAzNiw0NS4yNzksNjA1Ljg3Miw0NS4yNzl6Ii8+DQoJCTxyZWN0IHg9IjU2OS43MjciIHk9IjkzLjIwMiIgZmlsbD0iI0ZGRkZGRiIgd2lkdGg9IjI3LjQ1NCIgaGVpZ2h0PSI1MS4xNjYiLz4NCgkJPHJlY3QgeD0iNzA3LjE4NSIgeT0iNDUuMjc5IiBmaWxsPSIjRkZGRkZGIiB3aWR0aD0iMjc3LjQ4NyIgaGVpZ2h0PSI0MC42ODQiLz4NCgkJPHJlY3QgeD0iNzA3LjE4NSIgeT0iMTA0LjY4NSIgZmlsbD0iI0ZGRkZGRiIgd2lkdGg9IjI3Ny40ODciIGhlaWdodD0iNDAuNjg0Ii8+DQoJPC9nPg0KPC9nPg0KPC9zdmc+DQo=",
  ch13: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTA5IiB2aWV3Qm94PSIwIDAgODAgMTA5IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0zLjQ1MjY0IDgxLjA0NDJIMjAuOTQ2N1YwLjAwMjkyOTY5SDcuMTE3ODZDNS4wOTQ2OCAwLjAwOTI2NDUxIDMuNDU1ODIgMS42NDM1OSAzLjQ1NTgyIDMuNjYxMjNWODEuMDQ0MkgzLjQ1MjY0WiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjxwYXRoIGQ9Ik01OS41MTcyIDQ2LjUxOTRDNjEuMzg0OCA0OC40MTY3IDYyLjUzNzcgNTEuMDE3MiA2Mi41Mzc3IDUzLjg4MzdDNjIuNTM3NyA1OS42OTU5IDU3LjgxMTcgNjQuNDA5IDUxLjk4MzUgNjQuNDA5QzQ2LjE1NTMgNjQuNDA5IDQxLjU3NTQgNTkuODM1MiA0MS40MzU2IDU0LjE0MzNIMjMuOTcwMkMyNC4xMSA2OS40NTQ2IDM2LjU5ODQgODEuODIzNCA1MS45ODM1IDgxLjgyMzRDNjcuMzY4NiA4MS44MjM0IDgwIDY5LjMxNTMgODAgNTMuODgzN0M4MCA0Ni4yMDU5IDc2Ljg5MDUgMzkuMjUzNCA3MS44NjU5IDM0LjIwNDZMNTkuNTE3MiA0Ni41MTk0WiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjxwYXRoIGQ9Ik03OC4xOTU4IDBIMjQuODUzVjE2LjY0MTZINzguMTk1OFYwWiIgZmlsbD0iI0VDMUY4MCI+PC9wYXRoPjxwYXRoIGQ9Ik02MS40OTU5IDE2LjY0MTNMNDQuODU2MyAzMy4yMzU0QzQzLjcyMjQgMzQuMzY2MSA0My43MjI0IDM2LjE5NjggNDQuODU2MyAzNy4zMjQ0TDU0LjYwMzcgNDcuMDQ1M0w3OC4xOTU5IDIzLjUxNzdWMTYuNjM4Mkg2MS40OTU5VjE2LjY0MTNaIiBmaWxsPSIjMDAxMDRCIj48L3BhdGg+PHBhdGggZD0iTTUwLjQ0NjMgODUuOTM0NlYxMDAuNzM2QzUwLjQ0NjMgMTAyLjIyNSA0OS4yMzMgMTAzLjQzNSA0Ny43NDAzIDEwMy40MzVINDUuMTA3M1Y4NS45NTAzTDM4Ljg0NzIgODUuOTM0NlYxMDMuNDM1SDMzLjU3MTZWODUuOTUwM0wyNy4zMTE1IDg1LjkzNDZWMTA4Ljk5M0w0OC4yNTggMTA5QzUyLjkxNzMgMTA5IDU2LjcwOTYgMTA1LjIxNSA1Ni43MDk2IDEwMC41NjhWODUuOTUzNkw1MC40NDk1IDg1LjkzNzdMNTAuNDQ2MyA4NS45MzQ2WiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjxwYXRoIGQ9Ik03NS43NTAyIDg1LjkzNDZINTkuMTMyOFY5MS41MDZINzEuNTM1NVYxMDguOTlINzcuNzk1NlY4Ny45NzQ0Qzc3Ljc5NTYgODYuODQ5OSA3Ni44Nzc4IDg1LjkzNDYgNzUuNzUwMiA4NS45MzQ2WiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjxwYXRoIGQ9Ik0yMi42MDEyIDg1LjkzNTFMMy40NjE5NyA4NS45Mjg3QzMuNDQ5MjYgODkuMzQgMy40NTU2MSA5OS4wNDUgMy40NTU2MSAxMDIuNDU2QzMuNDU1NjEgMTAzLjAyIDMuMzM4MDkgMTAzLjEyOCAyLjc1Njg2IDEwMy4xMjVIMFYxMDguOTU2QzEuNDUxNDggMTA4Ljk0MyAzLjMyNTM4IDEwOC45NjggNC43NzY4NiAxMDguOTM3QzUuMjMxMDUgMTA4LjkyNyA1LjY5NDc2IDEwOC44MzUgNi4xMjk4OSAxMDguNzAyQzcuOTM3MSAxMDguMTUxIDkuOTA2MjkgMTA2LjA4OSA5Ljg0NTk0IDEwMy40OTJWOTEuNTA2NUgxOC4zODY1VjEwOC45OTFIMjQuNjQ2NlY4Ny45NzQ4QzI0LjY0NjYgODYuODUwNCAyMy43Mjg3IDg1LjkzNTEgMjIuNjAxMiA4NS45MzUxWiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjwvc3ZnPg==",
  ch14: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMzQ0LjggMTA1LjQiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDM0NC44IDEwNS40IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxyZWN0IHg9IjExLjkiIHk9IjE2LjQiIGZpbGw9IiNGRkZGRkYiIHdpZHRoPSI2My44IiBoZWlnaHQ9IjUxLjciLz4NCgk8Zz4NCgkJPHBvbHlnb24gZmlsbD0ibm9uZSIgcG9pbnRzPSI2Ny42LDQxLjIgNTkuMyw0MS4yIDU5LjMsNDggNDcuNCw0OCA2MS45LDIwLjUgNTEuOSwyMC41IDM1LjgsNDkuNSAzNS44LDU1LjMgNTkuMyw1NS4zIDU5LjMsNjMuMiANCgkJCTY3LjYsNjMuMiA2Ny42LDU1LjMgNzIuMSw1NS4zIDcyLjEsNDggNjcuNiw0OCAJCSIvPg0KCQk8cG9seWdvbiBmaWxsPSJub25lIiBwb2ludHM9IjE1LjMsMjMuOCAxNS4zLDMxIDIyLjYsMzAgMjIuNiw2My4yIDMxLjgsNjMuMiAzMS44LDIwLjUgMjQuOCwyMC41IAkJIi8+DQoJCTxwYXRoIGZpbGw9IiNFMjFGMjYiIGQ9Ik00My4zLDBDMTkuNCwwLDAsMTkuNCwwLDQzLjNzMTkuNCw0My4zLDQzLjMsNDMuM2MyMy45LDAsNDMuMy0xOS40LDQzLjMtNDMuM1M2Ny4xLDAsNDMuMywweiBNMzEuOCw2My4yDQoJCQloLTkuMlYzMGwtNy4zLDF2LTcuMmw5LjUtMy4zaDdWNjMuMnogTTcyLjEsNTUuM2gtNC41djcuOGgtOC4zdi03LjhIMzUuOHYtNS44bDE2LjItMjloMTBMNDcuNCw0OGgxMS44di02LjhoOC4zVjQ4aDQuNVY1NS4zeiIvPg0KCQk8cGF0aCBmaWxsPSIjMTQxNTMzIiBkPSJNMzQ0LjgsNDIuNlY4MmMwLDMuNi0wLjUsNi45LTEuNSw5LjdjLTEsMi44LTIuNSw1LjItNC41LDcuMmMtMiwyLTQuNiwzLjUtNy43LDQuNQ0KCQkJYy0zLjEsMS02LjgsMS41LTExLjEsMS41aC0zMlY4OC44aDkuN2wtNy43LTQ2LjNoMjAuM2w3LjUsNDYuM2gyLjFjMS42LDAsMi44LTAuNSwzLjQtMS41YzAuNy0xLDEtMi42LDEtNVY0Mi42SDM0NC44eg0KCQkJIE0yNzkuMSw0Ny4xYy0xLjgtMS43LTQuMS0yLjgtNi44LTMuNWMtMi44LTAuNy02LjEtMS05LjktMWgtMjcuNXYxNi4xSDI2MWMwLjgsMCwxLjQsMC42LDEuNCwxLjR2MjYuNWMwLDEuMi0xLDIuMi0yLjIsMi4yDQoJCQloLTI1LjJ2MTYuMWgyNy41YzMuNywwLDYuOS0wLjQsOS43LTEuMWMyLjctMC43LDUtMS45LDYuOS0zLjZjMS44LTEuNywzLjItNCw0LjEtNi45YzAuOS0yLjksMS4zLTYuNSwxLjMtMTAuOFY3MnYtNy4xDQoJCQljMC00LjQtMC40LTgtMS4zLTEwLjlDMjgyLjIsNTEsMjgwLjksNDguOCwyNzkuMSw0Ny4xeiBNMjA4LDgzLjJjMCwxLjMtMC4xLDIuNC0wLjMsMy4yYy0wLjIsMC44LTAuNSwxLjUtMC45LDEuOQ0KCQkJYy0wLjQsMC40LTAuOSwwLjgtMS41LDAuOWMtMC42LDAuMi0xLjMsMC4yLTIuMSwwLjJoLTQuNlY0Mi42aC0xOC45djQ2LjhoLTVjLTAuOCwwLTEuNS0wLjEtMi4xLTAuMmMtMC42LTAuMi0xLTAuNS0xLjQtMC45DQoJCQljLTAuNC0wLjQtMC42LTEuMS0wLjgtMS45Yy0wLjItMC44LTAuMy0xLjktMC4zLTMuMlY0Mi42aC0xOS42djQwLjZjMCw0LjEsMC42LDcuNSwxLjcsMTAuM2MxLjEsMi44LDIuOCw1LjEsNC45LDYuOQ0KCQkJYzIuMiwxLjgsNC45LDMuMSw4LjEsMy45YzMuMywwLjgsNywxLjIsMTEuMywxLjJoMjVjMy45LDAsNy41LTAuNCwxMC43LTEuM2MzLjItMC45LDUuOS0yLjIsOC4yLTRjMi4zLTEuOCw0LTQuMSw1LjMtNi45DQoJCQljMS4yLTIuOCwxLjktNi4yLDEuOS0xMC4xVjQyLjZIMjA4VjgzLjJ6IE0xMjIuNyw4MC4xSDE0M1Y0Mi42aC0yMC4zVjgwLjF6IE05NC43LDEwNC45aDIwLjJWNDIuNkg5NC43VjEwNC45eiIvPg0KCTwvZz4NCjwvZz4NCjwvc3ZnPg0K",
  kan: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNzgzLjggMzAzLjciPgogIDxnPgogICAgPHJlY3QgeD0iMjQzLjgiIHdpZHRoPSI0My45IiBoZWlnaHQ9IjMwMy43Ii8+CiAgICA8cmVjdCB4PSIzNjcuMiIgeT0iMzMuNyIgd2lkdGg9IjQzLjkiIGhlaWdodD0iMjAyLjciLz4KICAgIDxwYXRoIGQ9Ik02ODIuNiAzMy44aC00OXY0My45aDQ5YzMxLjYgMCA1Ny4zIDI1LjcgNTcuMyA1Ny4yIDAgMzEuOC0yNS43IDU3LjgtNTcuMyA1Ny44aC00OXY0My45aDQ5YzU1LjggMCAxMDEuMi00NS42IDEwMS4yLTEwMS42IDAtNTUuOS00NS40LTEwMS4yLTEwMS4yLTEwMS4yeiIvPgogICAgPHBvbHlnb24gcG9pbnRzPSI1NzAuOCA1Ni43IDUzOS4yIDI1LjEgNDMxLjIgMTMyLjkgNTQzIDI0NC43IDU3NC43IDIxMyA0OTQuNSAxMzIuOSIvPgogICAgPHBhdGggZD0iTTAgNjUuOHYyNS43aDMzLjZ2MTM4LjFoMzcuNVYzNC45SDQxLjhDMzYuNiA1My4yIDIwLjggNjUgMCA2NS44eiIvPgogICAgPHBhdGggZD0iTTExNC42IDY1Ljh2MjUuN2gzMy42djEzOC4xaDM3LjVWMzQuOWgtMjkuM2MtNS4yIDE4LjMtMjEgMzAuMS00MS44IDMwLjl6Ii8+CiAgPC9nPgo8L3N2Zz4K",
  i24: "data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjIyMy42MDY3OTgiIHZpZXdCb3g9IjAgMCAxNS45Mzk1NTcgNy45NDI3OTE3IiB3aWR0aD0iNDQ3LjIxMzU5NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGNsaXBQYXRoIGlkPSJhIj48cGF0aCBkPSJtOTU0LjY4NSA2My4yMzZoNzYuNTM1djcwLjg2NmgtNzYuNTM1eiIvPjwvY2xpcFBhdGg+PHBhdGggZD0ibTAgMGgtNDAuMjAzbDQuMjMxIDIxLjc2NWg0MC4yMDJ6IiBmaWxsPSIjMTMyNTQ0IiB0cmFuc2Zvcm09Im1hdHJpeCguMzUyNzc3NzcgMCAwIC0uMzUyNzc3NzcgMTQuMzE1MDE2IDcuODEwNSkiLz48ZyBmaWxsPSIjZmZmIj48cGF0aCBkPSJtMCAwLS44MTUgMS4zOTZoLS42ODNsLS41MTMtMi42NzdoLjcyNGwuMjgyIDEuNDQ4Ljg0Ni0xLjQ0OGguNjQxbC41MTQgMi42NzdoLS43MjV6IiB0cmFuc2Zvcm09Im1hdHJpeCguMzUyNzc3NzcgMCAwIC0uMzUyNzc3NzcgNC42MDI0MDEgNi4zNDk3OCkiLz48cGF0aCBkPSJtMCAwaDIuMTQzbC4xMjEuNjU1aC0xLjQxOWwuMDgyLjQzMWgxLjI2N2wuMTEyLjU4aC0xLjI2N2wuMDc4LjM1NWgxLjM5OWwuMTIxLjY1NmgtMi4xMjR6IiB0cmFuc2Zvcm09Im1hdHJpeCguMzUyNzc3NzcgMCAwIC0uMzUyNzc3NzcgNS4wMDg1ODkgNi44MDE3NikiLz48cGF0aCBkPSJtMCAwLS43NTctMS41MzEtLjIxMSAxLjUzMWgtLjYzbC0uODA3LTEuNTMxLS4xNjQgMS41MzFoLS43NzNsLjM2Ni0yLjY3N2guNjM3bC44MjQgMS41MjEuMjM2LTEuNTIxaC42MzhsMS4zOTkgMi42Nzd6IiB0cmFuc2Zvcm09Im1hdHJpeCguMzUyNzc3NzcgMCAwIC0uMzUyNzc3NzcgNy4yNTEzMjYgNS44NTc0OCkiLz48ZyBjbGlwLXBhdGg9InVybCgjYSkiIHRyYW5zZm9ybT0ibWF0cml4KC4zNTI3Nzc3NyAwIDAgLS4zNTI3Nzc3NyAtMzQyLjg4NTI4NCAzOC42OTgwNSkiPjxwYXRoIGQ9Im0wIDBjLjAxOS4wOTUuMTIuMTcuMjk3LjE3LjIzNCAwIC40OC0uMDkxLjY4OS0uMjYxbC40NjYuNTE4Yy0uMjQyLjIyOS0uNTY5LjM1LTEuMDE4LjM1LS42MzQgMC0xLjA5MS0uMzU0LTEuMTg2LS44NDRsLS4wMDItLjAwOGMtLjEwNS0uNTQzLjI5Ny0uNzAxLjgzNS0uODMuMzQyLS4wODMuNDE3LS4xNDQuMzk2LS4yNTNsLS4wMDItLjAwN2MtLjAyMi0uMTEzLS4xNDEtLjE4Mi0uMzM3LS4xODItLjMwNSAwLS41NzUuMTEtLjc5NC4zMThsLS41MDItLjQ4OGMuMjY3LS4yOS42ODQtLjQzNyAxLjE1Mi0uNDM3LjY0MSAwIDEuMTMuMzIxIDEuMjM1Ljg2bC4wMDEuMDA4Yy4wOTYuNDk0LS4yNDMuNjktLjgyNS44MjItLjM0OS4wODMtLjQzLjEzNi0uNDA2LjI1NnoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk5NC4xNDUxIDkyLjM0MDQpIi8+PHBhdGggZD0ibTAgMCA0LjY0NiA1LjA4Ni0uOTg5LTUuMDg2em04LjMzLS4wMDRoLTEuODA4bDEuODA2IDkuMzAzaC0uNzkzLTIuMDctLjc5M2wtOC40ODEtOS4zMDNoLTcuODY5Yy4yNzYgMS4wMSAxLjExMiAxLjgwMyAyLjM0NyAxLjgwM2gzLjcwMmMyLjA1MSAwIDMuNzIxIDEuNjkxIDMuNzIxIDMuNzUgMCAyLjA1OC0xLjY3IDMuNzUtMy43MjEgMy43NWgtNy4xODJsLS41NDYtMi44MTNoNy43MjhjLjQ5MiAwIC45MDgtLjQzOC45MDgtLjkzN3MtLjQxNi0uOTM4LS45MDgtLjkzOGgtMy43MDJjLTIuNTc2IDAtNC43NDQtMS44NTgtNS4yNy00LjU0NmwtLjQxNS0yLjE5MmMtLjI5NC0uMzE4LTEuNzQ1LTEuODUyLTIuMjU1LTEuNjc1LS4yMzUuMDgyLS4yMTIuNDYxLS4xOS42MjVsMS42NTMgOC41MWgtMy4xMTVzLTEuNTIxLTcuODIzLTEuNTM3LTcuOTA3Yy0uMzA2LTEuNTA0LS41NzItMi44OTMtLjIyOC0zLjYwOCAxLjA5My0yLjI3NiA0LjgxNCAyLjI4NCA1LjY2MSAzLjM2NmgxOC4xMzhsLS41NDctMi44MTRoMS44OTVjLjU2NCAwIDEuMDQ4LjQgMS4xNTUuOTUzbC4zNjIgMS44NjFoMS44MDd6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5OTguMzE3NSA5Ny4wNTkyKSIvPjxwYXRoIGQ9Im0wIDBoLTEuMTg3Yy0xLjEyIDAtMi4wODMtLjc5LTIuMjk2LTEuODlsLS4xNzktLjkxN2gzLjExNXoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk4My4yODM4IDEwNi4zNikiLz48L2c+PC9nPjwvc3ZnPg==",
  walla: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNS4wLjIsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iMTczNi4yMzhweCIgaGVpZ2h0PSI1MDguODAxcHgiIHZpZXdCb3g9IjAgMCAxNzM2LjIzOCA1MDguODAxIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAxNzM2LjIzOCA1MDguODAxIg0KCSB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTE3OC40NjQsOTQuODkyYzkuNjQyLTUuMTIxLDE3LjI0NC0yLjg2MiwyMi44MTgsNi43NzhsODYuOTgzLDE2MC40MTUNCglsMzUuMjQ5LTEzOC4yNzNjMy40NjQtMTIuNjUxLDEwLjg0My0xOC45NzcsMjIuMTM5LTE4Ljk3N2g2MS45MDZsOS4wMzgsMy42MTRsMi4yNTksMTQuNjg2bC00MS4xMTgsMTY0LjkzMw0KCWMtMy42MTgsMTIuMTk3LTEwLjk5NiwxOC4zLTIyLjE0MywxOC4zaC00Mi4wMjJsNjkuMzU5LDEyMC42NDljNC42NjksOS4xODgsMi40MDksMTYuNTY1LTYuNzc4LDIyLjEzOWwtNTEuMDYsMjguMjQxDQoJYy05Ljc5Miw1LjEyMy0xNy4xNywzLjA4OS0yMi4xNDQtNi4wOTlsLTg3Ljg4NC0xNTkuNzM3bC0zNC4zNDUsMTM3LjU5NGMtMy42MTQsMTIuMjAxLTEwLjk5NiwxOC4zLTIyLjEzOSwxOC4zaC02Mi41ODYNCglsLTguNTgzLTMuODRjLTMuNDY0LTMuNjEzLTQuNDQzLTguMjA3LTIuOTM4LTEzLjc4bDQyLjAyMi0xNjUuNjExYzMuMDE0LTEyLjIwMSwxMC4zOTItMTguMjk5LDIyLjE0My0xOC4yOTloNDEuMTE4bC02Ny43NzktMTE5Ljk3DQoJYy02LjE3NC0xMC4yNDQtNC40NDQtMTcuODUsNS4xOTgtMjIuODJMMTE3OC40NjQsOTQuODkyeiBNMTQ4OC40NDYsMTIzLjgxMWMzLjAxLTEyLjY1MSwxMC4zOTMtMTguOTc3LDIyLjE0LTE4Ljk3N2g2MS45MDYNCglsOS4wMzcsMy42MTRjMy4wMTQsMy42MTYsMy43NjQsOC41MSwyLjI2LDE0LjY4NmwtMjYuNjYyLDEwNC42MDZ2MjIxLjQxNGMwLDEyLjIwMS01Ljg3NCwxOC4zLTE3LjYyLDE4LjNoLTU4Ljc0Mw0KCWMtMTEuNzUxLDAtMTcuNjI0LTYuMDk5LTE3LjYyNC0xOC4zVjIzOS4wMzZjMC0xMS4xNDQsMS4yNzktMjEuMzExLDMuODQ0LTMwLjUwMUwxNDg4LjQ0NiwxMjMuODExeiBNMTYxOC4xMjgsMjA4LjUzNQ0KCWwyMS40NjMtODQuNzI1YzMuNjE5LTEyLjY1MSwxMC45OTctMTguOTc3LDIyLjE0NC0xOC45NzdoNjIuNTgxbDguMzYyLDMuNjE0YzMuMTY0LDMuNjE2LDQuMjE5LDguNTEsMy4xNjQsMTQuNjg2bC0yNi42NjEsMTA0LjYwNg0KCXYyMjEuNDE0Yy0wLjYwNSwxMi4yMDEtNi40NzksMTguMy0xNy42MjUsMTguM2gtNTguNzQyYy0xMS43NDcsMC0xNy42Mi02LjA5OS0xNy42Mi0xOC4zVjIzOS4wMzZMMTYxOC4xMjgsMjA4LjUzNXoNCgkgTTUyNS41MTksMTIzLjEzM2MwLTEyLjE5OSw1Ljg3NS0xOC4zLDE3LjYyNS0xOC4zaDIxMy4wNTRjMTEuNTk3LDAsMTcuMzk3LDYuMzI2LDE3LjM5NywxOC45Nzd2MzI1LjM0Mw0KCWMwLDEyLjIwMS01LjgwMSwxOC4zLTE3LjM5NywxOC4zaC01OC45N2MtMTEuNTk3LDAtMTcuMzk1LTYuMDk5LTE3LjM5NS0xOC4zVjE4My40NThINTQzLjE0M2MtMTEuNzQ5LDAtMTcuNjI1LTUuODczLTE3LjYyNS0xNy42MjINCglWMTIzLjEzM3ogTTk0My4yNjksMy44NDFjMy4wMTQsMy42MTQsMy43NjQsOC4yMSwyLjI1OSwxMy43ODFsLTIyLjE0Myw4Ny4yMTFoMTQwLjUzMmw5LjAzOCwzLjYxNGwyLjI1OSwxNC42ODZsLTgzLjgyLDMyNi4wMjENCgljLTMuNjE4LDEyLjIwMS0xMS4yOTYsMTguMy0yMy4wNDgsMTguM0g5MDYuNDRsLTkuMDM3LTMuODRjLTMuMDEtMy42MTMtMy43NjQtOC4yMDctMi4yNi0xMy43OGw2OC42ODUtMjY2LjM3Nkg4MjMuOTc3bC04LjM2LTMuODQxDQoJYy0zLjQ2NC0zLjYxNC00LjQ0My04LjIwOC0yLjkzNy0xMy43ODFsMzYuNjAyLTE0Ni42MzFDODUyLjI5Myw2LjQwMyw4NTkuODk5LDAsODcyLjEsMGg2MS45MDZMOTQzLjI2OSwzLjg0MXogTTE2NC45MzEsMjI0LjU3OA0KCWwyOS44MjQsMTAzLjkyN2w1LjQyMSwxMi4yMDFjMi41NjIsMy4wMTQsNi44NTUsNC41MTksMTIuODc5LDQuNTE5aDMzLjY2NWM5LjE4OCwwLDE1LjA2MS01LjU3NCwxNy42MjMtMTYuNzJsMjQuNC0xMTcuNzENCglsMjcuNTY0LTg2LjMwNWMxLjUwNy00LjUxOSwwLjk3OS04LjU4Ny0xLjU4Mi0xMi4yMDFsLTkuMjYyLTUuMTk2aC05OS4xODZjLTExLjE0NiwwLTE4LjI5OSw1LjU3My0yMS40NjMsMTYuNzE4bC0xOC4zLDY4LjAwNw0KCUMxNjMuMDQ5LDIwNC40NjksMTYyLjUyMSwyMTUuMzkxLDE2NC45MzEsMjI0LjU3OHogTTIyOS4wOTcsNTAuNjFjNjMuMjYxLDAsMTE3LjI1OCwyMi4zNjYsMTYxLjk5Miw2Ny4xMDMNCgljNDQuNzM3LDQ0LjczNCw2Ny4xMDMsOTguNzMsNjcuMTAzLDE2MS45OTJjMCw2My4xMTEtMjIuMzY2LDExNy4wMzUtNjcuMTAzLDE2MS43NjdjLTQ0LjczNCw0NC44ODctOTguNzMsNjcuMzMtMTYxLjk5Miw2Ny4zMw0KCWMtNjMuMTExLDAtMTE3LjAzNS0yMi40NDMtMTYxLjc2OS02Ny4zM0MyMi40NDMsMzk2LjczOSwwLDM0Mi44MTUsMCwyNzkuNzA0YzAtNjMuMjYxLDIyLjQ0My0xMTcuMjU4LDY3LjMyOC0xNjEuOTkyDQoJQzExMi4wNjIsNzIuOTc2LDE2NS45ODUsNTAuNjEsMjI5LjA5Nyw1MC42MXogTTI0Mi4yLDQ2NS4xOTRjMTIuMTk5LDAsMTkuNTgtNi4wOTksMjIuMTQxLTE4LjNsMTMuNzgxLTU2LjQ4Mg0KCWMxLjUwNy02LjE3NCwwLjc1NS0xMC43NjgtMi4yNTktMTMuNzgxYy0yLjU1OS0yLjU2LTUuNjQ4LTMuODM5LTkuMjYyLTMuODM5aC02Ni40MjVjLTEyLjE5OSwwLTE5LjU3OSw2LjA5OC0yMi4xNDEsMTguMjk5DQoJbC0xMy43ODEsNTYuNDgzYy0xLjUwNyw1LjU3My0wLjc1NCwxMC4xNjcsMi4yNTksMTMuNzgxbDkuMjYzLDMuODM5SDI0Mi4yeiBNNTkwLjM2Miw0NDkuMTU0DQoJYy0zLjAxMiwxMi4yMDEtMTAuMzkyLDE4LjMtMjIuMTQxLDE4LjNoLTYxLjkwNmwtOS4wMzgtMy44NGMtMy4xNjItMy42MTMtMy45MTYtOC4yMDctMi4yNTktMTMuNzhsNDEuMTItMTY1LjYxMQ0KCWMzLjYxNi0xMi4yMDEsMTAuOTk3LTE4LjI5OSwyMi4xNDEtMTguMjk5aDYyLjU4NGMzLjE2NCwwLDUuOTUsMS4yNzksOC4zNiwzLjgzOWMzLjE2NCwzLjQ2NCw0LjIxNiw3Ljk4MywzLjE2NCwxMy41NTYNCglMNTkwLjM2Miw0NDkuMTU0eiIvPg0KPC9zdmc+DQo="
};
let poll = null;
let group = null; // {code, name}

function total() { return Object.values(state).reduce((a,b)=>a+b,0); }
function pollSeats(id) { return poll ? (poll.seats[id] || 0) : 0; }

// ===== קבוצות =====
async function api(path, opts) { const r = await fetch(path, opts); return { ok: r.ok, status: r.status, data: await r.json().catch(()=>({})) }; }

async function enterGroup(g) {
  group = g;
  localStorage.setItem("groupCode", g.code);
  localStorage.setItem("groupName", g.name);
  $("#gname").textContent = g.name + " · " + g.code;
  $("#groupbar").classList.add("show");
  $("#view-gate").classList.add("hidden");
  $("#main").classList.remove("hidden");
  history.replaceState(null, "", "?g=" + g.code);
  loadMyBet();
}

// זיהוי חוזר: אם במכשיר הזה כבר הימרו בקבוצה הזו - ממלאים את ההימור הקודם לעריכה
async function loadMyBet() {
  const stored = getStoredBet();
  const myName = stored && stored.name;
  if (!myName) return;
  try {
    const r = await api("/api/bets?code=" + encodeURIComponent(group.code));
    const mine = (((r.data && r.data.bets) || [])).find(b => b.name === myName);
    if (!mine) return;
    PARTIES.forEach(p => state[p.id] = mine.parties[p.id] || 0);
    $("#bettor").value = myName;
    render();
  } catch (e) {}
}
function leaveGroup() {
  group = null;
  localStorage.removeItem("groupCode"); localStorage.removeItem("groupName");
  $("#groupbar").classList.remove("show");
  $("#main").classList.add("hidden");
  $("#view-gate").classList.remove("hidden");
  history.replaceState(null, "", location.pathname);
}
$("#leavegroup").addEventListener("click", leaveGroup);
$("#copylink").addEventListener("click", async () => {
  const url = location.origin + "/?g=" + group.code;
  try { await navigator.clipboard.writeText(url); $("#copylink").textContent = "הועתק! ✅"; }
  catch { prompt("העתיקו את הקישור:", url); }
  setTimeout(() => $("#copylink").textContent = "העתק קישור לקבוצה 🔗", 1500);
});
$("#copyedit").addEventListener("click", async () => {
  const sb = getStoredBet();
  if (!sb) return;
  const url = myEditLink(sb.name, sb.token);
  try { await navigator.clipboard.writeText(url); $("#copyedit").textContent = "הועתק! ✅"; }
  catch { prompt("העתיקו את קישור העריכה האישי:", url); }
  setTimeout(() => $("#copyedit").textContent = "העתק 🔗", 1500);
});
$("#createg").addEventListener("click", async () => {
  const name = $("#newgname").value.trim();
  if (name.length < 2) { $("#createerr").textContent = "צריך שם לקבוצה"; return; }
  const r = await api("/api/group", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({name}) });
  if (!r.ok) { $("#createerr").textContent = "משהו השתבש, נסו שוב"; return; }
  enterGroup(r.data);
});
$("#nogroup").addEventListener("click", () => enterGroup(GENERAL));
$("#joing").addEventListener("click", async () => {
  const code = $("#joincode").value.trim().toUpperCase();
  if (code.length !== 7) { $("#joinerr").textContent = "הקוד בן 7 תווים"; return; }
  const r = await api("/api/group?code=" + encodeURIComponent(code));
  if (r.status === 404) { $("#joinerr").textContent = "לא נמצאה קבוצה עם הקוד הזה"; return; }
  enterGroup(r.data);
});

// כניסה אוטומטית: קוד בקישור או קבוצה שמורה
(async () => {
  const urlCode = new URLSearchParams(location.search).get("g");
  const saved = localStorage.getItem("groupCode");
  const code = (urlCode || saved || "").toUpperCase();
  const editTok = new URLSearchParams(location.search).get("edit");
  const editName = new URLSearchParams(location.search).get("n");
  if (code && editTok && editName) {
    localStorage.setItem("bet:" + code, JSON.stringify({ name: editName, token: editTok }));
    history.replaceState(null, "", "?g=" + code); // מסתיר את הטוקן משורת הכתובת
  }
  if (code) {
    const r = await api("/api/group?code=" + encodeURIComponent(code));
    if (r.ok) return enterGroup(r.data);
  }
  $("#view-gate").classList.remove("hidden");
})();

// ===== הימורים =====
function render() {
  const t = total(), left = 120 - t;
  $("#used").textContent = t;
  $("#left").textContent = left > 0 ? "נותרו " + left : (left === 0 ? "בדיוק 120! ✔" : "חריגה!");
  const blocs = blocSums(state);
  $("#blocstrip").innerHTML =
    '<span style="color:#1f4e9c">קואליציה <b>' + blocs.right + '/61' + (blocs.right >= 61 ? " ✔" : "") + '</b></span>' +
    '<span style="color:#c1121f">אופוזיציה <b>' + blocs.center + '</b></span>' +
    '<span style="color:#157347">ערביות <b>' + blocs.arab + '</b></span>' +
    '<span style="color:#4b5563">חרדי <b>' + blocs.haredi + '</b></span>' +
    '<span style="color:#8a7a2e">הנדל-זליכה <b>' + blocs.miluim + '</b></span>';
  const segs = $("#bar").children;
  segs[0].style.width = (blocs.right/120*100) + "%";
  segs[1].style.width = (blocs.center/120*100) + "%";
  segs[2].style.width = (blocs.arab/120*100) + "%";
  segs[3].style.width = (blocs.haredi/120*100) + "%";
  segs[4].style.width = (blocs.miluim/120*100) + "%";
  const storedBet = group ? getStoredBet() : null;
  const editing = storedBet && $("#bettor").value.trim() === storedBet.name;
  $("#editmode").classList.toggle("hidden", !editing);
  if (Date.now() < BET_CLOSE) $("#submit").textContent = editing ? "עדכון ההימור שלי ✏️" : "חילקתם 120? שלחו את ההימור 🚀";
  $("#submit").disabled = !(t === 120 && $("#bettor").value.trim().length >= 2);
  document.querySelectorAll(".card").forEach(c => {
    const id = c.dataset.id, v = state[id];
    c.querySelector("input[type=range]").value = Math.min(v, 40);
    c.querySelector(".num").value = v;
  });
  document.querySelectorAll(".pollref").forEach(el => {
    const s = pollSeats(el.dataset.id);
    el.textContent = poll ? (s ? ("סקר: " + s) : "מתחת לאחוז החסימה בסקר") : "";
  });
  fitSlips();
}

function setVal(id, v) {
  v = Math.max(0, Math.min(120, Math.round(v) || 0));
  const others = total() - state[id];
  if (others + v > 120) v = 120 - others; // חסימה קשיחה: אי אפשר לעבור 120
  state[id] = v;
  render();
}


function fitSlips() {
  document.querySelectorAll(".slip").forEach(slp => {
    const t = slp.querySelector(".tiny");
    if (!t) return;
    let fs = 9.5;
    t.style.fontSize = fs + "px";
    while (fs > 5.5 && slp.scrollHeight > slp.clientHeight) { fs -= 0.5; t.style.fontSize = fs + "px"; }
  });
}
if (document.fonts) {
  if (document.fonts.ready) { document.fonts.ready.then(() => fitSlips()); }
  document.fonts.addEventListener("loadingdone", () => fitSlips());
}
window.addEventListener("load", () => fitSlips());
setTimeout(fitSlips, 800);
setTimeout(fitSlips, 2500);

const cards = $("#cards");
PARTIES.forEach(p => {
  const el = document.createElement("div");
  el.className = "card"; el.dataset.id = p.id;
  el.style.setProperty("--pc", p.color);
  el.innerHTML =
    '<div class="slip"><div class="letters">' + p.letter + '</div><div class="tiny">' + p.official + '</div></div>' +
    '<div class="info"><div class="pname">' + p.name +
      (p.below ? '<span class="below">קרוב לאחוז החסימה</span>' : '') +
      '<span class="pollref" data-id="' + p.id + '"></span>' +
    '</div>' +
    '<div class="ctrl"><input type="range" min="0" max="40" value="0">' +
    '<input class="num" type="number" min="0" max="120" value="0"></div></div>';
  const range = el.querySelector("input[type=range]");
  const num = el.querySelector(".num");
  range.addEventListener("input", () => setVal(p.id, +range.value));
  num.addEventListener("input", () => setVal(p.id, +num.value));
  cards.appendChild(el);
});

function renderPollMeta() {
  $("#pollmeta").innerHTML = poll ? ("סקר " + poll.label + ", " + poll.date + ' · <a href="' + poll.src + '" target="_blank">מקור</a>') : "";
}
POLLS.forEach(pl => {
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.id = pl.id;
  b.title = pl.label;
  b.setAttribute("aria-label", "סקר " + pl.label);
  b.innerHTML = '<img src="' + LOGOS[pl.id] + '" alt="' + pl.label + '">';
  b.addEventListener("click", () => {
    if (poll === pl) {
      poll = null;
      if ($("#msg").textContent.startsWith("מולא מסקר")) $("#msg").textContent = "";
    } else {
      poll = pl;
      PARTIES.forEach(p => state[p.id] = pollSeats(p.id));
      $("#msg").textContent = "מולא מסקר " + pl.label + " - אפשר לערוך ולשלוח ✍️";
    }
    document.querySelectorAll("#polls button").forEach(x => x.classList.toggle("active", !!(poll && x.dataset.id === poll.id)));
    renderPollMeta();
    render();
  });
  $("#polls").appendChild(b);
});
renderPollMeta();
$("#pollsources").innerHTML = POLLS.map(pl => '<a href="' + pl.src + '">' + pl.label + " " + pl.date + "</a>").join(" · ");

function tickClose() {
  const left = BET_CLOSE - Date.now();
  if (left <= 0) {
    $("#countdown").textContent = "ההימורים נסגרו 🔒";
    $("#submit").disabled = true; $("#submit").textContent = "ההימורים נסגרו 🔒";
    return;
  }
  const d = Math.floor(left/86400000), h = Math.floor(left%86400000/3600000), m = Math.floor(left%3600000/60000), sec = Math.floor(left%60000/1000);
  $("#countdown").textContent = "⏳ נעילת ההימורים: " + d + " ימים, " + h + " שעות, " + m + " דקות ו-" + sec + " שניות (" + CLOSE_STR + " שעון ישראל)";
}
setInterval(tickClose, 1000); tickClose();

$("#bettor").addEventListener("input", render);
render();

// אבטחת עריכה: טוקן אקראי נשמר במכשיר; השרת שומר רק גיבוב (SHA-256) שלו
function makeToken() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode.apply(null, a)).split("+").join("-").split("/").join("_").replace(/=+$/, "");
}
async function sha256hex(t) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function getStoredBet() {
  try { const v = JSON.parse(localStorage.getItem("bet:" + group.code)); return (v && v.name && v.token) ? v : null; } catch { return null; }
}
function setStoredBet(name, token) { localStorage.setItem("bet:" + group.code, JSON.stringify({ name, token })); }
function myEditLink(name, token) {
  return location.origin + "/?g=" + group.code + "&n=" + encodeURIComponent(name) + "&edit=" + token;
}

async function send() {
  const name = $("#bettor").value.trim();
  const stored = getStoredBet();
  let token;
  if (stored && stored.name === name) {
    token = stored.token; // ההימור שלי במכשיר הזה - עריכה
  } else {
    try {
      const r = await api("/api/bets?code=" + encodeURIComponent(group.code));
      if ((((r.data && r.data.bets) || []).some(b => b.name === name))) {
        $("#msg").textContent = 'השם "' + name + '" תפוס בקבוצה הזו - בחרו שם אחר ✋';
        return;
      }
    } catch (e) {}
    token = makeToken(); // הימור חדש - טוקן עריכה חדש
  }
  const res = await fetch("/api/bet", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: group.code, name, parties: state, token })
  });
  if (res.status === 409) { $("#msg").textContent = 'השם "' + name + '" תפוס בקבוצה הזו - בחרו שם אחר ✋'; return; }
  if (res.status === 403) { $("#msg").textContent = "ההימורים נסגרו 🔒"; tickClose(); return; }
  if (!res.ok) { $("#msg").textContent = "משהו השתבש, נסו שוב 😕"; return; }
  setStoredBet(name, token);
  render();
  $("#msg").textContent = "נשמר! עוברים להשוואה… 🎉";
  setTimeout(() => switchTab("stats"), 800);
}
$("#submit").addEventListener("click", () => send());

function blocSums(parties) {
  const s = { right:0, center:0, arab:0, haredi:0, miluim:0 };
  for (const p of PARTIES) s[p.bloc] += parties[p.id] || 0;
  return s;
}
function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

function renderStatCards(el, bets) {
  if (!bets.length) {
    el.innerHTML = '<div class="stat"><b>אין עדיין הימורים</b><span>היו הראשונים!</span></div>';
    return null;
  }
  const avg = {}, bavg = { right:0, center:0, arab:0, haredi:0, miluim:0 };
  PARTIES.forEach(p => avg[p.id] = 0);
  bets.forEach(b => {
    PARTIES.forEach(p => avg[p.id] += (b.parties[p.id] || 0) / bets.length);
    const bs = blocSums(b.parties);
    for (const k in bavg) bavg[k] += bs[k] / bets.length;
  });
  const sorted = [...PARTIES].sort((a,b) => avg[b.id] - avg[a.id]);
  el.innerHTML =
    '<div class="stat"><b>' + bets.length + '</b><span>מהמרים</span></div>' +
    '<div class="stat"><b>' + Math.round(bavg.right) + '</b><span>קואליציה (ממוצע)</span></div>' +
    '<div class="stat"><b>' + Math.round(bavg.center) + '</b><span>אופוזיציה (ממוצע)</span></div>' +
    '<div class="stat"><b>' + Math.round(bavg.arab) + '</b><span>מפלגות ערביות (ממוצע)</span></div>' +
    (bavg.haredi > 0 ? '<div class="stat"><b>' + Math.round(bavg.haredi) + '</b><span>הציבור החרדי (ממוצע)</span></div>' : '') +
    (bavg.miluim > 0 ? '<div class="stat"><b>' + Math.round(bavg.miluim) + '</b><span>הנדל-זליכה (ממוצע)</span></div>' : '') +
    '<div class="stat"><b>' + sorted[0].name + '</b><span>המפלגה הגדולה בממוצע</span></div>';
  return { avg, sorted };
}

function renderAvg(el, bets, sorted, avg) {
  if (!bets.length) { el.innerHTML = ""; return; }
  const maxV = Math.max(...sorted.map(p => avg[p.id]), 1);
  el.innerHTML = sorted.map(p => {
    const v = avg[p.id], ps = pollSeats(p.id);
    return '<div class="avgrow"><div class="slip"><div class="letters">' + p.letter + '</div><div class="tiny">' + p.name + '</div></div>' +
      '<div class="n">' + p.name + '</div>' +
      '<div class="track"><div class="fill" style="width:' + (v/maxV*100) + '%;background:' + p.color + '"></div>' +
      (poll && ps ? '<div class="polltick" title="סקר ' + poll.label + ': ' + ps + '" style="right:' + (ps/maxV*100) + '%"></div>' : '') +
      '</div><div class="v">' + (Math.round(v*10)/10) + '</div></div>';
  }).join("");
}

function renderBets(el, bets, showGroup) {
  el.innerHTML = "";
  bets.sort((a,b) => b.ts - a.ts).forEach(b => {
    const bs = blocSums(b.parties);
    const d = document.createElement("div");
    d.className = "bet";
    const badge61 = bs.right >= 61 ? '<span class="chip c-61">קואליציה 61+ 👑</span>'
      : (bs.center >= 61 ? '<span class="chip c-61">אופוזיציה 61+ 👑</span>' : "");
    d.innerHTML = '<div class="head"><span class="who">' + escapeHtml(b.name) + '</span>' +
      (showGroup && b.groupName ? '<span class="gname">' + escapeHtml(b.groupName) + '</span>' : '') +
      '<span class="chip c-right">קואליציה ' + bs.right + '</span>' +
      '<span class="chip c-center">אופוזיציה ' + bs.center + '</span>' +
      '<span class="chip c-arab">ערביות ' + bs.arab + '</span>' +
      (bs.haredi ? '<span class="chip c-haredi">הציבור החרדי ' + bs.haredi + '</span>' : '') +
      (bs.miluim ? '<span class="chip c-miluim">הנדל-זליכה ' + bs.miluim + '</span>' : '') +
      badge61 +
      '<span class="when">' + new Date(b.ts).toLocaleString("he-IL") + '</span></div>' +
      '<div class="detail">' + PARTIES.filter(p => (b.parties[p.id]||0) > 0)
        .map(p => p.letter + " " + p.name + ": <b>" + b.parties[p.id] + "</b>").join(" · ") + '</div>';
    d.addEventListener("click", () => d.classList.toggle("open"));
    el.appendChild(d);
  });
}

async function loadStats() {
  // הקבוצה הנוכחית
  $("#stats-title").textContent = "הקבוצה: " + group.name;
  const mine = await api("/api/bets?code=" + encodeURIComponent(group.code));
  const mb = mine.data.bets || [];
  $("#bcount").textContent = "(" + mb.length + " מהמרים)";
  const r1 = renderStatCards($("#stat-cards"), mb);
  renderAvg($("#avg"), mb, r1 ? r1.sorted : [], r1 ? r1.avg : {});
  renderBets($("#bets"), mb, false);

  // כל הקבוצות
  const all = await api("/api/bets");
  const groups = all.data.groups || [];
  const flat = [];
  groups.forEach(g => (g.bets||[]).forEach(b => flat.push({ ...b, groupName: g.name })));
  $("#gbcount").textContent = "(" + flat.length + " מהמרים ב-" + groups.length + " קבוצות)";
  const r2 = renderStatCards($("#gstat-cards"), flat);
  renderAvg($("#gavg"), flat, r2 ? r2.sorted : [], r2 ? r2.avg : {});
  renderBets($("#gbets"), flat, true);
}

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

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // בלי תווים מבלבלים
function newCode() {
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
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

const betsKey = (code) => "b2:" + code;

async function readBets(env, code) {
  const bets = (await env.BETS.get(betsKey(code), { type: "json", cacheTtl: 60 })) || [];
  return bets.map(({ th, ...b }) => b); // הגיבוב אף פעם לא יוצא החוצה
}
async function readBetsRaw(env, code) {
  return (await env.BETS.get(betsKey(code), { type: "json", cacheTtl: 60 })) || [];
}

// גיבוי זמני בזמן שהפרופגציה של KV משלימה (המפתח נכתב מחדש אחרי ניקוי מפתחות ישנים)
const GROUP_FALLBACKS = { Y7ZS9A6: { code: "Y7ZS9A6", name: "הדירה" } };

async function getGroup(env, code) {
  if (code === GENERAL.code) return GENERAL;
  const g = await env.BETS.get("grp:" + code, { type: "json", cacheTtl: 60 });
  return g || GROUP_FALLBACKS[code] || null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/group" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "json" }, 400); }
      const name = String(body.name || "").trim();
      if (name.length < 2 || name.length > 30) return json({ error: "שם לא תקין" }, 400);
      for (let i = 0; i < 5; i++) {
        const code = newCode();
        if (!(await env.BETS.get("grp:" + code))) {
          const g = { code, name, ts: Date.now() };
          await env.BETS.put("grp:" + code, JSON.stringify(g));
          return json(g);
        }
      }
      return json({ error: "נסו שוב" }, 500);
    }

    if (url.pathname === "/api/group") {
      const code = (url.searchParams.get("code") || "").toUpperCase();
      const g = await getGroup(env, code);
      if (!g) return json({ error: "לא נמצא" }, 404);
      return json({ code: g.code, name: g.name });
    }

    if (url.pathname === "/api/bets") {
      const code = url.searchParams.get("code");
      if (code) {
        return json({ bets: await readBets(env, code.toUpperCase()) });
      }
      const out = [{ code: GENERAL.code, name: GENERAL.name, bets: await readBets(env, GENERAL.code) }];
      const seen = new Set();
      const list = await env.BETS.list({ prefix: "grp:" });
      for (const k of list.keys) {
        const g = await env.BETS.get(k.name, { type: "json", cacheTtl: 60 });
        if (g) { seen.add(g.code); out.push({ code: g.code, name: g.name, bets: await readBets(env, g.code) }); }
      }
      for (const g of Object.values(GROUP_FALLBACKS)) {
        if (!seen.has(g.code)) out.push({ code: g.code, name: g.name, bets: await readBets(env, g.code) });
      }
      return json({ groups: out });
    }

    if (url.pathname === "/api/bet" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "json" }, 400); }
      if (Date.now() > BET_CLOSE) return json({ error: "ההימורים נסגרו" }, 403);
      const code = String(body.code || "").toUpperCase();
      if (!(await getGroup(env, code))) return json({ error: "קבוצה לא קיימת" }, 404);
      const v = validBet(body);
      if (typeof v === "string") return json({ error: v }, 400);
      const bets = await readBetsRaw(env, code);
      const i = bets.findIndex(b => b.name === v.name);
      const token = String(body.token || "");
      const th = token ? await sha256hex(token) : "";
      if (i >= 0) {
        // עריכה רק עם טוקן העריכה המקורי (השרת שומר רק גיבוב). הימורים ישנים ללא גיבוב נעולים לעריכה דרך ה-API.
        if (!bets[i].th || bets[i].th !== th) return json({ error: 'השם "' + v.name + '" תפוס בקבוצה הזו - בחרו שם אחר' }, 409);
        bets[i] = { name: v.name, parties: v.clean, th: bets[i].th, ts: Date.now() };
      } else {
        bets.push({ name: v.name, parties: v.clean, th, ts: Date.now() });
      }
      await env.BETS.put(betsKey(code), JSON.stringify(bets));
      return json({ ok: true });
    }

    if (url.pathname === "/health") return json({ ok: true });
    return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  },
};
