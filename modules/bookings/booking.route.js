const express = require('express');
const router = express.Router();
const { isUser } = require('../../middlewares/auth.middleware');
const {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus
} = require('./booking.controller');

// Create a new booking
router.post('/', isUser, createBooking);

// Get all bookings for the authenticated user
router.get('/user/:userId', isUser, getBookings);

// Get a specific booking by ID
router.get('/:id', isUser, getBookingById);

// Update booking status
router.patch('/:id/status', isUser, updateBookingStatus);

module.exports = router;
