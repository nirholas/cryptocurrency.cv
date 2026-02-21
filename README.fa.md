🌐 **زبان‌ها:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [فارسی](README.fa.md)

---

<div dir="rtl">

# 🆓 API اخبار رمزارز رایگان

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="مجوز"></a>
</p>

> ⭐ **اگر مفید بود، به ریپو ستاره بدهید!** این به دیگران کمک می‌کند این پروژه را پیدا کنند.

---

اخبار رمزارز را در زمان واقعی از **200+ منبع** با یک فراخوانی API دریافت کنید.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## ✨ ویژگی‌ها

- 🆓 **همیشه رایگان** - بدون کلید API، بدون ثبت‌نام
- 📰 **200+ منبع** - 130+ انگلیسی + 75 بین‌المللی
- 🌍 **18 زبان** - با ترجمه خودکار انگلیسی
- 🤖 **تحلیل هوش مصنوعی** - احساسات، خلاصه‌ها و سیگنال‌های معاملاتی
- 📈 **داده‌های بازار** - شاخص ترس و طمع، قیمت کوین‌ها
- 🔔 **زمان واقعی** - پشتیبانی SSE streaming و WebSocket
- 🔌 **یکپارچه‌سازی آسان** - MCP، ChatGPT، Claude

---

## 🚀 شروع سریع

### دریافت اخبار

```bash
# آخرین اخبار
curl "https://cryptocurrency.cv/api/news?limit=10"

# اخبار بیت‌کوین
curl "https://cryptocurrency.cv/api/news?ticker=BTC"

# اخبار فوری
curl "https://cryptocurrency.cv/api/breaking"
```

### مثال Python

```python
import requests

BASE_URL = "https://cryptocurrency.cv"

# دریافت آخرین اخبار
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()
for article in news["articles"]:
    print(f"• {article['title']} ({article['source']})")

# تحلیل احساسات بیت‌کوین
sentiment = requests.get(f"{BASE_URL}/api/ai/sentiment?asset=BTC").json()
print(f"BTC احساسات: {sentiment['label']} ({sentiment['score']:.2f})")

# شاخص ترس و طمع
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"بازار: {fg['classification']} ({fg['value']}/100)")
```

### مثال JavaScript

```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// دریافت آخرین اخبار
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());
news.articles.forEach(a => console.log(`• ${a.title} (${a.source})`));

// خلاصه AI
const summary = await fetch(`${BASE_URL}/api/summarize`).then(r => r.json());
console.log(summary.summary);
```

---

## 📚 نقاط پایانی API

### نقاط پایانی اصلی

| نقطه پایانی | توضیحات |
|-------------|---------|
| `/api/news` | آخرین اخبار رمزارز |
| `/api/breaking` | اخبار فوری |
| `/api/trending` | مقالات پرطرفدار |
| `/api/search?q=` | جستجوی اخبار |

### نقاط پایانی AI

| نقطه پایانی | توضیحات |
|-------------|---------|
| `/api/ai/sentiment` | احساسات بازار |
| `/api/summarize` | خلاصه اخبار |
| `/api/ask?q=` | پرسش سوالات |
| `/api/digest` | خلاصه روزانه |

### داده‌های بازار

| نقطه پایانی | توضیحات |
|-------------|---------|
| `/api/market/fear-greed` | شاخص ترس و طمع |
| `/api/market/coins` | قیمت کوین‌ها |
| `/api/market/trending` | کوین‌های پرطرفدار |

---

## 🇮🇷 منابع فارسی

اخبار از منابع ایرانی دریافت کنید:

| منبع | توضیحات |
|------|---------|
| ارز دیجیتال | پلتفرم برتر رمزارز ایران |
| میهن بلاکچین | اخبار بلاکچین فارسی |
| رمزارز | تحلیل و اخبار رمزارز |
| نوبیتکس | صرافی ایرانی |

```bash
# اخبار فارسی
curl "https://cryptocurrency.cv/api/news/international?language=fa"

# با ترجمه انگلیسی
curl "https://cryptocurrency.cv/api/news/international?language=fa&translate=true"
```

---

## 📱 اپلیکیشن موبایل

اپلیکیشن موبایل React Native در پوشه [mobile/](mobile/) موجود است:

```bash
cd mobile
npm install
npm start
```

---

## 🔗 لینک‌ها

- **API**: https://cryptocurrency.cv
- **مستندات**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news

---

## 📄 مجوز

MIT License - برای جزئیات [LICENSE](LICENSE) را ببینید.

---

<p align="center">
  ساخته شده با ❤️ برای جامعه رمزارز
</p>

</div>

