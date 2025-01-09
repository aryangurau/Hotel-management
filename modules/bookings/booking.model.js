const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
        default: 'PENDING'
    },
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
