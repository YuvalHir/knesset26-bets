# 🗳️ הימור המנדטים — כנסת 26

אתר חמוד להימור עם החברים: כמה מנדטים תקבל כל מפלגה בבחירות לכנסת ה-26 (27.10.2026).

- סליידרים לחלוקת 120 מנדטים — אי אפשר לעבור את ה-120, ואי אפשר לשלוח בלי בדיוק 120.
- כל המפלגות שמופיעות בסקרים העדכניים, כולל אלה שמתחת לאחוז החסימה, עם אותיות הפתק הרשמיות.
- עמוד השוואה: ההימור הממוצע, ההימור של כל אחד, וחלוקה לגושים (ימין / מרכז-שמאל / ערביות / ללא גוש).

## מקורות

- מפלגות ואותיות: [ועדת הבחירות המרכזית לכנסת ה-26](https://www.gov.il/he/pages/candidates-lists-26) (אושר 27.9.2026)
- נתוני סקר לייחוס: [סקר חדשות 12, 19.10.2026](https://www.ice.co.il/research/news/article/1134272)

## סטאק

Cloudflare Worker יחיד + Workers KV (בלי בסיס נתונים, בלי שרת). כל ה-UI מוטמע ב-`src/worker.js`.

## פריסה

```bash
npm install
npx wrangler login
npx wrangler kv namespace create BETS   # לעדכן את ה-id ב-wrangler.toml
npx wrangler deploy
```

פריסה אוטומטית מ-GitHub: יש workflow מוכן ב-`.github/workflows/deploy.yml`.
צריך סוד `CLOUDFLARE_API_TOKEN` בהגדרות הרפו (Workers:Edit) ו-`CLOUDFLARE_ACCOUNT_ID`.

## רישיון

MIT
