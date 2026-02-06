🌐 **언어:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 무료 암호화폐 뉴스 API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub 스타"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="라이선스"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI 상태"></a>
  <a href="https://github.com/nirholas/free-crypto-news/issues"><img src="https://img.shields.io/github/issues/nirholas/free-crypto-news?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/nirholas/free-crypto-news/pulls"><img src="https://img.shields.io/github/issues-pr/nirholas/free-crypto-news?style=for-the-badge&color=purple" alt="Pull Requests"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API 데모" width="700">
</p>

> ⭐ **유용하다면 스타를 눌러주세요!** 다른 사람들이 이 프로젝트를 발견하고 지속적인 개발에 동기를 부여합니다.

---

하나의 API 호출로 7개 주요 소스에서 실시간 암호화폐 뉴스를 받아보세요.

```bash
curl https://cryptocurrency.cv/api/news
```

---

## 비교

| | Free Crypto News | CryptoPanic | 기타 |
|---|---|---|---|
| **가격** | 🆓 영구 무료 | $29-299/월 | 유료 |
| **API 키** | ❌ 필요없음 | 필수 | 필수 |
| **요청 제한** | 무제한* | 100-1000/일 | 제한 |
| **소스** | 12개 영어 + 12개 국제 | 1 | 다양 |
| **국제화** | 🌏 한국어, 중국어, 일본어, 스페인어 + 번역 | 아니오 | 아니오 |
| **셀프 호스팅** | ✅ 원클릭 배포 | 아니오 | 아니오 |
| **PWA** | ✅ 설치 가능 | 아니오 | 아니오 |
| **MCP** | ✅ Claude + ChatGPT | 아니오 | 아니오 |

---

## 🌿 브랜치

| 브랜치 | 설명 |
|--------|-------------|
| `main` | 안정적인 프로덕션 브랜치 — 원래 API 중심 설계 |
| `redesign/pro-news-ui` | 프리미엄 UI 재설계 — CoinDesk/CoinTelegraph 스타일, 다크 모드, 향상된 컴포넌트, SEO 구조화 데이터 및 완전한 PWA 지원 |

로컬에서 재설계 테스트:
```bash
git checkout redesign/pro-news-ui
npm install && npm run dev
```

---

## 🌍 국제 뉴스 소스

**12개 국제 소스**에서 한국어, 중국어, 일본어, 스페인어로 암호화폐 뉴스를 가져옵니다 — 영어로 자동 번역됩니다!

### 지원 소스

| 지역 | 소스 |
|--------|---------|
| 🇰🇷 **한국** | 블록미디어, 토큰포스트, 코인데스크코리아 |
| 🇨🇳 **중국** | 8BTC (바비트), Jinse Finance (진써), Odaily (오데일리) |
| 🇯🇵 **일본** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **라틴아메리카** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### 빠른 예제

