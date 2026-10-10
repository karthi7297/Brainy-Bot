/**
 * Creates the database and all tables from sql/schema.sql.
 *
 *   npm run db:init
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env';

async function main(): Promise<void> {
  const schemaPath = path.resolve(__dirname, '../sql/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log(`Connecting to MySQL ${env.DB_HOST}:${env.DB_PORT} as ${env.DB_USER} ...`);
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log(`Ensuring database "${env.DB_NAME}" exists ...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\`
         DEFAULT CHARACTER SET utf8mb4
         DEFAULT COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${env.DB_NAME}\``);

    console.log('Executing sql/schema.sql ...');
    await connection.query(schema);
    console.log(`Database "${env.DB_NAME}" and all tables are ready.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Failed to initialize database:', error.message ?? error);
  process.exit(1);
});