const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
    static async register(req, res) {
        try {
            const { name, email, password, role } = req.body;
            
            // Check if user exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create user
            const userId = await User.create({
                name,
                email,
                password: hashedPassword,
                role: role || 'user'
            });
            
            // Generate token
            const token = jwt.sign(
                { userId },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );
            
            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: userId,
                    name,
                    email,
                    role: role || 'user'
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Find user
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Generate token
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );
            
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id);
            res.json({ user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AuthController;