🌐 **Ngôn ngữ:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 API Tin Tức Crypto Miễn Phí

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="Giấy phép"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="Trạng thái CI"></a>
  <a href="https://github.com/nirholas/free-crypto-news/issues"><img src="https://img.shields.io/github/issues/nirholas/free-crypto-news?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/nirholas/free-crypto-news/pulls"><img src="https://img.shields.io/github/issues-pr/nirholas/free-crypto-news?style=for-the-badge&color=purple" alt="Pull Requests"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Demo API Free Crypto News" width="700">
</p>

> ⭐ **Nếu thấy hữu ích, hãy gắn sao cho repo!** Giúp người khác khám phá dự án này và động viên phát triển liên tục.

---

Nhận tin tức crypto thời gian thực từ 7 nguồn chính chỉ với một lệnh gọi API.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## So Sánh

| | Free Crypto News | CryptoPanic | Khác |
|---|---|---|---|
| **Giá** | 🆓 Miễn phí mãi mãi | $29-299/tháng | Trả phí |
| **API Key** | ❌ Không cần | Bắt buộc | Bắt buộc |
| **Giới hạn** | Không giới hạn* | 100-1000/ngày | Giới hạn |
| **Nguồn** | 12 Tiếng Anh + 12 Quốc tế | 1 | Khác nhau |
| **Quốc tế** | 🌏 KO, ZH, JA, ES + dịch | Không | Không |
| **Tự host** | ✅ Một click | Không | Không |
| **PWA** | ✅ Cài đặt được | Không | Không |
| **MCP** | ✅ Claude + ChatGPT | Không | Không |

---

## 🌿 Các Nhánh

| Nhánh | Mô tả |
|--------|-------------|
| `main` | Nhánh production ổn định — Thiết kế gốc tập trung API |
| `redesign/pro-news-ui` | Thiết kế lại UI cao cấp — Phong cách CoinDesk/CoinTelegraph với chế độ tối, components được nâng cấp, dữ liệu có cấu trúc SEO và hỗ trợ PWA đầy đủ |

Để thử nghiệm redesign cục bộ:
```bash
git checkout redesign/pro-news-ui
npm install && npm run dev
```

---

## 🌍 Nguồn Tin Tức Quốc Tế

Nhận tin tức crypto từ **12 nguồn quốc tế** bằng tiếng Hàn, Trung, Nhật và Tây Ban Nha — với dịch tự động sang tiếng Anh!

### Nguồn Được Hỗ Trợ

| Khu vực | Nguồn |
|--------|---------|
| 🇰🇷 **Hàn Quốc** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **Trung Quốc** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **Nhật Bản** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Mỹ Latinh** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Ví Dụ Nhanh

