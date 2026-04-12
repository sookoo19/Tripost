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

---

---

# CI/CD の構成・テスト設計・Google OAuth

**日付**: 2026-04-12
**会話の概要**: Tripost の GitHub Actions による CI/CD フローを読み解き、テストの内容・設計方針を理解した。あわせて Google OAuth のセキュリティメリットを整理した。

---

## 今日学んだ概念

### GitHub Actions の CI/CD とは
- **何か**: コードを push したときに自動でテストやデプロイを実行する仕組み
- **なぜ必要か**: 手動でテスト・デプロイをすると漏れや手順ミスが発生する。自動化することで品質と安全性を担保できる
- **このプロジェクトの構成**: ワークフローが2つある

| ファイル | 役割 | トリガー |
|---------|------|---------|
| `test.yml` | テスト CI | `develop`/`feature/**` push、`main` への PR |
| `main.yml` | 本番デプロイ CD | `main` への push |

---

### CI（Continuous Integration）とは
- **何か**: コードが正しく動くかを自動で検証し続ける仕組み
- **このプロジェクトでやること**: PHP テスト実行 + フロントエンドビルド確認
- **例え**: コードを提出するたびに採点してくれる自動採点機

---

### CD（Continuous Delivery/Deployment）とは
- **何か**: テストが通ったコードを自動で本番環境に届ける仕組み
- **このプロジェクトでやること**: EC2 に SSH してコンテナを再ビルド・再起動
- **例え**: 採点が通ったら自動で工場に発注される仕組み

---

### ダイナミック SG ルール（SSHポートの一時開放）
- **何か**: デプロイ時だけ SSH ポート（22番）を開け、終わったら閉じるセキュリティパターン
- **なぜ必要か**: SSH を常時開放すると不正アクセスのリスクがある
- **仕組み**:
  1. ランナー（デプロイを実行するマシン）のパブリック IP を取得
  2. そのIPだけ SSH ポートを開放（`/32` = 1台のみ許可）
  3. `trap` コマンドで「成功・失敗に関わらず必ずポートを閉じる」を保証

---

### Unit テストと Feature テストの違い

| 種類 | DB 使用 | 何を検証するか |
|------|--------|--------------|
| Unit テスト | 使わない | モデルの設定値（fillable・casts など）が正しいか |
| Feature テスト | 使う | HTTP リクエストを投げて画面・DBへの影響を確認 |

---

### RefreshDatabase とは
- **何か**: テストのたびに DB をリセットするトレイト（機能の部品）
- **なぜ必要か**: テスト間でデータが残ると結果が干渉しあう。毎回クリーンな状態にすることで独立したテストになる

---

### ローカルは SQLite・CI は MySQL という設計
- **ローカル（SQLite）**: Docker を起動しなくても `php artisan test` がすぐ動く。開発スピードを優先
- **CI（MySQL）**: 本番と同じ DB エンジンで検証。SQLite と MySQL は挙動が異なる部分があるため、CI で本番環境に近い状態を確認する
- **メリット**: 「ローカルでは通ったのに本番で壊れた」を防げる

---

### Google OAuth のセキュリティメリット
- **何か**: Google アカウントでログインできる仕組み（OAuth = 認可の標準規格）
- **自前パスワード認証との違い**:

| 観点 | 自前パスワード | Google OAuth |
|------|--------------|-------------|
| パスワード保管 | 自前 DB に保存 | 不要（Google が管理） |
| 2段階認証 | 自前実装が必要 | Google が提供 |
| 不正ログイン検知 | 自前実装が必要 | Google が提供 |
| DB 漏洩リスク | パスワードが漏れる | パスワード自体がない |

---

## CI/CD のデプロイ流れ（`main.yml`）

```
1. ランナーの IP 取得（checkip.amazonaws.com）
2. npm run build（Google Maps API キーを Secrets から注入）
3. AWS 認証情報をセット
4. EC2 のセキュリティグループに SSH ポート(22)を一時開放
5. public/build ディレクトリを再作成・権限調整（SSH）
6. ビルドアセットを scp で EC2 に転送
7. SSH で EC2 に入り:
   ├ git pull origin main
   ├ docker compose up -d --build
   ├ 権限修正（www-data）
   ├ キャッシュクリア（optimize:clear → config/route/view:cache）
   └ コンテナ再起動
8. SSH ポートを閉じる（trap で必ず実行）
```

---

## テストの内容まとめ

### Unit テスト（DB 不使用）

| テストファイル | 何を確認するか |
|--------------|--------------|
| `UserModelTest` | fillable・hidden・casts・appends・RouteKeyName |
| `PostModelTest` | fillable・casts（trip_plan/photos が array）・is_liked 属性 |

### Feature テスト（実 HTTP リクエスト + DB 検証）

| テストファイル | 主な確認内容 |
|--------------|------------|
| `PostControllerTest` | ゲスト不可・認証済み投稿可・バリデーション・公開範囲変更・削除 |
| `FollowControllerTest` | フォロー・重複防止・アンフォロー・ゲスト不可・通知生成 |
| `CommentControllerTest` | コメント投稿・必須チェック・2000字上限・ゲスト不可 |
| `PostLikeControllerTest` | いいね・重複防止・解除・ゲスト不可・通知生成・自己いいね通知なし |

---

## なぜそう書くか（設計の理由）

- **test.yml と main.yml を分けた理由**: テストは PR のたびに動かすが、デプロイは main マージ時だけ。役割を分けることでトリガー条件を明確にできる
- **SSH ポートを常時開放しない理由**: セキュリティグループは最小権限が原則。常時開放はポートスキャンや総当たり攻撃の的になる
- **`trap` を使う理由**: SSH の接続エラーなど途中で失敗しても、必ずポートを閉じることを保証するため
- **Feature テストを MySQL で動かす理由**: 本番と同じエンジンで検証することで、SQLite との挙動差異に起因するバグを CI の段階で検出できる
- **自己いいね通知なしのテストがある理由**: 「自分の投稿にいいねしても通知が飛ばない」というビジネスルールを、コードだけでなくテストでも明示することで仕様漏れを防ぐ

---

## 次回への課題・疑問点

- [ ] `trap` コマンドの構文と使いどころをもう少し理解する
- [ ] CI の MySQL サービスコンテナの書き方（`services:` ブロック）を自分で書けるようにする
- [ ] OAuth の実装（Laravel Socialite）の流れを一度読んでみる
- [ ] Feature テストで `actingAs()` を使う意味（認証のモック）を深掘りする
