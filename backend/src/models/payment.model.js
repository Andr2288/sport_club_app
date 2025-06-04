// src/models/payment.model.js

import { pool } from "../config/database.js";

class Payment {
    static async create(paymentData) {
        const { clientId, amount, paymentMethod, purpose, paymentDate } = paymentData;

        const [result] = await pool.execute(
            'INSERT INTO payments (client_id, amount, payment_method, purpose, payment_date) VALUES (?, ?, ?, ?, ?)',
            [clientId, amount, paymentMethod, purpose, paymentDate || new Date()]
        );

        return {
            paymentId: result.insertId,
            clientId,
            amount,
            paymentMethod,
            purpose,
            paymentDate: paymentDate || new Date()
        };
    }

    static async findById(paymentId) {
        const [rows] = await pool.execute(`
            SELECT 
                p.payment_id as paymentId,
                p.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                p.amount,
                p.payment_method as paymentMethod,
                p.purpose,
                p.payment_date as paymentDate,
                p.created_at,
                p.updated_at
            FROM payments p
            JOIN clients c ON p.client_id = c.client_id
            WHERE p.payment_id = ?
        `, [paymentId]);

        return rows[0] || null;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(`
            SELECT 
                p.payment_id as paymentId,
                p.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                p.amount,
                p.payment_method as paymentMethod,
                p.purpose,
                p.payment_date as paymentDate,
                p.created_at
            FROM payments p
            JOIN clients c ON p.client_id = c.client_id
            ORDER BY p.payment_date DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        return rows;
    }

    static async findByClient(clientId, limit = 20) {
        const [rows] = await pool.execute(`
            SELECT 
                p.payment_id as paymentId,
                p.amount,
                p.payment_method as paymentMethod,
                p.purpose,
                p.payment_date as paymentDate,
                p.created_at
            FROM payments p
            WHERE p.client_id = ?
            ORDER BY p.payment_date DESC
            LIMIT ?
        `, [clientId, limit]);

        return rows;
    }

    static async findByDateRange(startDate, endDate, limit = 100) {
        const [rows] = await pool.execute(`
            SELECT 
                p.payment_id as paymentId,
                p.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                p.amount,
                p.payment_method as paymentMethod,
                p.purpose,
                p.payment_date as paymentDate
            FROM payments p
            JOIN clients c ON p.client_id = c.client_id
            WHERE DATE(p.payment_date) BETWEEN ? AND ?
            ORDER BY p.payment_date DESC
            LIMIT ?
        `, [startDate, endDate, limit]);

        return rows;
    }

    static async updateById(paymentId, updateData) {
        const { amount, paymentMethod, purpose, paymentDate } = updateData;

        const fields = [];
        const values = [];

        if (amount !== undefined) {
            fields.push('amount = ?');
            values.push(amount);
        }
        if (paymentMethod !== undefined) {
            fields.push('payment_method = ?');
            values.push(paymentMethod);
        }
        if (purpose !== undefined) {
            fields.push('purpose = ?');
            values.push(purpose);
        }
        if (paymentDate !== undefined) {
            fields.push('payment_date = ?');
            values.push(paymentDate);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(paymentId);

        await pool.execute(
            `UPDATE payments SET ${fields.join(', ')} WHERE payment_id = ?`,
            values
        );

        return this.findById(paymentId);
    }

    static async deleteById(paymentId) {
        const [result] = await pool.execute(
            'DELETE FROM payments WHERE payment_id = ?',
            [paymentId]
        );

        return result.affectedRows > 0;
    }

    static async getPaymentStats(period = 'month') {
        let dateCondition = '';

        switch (period) {
            case 'today':
                dateCondition = 'DATE(payment_date) = CURDATE()';
                break;
            case 'week':
                dateCondition = 'payment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateCondition = 'payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                break;
            case 'year':
                dateCondition = 'payment_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
                break;
            default:
                dateCondition = '1=1'; // All time
        }

        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalPayments,
                SUM(amount) as totalRevenue,
                AVG(amount) as averagePayment,
                COUNT(CASE WHEN purpose = 'membership' THEN 1 END) as membershipPayments,
                COUNT(CASE WHEN purpose = 'session' THEN 1 END) as sessionPayments,
                COUNT(CASE WHEN purpose = 'championship' THEN 1 END) as championshipPayments
            FROM payments
            WHERE ${dateCondition}
        `);

        return stats[0] || {
            totalPayments: 0,
            totalRevenue: 0,
            averagePayment: 0,
            membershipPayments: 0,
            sessionPayments: 0,
            championshipPayments: 0
        };
    }

    static async getRevenueByMonth(year = new Date().getFullYear()) {
        const [rows] = await pool.execute(`
            SELECT 
                MONTH(payment_date) as month,
                MONTHNAME(payment_date) as monthName,
                SUM(amount) as revenue,
                COUNT(*) as paymentCount
            FROM payments
            WHERE YEAR(payment_date) = ?
            GROUP BY MONTH(payment_date), MONTHNAME(payment_date)
            ORDER BY MONTH(payment_date)
        `, [year]);

        return rows;
    }

    static async getPaymentMethodStats() {
        const [rows] = await pool.execute(`
            SELECT 
                payment_method as paymentMethod,
                COUNT(*) as count,
                SUM(amount) as totalAmount,
                AVG(amount) as averageAmount
            FROM payments
            GROUP BY payment_method
            ORDER BY count DESC
        `);

        return rows;
    }

    static async getTopPayingClients(limit = 10) {
        const [rows] = await pool.execute(`
            SELECT 
                p.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                c.email,
                SUM(p.amount) as totalPaid,
                COUNT(p.payment_id) as paymentCount,
                AVG(p.amount) as averagePayment
            FROM payments p
            JOIN clients c ON p.client_id = c.client_id
            GROUP BY p.client_id
            ORDER BY totalPaid DESC
            LIMIT ?
        `, [limit]);

        return rows;
    }

    static async getRecentPayments(limit = 10) {
        const [rows] = await pool.execute(`
            SELECT 
                p.payment_id as paymentId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                p.amount,
                p.payment_method as paymentMethod,
                p.purpose,
                p.payment_date as paymentDate
            FROM payments p
            JOIN clients c ON p.client_id = c.client_id
            ORDER BY p.payment_date DESC
            LIMIT ?
        `, [limit]);

        return rows;
    }
}

export default Payment;