```bash
# Lấy tất cả tin quốc tế
curl "https://cryptocurrency.cv/api/news/international"

# Lấy tin Hàn Quốc với dịch tiếng Anh
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# Lấy tin khu vực Châu Á
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### Tính Năng

- ✅ **Tự động dịch** sang tiếng Anh qua Groq AI
- ✅ **Cache dịch 7 ngày** để tăng hiệu quả
- ✅ **Giữ nguyên bản gốc + tiếng Anh**
- ✅ **Giới hạn tốc độ** (1 req/giây) để tôn trọng API
- ✅ **Xử lý fallback** cho nguồn không khả dụng
- ✅ **Loại bỏ trùng lặp** giữa các nguồn

Xem [tài liệu API](docs/API.md#get-apinewsinternational) để biết chi tiết đầy đủ.

---

## 📱 Ứng Dụng Web Tiến Bộ (PWA)

Free Crypto News là **PWA có thể cài đặt hoàn toàn** hoạt động ngoại tuyến.

### Tính Năng

| Tính năng | Mô tả |
|---------|-------------|
| 📲 **Cài đặt được** | Thêm vào màn hình chính trên mọi thiết bị |
| 📴 **Chế độ Offline** | Đọc tin đã cache không cần internet |
| 🔔 **Thông báo Push** | Nhận cảnh báo tin nóng |
| ⚡ **Siêu nhanh** | Chiến lược cache tích cực |
| 🔄 **Đồng bộ nền** | Tự động cập nhật khi online |
| 🎯 **Phím tắt** | Truy cập nhanh Mới nhất, Nóng, Bitcoin |
| 📤 **Chia sẻ** | Chia sẻ link trực tiếp vào app |
| 🚨 **Cảnh báo thời gian thực** | Cảnh báo giá và điều kiện tin tức có thể cấu hình |

### Cài Đặt Ứng Dụng

**Desktop (Chrome/Edge):**
1. Truy cập [cryptocurrency.cv](https://cryptocurrency.cv)
2. Click biểu tượng cài đặt (⊕) trong thanh địa chỉ
3. Click "Cài đặt"

**iOS Safari:**
1. Truy cập trang trong Safari
2. Nhấn Chia sẻ (📤) → "Thêm vào màn hình chính"

**Android Chrome:**
1. Truy cập trang
2. Nhấn banner cài đặt hoặc Menu → "Cài đặt ứng dụng"

### Cache Service Worker

PWA sử dụng chiến lược cache thông minh:

| Nội dung | Chiến lược | Thời gian Cache |
|---------|----------|----------------|
| API Response | Network-first | 5 phút |
| Static Assets | Cache-first | 7 ngày |
| Hình ảnh | Cache-first | 30 ngày |
| Navigation | Network-first + offline fallback | 24 giờ |

### Phím Tắt

Điều hướng nhanh qua tin tức bằng bàn phím:

| Phím tắt | Hành động |
|----------|--------|
| `j` / `k` | Bài tiếp theo / trước |
| `/` | Focus tìm kiếm |
| `Enter` | Mở bài đã chọn |
| `d` | Bật/tắt chế độ tối |
| `g h` | Đi tới Trang chủ |
| `g t` | Đi tới Xu hướng |
| `g s` | Đi tới Nguồn |
| `g b` | Đi tới Đánh dấu |
| `?` | Hiện tất cả phím tắt |
| `Escape` | Đóng modal |

📖 **Hướng dẫn người dùng đầy đủ:** [docs/USER-GUIDE.md](docs/USER-GUIDE.md)

---

## Nguồn

Chúng tôi tổng hợp từ **7 trang tin uy tín**:

- 🟠 **CoinDesk** — Tin crypto tổng hợp
- 🔵 **The Block** — Tổ chức & nghiên cứu
- 🟢 **Decrypt** — Web3 & văn hóa
- 🟡 **CoinTelegraph** — Tin crypto toàn cầu
- 🟤 **Bitcoin Magazine** — Bitcoin maximalist
- 🟣 **Blockworks** — DeFi & tổ chức
- 🔴 **The Defiant** — Native DeFi

---

## Endpoints

| Endpoint | Mô tả |
|----------|-------------|
| `/api/news` | Mới nhất từ tất cả nguồn |
| `/api/search?q=bitcoin` | Tìm theo từ khóa |
| `/api/defi` | Tin DeFi cụ thể |
| `/api/bitcoin` | Tin Bitcoin cụ thể |
| `/api/breaking` | Chỉ 2 giờ gần nhất |
| `/api/trending` | Chủ đề xu hướng với sentiment |
| `/api/analyze` | Tin với phân loại chủ đề |
| `/api/stats` | Thống kê & analytics |
| `/api/sources` | Liệt kê tất cả nguồn |
| `/api/health` | Trạng thái API & feeds |
| `/api/rss` | RSS feed tổng hợp |
| `/api/atom` | Atom feed tổng hợp |
| `/api/opml` | Export OPML cho RSS readers |
| `/api/docs` | Tài liệu API tương tác |
| `/api/webhooks` | Đăng ký webhooks |
| `/api/archive` | Lưu trữ tin lịch sử |
| `/api/push` | Web Push notifications |
| `/api/origins` | Tìm nguồn gốc của tin |
| `/api/portfolio` | Tin dựa trên portfolio + giá |
| `/api/news/international` | Nguồn quốc tế có dịch |

### 🤖 Endpoints Hỗ Trợ AI (MIỄN PHÍ qua Groq)

| Endpoint | Mô tả |
|----------|-------------|
| `/api/digest` | Tóm tắt tin hàng ngày do AI tạo |
| `/api/sentiment` | Phân tích sentiment thị trường |
| `/api/summarize?url=` | Tóm tắt URL bất kỳ |
| `/api/ask` | Hỏi AI về tin crypto |
| `/api/entities` | Trích xuất thực thể được đề cập |
| `/api/claims` | Xác minh tuyên bố |
| `/api/clickbait` | Phát hiện clickbait |

### 💹 Endpoints Thị Trường

| Endpoint | Mô tả |
|----------|-------------|
| `/api/fear-greed` | Chỉ số Fear & Greed với dữ liệu lịch sử |
| `/api/arbitrage` | Cơ hội arbitrage qua các sàn |
| `/api/signals` | Tín hiệu giao dịch kỹ thuật |
| `/api/funding` | Funding rates qua các sàn phái sinh |
| `/api/options` | Luồng options & max pain |
| `/api/liquidations` | Dữ liệu liquidation thời gian thực |
| `/api/whale-alerts` | Theo dõi giao dịch cá voi |
| `/api/orderbook` | Dữ liệu orderbook aggregated |

---

## Bắt Đầu Nhanh

### Sử Dụng cURL

```bash
# Lấy tin mới nhất
curl "https://cryptocurrency.cv/api/news"

