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

// תמונות מנהיגים מויקימדיה קומונס (public/leaders/, רשיונות ב-CREDITS.md). מי שאין לו תמונה שמישה מקבל פתק.
const LEADER_PHOTOS = new Set(["yashar","likud","beyahad","democratim","meshutefet","shas","yahadut","tziyonut","otzma","beiteinu","raam","winter","miluim","noam"]);

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
  { id: "ch12", label: "חדשות 12", date: "23.10.26",
    src: "https://www.mako.co.il/news-israel-elections/2026/Article-8ea5e45ec2961a1027.htm",
    seats: { yashar:23, likud:21, beyahad:15, democratim:10, meshutefet:9, shas:8, yahadut:7, tziyonut:6, otzma:8, beiteinu:8, raam:5, winter:0, miluim:0, haredi:0, noam:0 } },
  { id: "ch13", label: "חדשות 13", date: "23.10.26",
    src: "https://13tv.co.il/item/news/politics/politics/survey-905415900/",
    seats: { yashar:22, likud:19, beyahad:14, democratim:10, meshutefet:9, shas:7, yahadut:8, tziyonut:8, otzma:8, beiteinu:8, raam:7, winter:0, miluim:0, haredi:0, noam:0 } },
  { id: "ch14", label: "ערוץ 14", date: "22.10.26",
    src: "https://www.c14.co.il/article/1750553",
    seats: { yashar:20, likud:30, beyahad:11, democratim:8, meshutefet:8, shas:9, yahadut:8, tziyonut:7, otzma:8, beiteinu:5, raam:6, winter:0, miluim:0, haredi:0, noam:0 } },
  { id: "kan", label: "כאן 11", date: "23.10.26",
    src: "https://www.kan.org.il/content/kan-news/politic/1112122/",
    seats: { yashar:22, likud:20, beyahad:14, democratim:8, meshutefet:9, shas:7, yahadut:8, tziyonut:7, otzma:8, beiteinu:8, raam:5, winter:0, miluim:4, haredi:0, noam:0 } },
  { id: "i24", label: "i24NEWS", date: "23.10.26",
    src: "https://www.i24news.tv/he/news/israel-elections-2026/polls/artc-07d162ea",
    seats: { yashar:21, likud:26, beyahad:12, democratim:8, meshutefet:9, shas:8, yahadut:7, tziyonut:6, otzma:8, beiteinu:6, raam:5, winter:4, miluim:0, haredi:0, noam:0 } },
  { id: "walla", label: "וואלה", date: "20.10.26",
    src: "https://www.walla.co.il/news/politics/383958175",
    seats: { yashar:23, likud:19, beyahad:14, democratim:9, meshutefet:8, shas:8, yahadut:7, tziyonut:6, otzma:8, beiteinu:8, raam:6, winter:0, miluim:4, haredi:0, noam:0 } },
];

// ===== תוצאות: מדגמי ערוצים (ערב הבחירות, זמני) ותוצאות אמת =====
// שלושה שלבים לפי יובל: "exit" = מדגמי הערוצים (22:00), "exit_actual" = תוצאות האמת של קלפיות המדגם, "official" = תוצאות אמת מלאות. "none" = אין עדיין.
const RESULT_STAGE = "none";
// שיטת הניקוד מוצעת בלבד - עד שיובל מאשר, לא מוצג מנצח/מדליות באף שלב
const SCORING_APPROVED = false;
const EXIT_POLLS = [
  // צורה: { id: "ch12", label: "חדשות 12", date: "27.10.26", src: "https://...",
  //   seats: { ... },        // שלב 1: המדגם שפורסם ב-22:00
  //   actualSeats: { ... },  // שלב 2: תוצאות האמת של קלפיות המדגם של אותו ערוץ (כשמתפרסם)
  // }
];
const OFFICIAL_RESULTS = null; // שלב 3: { date: "...", src: "https://...", seats: { ... } }

const BLOC_LABELS = { right: "קואליציה", center: "אופוזיציה", arab: "מפלגות ערביות", haredi: "הציבור החרדי", miluim: "הנדל-זליכה" };

