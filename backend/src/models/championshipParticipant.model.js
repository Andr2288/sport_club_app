// src/models/championshipParticipant.model.js

import { pool } from "../config/database.js";

class ChampionshipParticipant {
    static async create(participantData) {
        const { championshipId, clientId, result, score } = participantData;

        const [resultRow] = await pool.execute(
            'INSERT INTO championship_participants (championship_id, client_id, result, score) VALUES (?, ?, ?, ?)',
            [championshipId, clientId, result || null, score || null]
        );

        return {
            id: resultRow.insertId,
            championshipId,
            clientId,
            result,
            score
        };
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            `SELECT 
                cp.id,
                cp.championship_id as championshipId,
                ch.name as championshipName,
                cp.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                cp.result,
                cp.score,
                cp.created_at,
                cp.updated_at
            FROM championship_participants cp
            JOIN championships ch ON cp.championship_id = ch.championship_id
            JOIN clients c ON cp.client_id = c.client_id
            WHERE cp.id = ?`,
            [id]
        );

        return rows[0] || null;
    }

    static async findByChampionship(championshipId, limit = 50) {
        const [rows] = await pool.execute(
            `SELECT 
                cp.id,
                cp.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                cp.result,
                cp.score,
                cp.created_at
            FROM championship_participants cp
            JOIN clients c ON cp.client_id = c.client_id
            WHERE cp.championship_id = ?
            ORDER BY cp.score DESC, cp.created_at ASC
            LIMIT ?`,
            [championshipId, limit]
        );

        return rows;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            `SELECT 
                cp.id,
                cp.championship_id as championshipId,
                ch.name as championshipName,
                cp.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                cp.result,
                cp.score,
                cp.created_at
            FROM championship_participants cp
            JOIN championships ch ON cp.championship_id = ch.championship_id
            JOIN clients c ON cp.client_id = c.client_id
            ORDER BY cp.created_at DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows;
    }

    static async updateById(id, updateData) {
        const { result, score } = updateData;

        const fields = [];
        const values = [];

        if (result !== undefined) {
            fields.push('result = ?');
            values.push(result);
        }
        if (score !== undefined) {
            fields.push('score = ?');
            values.push(score);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);

        await pool.execute(
            `UPDATE championship_participants SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async deleteById(id) {
        const [result] = await pool.execute(
            'DELETE FROM championship_participants WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }
}

export default ChampionshipParticipant;