# Tìm kiếm tin
curl "https://cryptocurrency.cv/api/search?q=ethereum"

# Lấy digest AI
curl "https://cryptocurrency.cv/api/digest"

# Lấy Fear & Greed Index
curl "https://cryptocurrency.cv/api/fear-greed"
```

### Sử Dụng JavaScript

```javascript
// Lấy tin mới nhất
const response = await fetch('https://cryptocurrency.cv/api/news');
const data = await response.json();

console.log(data.articles);
// [{ title, link, source, pubDate, timeAgo, ... }, ...]
```

### Sử Dụng Python

```python
import requests

# Lấy tin mới nhất
response = requests.get('https://cryptocurrency.cv/api/news')
data = response.json()

for article in data['articles'][:5]:
    print(f"• {article['title']} ({article['source']})")
```

---

## Triển Khai Riêng

### Một Click Deploy

[![Deploy với Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)
[![Deploy với Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/nirholas/free-crypto-news)

### Cài Đặt Cục Bộ

```bash
# Clone repository
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news

# Cài dependencies
npm install

# Chạy development server
npm run dev

# Mở http://localhost:3000
```

### Biến Môi Trường

```env
# Tùy chọn: Cho tính năng AI (miễn phí từ groq.com)
GROQ_API_KEY=gsk_your_key_here

# Tùy chọn: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_id
```

---

## Tài Liệu

| Tài liệu | Mô tả |
|---|---|
| [📚 Tham khảo API](docs/API.md) | Tài liệu endpoint đầy đủ |
| [🏗️ Kiến trúc](docs/ARCHITECTURE.md) | Thiết kế hệ thống |
| [🚀 Triển khai](docs/DEPLOYMENT.md) | Hướng dẫn production |
| [🧪 Testing](docs/TESTING.md) | Hướng dẫn test |
| [🔐 Bảo mật](docs/SECURITY.md) | Chính sách bảo mật |
| [📖 Hướng dẫn người dùng](docs/USER-GUIDE.md) | Hướng dẫn PWA & tính năng |
| [💻 Hướng dẫn phát triển](docs/DEVELOPER-GUIDE.md) | Tài liệu cho contributors |

---

## Đóng Góp

Đóng góp được chào đón! Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết hướng dẫn.

```bash
# Fork repo
# Tạo feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m 'Add amazing feature'

# Push và tạo Pull Request
git push origin feature/amazing-feature
```

---

## Giấy Phép

MIT License - xem file [LICENSE](LICENSE).

---

## Liên Hệ

- 🐛 **Bugs**: [GitHub Issues](https://github.com/nirholas/free-crypto-news/issues)
- 💬 **Thảo luận**: [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐦 **Twitter**: [@nirholas](https://twitter.com/nirholas)

---

<p align="center">
  Được tạo với ❤️ cho cộng đồng crypto
  <br>
  <a href="https://cryptocurrency.cv">cryptocurrency.cv</a>
</p>
