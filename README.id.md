🌐 **Bahasa:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 API Berita Crypto Gratis

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Lisensi"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="Status CI"></a>
  <a href="https://github.com/nirholas/free-crypto-news/issues"><img src="https://img.shields.io/github/issues/nirholas/free-crypto-news?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/nirholas/free-crypto-news/pulls"><img src="https://img.shields.io/github/issues-pr/nirholas/free-crypto-news?style=for-the-badge&color=purple" alt="Pull Requests"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Demo Free Crypto News API" width="700">
</p>

> ⭐ **Jika Anda merasa ini berguna, tolong beri bintang pada repo!** Bantu orang lain menemukan proyek ini dan dukung pengembangan berkelanjutan.

---

Dapatkan berita crypto real-time dari 7 sumber utama hanya dengan satu panggilan API.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## Perbandingan

| | Free Crypto News | CryptoPanic | Lainnya |
|---|---|---|---|
| **Harga** | 🆓 Gratis selamanya | $29-299/bulan | Berbayar |
| **API Key** | ❌ Tidak perlu | Diperlukan | Diperlukan |
| **Limit** | Tidak terbatas* | 100-1000/hari | Terbatas |
| **Sumber** | 12 Inggris + 12 Internasional | 1 | Beragam |
| **Internasional** | 🌏 KO, ZH, JA, ES + terjemahan | Tidak | Tidak |
| **Self-host** | ✅ Satu klik | Tidak | Tidak |
| **PWA** | ✅ Dapat diinstal | Tidak | Tidak |
| **MCP** | ✅ Claude + ChatGPT | Tidak | Tidak |

---

## 🌿 Branch

| Branch | Deskripsi |
|--------|-------------|
| `main` | Branch production stabil — Desain asli berfokus API |
| `redesign/pro-news-ui` | Redesign UI tingkat Pro — Gaya CoinDesk/CoinTelegraph dengan mode gelap, komponen yang ditingkatkan, structured data SEO, dan dukungan PWA penuh |

Untuk mencoba redesign secara lokal:
```bash
git checkout redesign/pro-news-ui
npm install && npm run dev
```

---

## 🌍 Sumber Berita Internasional

Dapatkan berita crypto dari **12 sumber internasional** dalam bahasa Korea, Cina, Jepang, dan Spanyol — dengan terjemahan otomatis ke bahasa Inggris!

### Sumber yang Didukung

| Wilayah | Sumber |
|--------|---------|
| 🇰🇷 **Korea** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **Cina** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **Jepang** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Amerika Latin** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Contoh Cepat

