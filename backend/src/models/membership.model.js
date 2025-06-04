// src/models/membership.model.js

import { pool } from "../config/database.js";

class Membership {
    static async create(membershipData) {
        const { name, description, durationDays, price } = membershipData;

        const [result] = await pool.execute(
            'INSERT INTO memberships (name, description, duration_days, price) VALUES (?, ?, ?, ?)',
            [name, description, durationDays, price]
        );

        return {
            membershipId: result.insertId,
            name,
            description,
            durationDays,
            price
        };
    }

    static async findById(membershipId) {
        const [rows] = await pool.execute(
            'SELECT membership_id as membershipId, name, description, duration_days as durationDays, price, is_active as isActive, created_at, updated_at FROM memberships WHERE membership_id = ?',
            [membershipId]
        );

        return rows[0] || null;
    }

    static async findAll() {
        const [rows] = await pool.execute(
            'SELECT membership_id as membershipId, name, description, duration_days as durationDays, price, is_active as isActive, created_at, updated_at FROM memberships ORDER BY price ASC'
        );

        return rows;
    }

    static async findActive() {
        const [rows] = await pool.execute(
            'SELECT membership_id as membershipId, name, description, duration_days as durationDays, price, is_active as isActive FROM memberships WHERE is_active = TRUE ORDER BY price ASC'
        );

        return rows;
    }

    static async updateById(membershipId, updateData) {
        const { name, description, durationDays, price, isActive } = updateData;

        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            values.push(description);
        }
        if (durationDays !== undefined) {
            fields.push('duration_days = ?');
            values.push(durationDays);
        }
        if (price !== undefined) {
            fields.push('price = ?');
            values.push(price);
        }
        if (isActive !== undefined) {
            fields.push('is_active = ?');
            values.push(isActive);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(membershipId);

        await pool.execute(
            `UPDATE memberships SET ${fields.join(', ')} WHERE membership_id = ?`,
            values
        );

        return this.findById(membershipId);
    }

    static async deleteById(membershipId) {
        // Перевіряємо чи немає активних підписок
        const [activeSubscriptions] = await pool.execute(
            'SELECT COUNT(*) as count FROM client_memberships WHERE membership_id = ? AND status = "active"',
            [membershipId]
        );

        if (activeSubscriptions[0].count > 0) {
            throw new Error('Cannot delete membership with active subscriptions');
        }

        const [result] = await pool.execute(
            'DELETE FROM memberships WHERE membership_id = ?',
            [membershipId]
        );

        return result.affectedRows > 0;
    }

    static async assignToClient(clientId, membershipId, startDate) {
        // Отримуємо інформацію про абонемент
        const membership = await this.findById(membershipId);
        if (!membership) {
            throw new Error('Membership not found');
        }

        // Розраховуємо дату закінчення
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + membership.durationDays);

        const [result] = await pool.execute(
            'INSERT INTO client_memberships (client_id, membership_id, start_date, end_date) VALUES (?, ?, ?, ?)',
            [clientId, membershipId, startDate, end.toISOString().split('T')[0]]
        );

        return {
            id: result.insertId,
            clientId,
            membershipId,
            startDate,
            endDate: end.toISOString().split('T')[0],
            status: 'active'
        };
    }

    static async getPopularMemberships() {
        const [rows] = await pool.execute(`
            SELECT 
                m.membership_id as membershipId,
                m.name,
                m.price,
                COUNT(cm.id) as purchaseCount
            FROM memberships m
            LEFT JOIN client_memberships cm ON m.membership_id = cm.membership_id
            WHERE m.is_active = TRUE
            GROUP BY m.membership_id
            ORDER BY purchaseCount DESC, m.price ASC
            LIMIT 5
        `);

        return rows;
    }

    static async getMembershipStats() {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT cm.client_id) as totalActiveClients,
                SUM(m.price) as totalRevenue,
                AVG(m.price) as averagePrice
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.membership_id
            WHERE cm.status = 'active' AND cm.end_date >= CURDATE()
        `);

        return stats[0] || {
            totalActiveClients: 0,
            totalRevenue: 0,
            averagePrice: 0
        };
    }
}

export default Membership;