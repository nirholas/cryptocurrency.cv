🌐 **மொழிகள்:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md) | [हिन्दी](README.hi.md) | [தமிழ்](README.ta.md) | [తెలుగు](README.te.md)

---

# 🆓 இலவச கிரிப்டோ செய்திகள் API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub நட்சத்திரங்கள்"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="உரிமம்"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI நிலை"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **இது உதவியாக இருந்தால், repo-க்கு நட்சத்திரம் கொடுங்கள்!** இது மற்றவர்கள் இந்த திட்டத்தைக் கண்டறிய உதவுகிறது.

---

**200+ மூலங்களிலிருந்து** நிகழ்நேர கிரிப்டோ செய்திகளை ஒரே API அழைப்பில் பெறுங்கள்.

```bash
curl https://cryptocurrency.cv/api/news
```

---

|                   | Free Crypto News                | CryptoPanic  | மற்றவை   |
| ----------------- | ------------------------------- | ------------ | -------- |
| **விலை**          | 🆓 என்றென்றும் இலவசம்           | $29-299/மாதம்| கட்டணம்  |
| **API Key**       | ❌ தேவையில்லை                   | அவசியம்      | அவசியம்  |
| **Rate Limit**    | வரம்பற்றது*                     | 100-1000/நாள்| வரையறை   |
| **மூலங்கள்**      | 130+ ஆங்கிலம் + 75 சர்வதேசம்    | 1            | மாறுபடும் |
| **சர்வதேசம்**     | 🌏 KO, ZH, JA, ES + மொழிபெயர்ப்பு | இல்லை      | இல்லை    |
| **Self-host**     | ✅ ஒரே கிளிக்                   | இல்லை        | இல்லை    |
| **PWA**           | ✅ நிறுவக்கூடியது               | இல்லை        | இல்லை    |
| **MCP**           | ✅ Claude + ChatGPT             | இல்லை        | இல்லை    |

---

## 🌍 சர்வதேச செய்தி மூலங்கள்

18 மொழிகளில் **75 சர்வதேச மூலங்களிலிருந்து** கிரிப்டோ செய்திகளைப் பெறுங்கள் — தானியங்கி ஆங்கில மொழிபெயர்ப்புடன்!

| மொழி           | எண்  | எடுத்துக்காட்டு மூலங்கள்                         |
| -------------- | ---- | ----------------------------------------------- |
| 🇨🇳 சீனம்       | 10   | 8BTC, Jinse Finance, Odaily, ChainNews          |
| 🇰🇷 கொரியன்     | 9    | Block Media, TokenPost, CoinDesk Korea          |
| 🇯🇵 ஜப்பானியம்   | 6    | CoinPost, CoinDesk Japan, Cointelegraph Japan   |
| 🇧🇷 போர்த்துகீசியம் | 5  | Cointelegraph Brasil, Livecoins                 |
| 🇮🇳 இந்தி       | 5    | CoinSwitch, CoinDCX, WazirX, ZebPay             |

### விரைவான எடுத்துக்காட்டுகள்

```bash
# சமீபத்திய செய்திகளைப் பெறுங்கள்
curl "https://cryptocurrency.cv/api/news?limit=10"

# Bitcoin sentiment பெறுங்கள்
curl "https://cryptocurrency.cv/api/ai/sentiment?asset=BTC"

# கட்டுரைகளைத் தேடுங்கள்
curl "https://cryptocurrency.cv/api/search?q=ethereum%20upgrade"
```

---

## 📱 முற்போக்கான வலை பயன்பாடு (PWA)

Free Crypto News என்பது **முழுமையாக நிறுவக்கூடிய PWA** ஆஃப்லைனில் வேலை செய்கிறது!

| அம்சம்                  | விளக்கம்                                |
| ----------------------- | --------------------------------------- |
| 📲 **நிறுவக்கூடியது**    | எந்த சாதனத்திலும் முகப்புத் திரையில் சேர்க்கவும் |
| 📴 **ஆஃப்லைன் பயன்முறை** | இணையம் இல்லாமல் cache செய்யப்பட்ட செய்திகளைப் படிக்கவும் |
| 🔔 **Push அறிவிப்புகள்** | breaking news அலர்ட்கள் பெறுங்கள்        |
| ⚡ **மின்னல் வேகம்**     | ஆக்ரோஷமான caching உத்திகள்               |

---

## 🔌 API முனைகள்

| முனை                            | விளக்கம்                               |
| ------------------------------- | -------------------------------------- |
| `/api/news`                     | அனைத்து மூலங்களிலிருந்தும் சமீபத்தியவை  |
| `/api/search?q=bitcoin`         | முக்கிய சொற்களால் தேடுங்கள்            |
| `/api/bitcoin`                  | Bitcoin-குறிப்பிட்ட செய்திகள்          |
| `/api/breaking`                 | கடைசி 2 மணி நேரம் மட்டும்              |
| `/api/trending`                 | sentiment-உடன் trending தலைப்புகள்     |
| `/api/ai/sentiment?asset=BTC`   | AI sentiment பகுப்பாய்வு               |
| `/api/ai/digest`                | AI-உருவாக்கிய சுருக்கம்                |
| `/api/market/fear-greed`        | பயம் & பேராசை குறியீடு                 |
| `/api/whales`                   | whale எச்சரிக்கைகள்                    |
| `/api/trading/signals`          | வர்த்தக சமிக்ஞைகள்                     |

---

## 🤖 AI அம்சங்கள்

அனைத்து AI அம்சங்களும் Groq மூலம் **இலவசம்**:

| முனை                 | விளக்கம்                               |
| -------------------- | -------------------------------------- |
| `/api/ai/sentiment`  | ஆழமான sentiment பகுப்பாய்வு            |
| `/api/ai/summarize`  | AI சுருக்கங்கள்                        |
| `/api/ai/ask`        | crypto பற்றி கேள்விகள் கேளுங்கள்       |
| `/api/ai/digest`     | தினசரி சுருக்கம்                       |
| `/api/ai/narratives` | சந்தை கதைகள் கண்காணிப்பு               |
| `/api/ai/factcheck`  | உண்மை சரிபார்ப்பு                      |

---

## 📦 SDKs & எடுத்துக்காட்டுகள்

| மொழி       | Package                         |
| ---------- | ------------------------------- |
| Python     | `pip install fcn-sdk`           |
| JavaScript | `npm install @fcn/sdk`          |
| TypeScript | `npm install @fcn/sdk`          |
| Go         | `go get github.com/fcn/sdk-go`  |
| Rust       | `cargo add fcn-sdk`             |

---

## 🚀 விரைவான தொடக்கம்

### Vercel உடன் (பரிந்துரைக்கப்படுகிறது)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### உள்ளூரில்

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
npm install
npm run dev
```

---

## 🤝 பங்களிப்பு

பங்களிப்புகள் வரவேற்கப்படுகின்றன! [CONTRIBUTING.md](CONTRIBUTING.md) பார்க்கவும்.

---

## 📄 உரிமம்

MIT © [nirholas](https://github.com/nirholas)