```bash
# Dapatkan semua berita internasional
curl "https://cryptocurrency.cv/api/news/international"

# Dapatkan berita Korea dengan terjemahan Inggris
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Dapatkan berita dari wilayah Asia
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Fitur

- ✅ **Terjemahan otomatis** ke bahasa Inggris melalui Groq AI
- ✅ **Cache terjemahan 7 hari** untuk efisiensi
- ✅ **Pertahankan asli + Inggris**
- ✅ **Rate limiting** (1 req/detik) untuk menghormati API
- ✅ **Penanganan fallback** untuk sumber yang tidak tersedia
- ✅ **Deduplikasi** antar sumber

Lihat [dokumentasi API](docs/API.md#get-apinewsinternational) untuk detail lengkap.

---

## 📱 Progressive Web App (PWA)

Free Crypto News adalah **PWA yang sepenuhnya dapat diinstal** yang berfungsi secara offline.

### Fitur

| Fitur | Deskripsi |
|---------|-------------|
| 📲 **Dapat Diinstal** | Tambahkan ke layar utama di perangkat apa pun |
| 📴 **Mode Offline** | Baca berita yang di-cache tanpa internet |
| 🔔 **Push Notifications** | Terima notifikasi berita terbaru |
| ⚡ **Sangat Cepat** | Strategi caching agresif |
| 🔄 **Sinkronisasi Latar Belakang** | Pembaruan otomatis saat online |
| 🎯 **Pintasan** | Akses cepat ke Terbaru, Trending, Bitcoin |
| 📤 **Berbagi** | Bagikan tautan langsung ke aplikasi |
| 🚨 **Peringatan Real-time** | Peringatan harga dan kondisi berita yang dapat dikonfigurasi |

### Instalasi Aplikasi

**Desktop (Chrome/Edge):**
1. Kunjungi [cryptocurrency.cv](https://cryptocurrency.cv)
2. Klik ikon instal (⊕) di bilah alamat
3. Klik "Instal"

**iOS Safari:**
1. Kunjungi halaman di Safari
2. Ketuk Bagikan (📤) → "Tambahkan ke Layar Utama"

**Android Chrome:**
1. Kunjungi halaman
2. Ketuk banner instal atau Menu → "Instal aplikasi"

### Service Worker Caching

PWA menggunakan strategi caching cerdas:

| Konten | Strategi | Durasi Cache |
|---------|----------|----------------|
| API Response | Network-first | 5 menit |
| Static Assets | Cache-first | 7 hari |
| Gambar | Cache-first | 30 hari |
| Navigasi | Network-first + offline fallback | 24 jam |

### Pintasan Keyboard

Navigasi cepat melalui berita menggunakan keyboard:

| Pintasan | Aksi |
|----------|--------|
| `j` / `k` | Artikel berikutnya / sebelumnya |
| `/` | Fokus pencarian |
| `Enter` | Buka artikel yang dipilih |
| `d` | Toggle mode gelap |
| `g h` | Pergi ke Beranda |
| `g t` | Pergi ke Trending |
| `g s` | Pergi ke Sumber |
| `g b` | Pergi ke Bookmark |
| `?` | Tampilkan semua pintasan |
| `Escape` | Tutup modal |

📖 **Panduan pengguna lengkap:** [docs/USER-GUIDE.md](docs/USER-GUIDE.md)

---

## Sumber

Kami mengagregasi dari **7 situs berita terpercaya**:

- 🟠 **CoinDesk** — Berita crypto komprehensif
- 🔵 **The Block** — Institusi & riset
- 🟢 **Decrypt** — Web3 & budaya
- 🟡 **CoinTelegraph** — Berita crypto global
- 🟤 **Bitcoin Magazine** — Bitcoin maximalist
- 🟣 **Blockworks** — DeFi & institusi
- 🔴 **The Defiant** — DeFi native

---

## Endpoints

| Endpoint | Deskripsi |
|----------|-------------|
| `/api/news` | Terbaru dari semua sumber |
| `/api/search?q=bitcoin` | Pencarian berdasarkan kata kunci |
| `/api/defi` | Berita DeFi spesifik |
| `/api/bitcoin` | Berita Bitcoin spesifik |
| `/api/breaking` | Hanya 2 jam terakhir |
| `/api/trending` | Topik trending dengan sentimen |
| `/api/analyze` | Berita dengan klasifikasi topik |
| `/api/stats` | Statistik & analitik |
| `/api/sources` | Daftar semua sumber |
| `/api/health` | Status API & feeds |
| `/api/rss` | RSS feed gabungan |
| `/api/atom` | Atom feed gabungan |
| `/api/opml` | OPML export untuk RSS readers |
| `/api/docs` | Dokumentasi API interaktif |
| `/api/webhooks` | Berlangganan webhooks |
| `/api/archive` | Arsip berita historis |
| `/api/push` | Web Push notifications |
| `/api/origins` | Temukan asal berita |
| `/api/portfolio` | Berita berbasis portfolio + harga |
| `/api/news/international` | Sumber internasional dengan terjemahan |

### 🤖 Endpoint AI-Powered (GRATIS via Groq)

| Endpoint | Deskripsi |
|----------|-------------|
| `/api/digest` | Ringkasan berita harian oleh AI |
| `/api/sentiment` | Analisis sentimen pasar |
| `/api/summarize?url=` | Ringkas URL apa pun |
| `/api/ask` | Tanya AI tentang berita crypto |
| `/api/entities` | Ekstrak entitas yang disebutkan |
| `/api/claims` | Verifikasi klaim |
| `/api/clickbait` | Deteksi clickbait |

### 💹 Endpoint Data Pasar

| Endpoint | Deskripsi |
|----------|-------------|
| `/api/fear-greed` | Indeks Fear & Greed dengan data historis |
| `/api/arbitrage` | Peluang arbitrage lintas bursa |
| `/api/signals` | Sinyal trading teknikal |
| `/api/funding` | Funding rates di bursa derivatif |
| `/api/options` | Aliran options & max pain |
| `/api/liquidations` | Data liquidation real-time |
| `/api/whale-alerts` | Pelacakan transaksi whale |
| `/api/orderbook` | Data orderbook agregat |

---

## Mulai Cepat

### Menggunakan cURL

```bash
# Dapatkan berita terbaru
curl "https://cryptocurrency.cv/api/news"

