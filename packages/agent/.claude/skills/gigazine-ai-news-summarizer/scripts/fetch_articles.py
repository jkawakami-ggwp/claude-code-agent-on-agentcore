#!/usr/bin/env python3
"""
GIGAZINE AI記事取得スクリプト

GIGAZINEのAIカテゴリページから指定期間の記事を取得します。
ブラウザツールを使用してページを解析します。
"""

import json
import sys
from datetime import datetime, timedelta
from typing import List, Dict


def parse_date(date_str: str) -> datetime:
    """
    日付文字列をdatetimeオブジェクトに変換
    例: "01月17日12時00分" -> datetime(2026, 1, 17, 12, 0)
    """
    # 現在の年を取得
    current_year = datetime.now().year
    
    # 日付をパース
    month = int(date_str.split("月")[0])
    day = int(date_str.split("月")[1].split("日")[0])
    
    # 年月日を使ってdatetimeを作成
    return datetime(current_year, month, day)


def filter_articles_by_days(articles: List[Dict], days: int = 7) -> List[Dict]:
    """
    指定日数以内の記事のみをフィルタリング
    """
    cutoff_date = datetime.now() - timedelta(days=days)
    filtered = []
    
    for article in articles:
        try:
            article_date = parse_date(article['date'])
            if article_date >= cutoff_date:
                filtered.append(article)
        except Exception as e:
            print(f"日付パースエラー: {article['date']} - {e}", file=sys.stderr)
            continue
    
    return filtered


def main():
    """
    使用例:
    このスクリプトはブラウザツールからの記事データを標準入力で受け取ります。
    
    記事データのフォーマット:
    {
        "title": "記事タイトル",
        "url": "https://gigazine.net/news/...",
        "date": "01月17日12時00分",
        "category": "AI"
    }
    """
    # 標準入力から記事データを読み込む
    try:
        input_data = sys.stdin.read()
        articles = json.loads(input_data)
        
        # デフォルトは7日間
        days = int(sys.argv[1]) if len(sys.argv) > 1 else 7
        
        # 指定期間でフィルタリング
        filtered_articles = filter_articles_by_days(articles, days)
        
        # 結果を出力
        print(json.dumps(filtered_articles, ensure_ascii=False, indent=2))
        
    except json.JSONDecodeError as e:
        print(f"JSON解析エラー: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"エラー: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
