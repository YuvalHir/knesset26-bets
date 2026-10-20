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
  ch14: "data:image/png;base64,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",
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