function renderHTML(RESULT_STAGE, EXIT_POLLS, OFFICIAL_RESULTS, COUNTED) {
return `<!DOCTYPE html>
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
  .polls { display:flex; flex-wrap:nowrap; gap:4px; }
  .polls button { flex:1; background:#fff; border:2px solid #c7d5f7; border-radius:10px; padding:3px 2px; cursor:pointer; display:flex; align-items:center; justify-content:center; min-width:0; height:38px; }
  .polls button img { max-height:24px; max-width:44px; display:block; }
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
  .resultsbox { background:#fff; border:1px solid #dfe7fb; border-radius:14px; padding:14px; margin-bottom:18px; }
  .resultsbox h2 { margin:0 0 4px; font-size:20px; color:var(--bluedark); }
  .rssrc { font-size:12.5px; color:#5a6a96; margin-bottom:10px; }
  .lrow { display:flex; align-items:center; gap:8px; padding:6px 4px; border-top:1px solid #eef2fb; font-size:15px; }
  .lrow.win { background:#fff8e1; border-radius:8px; font-weight:700; }
  .lrow .rank { width:28px; text-align:center; }
  .lrow .lname { flex:1; }
  .lrow .lscore { font-weight:900; color:var(--bluedark); }
  .polllegend { font-size:12.5px; color:#5a6a96; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
  .polllegend .tick { display:inline-block; width:2px; height:14px; background:#101b3c99; }
  .polllegend:empty { display:none; }
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

  /* ===== תצוגת זמן-אמת מול המדגמים (25.10) ===== */
  .counted { font-size:14px; font-weight:900; color:#8a5a00; background:#fff3d6; border-radius:999px; padding:2px 10px; margin-right:8px; }
  .blocrace { margin:12px 0 16px; }
  .brnums { display:flex; gap:16px; font-size:20px; font-weight:900; margin-bottom:18px; flex-wrap:wrap; }
  .brtrack { position:relative; display:flex; height:26px; border-radius:999px; overflow:visible; background:#e5ebfb; }
  .brseg { height:100%; }
  .brseg:first-child { border-radius:0 999px 999px 0; }
  .brseg:last-of-type { border-radius:999px 0 0 999px; }
  .brmark61 { position:absolute; top:-4px; bottom:-4px; right:50.83%; border-right:3px solid var(--ink); box-shadow:1px 0 0 1px #fff, -1px 0 0 1px #fff; }
  .brmark61 span { position:absolute; top:-21px; right:-16px; font-size:13px; font-weight:900; color:var(--ink); background:#fff; border:1px solid #c7d5f7; border-radius:999px; padding:0 8px; white-space:nowrap; }
  .brlegend { font-size:12px; color:#5a6a96; margin-top:6px; line-height:1.5; }
  .deltacap { font-size:12px; color:#5a6a96; margin:4px 0 10px; }
  .tcard .tunit { font-size:13px; font-weight:700; opacity:.7; }
  .th3 { margin:14px 0 6px; font-size:17px; color:var(--bluedark); }
  .tcards { display:flex; gap:10px; margin:10px 0 16px; flex-wrap:wrap; }
  .tcard { flex:1; min-width:130px; border-radius:12px; padding:10px; text-align:center; border:1.5px solid; background:#fff; }
  .tcard.tin { border-color:#16a34a; background:#f0fdf4; }
  .tcard.tout { border-color:#dc2626; background:#fef2f2; }
  .tcard .tname { font-size:13px; font-weight:700; }
  .tcard .tval { font-size:30px; font-weight:900; line-height:1.15; }
  .tcard .tlamp { font-size:13px; font-weight:900; }
  .tcard.tin .tlamp { color:#16a34a; }
  .tcard.tout .tlamp { color:#dc2626; }
  .tcard.tflip { animation:tflip .9s ease 3; }
  @keyframes tflip { 50% { transform:scale(1.09); } }
  .avgrow .v { width:auto; min-width:44px; }
  .delta { font-size:12px; font-weight:900; margin-right:5px; }
  .delta.dup { color:#16a34a; }
  .delta.ddown { color:#dc2626; }
  @keyframes pulseUp { 0% { background:#bbf7d0; } 100% { background:transparent; } }
  @keyframes pulseDown { 0% { background:#fecaca; } 100% { background:transparent; } }
  .pulse-up { animation:pulseUp 2.5s ease; border-radius:6px; padding:0 4px; }
  .pulse-down { animation:pulseDown 2.5s ease; border-radius:6px; padding:0 4px; }
  .chantbl { width:100%; border-collapse:collapse; font-size:13.5px; margin-bottom:6px; }
  .chantbl th, .chantbl td { border-bottom:1px solid #eef2fb; padding:5px 6px; text-align:center; }
  .chantbl th:first-child, .chantbl td:first-child { text-align:right; font-weight:700; }
  .chantbl a { color:var(--blue); text-decoration:none; }
  .whosright { font-size:15px; font-weight:700; color:var(--bluedark); margin:6px 0 12px; }
  .tmlog { margin:10px 0 14px; font-size:13px; color:#5a6a96; }
  .tmlog .tm { padding:3px 0; border-bottom:1px dashed #eef2fb; }
  /* מצב מסיבה: לוח תוצאות גדול וכהה לטאבלט */
  body.party { background:#0b0f1a; }
  body.party header, body.party .tabs, body.party #view-bet, body.party footer, body.party .flagstar { display:none !important; }
  body.party #view-stats > *:not(#results) { display:none !important; }
  body.party #view-stats { max-width:1100px; }
  body.party .resultsbox { background:#111827; border-color:#26314a; color:#e5e7eb; padding:22px; }
  body.party .resultsbox h2 { color:#93c5fd; font-size:30px; }
  body.party .resultsbox h3 { color:#cbd5f5; font-size:24px; }
  body.party .rssrc { color:#9aa7c7; font-size:16px; }
  body.party .rssrc a { color:#93c5fd; }
  body.party .brnums { font-size:34px; }
  body.party .brtrack { height:40px; }
  body.party .brmark61 { border-right-color:#fff; box-shadow:none; }
  body.party .brmark61 span { color:#0b0f1a; font-size:16px; top:-26px; background:#93c5fd; border-color:#93c5fd; }
  body.party .brlegend { color:#9aa7c7; font-size:15px; }
  body.party .deltacap { color:#9aa7c7; font-size:15px; }
  body.party .th3 { color:#cbd5f5; font-size:24px; }
  body.party .tcard .tunit { font-size:17px; }
  body.party .counted { font-size:18px; }
  body.party .avgrow .slip { width:64px; height:78px; }
  body.party .avgrow .slip .letters { font-size:26px; }
  body.party .avgrow .n { width:200px; font-size:20px; color:#e5e7eb; }
  body.party .avgrow .track { height:30px; background:#1f2937; }
  body.party .avgrow .v { font-size:28px; color:#fff; }
  body.party .delta { font-size:18px; }
  body.party .tcard { background:#1f2937; }
  body.party .tcard.tin { background:#052e16; border-color:#16a34a; }
  body.party .tcard.tout { background:#2a0a0a; border-color:#dc2626; }
  body.party .tcard .tname { color:#e5e7eb; font-size:18px; }
  body.party .tcard .tval { font-size:44px; color:#fff; }
  body.party .tcard .tlamp { font-size:18px; }
  body.party .chantbl { font-size:19px; color:#e5e7eb; }
  body.party .chantbl th, body.party .chantbl td { border-color:#26314a; }
  body.party .chantbl a { color:#93c5fd; }
  body.party .whosright { color:#93c5fd; font-size:22px; }
  body.party .tmlog { color:#9aa7c7; font-size:17px; }
  body.party .tmlog .tm { border-color:#26314a; }
  body.party .lrow { font-size:22px; color:#e5e7eb; border-top-color:#26314a; }
  body.party .lrow .lscore { color:#93c5fd; }
  body.party .lrow.win { background:#3a2e05; }

  /* לוח מפלגות בסגנון גרפיקות הערוצים (25.10) */
  .pgrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin:12px 0 6px; }
  .ptile { border-radius:14px; overflow:hidden; background:#fff; border:1px solid #dbe4f7; position:relative; box-shadow:0 1px 4px #101b3c14; }
  .pphoto { height:110px; background-size:cover; background-position:center 15%; background-color:#e5ebfb; position:relative; }
  .pphoto::after { content:""; position:absolute; inset:auto 0 0 0; height:55%; background:linear-gradient(transparent,#00000099); }
  .pphoto.pslip { display:flex; align-items:center; justify-content:center; background:linear-gradient(#f7f9ff,#e9eefb); }
  .pphoto.pslip::after { display:none; }
  .pphoto.pslip .slip { width:56px; height:70px; }
  .pphoto.pslip .slip .letters { font-size:22px; }
  .pphoto.pslip .slip .tiny { display:block; font-size:8px; }
  .pseats { position:absolute; top:62px; right:10px; z-index:2; font-size:38px; font-weight:900; color:#fff; text-shadow:0 2px 8px #000c, 0 0 3px #000a; line-height:1; }
  .pseats .delta { font-size:15px; font-weight:900; text-shadow:0 1px 4px #000c; margin-right:4px; }
  .ptname { color:#fff; font-weight:900; font-size:14px; text-align:center; padding:6px 4px; line-height:1.25; min-height:38px; display:flex; align-items:center; justify-content:center; }
  .pcredits { font-size:11px; color:#8a97bd; margin:2px 0 12px; }
  .pcredits a { color:inherit; }
  body.party .ptile { background:#111827; border-color:#26314a; }
  body.party .pphoto { height:120px; }
  body.party .pphoto.pslip { background:linear-gradient(#1f2937,#111827); }
  body.party .pseats { top:74px; font-size:42px; }
  body.party .ptname { font-size:14px; min-height:38px; padding:5px 4px; }
  body.party .pcredits { color:#9aa7c7; }
  @media (min-width:700px) { .pgrid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
  /* פריסה לרוחב (טאבלט/מחשב): מפלגות זו לצד זו, טבלה וציר זמן זה לצד זה */
  @media (min-width:1000px) {
    .pgrid { grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; }
    body.party .pgrid { gap:10px; margin:10px 0 4px; }
    .landrow { display:flex; gap:14px; align-items:flex-start; }
    .lcol-t { flex:1.35; min-width:0; }
    .lcol-n { flex:1; min-width:0; }
    .chantbl { font-size:12px; }
    .chantbl th, .chantbl td { padding:3px 5px; }
    body.party .resultsbox { padding:16px 18px; }
    body.party .resultsbox h2 { font-size:24px; }
    body.party .resultsbox h3, body.party .th3 { font-size:19px; }
    body.party .rssrc { font-size:13px; }
    body.party .brnums { font-size:26px; margin-bottom:16px; }
    body.party .brtrack { height:32px; }
    body.party .brlegend, body.party .deltacap { font-size:13px; }
    body.party .counted { font-size:15px; }
    body.party .delta { font-size:14px; }
    body.party .tcard .tname { font-size:15px; }
    body.party .tcard .tval { font-size:34px; }
    body.party .tcard .tlamp { font-size:14px; }
    body.party .tcard .tunit { font-size:14px; }
    body.party .chantbl { font-size:14px; }
    body.party .whosright { font-size:16px; }
    body.party .tmlog { font-size:14px; }
    body.party .brmark61 span { font-size:14px; top:-24px; }
  }
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
      <input id="newgname" maxlength="30" placeholder="שם הקבוצה">
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
  <div id="results"></div>
  <div id="polllegend"></div>
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
const LEADER_PHOTOS = new Set(${JSON.stringify([...LEADER_PHOTOS])});
const POLLS = ${JSON.stringify(POLLS)};
let RESULT_STAGE = ${JSON.stringify(RESULT_STAGE)};
let COUNTED = ${JSON.stringify(COUNTED ?? null)};
const SCORING_APPROVED = ${JSON.stringify(SCORING_APPROVED)};
let EXIT_POLLS = ${JSON.stringify(EXIT_POLLS)};
let OFFICIAL_RESULTS = ${JSON.stringify(OFFICIAL_RESULTS)};
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
  ch12: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iNDA3LjIxNHB4IiBoZWlnaHQ9IjMzOC4xNDhweCIgdmlld0JveD0iMCAwIDQwNy4yMTQgMzM4LjE0OCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgNDA3LjIxNCAzMzguMTQ4Ig0KCSB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxmaWx0ZXIgIGlkPSJBSV9HYXVzc2lhbkJsdXJfNyI+DQoJPGZlR2F1c3NpYW5CbHVyICBzdGREZXZpYXRpb249IjciPjwvZmVHYXVzc2lhbkJsdXI+DQo8L2ZpbHRlcj4NCjxnPg0KCTxnPg0KCQk8ZGVmcz4NCgkJCTxwYXRoIGlkPSJTVkdJRF8xXyIgZD0iTTM2Ny45ODQsMjUxLjY1aC0wLjAwNGgtNjguOTU5bDM4LjM4My01Ny4xNDZsMTIuODkzLTE5LjE5YzEuOTY5LTMuODQ2LDQuMzg5LTguNDA0LDYuODAzLTEzLjUwNQ0KCQkJCWM1LjEwNC0xMC43NzksMTAuMTg2LTIzLjk4MiwxMC45NjEtMzcuOTk2YzAuMDItMC4zNTgsMC4wNDMtMC43MTcsMC4wNTctMS4wNzVjMC4wOTYtMi4zNTgsMC4xMjctNC42ODgsMC4xMDUtNi45ODYNCgkJCQlDMzY3LjQ5NCw0NC40NzIsMzExLjc0LDEuNTQsMjU2LjQzMywxLjU0Yy01Ny42MTksMC05OS45MiwzOS44MjgtMTEwLjc1Miw4Ny45MjNjLTEuNzczLDcuODcxLTIuNzAzLDE1Ljk2My0yLjcyMSwyNC4xMzloMzUuMDUxDQoJCQkJYzAtMC4wMDIsMC0wLjAwMywwLTAuMDA0aDAuMDA0YzAuMDM1LTE0LjQyMiwzLjQ5Ni0yNy4xNTEsOS4zNjctMzcuOTIzYzEzLjkwMi0yNS41MTMsNDEuMzE4LTQwLjAzOSw2OC43MTctNDAuMDM5DQoJCQkJYzU2LjA4OCwwLDgzLjQ1Myw1MCw3Ny45MSw5MC4yMTJjLTAuNjgyLDQuOTM5LTEuODU3LDkuNzI5LTMuNTM5LDE0LjI2MmwtMy4xMjMsNy42NzhsLTEyLjY0MywxOS4zMTJsLTE1Ljg1OSwyNC4yMTYNCgkJCQlMMjM4LjMxLDI4My43M2gwLjAwMmgxNDQuNTAyaDAuMDAyTDM2Ny45ODQsMjUxLjY1eiIvPg0KCQk8L2RlZnM+DQoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMl8iPg0KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfMV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPg0KCQk8L2NsaXBQYXRoPg0KCQk8ZyBjbGlwLXBhdGg9InVybCgjU1ZHSURfMl8pIj4NCgkJCTxyZWN0IHg9IjguMjA4IiB5PSI5OS4xNDIiIGZpbGw9IiM1MjM0N0QiIHdpZHRoPSIyMzEuMDgyIiBoZWlnaHQ9IjE2Ny4zNjQiLz4NCgkJCTxwYXRoIGZpbGw9IiM0MTQ5OTIiIGQ9Ik0xMzcuNjg3LDMxNS4xMDZjMC0yMy4yODQsNDMuMzc5LTExOS42OTgsNy42MjMtMTE5LjY5OGMtMzUuNzU0LDAtMTY5Ljk4Miw0Ny44MTMtMTY5Ljk4Miw3MS4xDQoJCQkJYzAsMjMuMjg3LDYxLjg2Niw5MC43NjQsOTcuNjIxLDkwLjc2NEMxMDguNzAzLDM1Ny4yNywxMzcuNjg3LDMzOC4zOTMsMTM3LjY4NywzMTUuMTA2eiIvPg0KCQkJPHBhdGggZmlsbD0iIzI1NkNBQSIgZD0iTTE1MS43NDcsMjEyLjA0Yy01MC44MzgsMC0xOTUuNjg3LDExNC45NzctMTU4LjM1MiwxNjIuMjg5YzEuNDgzLDEuODc5LDIuOTM0LDMuNzk1LDQuMzYzLDUuNzMxDQoJCQkJbDE1NC42NTYsNDQuODNjMTUuNTQ5LTEzLjE5NywyNS4wODItMzAuOTg4LDI1LjA4Mi01MC41NjNDMTc3LjQ5NiwzMzMuNjIyLDIwMi41ODUsMjEyLjA0LDE1MS43NDcsMjEyLjA0eiIvPg0KCQkJPHBhdGggZmlsbD0iIzQxNDk5MiIgZD0iTTI1Ny45NTcsNDQuMTA2YzAsMzAuMDQxLTQ3LjcwNywxMTMuNjE0LTEyNi44MDksMTEzLjYxNGMtNzkuMTAxLDAtMjA0LjA1NS04Ni4yNTctMTM2LjQ2NS0xMjguNzQxDQoJCQkJYzI1LjQzMy0xNS45ODcsNDAuOTUxLTM5LjI2NywxMjAuMDUxLTM5LjI2N0MxOTMuODM1LTEwLjI4NywyNTcuOTU3LDE0LjA2NiwyNTcuOTU3LDQ0LjEwNnoiLz4NCgkJCTxwYXRoIGZpbGw9IiMyNTZDQUEiIGQ9Ik0yMTYuOTY0LDU5LjU1NWMwLDM4LjU3My0zLjc1LDQ2LjExMy0xNi4yOTUsNjkuODQzQzE1Ni43NDYsMjEyLjQ3My03Ljg5Myw1Mi45ODYsOS40ODcsMC42NTcNCgkJCQlDMjEuNjQ2LTM1Ljk1LDE0MS41MjEtMTAuMjg2LDE2OC4zNjMtMTAuMjg2UzIxNi45NjQsMjAuOTgzLDIxNi45NjQsNTkuNTU1eiIvPg0KCQkJPHBhdGggZmlsbD0iIzFDQTlDOSIgZD0iTTYzLjU2LTIxLjk1OGMxMC41MTgtMjEuNTY4LDkxLjc5Myw2NS4xMDEsMTE1LjkzMiw2NS4xMDFjMjQuMTQxLDAsNDMuNzA3LDE5LjQ1Myw0My43MDcsNDMuNDQ5DQoJCQkJcy0zNi43MywyMC4zMzktNDMuNzA3LDQzLjQ0OUMxNjIuNjkxLDE4NS43MjEsMzYuNTIzLDMzLjQ4NSw2My41Ni0yMS45NTh6Ii8+DQoJCQk8cG9seWdvbiBmaWxsPSIjNDdDNDczIiBwb2ludHM9IjEzMS4xNDgsMzM5LjI0NSAyOTUuMjk0LDM2MS4xMzIgMjA1LjI1OSwzNS40MTYgMTM2LjI5OCwxMC4zMTEgCQkJIi8+DQoJCQk8cGF0aCBmaWxsPSIjRkZENDBEIiBkPSJNMzAwLjQ0MywyMTUuMjhjMjEuNjg2LTU1LjEyOSw0NC40MTYtMTQ0LjE4OCw0NC40MTYtMTY2LjM0OGMwLTMyLjcwNy0xOC4zMDEtNTkuMjIxLTQwLjg3NS01OS4yMjENCgkJCQlTMTU3LjYzMSw2LjQ1LDE1Ni44OTgsMzAuOTA5Yy0xLjk3OSw2NS44MjYsMTUuNzY0LDExOC4wMTgsMzguMTk5LDE1NS44NjVjMjEuNDEyLDE1NC41NzEsMTU2Ljg5NiwyMzQuMTA2LDE0MC43NTQsMTY1LjM0Ng0KCQkJCUMzMzMuODUzLDM0My42MjYsMzEzLjA3NiwyNzEuMjA4LDMwMC40NDMsMjE1LjI4eiIvPg0KCQkJPHBhdGggZmlsbD0iIzFDQTlDOSIgZD0iTTIxMS4yOTEsMzYxLjEzMmMtNS4wNjQtOS42NTQtNDEuMzUtNzkuMTc2LTM0Ljc2Mi0xMzMuODkxYzAuNTA2LTQuMTk3LTI2LjQ4NCw4LjE2NC0zNy42OTcsMjAuMzY5DQoJCQkJYy0xLjQ4LTIuNTUyLTMuMDgtNC4xMDQtNC43ODgtNC4yNzdjLTEwLjYyMS0xLjA4NC03MC40ODYsODkuODc3LTcwLjQ4NiwxMDkuNDMyYzAsMTkuNTUzLDM3LjE4LDMwLjg5Niw0Ny4zMTMsMzAuODk2DQoJCQkJYzUuNjU0LDAsMTcuMzI4LTE1Ljk2NiwyNi41NC0zMy40NzRoMjguNDk3di02LjM1NEMxODIuNDE0LDM1MS44NDEsMjE2LjQ0MSwzNzAuOTUyLDIxMS4yOTEsMzYxLjEzMnoiLz4NCgkJCTxwYXRoIGZpbGw9IiNGQUE2MjkiIGQ9Ik00MjguNjQsMzE2LjA1M2MxNS40NDEtNTAuNzg3LDM5LjE2OC0xMjMuOTY1LDM5LjE2OC0xNDkuODMyYzAtMzguNDY4LTE0Ljk4OC02OS42NTItMzMuNDc1LTY5LjY1Mg0KCQkJCWMtNy4zNjksMC00Mi45OTgsNS4zNzMtODIuOTUzLDE0LjI2MWMtMi40OTYtMTEuNzIzLTMuOTQ1LTIxLjE3NS0zLjk0NS0yNy40NTdjMC00OS45NDktMTMuNjg5LTkwLjQ0LTMwLjU3Ni05MC40NA0KCQkJCXMtMTMxLjk3MS0zOS41NjUtMTM0Ljg1NSwxMC4zYy0zLjM4Myw1OC40MjgsMTQuMjI5LDExNS4xNTEsNDEuMjc3LDE2Ni4xOTRjNy4xMTUsNjkuNDYzLDkzLjY3NiwxNjguMDQ1LDE0OC4yMzQsMjAyLjA0Nw0KCQkJCUw0MjguNjQsMzE2LjA1M3oiLz4NCgkJCTxwYXRoIGZpbGw9IiNGNjZGMDkiIGQ9Ik00MjEuNDY4LDg4LjI4NUwzNDguMDQyLTM0LjI2N2MtNjguMzY3LTcuMTkyLTEwMS41MzUtNTguNzg3LTEyMi4yNywxNC4zMjMNCgkJCQljLTE2LjQyLDU3Ljg5Ni05Ljc0OCwxMTUuMTk1LDE4LjgyLDE2OS41MjljMC4wODIsMS4wMTIsMC4yNDQsMi4wMDgsMC40OSwyLjk4NGMxOC4zNDIsNzIuODQ1LDEwMi4zODcsMTQ5LjkzNSwxNjYuMzQyLDE3OS4yMTgNCgkJCQlMNDIxLjQ2OCw4OC4yODV6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjRDQwMjFDIiBkPSJNNDI3LjI5NCw4NC42MjJMMzEwLjUwMy0xMTAuMzFjLTI5LjQ2MywxOC43OS00NC4yMzYsNTIuNzQxLTU0LjI3LDEwOC43Nw0KCQkJCWMtMjUuMjQyLDE0MC45ODYsNjkuMzM4LDIzMC4wNDMsMTY0Ljg0MiwyMzYuOTYzTDQyNy4yOTQsODQuNjIyeiIvPg0KCQk8L2c+DQoJCTxnIGRpc3BsYXk9Im5vbmUiIG9wYWNpdHk9IjAuNCIgY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzJfKSIgZmlsdGVyPSJ1cmwoI0FJX0dhdXNzaWFuQmx1cl83KSI+DQoJCQk8cGF0aCBkaXNwbGF5PSJpbmxpbmUiIGQ9Ik0zODYuMDI0LDI4Ni4yM2gtMTUzLjA0bDkxLjQzNy0xMzkuNjA5bDMuMDMyLTcuNDU0YzEuNTY4LTQuMjMsMi43MTQtOC44NTIsMy4zNzgtMTMuNjYyDQoJCQkJYzMuMDEyLTIxLjg0NS00LjE5NS00NS44MzEtMTguODA3LTYyLjU5NWMtOS44NTItMTEuMzAyLTI3LjY3My0yNC43NzUtNTYuNjI3LTI0Ljc3NWMtMjcuNTg4LDAtNTMuNjk5LDE1LjIwNS02Ni41MjEsMzguNzM1DQoJCQkJYy01Ljk4MSwxMC45NzMtOS4wMywyMy4zMzEtOS4wNjMsMzYuNzMybC0wLjAwNCwyLjQ5NGwtMi41LDAuMDA0aC0zNy41NTZsMC4wMDUtMi41MDVjMC4wMTgtOC4yNjQsMC45NTQtMTYuNTY5LDIuNzgyLTI0LjY4Mw0KCQkJCWM1LjU2MS0yNC42OTEsMTkuMjkzLTQ3LjE5NSwzOC42NjgtNjMuMzY3QzIwMS45ODMsOC4yMDYsMjI3Ljc1My0wLjk2LDI1NS43MzEtMC45NmMyOC41NzUsMCw1Ny4wMzEsMTEuMzE4LDc4LjA3MSwzMS4wNTMNCgkJCQljMjMuMDEyLDIxLjU4MywzNS44NzQsNTEuOTk1LDM2LjIxOCw4NS42MzRjMC4wMjIsMi40MS0wLjAxNCw0LjgwMi0wLjEwNyw3LjExM2MtMC4wMTEsMC4yNjctMC4wMjUsMC41MzktMC4wNDIsMC44MTINCgkJCQlsLTAuMDE3LDAuMjk4Yy0wLjg1NywxNS41MDctNi44MDIsMjkuNjQ1LTExLjE5NywzOC45MjljLTEuODkxLDMuOTk1LTMuNzgzLDcuNjU2LTUuNDUyLDEwLjg4OA0KCQkJCWMtMC40ODEsMC45My0wLjk0NCwxLjgyNi0xLjM4NSwyLjY4OGwtMC4xNSwwLjI1NWwtNDguNjYsNzIuNDQxaDY1Ljg2N2wwLjY3NSwxLjQ1MUwzODYuMDI0LDI4Ni4yM3ogTTI0Mi4yMzQsMjgxLjIzaDEzNS45Nw0KCQkJCWwtMTIuNTIxLTI3LjA4aC03Mi4wNTVsNTMuODA5LTgwLjEwN2MwLjQyMy0wLjgyNSwwLjg2Ni0xLjY4NCwxLjMyNS0yLjU3MmMxLjY1LTMuMTk0LDMuNTIxLTYuODE0LDUuMzc1LTEwLjczDQoJCQkJYzQuMjE3LTguOTA1LDkuOTE1LTIyLjQzNiwxMC43MjUtMzcuMDY1bDAuMDE4LTAuMzEyYzAuMDE0LTAuMjQsMC4wMjctMC40OCwwLjAzNy0wLjcyMWMwLjA5MS0yLjIzNCwwLjEyNS00LjU0MywwLjEwNC02Ljg2OA0KCQkJCUMzNjQuMzA1LDQ1LjgzNSwzMDguODkxLDQuMDQsMjU1LjczMSw0LjA0Yy01Mi4zNzMsMC05Ni45MTMsMzUuMzUzLTEwOC4zMTMsODUuOTcyYy0xLjU2Myw2LjkzOC0yLjQ0NCwxNC4wMi0yLjYyNSwyMS4wODkNCgkJCQloMzAuMDU5YzAuMzg3LTEzLjI4OSwzLjYyNC0yNS41OTgsOS42MzMtMzYuNjIzYzEzLjY4Ni0yNS4xMTUsNDEuNTIxLTQxLjM0Myw3MC45MTItNDEuMzQzYzMwLjgzNCwwLDQ5Ljg2MiwxNC40MDYsNjAuMzk2LDI2LjQ5DQoJCQkJYzE1LjUzNCwxNy44MjIsMjMuMTk0LDQzLjMyNywxOS45OTEsNjYuNTYzYy0wLjcxNCw1LjE3LTEuOTQ5LDEwLjE0Ni0zLjY3MiwxNC43OWwtMy4zNzUsOC4xNzdMMjQyLjIzNCwyODEuMjN6Ii8+DQoJCTwvZz4NCgk8L2c+DQo8L2c+DQo8Zz4NCgk8Zz4NCgkJPGRlZnM+DQoJCQk8cGF0aCBpZD0iU1ZHSURfM18iIGQ9Ik00MDcuMjEsMzM2LjYwN0gxMzQuMjk0TDI0Ny43NSwxNjcuMmMtMC4wMjEtMC4wMDEtMC4wNTktMC4wMDQtMC4wNzgtMC4wMDlsMjQuODU5LTM3LjE2DQoJCQkJYzAsMCw1LjkxNi05LjQ1NSw1LjkxNi0xNS4zOTdjMC0xMi41ODktMTAuMDM5LTIyLjc5NC0yMi40My0yMi43OTRjLTQuOTIyLDAtOS40NzMsMS42MTItMTMuMTcsNC4zNDUNCgkJCQljLTUuNDA0LDMuOTk2LTguOTg2LDEwLjM4OC05LjIzNiwxNy42NDFoLTAuMDAyYzAsMCwwLDAsMCwwLjAwMUgxOTkuNjZjMC0wLjE5OS0wLjAxMi0wLjM5Ni0wLjAxMi0wLjU5NQ0KCQkJCWMwLTcuNTQ4LDEuNTk2LTE0LjczNyw0LjQ4Mi0yMS4yNzZjMC4yOTMtMC42NjQsMC42MDUtMS4zMTcsMC45MjgtMS45NjhjMC4wNzQtMC4xNDksMC4xMzktMC4zMDQsMC4yMTMtMC40NTINCgkJCQljOS4yMTEtMTguMzIsMjguNzctMzAuOTYyLDUxLjQwOC0zMC45NjJjMzEuNDk4LDAsNTcuMDM1LDI0LjQ3LDU3LjAzNSw1NC42NTZjMCwxMi45NzctNS4zODUsMjQuODkzLTExLjg5NiwzNC4yNjYNCgkJCQljLTAuOTMyLDEuMzM5LTEuODg1LDIuNjI2LTIuODUsMy44NTZsLTI1LjQwNCwzOC4yNjVsLTc3LjQ3OSwxMTYuNjk1bC0wLjYsMC4yOTFoMTk3Ljg1NGwxMy44NzUsMzAuMDA2TDQwNy4yMSwzMzYuNjA3DQoJCQkJTDQwNy4yMSwzMzYuNjA3eiIvPg0KCQk8L2RlZnM+DQoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfNF8iPg0KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfM18iICBvdmVyZmxvdz0idmlzaWJsZSIvPg0KCQk8L2NsaXBQYXRoPg0KCQk8ZyBjbGlwLXBhdGg9InVybCgjU1ZHSURfNF8pIj4NCgkJCTxyZWN0IHg9IjguNDg0IiB5PSI5OS43MTMiIGZpbGw9IiM1MjM0N0QiIHdpZHRoPSIyMzEuMDgzIiBoZWlnaHQ9IjE2Ny4zNjQiLz4NCgkJCTxwYXRoIGZpbGw9IiM0MTQ5OTIiIGQ9Ik0xMzcuOTYyLDMxNS42NzdjMC0yMy4yODUsNDMuMzc5LTExOS42OTksNy42MjMtMTE5LjY5OWMtMzUuNzU0LDAtMTY5Ljk4Myw0Ny44MTQtMTY5Ljk4Myw3MS4xMDENCgkJCQljMCwyMy4yODcsNjEuODY2LDkwLjc2NCw5Ny42MjIsOTAuNzY0QzEwOC45NzgsMzU3Ljg0MSwxMzcuOTYyLDMzOC45NjQsMTM3Ljk2MiwzMTUuNjc3eiIvPg0KCQkJPHBhdGggZmlsbD0iIzI1NkNBQSIgZD0iTTE1Mi4wMjEsMjEyLjYxMWMtNTAuODM4LDAtMTk1LjY4NywxMTQuOTc3LTE1OC4zNTIsMTYyLjI4OGMxLjQ4MywxLjg4LDIuOTM0LDMuNzk1LDQuMzYzLDUuNzMyDQoJCQkJbDE1NC42NTYsNDQuODNjMTUuNTQ5LTEzLjE5NywyNS4wODItMzAuOTg4LDI1LjA4Mi01MC41NjRDMTc3Ljc3MSwzMzQuMTkyLDIwMi44NjEsMjEyLjYxMSwxNTIuMDIxLDIxMi42MTF6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjNDE0OTkyIiBkPSJNMjU4LjIzNCw0NC42NzZjMCwzMC4wNDEtNDcuNzA5LDExMy42MTUtMTI2LjgxLDExMy42MTVTLTcyLjYzMSw3Mi4wMzQtNS4wNDIsMjkuNTQ5DQoJCQkJQzIwLjM5MSwxMy41NjEsMzUuOTA5LTkuNzE3LDExNS4wMDktOS43MTdDMTk0LjExMS05LjcxNywyNTguMjM0LDE0LjYzNSwyNTguMjM0LDQ0LjY3NnoiLz4NCgkJCTxwYXRoIGZpbGw9IiMyNTZDQUEiIGQ9Ik0yMTcuMjQsNjAuMTI2YzAsMzguNTczLTMuNzUsNDYuMTEzLTE2LjI5NSw2OS44NDJDMTU3LjAyMSwyMTMuMDQ0LTcuNjE3LDUzLjU1NSw5Ljc2NCwxLjIyNg0KCQkJCUMyMS45MjEtMzUuMzgsMTQxLjc5Ny05LjcxNiwxNjguNjM4LTkuNzE2QzE5NS40OC05LjcxNiwyMTcuMjQsMjEuNTUyLDIxNy4yNCw2MC4xMjZ6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjMUNBOUM5IiBkPSJNNjMuODM0LTIxLjM4OGMxMC41MTktMjEuNTY4LDkxLjc5Myw2NS4xMDEsMTE1LjkzMyw2NS4xMDFjMjQuMTQxLDAsNDMuNzA3LDE5LjQ1Myw0My43MDcsNDMuNDQ5DQoJCQkJcy0zNi43MzIsMjAuMzM5LTQzLjcwNyw0My40NDlDMTYyLjk2NiwxODYuMjkyLDM2Ljc5OSwzNC4wNTQsNjMuODM0LTIxLjM4OHoiLz4NCgkJCTxwb2x5Z29uIGZpbGw9IiM0N0M0NzMiIHBvaW50cz0iMTMxLjQyNCwzMzkuODE1IDI5NS41NywzNjEuNzAyIDIwNS41MzUsMzUuOTg2IDEzNi41NzUsMTAuODgyIAkJCSIvPg0KCQkJPHBhdGggZmlsbD0iI0ZGRDQwRCIgZD0iTTMwMC43MTgsMjE1Ljg1YzIxLjY4NC01NS4xMjksNDQuNDE2LTE0NC4xODcsNDQuNDE2LTE2Ni4zNDdjMC0zMi43MDctMTguMzAxLTU5LjIyMS00MC44NzUtNTkuMjIxDQoJCQkJUzE1Ny45MDYsNy4wMjEsMTU3LjE3MywzMS40OGMtMS45NzksNjUuODI1LDE1Ljc2NCwxMTguMDE4LDM4LjE5NywxNTUuODY0YzIxLjQxMiwxNTQuNTcyLDE1Ni44OTgsMjM0LjEwNywxNDAuNzU0LDE2NS4zNDYNCgkJCQlDMzM0LjEyOCwzNDQuMTk1LDMxMy4zNTEsMjcxLjc3OSwzMDAuNzE4LDIxNS44NXoiLz4NCgkJCTxwYXRoIGZpbGw9IiMxQ0E5QzkiIGQ9Ik0yMTEuNTY2LDM2MS43MDJjLTUuMDY0LTkuNjU0LTQxLjM1LTc5LjE3Ny0zNC43NjItMTMzLjg5MmMwLjUwNi00LjE5Ni0yNi40ODQsOC4xNjQtMzcuNjk3LDIwLjM2OQ0KCQkJCWMtMS40NzktMi41NTEtMy4wOC00LjEwNC00Ljc4Ny00LjI3NmMtMTAuNjIxLTEuMDg0LTcwLjQ4Niw4OS44NzYtNzAuNDg2LDEwOS40MzJjMCwxOS41NTMsMzcuMTgsMzAuODk2LDQ3LjMxMywzMC44OTYNCgkJCQljNS42NTYsMCwxNy4zMjgtMTUuOTY1LDI2LjU0MS0zMy40NzNoMjguNDk2di02LjM1NUMxODIuNjg5LDM1Mi40MTEsMjE2LjcxNiwzNzEuNTIyLDIxMS41NjYsMzYxLjcwMnoiLz4NCgkJCTxwYXRoIGZpbGw9IiNGQUE2MjkiIGQ9Ik00MjguOTE2LDMxNi42MjRjMTUuNDQxLTUwLjc4NywzOS4xNjYtMTIzLjk2NSwzOS4xNjYtMTQ5LjgzMmMwLTM4LjQ2OC0xNC45ODYtNjkuNjUzLTMzLjQ3My02OS42NTMNCgkJCQljLTcuMzcxLDAtNDIuOTk4LDUuMzczLTgyLjk1MywxNC4yNjJjLTIuNDk4LTExLjcyNC0zLjk0NS0yMS4xNzYtMy45NDUtMjcuNDU3YzAtNDkuOTQ5LTEzLjY4OS05MC40NC0zMC41NzYtOTAuNDQNCgkJCQljLTE2Ljg4OSwwLTEzMS45NzMtMzkuNTY1LTEzNC44NTUsMTAuMjk5Yy0zLjM4Myw1OC40MjksMTQuMjI5LDExNS4xNTIsNDEuMjc3LDE2Ni4xOTUNCgkJCQljNy4xMTUsNjkuNDYzLDkzLjY3NiwxNjguMDQ1LDE0OC4yMzIsMjAyLjA0N0w0MjguOTE2LDMxNi42MjR6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjRjY2RjA5IiBkPSJNNDIxLjc0NCw4OC44NTVMMzQ4LjMxOC0zMy42OThjLTY4LjM2Ny03LjE5MS0xMDEuNTM1LTU4Ljc4Ny0xMjIuMjcsMTQuMzI0DQoJCQkJYy0xNi40MTgsNTcuODk2LTkuNzQ4LDExNS4xOTUsMTguODIsMTY5LjUyOWMwLjA4MiwxLjAxMiwwLjI0NCwyLjAwOCwwLjQ5LDIuOTgzYzE4LjM0Miw3Mi44NDYsMTAyLjM4NywxNDkuOTM2LDE2Ni4zNDIsMTc5LjIxOA0KCQkJCUw0MjEuNzQ0LDg4Ljg1NXoiLz4NCgkJCTxwYXRoIGZpbGw9IiNENDAyMUMiIGQ9Ik00MjcuNTcsODUuMTkyTDMxMC43NzktMTA5Ljc0QzI4MS4zMTYtOTAuOTUsMjY2LjU0NC01Ni45OTgsMjU2LjUxMS0wLjk3DQoJCQkJYy0yNS4yNDIsMTQwLjk4NSw2OS4zMzYsMjMwLjA0MywxNjQuODQsMjM2Ljk2M0w0MjcuNTcsODUuMTkyeiIvPg0KCQk8L2c+DQoJPC9nPg0KCTxnIGRpc3BsYXk9Im5vbmUiPg0KCQk8ZGVmcz4NCgkJCTxwYXRoIGlkPSJTVkdJRF81XyIgZD0iTTQwNy4yMSwzMzYuNjA3SDEzNC4yOTRMMjQ3Ljc1LDE2Ny4yYy0wLjAyMS0wLjAwMS0wLjA1OS0wLjAwNC0wLjA3OC0wLjAwOWwyNC44NTktMzcuMTYNCgkJCQljMCwwLDUuOTE2LTkuNDU1LDUuOTE2LTE1LjM5N2MwLTEyLjU4OS0xMC4wMzktMjIuNzk0LTIyLjQzLTIyLjc5NGMtNC45MjIsMC05LjQ3MywxLjYxMi0xMy4xNyw0LjM0NQ0KCQkJCWMtNS40MDQsMy45OTYtOC45ODYsMTAuMzg4LTkuMjM2LDE3LjY0MWgtMC4wMDJjMCwwLDAsMCwwLDAuMDAxSDE5OS42NmMwLTAuMTk5LTAuMDEyLTAuMzk2LTAuMDEyLTAuNTk1DQoJCQkJYzAtNy41NDgsMS41OTYtMTQuNzM3LDQuNDgyLTIxLjI3NmMwLjI5My0wLjY2NCwwLjYwNS0xLjMxNywwLjkyOC0xLjk2OGMwLjA3NC0wLjE0OSwwLjEzOS0wLjMwNCwwLjIxMy0wLjQ1Mg0KCQkJCWM5LjIxMS0xOC4zMiwyOC43Ny0zMC45NjIsNTEuNDA4LTMwLjk2MmMzMS40OTgsMCw1Ny4wMzUsMjQuNDcsNTcuMDM1LDU0LjY1NmMwLDEyLjk3Ny01LjM4NSwyNC44OTMtMTEuODk2LDM0LjI2Ng0KCQkJCWMtMC45MzIsMS4zMzktMS44ODUsMi42MjYtMi44NSwzLjg1NmwtMjUuNDA0LDM4LjI2NWwtNzcuNDc5LDExNi42OTVsLTAuNiwwLjI5MWgxOTcuODU0bDEzLjg3NSwzMC4wMDZMNDA3LjIxLDMzNi42MDcNCgkJCQlMNDA3LjIxLDMzNi42MDd6Ii8+DQoJCTwvZGVmcz4NCgkJPGNsaXBQYXRoIGlkPSJTVkdJRF82XyIgZGlzcGxheT0iaW5saW5lIj4NCgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzVfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4NCgkJPC9jbGlwUGF0aD4NCgkJPGcgZGlzcGxheT0iaW5saW5lIiBvcGFjaXR5PSIwLjQiIGNsaXAtcGF0aD0idXJsKCNTVkdJRF82XykiIGZpbHRlcj0idXJsKCNBSV9HYXVzc2lhbkJsdXJfNykiPg0KCQkJPHBhdGggZD0iTTQxMS4xMjMsMzM5LjEwOGwtMjgxLjUxMi0wLjAwMWwxMTQuMDUzLTE3MC4zbC0wLjA3LTAuMDE4bDI2Ljg1OS00MC4xNWMxLjQ5OC0yLjM5OSw1LjQ5NC05LjczMiw1LjQ5NC0xNC4wMDcNCgkJCQljMC0xMS4xODktOC45MzktMjAuMjk0LTE5LjkzLTIwLjI5NGMtNC4yMzIsMC04LjI3MywxLjMzMy0xMS42ODQsMy44NTVjLTUuMDEyLDMuNzA1LTguMDEsOS40MzMtOC4yMjcsMTUuNzE1djIuNDE1aC0zOC45NDkNCgkJCQlsLTAuMDA0LTIuNzI0Yy0wLjAwNC0wLjEyNC0wLjAwOC0wLjI0Ny0wLjAwOC0wLjM3MmMwLTcuNzI5LDEuNTgtMTUuMjI4LDQuNjk1LTIyLjI4NWMwLjMwNy0wLjY5NSwwLjYzNy0xLjM3OSwwLjk3My0yLjA2Mw0KCQkJCWwwLjA3OC0wLjE2NmMwLjA0NS0wLjA5OSwwLjA5LTAuMTk4LDAuMTM5LTAuMjk1YzkuODgzLTE5LjY1NiwzMC45MzgtMzIuMzUsNTMuNjQ2LTMyLjM1YzMyLjgyOCwwLDU5LjUzNywyNS42NCw1OS41MzcsNTcuMTU1DQoJCQkJYzAsMTQuODE5LTYuNzEzLDI3LjU5LTEyLjM0NiwzNS42OTNjLTAuOTEsMS4zMTItMS44NzksMi42MjEtMi44NzUsMy44OTZMMjAwLjU1MiwzMDQuMTAyaDE5NC4zODdMNDExLjEyMywzMzkuMTA4eg0KCQkJCSBNMTM4Ljk3OCwzMzQuMTA3aDI2NC4zMjRsLTExLjU2My0yNS4wMDVIMTg0LjYyNWw5Ljc1NC00Ljc0MWwxMDIuNTYzLTE1NC40NzVsMC4wNjEtMC4wNzhjMC45NTktMS4yMjMsMS44OTEtMi40ODEsMi43NjYtMy43NA0KCQkJCWM1LjIyMy03LjUxOCwxMS40NDktMTkuMzE1LDExLjQ0OS0zMi44MzljMC0yOC43Ni0yNC40NjUtNTIuMTU2LTU0LjUzNS01Mi4xNTZjLTIwLjgzNiwwLTQwLjEzOSwxMS42MTItNDkuMTc2LDI5LjU4NQ0KCQkJCWwtMC4wNjQsMC4xNDFjLTAuMDQ3LDAuMTAzLTAuMDk0LDAuMjA0LTAuMTQ1LDAuMzA0Yy0wLjI5OSwwLjYwOC0wLjYsMS4yMjktMC44NzcsMS44NjJjLTIuNTc2LDUuODM2LTMuOTk4LDEyLjAwNC00LjIzNCwxOC4zNjENCgkJCQloMjkuMTIzYzAuODc5LTYuODU4LDQuNDU5LTEzLjAxNSwxMC4wNTUtMTcuMTUxYzQuMjc3LTMuMTYzLDkuMzQ4LTQuODM1LDE0LjY1Ni00LjgzNWMxMy43NDYsMCwyNC45MywxMS4zNDcsMjQuOTMsMjUuMjk0DQoJCQkJYzAsNi40NzQtNS42NTIsMTUuNjkzLTYuMjk3LDE2LjcyNGwtMjIuNDMyLDMzLjUzbDAuMDg2LDAuMDAzTDEzOC45NzgsMzM0LjEwN3oiLz4NCgkJPC9nPg0KCTwvZz4NCjwvZz4NCjxnPg0KCTxnPg0KCQk8ZGVmcz4NCgkJCTxwYXRoIGlkPSJTVkdJRF83XyIgZD0iTTEyMC45OCwzMzYuNjA4aC01Ljk0Mkg4OS40OTFIMzQuODMzVjMyMS40NnYtMTUuMTQ4di0wLjAwMlY5Ni4wMDFIMEwxNS41Nyw2NS4xMDloNTAuNzUxdjIwLjE5N3YxMC42OTQNCgkJCQl2MjEwLjMwOWgyMy4xNjlWNDIuNTMzaC02Mi41NEw0NC45MTgsNi44ODZoNDQuNTcyYzMxLjQ4NywwLDMxLjQ4NywxNy44MjMsMzEuNDg3LDM1LjY0NkwxMjAuOTgsMzM2LjYwOEwxMjAuOTgsMzM2LjYwOHoiLz4NCgkJPC9kZWZzPg0KCQk8Y2xpcFBhdGggaWQ9IlNWR0lEXzhfIj4NCgkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzdfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4NCgkJPC9jbGlwUGF0aD4NCgkJPGcgY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzhfKSI+DQoJCQk8cmVjdCB4PSI4Ljc2IiB5PSIxMDAuMjgzIiBmaWxsPSIjNTIzNDdEIiB3aWR0aD0iMjMxLjA4MyIgaGVpZ2h0PSIxNjcuMzY1Ii8+DQoJCQk8cGF0aCBmaWxsPSIjNDE0OTkyIiBkPSJNMTM4LjIzOCwzMTYuMjQ3YzAtMjMuMjg1LDQzLjM3OS0xMTkuNyw3LjYyMy0xMTkuN2MtMzUuNzU0LDAtMTY5Ljk4Miw0Ny44MTUtMTY5Ljk4Miw3MS4xMDINCgkJCQljMCwyMy4yODUsNjEuODY2LDkwLjc2NCw5Ny42MjEsOTAuNzY0QzEwOS4yNTMsMzU4LjQxLDEzOC4yMzgsMzM5LjUzMywxMzguMjM4LDMxNi4yNDd6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjMjU2Q0FBIiBkPSJNMTUyLjI5NywyMTMuMThjLTUwLjgzOCwwLTE5NS42ODcsMTE0Ljk3Ny0xNTguMzUyLDE2Mi4yODhjMS40ODMsMS44OCwyLjkzNCwzLjc5NSw0LjM2Myw1LjczMg0KCQkJCWwxNTQuNjU2LDQ0LjgzYzE1LjU0OS0xMy4xOTcsMjUuMDg0LTMwLjk4NywyNS4wODQtNTAuNTYzQzE3OC4wNDYsMzM0Ljc2MiwyMDMuMTM2LDIxMy4xOCwxNTIuMjk3LDIxMy4xOHoiLz4NCgkJCTxwYXRoIGZpbGw9IiM0MTQ5OTIiIGQ9Ik0yNTguNTA5LDQ1LjI0NmMwLDMwLjA0MS00Ny43MDksMTEzLjYxNS0xMjYuODEsMTEzLjYxNWMtNzkuMTAxLDAtMjA0LjA1Ni04Ni4yNTctMTM2LjQ2Ni0xMjguNzQyDQoJCQkJQzIwLjY2NywxNC4xMzIsMzYuMTg1LTkuMTQ4LDExNS4yODUtOS4xNDhDMTk0LjM4Ni05LjE0OCwyNTguNTA5LDE1LjIwNiwyNTguNTA5LDQ1LjI0NnoiLz4NCgkJCTxwYXRoIGZpbGw9IiMyNTZDQUEiIGQ9Ik0yMTcuNTE1LDYwLjY5NmMwLDM4LjU3Mi0zLjc1LDQ2LjExMi0xNi4yOTUsNjkuODQyQzE1Ny4yOTYsMjEzLjYxNC03LjM0MSw1NC4xMjYsMTAuMDM5LDEuNzk3DQoJCQkJQzIyLjE5Ni0zNC44MSwxNDIuMDcyLTkuMTQ2LDE2OC45MTQtOS4xNDZTMjE3LjUxNSwyMi4xMjMsMjE3LjUxNSw2MC42OTZ6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjMUNBOUM5IiBkPSJNNjQuMTEtMjAuODE5YzEwLjUxOC0yMS41NjcsOTEuNzkzLDY1LjEwMiwxMTUuOTM0LDY1LjEwMmMyNC4xMzksMCw0My43MDUsMTkuNDUzLDQzLjcwNSw0My40NDkNCgkJCQljMCwyMy45OTUtMzYuNzMsMjAuMzM5LTQzLjcwNSw0My40NDhDMTYzLjI0MiwxODYuODYzLDM3LjA3NSwzNC42MjUsNjQuMTEtMjAuODE5eiIvPg0KCQkJPHBvbHlnb24gZmlsbD0iIzQ3QzQ3MyIgcG9pbnRzPSIxMzEuNywzNDAuMzg1IDI5NS44NDUsMzYyLjI3MiAyMDUuODEsMzYuNTU1IDEzNi44NDksMTEuNDUyIAkJCSIvPg0KCQkJPHBhdGggZmlsbD0iI0ZGRDQwRCIgZD0iTTMwMC45OTQsMjE2LjQyYzIxLjY4Ni01NS4xMjksNDQuNDE2LTE0NC4xODYsNDQuNDE2LTE2Ni4zNDZjMC0zMi43MDctMTguMzAxLTU5LjIyMi00MC44NzUtNTkuMjIyDQoJCQkJYy0yMi41NzIsMC0xNDYuMzUyLDE2LjczOC0xNDcuMDg1LDQxLjE5N2MtMS45NzksNjUuODI2LDE1Ljc2MywxMTguMDE5LDM4LjE5OCwxNTUuODY0DQoJCQkJQzIxNy4wNiwzNDIuNDg2LDM1Mi41NDQsNDIyLjAyMSwzMzYuNDAyLDM1My4yNkMzMzQuNDA0LDM0NC43NjUsMzEzLjYyNiwyNzIuMzQ4LDMwMC45OTQsMjE2LjQyeiIvPg0KCQkJPHBhdGggZmlsbD0iIzFDQTlDOSIgZD0iTTIxMS44NDEsMzYyLjI3MmMtNS4wNjQtOS42NTMtNDEuMzUtNzkuMTc2LTM0Ljc2Mi0xMzMuODkyYzAuNTA2LTQuMTk2LTI2LjQ4NCw4LjE2NS0zNy42OTcsMjAuMzY5DQoJCQkJYy0xLjQ4LTIuNTUtMy4wOC00LjEwMy00Ljc4Ny00LjI3NmMtMTAuNjIxLTEuMDg1LTcwLjQ4Nyw4OS44NzctNzAuNDg3LDEwOS40MzFjMCwxOS41NTUsMzcuMTgsMzAuODk3LDQ3LjMxMywzMC44OTcNCgkJCQljNS42NTUsMCwxNy4zMjgtMTUuOTY1LDI2LjU0LTMzLjQ3M2gyOC40OTd2LTYuMzU1QzE4Mi45NjQsMzUyLjk4MSwyMTYuOTkyLDM3Mi4wOTMsMjExLjg0MSwzNjIuMjcyeiIvPg0KCQkJPHBhdGggZmlsbD0iI0ZBQTYyOSIgZD0iTTQyOS4xOTEsMzE3LjE5NGMxNS40NDMtNTAuNzg2LDM5LjE2OC0xMjMuOTY2LDM5LjE2OC0xNDkuODMxYzAtMzguNDctMTQuOTg4LTY5LjY1My0zMy40NzMtNjkuNjUzDQoJCQkJYy03LjM3MSwwLTQzLDUuMzczLTgyLjk1NSwxNC4yNjFjLTIuNDk2LTExLjcyMy0zLjk0NS0yMS4xNzUtMy45NDUtMjcuNDU3YzAtNDkuOTQ4LTEzLjY4OC05MC40MzktMzAuNTc2LTkwLjQzOQ0KCQkJCWMtMTYuODg3LDAtMTMxLjk3MS0zOS41NjYtMTM0Ljg1NSwxMC4yOTljLTMuMzgxLDU4LjQyOCwxNC4yMjksMTE1LjE1Miw0MS4yNzcsMTY2LjE5NQ0KCQkJCWM3LjExNSw2OS40NjMsOTMuNjc2LDE2OC4wNDMsMTQ4LjIzNCwyMDIuMDQ2TDQyOS4xOTEsMzE3LjE5NHoiLz4NCgkJCTxwYXRoIGZpbGw9IiNGNjZGMDkiIGQ9Ik00MjIuMDE5LDg5LjQyNUwzNDguNTkzLTMzLjEyN2MtNjguMzY3LTcuMTkyLTEwMS41MzUtNTguNzg3LTEyMi4yNywxNC4zMjQNCgkJCQljLTE2LjQyLDU3Ljg5NS05Ljc0OCwxMTUuMTk0LDE4LjgyLDE2OS41MjhjMC4wODIsMS4wMTMsMC4yNDQsMi4wMDksMC40OSwyLjk4NGMxOC4zNDIsNzIuODQ1LDEwMi4zODcsMTQ5LjkzNiwxNjYuMzQyLDE3OS4yMTgNCgkJCQlMNDIyLjAxOSw4OS40MjV6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjRDQwMjFDIiBkPSJNNDI3Ljg0NSw4NS43NjFMMzExLjA1NC0xMDkuMTdjLTI5LjQ2MywxOC43OS00NC4yMzYsNTIuNzQyLTU0LjI3LDEwOC43Nw0KCQkJCWMtMjUuMjQsMTQwLjk4Niw2OS4zMzgsMjMwLjA0NCwxNjQuODQyLDIzNi45NjVMNDI3Ljg0NSw4NS43NjF6Ii8+DQoJCTwvZz4NCgk8L2c+DQoJPGcgZGlzcGxheT0ibm9uZSI+DQoJCTxkZWZzPg0KCQkJPHBhdGggaWQ9IlNWR0lEXzlfIiBkPSJNMTIwLjk4LDMzNi42MDhoLTUuOTQySDg5LjQ5MUgzNC44MzNWMzIxLjQ2di0xNS4xNDh2LTAuMDAyVjk2LjAwMUgwTDE1LjU3LDY1LjEwOWg1MC43NTF2MjAuMTk3djEwLjY5NA0KCQkJCXYyMTAuMzA5aDIzLjE2OVY0Mi41MzNoLTYyLjU0TDQ0LjkxOCw2Ljg4Nmg0NC41NzJjMzEuNDg3LDAsMzEuNDg3LDE3LjgyMywzMS40ODcsMzUuNjQ2TDEyMC45OCwzMzYuNjA4TDEyMC45OCwzMzYuNjA4eiIvPg0KCQk8L2RlZnM+DQoJCTxjbGlwUGF0aCBpZD0iU1ZHSURfMTBfIiBkaXNwbGF5PSJpbmxpbmUiPg0KCQkJPHVzZSB4bGluazpocmVmPSIjU1ZHSURfOV8iICBvdmVyZmxvdz0idmlzaWJsZSIvPg0KCQk8L2NsaXBQYXRoPg0KCQk8ZyBkaXNwbGF5PSJpbmxpbmUiIG9wYWNpdHk9IjAuNCIgY2xpcC1wYXRoPSJ1cmwoI1NWR0lEXzEwXykiIGZpbHRlcj0idXJsKCNBSV9HYXVzc2lhbkJsdXJfNykiPg0KCQkJPHBhdGggZD0iTTEyMy40NzgsMzM5LjEwOEgzMi4zMzNWOTguNTAxSC00LjA2MUwxNC4wMyw2Mi42MDloNTQuNzkxdjI0MS4yaDE4LjE2OVY0NS4wMzNIMjIuODkyTDQzLjM3OSw0LjM4Nmg0Ni4xMTENCgkJCQljMzMuOTg3LDAsMzMuOTg3LDIwLjI2NywzMy45ODcsMzguMTQ2VjMzOS4xMDh6IE0zNy4zMzMsMzM0LjEwOGg4MS4xNDVWNDIuNTMzYzAtMTcuNzg2LDAtMzMuMTQ2LTI4Ljk4OC0zMy4xNDZINDYuNDU4DQoJCQkJTDMxLjAxMiw0MC4wMzNIOTEuOTl2MjY4Ljc3Nkg2My44MjF2LTI0MS4ySDE3LjEwOUw0LjA1OSw5My41MDFoMzMuMjc0TDM3LjMzMywzMzQuMTA4TDM3LjMzMywzMzQuMTA4eiIvPg0KCQk8L2c+DQoJPC9nPg0KPC9nPg0KPC9zdmc+DQo=",
  ch13: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTA5IiB2aWV3Qm94PSIwIDAgODAgMTA5IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0zLjQ1MjY0IDgxLjA0NDJIMjAuOTQ2N1YwLjAwMjkyOTY5SDcuMTE3ODZDNS4wOTQ2OCAwLjAwOTI2NDUxIDMuNDU1ODIgMS42NDM1OSAzLjQ1NTgyIDMuNjYxMjNWODEuMDQ0MkgzLjQ1MjY0WiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjxwYXRoIGQ9Ik01OS41MTcyIDQ2LjUxOTRDNjEuMzg0OCA0OC40MTY3IDYyLjUzNzcgNTEuMDE3MiA2Mi41Mzc3IDUzLjg4MzdDNjIuNTM3NyA1OS42OTU5IDU3LjgxMTcgNjQuNDA5IDUxLjk4MzUgNjQuNDA5QzQ2LjE1NTMgNjQuNDA5IDQxLjU3NTQgNTkuODM1MiA0MS40MzU2IDU0LjE0MzNIMjMuOTcwMkMyNC4xMSA2OS40NTQ2IDM2LjU5ODQgODEuODIzNCA1MS45ODM1IDgxLjgyMzRDNjcuMzY4NiA4MS44MjM0IDgwIDY5LjMxNTMgODAgNTMuODgzN0M4MCA0Ni4yMDU5IDc2Ljg5MDUgMzkuMjUzNCA3MS44NjU5IDM0LjIwNDZMNTkuNTE3MiA0Ni41MTk0WiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjxwYXRoIGQ9Ik03OC4xOTU4IDBIMjQuODUzVjE2LjY0MTZINzguMTk1OFYwWiIgZmlsbD0iI0VDMUY4MCI+PC9wYXRoPjxwYXRoIGQ9Ik02MS40OTU5IDE2LjY0MTNMNDQuODU2MyAzMy4yMzU0QzQzLjcyMjQgMzQuMzY2MSA0My43MjI0IDM2LjE5NjggNDQuODU2MyAzNy4zMjQ0TDU0LjYwMzcgNDcuMDQ1M0w3OC4xOTU5IDIzLjUxNzdWMTYuNjM4Mkg2MS40OTU5VjE2LjY0MTNaIiBmaWxsPSIjMDAxMDRCIj48L3BhdGg+PHBhdGggZD0iTTUwLjQ0NjMgODUuOTM0NlYxMDAuNzM2QzUwLjQ0NjMgMTAyLjIyNSA0OS4yMzMgMTAzLjQzNSA0Ny43NDAzIDEwMy40MzVINDUuMTA3M1Y4NS45NTAzTDM4Ljg0NzIgODUuOTM0NlYxMDMuNDM1SDMzLjU3MTZWODUuOTUwM0wyNy4zMTE1IDg1LjkzNDZWMTA4Ljk5M0w0OC4yNTggMTA5QzUyLjkxNzMgMTA5IDU2LjcwOTYgMTA1LjIxNSA1Ni43MDk2IDEwMC41NjhWODUuOTUzNkw1MC40NDk1IDg1LjkzNzdMNTAuNDQ2MyA4NS45MzQ2WiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjxwYXRoIGQ9Ik03NS43NTAyIDg1LjkzNDZINTkuMTMyOFY5MS41MDZINzEuNTM1NVYxMDguOTlINzcuNzk1NlY4Ny45NzQ0Qzc3Ljc5NTYgODYuODQ5OSA3Ni44Nzc4IDg1LjkzNDYgNzUuNzUwMiA4NS45MzQ2WiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjxwYXRoIGQ9Ik0yMi42MDEyIDg1LjkzNTFMMy40NjE5NyA4NS45Mjg3QzMuNDQ5MjYgODkuMzQgMy40NTU2MSA5OS4wNDUgMy40NTU2MSAxMDIuNDU2QzMuNDU1NjEgMTAzLjAyIDMuMzM4MDkgMTAzLjEyOCAyLjc1Njg2IDEwMy4xMjVIMFYxMDguOTU2QzEuNDUxNDggMTA4Ljk0MyAzLjMyNTM4IDEwOC45NjggNC43NzY4NiAxMDguOTM3QzUuMjMxMDUgMTA4LjkyNyA1LjY5NDc2IDEwOC44MzUgNi4xMjk4OSAxMDguNzAyQzcuOTM3MSAxMDguMTUxIDkuOTA2MjkgMTA2LjA4OSA5Ljg0NTk0IDEwMy40OTJWOTEuNTA2NUgxOC4zODY1VjEwOC45OTFIMjQuNjQ2NlY4Ny45NzQ4QzI0LjY0NjYgODYuODUwNCAyMy43Mjg3IDg1LjkzNTEgMjIuNjAxMiA4NS45MzUxWiIgZmlsbD0iIzAwMTA0QiI+PC9wYXRoPjwvc3ZnPg==",
  ch14: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOC4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgMzQ0LjggMTA1LjQiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDM0NC44IDEwNS40IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxyZWN0IHg9IjExLjkiIHk9IjE2LjQiIGZpbGw9IiNGRkZGRkYiIHdpZHRoPSI2My44IiBoZWlnaHQ9IjUxLjciLz4NCgk8Zz4NCgkJPHBvbHlnb24gZmlsbD0ibm9uZSIgcG9pbnRzPSI2Ny42LDQxLjIgNTkuMyw0MS4yIDU5LjMsNDggNDcuNCw0OCA2MS45LDIwLjUgNTEuOSwyMC41IDM1LjgsNDkuNSAzNS44LDU1LjMgNTkuMyw1NS4zIDU5LjMsNjMuMiANCgkJCTY3LjYsNjMuMiA2Ny42LDU1LjMgNzIuMSw1NS4zIDcyLjEsNDggNjcuNiw0OCAJCSIvPg0KCQk8cG9seWdvbiBmaWxsPSJub25lIiBwb2ludHM9IjE1LjMsMjMuOCAxNS4zLDMxIDIyLjYsMzAgMjIuNiw2My4yIDMxLjgsNjMuMiAzMS44LDIwLjUgMjQuOCwyMC41IAkJIi8+DQoJCTxwYXRoIGZpbGw9IiNFMjFGMjYiIGQ9Ik00My4zLDBDMTkuNCwwLDAsMTkuNCwwLDQzLjNzMTkuNCw0My4zLDQzLjMsNDMuM2MyMy45LDAsNDMuMy0xOS40LDQzLjMtNDMuM1M2Ny4xLDAsNDMuMywweiBNMzEuOCw2My4yDQoJCQloLTkuMlYzMGwtNy4zLDF2LTcuMmw5LjUtMy4zaDdWNjMuMnogTTcyLjEsNTUuM2gtNC41djcuOGgtOC4zdi03LjhIMzUuOHYtNS44bDE2LjItMjloMTBMNDcuNCw0OGgxMS44di02LjhoOC4zVjQ4aDQuNVY1NS4zeiIvPg0KCQk8cGF0aCBmaWxsPSIjMTQxNTMzIiBkPSJNMzQ0LjgsNDIuNlY4MmMwLDMuNi0wLjUsNi45LTEuNSw5LjdjLTEsMi44LTIuNSw1LjItNC41LDcuMmMtMiwyLTQuNiwzLjUtNy43LDQuNQ0KCQkJYy0zLjEsMS02LjgsMS41LTExLjEsMS41aC0zMlY4OC44aDkuN2wtNy43LTQ2LjNoMjAuM2w3LjUsNDYuM2gyLjFjMS42LDAsMi44LTAuNSwzLjQtMS41YzAuNy0xLDEtMi42LDEtNVY0Mi42SDM0NC44eg0KCQkJIE0yNzkuMSw0Ny4xYy0xLjgtMS43LTQuMS0yLjgtNi44LTMuNWMtMi44LTAuNy02LjEtMS05LjktMWgtMjcuNXYxNi4xSDI2MWMwLjgsMCwxLjQsMC42LDEuNCwxLjR2MjYuNWMwLDEuMi0xLDIuMi0yLjIsMi4yDQoJCQloLTI1LjJ2MTYuMWgyNy41YzMuNywwLDYuOS0wLjQsOS43LTEuMWMyLjctMC43LDUtMS45LDYuOS0zLjZjMS44LTEuNywzLjItNCw0LjEtNi45YzAuOS0yLjksMS4zLTYuNSwxLjMtMTAuOFY3MnYtNy4xDQoJCQljMC00LjQtMC40LTgtMS4zLTEwLjlDMjgyLjIsNTEsMjgwLjksNDguOCwyNzkuMSw0Ny4xeiBNMjA4LDgzLjJjMCwxLjMtMC4xLDIuNC0wLjMsMy4yYy0wLjIsMC44LTAuNSwxLjUtMC45LDEuOQ0KCQkJYy0wLjQsMC40LTAuOSwwLjgtMS41LDAuOWMtMC42LDAuMi0xLjMsMC4yLTIuMSwwLjJoLTQuNlY0Mi42aC0xOC45djQ2LjhoLTVjLTAuOCwwLTEuNS0wLjEtMi4xLTAuMmMtMC42LTAuMi0xLTAuNS0xLjQtMC45DQoJCQljLTAuNC0wLjQtMC42LTEuMS0wLjgtMS45Yy0wLjItMC44LTAuMy0xLjktMC4zLTMuMlY0Mi42aC0xOS42djQwLjZjMCw0LjEsMC42LDcuNSwxLjcsMTAuM2MxLjEsMi44LDIuOCw1LjEsNC45LDYuOQ0KCQkJYzIuMiwxLjgsNC45LDMuMSw4LjEsMy45YzMuMywwLjgsNywxLjIsMTEuMywxLjJoMjVjMy45LDAsNy41LTAuNCwxMC43LTEuM2MzLjItMC45LDUuOS0yLjIsOC4yLTRjMi4zLTEuOCw0LTQuMSw1LjMtNi45DQoJCQljMS4yLTIuOCwxLjktNi4yLDEuOS0xMC4xVjQyLjZIMjA4VjgzLjJ6IE0xMjIuNyw4MC4xSDE0M1Y0Mi42aC0yMC4zVjgwLjF6IE05NC43LDEwNC45aDIwLjJWNDIuNkg5NC43VjEwNC45eiIvPg0KCTwvZz4NCjwvZz4NCjwvc3ZnPg0K",
  kan: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNzgzLjggMzAzLjciPgogIDxnPgogICAgPHJlY3QgeD0iMjQzLjgiIHdpZHRoPSI0My45IiBoZWlnaHQ9IjMwMy43Ii8+CiAgICA8cmVjdCB4PSIzNjcuMiIgeT0iMzMuNyIgd2lkdGg9IjQzLjkiIGhlaWdodD0iMjAyLjciLz4KICAgIDxwYXRoIGQ9Ik02ODIuNiAzMy44aC00OXY0My45aDQ5YzMxLjYgMCA1Ny4zIDI1LjcgNTcuMyA1Ny4yIDAgMzEuOC0yNS43IDU3LjgtNTcuMyA1Ny44aC00OXY0My45aDQ5YzU1LjggMCAxMDEuMi00NS42IDEwMS4yLTEwMS42IDAtNTUuOS00NS40LTEwMS4yLTEwMS4yLTEwMS4yeiIvPgogICAgPHBvbHlnb24gcG9pbnRzPSI1NzAuOCA1Ni43IDUzOS4yIDI1LjEgNDMxLjIgMTMyLjkgNTQzIDI0NC43IDU3NC43IDIxMyA0OTQuNSAxMzIuOSIvPgogICAgPHBhdGggZD0iTTAgNjUuOHYyNS43aDMzLjZ2MTM4LjFoMzcuNVYzNC45SDQxLjhDMzYuNiA1My4yIDIwLjggNjUgMCA2NS44eiIvPgogICAgPHBhdGggZD0iTTExNC42IDY1Ljh2MjUuN2gzMy42djEzOC4xaDM3LjVWMzQuOWgtMjkuM2MtNS4yIDE4LjMtMjEgMzAuMS00MS44IDMwLjl6Ii8+CiAgPC9nPgo8L3N2Zz4K",
  i24: "data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjIyMy42MDY3OTgiIHZpZXdCb3g9IjAgMCAxNS45Mzk1NTcgNy45NDI3OTE3IiB3aWR0aD0iNDQ3LjIxMzU5NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGNsaXBQYXRoIGlkPSJhIj48cGF0aCBkPSJtOTU0LjY4NSA2My4yMzZoNzYuNTM1djcwLjg2NmgtNzYuNTM1eiIvPjwvY2xpcFBhdGg+PHBhdGggZD0ibTAgMGgtNDAuMjAzbDQuMjMxIDIxLjc2NWg0MC4yMDJ6IiBmaWxsPSIjMTMyNTQ0IiB0cmFuc2Zvcm09Im1hdHJpeCguMzUyNzc3NzcgMCAwIC0uMzUyNzc3NzcgMTQuMzE1MDE2IDcuODEwNSkiLz48ZyBmaWxsPSIjZmZmIj48cGF0aCBkPSJtMCAwLS44MTUgMS4zOTZoLS42ODNsLS41MTMtMi42NzdoLjcyNGwuMjgyIDEuNDQ4Ljg0Ni0xLjQ0OGguNjQxbC41MTQgMi42NzdoLS43MjV6IiB0cmFuc2Zvcm09Im1hdHJpeCguMzUyNzc3NzcgMCAwIC0uMzUyNzc3NzcgNC42MDI0MDEgNi4zNDk3OCkiLz48cGF0aCBkPSJtMCAwaDIuMTQzbC4xMjEuNjU1aC0xLjQxOWwuMDgyLjQzMWgxLjI2N2wuMTEyLjU4aC0xLjI2N2wuMDc4LjM1NWgxLjM5OWwuMTIxLjY1NmgtMi4xMjR6IiB0cmFuc2Zvcm09Im1hdHJpeCguMzUyNzc3NzcgMCAwIC0uMzUyNzc3NzcgNS4wMDg1ODkgNi44MDE3NikiLz48cGF0aCBkPSJtMCAwLS43NTctMS41MzEtLjIxMSAxLjUzMWgtLjYzbC0uODA3LTEuNTMxLS4xNjQgMS41MzFoLS43NzNsLjM2Ni0yLjY3N2guNjM3bC44MjQgMS41MjEuMjM2LTEuNTIxaC42MzhsMS4zOTkgMi42Nzd6IiB0cmFuc2Zvcm09Im1hdHJpeCguMzUyNzc3NzcgMCAwIC0uMzUyNzc3NzcgNy4yNTEzMjYgNS44NTc0OCkiLz48ZyBjbGlwLXBhdGg9InVybCgjYSkiIHRyYW5zZm9ybT0ibWF0cml4KC4zNTI3Nzc3NyAwIDAgLS4zNTI3Nzc3NyAtMzQyLjg4NTI4NCAzOC42OTgwNSkiPjxwYXRoIGQ9Im0wIDBjLjAxOS4wOTUuMTIuMTcuMjk3LjE3LjIzNCAwIC40OC0uMDkxLjY4OS0uMjYxbC40NjYuNTE4Yy0uMjQyLjIyOS0uNTY5LjM1LTEuMDE4LjM1LS42MzQgMC0xLjA5MS0uMzU0LTEuMTg2LS44NDRsLS4wMDItLjAwOGMtLjEwNS0uNTQzLjI5Ny0uNzAxLjgzNS0uODMuMzQyLS4wODMuNDE3LS4xNDQuMzk2LS4yNTNsLS4wMDItLjAwN2MtLjAyMi0uMTEzLS4xNDEtLjE4Mi0uMzM3LS4xODItLjMwNSAwLS41NzUuMTEtLjc5NC4zMThsLS41MDItLjQ4OGMuMjY3LS4yOS42ODQtLjQzNyAxLjE1Mi0uNDM3LjY0MSAwIDEuMTMuMzIxIDEuMjM1Ljg2bC4wMDEuMDA4Yy4wOTYuNDk0LS4yNDMuNjktLjgyNS44MjItLjM0OS4wODMtLjQzLjEzNi0uNDA2LjI1NnoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk5NC4xNDUxIDkyLjM0MDQpIi8+PHBhdGggZD0ibTAgMCA0LjY0NiA1LjA4Ni0uOTg5LTUuMDg2em04LjMzLS4wMDRoLTEuODA4bDEuODA2IDkuMzAzaC0uNzkzLTIuMDctLjc5M2wtOC40ODEtOS4zMDNoLTcuODY5Yy4yNzYgMS4wMSAxLjExMiAxLjgwMyAyLjM0NyAxLjgwM2gzLjcwMmMyLjA1MSAwIDMuNzIxIDEuNjkxIDMuNzIxIDMuNzUgMCAyLjA1OC0xLjY3IDMuNzUtMy43MjEgMy43NWgtNy4xODJsLS41NDYtMi44MTNoNy43MjhjLjQ5MiAwIC45MDgtLjQzOC45MDgtLjkzN3MtLjQxNi0uOTM4LS45MDgtLjkzOGgtMy43MDJjLTIuNTc2IDAtNC43NDQtMS44NTgtNS4yNy00LjU0NmwtLjQxNS0yLjE5MmMtLjI5NC0uMzE4LTEuNzQ1LTEuODUyLTIuMjU1LTEuNjc1LS4yMzUuMDgyLS4yMTIuNDYxLS4xOS42MjVsMS42NTMgOC41MWgtMy4xMTVzLTEuNTIxLTcuODIzLTEuNTM3LTcuOTA3Yy0uMzA2LTEuNTA0LS41NzItMi44OTMtLjIyOC0zLjYwOCAxLjA5My0yLjI3NiA0LjgxNCAyLjI4NCA1LjY2MSAzLjM2NmgxOC4xMzhsLS41NDctMi44MTRoMS44OTVjLjU2NCAwIDEuMDQ4LjQgMS4xNTUuOTUzbC4zNjIgMS44NjFoMS44MDd6IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5OTguMzE3NSA5Ny4wNTkyKSIvPjxwYXRoIGQ9Im0wIDBoLTEuMTg3Yy0xLjEyIDAtMi4wODMtLjc5LTIuMjk2LTEuODlsLS4xNzktLjkxN2gzLjExNXoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk4My4yODM4IDEwNi4zNikiLz48L2c+PC9nPjwvc3ZnPg==",
  walla: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNS4wLjIsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iMTczNi4yMzhweCIgaGVpZ2h0PSI1MDguODAxcHgiIHZpZXdCb3g9IjAgMCAxNzM2LjIzOCA1MDguODAxIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAxNzM2LjIzOCA1MDguODAxIg0KCSB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTE3OC40NjQsOTQuODkyYzkuNjQyLTUuMTIxLDE3LjI0NC0yLjg2MiwyMi44MTgsNi43NzhsODYuOTgzLDE2MC40MTUNCglsMzUuMjQ5LTEzOC4yNzNjMy40NjQtMTIuNjUxLDEwLjg0My0xOC45NzcsMjIuMTM5LTE4Ljk3N2g2MS45MDZsOS4wMzgsMy42MTRsMi4yNTksMTQuNjg2bC00MS4xMTgsMTY0LjkzMw0KCWMtMy42MTgsMTIuMTk3LTEwLjk5NiwxOC4zLTIyLjE0MywxOC4zaC00Mi4wMjJsNjkuMzU5LDEyMC42NDljNC42NjksOS4xODgsMi40MDksMTYuNTY1LTYuNzc4LDIyLjEzOWwtNTEuMDYsMjguMjQxDQoJYy05Ljc5Miw1LjEyMy0xNy4xNywzLjA4OS0yMi4xNDQtNi4wOTlsLTg3Ljg4NC0xNTkuNzM3bC0zNC4zNDUsMTM3LjU5NGMtMy42MTQsMTIuMjAxLTEwLjk5NiwxOC4zLTIyLjEzOSwxOC4zaC02Mi41ODYNCglsLTguNTgzLTMuODRjLTMuNDY0LTMuNjEzLTQuNDQzLTguMjA3LTIuOTM4LTEzLjc4bDQyLjAyMi0xNjUuNjExYzMuMDE0LTEyLjIwMSwxMC4zOTItMTguMjk5LDIyLjE0My0xOC4yOTloNDEuMTE4bC02Ny43NzktMTE5Ljk3DQoJYy02LjE3NC0xMC4yNDQtNC40NDQtMTcuODUsNS4xOTgtMjIuODJMMTE3OC40NjQsOTQuODkyeiBNMTQ4OC40NDYsMTIzLjgxMWMzLjAxLTEyLjY1MSwxMC4zOTMtMTguOTc3LDIyLjE0LTE4Ljk3N2g2MS45MDYNCglsOS4wMzcsMy42MTRjMy4wMTQsMy42MTYsMy43NjQsOC41MSwyLjI2LDE0LjY4NmwtMjYuNjYyLDEwNC42MDZ2MjIxLjQxNGMwLDEyLjIwMS01Ljg3NCwxOC4zLTE3LjYyLDE4LjNoLTU4Ljc0Mw0KCWMtMTEuNzUxLDAtMTcuNjI0LTYuMDk5LTE3LjYyNC0xOC4zVjIzOS4wMzZjMC0xMS4xNDQsMS4yNzktMjEuMzExLDMuODQ0LTMwLjUwMUwxNDg4LjQ0NiwxMjMuODExeiBNMTYxOC4xMjgsMjA4LjUzNQ0KCWwyMS40NjMtODQuNzI1YzMuNjE5LTEyLjY1MSwxMC45OTctMTguOTc3LDIyLjE0NC0xOC45NzdoNjIuNTgxbDguMzYyLDMuNjE0YzMuMTY0LDMuNjE2LDQuMjE5LDguNTEsMy4xNjQsMTQuNjg2bC0yNi42NjEsMTA0LjYwNg0KCXYyMjEuNDE0Yy0wLjYwNSwxMi4yMDEtNi40NzksMTguMy0xNy42MjUsMTguM2gtNTguNzQyYy0xMS43NDcsMC0xNy42Mi02LjA5OS0xNy42Mi0xOC4zVjIzOS4wMzZMMTYxOC4xMjgsMjA4LjUzNXoNCgkgTTUyNS41MTksMTIzLjEzM2MwLTEyLjE5OSw1Ljg3NS0xOC4zLDE3LjYyNS0xOC4zaDIxMy4wNTRjMTEuNTk3LDAsMTcuMzk3LDYuMzI2LDE3LjM5NywxOC45Nzd2MzI1LjM0Mw0KCWMwLDEyLjIwMS01LjgwMSwxOC4zLTE3LjM5NywxOC4zaC01OC45N2MtMTEuNTk3LDAtMTcuMzk1LTYuMDk5LTE3LjM5NS0xOC4zVjE4My40NThINTQzLjE0M2MtMTEuNzQ5LDAtMTcuNjI1LTUuODczLTE3LjYyNS0xNy42MjINCglWMTIzLjEzM3ogTTk0My4yNjksMy44NDFjMy4wMTQsMy42MTQsMy43NjQsOC4yMSwyLjI1OSwxMy43ODFsLTIyLjE0Myw4Ny4yMTFoMTQwLjUzMmw5LjAzOCwzLjYxNGwyLjI1OSwxNC42ODZsLTgzLjgyLDMyNi4wMjENCgljLTMuNjE4LDEyLjIwMS0xMS4yOTYsMTguMy0yMy4wNDgsMTguM0g5MDYuNDRsLTkuMDM3LTMuODRjLTMuMDEtMy42MTMtMy43NjQtOC4yMDctMi4yNi0xMy43OGw2OC42ODUtMjY2LjM3Nkg4MjMuOTc3bC04LjM2LTMuODQxDQoJYy0zLjQ2NC0zLjYxNC00LjQ0My04LjIwOC0yLjkzNy0xMy43ODFsMzYuNjAyLTE0Ni42MzFDODUyLjI5Myw2LjQwMyw4NTkuODk5LDAsODcyLjEsMGg2MS45MDZMOTQzLjI2OSwzLjg0MXogTTE2NC45MzEsMjI0LjU3OA0KCWwyOS44MjQsMTAzLjkyN2w1LjQyMSwxMi4yMDFjMi41NjIsMy4wMTQsNi44NTUsNC41MTksMTIuODc5LDQuNTE5aDMzLjY2NWM5LjE4OCwwLDE1LjA2MS01LjU3NCwxNy42MjMtMTYuNzJsMjQuNC0xMTcuNzENCglsMjcuNTY0LTg2LjMwNWMxLjUwNy00LjUxOSwwLjk3OS04LjU4Ny0xLjU4Mi0xMi4yMDFsLTkuMjYyLTUuMTk2aC05OS4xODZjLTExLjE0NiwwLTE4LjI5OSw1LjU3My0yMS40NjMsMTYuNzE4bC0xOC4zLDY4LjAwNw0KCUMxNjMuMDQ5LDIwNC40NjksMTYyLjUyMSwyMTUuMzkxLDE2NC45MzEsMjI0LjU3OHogTTIyOS4wOTcsNTAuNjFjNjMuMjYxLDAsMTE3LjI1OCwyMi4zNjYsMTYxLjk5Miw2Ny4xMDMNCgljNDQuNzM3LDQ0LjczNCw2Ny4xMDMsOTguNzMsNjcuMTAzLDE2MS45OTJjMCw2My4xMTEtMjIuMzY2LDExNy4wMzUtNjcuMTAzLDE2MS43NjdjLTQ0LjczNCw0NC44ODctOTguNzMsNjcuMzMtMTYxLjk5Miw2Ny4zMw0KCWMtNjMuMTExLDAtMTE3LjAzNS0yMi40NDMtMTYxLjc2OS02Ny4zM0MyMi40NDMsMzk2LjczOSwwLDM0Mi44MTUsMCwyNzkuNzA0YzAtNjMuMjYxLDIyLjQ0My0xMTcuMjU4LDY3LjMyOC0xNjEuOTkyDQoJQzExMi4wNjIsNzIuOTc2LDE2NS45ODUsNTAuNjEsMjI5LjA5Nyw1MC42MXogTTI0Mi4yLDQ2NS4xOTRjMTIuMTk5LDAsMTkuNTgtNi4wOTksMjIuMTQxLTE4LjNsMTMuNzgxLTU2LjQ4Mg0KCWMxLjUwNy02LjE3NCwwLjc1NS0xMC43NjgtMi4yNTktMTMuNzgxYy0yLjU1OS0yLjU2LTUuNjQ4LTMuODM5LTkuMjYyLTMuODM5aC02Ni40MjVjLTEyLjE5OSwwLTE5LjU3OSw2LjA5OC0yMi4xNDEsMTguMjk5DQoJbC0xMy43ODEsNTYuNDgzYy0xLjUwNyw1LjU3My0wLjc1NCwxMC4xNjcsMi4yNTksMTMuNzgxbDkuMjYzLDMuODM5SDI0Mi4yeiBNNTkwLjM2Miw0NDkuMTU0DQoJYy0zLjAxMiwxMi4yMDEtMTAuMzkyLDE4LjMtMjIuMTQxLDE4LjNoLTYxLjkwNmwtOS4wMzgtMy44NGMtMy4xNjItMy42MTMtMy45MTYtOC4yMDctMi4yNTktMTMuNzhsNDEuMTItMTY1LjYxMQ0KCWMzLjYxNi0xMi4yMDEsMTAuOTk3LTE4LjI5OSwyMi4xNDEtMTguMjk5aDYyLjU4NGMzLjE2NCwwLDUuOTUsMS4yNzksOC4zNiwzLjgzOWMzLjE2NCwzLjQ2NCw0LjIxNiw3Ljk4MywzLjE2NCwxMy41NTYNCglMNTkwLjM2Miw0NDkuMTU0eiIvPg0KPC9zdmc+DQo="
};
let poll = null;
let group = null; // {code, name}
const PARTY_MODE = new URLSearchParams(location.search).get("mode") === "party"; // מצב טאבלט: לוח תוצאות גדול וכהה (הצגה בלבד)

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
  if (PARTY_MODE) {
    document.body.classList.add("party");
    const g0 = (new URLSearchParams(location.search).get("g") || localStorage.getItem("groupCode") || GENERAL.code).toUpperCase();
    const r0 = g0 === GENERAL.code ? { ok: true, data: GENERAL } : await api("/api/group?code=" + encodeURIComponent(g0));
    await enterGroup(r0.ok ? r0.data : GENERAL);
    history.replaceState(null, "", "?mode=party" + (group.code !== GENERAL.code ? "&g=" + group.code : ""));
    switchTab("stats");
    return;
  }
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

// ===== תוצאות וניקוד (הצעה לאישור יובל - ראו README) =====
// תוצאה משולבת של המדגמים: ממוצע לכל מפלגה, מעוגל, מנורמל ל-120 בשיטת השאריות הגדולות.
function combinedResults() {
  if (RESULT_STAGE === "official" && OFFICIAL_RESULTS) return { seats: Object.fromEntries(PARTIES.map(p => [p.id, OFFICIAL_RESULTS.seats[p.id] || 0])), srcs: [{ label: "תוצאות אמת מלאות", src: OFFICIAL_RESULTS.src, date: OFFICIAL_RESULTS.date }] };
  if ((RESULT_STAGE !== "exit" && RESULT_STAGE !== "exit_actual") || !EXIT_POLLS.length) return null;
  const field = RESULT_STAGE === "exit_actual" ? "actualSeats" : "seats";
  const usable = EXIT_POLLS.filter(pl => pl[field]);
  if (!usable.length) return null;
  const raw = {}, floors = {};
  PARTIES.forEach(p => { raw[p.id] = usable.reduce((a, pl) => a + (pl[field][p.id] || 0), 0) / usable.length; floors[p.id] = Math.floor(raw[p.id]); });
  let sum = PARTIES.reduce((a, p) => a + floors[p.id], 0);
  const byRemainder = [...PARTIES].sort((a, b) => (raw[b.id] - floors[b.id]) - (raw[a.id] - floors[a.id]));
  for (let i = 0; sum < 120 && i < byRemainder.length; i++, sum++) floors[byRemainder[i].id]++;
  return { seats: floors, srcs: usable.map(pl => ({ label: pl.label, src: pl.src, date: pl.date })) };
}

// ניקוד קירוב: מתחילים ב-100 ומורידים שגיאה משוקללת.
// שגיאה של מפלגה שוקללת לפי גודלה בתוצאה (w = 1 + מנדטים/20), וטעות סביב אחוז החסימה (ניחשת שנכנסת ויצאה, או להיפך) עולה עוד 5 נקודות.
function scoreBet(bet, res) {
  let err = 0;
  for (const p of PARTIES) {
    const b = bet[p.id] || 0, r = res[p.id] || 0;
    err += (1 + r / 20) * Math.abs(b - r);
    if ((b === 0) !== (r === 0)) err += 5;
  }
  return 100 - err;
}

// ===== תצוגת זמן-אמת מול המדגמים (אושר ע"י יובל 25.10) =====
let lastRenderedSeats = null;

// ממוצע מדגמים (שלב 1) - הבסיס להשוואה "מול המדגם" בשלבים המאוחרים
function exitAvgSeats() {
  const usable = EXIT_POLLS.filter(pl => pl.seats);
  if (!usable.length) return null;
  const raw = {}, floors = {};
  PARTIES.forEach(p => { raw[p.id] = usable.reduce((a, pl) => a + (pl.seats[p.id] || 0), 0) / usable.length; floors[p.id] = Math.floor(raw[p.id]); });
  let sum = PARTIES.reduce((a, p) => a + floors[p.id], 0);
  const byRem = [...PARTIES].sort((a, b) => (raw[b.id] - floors[b.id]) - (raw[a.id] - floors[a.id]));
  for (let i = 0; sum < 120 && i < byRem.length; i++, sum++) floors[byRem[i].id]++;
  return floors;
}

// (2) המרוץ ל-61: סרגל גושים עם קו 61
function blocRace(res) {
  const bs = blocSums(res);
  const coal = bs.right; // עמך ישראל (וינטר) ונעם נספרים בגוש הימין (bloc: right)
  const arab = bs.arab; // המשותפת ורע״מ - צבע נפרד, בצד האופוזיציה
  const opp = 120 - coal - arab; // אופוזיציה (לא ערבית): כולל הנדל-זליכה
  return '<div class="blocrace"><div class="brnums"><span style="color:#1f4e9c">קואליציה ' + coal + '</span><span style="color:#c1121f">אופוזיציה ' + opp + '</span><span style="color:#166534">ערביות ' + arab + '</span></div>' +
    '<div class="brtrack">' +
      '<div class="brseg" style="width:' + (coal / 120 * 100) + '%;background:#1f4e9c"></div>' +
      '<div class="brseg" style="width:' + (opp / 120 * 100) + '%;background:#c1121f"></div>' +
      '<div class="brseg" style="width:' + (arab / 120 * 100) + '%;background:#166534"></div>' +
      '<div class="brmark61"><span>61 = רוב</span></div>' +
    '</div>' +
    '<div class="brlegend">קואליציה (כחול): ליכוד, ש״ס, יהדות התורה, הציונות הדתית-זהות, עוצמה יהודית (ועמך ישראל אם נכנס) · אופוזיציה (אדום): כל שאר המפלגות, כולל הנדל-זליכה · ערביות (ירוק): המשותפת ורע״מ - נספרות בצד האופוזיציה</div></div>';
}

// (1) כל מדגם בפני עצמו + מי הכי קרוב לאמת
function channelTable(res) {
  const usable = EXIT_POLLS.filter(pl => pl.seats);
  if (!usable.length) return "";
  const avg = exitAvgSeats() || {};
  const shown = PARTIES.filter(p => usable.some(pl => (pl.seats[p.id] || 0) > 0));
  const head = "<tr><th>מפלגה</th>" + usable.map(pl => '<th><a href="' + pl.src + '" target="_blank">' + escapeHtml(pl.label) + (pl.date ? " · " + pl.date : "") + "</a></th>").join("") + "<th>ממוצע</th></tr>";
  const rows = shown.map(p => "<tr><td>" + p.name + "</td>" + usable.map(pl => "<td>" + (pl.seats[p.id] || 0) + "</td>").join("") + "<td><b>" + (avg[p.id] || 0) + "</b></td></tr>").join("");
  let whosRight = "";
  if (RESULT_STAGE !== "exit") {
    const ranked = usable.map(pl => ({ label: pl.label, err: PARTIES.reduce((a, p) => a + Math.abs((pl.seats[p.id] || 0) - (res[p.id] || 0)), 0) })).sort((a, b) => a.err - b.err);
    if (ranked.length) whosRight = '<div class="whosright">🏆 הכי קרוב לאמת כרגע: <b>' + escapeHtml(ranked[0].label) + "</b> (פער " + ranked[0].err + " מנדטים)</div>";
  }
  return "<h3>📺 כל מדגם בפני עצמו</h3>" + '<table class="chantbl">' + head + rows + "</table>" + whosRight;
}

// (7) ציר הלילה: אירועים נוכחיים, נבנה מחדש בכל רינדור
function nightTimeline(res) {
  const ev = [];
  if (RESULT_STAGE === "official") ev.push("✔ תוצאות אמת מלאות");
  if (RESULT_STAGE === "exit_actual") ev.push("⏳ החלו תוצאות האמת של קלפיות המדגם");
  if (COUNTED != null) ev.push("🧮 נספרו " + COUNTED + "% מהקולות");
  EXIT_POLLS.filter(pl => pl.seats).forEach(pl => ev.push("📺 פורסם מדגם " + pl.label + (pl.date ? " (" + pl.date + ")" : "")));
  return '<div class="tmlog"><h3>🌙 ציר הלילה</h3>' + ev.map(t => '<div class="tm">' + t + "</div>").join("") + "</div>";
}

function renderResults(mb, gflat) {
  const el = $("#results");
  const comb = combinedResults();
  if (!comb) { el.innerHTML = ""; lastRenderedSeats = null; return; }
  const res = comb.seats;
  const stageLabel = RESULT_STAGE === "official" ? "תוצאות אמת מלאות ✔"
    : (RESULT_STAGE === "exit_actual" ? "תוצאות האמת של קלפיות המדגם - זמני ⏳" : "מדגמי הערוצים - זמני ⏳");
  const countedLine = COUNTED != null ? ' <span class="counted">🧮 נספרו ' + COUNTED + "% מהקולות</span>" : "";
  const base = RESULT_STAGE === "exit" ? null : exitAvgSeats(); // (3) בסיס המדגם לחצים
  // לוח מפלגות בסגנון גרפיקות הערוצים: תמונת מנהיג, מנדטים גדולים, שם מפלגה, ממוין לפי גודל
  const tiles = [...PARTIES].sort((a, b) => res[b.id] - res[a.id]).map(p => {
    const d = base ? res[p.id] - (base[p.id] || 0) : 0;
    const delta = base && d !== 0 ? '<span class="delta ' + (d > 0 ? "dup" : "ddown") + '">' + (d > 0 ? "▲" : "▼") + Math.abs(d) + "</span>" : "";
    const pulse = lastRenderedSeats && lastRenderedSeats[p.id] !== undefined && lastRenderedSeats[p.id] !== res[p.id]
      ? (res[p.id] > lastRenderedSeats[p.id] ? " pulse-up" : " pulse-down") : ""; // (6) פעימה כשמספר זז
    const photo = LEADER_PHOTOS.has(p.id)
      ? '<div class="pphoto" style="background-image:url(/leaders/' + p.id + '.jpg)"></div>'
      : '<div class="pphoto pslip"><div class="slip"><div class="letters">' + p.letter + '</div><div class="tiny">' + p.name + '</div></div></div>';
    return '<div class="ptile">' + photo +
      '<div class="pseats' + pulse + '">' + res[p.id] + delta + "</div>" +
      '<div class="ptname" style="background:' + p.color + '">' + p.name + "</div></div>";
  }).join("");
  const srcs = comb.srcs.map(x => '<a href="' + x.src + '" target="_blank">' + escapeHtml(x.label) + " " + x.date + "</a>").join(" · ");
  const lb = (list, title) => {
    if (!list.length) return "";
    const ranked = list.map(b => ({ ...b, score: scoreBet(b.parties, res) })).sort((a, b) => b.score - a.score || a.ts - b.ts);
    let rank = 0, prev = null;
    const note = SCORING_APPROVED ? "" : ' <span class="tiny">(שיטת ניקוד מוצעת, טרם אושרה - אין הכרזת מנצח)</span>';
    return "<h3>" + title + note + "</h3>" + ranked.map((b, i) => {
      if (prev === null || Math.abs(b.score - prev) > 1e-9) { rank = i + 1; prev = b.score; }
      const medal = !SCORING_APPROVED ? rank + "."
        : (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank + ".");
      return '<div class="lrow' + (SCORING_APPROVED && rank === 1 ? " win" : "") + '"><span class="rank">' + medal + '</span>' +
        '<span class="lname">' + escapeHtml(b.name) + (b.groupName ? ' <span class="gname">' + escapeHtml(b.groupName) + "</span>" : "") + '</span>' +
        '<span class="lscore">' + b.score.toFixed(2) + "</span></div>";
    }).join("");
  };
  const deltaCap = base ? '<div class="deltacap">▲▼ = שינוי מול ממוצע מדגמי הערוצים מ-22:00</div>' : "";
  el.innerHTML = '<div class="resultsbox"><h2>' + stageLabel + countedLine + "</h2>" +
    '<div class="rssrc">מקורות: ' + srcs + "</div>" +
    '<div class="pgrid">' + tiles + "</div>" + deltaCap + blocRace(res) +
    '<div class="pcredits">תמונות המנהיגים: <a href="https://github.com/YuvalHir/knesset26-bets/blob/main/public/leaders/CREDITS.md" target="_blank">ויקימדיה קומונס · רשיונות פתוחים וקרדיטים מלאים</a></div>' +
    '<div class="landrow"><div class="lcol-t">' + channelTable(res) + '</div><div class="lcol-n">' + nightTimeline(res) + "</div></div>" +
    lb(mb, "🏆 מי הכי קרוב - " + group.name) + lb(gflat, "🏆 מי הכי קרוב - כל הקבוצות") + "</div>";
  lastRenderedSeats = res;
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
  $("#polllegend").innerHTML = poll ? '<span class="tick"></span>קו אפור = סקר ' + poll.label + ' (' + poll.date + '), להשוואה מול ממוצע ההימורים' : '';
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
  renderResults(mb, flat);
}

function switchTab(which) {
  const bet = which === "bet";
  $("#tab-bet").classList.toggle("active", bet);
  $("#tab-stats").classList.toggle("active", !bet);
  $("#view-bet").classList.toggle("hidden", !bet);
  $("#view-stats").classList.toggle("hidden", bet);
  if (!bet) loadStats();
}
async function pollResults() {
  try {
    const r = await api("/api/results");
    if (!r.ok) return;
    const d = r.data || {};
    const same = (d.stage || "none") === RESULT_STAGE &&
      JSON.stringify(d.exitPolls || []) === JSON.stringify(EXIT_POLLS) &&
      JSON.stringify(d.official || null) === JSON.stringify(OFFICIAL_RESULTS);
    if (same) return;
    RESULT_STAGE = d.stage || "none";
    EXIT_POLLS = Array.isArray(d.exitPolls) ? d.exitPolls : [];
    OFFICIAL_RESULTS = d.official || null;
    if (!$("#view-stats").classList.contains("hidden")) loadStats();
  } catch (e) {}
}
setInterval(pollResults, 5000);
pollResults();
$("#tab-bet").addEventListener("click", () => switchTab("bet"));
$("#tab-stats").addEventListener("click", () => switchTab("stats"));
</script>
</body>
</html>`;
}

