const { pool } = require('../config/database');

class Registration {
    static async create(registrationData) {
        const [result] = await pool.execute(
            `INSERT INTO registrations (
                user_id, event_id, user_name, user_email, status,
                registration_date, approved_date, rejected_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                registrationData.userId,
                registrationData.eventId,
                registrationData.userName,
                registrationData.userEmail,
                registrationData.status || 'pending',
                new Date(),
                null,
                null
            ]
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await pool.execute(`
            SELECT r.*, e.title as event_title, e.location as event_location,
                   e.date as event_date, e.price as event_price
            FROM registrations r
            LEFT JOIN events e ON r.event_id = e.id
            ORDER BY r.registration_date DESC
        `);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(`
            SELECT r.*, e.title as event_title, e.location as event_location,
                   e.date as event_date, e.time as event_time, e.venue,
                   e.price as event_price, e.exact_location as exact_location
            FROM registrations r
            LEFT JOIN events e ON r.event_id = e.id
            WHERE r.id = ?
        `, [id]);
        return rows[0];
    }

    static async findByUserAndEvent(userId, eventId) {
        const [rows] = await pool.execute(
            'SELECT * FROM registrations WHERE user_id = ? AND event_id = ?',
            [userId, eventId]
        );
        return rows[0];
    }

    static async findByStatus(status) {
        const [rows] = await pool.execute(`
            SELECT r.*, e.title as event_title, e.location as event_location,
                   e.date as event_date, e.price as event_price
            FROM registrations r
            LEFT JOIN events e ON r.event_id = e.id
            WHERE r.status = ?
            ORDER BY r.registration_date DESC
        `, [status]);
        return rows;
    }

    static async updateStatus(id, status) {
        const updateData = {
            status: status
        };
        
        if (status === 'approved') {
            updateData.approved_date = new Date();
            updateData.rejected_date = null;
        } else if (status === 'rejected') {
            updateData.rejected_date = new Date();
            updateData.approved_date = null;
        }
        
        await pool.execute(
            `UPDATE registrations SET 
                status = ?, approved_date = ?, rejected_date = ?
            WHERE id = ?`,
            [
                updateData.status,
                updateData.approved_date,
                updateData.rejected_date,
                id
            ]
        );
    }

    static async delete(id) {
        await pool.execute('DELETE FROM registrations WHERE id = ?', [id]);
    }

    static async getStatistics() {
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM registrations
        `);
        return rows[0];
    }
}

module.exports = Registration;