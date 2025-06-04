// src/config/database.js

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Створення пулу з'єднань
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL Connected successfully!');

        // Створення таблиць
        await createTables();

        connection.release();
    } catch (error) {
        console.error('MySQL connection error:', error);
        process.exit(1);
    }
};

const createTables = async () => {
    try {
        // Створення таблиці користувачів
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                                 email VARCHAR(255) NOT NULL UNIQUE,
                full_name VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                profile_pic TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
        `);

        console.log('Database tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
};

export { pool, connectDB };