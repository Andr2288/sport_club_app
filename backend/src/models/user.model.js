// src/models/user.model.js

import { pool } from "../config/database.js";

class User {
    static async create(userData) {
        const { fullName, email, password, profilePic = '' } = userData;

        const [result] = await pool.execute(
            'INSERT INTO users (full_name, email, password, profile_pic) VALUES (?, ?, ?, ?)',
            [fullName, email, password, profilePic]
        );

        return { id: result.insertId, fullName, email, profilePic };
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, full_name as fullName, email, profile_pic as profilePic, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );

        return rows[0] || null;
    }

    static async findAll(excludeId = null) {
        let query = 'SELECT id, full_name as fullName, email, profile_pic as profilePic FROM users';
        let params = [];

        if (excludeId) {
            query += ' WHERE id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async updateById(id, updateData) {
        const { profilePic } = updateData;

        await pool.execute(
            'UPDATE users SET profile_pic = ? WHERE id = ?',
            [profilePic, id]
        );

        return this.findById(id);
    }
}

export default User;