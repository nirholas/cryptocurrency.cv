🌐 **言語:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 Free Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHubスター"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="ライセンス"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CIステータス"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News APIデモ" width="700">
</p>

> ⭐ **役に立ったらリポジトリにスターを付けてください！** 他の人がこのプロジェクトを発見するのを助け、継続的な開発のモチベーションになります。

---
1回のAPI呼び出しで7つの主要ソースからリアルタイムの暗号資産ニュースを取得できます。

```bash
curl https://cryptocurrency.cv/api/news
```
---

| | Free Crypto News | CryptoPanic | その他 |
|---|---|---|---|
| **価格** | 🆓 永久無料 | $29-299/月 | 有料 |
| **APIキー** | ❌ 不要 | 必要 | 必要 |
| **レート制限** | 無制限* | 100-1000/日 | 制限あり |
| **ソース** | 12 英語 + 12 国際 | 1 | 様々 |
| **国際対応** | 🌏 KO, ZH, JA, ES + 翻訳 | なし | なし |
| **セルフホスト** | ✅ ワンクリック | なし | なし |
| **PWA** | ✅ インストール可能 | なし | なし |
| **MCP** | ✅ Claude + ChatGPT | なし | なし |

---

## 🌍 国際ニュースソース

18言語の**75の国際ソース**から暗号資産ニュースを取得 — 英語への自動翻訳付き！

### サポートされているソース

| 地域 | ソース |
|--------|---------|
| 🇰🇷 **韓国** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **中国** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **日本** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **ラテンアメリカ** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### クイック例

```bash
# すべての国際ニュースを取得
curl "https://cryptocurrency.cv/api/news/international"

# 韓国のニュースを英語翻訳付きで取得
curl "https://cryptocurrency.cv/api/news/international?language=ko&translate=true"

# アジア地域のニュースを取得
curl "https://cryptocurrency.cv/api/news/international?region=asia&limit=20"
```

### 機能

- ✅ Groq AIによる英語への**自動翻訳**
- ✅ 効率のための**7日間翻訳キャッシュ**
- ✅ **オリジナル + 英語**テキスト保持
- ✅ APIを尊重するための**レート制限**（1リクエスト/秒）
- ✅ 利用不可ソースの**フォールバック処理**
- ✅ ソース間の**重複排除**

---

## 📱 プログレッシブウェブアプリ（PWA）

Free Crypto Newsはオフラインで動作する**完全にインストール可能なPWA**です！

### 機能

| 機能 | 説明 |
|---------|-------------|
| 📲 **インストール可能** | あらゆるデバイスのホーム画面に追加 |
| 📴 **オフラインモード** | インターネットなしでキャッシュされたニュースを読む |
| 🔔 **プッシュ通知** | 速報アラートを受信 |
| ⚡ **超高速** | アグレッシブなキャッシュ戦略 |
| 🔄 **バックグラウンド同期** | オンライン復帰時に自動更新 |

### アプリのインストール

