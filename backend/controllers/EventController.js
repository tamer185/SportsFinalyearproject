const Event = require('../models/Event');

class EventController {
    static async getAllEvents(req, res) {
        try {
            const events = await Event.findAll();
            res.json({ events });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async getEvent(req, res) {
        try {
            const event = await Event.findById(req.params.id);
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            res.json({ event });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async createEvent(req, res) {
        try {
            const eventData = req.body;
            const eventId = await Event.create(eventData);
            
            res.status(201).json({
                message: 'Event created successfully',
                eventId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async updateEvent(req, res) {
        try {
            const eventData = req.body;
            await Event.update(req.params.id, eventData);
            
            res.json({ message: 'Event updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async deleteEvent(req, res) {
        try {
            await Event.delete(req.params.id);
            res.json({ message: 'Event deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    static async getEventStatistics(req, res) {
        try {
            const events = await Event.findAll();
            const stats = {
                totalEvents: events.length,
                totalCapacity: events.reduce((sum, event) => sum + event.capacity, 0),
                totalRegistered: events.reduce((sum, event) => sum + event.registered, 0),
                freeEvents: events.filter(event => event.price === 0).length,
                premiumEvents: events.filter(event => event.price > 50).length,
                eventsByLocation: events.reduce((acc, event) => {
                    acc[event.location] = (acc[event.location] || 0) + 1;
                    return acc;
                }, {})
            };
            
            res.json({ stats });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = EventController;