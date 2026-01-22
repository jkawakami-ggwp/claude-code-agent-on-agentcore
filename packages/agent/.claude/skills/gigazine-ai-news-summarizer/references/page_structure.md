# GIGAZINEページ構造リファレンス

## AIカテゴリページ構造

URL: https://gigazine.net/news/C48/

### 記事一覧の構造

各記事は以下の階層構造で表現されています：

```yaml
- generic [ref=eXX]:  # 記事コンテナ
  - link [ref=eXX] [cursor=pointer]:  # サムネイル画像のリンク
    - /url: https://gigazine.net/news/YYYYMMDD-article-slug/
    - img [ref=eXX]
  - heading [level=2] [ref=eXX]:  # 記事タイトル
    - link [ref=eXX] [cursor=pointer]:
      - /url: https://gigazine.net/news/YYYYMMDD-article-slug/
      - generic [ref=eXX]: [記事タイトルテキスト]
  - generic [ref=eXX]:  # メタ情報
    - generic:
      - time [ref=eXX]:
        - link [ref=eXX] [cursor=pointer]:
          - /url: https://gigazine.net/news/YYYYMMDD-article-slug/
          - text: "MM月DD日HH時MM分"
      - link [ref=eXX]:  # カテゴリ
        - /url: https://gigazine.net/news/YYYYMMDD-article-slug/
        - generic [ref=eXX] [cursor=pointer]: [カテゴリ名（AI等）]
```

### 抽出すべき情報

1. **記事タイトル**: `heading [level=2]` 内の `generic` のテキスト
2. **記事URL**: `heading [level=2]` 内の `link` の `/url` プロパティ
3. **公開日時**: `time` 要素内の `link` のテキスト（フォーマット: "MM月DD日HH時MM分"）
4. **カテゴリ**: メタ情報の2番目の `link` 内の `generic` のテキスト

### ブラウザツールでの取得方法

```python
# 1. ページにアクセス
browser_navigate("https://gigazine.net/news/C48/")

# 2. スナップショットを取得
snapshot = browser_snapshot()

# 3. 記事要素を抽出
# snapshot内の構造から以下を抽出:
# - heading [level=2] で記事を識別
# - link要素からURLを取得
# - time要素から日時を取得
# - カテゴリラベルを取得
```

### 日付フォーマット

- 形式: `MM月DD日HH時MM分`
- 例: `01月17日12時00分` → 2026年1月17日 12:00
- 注意: 年の情報は含まれないため、現在の年を使用

### ページネーション

- 記事一覧の最後に「さらに前の記事を見る >>」リンク
- URL例: `https://gigazine.net/news/C48/P40/` (ページ2以降)
- 必要に応じてページネーションをたどって追加記事を取得

## 個別記事ページ構造

記事詳細ページ（例: https://gigazine.net/news/20260117-grok-still-allow-sexualised-images-cease-and-desist-order/）

### 本文の構造

```yaml
- article [ref=eXX]:  # メイン記事コンテナ
  - heading [level=1]:  # 記事タイトル
  - generic:  # メタ情報（日時、カテゴリ等）
  - generic:  # 記事本文
    - paragraph: [本文テキスト]
    - paragraph: [本文テキスト]
    - ...
```

### 本文抽出方法

1. `article` 要素を探す
2. 内部の `paragraph` 要素または本文テキストを結合
3. 広告や関連記事は除外

## ブラウザツール使用パターン

### パターン1: 記事一覧のみ取得（軽量）

```python
# ステップ1: 一覧ページアクセス
navigate("https://gigazine.net/news/C48/")

# ステップ2: スナップショット取得
snapshot = browser_snapshot()

# ステップ3: 記事情報を抽出
articles = extract_articles_from_snapshot(snapshot)
# -> [{"title": "...", "url": "...", "date": "..."}, ...]
```

### パターン2: 記事一覧 + 本文取得（詳細）

```python
# ステップ1-3: 上記と同じ

# ステップ4: 各記事の本文を取得
for article in articles:
    navigate(article['url'])
    snapshot = browser_snapshot()
    article['content'] = extract_article_content(snapshot)
    # 要約生成
    article['summary'] = generate_summary(article['content'])
```

### パターン3: 複数ページ取得

```python
# ページネーションをたどる
base_url = "https://gigazine.net/news/C48/"
page = 0
all_articles = []

while len(all_articles) < target_count:
    url = f"{base_url}P{page}/" if page > 0 else base_url
    navigate(url)
    snapshot = browser_snapshot()
    articles = extract_articles_from_snapshot(snapshot)
    all_articles.extend(articles)
    page += 40  # GIGAZINEは40記事ごとにページ分割
```

## エラーハンドリング

### よくあるエラーと対処法

1. **要素が見つからない**: ページ構造の変更 → `browser_snapshot`で構造を再確認
2. **タイムアウト**: ページの読み込みが遅い → `browser_wait_for`で待機
3. **日付パースエラー**: フォーマット変更 → 正規表現を調整

## 性能最適化

- **記事数が少ない場合**: 全記事の本文を取得して詳細な要約を生成
- **記事数が多い場合**: 一覧のみ取得、または一部の記事のみ本文取得
- **バッチ処理**: 記事URLをリスト化してから一括処理
