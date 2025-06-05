// src/models/session.model.js

import { pool } from "../config/database.js";

class Session {
    static async create(sessionData) {
        const { sessionType, name, description, startTime, endTime, room, maxCapacity, trainerId } = sessionData;

        const [result] = await pool.execute(
            'INSERT INTO sessions (session_type, name, description, start_time, end_time, room, max_capacity, trainer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [sessionType, name, description, startTime, endTime, room, maxCapacity, trainerId]
        );

        return {
            sessionId: result.insertId,
            sessionType,
            name,
            description,
            startTime,
            endTime,
            room,
            maxCapacity,
            trainerId
        };
    }

    static async findById(sessionId) {
        const [rows] = await pool.execute(`
SELECT
s.session_id as sessionId,
    s.session_type as sessionType,
    s.name,
    s.description,
    s.start_time as startTime,
    s.end_time as endTime,
    s.room,
    s.max_capacity as maxCapacity,
    s.trainer_id as trainerId,
    CONCAT(st.first_name, ' ', st.last_name) as trainerName,
    s.created_at,
    s.updated_at
FROM sessions s
LEFT JOIN staff st ON s.trainer_id = st.staff_id
WHERE s.session_id = ?
    `, [sessionId]);

        return rows[0] || null;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(`
    SELECT
s.session_id as sessionId,
    s.session_type as sessionType,
    s.name,
    s.description,
    s.start_time as startTime,
    s.end_time as endTime,
    s.room,
    s.max_capacity as maxCapacity,
    s.trainer_id as trainerId,
    CONCAT(st.first_name, ' ', st.last_name) as trainerName,
    COUNT(sc.client_id) as bookedClients
FROM sessions s
LEFT JOIN staff st ON s.trainer_id = st.staff_id
LEFT JOIN session_clients sc ON s.session_id = sc.session_id AND sc.status IN ('booked', 'attended')
GROUP BY s.session_id
ORDER BY s.start_time DESC
LIMIT ? OFFSET ?
        `, [limit, offset]);

        return rows;
    }

    static async findUpcoming(limit = 20) {
        const [rows] = await pool.execute(`
        SELECT
    s.session_id as sessionId,
    s.session_type as sessionType,
    s.name,
    s.start_time as startTime,
    s.end_time as endTime,
    s.room,
    s.max_capacity as maxCapacity,
    CONCAT(st.first_name, ' ', st.last_name) as trainerName,
    COUNT(sc.client_id) as bookedClients
FROM sessions s
LEFT JOIN staff st ON s.trainer_id = st.staff_id
LEFT JOIN session_clients sc ON s.session_id = sc.session_id AND sc.status IN ('booked', 'attended')
WHERE s.start_time > NOW()
GROUP BY s.session_id
ORDER BY s.start_time ASC
LIMIT ?
    `, [limit]);

        return rows;
    }

    static async findByTrainer(trainerId, limit = 20) {
        const [rows] = await pool.execute(`
    SELECT
s.session_id as sessionId,
    s.session_type as sessionType,
    s.name,
    s.start_time as startTime,
    s.end_time as endTime,
    s.room,
    s.max_capacity as maxCapacity,
    COUNT(sc.client_id) as bookedClients
FROM sessions s
LEFT JOIN session_clients sc ON s.session_id = sc.session_id AND sc.status IN ('booked', 'attended')
WHERE s.trainer_id = ?
    GROUP BY s.session_id
ORDER BY s.start_time DESC
LIMIT ?
    `, [trainerId, limit]);

        return rows;
    }

