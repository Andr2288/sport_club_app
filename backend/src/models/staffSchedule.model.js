// src/models/staffSchedule.model.js

import { pool } from "../config/database.js";

class StaffSchedule {
    static async create(scheduleData) {
        const { staffId, weekday, startTime, endTime } = scheduleData;

        const [result] = await pool.execute(
            'INSERT INTO staff_schedule (staff_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)',
            [staffId, weekday, startTime, endTime]
        );

        return {
            scheduleId: result.insertId,
            staffId,
            weekday,
            startTime,
            endTime
        };
    }

    static async findById(scheduleId) {
        const [rows] = await pool.execute(
            `SELECT 
                schedule_id as scheduleId,
                staff_id as staffId,
                CONCAT(s.first_name, ' ', s.last_name) as staffName,
                weekday,
                start_time as startTime,
                end_time as endTime,
                created_at,
                updated_at
            FROM staff_schedule
            JOIN staff s ON staff_schedule.staff_id = s.staff_id
            WHERE schedule_id = ?`,
            [scheduleId]
        );

        return rows[0] || null;
    }

    static async findByStaff(staffId, limit = 20) {
        const [rows] = await pool.execute(
            `SELECT 
                schedule_id as scheduleId,
                weekday,
                start_time as startTime,
                end_time as endTime,
                created_at
            FROM staff_schedule
            WHERE staff_id = ?
            ORDER BY FIELD(weekday, 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')
            LIMIT ?`,
            [staffId, limit]
        );

        return rows;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            `SELECT
                 schedule_id as scheduleId,
                 ss.staff_id as staffId,
                 CONCAT(s.first_name, ' ', s.last_name) as staffName,
                 weekday,
                 start_time as startTime,
                 end_time as endTime,
                 ss.created_at
             FROM staff_schedule ss
                      JOIN staff s ON ss.staff_id = s.staff_id
             ORDER BY ss.created_at DESC
                 LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows;
    }

    static async updateById(scheduleId, updateData) {
        const { weekday, startTime, endTime } = updateData;

        const fields = [];
        const values = [];

        if (weekday !== undefined) {
            fields.push('weekday = ?');
            values.push(weekday);
        }
        if (startTime !== undefined) {
            fields.push('start_time = ?');
            values.push(startTime);
        }
        if (endTime !== undefined) {
            fields.push('end_time = ?');
            values.push(endTime);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(scheduleId);

        await pool.execute(
            `UPDATE staff_schedule SET ${fields.join(', ')} WHERE schedule_id = ?`,
            values
        );

        return this.findById(scheduleId);
    }

    static async deleteById(scheduleId) {
        const [result] = await pool.execute(
            'DELETE FROM staff_schedule WHERE schedule_id = ?',
            [scheduleId]
        );

        return result.affectedRows > 0;
    }
}

export default StaffSchedule;