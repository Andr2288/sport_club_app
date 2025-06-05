// src/models/championship.model.js

import { pool } from "../config/database.js";

class Championship {
    static async create(championshipData) {
        const { name, date, location, description } = championshipData;

        const [result] = await pool.execute(
            'INSERT INTO championships (name, date, location, description) VALUES (?, ?, ?, ?)',
            [name, date, location, description || null]
        );

        return {
            championshipId: result.insertId,
            name,
            date,
            location,
            description
        };
    }

    static async findById(championshipId) {
        const [rows] = await pool.execute(
            'SELECT championship_id as championshipId, name, date, location, description, created_at, updated_at FROM championships WHERE championship_id = ?',
            [championshipId]
        );

        return rows[0] || null;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            'SELECT championship_id as championshipId, name, date, location, description, created_at FROM championships ORDER BY date DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        return rows;
    }

    static async findUpcoming() {
        const [rows] = await pool.execute(
            'SELECT championship_id as championshipId, name, date, location, description FROM championships WHERE date > CURDATE() ORDER BY date ASC'
        );

        return rows;
    }

    static async updateById(championshipId, updateData) {
        const { name, date, location, description } = updateData;

        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (date !== undefined) {
            fields.push('date = ?');
            values.push(date);
        }
        if (location !== undefined) {
            fields.push('location = ?');
            values.push(location);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(championshipId);

        await pool.execute(
            `UPDATE championships SET ${fields.join(', ')} WHERE championship_id = ?`,
            values
        );

        return this.findById(championshipId);
    }

    static async deleteById(championshipId) {
        const [result] = await pool.execute(
            'DELETE FROM championships WHERE championship_id = ?',
            [championshipId]
        );

        return result.affectedRows > 0;
    }
}

export default Championship;