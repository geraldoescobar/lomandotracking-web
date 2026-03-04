import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Admin.159753',
  database: 'lomando_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
