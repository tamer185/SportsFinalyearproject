const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
    try {
        console.log('🚀 Setting up database...');
        
        // Create database if not exists
        await pool.query('CREATE DATABASE IF NOT EXISTS lebanon_sports_hub');
        await pool.query('USE lebanon_sports_hub');
        
        console.log('✅ Database created/selected');
        
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            )
        `);
        console.log('✅ Users table created');
        
        // Create events table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(200) NOT NULL,
                category VARCHAR(50) NOT NULL,
                location VARCHAR(100) NOT NULL,
                date VARCHAR(50) NOT NULL,
                time VARCHAR(20) NOT NULL,
                image TEXT,
                description TEXT,
                registered INT DEFAULT 0,
                capacity INT NOT NULL,
                venue VARCHAR(200),
                exact_location TEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                price DECIMAL(10, 2) DEFAULT 0,
                price_type VARCHAR(20),
                price_display VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_location (location),
                INDEX idx_date (date),
                INDEX idx_price_type (price_type)
            )
        `);
        console.log('✅ Events table created');
        
        // Create registrations table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS registrations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                user_email VARCHAR(100) NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_date TIMESTAMP NULL,
                rejected_date TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_event_id (event_id),
                INDEX idx_status (status),
                UNIQUE KEY unique_user_event (user_id, event_id)
            )
        `);
        console.log('✅ Registrations table created');
        
        // Create default admin user
        const hashedPassword = await bcrypt.hash('TAML76', 10);
        const [adminCheck] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            ['tamernasr1717@gmail.com']
        );
        
        if (adminCheck.length === 0) {
            await pool.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin', 'tamernasr1717@gmail.com', hashedPassword, 'admin']
            );
            console.log('✅ Default admin user created');
        } else {
            console.log('✅ Admin user already exists');
        }
        
        // Insert sample events (from your data.js)
        const [eventCount] = await pool.query('SELECT COUNT(*) as count FROM events');
        if (eventCount[0].count === 0) {
            const sampleEvents = [
                // Beirut Events
                {
                    title: "Beirut International Marathon",
                    category: "Running",
                    location: "Beirut",
                    date: "Nov 19, 2026",
                    time: "7:00 AM",
                    image: "https://images.unsplash.com/photo-1552674605-db6ffd8facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
                    description: "The biggest marathon in Lebanon with thousands of participants from around the world.",
                    registered: 2850,
                    capacity: 10000,
                    venue: "Martyr's Square",
                    exact_location: "Starting at Martyr's Square, route through Downtown Beirut",
                    latitude: 33.8938,
                    longitude: 35.5018,
                    price: 50,
                    price_type: "premium",
                    price_display: "$50"
                },
                {
                    title: "Beirut Basketball Street Tournament",
                    category: "Basketball",
                    location: "Beirut",
                    date: "Dec 5, 2026",
                    time: "2:00 PM",
                    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
                    description: "3x3 street basketball tournament featuring local and international teams.",
                    registered: 42,
                    capacity: 64,
                    venue: "Zaitunay Bay",
                    exact_location: "Zaitunay Bay Sports Courts, Beirut Waterfront",
                    latitude: 33.8959,
                    longitude: 35.4785,
                    price: 20,
                    price_type: "budget",
                    price_display: "$20 per team"
                },
                // Add more events as needed...
            ];
            
            for (const event of sampleEvents) {
                await pool.query(
                    `INSERT INTO events (
                        title, category, location, date, time, image, description,
                        registered, capacity, venue, exact_location, latitude, longitude,
                        price, price_type, price_display
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        event.title, event.category, event.location, event.date, event.time,
                        event.image, event.description, event.registered, event.capacity,
                        event.venue, event.exact_location, event.latitude, event.longitude,
                        event.price, event.price_type, event.price_display
                    ]
                );
            }
            console.log(`✅ ${sampleEvents.length} sample events inserted`);
        } else {
            console.log('✅ Events already exist in database');
        }
        
        console.log('🎉 Database setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase();