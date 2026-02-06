🌐 **زبانیں:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [اردو](README.ur.md)

---

<div dir="rtl">

# 🆓 مفت کرپٹو نیوز API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub ستارے"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="لائسنس"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI سٹیٹس"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **اگر یہ مددگار ہے تو براہ کرم repo کو ستارہ دیں!** یہ دوسروں کو اس پروجیکٹ کو دریافت کرنے میں مدد کرتا ہے۔

---

**200+ ذرائع** سے ریئل ٹائم کرپٹو خبریں ایک API کال سے حاصل کریں۔

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | دیگر    |
| ----------------- | ------------------------------- | ------------ | ------- |
| **قیمت**          | 🆓 ہمیشہ مفت                    | $29-299/مہینہ| ادائیگی |
| **API Key**       | ❌ ضرورت نہیں                   | ضروری        | ضروری   |
| **Rate Limit**    | لامحدود*                        | 100-1000/دن  | محدود   |
| **ذرائع**         | 130+ انگریزی + 75 بین الاقوامی  | 1            | مختلف   |
| **بین الاقوامی**  | 🌏 KO, ZH, JA, ES + ترجمہ       | نہیں         | نہیں    |
| **Self-host**     | ✅ ایک کلک                      | نہیں         | نہیں    |
| **PWA**           | ✅ انسٹال ہونے والا             | نہیں         | نہیں    |
| **MCP**           | ✅ Claude + ChatGPT             | نہیں         | نہیں    |

---

## 🌍 بین الاقوامی خبروں کے ذرائع

18 زبانوں میں **75 بین الاقوامی ذرائع** سے کرپٹو خبریں حاصل کریں — خودکار انگریزی ترجمے کے ساتھ!

| زبان           | تعداد | مثال ذرائع                                      |
| -------------- | ----- | ----------------------------------------------- |
| 🇨🇳 چینی       | 10    | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 کوریائی    | 9     | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 جاپانی     | 6     | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 پرتگالی    | 5     | Cointelegraph Brasil, Livecoins                 |
| 🇮🇳 ہندی       | 5     | CoinSwitch, CoinDCX, WazirX, ZebPay             |

### فوری مثالیں

```bash
# تازہ ترین خبریں حاصل کریں
curl "https://cryptocurrency.cv/api/news?limit=10"

# Bitcoin sentiment حاصل کریں
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# مضامین تلاش کریں
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 Progressive Web App (PWA)

Free Crypto News ایک **مکمل انسٹال ہونے والا PWA** ہے جو آف لائن کام کرتا ہے!

| فیچر                    | تفصیل                                   |
| ----------------------- | --------------------------------------- |
| 📲 **انسٹال ہونے والا** | کسی بھی ڈیوائس پر ہوم اسکرین میں شامل کریں |
| 📴 **آف لائن موڈ**       | انٹرنیٹ کے بغیر کیشڈ خبریں پڑھیں        |
| 🔔 **Push Notifications** | breaking news الرٹس حاصل کریں           |
| ⚡ **بجلی کی رفتار**     | جارحانہ caching حکمت عملی               |

---

## 🔌 API Endpoints

| Endpoint                        | تفصیل                                  |
| ------------------------------- | -------------------------------------- |
| `/api/news`                     | تمام ذرائع سے تازہ ترین                |
| `/api/search?q=bitcoin`         | کلیدی الفاظ سے تلاش                    |
| `/api/bitcoin`                  | Bitcoin-مخصوص خبریں                    |
| `/api/breaking`                 | صرف آخری 2 گھنٹے                       |
| `/api/trending`                 | sentiment کے ساتھ trending موضوعات     |
| `/api/ai/sentiment?asset=BTC`   | AI sentiment تجزیہ                     |
| `/api/ai/digest`                | AI-تیار کردہ خلاصہ                     |
| `/api/market/fear-greed`        | خوف اور لالچ انڈیکس                    |
| `/api/whales`                   | whale انتباہات                         |
| `/api/trading/signals`          | تجارتی سگنلز                           |

---

## 🤖 AI فیچرز

تمام AI فیچرز Groq کے ذریعے **مفت** ہیں:

| Endpoint             | تفصیل                                  |
| -------------------- | -------------------------------------- |
| `/api/ai/sentiment`  | گہرا sentiment تجزیہ                   |
| `/api/ai/summarize`  | AI خلاصے                               |
| `/api/ai/ask`        | کرپٹو کے بارے میں سوالات پوچھیں        |
| `/api/ai/digest`     | روزانہ خلاصہ                           |
| `/api/ai/narratives` | مارکیٹ بیانیہ ٹریکنگ                   |
| `/api/ai/factcheck`  | حقائق کی جانچ                          |

---

## 📦 SDKs اور مثالیں

| زبان       | Package                         |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 فوری آغاز

### Vercel کے ساتھ (تجویز کردہ)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### مقامی طور پر

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
npm install
npm run dev
```

---

## 🤝 شراکت

شراکتیں خوش آئند ہیں! [CONTRIBUTING.md](CONTRIBUTING.md) دیکھیں۔

---

## 📄 لائسنس

MIT © [nirholas](https://github.com/nirholas)

</div>
