import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbClient = process.env.DB_CLIENT || 'sqlite3';

let connection = {};

if (dbClient === 'sqlite3') {
  connection = {
    filename: process.env.DB_SQLITE_FILENAME || './dev.sqlite',
  };
} else {
  connection = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || (dbClient === 'pg' ? '5432' : '3306')),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbac_system',
  };
  
  if (dbClient === 'pg' && process.env.DB_SSL === 'true') {
    connection.ssl = { rejectUnauthorized: false };
  }
}

export default {
  client: dbClient === 'pg' ? 'pg' : (dbClient === 'mysql2' ? 'mysql2' : 'sqlite3'),
  connection,
  useNullAsDefault: dbClient === 'sqlite3',
  migrations: {
    directory: path.join(__dirname, 'src', 'db', 'migrations'),
  },
  seeds: {
    directory: path.join(__dirname, 'src', 'db', 'seeds'),
  },
};
