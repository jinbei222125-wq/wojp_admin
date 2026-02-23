# W.O.JP 管理画面 セットアップガイド

このドキュメントは、W.O.JP管理画面のセットアップ手順を説明します。

## 前提条件

このプロジェクトは**wojp-corporateプロジェクトと同じデータベースを共有**する設計です。

## 必要な環境変数

以下の環境変数を設定する必要があります：

### 1. DATABASE_URL

wojp-corporateプロジェクトと**同一のDATABASE_URL**を設定してください。

```
DATABASE_URL=mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}
```

**重要**: wojp-corporateプロジェクトのDATABASE_URLをそのままコピーしてください。

### 2. JWT_SECRET

wojp-corporateプロジェクトと**同一のJWT_SECRET**を設定してください。

```
JWT_SECRET=your-secret-key-here
```

**重要**: wojp-corporateプロジェクトのJWT_SECRETをそのままコピーしてください。これにより、両プロジェクト間でセッション管理が統一されます。

## データベーススキーマ

このプロジェクトでは以下のテーブルが必要です：

- `admins`: 管理者ユーザー
- `news`: NEWS記事
- `jobs`: 求人情報
- `auditLogs`: 監査ログ

**重要**: データベースマイグレーションは**実行しないでください**。スキーマ管理はwojp-corporate側に集約されています。

wojp-corporate側で以下のマイグレーションを実行してください：

```sql
-- adminsテーブル
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  name TEXT NOT NULL,
  role ENUM('admin', 'super_admin') DEFAULT 'admin' NOT NULL,
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP NULL
);

-- newsテーブル
CREATE TABLE news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  thumbnailUrl VARCHAR(512),
  isPublished BOOLEAN DEFAULT FALSE NOT NULL,
  publishedAt TIMESTAMP NULL,
  authorId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- jobsテーブル
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  requirements TEXT,
  location VARCHAR(255),
  employmentType ENUM('full_time', 'part_time', 'contract', 'internship') NOT NULL,
  salaryRange VARCHAR(255),
  isPublished BOOLEAN DEFAULT FALSE NOT NULL,
  publishedAt TIMESTAMP NULL,
  closingDate TIMESTAMP NULL,
  authorId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- auditLogsテーブル
CREATE TABLE auditLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId INT NOT NULL,
  adminEmail VARCHAR(320) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resourceType VARCHAR(50) NOT NULL,
  resourceId INT,
  details TEXT,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

## 初期管理者アカウントの作成

初回セットアップ時に、管理者アカウントを作成する必要があります。

### 方法1: APIエンドポイントを使用（開発環境のみ）

開発環境では、`/api/admin/auth.createAdmin`エンドポイントを使用して管理者を作成できます。

```typescript
// ブラウザのコンソールまたはAPIクライアントから実行
fetch('/api/admin/auth.createAdmin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'your-secure-password',
    name: '管理者名',
    role: 'admin'
  })
});
```

### 方法2: データベースに直接挿入

パスワードをハッシュ化してから、データベースに直接挿入することもできます。

```javascript
// Node.jsスクリプトで実行
import bcrypt from 'bcryptjs';

const password = 'your-secure-password';
const hash = await bcrypt.hash(password, 10);
console.log('Password hash:', hash);

// このハッシュをadminsテーブルに挿入
```

```sql
INSERT INTO admins (email, passwordHash, name, role, isActive)
VALUES ('admin@example.com', 'hashed-password-here', '管理者名', 'admin', TRUE);
```

## 本番環境での注意事項

1. **セキュリティ**: 本番環境では`createAdmin`エンドポイントを無効化するか、アクセス制限を設けることを推奨します。

2. **DATABASE_URLとJWT_SECRET**: 必ずwojp-corporateと同じ値を使用してください。異なる値を使用すると、データの整合性が失われます。

3. **HTTPS**: 本番環境では必ずHTTPSを使用してください。

4. **環境変数の管理**: 環境変数は`.env`ファイルではなく、Manusの環境変数設定機能を使用して管理してください。

## ログイン

管理画面にアクセスすると、ログインページが表示されます。作成した管理者アカウントのメールアドレスとパスワードでログインしてください。

ログイン後、以下の機能が利用できます：

- **ダッシュボード**: 全体の統計情報と最近の操作履歴
- **NEWS記事管理**: NEWS記事のCRUD操作と公開/非公開切り替え
- **求人情報管理**: 求人情報のCRUD操作と公開/非公開切り替え
- **監査ログ**: 管理者の操作履歴の確認

## トラブルシューティング

### データベース接続エラー

- DATABASE_URLが正しく設定されているか確認してください
- wojp-corporateと同じDATABASE_URLを使用しているか確認してください
- データベースサーバーが起動しているか確認してください

### ログインできない

- 管理者アカウントが作成されているか確認してください
- メールアドレスとパスワードが正しいか確認してください
- JWT_SECRETが正しく設定されているか確認してください

### テーブルが存在しない

- wojp-corporate側でマイグレーションが実行されているか確認してください
- このプロジェクト側では`pnpm db:push`を実行しないでください