async function currentResults(env) {
  // Isolated single-row results store (results_data), written only via authenticated
  // wrangler OAuth - never a public endpoint - so data updates need no code deploy.
  try {
    const row = await env.BETS_DB.prepare("SELECT payload FROM results_data WHERE id = 1").first();
    if (row && row.payload) {
      const d = JSON.parse(row.payload);
      return {
        stage: typeof d.stage === "string" ? d.stage : RESULT_STAGE,
        exitPolls: Array.isArray(d.exitPolls) ? d.exitPolls : EXIT_POLLS,
        official: d.official !== undefined ? d.official : OFFICIAL_RESULTS,
        counted: typeof d.counted === "number" ? d.counted : null,
        updated: d.ts || null
      };
    }
  } catch (e) { /* results_data may not exist yet - fall back to constants */ }
  return { stage: RESULT_STAGE, exitPolls: EXIT_POLLS, official: OFFICIAL_RESULTS, counted: null, updated: null };
}

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

// אחסון ב-D1 (SQLite) - עקביות חזקה, שורה אחת לכל הימור כך שהימורים במקביל לא דורסים זה את זה
function rowToBet(r) { return { name: r.name, parties: JSON.parse(r.parties), ts: r.ts, th: r.th }; }

async function readBets(env, code) {
  const { results } = await env.BETS_DB.prepare("SELECT name, parties, ts, th FROM bets WHERE code = ? ORDER BY ts").bind(code).all();
  return results.map(rowToBet).map(({ th, ...b }) => b); // הגיבוב אף פעם לא יוצא החוצה
}
async function readBetsRaw(env, code) {
  const { results } = await env.BETS_DB.prepare("SELECT name, parties, ts, th FROM bets WHERE code = ? ORDER BY ts").bind(code).all();
  return results.map(rowToBet);
}