**デスクトップ（Chrome/Edge）:**
1. [cryptocurrency.cv](https://cryptocurrency.cv)にアクセス
2. アドレスバーのインストールアイコン（⊕）をクリック
3. 「インストール」をクリック

**iOS Safari:**
1. Safariでサイトにアクセス
2. 共有（📤）→「ホーム画面に追加」をタップ

**Android Chrome:**
1. サイトにアクセス
2. インストールバナーまたはメニュー→「アプリをインストール」をタップ

---

## ソース

**7つの信頼できるメディア**から集約：

- 🟠 **CoinDesk** — 一般的な暗号資産ニュース
- 🔵 **The Block** — 機関投資家＆リサーチ
- 🟢 **Decrypt** — Web3＆カルチャー
- 🟡 **CoinTelegraph** — グローバル暗号資産ニュース
- 🟤 **Bitcoin Magazine** — Bitcoinマキシマリスト
- 🟣 **Blockworks** — DeFi＆機関投資家
- 🔴 **The Defiant** — DeFiネイティブ

---

## エンドポイント

| エンドポイント | 説明 |
|----------|-------------|
| `/api/news` | すべてのソースからの最新 |
| `/api/search?q=bitcoin` | キーワードで検索 |
| `/api/defi` | DeFi専用ニュース |
| `/api/bitcoin` | Bitcoin専用ニュース |
| `/api/breaking` | 過去2時間のみ |
| `/api/trending` | センチメント付きトレンドトピック |
| `/api/analyze` | トピック分類付きニュース |
| `/api/stats` | 分析＆統計 |
| `/api/sources` | すべてのソースを一覧 |
| `/api/health` | API＆フィードヘルスステータス |

### 🤖 AI搭載エンドポイント（Groq経由で無料）

| エンドポイント | 説明 |
|----------|-------------|
| `/api/summarize` | 記事のAI要約 |
| `/api/ask?q=...` | 暗号資産ニュースについて質問 |
| `/api/digest` | AI生成の日次ダイジェスト |
| `/api/sentiment` | 記事ごとの詳細センチメント分析 |
| `/api/entities` | 人物、企業、ティッカーを抽出 |
| `/api/narratives` | 市場のナラティブ＆テーマを特定 |
| `/api/signals` | ニュースベースのトレーディングシグナル（教育目的） |

---

## SDK＆コンポーネント

| パッケージ | 説明 |
|---------|-------------|
| [React](sdk/react/) | `<CryptoNews />`ドロップインコンポーネント |
| [TypeScript](sdk/typescript/) | 完全なTypeScript SDK |
| [Python](sdk/python/) | 依存関係ゼロのPythonクライアント |
| [JavaScript](sdk/javascript/) | ブラウザ＆Node.js SDK |
| [Go](sdk/go/) | Goクライアントライブラリ |
| [PHP](sdk/php/) | PHP SDK |

**ベースURL:** `https://cryptocurrency.cv`

---

## レスポンス形式

```json
{
  "articles": [
    {
      "title": "Bitcoin、新ATHを達成",
      "link": "https://coindesk.com/...",
      "description": "Bitcoinは...",
      "pubDate": "2025-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "2時間前"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2025-01-02T14:30:00Z"
}
```

---

# 統合例

プラットフォームを選択。コードをコピー。デプロイ。

---

## 🐍 Python

**依存関係ゼロ。** ファイルをコピーするだけ。

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
```

```python
from crypto_news import CryptoNews

news = CryptoNews()

# 最新ニュースを取得
for article in news.get_latest(5):
    print(f"📰 {article['title']}")
    print(f"   {article['source']} • {article['timeAgo']}")
    print(f"   {article['link']}\n")
```

---

## 🟨 JavaScript / TypeScript

**Node.jsとブラウザで動作。**

### TypeScript SDK (npm)

```bash
npm install @nirholas/crypto-news
```

```typescript
import { CryptoNews } from '@nirholas/crypto-news';

const client = new CryptoNews();

// 完全に型付けされたレスポンス
const articles = await client.getLatest(10);
const health = await client.getHealth();
```

---

# セルフホスティング

## ワンクリックデプロイ

[![Vercelでデプロイ](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## 手動

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

http://localhost:3000/api/news を開く

## 環境変数

**すべての環境変数はオプションです。** プロジェクトは設定なしで動作します。

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | i18n自動翻訳を有効化（18言語）。**無料！** [console.groq.com/keys](https://console.groq.com/keys)で取得 |
| `FEATURE_TRANSLATION` | `false` | `true`に設定してリアルタイム翻訳を有効化 |

---

# 技術スタック

- **ランタイム:** Next.js 14 Edge Functions
- **ホスティング:** Vercel無料枠
- **データ:** ダイレクトRSSパース（データベースなし）
- **キャッシュ:** 5分エッジキャッシュ

---

# コントリビュート

PRを歓迎します！アイデア：

- [ ] より多くのニュースソース
- [x] ~~センチメント分析~~ ✅ 完了
- [x] ~~トピック分類~~ ✅ 完了
- [x] ~~WebSocketリアルタイムフィード~~ ✅ 完了
- [ ] Rust / Ruby SDK
- [ ] モバイルアプリ（React Native）

---

## 📚 ドキュメント

| ドキュメント | 説明 |
|----------|-------------|
| [ユーザーガイド](docs/USER-GUIDE.md) | エンドユーザー機能、キーボードショートカット、PWA |
| [開発者ガイド](docs/DEVELOPER-GUIDE.md) | アーキテクチャ、コンポーネント、アプリの拡張 |
| [コントリビュート](CONTRIBUTING.md) | コントリビュート方法 |
| [変更履歴](CHANGELOG.md) | バージョン履歴 |
| [セキュリティ](SECURITY.md) | セキュリティポリシー |

---

# ライセンス

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>暗号資産ニュースAPIにお金を払うのはやめましょう。</b><br>
  <sub>コミュニティのために💜を込めて作成</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>役に立ちましたか？スターをお願いします！</b> ⭐<br>
  <sub>他の人がこのプロジェクトを発見するのを助け、開発を継続させます</sub><br><br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="GitHubでスター">
  </a>
</p>
