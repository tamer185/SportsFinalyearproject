const express = require('express');
const router = express.Router();
const EventController = require('../controllers/EventController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public routes
router.get('/', EventController.getAllEvents);
// Statistics route must come before the param route so it's not captured as an `id`
router.get('/stats/statistics', EventController.getEventStatistics);
router.get('/:id', EventController.getEvent);

// Admin routes (protected)
router.post('/', authMiddleware, adminMiddleware, EventController.createEvent);
router.put('/:id', authMiddleware, adminMiddleware, EventController.updateEvent);
router.delete('/:id', authMiddleware, adminMiddleware, EventController.deleteEvent);

module.exports = router;