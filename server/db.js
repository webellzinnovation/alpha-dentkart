const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,       // e.g., 123.45.67.89 or mysql.hostinger.com
    user: process.env.DB_USER,       // e.g., u123456789_admin
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,   // e.g., u123456789_alphadent
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to promise-based (easier to use with async/await)
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.code, err.message);
    } else {
        console.log('✅ Connected to MySQL Database');
        connection.release();
    }
});

module.exports = promisePool;
