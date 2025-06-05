// src/models/progress.model.js

import { pool } from "../config/database.js";

class Progress {
    static async create(progressData) {
        const { clientId, sessionId, date, notes, metrics } = progressData;

        const [result] = await pool.execute(
            'INSERT INTO progress (client_id, session_id, date, notes, metrics) VALUES (?, ?, ?, ?, ?)',
            [clientId, sessionId, date, notes || null, JSON.stringify(metrics) || null]
        );

        return {
            progressId: result.insertId,
            clientId,
            sessionId,
            date,
            notes,
            metrics
        };
    }

    static async findById(progressId) {
        const [rows] = await pool.execute(
            `SELECT 
                p.progress_id as progressId,
                p.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                p.session_id as sessionId,
                s.name as sessionName,
                p.date,
                p.notes,
                p.metrics,
                p.created_at,
                p.updated_at
            FROM progress p
            JOIN clients c ON p.client_id = c.client_id
            LEFT JOIN sessions s ON p.session_id = s.session_id
            WHERE p.progress_id = ?`,
            [progressId]
        );

        if (rows[0] && rows[0].metrics) {
            rows[0].metrics = JSON.parse(rows[0].metrics);
        }

        return rows[0] || null;
    }

    static async findByClient(clientId, limit = 20) {
        const [rows] = await pool.execute(
            `SELECT 
                p.progress_id as progressId,
                p.session_id as sessionId,
                s.name as sessionName,
                p.date,
                p.notes,
                p.metrics,
                p.created_at
            FROM progress p
            LEFT JOIN sessions s ON p.session_id = s.session_id
            WHERE p.client_id = ?
            ORDER BY p.date DESC
            LIMIT ?`,
            [clientId, limit]
        );

        return rows.map(row => ({
            ...row,
            metrics: row.metrics ? JSON.parse(row.metrics) : null
        }));
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            `SELECT 
                p.progress_id as progressId,
                p.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                p.session_id as sessionId,
                s.name as sessionName,
                p.date,
                p.notes,
                p.metrics,
                p.created_at
            FROM progress p
            JOIN clients c ON p.client_id = c.client_id
            LEFT JOIN sessions s ON p.session_id = s.session_id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows.map(row => ({
            ...row,
            metrics: row.metrics ? JSON.parse(row.metrics) : null
        }));
    }

    static async updateById(progressId, updateData) {
        const { date, notes, metrics } = updateData;

        const fields = [];
        const values = [];

        if (date !== undefined) {
            fields.push('date = ?');
            values.push(date);
        }
        if (notes !== undefined) {
            fields.push('notes = ?');
            values.push(notes);
        }
        if (metrics !== undefined) {
            fields.push('metrics = ?');
            values.push(JSON.stringify(metrics));
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(progressId);

        await pool.execute(
            `UPDATE progress SET ${fields.join(', ')} WHERE progress_id = ?`,
            values
        );

        return this.findById(progressId);
    }

    static async deleteById(progressId) {
        const [result] = await pool.execute(
            'DELETE FROM progress WHERE progress_id = ?',
            [progressId]
        );

        return result.affectedRows > 0;
    }
}

export default Progress;