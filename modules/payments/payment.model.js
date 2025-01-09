const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['KHALTI', 'ESEWA', 'BANK_TRANSFER', 'CASH'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    transactionId: {
        type: String,
        unique: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
