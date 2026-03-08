# kamuy-shop.jp Shopify テーマ

株式会社WinGrow様向けShopify ECサイト（kamuy-shop.jp）のカスタムテーマです。

## ディレクトリ構成

```
kamuy_shopify_theme/
├── layout/
│   └── theme.liquid          # メインレイアウト
├── templates/
│   ├── index.json            # TOPページ（セクション構成）
│   └── product.liquid        # 商品詳細ページ
├── sections/
│   ├── header.liquid         # ヘッダー（ナビ・検索・会員状態切替）
│   ├── footer.liquid         # フッター
│   ├── hero-banner.liquid    # ヒーローバナー
│   ├── member-appeal.liquid  # 会員訴求バナー（非会員のみ表示）
│   ├── popular-ranking.liquid # 人気ランキング
│   ├── category-list.liquid  # カテゴリ一覧
│   ├── daily-special.liquid  # 日替わり特集
│   ├── sale-products.liquid  # お買い得商品
│   ├── features.liquid       # 特徴紹介
│   └── product-main.liquid   # 商品詳細メイン
├── assets/
│   ├── theme.css             # メインCSS
│   └── theme.js              # メインJS（Vanilla JS）
└── config/
    └── settings_schema.json  # テーマ設定スキーマ
```

## 主な機能

### 会員/非会員の表示切替（Liquid）

`customer` オブジェクトを使って、ログイン状態・会員タグに応じて表示を切り替えています。

```liquid
{% if customer and customer.tags contains 'member' %}
  <!-- 会員向け表示 -->
{% else %}
  <!-- 非会員向け表示（会員訴求） -->
{% endif %}
```

### 商品の会員価格設定

会員価格は商品のメタフィールド `custom.member_price` に設定します。

- **名前空間:** `custom`
- **キー:** `member_price`
- **型:** `money`（整数、円×100）

### 人気ランキング

Shopifyのコレクション機能を使用します。「popular」というハンドルのコレクションを作成し、商品を手動で並べ替えることで人気順を管理します。

### 日替わり特集

「daily-special」ハンドルのコレクションの最初の商品が表示されます。毎日コレクションの商品を入れ替えることで更新できます。

## Shopify管理画面での設定手順

### 1. テーマのアップロード

1. Shopify管理画面 → オンラインストア → テーマ
2. 「テーマをアップロード」→ zipファイルをアップロード

### 2. コレクションの作成

| コレクション名 | ハンドル | 用途 |
|---|---|---|
| 人気ランキング | popular | TOPページ人気ランキング |
| お買い得商品 | sale | TOPページセール商品 |
| 日替わり特集 | daily-special | TOPページ特集 |
| カニ | kani | カテゴリページ |
| ホタテ | hotate | カテゴリページ |
| 鮭・サーモン | sake | カテゴリページ |
| ホッケ・その他 | hokke | カテゴリページ |

### 3. 商品メタフィールドの設定

管理画面 → 設定 → カスタムデータ → 商品 で以下を追加：

| 名前 | 名前空間 | キー | 型 |
|---|---|---|---|
| 会員価格 | custom | member_price | 金額 |
| 商品の特徴 | custom | features | リッチテキスト |
| おすすめの召し上がり方 | custom | recipe | リッチテキスト |
| 内容量 | custom | weight_volume | 単一行テキスト |
| 原材料名 | custom | ingredients | 単一行テキスト |
| 産地 | custom | origin | 単一行テキスト |
| アレルギー表示 | custom | allergens | 単一行テキスト |
| 保存方法 | custom | storage | 単一行テキスト |
| 解凍方法 | custom | thawing | 単一行テキスト |
| 消費期限 | custom | expiry | 単一行テキスト |

### 4. 会員タグの設定（Mikawaya Subscription）

Mikawaya Subscriptionアプリで、会員登録完了時に自動で `member` タグを付与するよう設定します。

## デザイン変数（CSS Custom Properties）

```css
--color-primary:  #C0392B  /* 赤（メインアクセント） */
--color-navy:     #1A2A4A  /* ネイビー（ベース） */
--color-gold:     #D4AF37  /* 金（ランキング・バッジ） */
--color-member:   #1A6B3A  /* 会員価格（緑） */
```

## 依存関係

- Google Fonts（Noto Serif JP / Noto Sans JP）
- 外部ライブラリなし（Vanilla JS）

## 開発メモ

- ターゲット: 50〜70代（シニア層）→ フォントサイズ大きめ・シンプル導線
- 配送: 佐川急便 飛脚クール便（冷凍）
- 送料: 全国一律2,500円 / 10,000円以上送料無料 / 沖縄・離島+2,000円
- 税率: 商品8%（軽減税率）/ 送料10%
