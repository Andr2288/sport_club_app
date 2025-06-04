// src/models/client.model.js

import { pool } from "../config/database.js";

class Client {
    static async create(clientData) {
        const { firstName, lastName, email, phone, birthDate, gender, address } = clientData;

        const [result] = await pool.execute(
            'INSERT INTO clients (first_name, last_name, email, phone, birth_date, gender, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, email, phone, birthDate, gender, address]
        );

        return {
            clientId: result.insertId,
            firstName,
            lastName,
            email,
            phone,
            birthDate,
            gender,
            address
        };
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM clients WHERE email = ?',
            [email]
        );

        return rows[0] || null;
    }

    static async findById(clientId) {
        const [rows] = await pool.execute(
            'SELECT client_id as clientId, first_name as firstName, last_name as lastName, email, phone, birth_date as birthDate, gender, address, status, created_at, updated_at FROM clients WHERE client_id = ?',
            [clientId]
        );

        return rows[0] || null;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            'SELECT client_id as clientId, first_name as firstName, last_name as lastName, email, phone, birth_date as birthDate, gender, address, status, created_at, updated_at FROM clients ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        return rows;
    }

    static async updateById(clientId, updateData) {
        const { firstName, lastName, email, phone, birthDate, gender, address, status } = updateData;

        const fields = [];
        const values = [];

        if (firstName !== undefined) {
            fields.push('first_name = ?');
            values.push(firstName);
        }
        if (lastName !== undefined) {
            fields.push('last_name = ?');
            values.push(lastName);
        }
        if (email !== undefined) {
            fields.push('email = ?');
            values.push(email);
        }
        if (phone !== undefined) {
            fields.push('phone = ?');
            values.push(phone);
        }
        if (birthDate !== undefined) {
            fields.push('birth_date = ?');
            values.push(birthDate);
        }
        if (gender !== undefined) {
            fields.push('gender = ?');
            values.push(gender);
        }
        if (address !== undefined) {
            fields.push('address = ?');
            values.push(address);
        }
        if (status !== undefined) {
            fields.push('status = ?');
            values.push(status);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(clientId);

        await pool.execute(
            `UPDATE clients SET ${fields.join(', ')} WHERE client_id = ?`,
            values
        );

        return this.findById(clientId);
    }

    static async deleteById(clientId) {
        const [result] = await pool.execute(
            'DELETE FROM clients WHERE client_id = ?',
            [clientId]
        );

        return result.affectedRows > 0;
    }

    static async getActiveClients() {
        const [rows] = await pool.execute(
            'SELECT client_id as clientId, first_name as firstName, last_name as lastName, email, phone FROM clients WHERE status = "active" ORDER BY first_name, last_name'
        );

        return rows;
    }

    static async getClientMemberships(clientId) {
        const [rows] = await pool.execute(`
            SELECT 
                cm.id,
                cm.start_date as startDate,
                cm.end_date as endDate,
                cm.status,
                m.name as membershipName,
                m.description,
                m.price
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.membership_id
            WHERE cm.client_id = ?
            ORDER BY cm.created_at DESC
        `, [clientId]);

        return rows;
    }

    static async getClientSessions(clientId, limit = 20) {
        const [rows] = await pool.execute(`
            SELECT 
                s.session_id as sessionId,
                s.name,
                s.session_type as sessionType,
                s.start_time as startTime,
                s.end_time as endTime,
                s.room,
                sc.status,
                CONCAT(st.first_name, ' ', st.last_name) as trainerName
            FROM session_clients sc
            JOIN sessions s ON sc.session_id = s.session_id
            LEFT JOIN staff st ON s.trainer_id = st.staff_id
            WHERE sc.client_id = ?
            ORDER BY s.start_time DESC
            LIMIT ?
        `, [clientId, limit]);

        return rows;
    }
}

export default Client;