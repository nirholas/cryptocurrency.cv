🌐 **Dil:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 Ücretsiz Kripto Haber API'si

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Yıldızları"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Lisans"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI Durumu"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **Faydalı bulursanız, depoya yıldız verin!** Bu, başkalarının projeyi keşfetmesine yardımcı olur ve sürekli geliştirme için motivasyon sağlar.

---
Tek bir API çağrısıyla 7 büyük kaynaktan gerçek zamanlı kripto haberleri alın.

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | Diğerleri |
|---|---|---|---|
| **Fiyat** | 🆓 Sonsuza kadar ücretsiz | $29-299/ay | Ücretli |
| **API Anahtarı** | ❌ Gerekli değil | Gerekli | Gerekli |
| **İstek Limiti** | Sınırsız* | 100-1000/gün | Sınırlı |
| **Kaynaklar** | 130+ İngilizce + 75 uluslararası | 1 | Değişken |
| **Uluslararasılaştırma** | 🌏 Korece, Çince, Japonca, İspanyolca + çeviri | Hayır | Hayır |
| **Kendi Sunucusu** | ✅ Tek tıkla dağıtım | Hayır | Hayır |
| **PWA** | ✅ Yüklenebilir | Hayır | Hayır |
| **MCP** | ✅ Claude + ChatGPT | Hayır | Hayır |

---

## 🌍 Uluslararası Haber Kaynakları

18 dilde **75 uluslararası kaynaktan** kripto haberleri alın — otomatik olarak İngilizce'ye çevrilir!

### Desteklenen Kaynaklar

| Bölge | Kaynaklar |
|--------|---------|
| 🇰🇷 **Kore** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **Çin** | 8BTC (Babit), Jinse Finance (Jinse), Odaily (Odaily) |
| 🇯🇵 **Japonya** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Latin Amerika** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Hızlı Örnekler

```bash
# Tüm uluslararası haberleri al
curl "https://cryptocurrency.cv/api/news/international"

# Korece haberleri İngilizce'ye çevrilmiş olarak al
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Asya bölgesi haberlerini al
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Özellikler

- ✅ Groq AI ile İngilizce'ye **otomatik çeviri**
- ✅ Verimlilik için **7 günlük çeviri önbelleği**
- ✅ **Orijinal + İngilizce** korunur
- ✅ API'lere saygı için **hız sınırlama** (1 istek/sn)
- ✅ Kullanılamayan kaynaklar için **zarif geri dönüş**
- ✅ Kaynaklar arası **tekrar kaldırma**

---

## 📱 Progressive Web App (PWA)

Free Crypto News, çevrimdışı desteğiyle **tamamen yüklenebilir bir PWA**'dır!

### Özellikler

| Özellik | Açıklama |
|---------|-------------|
| 📲 **Yüklenebilir** | Herhangi bir cihazda ana ekrana ekle |
| 📴 **Çevrimdışı Mod** | Ağ olmadan önbelleğe alınmış haberleri oku |
| 🔔 **Push Bildirimleri** | Son dakika haberi uyarıları al |
| ⚡ **Işık Hızında** | Agresif önbellekleme stratejileri |
| 🔄 **Arka Plan Senkronizasyonu** | Çevrimiçine dönüldüğünde otomatik güncelleme |

### Uygulamayı Yükle

**Masaüstü (Chrome/Edge):**
1. [cryptocurrency.cv](https://cryptocurrency.cv) adresini ziyaret edin
2. URL çubuğundaki yükleme simgesine (⊕) tıklayın
3. "Yükle"ye tıklayın

**iOS Safari:**
1. Safari'de siteyi ziyaret edin
2. Paylaş (📤) → "Ana Ekrana Ekle"ye dokunun

**Android Chrome:**
1. Siteyi ziyaret edin
2. Yükleme banner'ına veya Menü → "Uygulamayı yükle"ye dokunun

---

## Kaynaklar

**7 güvenilir medyadan** toplarız:

- 🟠 **CoinDesk** — Genel kripto haberleri
- 🔵 **The Block** — Kurumsal ve araştırma
- 🟢 **Decrypt** — Web3 ve kültür
- 🟡 **CoinTelegraph** — Küresel kripto haberleri
- 🟤 **Bitcoin Magazine** — Bitcoin maksimalistleri
- 🟣 **Blockworks** — DeFi ve kurumsal
- 🔴 **The Defiant** — Yerel DeFi

---

## Uç Noktalar

| Uç Nokta | Açıklama |
|----------|-------------|
| `/api/news` | Tüm kaynaklardan son haberler |
| `/api/search?q=bitcoin` | Anahtar kelimeyle ara |
| `/api/defi` | DeFi ile ilgili haberler |
| `/api/bitcoin` | Bitcoin ile ilgili haberler |
| `/api/breaking` | Sadece son 2 saat |
| `/api/trending` | Duygu analizli trend konular |
| `/api/analyze` | Konu kategorili haberler |
| `/api/stats` | Analizler ve istatistikler |

### 🤖 Yapay Zeka Destekli Uç Noktalar (Groq ile Ücretsiz)

| Uç Nokta | Açıklama |
|----------|-------------|
| `/api/summarize` | Makalelerin yapay zeka özeti |
| `/api/ask?q=...` | Kripto haberleri hakkında soru sor |
| `/api/digest` | Yapay zeka tarafından oluşturulan günlük özet |
| `/api/sentiment` | Makale başına derin duygu analizi |

---

## SDK'lar ve Bileşenler

| Paket | Açıklama |
|---------|-------------|
| [React](sdk/react/) | `<CryptoNews />` tak-çalıştır bileşeni |
| [TypeScript](sdk/typescript/) | Tam TypeScript SDK |
| [Python](sdk/python/) | Bağımlılıksız Python istemcisi |
| [JavaScript](sdk/javascript/) | Tarayıcı ve Node.js SDK |
| [Go](sdk/go/) | Go istemci kütüphanesi |
| [PHP](sdk/php/) | PHP SDK |

**Base URL:** `https://cryptocurrency.cv`

---

# Kendi Sunucunda Barındırma

## Tek Tıkla Dağıtım

[![Vercel ile Dağıt](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## Manuel

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

http://localhost:3000/api/news adresini açın

---

# Lisans

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Kripto haber API'leri için para ödemeyi bırakın.</b><br>
  <sub>Topluluk için 💜 ile yapıldı</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>Faydalı buldunuz mu? Yıldız verin!</b> ⭐<br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="GitHub'da Yıldızla">
  </a>
</p>
