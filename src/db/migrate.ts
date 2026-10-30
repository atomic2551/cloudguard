import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  console.log(`🔌 Connecting to PostgreSQL at ${databaseUrl.replace(/:[^:@]+@/, ':****@')}...`);

  // Parse database name from URL
  const url = new URL(databaseUrl);
  const dbName = url.pathname.slice(1) || 'cloudguard_db';
  
  // Connection URL to default 'postgres' database to ensure cloudguard_db exists
  url.pathname = '/postgres';
  const defaultClient = new Client({ connectionString: url.toString() });

  try {
    await defaultClient.connect();
    const res = await defaultClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`📦 Creating database "${dbName}"...`);
      await defaultClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created.`);
    } else {
      console.log(`✅ Database "${dbName}" exists.`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Warning during database existence check: ${err.message}`);
  } finally {
    await defaultClient.end();
  }

  // Connect to target database and execute V1__init.sql
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const sqlPath = path.join(process.cwd(), 'src', 'db', 'migrations', 'V1__init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executing Flyway V1__init.sql schema authority migration...');
    await client.query(sqlContent);
    console.log('🎉 Migration V1__init.sql executed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
