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
    guestName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    numberOfDays: {
        type: Number,
        required: true,
        min: 1
    },
    guests: {
        type: Number,
        required: true,
        min: 1
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
    paymentMethod: {
        type: String,
        enum: ['ESEWA', 'KHALTI', 'BANK_TRANSFER', 'CASH'],
        required: true
    }
}, {
    timestamps: true
});

// Add a pre-save hook to calculate numberOfDays if not provided
bookingSchema.pre('save', function(next) {
    if (!this.numberOfDays) {
        const checkIn = new Date(this.checkIn);
        const checkOut = new Date(this.checkOut);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        this.numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    next();
});

// Add middleware to set status to CONFIRMED when payment method is provided
bookingSchema.pre('save', function(next) {
    if (this.paymentMethod && this.isModified('paymentMethod')) {
        this.status = 'CONFIRMED';
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
