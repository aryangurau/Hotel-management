const Booking = require('./booking.model');
const Room = require('../rooms/room.model');
const User = require('../users/user.model');

const createBooking = async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, totalAmount, guestName, phoneNumber, guests, paymentMethod } = req.body;
        const userId = req.user._id;  // Get userId from auth token

        // Log the user and booking details
        console.log('Creating booking for user:', userId, 'with data:', {
            roomId,
            checkIn,
            checkOut,
            totalAmount,
            guestName,
            phoneNumber,
            guests,
            paymentMethod
        });

        // Validate room exists
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        // Validate guest count
        if (guests > room.maxGuests) {
            throw new Error(`Maximum ${room.maxGuests} guests allowed for this room`);
        }

        // Validate payment method
        const validPaymentMethods = ['ESEWA', 'KHALTI', 'BANK_TRANSFER', 'CASH'];
        if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
            throw new Error('Invalid payment method');
        }

        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkInDate >= checkOutDate) {
            throw new Error('Check-out date must be after check-in date');
        }

        // Calculate number of days
        const numberOfDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 3600 * 24));

        // Create booking with confirmed status since payment is made
        const booking = await Booking.create({
            userId,
            roomId,
            guestName,
            phoneNumber,
            numberOfDays,
            guests,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            totalAmount,
            status: 'CONFIRMED',  // Always confirmed when payment is made
            paymentMethod
        });

        // Populate and return booking
        const populatedBooking = await Booking.findById(booking._id)
            .populate('roomId', 'type price maxGuests')
            .populate('userId', 'name email')
            .lean();

        return res.json({
            success: true,
            data: populatedBooking,
            message: 'Booking created successfully'
        });
    } catch (error) {
        console.error('Booking creation error:', error);
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

        const bookings = await Booking.find({ userId })
            .populate('roomId', 'type price maxGuests')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        console.log('Found bookings:', bookings);

        return res.json({
            success: true,
            data: bookings,
            message: 'Bookings fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id)
            .populate('roomId', 'type price maxGuests')
            .populate('userId', 'name email')
            .lean();

        if (!booking) {
            throw new Error('Booking not found');
        }

        return res.json({
            success: true,
            data: booking,
            message: 'Booking fetched successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )
        .populate('roomId', 'type price maxGuests')
        .populate('userId', 'name email')
        .lean();

        if (!booking) {
            throw new Error('Booking not found');
        }

        return res.json({
            success: true,
            data: booking,
            message: 'Booking status updated successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus
};
