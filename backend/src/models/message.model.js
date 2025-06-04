// src/models/message.model.js

import { pool } from "../config/database.js";

class Message {
    static async create(messageData) {
        const { senderId, receiverId, text, image } = messageData;

        const [result] = await pool.execute(
            'INSERT INTO messages (sender_id, receiver_id, text, image) VALUES (?, ?, ?, ?)',
            [senderId, receiverId, text, image]
        );

        return {
            id: result.insertId,
            senderId,
            receiverId,
            text,
            image,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    static async findByUsers(userId1, userId2) {
        const [rows] = await pool.execute(`
            SELECT 
                id,
                sender_id as senderId,
                receiver_id as receiverId,
                text,
                image,
                created_at as createdAt,
                updated_at as updatedAt
            FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `, [userId1, userId2, userId2, userId1]);

        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM messages WHERE id = ?',
            [id]
        );

        return rows[0] || null;
    }
}

export default Message;