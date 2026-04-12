# Laravel + Inertia + React のデータ受け渡しと構成理解

**日付**: 2026-04-12
**会話の概要**: Tripost のデータフロー（RDS → Laravel → Inertia → React）を整理し、trip_plan の二重エンコード問題・REST API とルートの違い・Docker Compose の構成を理解した。

---

## 今日学んだ概念

### Inertia.js のデータ受け渡し
- **何か**: Laravel と React の間でデータを橋渡しするライブラリ
- **なぜ必要か**: REST API を作らずに Laravel のルーティング・認証をそのまま使いながら React を動かせる
- **仕組み**: `Inertia::render()` に渡したデータを HTML の `data-page` 属性に JSON として埋め込み、React 側でそれを読み取る

```
PHP 配列
  ↓ json_encode（Inertia が内部で実行）
HTML の data-page 属性（文字列）
  ↓ JSON.parse（Inertia JS クライアントが実行）
React の props（JS オブジェクト）
```

---

### 二重エンコード問題
- **何か**: JSON 文字列を再度 JSON 変換してしまう問題
- **なぜ起きるか**: `$casts` がない場合、Eloquent は DB の JSON カラムを **文字列のまま** PHP に返す。それを Inertia がさらに `json_encode` するため、文字列が文字列化される
- **結果**: React 側で `props.post.trip_plan` がオブジェクトではなく**文字列**として届き、データアクセスが `undefined` になる

---

### Eloquent の $casts
- **何か**: モデル取得時に自動で型変換する設定
- **なぜ必要か**: DB から取得した JSON 文字列を PHP 配列に自動変換することで、二重エンコードを防ぐ
- **効果**: 型変換の責務をモデル層に一元化できる

---

### ルートと REST API の違い
- **ルート**: 「この URL にアクセスしたらこの処理を実行する」という対応表。レスポンスが HTML でも JSON でも関係ない
- **REST API**: ルートの中でも、JSON を返すことを目的に設計されたもの
- **REST API はルートの一種**。ルートが必ずしも REST API というわけではない

---

### web.php と api.php の使い分け
- **web.php**: ブラウザ向け。セッション認証・CSRF 保護あり。Inertia 構成ではこれだけで完結する
- **api.php**: 外部向け。トークン認証・CSRF なし・レート制限あり。Next.js など別サーバーのフロントエンドと通信する場合に必要

| 構成 | 使うファイル | 理由 |
|------|-------------|------|
| Inertia（同一サーバー） | web.php のみ | セッション認証で完結 |
| Next.js（別サーバー） | api.php | トークン認証が必要 |

---

### Docker Compose の構成（本番環境）
- **何か**: 複数のコンテナをまとめて管理するツール
- **このプロジェクトの構成**: 3つのコンテナ

| コンテナ | 役割 |
|---------|------|
| Nginx | リクエストの入り口。HTTP/HTTPS を受け取り Laravel に転送 |
| Laravel | アプリケーション本体。PHP が動いている |
| Redis | キューとキャッシュ（通知機能など） |

- MySQL は **RDS**（EC2 外のマネージドサービス）を使用
- ファイルは **S3** で管理
- React は Laravel コンテナ内でビルド済み静的ファイルとして配信される（React 専用コンテナは存在しない）

```
ブラウザ
  ↓ HTTP/HTTPS
Nginx コンテナ
  ↓ 転送
Laravel コンテナ
  ↓ データ取得        ↓ キュー・キャッシュ
RDS (MySQL)          Redis コンテナ
```

---

## 書いたコード

### Eloquent $casts による型変換

```php
// app/Models/Post.php
protected $casts = [
    'trip_plan' => 'array',  // JSON文字列 ↔ PHP配列 を自動変換
    'photos'    => 'array',
];
```

**ポイント解説:**
- `'trip_plan' => 'array'`: DB から取得時に自動で PHP 配列にデコード、保存時に自動で JSON 文字列にエンコード
- これにより Inertia 経由で React に正しくオブジェクトとして届く

---

### trip_plan のデータ構造

```js
// React 側で受け取る形式
{
  1: [
    ["09:00", "東京タワー",  35.6586, 139.7454],
    ["12:00", "浅草寺",     35.7148, 139.7967],
  ],
  2: [
    ["10:00", "富士山", 35.3606, 138.7274],
  ]
}
// 各エントリ: [time, place_name, lat, lng]
```

---

### カスタムバリデーションルール

```php
// app/Rules/PasswordComplexity.php
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    $types = 0;
    if (preg_match('/[a-z]/', $value)) $types++;
    if (preg_match('/[A-Z]/', $value)) $types++;
    if (preg_match('/[0-9]/', $value)) $types++;
    if (preg_match('/[!@#$%^&*(),.?":{}|<>]/', $value)) $types++;
    
    if ($types < 3) {
        $fail('パスワードは英大文字・英小文字・数字・記号のうち3種類以上を含む必要があります。');
    }
}
```

**ポイント解説:**
- `ValidationRule` インターフェースを実装することでカスタムルールを作成できる
- `$fail()` を呼ぶとバリデーション失敗としてエラーメッセージを返す

---

## なぜそう書くか（設計の理由）

- **Inertia を採用した理由**: REST API を別途作らずに Laravel の認証・ルーティングをそのまま使える。CORS 設定や API 設計の手間を省き、開発速度を優先できる
- **$casts で一元管理する理由**: コントローラーや各所で `json_decode()` を手動で書くと漏れが生じる。モデル層に集約することで一貫性を保てる
- **web.php のみ使用する理由**: Inertia 構成では Laravel とフロントが同一サーバーで動くためセッション認証で完結し、api.php は不要
- **ホワイトリスト方式（$fillable）を採用する理由**: 許可するカラムを明示することで、新しいカラム追加時に意図せず書き込まれるリスクを防げる

---

## 次回への課題・疑問点

- [ ] Docker Compose の設定ファイルを自分で書けるようにする
- [ ] `api.php` のミドルウェア（Sanctum トークン認証）の仕組みを理解する
- [ ] Inertia の `router.post/put` によるフォーム送信の仕組みを整理する
- [ ] Redis がキューとキャッシュで具体的にどう使われているか確認する
