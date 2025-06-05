// src/models/review.model.js

import { pool } from "../config/database.js";

class Review {
    static async create(reviewData) {
        const { clientId, staffId, rating, comment, reviewDate } = reviewData;

        const [result] = await pool.execute(
            'INSERT INTO reviews (client_id, staff_id, rating, comment, review_date) VALUES (?, ?, ?, ?, ?)',
            [clientId, staffId, rating, comment || null, reviewDate || new Date()]
        );

        return {
            reviewId: result.insertId,
            clientId,
            staffId,
            rating,
            comment,
            reviewDate: reviewDate || new Date()
        };
    }

    static async findById(reviewId) {
        const [rows] = await pool.execute(
            `SELECT 
                r.review_id as reviewId,
                r.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                r.staff_id as staffId,
                CONCAT(s.first_name, ' ', s.last_name) as staffName,
                r.rating,
                r.comment,
                r.review_date as reviewDate,
                r.created_at,
                r.updated_at
            FROM reviews r
            JOIN clients c ON r.client_id = c.client_id
            JOIN staff s ON r.staff_id = s.staff_id
            WHERE r.review_id = ?`,
            [reviewId]
        );

        return rows[0] || null;
    }

    static async findAll(limit = 50, offset = 0) {
        const [rows] = await pool.execute(
            `SELECT 
                r.review_id as reviewId,
                r.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                r.staff_id as staffId,
                CONCAT(s.first_name, ' ', s.last_name) as staffName,
                r.rating,
                r.comment,
                r.review_date as reviewDate,
                r.created_at
            FROM reviews r
            JOIN clients c ON r.client_id = c.client_id
            JOIN staff s ON r.staff_id = s.staff_id
            ORDER BY r.review_date DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows;
    }

    static async findByStaff(staffId, limit = 20) {
        const [rows] = await pool.execute(
            `SELECT 
                r.review_id as reviewId,
                r.client_id as clientId,
                CONCAT(c.first_name, ' ', c.last_name) as clientName,
                r.rating,
                r.comment,
                r.review_date as reviewDate,
                r.created_at
            FROM reviews r
            JOIN clients c ON r.client_id = c.client_id
            WHERE r.staff_id = ?
            ORDER BY r.review_date DESC
            LIMIT ?`,
            [staffId, limit]
        );

        return rows;
    }

    static async updateById(reviewId, updateData) {
        const { rating, comment, reviewDate } = updateData;

        const fields = [];
        const values = [];

        if (rating !== undefined) {
            fields.push('rating = ?');
            values.push(rating);
        }
        if (comment !== undefined) {
            fields.push('comment = ?');
            values.push(comment);
        }
        if (reviewDate !== undefined) {
            fields.push('review_date = ?');
            values.push(reviewDate);
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        values.push(reviewId);

        await pool.execute(
            `UPDATE reviews SET ${fields.join(', ')} WHERE review_id = ?`,
            values
        );

        return this.findById(reviewId);
    }

    static async deleteById(reviewId) {
        const [result] = await pool.execute(
            'DELETE FROM reviews WHERE review_id = ?',
            [reviewId]
        );

        return result.affectedRows > 0;
    }

    // Відповідає запиту "Top-rated trainers" з 04_bi_queries.sql
    static async getTopRatedTrainers(limit = 5) {
        const [rows] = await pool.execute(
            `SELECT 
                s.staff_id as staffId,
                s.first_name as firstName,
                s.last_name as lastName,
                ROUND(AVG(r.rating), 2) as avgRating,
                COUNT(*) as reviewCount
            FROM reviews r
            JOIN staff s ON r.staff_id = s.staff_id
            WHERE s.role = 'trainer'
            GROUP BY s.staff_id
            ORDER BY avgRating DESC, reviewCount DESC
            LIMIT ?`,
            [limit]
        );

        return rows;
    }
}

export default Review;