// src/models/staffQualifications.model.js

import { pool } from "../config/database.js";

class StaffQualification {
    static async create(staffQualificationData) {
        const { staffId, qualificationId, issueDate } = staffQualificationData;

        const [result] = await pool.execute(
            'INSERT INTO staff_qualifications (staff_id, qualification_id, issue_date) VALUES (?, ?, ?)',
            [staffId, qualificationId, issueDate]
        );

        return {
            id: result.insertId,
            staffId,
            qualificationId,
            issueDate
        };
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            `SELECT 
                sq.id,
                sq.staff_id as staffId,
                CONCAT(s.first_name, ' ', s.last_name) as staffName,
                sq.qualification_id as qualificationId,
                q.name as qualificationName,
                sq.issue_date as issueDate,
                sq.created_at,
                sq.updated_at
            FROM staff_qualifications sq
            JOIN staff s ON sq.staff_id = s.staff_id
            JOIN qualifications q ON sq.qualification_id = q.qualification_id
            WHERE sq.id = ?`,
            [id]
        );

        return rows[0] || null;
    }

    static async findByStaff(staffId, limit = 20) {
        const [rows] = await pool.execute(
            `SELECT 
                sq.id,
                sq.qualification_id as qualificationId,
                q.name as qualificationName,
                q.issuing_body as issuingBody,
                sq.issue_date as issueDate,
                sq.created_at
            FROM staff_qualifications sq
            JOIN qualifications q ON sq.qualification_id = q.qualification_id
            WHERE sq.staff_id = ?
            ORDER BY sq.issue_date DESC
            LIMIT ?`,
            [staffId, limit]
        );

        return rows;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            `SELECT 
                sq.id,
                sq.staff_id as staffId,
                CONCAT(s.first_name, ' ', s.last_name) as staffName,
                sq.qualification_id as qualificationId,
                q.name as qualificationName,
                sq.issue_date as issueDate,
                sq.created_at
            FROM staff_qualifications sq
            JOIN staff s ON sq.staff_id = s.staff_id
            JOIN qualifications q ON sq.qualification_id = q.qualification_id
            ORDER BY sq.created_at DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows;
    }

    static async updateById(id, updateData) {
        const { issueDate } = updateData;

        const fields = [];
        const values = [];

        if (issueDate !== undefined) {
            fields.push('issue_date = ?');
            values.push(issueDate);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(id);

        await pool.execute(
            `UPDATE staff_qualifications SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async deleteById(id) {
        const [result] = await pool.execute(
            'DELETE FROM staff_qualifications WHERE id = ?',
            [id]
        );

        return result.affectedRows > 0;
    }
}

export default StaffQualification;