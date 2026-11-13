require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true }, max: 5, connectionTimeoutMillis: 10000 });
function rewrite(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`).replace(/CURDATE\(\)/gi, 'CURRENT_DATE');
}
module.exports = {
  query: async (sql, params = []) => {
    const result = await pool.query(rewrite(sql), params);
    return [result.rows, result.fields];
  },
  end: () => pool.end(),
};
