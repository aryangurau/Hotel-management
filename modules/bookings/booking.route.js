const router = require('express').Router();
const { isUser } = require('../../middlewares/auth.middleware');
const { createBooking, getBookings } = require('./booking.controller');

// Debug middleware
const debugMiddleware = (req, res, next) => {
    console.log('Booking Route Debug:');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('User:', req.user?._id);
    next();
};

// Routes with debug middleware
router.post('/', isUser, debugMiddleware, createBooking);
router.get('/', isUser, debugMiddleware, getBookings);

module.exports = router;