```bash
# 모든 국제 뉴스 가져오기
curl "https://cryptocurrency.cv/api/news/international"

# 한국어 뉴스를 영어로 번역해서 가져오기
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# 아시아 지역 뉴스 가져오기
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### 기능

- ✅ Groq AI를 통한 **자동 영어 번역**
- ✅ 효율성을 위한 **7일 번역 캐시**
- ✅ **원문 + 영문** 보존
- ✅ API 존중을 위한 **속도 제한** (1 요청/초)
- ✅ 소스 불가 시 **우아한 폴백**
- ✅ 소스 간 **중복 제거**

전체 세부 정보는 [API 문서](docs/API.md#get-apinewsinternational)를 참조하세요.

---

## 📱 프로그레시브 웹 앱 (PWA)

Free Crypto News는 오프라인 지원이 되는 **완전히 설치 가능한 PWA**입니다.

### 기능

| 기능 | 설명 |
|---------|-------------|
| 📲 **설치 가능** | 모든 기기에서 홈 화면에 추가 |
| 📴 **오프라인 모드** | 네트워크 없이 캐시된 뉴스 읽기 |
| 🔔 **푸시 알림** | 속보 알림 받기 |
| ⚡ **빠른 속도** | 적극적인 캐싱 전략 |
| 🔄 **백그라운드 동기화** | 온라인 복귀 시 자동 업데이트 |
| 🎯 **단축키** | 최신, 인기, 비트코인 빠른 액세스 |
| 📤 **공유** | 앱에서 직접 링크 공유 |
| 🚨 **실시간 알림** | 구성 가능한 가격 및 뉴스 조건 알림 |

### 앱 설치

**데스크톱 (Chrome/Edge):**
1. [cryptocurrency.cv](https://cryptocurrency.cv) 방문
2. URL 바의 설치 아이콘 (⊕) 클릭
3. "설치" 클릭

**iOS Safari:**
1. Safari에서 사이트 방문
2. 공유 (📤) → "홈 화면에 추가" 탭

**Android Chrome:**
1. 사이트 방문
2. 설치 배너 탭 또는 메뉴 → "앱 설치"

### Service Worker 캐싱

PWA는 스마트 캐싱 전략을 사용합니다:

| 콘텐츠 | 전략 | 캐시 기간 |
|---------|----------|----------------|
| API 응답 | Network-first | 5분 |
| 정적 자산 | Cache-first | 7일 |
| 이미지 | Cache-first | 30일 |
| 내비게이션 | Network-first + 오프라인 폴백 | 24시간 |

### 키보드 단축키

키보드로 뉴스를 빠르게 탐색:

| 단축키 | 동작 |
|----------|--------|
| `j` / `k` | 다음 / 이전 기사 |
| `/` | 검색 포커스 |
| `Enter` | 선택한 기사 열기 |
| `d` | 다크 모드 토글 |
| `g h` | 홈으로 이동 |
| `g t` | 트렌딩으로 이동 |
| `g s` | 소스로 이동 |
| `g b` | 북마크로 이동 |
| `?` | 모든 단축키 표시 |
| `Escape` | 모달 닫기 |

📖 **전체 사용자 가이드:** [docs/USER-GUIDE.md](docs/USER-GUIDE.md)

---

## 소스

**7개 신뢰할 수 있는 매체**에서 집계합니다:

- 🟠 **CoinDesk** — 일반 암호화폐 뉴스
- 🔵 **The Block** — 기관 및 연구
- 🟢 **Decrypt** — Web3 및 문화
- 🟡 **CoinTelegraph** — 글로벌 암호화폐 뉴스
- 🟤 **Bitcoin Magazine** — 비트코인 맥시멀리스트
- 🟣 **Blockworks** — DeFi 및 기관
- 🔴 **The Defiant** — DeFi 네이티브

---

## 엔드포인트

| 엔드포인트 | 설명 |
|----------|-------------|
| `/api/news` | 모든 소스의 최신 뉴스 |
| `/api/search?q=bitcoin` | 키워드로 검색 |
| `/api/defi` | DeFi 관련 뉴스 |
| `/api/bitcoin` | Bitcoin 관련 뉴스 |
| `/api/breaking` | 최근 2시간 이내 |
| `/api/trending` | 감성 분석 포함 트렌딩 토픽 |
| `/api/analyze` | 토픽 분류 포함 뉴스 |
| `/api/stats` | 분석 및 통계 |
| `/api/sources` | 모든 소스 목록 |
| `/api/health` | API 및 피드 상태 |
| `/api/rss` | 통합 RSS 피드 |
| `/api/atom` | 통합 Atom 피드 |
| `/api/opml` | RSS 리더용 OPML 내보내기 |
| `/api/docs` | 대화형 API 문서 |
| `/api/webhooks` | 웹훅 등록 |
| `/api/archive` | 과거 뉴스 아카이브 |
| `/api/push` | 웹 푸시 알림 |
| `/api/origins` | 뉴스 원본 소스 찾기 |
| `/api/portfolio` | 포트폴리오 기반 뉴스 + 가격 |
| `/api/news/international` | 번역된 국제 소스 |

### 🤖 AI 기반 엔드포인트 (Groq 무료)

| 엔드포인트 | 설명 |
|----------|-------------|
| `/api/digest` | AI 생성 일일 요약 |
| `/api/sentiment` | 시장 감성 분석 |
| `/api/summarize?url=` | 모든 URL 요약 |
| `/api/ask` | 암호화폐 뉴스에 대해 AI에게 질문 |
| `/api/entities` | 언급된 엔티티 추출 |
| `/api/claims` | 주장 검증 |
| `/api/clickbait` | 클릭베이트 감지 |

### 💹 시장 엔드포인트

| 엔드포인트 | 설명 |
|----------|-------------|
| `/api/fear-greed` | 공포 & 탐욕 지수와 역사 데이터 |
| `/api/arbitrage` | 거래소 간 차익거래 기회 |
| `/api/signals` | 기술 트레이딩 신호 |
| `/api/funding` | 파생상품 거래소 펀딩 비율 |
| `/api/options` | 옵션 흐름 및 최대 고통 |
| `/api/liquidations` | 실시간 청산 데이터 |
| `/api/whale-alerts` | 고래 거래 추적 |
| `/api/orderbook` | 통합 오더북 데이터 |

---

## 빠른 시작

### cURL 사용

```bash
# 최신 뉴스 가져오기
curl "https://cryptocurrency.cv/api/news"

