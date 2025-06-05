// src/models/qualifications.model.js

import { pool } from "../config/database.js";

class Qualification {
    static async create(qualificationData) {
        const { name, issuingBody, validYears } = qualificationData;

        const [result] = await pool.execute(
            'INSERT INTO qualifications (name, issuing_body, valid_years) VALUES (?, ?, ?)',
            [name, issuingBody, validYears]
        );

        return {
            qualificationId: result.insertId,
            name,
            issuingBody,
            validYears
        };
    }

    static async findById(qualificationId) {
        const [rows] = await pool.execute(
            'SELECT qualification_id as qualificationId, name, issuing_body as issuingBody, valid_years as validYears, created_at, updated_at FROM qualifications WHERE qualification_id = ?',
            [qualificationId]
        );

        return rows[0] || null;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            'SELECT qualification_id as qualificationId, name, issuing_body as issuingBody, valid_years as validYears, created_at FROM qualifications ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        return rows;
    }

    static async updateById(qualificationId, updateData) {
        const { name, issuingBody, validYears } = updateData;

        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (issuingBody !== undefined) {
            fields.push('issuing_body = ?');
            values.push(issuingBody);
        }
        if (validYears !== undefined) {
            fields.push('valid_years = ?');
            values.push(validYears);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(qualificationId);

        await pool.execute(
            `UPDATE qualifications SET ${fields.join(', ')} WHERE qualification_id = ?`,
            values
        );

        return this.findById(qualificationId);
    }

    static async deleteById(qualificationId) {
        const [result] = await pool.execute(
            'DELETE FROM qualifications WHERE qualification_id = ?',
            [qualificationId]
        );

        return result.affectedRows > 0;
    }
}

export default Qualification;