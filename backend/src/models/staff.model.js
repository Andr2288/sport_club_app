// src/models/staff.model.js

import { pool } from "../config/database.js";

class Staff {
    static async create(staffData) {
        const { firstName, lastName, role, email, phone, hireDate } = staffData;

        const [result] = await pool.execute(
            'INSERT INTO staff (first_name, last_name, role, email, phone, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, lastName, role, email, phone, hireDate]
        );

        return {
            staffId: result.insertId,
            firstName,
            lastName,
            role,
            email,
            phone,
            hireDate
        };
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM staff WHERE email = ?',
            [email]
        );

        return rows[0] || null;
    }

    static async findById(staffId) {
        const [rows] = await pool.execute(
            'SELECT staff_id as staffId, first_name as firstName, last_name as lastName, role, email, phone, hire_date as hireDate, is_active as isActive, created_at, updated_at FROM staff WHERE staff_id = ?',
            [staffId]
        );

        return rows[0] || null;
    }

    static async findAll() {
        const [rows] = await pool.execute(
            'SELECT staff_id as staffId, first_name as firstName, last_name as lastName, role, email, phone, hire_date as hireDate, is_active as isActive, created_at, updated_at FROM staff ORDER BY first_name, last_name'
        );

        return rows;
    }

    static async findByRole(role) {
        const [rows] = await pool.execute(
            'SELECT staff_id as staffId, first_name as firstName, last_name as lastName, role, email, phone, hire_date as hireDate, is_active as isActive FROM staff WHERE role = ? AND is_active = TRUE ORDER BY first_name, last_name',
            [role]
        );

        return rows;
    }

    static async getActiveTrainers() {
        return this.findByRole('trainer');
    }

    static async updateById(staffId, updateData) {
        const { firstName, lastName, role, email, phone, hireDate, isActive } = updateData;

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
        if (role !== undefined) {
            fields.push('role = ?');
            values.push(role);
        }
        if (email !== undefined) {
            fields.push('email = ?');
            values.push(email);
        }
        if (phone !== undefined) {
            fields.push('phone = ?');
            values.push(phone);
        }
        if (hireDate !== undefined) {
            fields.push('hire_date = ?');
            values.push(hireDate);
        }
        if (isActive !== undefined) {
            fields.push('is_active = ?');
            values.push(isActive);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(staffId);

        await pool.execute(
            `UPDATE staff SET ${fields.join(', ')} WHERE staff_id = ?`,
            values
        );

        return this.findById(staffId);
    }

    static async deleteById(staffId) {
        const [result] = await pool.execute(
            'DELETE FROM staff WHERE staff_id = ?',
            [staffId]
        );

        return result.affectedRows > 0;
    }

    static async getTrainerStats(trainerId) {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT sc.client_id) as totalClients,
                COUNT(s.session_id) as totalSessions,
                AVG(r.rating) as averageRating,
                COUNT(r.review_id) as totalReviews
            FROM staff st
            LEFT JOIN sessions s ON st.staff_id = s.trainer_id
            LEFT JOIN session_clients sc ON s.session_id = sc.session_id AND sc.status = 'attended'
            LEFT JOIN reviews r ON st.staff_id = r.staff_id
            WHERE st.staff_id = ? AND st.role = 'trainer'
            GROUP BY st.staff_id
        `, [trainerId]);

        return stats[0] || {
            totalClients: 0,
            totalSessions: 0,
            averageRating: 0,
            totalReviews: 0
        };
    }

    static async getTopTrainers(limit = 5) {
        const [rows] = await pool.execute(`
            SELECT 
                s.staff_id as staffId,
                s.first_name as firstName,
                s.last_name as lastName,
                COUNT(DISTINCT sc.client_id) as clientCount,
                ROUND(AVG(r.rating), 2) as avgRating,
                COUNT(r.review_id) as reviewCount
            FROM staff s
            LEFT JOIN sessions sess ON s.staff_id = sess.trainer_id
            LEFT JOIN session_clients sc ON sess.session_id = sc.session_id AND sc.status = 'attended'
            LEFT JOIN reviews r ON s.staff_id = r.staff_id
            WHERE s.role = 'trainer' AND s.is_active = TRUE
            GROUP BY s.staff_id
            ORDER BY clientCount DESC, avgRating DESC
            LIMIT ?
        `, [limit]);

        return rows;
    }

    static async getTrainerSessions(trainerId, limit = 20) {
        const [rows] = await pool.execute(`
            SELECT 
                s.session_id as sessionId,
                s.name,
                s.session_type as sessionType,
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
}

export default Staff;