async function getGroup(env, code) {
  if (code === GENERAL.code) return GENERAL;
  const g = await env.BETS_DB.prepare("SELECT code, name, ts FROM groups WHERE code = ?").bind(code).first();
  return g || null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/leaders/")) return env.ASSETS.fetch(request);

    if (url.pathname === "/api/group" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "json" }, 400); }
      const name = String(body.name || "").trim();
      if (name.length < 2 || name.length > 30) return json({ error: "שם לא תקין" }, 400);
      for (let i = 0; i < 5; i++) {
        const code = newCode();
        const exists = await env.BETS_DB.prepare("SELECT 1 AS x FROM groups WHERE code = ?").bind(code).first();
        if (!exists) {
          const g = { code, name, ts: Date.now() };
          await env.BETS_DB.prepare("INSERT INTO groups (code, name, ts) VALUES (?, ?, ?)").bind(code, name, g.ts).run();
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

    if (url.pathname === "/api/results") {
      return json(await currentResults(env));
    }

    if (url.pathname === "/api/bets") {
      const code = url.searchParams.get("code");
      if (code) {
        return json({ bets: await readBets(env, code.toUpperCase()) });
      }
      const out = [{ code: GENERAL.code, name: GENERAL.name, bets: await readBets(env, GENERAL.code) }];
      const seen = new Set([GENERAL.code]);
      const { results: groups } = await env.BETS_DB.prepare("SELECT code, name FROM groups ORDER BY ts").all();
      for (const g of groups) {
        seen.add(g.code); out.push({ code: g.code, name: g.name, bets: await readBets(env, g.code) });
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
      const token = String(body.token || "");
      const th = token ? await sha256hex(token) : "";
      const partiesJson = JSON.stringify(v.clean);
      // שורה אחת לכל הימור + עדכון/הוספה אטומיים - הימורים במקביל לא דורסים זה את זה
      const existing = await env.BETS_DB.prepare("SELECT th FROM bets WHERE code = ? AND name = ?").bind(code, v.name).first();
      if (existing) {
        // עריכה רק עם טוקן העריכה המקורי (השרת שומר רק גיבוב). הימורים ישנים ללא גיבוב נעולים לעריכה דרך ה-API.
        if (!existing.th || existing.th !== th) return json({ error: 'השם "' + v.name + '" תפוס בקבוצה הזו - בחרו שם אחר' }, 409);
        const r = await env.BETS_DB.prepare("UPDATE bets SET parties = ?, ts = ? WHERE code = ? AND name = ? AND th = ?").bind(partiesJson, Date.now(), code, v.name, th).run();
        if (!r.meta.changes) return json({ error: 'השם "' + v.name + '" תפוס בקבוצה הזו - בחרו שם אחר' }, 409);
      } else {
        const r = await env.BETS_DB.prepare("INSERT OR IGNORE INTO bets (code, name, parties, ts, th) VALUES (?, ?, ?, ?, ?)").bind(code, v.name, partiesJson, Date.now(), th).run();
        if (!r.meta.changes) return json({ error: 'השם "' + v.name + '" תפוס בקבוצה הזו - בחרו שם אחר' }, 409);
      }
      return json({ ok: true });
    }

    if (url.pathname === "/health") return json({ ok: true });
    const R = await currentResults(env);
    return new Response(renderHTML(R.stage, R.exitPolls, R.official, R.counted), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  },
};
