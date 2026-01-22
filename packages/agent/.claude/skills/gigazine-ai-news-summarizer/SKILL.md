---
name: gigazine-ai-news-summarizer
description: GIGAZINE（ギガジン）のAIカテゴリページから指定期間（デフォルト1週間）の記事を取得し、各記事の要約を含むマークダウンファイルを生成する。使用タイミング：(1) ユーザーがGIGAZINEのAI記事まとめを要求した時、(2) テックニュースの定期的な要約が必要な時、(3) https://gigazine.net/news/C48/ から記事を取得したい時。
---

# GIGAZINE AI News Summarizer

## 概要

GIGAZINE（ギガジン）のAIカテゴリページから記事を取得し、要約付きのマークダウンファイルを生成するスキル。ブラウザツールを使用してページを解析し、指定期間（デフォルト7日間）の記事を収集して要約を作成します。

## ワークフロー

### ステップ1: ページアクセスと記事取得

1. ブラウザツールで https://gigazine.net/news/C48/ にアクセス
2. `browser_snapshot`を使用してページ構造を取得
3. 記事一覧から以下の情報を抽出:
   - 記事タイトル (heading要素内のテキスト)
   - 記事URL (link要素のurlプロパティ)
   - 公開日時 (time要素内のテキスト、例: "01月17日12時00分")
   - カテゴリ (通常は"AI")

### ステップ2: 期間フィルタリング

取得した記事を指定期間でフィルタリング:

```python
# デフォルトは7日間、ユーザー指定があればその日数
days = 7  # または user_specified_days
```

### ステップ3: 各記事の要約生成

各記事について:

1. 記事URLにアクセス (`browser_navigate`)
2. 本文を取得 (`browser_snapshot`)
3. AI要約を生成（3-5文程度の簡潔な要約）
4. 記事データに要約を追加

**注意**: 記事が多い場合は、ページ遷移の回数を考慮して効率的に処理する。

### ステップ4: マークダウン生成と出力

`scripts/generate_summary.py`を使用してマークダウンファイルを生成:

```bash
python scripts/generate_summary.py articles.json output.md
```

または直接Pythonコードでマークダウンを生成。

## 出力フォーマット

生成されるマークダウンの構造:

```markdown
# GIGAZINE AI記事まとめ

生成日時: YYYY年MM月DD日

取得記事数: XX件

---

## 1. [記事タイトル]

- **公開日時**: MM月DD日HH時MM分
- **カテゴリ**: AI
- **URL**: [https://gigazine.net/news/...]

### 要約

[3-5文程度の簡潔な要約文]

---

## 2. [次の記事タイトル]
...
```

## ページ構造の参考情報

GIGAZINEのAIカテゴリページの構造:

- 各記事は`generic`要素内に含まれる
- タイトルは`heading [level=2]`要素内
- リンクは`link [cursor=pointer]`要素のurlプロパティ
- 日時は`time`要素内のテキスト
- カテゴリは記事情報内のリンクテキスト

## 使用例

**例1: デフォルト（1週間分）の記事取得**

ユーザー: "GIGAZINEのAI記事を1週間分取得して要約を作成して"

処理:
1. https://gigazine.net/news/C48/ にアクセス
2. 7日以内の記事を取得
3. 各記事の要約を生成
4. マークダウンファイルを`05_News/`に出力

**例2: 期間指定での記事取得**

ユーザー: "GIGAZINEのAI記事を3日分取得して"

処理:
1. 同様にアクセス
2. 3日以内の記事のみをフィルタリング
3. 要約生成と`05_News/`に出力

## 注意事項

- ページ構造の変更: GIGAZINEのHTML構造が変更される可能性があるため、取得エラーが発生した場合は`browser_snapshot`で構造を再確認
- レート制限: 大量の記事がある場合は、適切な間隔でページアクセスを行う
- 要約の品質: AI要約は自動生成のため、重要な情報が漏れる可能性がある

## トラブルシューティング

### 記事が取得できない場合

1. `browser_snapshot`で現在のページ構造を確認
2. 要素の参照方法（ref）が正しいか確認
3. ページが正常にロードされているか確認

### 日付パースエラー

GIGAZINEの日付フォーマットは "MM月DD日HH時MM分" です。このフォーマットと異なる場合は、`scripts/fetch_articles.py`の`parse_date`関数を調整してください。

## リソース

### scripts/

- `fetch_articles.py`: 記事データをフィルタリングするヘルパースクリプト
- `generate_summary.py`: マークダウン形式の要約を生成

### references/

- `page_structure.md`: GIGAZINEページ構造の詳細ドキュメント

注: `assets/`ディレクトリは使用しないため削除済み
