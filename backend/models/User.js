const { pool } = require('../config/database');

class User {
    static async create(userData) {
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [userData.name, userData.email, userData.password, userData.role || 'user']
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, userData) {
        await pool.execute(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [userData.name, userData.email, id]
        );
    }
}

module.exports = User;