    static async updateById(sessionId, updateData) {
        const { sessionType, name, description, startTime, endTime, room, maxCapacity, trainerId } = updateData;

        const fields = [];
        const values = [];

        if (sessionType !== undefined) {
            fields.push('session_type = ?');
            values.push(sessionType);
        }
        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description);
        }
        if (startTime !== undefined) {
            fields.push('start_time = ?');
            values.push(startTime);
        }
        if (endTime !== undefined) {
            fields.push('end_time = ?');
            values.push(endTime);
        }
        if (room !== undefined) {
            fields.push('room = ?');
            values.push(room);
        }
        if (maxCapacity !== undefined) {
            fields.push('max_capacity = ?');
            values.push(maxCapacity);
        }
        if (trainerId !== undefined) {
            fields.push('trainer_id = ?');
            values.push(trainerId);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(sessionId);

        await pool.execute(
            `UPDATE sessions SET ${fields.join(', ')} WHERE session_id = ?`,
            values
        );

        return this.findById(sessionId);
    }

    static async deleteById(sessionId) {
        const [result] = await pool.execute(
            'DELETE FROM sessions WHERE session_id = ?',
            [sessionId]
        );

        return result.affectedRows > 0;
    }

    static async bookClient(sessionId, clientId) {
        const session = await this.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const [bookedCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM session_clients WHERE session_id = ? AND status IN ("booked", "attended")',
            [sessionId]
        );

        if (bookedCount[0].count >= session.maxCapacity) {
            throw new Error('Session is full');
        }

        const [existingBooking] = await pool.execute(
            'SELECT * FROM session_clients WHERE session_id = ? AND client_id = ?',
            [sessionId, clientId]
        );

        if (existingBooking.length > 0) {
            throw new Error('Client already booked for this session');
        }

        const [result] = await pool.execute(
            'INSERT INTO session_clients (session_id, client_id, status) VALUES (?, ?, "booked")',
            [sessionId, clientId]
        );

        return {
            id: result.insertId,
            sessionId,
            clientId,
            status: 'booked'
        };
    }

    static async cancelBooking(sessionId, clientId) {
        const [result] = await pool.execute(
            'UPDATE session_clients SET status = "cancelled" WHERE session_id = ? AND client_id = ?',
            [sessionId, clientId]
        );

        return result.affectedRows > 0;
    }

    static async markAttendance(sessionId, clientId, status = 'attended') {
        const [result] = await pool.execute(
            'UPDATE session_clients SET status = ? WHERE session_id = ? AND client_id = ?',
            [status, sessionId, clientId]
        );

        return result.affectedRows > 0;
    }

    static async getSessionClients(sessionId) {
        const [rows] = await pool.execute(`
    SELECT
sc.id,
    sc.client_id as clientId,
    CONCAT(c.first_name, ' ', c.last_name) as clientName,
    c.email,
    c.phone,
    sc.status,
    sc.created_at as bookedAt
FROM session_clients sc
JOIN clients c ON sc.client_id = c.client_id
WHERE sc.session_id = ?
    ORDER BY sc.created_at ASC
    `, [sessionId]);

        return rows;
    }

    static async getSessionStats() {
        const [stats] = await pool.execute(`
SELECT
COUNT(*) as totalSessions,
    COUNT(CASE WHEN start_time > NOW() THEN 1 END) as upcomingSessions,
    COUNT(CASE WHEN start_time < NOW() THEN 1 END) as completedSessions,
    AVG(max_capacity) as averageCapacity
FROM sessions
    `);

        return stats[0] || {
            totalSessions: 0,
            upcomingSessions: 0,
            completedSessions: 0,
            averageCapacity: 0
        };
    }

    static async getAvailableSessions(date = null) {
        let query = `
SELECT
s.session_id as sessionId,
    s.session_type as sessionType,
    s.name,
    s.start_time as startTime,
    s.end_time as endTime,
    s.room,
    s.max_capacity as maxCapacity,
    CONCAT(st.first_name, ' ', st.last_name) as trainerName,
    COUNT(sc.client_id) as bookedClients,
    (s.max_capacity - COUNT(sc.client_id)) as availableSpots
FROM sessions s
LEFT JOIN staff st ON s.trainer_id = st.staff_id
LEFT JOIN session_clients sc ON s.session_id = sc.session_id AND sc.status IN ('booked', 'attended')
WHERE s.start_time > NOW()
    `;

        const params = [];

        if (date) {
            query += ' AND DATE(s.start_time) = ?';
            params.push(date);
        }

        query += `
GROUP BY s.session_id
HAVING availableSpots > 0
ORDER BY s.start_time ASC
    `;

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async getAverageDurationByType() {
        const [rows] = await pool.execute(
            `SELECT
session_type as sessionType,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, start_time, end_time)), 2) AS avgDurationMinutes
FROM sessions
GROUP BY session_type`
        );

        return rows;
    }

    static async getAverageGroupSize() {
        const [stats] = await pool.execute(`
SELECT
AVG(group_size) AS avgGroupSize
FROM (
    SELECT
s.session_id,
    COUNT(sc.client_id) AS group_size
FROM sessions s
JOIN session_clients sc ON sc.session_id = s.session_id
WHERE s.session_type = 'group'
GROUP BY s.session_id
) AS grouped
    `);

        return stats[0] || { avgGroupSize: 0 };
    }
}

export default Session;