# Cari berita
curl "https://cryptocurrency.cv/api/search?q=ethereum"

# Dapatkan AI digest
curl "https://cryptocurrency.cv/api/digest"

# Dapatkan Fear & Greed Index
curl "https://cryptocurrency.cv/api/fear-greed"
```

### Menggunakan JavaScript

```javascript
// Dapatkan berita terbaru
const response = await fetch('https://cryptocurrency.cv/api/news');
const data = await response.json();

console.log(data.articles);
// [{ title, link, source, pubDate, timeAgo, ... }, ...]
```

### Menggunakan Python

```python
import requests

# Dapatkan berita terbaru
response = requests.get('https://cryptocurrency.cv/api/news')
data = response.json()

for article in data['articles'][:5]:
    print(f"• {article['title']} ({article['source']})")
```

---

## Deploy Sendiri

### Deploy Satu Klik

[![Deploy dengan Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)
[![Deploy dengan Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/nirholas/free-crypto-news)

### Setup Lokal

```bash
# Clone repository
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news

# Instal dependencies
npm install

# Jalankan development server
npm run dev

# Buka http://localhost:3000
```

### Variabel Lingkungan

```env
# Opsional: Untuk fitur AI (gratis dari groq.com)
GROQ_API_KEY=gsk_your_key_here

# Opsional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_id
```

---

## Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [📚 Referensi API](docs/API.md) | Dokumentasi endpoint lengkap |
| [🏗️ Arsitektur](docs/ARCHITECTURE.md) | Desain sistem |
| [🚀 Deployment](docs/DEPLOYMENT.md) | Panduan produksi |
| [🧪 Testing](docs/TESTING.md) | Panduan pengujian |
| [🔐 Keamanan](docs/SECURITY.md) | Kebijakan keamanan |
| [📖 Panduan Pengguna](docs/USER-GUIDE.md) | Panduan PWA & fitur |
| [💻 Panduan Developer](docs/DEVELOPER-GUIDE.md) | Dokumentasi untuk kontributor |

---

## Kontribusi

Kontribusi sangat disambut! Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan.

```bash
# Fork repo
# Buat feature branch
git checkout -b feature/fitur-keren

# Commit perubahan
git commit -m 'Tambah fitur keren'

# Push dan buat Pull Request
git push origin feature/fitur-keren
```

---

## Lisensi

MIT License - lihat file [LICENSE](LICENSE).

---

## Kontak

- 🐛 **Bugs**: [GitHub Issues](https://github.com/nirholas/free-crypto-news/issues)
- 💬 **Diskusi**: [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐦 **Twitter**: [@nirholas](https://twitter.com/nirholas)

---

<p align="center">
  Dibuat dengan ❤️ untuk komunitas crypto
  <br>
  <a href="https://cryptocurrency.cv">cryptocurrency.cv</a>
</p>

