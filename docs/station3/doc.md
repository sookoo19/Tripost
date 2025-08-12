# 設計1

## 技術選定
最速でのリリースを求めるために、学習した技術をメインで使用。リリース後モバイルアプリ展開に適した言語を選定。

1. フロントエンド
・React.js
Google Maps JavaScript APIとの統合が豊富
・SPA（Single Page Application）
ページ遷移なしでの地図とコンテンツ表示切り替え

2. バックエンド
・Laravel

3. データベース
・MySQL
SNSアプリの複雑なリレーション対応

4. 認証
Laravel Breeze

5. 外部API
・Google Maps Platform
Maps JavaScript API: 地図表示・マーカー配置
Places API: 場所検索・googleマップとの紐付け
Directions API: ルート表示機能


6. 状態管理
React Context + useReducer

7.ホスティング
Vercel(フロント)
Railway(バック、データベース)
無料
(Googleでもデプロイできるか試してみる)

## 画面設計図
https://www.figma.com/design/JkcWsCKqWOFi29hsUtHpKd/%E5%80%8B%E4%BA%BA%E9%96%8B%E7%99%BA%E3%80%8ETripost%E3%80%8F?node-id=0-1&t=rquA2HitHrGef66S-1

## 画面遷移図
https://www.figma.com/design/JkcWsCKqWOFi29hsUtHpKd/%E5%80%8B%E4%BA%BA%E9%96%8B%E7%99%BA%E3%80%8ETripost%E3%80%8F?node-id=24-435&t=rquA2HitHrGef66S-1

## ユーザーフロー図
https://www.figma.com/design/JkcWsCKqWOFi29hsUtHpKd/%E5%80%8B%E4%BA%BA%E9%96%8B%E7%99%BA%E3%80%8ETripost%E3%80%8F?node-id=25-513&t=rquA2HitHrGef66S-1


## ER図
https://www.figma.com/design/JkcWsCKqWOFi29hsUtHpKd/%E5%80%8B%E4%BA%BA%E9%96%8B%E7%99%BA%E3%80%8ETripost%E3%80%8F?node-id=34-1740&t=rquA2HitHrGef66S-1

## API仕様書
OpenAPI 3.0仕様書
- **ファイル場所**: `openapi:yml '3.0.`
- **内容**: REST API の詳細仕様
- **オンライン確認**: Swagger UI で閲覧可能

## テーブル定義書
・users
・posts
・likes
・comments
・follows
・itineraries
・photos
・countries
・styles
・purposes
・budgets

