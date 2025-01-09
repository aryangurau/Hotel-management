const Payment = require('./payment.model');
const Booking = require('../bookings/booking.model');
const User = require('../users/user.model'); // Added User model
const { sendEmail } = require('../../services/mail.service');

const initiatePayment = async (req, res) => {
    try {
        const { bookingId, paymentMethod, amount } = req.body;
        const userId = req.user._id;

        // Validate booking exists and belongs to user
        const booking = await Booking.findOne({ _id: bookingId, userId });
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Create payment record
        const payment = await Payment.create({
            userId,
            bookingId,
            amount,
            paymentMethod,
            transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
            status: 'PENDING'
        });

        // Simulate payment gateway data
        const paymentGatewayData = {
            gatewayUrl: 'https://mockgateway.com/pay',
            merchantId: 'MOCK_MERCHANT',
            transactionId: payment.transactionId,
            amount: payment.amount,
            currency: 'NPR',
            returnUrl: `${process.env.FRONTEND_URL}/payment/verify`
        };

        return res.json({
            success: true,
            data: {
                payment,
                gateway: paymentGatewayData
            },
            message: 'Payment initiated successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { transactionId, gatewayResponse, bookingId } = req.body;
        const userId = req.user._id;

        // Find payment and validate it belongs to user
        const payment = await Payment.findOne({ 
            transactionId,
            userId,
            bookingId 
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        // Here we would verify the payment with the actual payment gateway
        // For now, we'll simulate gateway verification
        const isValid = simulateGatewayVerification(gatewayResponse);
        
        if (!isValid) {
            payment.status = 'FAILED';
            await payment.save();
            
            // Update booking status to CANCELLED
            await Booking.findByIdAndUpdate(payment.bookingId, { 
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancellationReason: 'Payment verification failed'
            });

            throw new Error('Payment verification failed');
        }

        // If verification successful
        payment.status = 'COMPLETED';
        await payment.save();

        // Update booking status to CONFIRMED
        const booking = await Booking.findByIdAndUpdate(
            payment.bookingId, 
            { status: 'CONFIRMED' },
            { new: true }
        );

        // Try to send email, but don't fail if it fails
        try {
            const user = await User.findById(userId);
            if (user && user.email) {
                await sendEmail({
                    to: user.email,
                    subject: 'Booking Confirmation - Payment Successful',
                    text: `
                        Dear ${user.name},
                        
                        Your booking has been confirmed.
                        Transaction ID: ${transactionId}
                        Amount Paid: NPR ${payment.amount}
                        
                        Check-in: ${new Date(booking.checkIn).toLocaleDateString()}
                        Check-out: ${new Date(booking.checkOut).toLocaleDateString()}
                        
                        Thank you for choosing our service!
                    `
                });
            }
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
        }

        return res.json({
            success: true,
            data: payment,
            message: 'Payment verified successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Simulate payment gateway verification
const simulateGatewayVerification = (gatewayResponse) => {
    // In reality, this would make an API call to the payment gateway
    // to verify the transaction
    return gatewayResponse?.status === 'success';
};

const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const payments = await Payment.find({ userId })
            .populate({
                path: 'bookingId',
                populate: {
                    path: 'roomId',
                    select: 'name type price totalGuests' // Include fields you want to show
                }
            })
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            data: payments,
            message: 'Payment history retrieved successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    initiatePayment,
    verifyPayment,
    getPaymentHistory
};
