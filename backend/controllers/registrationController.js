const Registration = require('../models/Registration');
const Event = require('../models/Event');

class RegistrationController {
    static async registerForEvent(req, res) {
        try {
            const { eventId } = req.params;
            const { name, email } = req.body;
            const userId = req.user.id;
            
            // Check if already registered
            const existingRegistration = await Registration.findByUserAndEvent(userId, eventId);
            if (existingRegistration) {
                return res.status(400).json({ error: 'Already registered for this event' });
            }
            
            // Check event capacity
            const event = await Event.findById(eventId);
            if (event.registered >= event.capacity) {
                return res.status(400).json({ error: 'Event is full' });
            }
            
            // Create registration
            const registrationId = await Registration.create({
                userId,
                eventId,
                userName: name || req.user.name,
                userEmail: email || req.user.email,
                status: 'pending'
            });
            
            // Increment event registration count
            await Event.incrementRegistration(eventId);
            
            res.status(201).json({
                message: 'Registration submitted successfully',
                registrationId,
                status: 'pending'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async getUserRegistrations(req, res) {
        try {
            const registrations = await Registration.findAll();
            const userRegistrations = registrations.filter(
                reg => reg.user_id === req.user.id
            );
            
            res.json({ registrations: userRegistrations });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async getAllRegistrations(req, res) {
        try {
            const registrations = await Registration.findAll();
            res.json({ registrations });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async getPendingRegistrations(req, res) {
        try {
            const registrations = await Registration.findByStatus('pending');
            res.json({ registrations });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async approveRegistration(req, res) {
        try {
            const { id } = req.params;
            
            await Registration.updateStatus(id, 'approved');
            
            res.json({ message: 'Registration approved successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async rejectRegistration(req, res) {
        try {
            const { id } = req.params;
            
            await Registration.updateStatus(id, 'rejected');
            
            res.json({ message: 'Registration rejected successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async getRegistrationStats(req, res) {
        try {
            const stats = await Registration.getStatistics();
            res.json({ stats });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async cancelRegistration(req, res) {
        try {
            const { id } = req.params;
            
            const registration = await Registration.findById(id);
            if (!registration) {
                return res.status(404).json({ error: 'Registration not found' });
            }
            
            // Only allow user to cancel their own registration
            if (registration.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            // Decrement event registration count
            await Event.decrementRegistration(registration.event_id);
            
            // Delete registration
            await Registration.delete(id);
            
            res.json({ message: 'Registration cancelled successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = RegistrationController;