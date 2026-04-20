const { pool } = require('../config/database');

class Event {
    static async create(eventData) {
        const [result] = await pool.execute(
            `INSERT INTO events (
                title, category, location, date, time, image, description,
                registered, capacity, venue, exact_location, latitude, longitude,
                price, price_type, price_display
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                eventData.title,
                eventData.category,
                eventData.location,
                eventData.date,
                eventData.time,
                eventData.image,
                eventData.description,
                eventData.registered || 0,
                eventData.capacity,
                eventData.venue,
                eventData.exactLocation,
                eventData.coordinates[0],
                eventData.coordinates[1],
                eventData.price,
                eventData.priceType,
                eventData.priceDisplay
            ]
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await pool.execute(
            'SELECT * FROM events ORDER BY date, time'
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM events WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, eventData) {
        await pool.execute(
            `UPDATE events SET 
                title = ?, category = ?, location = ?, date = ?, time = ?,
                image = ?, description = ?, registered = ?, capacity = ?,
                venue = ?, exact_location = ?, latitude = ?, longitude = ?,
                price = ?, price_type = ?, price_display = ?
            WHERE id = ?`,
            [
                eventData.title,
                eventData.category,
                eventData.location,
                eventData.date,
                eventData.time,
                eventData.image,
                eventData.description,
                eventData.registered,
                eventData.capacity,
                eventData.venue,
                eventData.exactLocation,
                eventData.coordinates[0],
                eventData.coordinates[1],
                eventData.price,
                eventData.priceType,
                eventData.priceDisplay,
                id
            ]
        );
    }

    static async delete(id) {
        await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    }

    static async incrementRegistration(id) {
        await pool.execute(
            'UPDATE events SET registered = registered + 1 WHERE id = ?',
            [id]
        );
    }

    static async decrementRegistration(id) {
        await pool.execute(
            'UPDATE events SET registered = registered - 1 WHERE id = ? AND registered > 0',
            [id]
        );
    }
}

module.exports = Event;