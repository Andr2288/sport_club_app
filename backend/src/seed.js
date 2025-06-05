import 'dotenv/config';
import mysql from 'mysql2/promise';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

async function seedDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        const sql = await fs.readFile(join(__dirname, '02_seed_data.sql'), 'utf8');
        await connection.query(sql, { multipleStatements: true });
        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await connection.end();
    }
}

seedDatabase();