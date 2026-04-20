const express = require('express');
const router = express.Router();
const RegistrationController = require('../controllers/registrationController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// User routes (protected)
router.post('/event/:eventId', authMiddleware, RegistrationController.registerForEvent);
router.get('/my-registrations', authMiddleware, RegistrationController.getUserRegistrations);
router.delete('/cancel/:id', authMiddleware, RegistrationController.cancelRegistration);

// Admin routes (protected)
router.get('/', authMiddleware, adminMiddleware, RegistrationController.getAllRegistrations);
router.get('/pending', authMiddleware, adminMiddleware, RegistrationController.getPendingRegistrations);
router.get('/stats', authMiddleware, adminMiddleware, RegistrationController.getRegistrationStats);
router.put('/approve/:id', authMiddleware, adminMiddleware, RegistrationController.approveRegistration);
router.put('/reject/:id', authMiddleware, adminMiddleware, RegistrationController.rejectRegistration);

module.exports = router;