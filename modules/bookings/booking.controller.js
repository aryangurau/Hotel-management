const Booking = require('./booking.model');
const Room = require('../rooms/room.model');

const createBooking = async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, totalAmount } = req.body;
        const userId = req.user._id;

        // Validate room exists
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        const booking = await Booking.create({
            userId,
            roomId,
            checkIn,
            checkOut,
            totalAmount,
            status: 'PENDING'
        });

        // Populate room details for response
        const populatedBooking = await Booking.findById(booking._id)
            .populate('roomId', 'name type price totalGuests');

        return res.json({
            success: true,
            data: populatedBooking,
            message: 'Booking created successfully'
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('Fetching bookings for user:', userId);

        // First check if user has any bookings
        const bookingCount = await Booking.countDocuments({ userId });
        console.log('Total bookings found:', bookingCount);
        
        const bookings = await Booking.find({ userId })
            .populate('roomId', 'name type price totalGuests')
            .sort('-createdAt')
            .lean();

        console.log('Found bookings:', JSON.stringify(bookings, null, 2));

        return res.json({
            success: true,
            data: bookings,
            message: `Found ${bookings.length} bookings`
        });
    } catch (error) {
        console.error('Error in getBookings:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createBooking,
    getBookings
};
