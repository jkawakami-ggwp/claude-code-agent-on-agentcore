#!/usr/bin/env python3
"""
記事要約生成スクリプト

取得した記事データから要約を生成し、マークダウン形式で出力します。
"""

import json
import sys
from datetime import datetime
from typing import List, Dict


def generate_markdown_summary(articles: List[Dict], output_file: str = None) -> str:
    """
    記事リストからマークダウン形式の要約を生成
    
    Args:
        articles: 記事データのリスト
        output_file: 出力先ファイルパス（指定しない場合は標準出力）
    
    Returns:
        生成されたマークダウンテキスト
    """
    # ヘッダー生成
    today = datetime.now().strftime("%Y年%m月%d日")
    markdown = f"# GIGAZINE AI記事まとめ\n\n"
    markdown += f"生成日時: {today}\n\n"
    markdown += f"取得記事数: {len(articles)}件\n\n"
    markdown += "---\n\n"
    
    # 記事ごとに要約を生成
    for i, article in enumerate(articles, 1):
        markdown += f"## {i}. {article['title']}\n\n"
        markdown += f"- **公開日時**: {article['date']}\n"
        markdown += f"- **カテゴリ**: {article.get('category', 'AI')}\n"
        markdown += f"- **URL**: [{article['url']}]({article['url']})\n\n"
        
        # 要約がある場合は追加
        if 'summary' in article:
            markdown += f"### 要約\n\n{article['summary']}\n\n"
        
        markdown += "---\n\n"
    
    # ファイルに出力または標準出力
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(markdown)
        print(f"✅ 要約を {output_file} に出力しました", file=sys.stderr)
    else:
        print(markdown)
    
    return markdown


def main():
    """
    使用例:
    python generate_summary.py articles.json output.md
    
    または標準入力から:
    echo '[{"title": "...", "url": "...", "date": "..."}]' | python generate_summary.py
    """
    # 引数から入力ファイルと出力ファイルを取得
    if len(sys.argv) >= 2:
        # ファイルから読み込み
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) >= 3 else None
        
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                articles = json.load(f)
        except FileNotFoundError:
            print(f"エラー: ファイル '{input_file}' が見つかりません", file=sys.stderr)
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"JSON解析エラー: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # 標準入力から読み込み
        try:
            input_data = sys.stdin.read()
            articles = json.loads(input_data)
            output_file = None
        except json.JSONDecodeError as e:
            print(f"JSON解析エラー: {e}", file=sys.stderr)
            sys.exit(1)
    
    # マークダウン生成
    try:
        generate_markdown_summary(articles, output_file)
    except Exception as e:
        print(f"エラー: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
