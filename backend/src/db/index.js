import knex from 'knex';
import config from '../../knexfile.js';

const db = knex(config);

// Enable SQLite foreign key constraints explicitly
if (config.client === 'sqlite3') {
  db.raw('PRAGMA foreign_keys = ON;')
    .then(() => {
      console.log('Database: SQLite Foreign Key Constraints Enabled.');
    })
    .catch((err) => {
      console.error('Database: Error enabling SQLite foreign keys:', err);
    });
} else {
  console.log(`Database: Connected via ${config.client}`);
}

export default db;
