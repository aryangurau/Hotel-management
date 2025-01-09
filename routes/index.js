const router = require("express").Router();

const orderRouter = require("../modules/orders/order.route");
const roomRouter = require("../modules/rooms/room.route");
const userRouter = require("../modules/users/user.route");
const paymentRouter = require("../modules/payments/payment.route");
const bookingRouter = require("../modules/bookings/booking.route");

// Debug middleware for all routes
const debugMiddleware = (req, res, next) => {
    console.log('API Request:', {
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body
    });
    next();
};

router.use(debugMiddleware);

// Mount routes
router.use("/api/v1/orders", orderRouter);
router.use("/api/v1/rooms", roomRouter);
router.use("/api/v1/users", userRouter);
router.use("/api/v1/payments", paymentRouter);
router.use("/api/v1/bookings", bookingRouter);

module.exports = router;
