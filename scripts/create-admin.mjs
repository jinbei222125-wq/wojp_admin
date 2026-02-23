import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { admins } from '../drizzle/schema.js';

dotenv.config();

const ADMIN_EMAIL = 'jinbei.222125@gmail.com';
const ADMIN_PASSWORD = 'test01';
const ADMIN_NAME = '管理者';

async function createAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL が設定されていません');
    console.log('環境変数 DATABASE_URL を設定してから再実行してください');
    process.exit(1);
  }

  console.log('🔐 パスワードをハッシュ化中...');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  
  console.log('📡 データベースに接続中...');
  const client = createClient({
    url: databaseUrl,
    authToken: authToken,
  });
  const db = drizzle(client);
  
  try {
    // 既存のアカウントをチェック
    const existing = await db.select().from(admins).where(eq(admins.email, ADMIN_EMAIL)).limit(1);
    
    if (existing.length > 0) {
      console.log('⚠️  このメールアドレスの管理者は既に存在します');
      console.log('   既存のアカウントを更新します...');
      
      await db.update(admins)
        .set({
          passwordHash,
          name: ADMIN_NAME,
          updatedAt: new Date(),
        })
        .where(eq(admins.email, ADMIN_EMAIL));
      
      console.log('✅ 管理者アカウントを更新しました');
    } else {
      await db.insert(admins).values({
        email: ADMIN_EMAIL,
        passwordHash,
        name: ADMIN_NAME,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ 管理者アカウントを作成しました');
    }
    
    console.log('');
    console.log('📧 メールアドレス:', ADMIN_EMAIL);
    console.log('🔑 パスワード:', ADMIN_PASSWORD);
    console.log('');
    console.log('上記の認証情報でログインできます');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    
    if (error.message?.includes('no such table')) {
      console.log('');
      console.log('admins テーブルが存在しません。');
      console.log('データベースマイグレーションを実行してください: pnpm db:push');
    }
    
    process.exit(1);
  }
}

createAdmin();
