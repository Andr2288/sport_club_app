// src/models/salary.model.js

import { pool } from "../config/database.js";

class Salary {
    static async create(salaryData) {
        const { staffId, amount, month, paidDate } = salaryData;

        const [result] = await pool.execute(
            'INSERT INTO salaries (staff_id, amount, month, paid_date) VALUES (?, ?, ?, ?)',
            [staffId, amount, month, paidDate || new Date()]
        );

        return {
            salaryId: result.insertId,
            staffId,
            amount,
            month,
            paidDate: paidDate || new Date()
        };
    }

    static async findById(salaryId) {
        const [rows] = await pool.execute(
            `SELECT
s.salary_id as salaryId,
    s.staff_id as staffId,
    CONCAT(st.first_name, ' ', st.last_name) as staffName,
    s.amount,
    s.month,
    s.paid_date as paidDate,
    s.created_at,
    s.updated_at
FROM salaries s
JOIN staff st ON s.staff_id = st.staff_id
WHERE s.salary_id = ?`,
            [salaryId]
        );

        return rows[0] || null;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            `SELECT
s.salary_id as salaryId,
    s.staff_id as staffId,
    CONCAT(st.first_name, ' ', st.last_name) as staffName,
    s.amount,
    s.month,
    s.paid_date as paidDate,
    s.created_at
FROM salaries s
JOIN staff st ON s.staff_id = st.staff_id
ORDER BY s.paid_date DESC
LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows;
    }

    static async findByStaff(staffId, limit = 20) {
        const [rows] = await pool.execute(
            `SELECT
    s.salary_id as salaryId,
    s.amount,
    s.month,
    s.paid_date as paidDate,
    s.created_at
FROM salaries s
WHERE s.staff_id = ?
    ORDER BY s.paid_date DESC
LIMIT ?`,
            [staffId, limit]
        );

        return rows;
    }

    static async updateById(salaryId, updateData) {
        const { amount, month, paidDate } = updateData;

        const fields = [];
        const values = [];

        if (amount !== undefined) {
            fields.push('amount = ?');
            values.push(amount);
        }
        if (month !== undefined) {
            fields.push('month = ?');
            values.push(month);
        }
        if (paidDate !== undefined) {
            fields.push('paid_date = ?');
            values.push(paidDate);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(salaryId);

        await pool.execute(
            `UPDATE salaries SET ${fields.join(', ')} WHERE salary_id = ?`,
            values
        );

        return this.findById(salaryId);
    }

    static async deleteById(salaryId) {
        const [result] = await pool.execute(
            'DELETE FROM salaries WHERE salary_id = ?',
            [salaryId]
        );

        return result.affectedRows > 0;
    }

    static async getFinancialSummary() {
        const [rows] = await pool.execute(
            `SELECT 'income' AS type, SUM(amount) AS total FROM payments
UNION ALL
SELECT 'expenses', SUM(amount) FROM salaries`
        );

        return rows;
    }

    static async getExpenseIncomeRatio() {
        const [stats] = await pool.execute(`
SELECT
ROUND(
    SUM(CASE WHEN type = 'expenses' THEN amount ELSE 0 END) /
SUM(CASE WHEN type = 'income' THEN amount ELSE 1 END), 2
) AS expenseIncomeRatio
FROM (
    SELECT 'income' AS type, amount FROM payments
UNION ALL
SELECT 'expenses', amount FROM salaries
) AS finance_summary
    `);

        return stats[0] || { expenseIncomeRatio: 0 };
    }
}

export default Salary;