# 뉴스 검색
curl "https://cryptocurrency.cv/api/search?q=ethereum"

# AI 다이제스트 가져오기
curl "https://cryptocurrency.cv/api/digest"

# 공포 & 탐욕 지수 가져오기
curl "https://cryptocurrency.cv/api/fear-greed"
```

### JavaScript 사용

```javascript
// 최신 뉴스 가져오기
const response = await fetch('https://cryptocurrency.cv/api/news');
const data = await response.json();

console.log(data.articles);
// [{ title, link, source, pubDate, timeAgo, ... }, ...]
```

### Python 사용

```python
import requests

# 최신 뉴스 가져오기
response = requests.get('https://cryptocurrency.cv/api/news')
data = response.json()

for article in data['articles'][:5]:
    print(f"• {article['title']} ({article['source']})")
```

---

## 셀프 호스팅

### 원클릭 배포

[![Vercel로 배포](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)
[![Railway로 배포](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/nirholas/free-crypto-news)

### 로컬 설치

```bash
# 저장소 클론
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# http://localhost:3000 열기
```

### 환경 변수

```env
# 선택사항: AI 기능용 (groq.com에서 무료 제공)
GROQ_API_KEY=gsk_your_key_here

# 선택사항: 분석
NEXT_PUBLIC_ANALYTICS_ID=your_id
```

---

## 문서

| 문서 | 설명 |
|---|---|
| [📚 API 참조](docs/API.md) | 전체 엔드포인트 문서 |
| [🏗️ 아키텍처](docs/ARCHITECTURE.md) | 시스템 설계 |
| [🚀 배포](docs/DEPLOYMENT.md) | 프로덕션 가이드 |
| [🧪 테스트](docs/TESTING.md) | 테스트 가이드 |
| [🔐 보안](docs/SECURITY.md) | 보안 정책 |
| [📖 사용자 가이드](docs/USER-GUIDE.md) | PWA 및 기능 가이드 |
| [💻 개발자 가이드](docs/DEVELOPER-GUIDE.md) | 기여자 문서 |

---

## 기여

기여를 환영합니다! 가이드라인은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

```bash
# 저장소 포크
# 기능 브랜치 생성
git checkout -b feature/amazing-feature

# 변경사항 커밋
git commit -m 'Add amazing feature'

# 푸시 및 Pull Request 생성
git push origin feature/amazing-feature
```

---

## 라이선스

MIT License - [LICENSE](LICENSE) 파일을 참조하세요.

---

## 연락처

- 🐛 **버그**: [GitHub Issues](https://github.com/nirholas/free-crypto-news/issues)
- 💬 **토론**: [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐦 **Twitter**: [@nirholas](https://twitter.com/nirholas)

---

<p align="center">
  암호화폐 커뮤니티를 위해 ❤️로 제작됨
  <br>
  <a href="https://cryptocurrency.cv">cryptocurrency.cv</a>
</p>
