// INFRASTRUCTURE: підключення до Postgres.
const { Pool } = require('pg');

class Database {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString });
  }

  query(text, params) {
    return this.pool.query(text, params);
  }

  async ping() {
    await this.pool.query('SELECT 1');
  }
}

module.exports = { Database };
