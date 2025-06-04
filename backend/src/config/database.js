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
        // Створення таблиці користувачів (вже існує)
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

        // Створення таблиці клієнтів
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS clients (
                client_id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20),
                birth_date DATE,
                gender ENUM('male', 'female', 'other'),
                address TEXT,
                status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Створення таблиці абонементів
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS memberships (
                membership_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                description TEXT,
                duration_days INT,
                price DECIMAL(10,2),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Створення таблиці клієнт-абонементи
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS client_memberships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                client_id INT,
                membership_id INT,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
                FOREIGN KEY (membership_id) REFERENCES memberships(membership_id) ON DELETE CASCADE
            )
        `);

        // Створення таблиці персоналу
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS staff (
                staff_id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                role ENUM('trainer', 'assistant'),
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20),
                hire_date DATE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Створення таблиці сесій/тренувань
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS sessions (
                session_id INT AUTO_INCREMENT PRIMARY KEY,
                session_type ENUM('group', 'personal', 'solo'),
                name VARCHAR(100),
                description TEXT,
                start_time DATETIME,
                end_time DATETIME,
                room VARCHAR(50),
                max_capacity INT,
                trainer_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES staff(staff_id) ON DELETE SET NULL
            )
        `);

        // Створення таблиці сесії-клієнти
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS session_clients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT,
                client_id INT,
                status ENUM('booked', 'attended', 'missed', 'cancelled') DEFAULT 'booked',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
            )
        `);

        // Створення таблиці відгуків
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
                review_id INT AUTO_INCREMENT PRIMARY KEY,
                client_id INT,
                staff_id INT,
                rating INT CHECK (rating BETWEEN 1 AND 5),
                comment TEXT,
                review_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
                FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
            )
        `);

        // Створення таблиці платежів
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                payment_id INT AUTO_INCREMENT PRIMARY KEY,
                client_id INT,
                amount DECIMAL(10,2),
                payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                payment_method ENUM('card', 'cash', 'transfer'),
                purpose ENUM('membership', 'session', 'championship'),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
            )
        `);

        // Створення таблиці зарплат
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS salaries (
                salary_id INT AUTO_INCREMENT PRIMARY KEY,
                staff_id INT,
                amount DECIMAL(10,2),
                month YEAR,
                paid_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
            )
        `);

        // Створення таблиці чемпіонатів
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS championships (
                championship_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100),
                date DATE,
                location VARCHAR(100),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Створення таблиці учасників чемпіонатів
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS championship_participants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                championship_id INT,
                client_id INT,
                result VARCHAR(100),
                score INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (championship_id) REFERENCES championships(championship_id) ON DELETE CASCADE,
                FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
            )
        `);

        console.log('Database tables created successfully!');

        // Додаємо початкові дані якщо таблиці порожні
        await insertInitialData();

    } catch (error) {
        console.error('Error creating tables:', error);
    }
};

const insertInitialData = async () => {
    try {
        // Перевіряємо чи є дані в таблиці абонементів
        const [memberships] = await pool.execute('SELECT COUNT(*) as count FROM memberships');

        if (memberships[0].count === 0) {
            // Додаємо початкові абонементи
            await pool.execute(`
                INSERT INTO memberships (name, description, duration_days, price, is_active) VALUES
                ('Базовий', 'Доступ до тренажерного залу', 30, 500.00, TRUE),
                ('Стандартний', 'Тренажерний зал + групові заняття', 30, 800.00, TRUE),
                ('Преміум', 'Повний доступ + персональні тренування', 30, 1200.00, TRUE),
                ('Річний базовий', 'Базовий доступ на рік', 365, 5000.00, TRUE)
            `);
            console.log('Initial memberships added');
        }

        // Перевіряємо чи є персонал
        const [staff] = await pool.execute('SELECT COUNT(*) as count FROM staff');

        if (staff[0].count === 0) {
            // Додаємо початковий персонал
            await pool.execute(`
                INSERT INTO staff (first_name, last_name, role, email, phone, hire_date, is_active) VALUES
                ('Олександр', 'Петренко', 'trainer', 'alex.petrenko@sportclub.com', '+380501234567', '2023-01-15', TRUE),
                ('Марія', 'Іваненко', 'trainer', 'maria.ivanenko@sportclub.com', '+380502345678', '2023-02-20', TRUE),
                ('Андрій', 'Сидоренко', 'trainer', 'andrii.sydorenko@sportclub.com', '+380503456789', '2023-03-10', TRUE),
                ('Катерина', 'Мельник', 'assistant', 'kate.melnyk@sportclub.com', '+380504567890', '2023-04-05', TRUE)
            `);
            console.log('Initial staff added');
        }

        // Перевіряємо чи є клієнти
        const [clients] = await pool.execute('SELECT COUNT(*) as count FROM clients');

        if (clients[0].count === 0) {
            // Додаємо тестових клієнтів
            await pool.execute(`
                INSERT INTO clients (first_name, last_name, email, phone, birth_date, gender, address, status) VALUES
                ('Іван', 'Коваленко', 'ivan.kovalenko@example.com', '+380671234567', '1990-05-15', 'male', 'вул. Хрещатик, 1, Київ', 'active'),
                ('Олена', 'Шевченко', 'olena.shevchenko@example.com', '+380672345678', '1985-08-22', 'female', 'вул. Льва Толстого, 5, Київ', 'active'),
                ('Максим', 'Лисенко', 'maxim.lysenko@example.com', '+380673456789', '1992-12-03', 'male', 'просп. Перемоги, 25, Київ', 'active')
            `);
            console.log('Initial clients added');
        }

    } catch (error) {
        console.error('Error inserting initial data:', error);
    }
};

export { pool, connectDB };