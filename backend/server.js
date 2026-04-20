const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
async function testDatabase() {
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ MySQL Database connected successfully!');
        await connection.end();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// ====================
// ROOT ROUTE
// ====================

// Root path
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Lebanon Sports Hub API',
        version: '1.0.0',
        baseUrl: 'http://localhost:3000',
        apiDocs: 'Use /api/health or other /api/ endpoints'
    });
});

// ====================
// BASIC API ROUTES
// ====================

// 1. Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Lebanon Sports Hub API is running',
        timestamp: new Date().toISOString()
    });
});

// 2. Get All Events
app.get('/api/events', async (req, res) => {
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        const [events] = await connection.query('SELECT * FROM events ORDER BY date, time');
        await connection.end();
        
        res.json({ 
            success: true, 
            count: events.length,
            events 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 3. Get Single Event
app.get('/api/events/:id', async (req, res) => {
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        const [events] = await connection.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
        await connection.end();
        
        if (events.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Event not found' 
            });
        }
        
        res.json({ 
            success: true, 
            event: events[0]
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 4. Get Event Statistics
app.get('/api/events-stats', async (req, res) => {
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        const [events] = await connection.query('SELECT * FROM events');
        await connection.end();
        
        const stats = {
            totalEvents: events.length,
            totalCapacity: events.reduce((sum, event) => sum + event.capacity, 0),
            totalRegistered: events.reduce((sum, event) => sum + event.registered, 0),
            freeEvents: events.filter(event => event.price === 0).length,
            budgetEvents: events.filter(event => event.price > 0 && event.price <= 20).length,
            moderateEvents: events.filter(event => event.price > 20 && event.price <= 50).length,
            premiumEvents: events.filter(event => event.price > 50).length,
            eventsByLocation: events.reduce((acc, event) => {
                acc[event.location] = (acc[event.location] || 0) + 1;
                return acc;
            }, {})
        };
        
        res.json({ 
            success: true, 
            stats 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ====================
// USER REGISTRATION ROUTES
// ====================

// 5. Register for Event
app.post('/api/register/:eventId', async (req, res) => {
    try {
        const { name, email } = req.body;
        const eventId = req.params.eventId;
        
        if (!name || !email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Name and email are required' 
            });
        }
        
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        // Check if event exists and has capacity
        const [events] = await connection.query('SELECT * FROM events WHERE id = ?', [eventId]);
        if (events.length === 0) {
            await connection.end();
            return res.status(404).json({ 
                success: false, 
                error: 'Event not found' 
            });
        }
        
        const event = events[0];
        if (event.registered >= event.capacity) {
            await connection.end();
            return res.status(400).json({ 
                success: false, 
                error: 'Event is full' 
            });
        }
        
        // Generate registration ID
        const registrationId = 'REG' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        // Create registration
        await connection.query(
            `INSERT INTO registrations 
            (user_id, event_id, user_name, user_email, status, registration_date) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [0, eventId, name, email, 'pending', new Date()]
        );
        
        // Update event registration count
        await connection.query(
            'UPDATE events SET registered = registered + 1 WHERE id = ?',
            [eventId]
        );
        
        await connection.end();
        
        res.status(201).json({ 
            success: true,
            message: 'Registration submitted successfully',
            registrationId,
            status: 'pending'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Already registered for this event' 
            });
        }
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 6. Get User Registrations
app.get('/api/my-registrations/:email', async (req, res) => {
    try {
        const email = req.params.email;
        
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        const [registrations] = await connection.query(`
            SELECT r.*, e.title, e.location, e.date, e.time, e.price, e.price_display
            FROM registrations r
            LEFT JOIN events e ON r.event_id = e.id
            WHERE r.user_email = ?
            ORDER BY r.registration_date DESC
        `, [email]);
        
        await connection.end();
        
        res.json({ 
            success: true, 
            count: registrations.length,
            registrations 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ====================
// ADMIN ROUTES
// ====================

// 7. Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Hardcoded admin credentials (you can change this later)
        const ADMIN_EMAIL = 'tamernasr1717@gmail.com';
        const ADMIN_PASSWORD = 'TAML76';
        
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // In a real app, you would generate a JWT token here
            const token = 'admin-token-' + Date.now();
            
            res.json({ 
                success: true,
                message: 'Login successful',
                token,
                user: {
                    name: 'Admin',
                    email: ADMIN_EMAIL,
                    role: 'admin'
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 8. Get Pending Registrations (Admin)
app.get('/api/admin/pending-registrations', async (req, res) => {
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        const [registrations] = await connection.query(`
            SELECT r.*, e.title as event_title, e.location, e.date, e.price, e.price_display
            FROM registrations r
            LEFT JOIN events e ON r.event_id = e.id
            WHERE r.status = 'pending'
            ORDER BY r.registration_date DESC
        `);
        
        await connection.end();
        
        res.json({ 
            success: true, 
            count: registrations.length,
            registrations 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 9. Get All Registrations (Admin)
app.get('/api/admin/all-registrations', async (req, res) => {
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        const [registrations] = await connection.query(`
            SELECT r.*, e.title as event_title, e.location, e.date, e.price, e.price_display
            FROM registrations r
            LEFT JOIN events e ON r.event_id = e.id
            ORDER BY r.registration_date DESC
        `);
        
        await connection.end();
        
        res.json({ 
            success: true, 
            count: registrations.length,
            registrations 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 10. Approve Registration (Admin)
app.put('/api/admin/approve-registration/:id', async (req, res) => {
    try {
        const registrationId = req.params.id;
        
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        await connection.query(
            `UPDATE registrations SET 
                status = 'approved', 
                approved_date = ?
            WHERE id = ?`,
            [new Date(), registrationId]
        );
        
        await connection.end();
        
        res.json({ 
            success: true,
            message: 'Registration approved successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 11. Reject Registration (Admin)
app.put('/api/admin/reject-registration/:id', async (req, res) => {
    try {
        const registrationId = req.params.id;
        
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        // Get event_id before rejecting to update event count
        const [reg] = await connection.query(
            'SELECT event_id FROM registrations WHERE id = ?',
            [registrationId]
        );
        
        if (reg.length > 0) {
            // Decrement event registration count
            await connection.query(
                'UPDATE events SET registered = registered - 1 WHERE id = ? AND registered > 0',
                [reg[0].event_id]
            );
        }
        
        await connection.query(
            `UPDATE registrations SET 
                status = 'rejected', 
                rejected_date = ?
            WHERE id = ?`,
            [new Date(), registrationId]
        );
        
        await connection.end();
        
        res.json({ 
            success: true,
            message: 'Registration rejected successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 12. Get Registration Statistics (Admin)
app.get('/api/admin/registration-stats', async (req, res) => {
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        const [stats] = await connection.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM registrations
        `);
        
        await connection.end();
        
        res.json({ 
            success: true, 
            stats: stats[0] 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ====================
// ERROR HANDLING
// ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Route not found' 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ====================
// START SERVER
// ====================

async function startServer() {
    // Test database connection
    const dbConnected = await testDatabase();
    
    if (!dbConnected) {
        console.log('⚠️ Starting server without database connection...');
    }
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`\n📚 API ENDPOINTS:`);
        console.log(`   📡 Health: GET /api/health`);
        console.log(`   📊 Events: GET /api/events`);
        console.log(`   🔍 Single Event: GET /api/events/:id`);
        console.log(`   📈 Event Stats: GET /api/events-stats`);
        console.log(`   📝 Register: POST /api/register/:eventId`);
        console.log(`   👤 My Registrations: GET /api/my-registrations/:email`);
        console.log(`\n🔐 ADMIN ENDPOINTS:`);
        console.log(`   🔑 Login: POST /api/admin/login`);
        console.log(`   ⏳ Pending: GET /api/admin/pending-registrations`);
        console.log(`   📋 All: GET /api/admin/all-registrations`);
        console.log(`   ✅ Approve: PUT /api/admin/approve-registration/:id`);
        console.log(`   ❌ Reject: PUT /api/admin/reject-registration/:id`);
        console.log(`   📊 Stats: GET /api/admin/registration-stats`);
        console.log(`\n💡 Default Admin Credentials:`);
        console.log(`   Email: tamernasr1717@gmail.com`);
        console.log(`   Password: TAML76`);
    });
}

startServer();